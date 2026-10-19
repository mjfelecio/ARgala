import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useIsFocused } from 'expo-router';
import { AR } from '@/config/limits';
import { useDeviceLocation } from '@/features/location/use-device-location';
import { isCoordinate, type Coordinate } from '@/features/location/geo';
import { useSettings } from '@/features/settings/provider';
import { useAppActive } from '@/lib/use-app-active';
import { EdgeRequestError, edgeErrorMessageKey } from '@/lib/edge-error';
import { claimRoutePreviewIntent, createRoutePreviewIntent, routePreviewLifetimeMs, type RoutePreviewIntent, type RoutePreviewResult } from './route-preview-intent';
import { decodePolyline } from './polyline';
import { routeService } from './service';

type Result = RoutePreviewResult & { coordinates: Coordinate[] };
type Session = { owner: symbol; attempt: string; intent: RoutePreviewIntent; status: 'waiting' | 'pending' | 'success' | 'failed'; result?: Result; errorKey?: string };
function validated(result: RoutePreviewResult): Result {
  const coordinates = decodePolyline(result.route.encodedPolyline);
  if (coordinates.length < 2) throw new EdgeRequestError('UPSTREAM_INVALID');
  return { ...result, coordinates };
}

/** A disabled observer can display a prior result; only this owner's claim can spend quota. */
export function useRoutePreview(token: unknown, configured: boolean) {
  const client = useQueryClient(); const { language } = useSettings();
  const active = useAppActive(); const focused = useIsFocused();
  const running = active && focused;
  const location = useDeviceLocation();
  const [ownership, setOwnership] = useState(() => ({ running, since: Date.now() }));
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    let alive = true;
    const since = Date.now();
    void Promise.resolve().then(() => { if (alive) setOwnership({ running, since }); });
    return () => { alive = false; };
  }, [running]);
  useEffect(() => {
    if (!running) return;
    let alive = true;
    void Promise.resolve().then(() => { if (alive) setNow(Date.now()); });
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => { alive = false; clearInterval(timer); };
  }, [running, location.positionTimestamp, location.watcherTimestamp]);
  const key = useMemo(() => ['route-preview-session', typeof token === 'string' ? token : null] as const, [token]);
  const session = useQuery<Session | null>({ queryKey: key, queryFn: async () => null, enabled: false, gcTime: routePreviewLifetimeMs });
  const attemptedClaim = useRef(false);
  const authorized = useRef(false);
  const [owner] = useState(Symbol);
  useEffect(() => {
    if (attemptedClaim.current) return;
    attemptedClaim.current = true;
    const intent = claimRoutePreviewIntent(client, token);
    if (!intent) return;
    let initial: Session = { owner, attempt: String(token), intent, status: 'waiting' };
    if (intent.existing) {
      try { initial = { owner, attempt: String(token), intent, status: 'success', result: validated(intent.existing) }; }
      catch { initial = { owner, attempt: String(token), intent, status: 'failed', errorKey: 'service.unavailable' }; }
    } else { authorized.current = true; }
    client.setQueryData(key, initial);
  }, [client, token, key, owner]);
  // Check both the latest fix and the continuous watcher's sample/health. A new
  // foreground owner must receive its own sample, not a retained pre-resume fix.
  const timestamp = now;
  const fresh = (time: number | null) => time !== null && Number.isFinite(time) && time >= ownership.since && time <= timestamp + 1000 && timestamp - time <= AR.positionMaxAgeMs;
  const usable = running && ownership.running === running && location.status === 'ready' && location.watcherStatus === 'ready' && isCoordinate(location.position) &&
    fresh(location.positionTimestamp) && fresh(location.watcherTimestamp) && location.accuracy !== null &&
    Number.isFinite(location.accuracy) && location.accuracy >= 0 && location.accuracy <= AR.maxPositionAccuracyMeters;
  const data = session.data;
  const expired = !!data && timestamp - data.intent.createdAt >= routePreviewLifetimeMs;
  useEffect(() => {
    if (!configured || !usable || !data || data.status !== 'waiting' || !authorized.current || expired) return;
    // Cache presence is also a revocable lease. Auth clear can retire the session
    // between a rendered GPS update and this effect (or while the request runs).
    if (client.getQueryData(key) !== data || Date.now() - data.intent.createdAt >= routePreviewLifetimeMs) return;
    authorized.current = false;
    const origin = { ...location.position! };
    const pending: Session = { owner, attempt: data.attempt, intent: data.intent, status: 'pending' };
    client.setQueryData(key, pending);
    const finish = (next: Session) => {
      const current = client.getQueryData<Session>(key);
      if (current?.status === 'pending' && current.attempt === pending.attempt) client.setQueryData(key, next);
    };
    void routeService.walking({ origin, destination: data.intent.place.coordinates, language }).then(route => {
      let result: Result;
      try { result = validated({ origin, route }); }
      catch { throw new EdgeRequestError('UPSTREAM_INVALID'); }
      finish({ owner, attempt: data.attempt, intent: data.intent, status: 'success', result });
    }).catch((error: unknown) => finish({ owner, attempt: data.attempt, intent: data.intent, status: 'failed', errorKey: edgeErrorMessageKey(error) }));
  }, [client, key, data, configured, usable, expired, location.position, language, owner]);
  function retry() {
    const current = client.getQueryData<Session>(key);
    if (!running || !configured || !current || current.status === 'pending' || current.status === 'success' || (current.status === 'waiting' && authorized.current && !expired)) return;
    const nextToken = createRoutePreviewIntent(client, current.intent.place);
    const next = claimRoutePreviewIntent(client, nextToken);
    if (!next) return;
    authorized.current = true;
    client.setQueryData<Session>(key, { owner, attempt: nextToken, intent: next, status: 'waiting' });
  }
  return { data, location, usable, running, expired, result: data?.result,
    needsRetry: data?.status === 'failed' || (data?.status === 'waiting' && (data.owner !== owner || expired)), retry };
}
