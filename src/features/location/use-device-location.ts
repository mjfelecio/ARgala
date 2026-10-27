import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppActive } from '@/lib/use-app-active';
import { useIsFocused } from 'expo-router';
import { LOCATION } from '@/config/limits';
import type { Coordinate } from './geo';
import { manageSubscription } from './lifecycle';
import { locationFailure, LocationTimeoutError, type LocationErrorCode } from './errors';
import { getCurrentCoordinates, isLocationEnabled, requestLocationPermission, subscribeToHeading, subscribeToLocation, type Heading } from './service';

type DeviceState = {
  phase: 'waiting' | 'permission' | 'services' | 'position';
  status: 'loading' | 'ready' | 'denied' | 'disabled' | 'error';
  watcherStatus: 'pending' | 'ready' | 'error';
  errorCode: LocationErrorCode | null;
  position: Coordinate | null; accuracy: number | null; heading: Heading | null;
  /** Exact continuous sample: a later one-shot fix must never replace its geometry/accuracy. */
  watcherSample: Readonly<{ position: Coordinate; accuracy: number | null; timestamp: number }> | null;
  positionTimestamp: number | null; watcherTimestamp: number | null; headingTimestamp: number | null;
  /** JS receipt clock for rendering; never substitutes for native sample freshness. */
  sampleReceivedAt: number | null;
  headingStatus: 'pending' | 'ready' | 'unavailable'; canAskAgain: boolean; error: string | null;
};
const initial: DeviceState = { watcherSample: null, phase: 'waiting', status: 'loading', watcherStatus: 'pending', errorCode: null, position: null, accuracy: null, heading: null, positionTimestamp: null, watcherTimestamp: null, headingTimestamp: null, sampleReceivedAt: null, headingStatus: 'pending', canAskAgain: true, error: null };

export function useDeviceLocation({ enabled = true, heading: needsHeading = false, distanceIntervalMeters = LOCATION.distanceIntervalMeters }: { enabled?: boolean; heading?: boolean; distanceIntervalMeters?: number } = {}) {
  const [state, setState] = useState<DeviceState>(initial);
  const [attempt, setAttempt] = useState(0);
  const promptedAttempt = useRef<number | null>(null);
  const active = useAppActive();
  const focused = useIsFocused();
  useEffect(() => {
    if (!enabled || !active || !focused) return;
    let disposed = false;
    const stops: (() => void)[] = [];
    let headingTimer: ReturnType<typeof setTimeout> | undefined;
    let startupTimer: ReturnType<typeof setTimeout> | undefined;
    const patch = (value: Partial<DeviceState>) => { if (!disposed) setState((previous) => ({ ...previous, ...value })); };
    const stop = () => {
      disposed = true; clearTimeout(startupTimer); clearTimeout(headingTimer);
      stops.forEach((unsubscribe) => unsubscribe());
    };
    async function start() {
      patch({ ...initial, phase: 'permission' });
      // Bound all startup stages, not just the final GPS request. Expire this owner so
      // late native results cannot start new watchers or overwrite a subsequent retry.
      startupTimer = setTimeout(() => {
        patch({ status: 'error', heading: null, headingStatus: 'unavailable', ...locationFailure(new LocationTimeoutError()) });
        stop();
      }, LOCATION.timeoutMs);
      // A permission activity can replace this foreground owner before it resolves.
      // Only the initial attempt or an explicit Retry may prompt; resume just checks.
      const prompt = promptedAttempt.current === attempt ? 'never' : attempt === 0 ? 'initial' : 'retry';
      promptedAttempt.current = attempt;
      const permission = await requestLocationPermission({ prompt });
      if (disposed) return;
      if (!permission.granted) { clearTimeout(startupTimer); patch({ status: 'denied', canAskAgain: permission.canAskAgain }); return; }
      patch({ phase: 'services' });
      if (!await isLocationEnabled()) { clearTimeout(startupTimer); patch({ status: 'disabled' }); return; }
      if (disposed) return;
      patch({ phase: 'position' });
      const receive = (position: Awaited<ReturnType<typeof getCurrentCoordinates>>, fromWatcher = false) => {
        if (disposed) return;
        clearTimeout(startupTimer);
        const sampleReceivedAt = Date.now();
        setState((previous) => {
          // A one-shot fix provides coordinates, but cannot establish watcher health.
          const watcherStatus = fromWatcher ? 'ready' : previous.watcherStatus;
          return { ...previous, watcherStatus, status: watcherStatus === 'error' ? 'error' : 'ready',
            position: { latitude: position.coords.latitude, longitude: position.coords.longitude },
            accuracy: position.coords.accuracy, positionTimestamp: position.timestamp, sampleReceivedAt,
            watcherSample: fromWatcher ? Object.freeze({ position: Object.freeze({ latitude: position.coords.latitude, longitude: position.coords.longitude }), accuracy: position.coords.accuracy, timestamp: position.timestamp }) : previous.watcherSample,
            watcherTimestamp: fromWatcher ? position.timestamp : previous.watcherTimestamp, error: watcherStatus === 'error' ? previous.error : null,
            errorCode: watcherStatus === 'error' ? previous.errorCode : null };
        });
      };
      const watcherFailed = (error: unknown) => {
        clearTimeout(startupTimer);
        patch({ watcherStatus: 'error', status: 'error', ...locationFailure(error, 'updates-unavailable') });
      };
      stops.push(manageSubscription(() => subscribeToLocation((position) => receive(position, true), watcherFailed, distanceIntervalMeters),
        watcherFailed));
      if (needsHeading) {
        headingTimer = setTimeout(() => patch({ headingStatus: 'unavailable', heading: null }), 10000);
        stops.push(manageSubscription(() => subscribeToHeading((heading) => {
          const sampleReceivedAt = Date.now();
          clearTimeout(headingTimer); patch({ heading, sampleReceivedAt, headingTimestamp: heading ? sampleReceivedAt : null, headingStatus: heading ? 'ready' : 'unavailable' });
        }, () => patch({ headingStatus: 'unavailable', heading: null })), () => patch({ headingStatus: 'unavailable', heading: null })));
      }
      try { receive(await getCurrentCoordinates()); }
      catch (error) { clearTimeout(startupTimer); if (!disposed) setState((previous) => previous.position || previous.watcherStatus === 'error' ? previous : { ...previous, status: 'error', ...locationFailure(error) }); }
    }
    void start().catch((error: unknown) => { clearTimeout(startupTimer); patch({ status: 'error', ...locationFailure(error) }); });
    return stop;
  }, [enabled, active, focused, attempt, needsHeading, distanceIntervalMeters]);
  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  return { ...state, retry };
}
