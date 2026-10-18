import { useCallback, useState } from 'react';
import { useAppActive } from '@/lib/use-app-active';
import { useFocusEffect } from 'expo-router';
import { LOCATION } from '@/config/limits';
import type { Coordinate } from './geo';
import { manageSubscription } from './lifecycle';
import { locationFailure, LocationTimeoutError, type LocationErrorCode } from './errors';
import { getCurrentCoordinates, isLocationEnabled, requestLocationPermission, subscribeToHeading, subscribeToLocation, type Heading } from './service';

type DeviceState = {
  status: 'loading' | 'ready' | 'denied' | 'disabled' | 'error';
  watcherStatus: 'pending' | 'ready' | 'error';
  errorCode: LocationErrorCode | null;
  position: Coordinate | null; accuracy: number | null; heading: Heading | null;
  headingStatus: 'pending' | 'ready' | 'unavailable'; canAskAgain: boolean; error: string | null;
};
const initial: DeviceState = { status: 'loading', watcherStatus: 'pending', errorCode: null, position: null, accuracy: null, heading: null, headingStatus: 'pending', canAskAgain: true, error: null };

export function useDeviceLocation({ heading: needsHeading = false } = {}) {
  const [state, setState] = useState<DeviceState>(initial);
  const [attempt, setAttempt] = useState(0);
  const active = useAppActive();
  useFocusEffect(useCallback(() => {
    if (!active) return;
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
      patch(initial);
      // Bound all startup stages, not just the final GPS request. Expire this owner so
      // late native results cannot start new watchers or overwrite a subsequent retry.
      startupTimer = setTimeout(() => {
        patch({ status: 'error', heading: null, headingStatus: 'unavailable', ...locationFailure(new LocationTimeoutError()) });
        stop();
      }, LOCATION.timeoutMs);
      const permission = await requestLocationPermission();
      if (disposed) return;
      if (!permission.granted) { clearTimeout(startupTimer); patch({ status: 'denied', canAskAgain: permission.canAskAgain }); return; }
      if (!await isLocationEnabled()) { clearTimeout(startupTimer); patch({ status: 'disabled' }); return; }
      if (disposed) return;
      const receive = (position: Awaited<ReturnType<typeof getCurrentCoordinates>>, fromWatcher = false) => {
        if (disposed) return;
        clearTimeout(startupTimer);
        setState((previous) => {
          // A one-shot fix provides coordinates, but cannot establish watcher health.
          const watcherStatus = fromWatcher ? 'ready' : previous.watcherStatus;
          return { ...previous, watcherStatus, status: watcherStatus === 'error' ? 'error' : 'ready',
            position: { latitude: position.coords.latitude, longitude: position.coords.longitude },
            accuracy: position.coords.accuracy, error: watcherStatus === 'error' ? previous.error : null,
            errorCode: watcherStatus === 'error' ? previous.errorCode : null };
        });
      };
      const watcherFailed = (error: unknown) => {
        clearTimeout(startupTimer);
        patch({ watcherStatus: 'error', status: 'error', ...locationFailure(error, 'updates-unavailable') });
      };
      stops.push(manageSubscription(() => subscribeToLocation((position) => receive(position, true), watcherFailed),
        watcherFailed));
      if (needsHeading) {
        headingTimer = setTimeout(() => patch({ headingStatus: 'unavailable', heading: null }), 10000);
        stops.push(manageSubscription(() => subscribeToHeading((heading) => {
          clearTimeout(headingTimer); patch({ heading, headingStatus: heading ? 'ready' : 'unavailable' });
        }, () => patch({ headingStatus: 'unavailable', heading: null })), () => patch({ headingStatus: 'unavailable', heading: null })));
      }
      try { receive(await getCurrentCoordinates()); }
      catch (error) { clearTimeout(startupTimer); if (!disposed) setState((previous) => previous.position || previous.watcherStatus === 'error' ? previous : { ...previous, status: 'error', ...locationFailure(error) }); }
    }
    void start().catch((error: unknown) => { clearTimeout(startupTimer); patch({ status: 'error', ...locationFailure(error) }); });
    return stop;
    // Retry must replace the focused callback to restart native permission and sensor setup.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, attempt, needsHeading]));
  return { ...state, retry: () => setAttempt((value) => value + 1) };
}
