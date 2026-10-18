import * as ExpoLocation from 'expo-location';
import { LOCATION } from '@/config/limits';
import { isCoordinate, normalizeHeading } from './geo';
import { LocationError } from './errors';

export type Heading = { degrees: number; reference: 'true' | 'magnetic'; accuracy: number };
type PermissionPrompt = 'never' | 'initial' | 'retry';
type PermissionOperation = { intent: { prompt: PermissionPrompt }; promise: Promise<ExpoLocation.LocationPermissionResponse> };
let pendingPermission: PermissionOperation | null = null;
export function requestLocationPermission({ prompt = 'initial' }: { prompt?: PermissionPrompt } = {}) {
  // Android permission activities can pause/resume the app even for existing grants.
  // Replacement foreground owners must join the native operation, not queue another.
  if (pendingPermission) {
    // Retry may arrive while a check-only read is pending. Preserve that intent.
    if (prompt === 'retry' || pendingPermission.intent.prompt === 'never') pendingPermission.intent.prompt = prompt;
    return pendingPermission.promise;
  }
  const intent = { prompt };
  pendingPermission = {
    intent,
    promise: (async () => {
      const permission = await ExpoLocation.getForegroundPermissionsAsync();
      if (permission.granted || !permission.canAskAgain || intent.prompt === 'never' ||
          (permission.status === 'denied' && intent.prompt !== 'retry')) return permission;
      return ExpoLocation.requestForegroundPermissionsAsync();
    })().finally(() => { pendingPermission = null; }),
  };
  return pendingPermission.promise;
}
export const isLocationEnabled = () => ExpoLocation.hasServicesEnabledAsync();
export async function getCurrentCoordinates() {
  // The focused owner bounds the entire startup, including permissions and service checks.
  const position = await ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.High });
  if (!isCoordinate(position.coords)) throw new LocationError('invalid-position', 'The device returned invalid coordinates.');
  return position;
}
export function subscribeToLocation(onPosition: (position: ExpoLocation.LocationObject) => void, onError: (error: LocationError) => void, distanceIntervalMeters: number = LOCATION.distanceIntervalMeters) {
  return ExpoLocation.watchPositionAsync({ accuracy: ExpoLocation.Accuracy.High, distanceInterval: distanceIntervalMeters, timeInterval: LOCATION.timeIntervalMs },
    (position) => { if (isCoordinate(position.coords)) onPosition(position); else onError(new LocationError('invalid-position', 'The device returned invalid coordinates.')); },
    (message) => onError(new LocationError('updates-unavailable', message)));
}
export function subscribeToHeading(onHeading: (heading: Heading | null) => void, onError: (message: string) => void) {
  return ExpoLocation.watchHeadingAsync((reading) => {
    const valid = (value: number) => Number.isFinite(value) && value >= 0 && value <= 360;
    if (reading.accuracy <= 0) { onHeading(null); return; }
    if (valid(reading.trueHeading)) onHeading({ degrees: normalizeHeading(reading.trueHeading), reference: 'true', accuracy: reading.accuracy });
    else if (valid(reading.magHeading)) onHeading({ degrees: normalizeHeading(reading.magHeading), reference: 'magnetic', accuracy: reading.accuracy });
    else onHeading(null);
  }, onError);
}
