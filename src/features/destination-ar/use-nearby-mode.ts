import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useDeviceLocation } from '@/features/location/use-device-location';
import { placesService, type NearbySearch } from '@/features/places/service';
import { layoutNearbyCards, nearbySearchOrigin, NearbyScan } from './nearby-mode';

export function useNearbyMode(running: boolean, requestAllowed: boolean, language: NonNullable<NearbySearch['language']>, preferredId: string | null) {
  const location = useDeviceLocation({ enabled: running, requestOnStart: false, distanceIntervalMeters: 0 });
  const [scan] = useState(() => new NearbyScan(placesService.nearby));
  const state = useSyncExternalStore(scan.subscribe, scan.getSnapshot, scan.getSnapshot);
  const [now, setNow] = useState(Date.now);
  const sample = location.watcherSample ?? null;
  // A prior owner's rendered fix is still in the hook on the first commit of a new owner.
  // Wait for a sample from this focus/mode epoch before using it again.
  const watchScope = useMemo(() => ({ running }), [running]);
  const [epoch, setEpoch] = useState<{ owner: typeof watchScope; startedAt: number } | null>(null);
  const epochAt = epoch?.owner === watchScope ? epoch.startedAt : Infinity;
  const scope = useMemo(() => ({ running: running && requestAllowed, language }), [running, requestAllowed, language]);
  const latest = useRef<typeof scope | null>(null);
  const evidence = useRef({ epochAt, sample, status: location.watcherStatus });
  useLayoutEffect(() => {
    evidence.current = { epochAt, sample, status: location.watcherStatus };
  }, [epochAt, sample, location.watcherStatus]);
  useLayoutEffect(() => {
    if (!watchScope.running) return;
    let current = true;
    const startedAt = Date.now();
    void Promise.resolve().then(() => { if (current) setEpoch({ owner: watchScope, startedAt }); });
    return () => { current = false; scan.retire(); };
  }, [watchScope, scan]);
  useLayoutEffect(() => {
    latest.current = scope;
    return () => { latest.current = null; };
  }, [scope]);
  useLayoutEffect(() => { if (!requestAllowed) scan.retire(); }, [requestAllowed, scan]);
  useLayoutEffect(() => { scan.retire(true); }, [language, scan]);
  useEffect(() => {
    if (!running) return;
    const tick = () => { setNow(Date.now()); scan.expire(); };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [running, scan]);
  useEffect(() => {
    if (!state.result) return;
    const timer = setTimeout(() => scan.expire(), Math.max(1, Math.ceil(scan.remaining(state.result))));
    return () => clearTimeout(timer);
  }, [scan, state.result]);

  const position = running && sample && sample.timestamp >= epochAt ? nearbySearchOrigin(sample, location.watcherStatus, now) : null;
  const fix = position ? sample : null;
  const result = state.result?.language === language && scan.remaining(state.result) > 0 ? state.result : null;
  const cards = useMemo(() => result && position ? layoutNearbyCards(result.places, position, preferredId) : [], [result, position, preferredId]);
  const search = useCallback(() => {
    if (latest.current !== scope || !scope.running) return;
    const current = evidence.current;
    if (!current.sample || current.sample.timestamp < current.epochAt) return;
    const origin = nearbySearchOrigin(current.sample, current.status, Date.now());
    if (origin) void scan.scan({ location: origin, language: scope.language });
  }, [scan, scope]);

  return { location, position, fix, state, result, cards, search };
}

export type NearbyMode = ReturnType<typeof useNearbyMode>;
