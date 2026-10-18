import { useEffect, useRef, useState } from 'react';
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
  positionTimestamp: number | null; watcherTimestamp: number | null; headingTimestamp: number | null;
  headingStatus: 'pending' | 'ready' | 'unavailable'; canAskAgain: boolean; error: string | null;
};
const initial: DeviceState = { phase: 'waiting', status: 'loading', watcherStatus: 'pending', errorCode: null, position: null, accuracy: null, heading: null, positionTimestamp: null, watcherTimestamp: null, headingTimestamp: null, headingStatus: 'pending', canAskAgain: true, error: null };

export function useDeviceLocation({ heading: needsHeading = false, distanceIntervalMeters = LOCATION.distanceIntervalMeters }: { heading?: boolean; distanceIntervalMeters?: number } = {}) {
  const [state, setState] = useState<DeviceState>(initial);
  const [attempt, setAttempt] = useState(0);
  const promptedAttempt = useRef<number | null>(null);
  const active = useAppActive();
  const focused = useIsFocused();
  useEffect(() => {
    if (typeof __DEV__ !== 'undefined' && __DEV__) console.info('[ARgala sensor startup v3]', {
      active, focused, phase: state.phase, status: state.status, watcherStatus: state.watcherStatus, errorCode: state.errorCode,
    });
  }, [active, focused, state.phase, state.status, state.watcherStatus, state.errorCode]);
  useEffect(() => {
    if (!active || !focused) return;
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
        setState((previous) => {
          // A one-shot fix provides coordinates, but cannot establish watcher health.
          const watcherStatus = fromWatcher ? 'ready' : previous.watcherStatus;
          return { ...previous, watcherStatus, status: watcherStatus === 'error' ? 'error' : 'ready',
            position: { latitude: position.coords.latitude, longitude: position.coords.longitude },
            accuracy: position.coords.accuracy, positionTimestamp: position.timestamp,
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
          clearTimeout(headingTimer); patch({ heading, headingTimestamp: heading ? Date.now() : null, headingStatus: heading ? 'ready' : 'unavailable' });
        }, () => patch({ headingStatus: 'unavailable', heading: null })), () => patch({ headingStatus: 'unavailable', heading: null })));
      }
      try { receive(await getCurrentCoordinates()); }
      catch (error) { clearTimeout(startupTimer); if (!disposed) setState((previous) => previous.position || previous.watcherStatus === 'error' ? previous : { ...previous, status: 'error', ...locationFailure(error) }); }
    }
    void start().catch((error: unknown) => { clearTimeout(startupTimer); patch({ status: 'error', ...locationFailure(error) }); });
    return stop;
  }, [active, focused, attempt, needsHeading, distanceIntervalMeters]);
  return { ...state, retry: () => setAttempt((value) => value + 1),
    debug: { sensorDebug: 3, active, focused, phase: state.phase, status: state.status, watcherStatus: state.watcherStatus, errorCode: state.errorCode } };
}
