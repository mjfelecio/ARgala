import * as ExpoLocation from 'expo-location';
import { LOCATION } from '@/config/limits';
import { isCoordinate, normalizeHeading } from './geo';
import { LocationError, LocationTimeoutError } from './errors';

export type Heading = { degrees: number; reference: 'true' | 'magnetic'; accuracy: number };
export const requestLocationPermission = () => ExpoLocation.requestForegroundPermissionsAsync();
export const isLocationEnabled = () => ExpoLocation.hasServicesEnabledAsync();
export async function getCurrentCoordinates() {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const position = await Promise.race([
      ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.High }),
      new Promise<never>((_resolve, reject) => { timer = setTimeout(() => reject(new LocationTimeoutError()), LOCATION.timeoutMs); }),
    ]);
    if (!isCoordinate(position.coords)) throw new LocationError('invalid-position', 'The device returned invalid coordinates.');
    return position;
  } finally { clearTimeout(timer); }
}
export function subscribeToLocation(onPosition: (position: ExpoLocation.LocationObject) => void, onError: (error: LocationError) => void) {
  return ExpoLocation.watchPositionAsync({ accuracy: ExpoLocation.Accuracy.High, distanceInterval: LOCATION.distanceIntervalMeters, timeInterval: LOCATION.timeIntervalMs },
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
