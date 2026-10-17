export type Coordinate = { latitude: number; longitude: number };
const radians = (degrees: number) => degrees * Math.PI / 180;

export function isCoordinate(value: unknown): value is Coordinate {
  if (!value || typeof value !== 'object') return false;
  const { latitude, longitude } = value as Partial<Coordinate>;
  return typeof latitude === 'number' && Number.isFinite(latitude) && Math.abs(latitude) <= 90 && typeof longitude === 'number' && Number.isFinite(longitude) && Math.abs(longitude) <= 180;
}
function assertCoordinate(value: Coordinate) { if (!isCoordinate(value)) throw new RangeError('Invalid geographic coordinates.'); }
export function normalizeHeading(value: number) {
  if (!Number.isFinite(value)) throw new RangeError('Heading must be finite.');
  return ((value % 360) + 360) % 360;
}
export const relativeHeading = (bearing: number, heading: number) => normalizeHeading(normalizeHeading(bearing) - normalizeHeading(heading) + 180) - 180;
export function distanceMeters(a: Coordinate, b: Coordinate) {
  assertCoordinate(a); assertCoordinate(b);
  const sinLat = Math.sin(radians(b.latitude - a.latitude) / 2);
  const sinLon = Math.sin(radians(b.longitude - a.longitude) / 2);
  const h = sinLat ** 2 + Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude)) * sinLon ** 2;
  return 6371008.8 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, h))));
}
export function bearingDegrees(a: Coordinate, b: Coordinate) {
  assertCoordinate(a); assertCoordinate(b);
  const delta = radians(b.longitude - a.longitude);
  const y = Math.sin(delta) * Math.cos(radians(b.latitude));
  const x = Math.cos(radians(a.latitude)) * Math.sin(radians(b.latitude)) - Math.sin(radians(a.latitude)) * Math.cos(radians(b.latitude)) * Math.cos(delta);
  return normalizeHeading(Math.atan2(y, x) * 180 / Math.PI);
}
export function isWithinRadius(a: Coordinate, b: Coordinate, radius: number) {
  if (!Number.isFinite(radius) || radius < 0) throw new RangeError('Radius must be finite and nonnegative.');
  return distanceMeters(a, b) <= radius;
}
