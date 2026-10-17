import { isCoordinate, type Coordinate } from '../location/geo';
/** Google's encoded polyline format, precision 5. Reject malformed/truncated data. */
export function decodePolyline(encoded: string): Coordinate[] {
  if (!encoded.length || encoded.length > 100000) throw new Error('Invalid route polyline.');
  let index = 0; let latitude = 0; let longitude = 0;
  const points: Coordinate[] = [];
  function component() {
    let result = 0; let shift = 0; let byte: number;
    do {
      if (index >= encoded.length || shift > 30) throw new Error('Invalid route polyline.');
      byte = encoded.charCodeAt(index++) - 63;
      if (byte < 0 || byte > 63) throw new Error('Invalid route polyline.');
      result += (byte & 31) * 2 ** shift; shift += 5;
    } while (byte >= 32);
    return result % 2 ? -(result + 1) / 2 : result / 2;
  }
  while (index < encoded.length) {
    latitude += component(); longitude += component();
    const coordinate = { latitude: latitude / 1e5, longitude: longitude / 1e5 };
    if (!isCoordinate(coordinate) || points.length >= 10000) throw new Error('Invalid route polyline.');
    points.push(coordinate);
  }
  return points;
}
