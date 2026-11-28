import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { AR, ARRIVAL } from '@/config/limits';
import { useDeviceLocation } from '@/features/location/use-device-location';
import { placesService, type NearbySearch } from '@/features/places/service';
import { layoutNearbyCards, nearbySearchOrigin, NearbyScan } from './nearby-mode';

export function useNearbyMode(running: boolean, requestAllowed: boolean, language: NonNullable<NearbySearch['language']>) {
  const location = useDeviceLocation({ enabled: running, requestOnStart: false, distanceIntervalMeters: 0 });
  const [scan] = useState(() => new NearbyScan(placesService.nearby));
  const state = useSyncExternalStore(scan.subscribe, scan.getSnapshot, scan.getSnapshot);
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
    const result = state.result;
    if (!result) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    function checkExpiry() {
      if (!result || scan.getSnapshot().result !== result) return;
      const remaining = scan.remaining(result);
      if (remaining === 0) scan.expire();
      else timer = setTimeout(checkExpiry, Math.ceil(remaining));
    }
    checkExpiry();
    return () => clearTimeout(timer);
  }, [running, scan, state.result]);

  // A location fix can become usable or expire without another watcher event.
  // The snapshot remains the same coordinate (or null) between those boundaries.
  const candidate = running && sample && sample.timestamp >= epochAt &&
    nearbySearchOrigin(sample, location.watcherStatus, sample.timestamp) ? sample : null;
  const getPosition = useCallback(() => nearbySearchOrigin(candidate, 'ready', Date.now()), [candidate]);
  const subscribePosition = useCallback((notify: () => void) => {
    if (!candidate) return () => {};
    const validFrom = candidate.timestamp - ARRIVAL.futureToleranceMs;
    const expiresAfter = candidate.timestamp + AR.positionMaxAgeMs;
    let timer: ReturnType<typeof setTimeout>;
    let wasFresh = getPosition() !== null;
    function checkFreshness() {
      const now = Date.now();
      const isFresh = now >= validFrom && now <= expiresAfter;
      if (isFresh !== wasFresh) {
        wasFresh = isFresh;
        notify();
      }
      if (now < validFrom) timer = setTimeout(checkFreshness, Math.min(2147483647, validFrom - now));
      else if (isFresh) timer = setTimeout(checkFreshness, expiresAfter - now + 1);
    }
    checkFreshness();
    return () => clearTimeout(timer);
  }, [candidate, getPosition]);
  const position = useSyncExternalStore(subscribePosition, getPosition, getPosition);
  const fix = position ? sample : null;
  const result = state.result?.language === language && scan.remaining(state.result) > 0 ? state.result : null;
  const cards = useMemo(() => result && position ? layoutNearbyCards(result.places, position) : [], [result, position]);
  const search = useCallback(() => {
    if (latest.current !== scope || !scope.running) return;
    const current = evidence.current;
    if (!current.sample || current.sample.timestamp < current.epochAt) return;
    const origin = nearbySearchOrigin(current.sample, current.status, Date.now());
    if (origin) void scan.scan({ location: origin, language: scope.language });
  }, [scan, scope]);

  const isResultCurrent = (value: NonNullable<typeof result>) =>
    scan.getSnapshot().result === value && scan.remaining(value) > 0;
  return { location, position, fix, state, result, cards, search, isResultCurrent };
}

export type NearbyMode = ReturnType<typeof useNearbyMode>;
