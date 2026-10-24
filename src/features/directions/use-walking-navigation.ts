import { useEffect, useMemo, useState } from 'react';
import type { Coordinate } from '@/features/location/geo';
import { advanceWalkingProgress, createWalkingProgress, prepareWalkingRoute, remainingWalkingCoordinates, usableWalkingSample, type WalkingProgress, type WalkingRouteGeometry } from './walking-progress';

type Location = { position: Coordinate | null; accuracy: number | null; positionTimestamp: number | null; watcherTimestamp: number | null; watcherStatus: string };
type Options = { coordinates: Coordinate[]; destination?: Coordinate; location: Location; usable: boolean; running: boolean; now: number };
type Session = { route: WalkingRouteGeometry; progress: WalkingProgress };

/** Consume the preview's existing foreground location owner and expiry clock. No new watcher or request authority. */
export function useWalkingNavigation({ coordinates, destination, location, usable, running, now }: Options) {
  const route = useMemo(() => prepareWalkingRoute(coordinates, destination), [coordinates, destination]);
  const [session, setSession] = useState<Session | null>(null);
  const started = !!route && session?.route === route;
  const { position, accuracy, positionTimestamp, watcherTimestamp, watcherStatus } = location;
  const sample = useMemo(() => ({ position, accuracy, timestamp: positionTimestamp, watcherTimestamp,
    ready: running && usable && watcherStatus === 'ready' }), [position, accuracy, positionTimestamp, watcherTimestamp, watcherStatus, running, usable]);
  const qualified = usableWalkingSample(sample, now);
  useEffect(() => {
    let alive = true;
    // Retire route/auth changes without exposing even one render of old progress.
    void Promise.resolve().then(() => {
      if (!alive) return;
      setSession(previous => {
        if (!previous) return previous;
        if (previous.route !== route) return null;
        const progress = advanceWalkingProgress(route!, previous.progress, sample, now);
        return progress === previous.progress ? previous : { ...previous, progress };
      });
    });
    return () => { alive = false; };
  }, [route, sample, now, started]);
  const progress = started ? session!.progress : null;
  const progressMeters = progress?.progressMeters ?? 0;
  const arrived = progress?.status === 'arrived';
  const remainingCoordinates = useMemo(() => started && route ? remainingWalkingCoordinates(route, { progressMeters, status: arrived ? 'arrived' : 'navigating' }) : coordinates,
    [route, coordinates, started, progressMeters, arrived]);
  const canStart = !started && !!route && qualified;
  function start() {
    // A retained button callback cannot spend stale location authority.
    if (!canStart || !route || !usableWalkingSample(sample, Date.now())) return;
    setSession(previous => previous?.route === route ? previous : { route, progress: advanceWalkingProgress(route, createWalkingProgress(), sample, Date.now()) });
  }
  function stop() { setSession(null); }
  const status = !progress ? 'preview' : progress.status === 'arrived' ? 'arrived' : !qualified ? 'uncertain' : progress.status;
  return { started, status, canStart, remainingCoordinates, remainingMeters: !route ? 0 : progress?.status === 'arrived' ? 0 : Math.max(0, route.totalMeters - (progress?.progressMeters ?? 0)), start, stop } as const;
}
