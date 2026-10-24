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
type Session = { language?: RoutePreviewIntent['language']; owner: symbol; attempt: string; intent: RoutePreviewIntent; status: 'waiting' | 'pending' | 'success' | 'failed'; result?: Result; errorKey?: string };
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
  const [now, setNow] = useState(Date.now);
  const key = useMemo(() => ['route-preview-session', typeof token === 'string' ? token : null] as const, [token]);
  const session = useQuery<Session | null>({ queryKey: key, queryFn: async () => null, enabled: false, gcTime: routePreviewLifetimeMs });
  const attemptedClaim = useRef(false);
  const authorized = useRef(false);
  const [owner] = useState(Symbol);
  const data = session.data;
  const clockExpired = !!data && now - data.intent.createdAt >= routePreviewLifetimeMs;
  // A dead link cannot authorize even permission checks or a native GPS owner.
  // Completed previews still use location for the live marker/Recenter; waiting
  // sessions need this screen's unexpired claim, or an explicit retry first.
  const sensorsEnabled = configured && !!data && (data.status === 'success' || data.status === 'pending' ||
    (data.status === 'waiting' && data.owner === owner && !clockExpired));
  const location = useDeviceLocation({ enabled: sensorsEnabled });
  const sampleNow = Math.max(now, location.sampleReceivedAt ?? now);
  const expired = !!data && sampleNow - data.intent.createdAt >= routePreviewLifetimeMs;
  // A sample can retire presentation/authority before the next one-second
  // clock tick retires the waiting session's native subscription.
  const locationEnabled = sensorsEnabled && (data?.status !== 'waiting' || !expired);
  const tracking = running && locationEnabled;
  const [ownership, setOwnership] = useState(() => ({ running: tracking, since: Date.now() }));
  useEffect(() => {
    let alive = true;
    const since = Date.now();
    void Promise.resolve().then(() => { if (alive) setOwnership({ running: tracking, since }); });
    return () => { alive = false; };
  }, [tracking]);
  useEffect(() => {
    if (!running) return;
    let alive = true;
    void Promise.resolve().then(() => { if (alive) setNow(Date.now()); });
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => { alive = false; clearInterval(timer); };
  }, [running]);
  useEffect(() => {
    if (attemptedClaim.current) return;
    attemptedClaim.current = true;
    const intent = claimRoutePreviewIntent(client, token);
    if (!intent) return;
    let initial: Session = { owner, attempt: String(token), intent, status: 'waiting' };
    if (intent.existing) {
      try { initial = { owner, attempt: String(token), intent, status: 'success', language: intent.language, result: validated(intent.existing) }; }
      catch { initial = { owner, attempt: String(token), intent, status: 'failed', errorKey: 'service.unavailable' }; }
    } else { authorized.current = true; }
    client.setQueryData(key, initial);
  }, [client, token, key, owner]);
  // Check both the latest fix and the continuous watcher's sample/health. A new
  // foreground owner must receive its own sample, not a retained pre-resume fix.
  const fresh = (time: number | null) => time !== null && Number.isFinite(time) && time >= ownership.since && time <= sampleNow + 1000 && sampleNow - time <= AR.positionMaxAgeMs;
  const usable = tracking && ownership.running === tracking && location.status === 'ready' && location.watcherStatus === 'ready' && isCoordinate(location.position) &&
    fresh(location.positionTimestamp) && fresh(location.watcherTimestamp) && location.accuracy !== null &&
    Number.isFinite(location.accuracy) && location.accuracy >= 0 && location.accuracy <= AR.maxPositionAccuracyMeters;
  useEffect(() => {
    if (!configured || !usable || !data || data.status !== 'waiting' || data.owner !== owner || !authorized.current || expired) return;
    // Cache presence is also a revocable lease. Auth clear can retire the session
    // between a rendered GPS update and this effect (or while the request runs).
    const requestTime = Date.now();
    const requestFresh = (time: number | null) => time !== null && time <= requestTime + 1000 && requestTime - time <= AR.positionMaxAgeMs;
    if (client.getQueryData(key) !== data || requestTime - data.intent.createdAt >= routePreviewLifetimeMs ||
      !requestFresh(location.positionTimestamp) || !requestFresh(location.watcherTimestamp)) return;
    authorized.current = false;
    const origin = { ...location.position! };
    const pending: Session = { owner, attempt: data.attempt, intent: data.intent, status: 'pending', language };
    client.setQueryData(key, pending);
    const finish = (next: Session) => {
      const current = client.getQueryData<Session>(key);
      if (current?.status === 'pending' && current.attempt === pending.attempt) client.setQueryData(key, next);
    };
    const acquire = async () => routeService.walking({ origin, destination: data.intent.place.coordinates, language });
    void acquire().then(route => {
      let result: Result;
      try { result = validated({ origin, destination: data.intent.place.coordinates, route }); }
      catch { throw new EdgeRequestError('UPSTREAM_INVALID'); }
      finish({ owner, attempt: data.attempt, intent: data.intent, status: 'success', language, result });
    }).catch((error: unknown) => finish({ owner, attempt: data.attempt, intent: data.intent, status: 'failed', errorKey: edgeErrorMessageKey(error) }));
  }, [client, key, data, configured, usable, expired, location.position, location.positionTimestamp, location.watcherTimestamp, language, owner]);
  function retry() {
    const current = client.getQueryData<Session>(key);
    if (!running || !configured || !current || current.status === 'pending' || current.status === 'success' || (current.status === 'waiting' && current.owner === owner && authorized.current && !expired)) return;
    const nextToken = createRoutePreviewIntent(client, current.intent.place, undefined, current.intent.source, language);
    const next = claimRoutePreviewIntent(client, nextToken);
    if (!next) return;
    if (next.existing) {
      try {
        authorized.current = false;
        client.setQueryData<Session>(key, { owner, attempt: nextToken, intent: next, status: 'success', language: next.language, result: validated(next.existing) });
        return;
      } catch { /* An invalid saved snapshot cannot authorize a provider request. */
        authorized.current = false;
        client.setQueryData<Session>(key, { owner, attempt: nextToken, intent: next, status: 'failed', errorKey: 'service.unavailable' });
        return;
      }
    }
    authorized.current = true;
    client.setQueryData<Session>(key, { owner, attempt: nextToken, intent: next, status: 'waiting' });
  }
  return { data, location, locationEnabled, usable, running, expired, now: sampleNow, result: data?.result,
    needsRetry: data?.status === 'failed' || (data?.status === 'waiting' && (data.owner !== owner || expired)), retry };
}
