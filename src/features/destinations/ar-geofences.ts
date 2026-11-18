import { z } from 'zod';
import { distanceMeters, type Coordinate } from '@/features/location/geo';
import { destinationIds, type DestinationId } from './catalog';
import bundledGeofences from './featured-ar-geofences.json';

const positionSchema = z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]).readonly();
const ringSchema = z.array(positionSchema).min(4).readonly();
const polygonSchema = z.array(ringSchema).min(1).readonly();
const geometrySchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('Polygon'), coordinates: polygonSchema }).strict(),
  z.object({ type: z.literal('MultiPolygon'), coordinates: z.array(polygonSchema).min(1).readonly() }).strict(),
]).readonly();
type Position = z.infer<typeof positionSchema>;
type Ring = z.infer<typeof ringSchema>;
type Polygon = z.infer<typeof polygonSchema>;
type Geometry = z.infer<typeof geometrySchema>;

// Covers subtraction roundoff in decimal-degree coordinates (below one micrometre).
const coordinateTolerance = 1e-12;

function samePosition(a: Position, b: Position) {
  return a[0] === b[0] && a[1] === b[1];
}

function orientation(a: Position, b: Position, point: Position) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const horizontal = dx * (point[1] - a[1]);
  const vertical = dy * (point[0] - a[0]);
  const cross = horizontal - vertical;
  const tolerance = coordinateTolerance * (Math.abs(dx) + Math.abs(dy));
  return Math.abs(cross) <= tolerance ? 0 : Math.sign(cross);
}

function onSegment(point: Position, a: Position, b: Position) {
  return point[0] >= Math.min(a[0], b[0]) - coordinateTolerance && point[0] <= Math.max(a[0], b[0]) + coordinateTolerance &&
    point[1] >= Math.min(a[1], b[1]) - coordinateTolerance && point[1] <= Math.max(a[1], b[1]) + coordinateTolerance &&
    orientation(a, b, point) === 0;
}

function segmentsMeet(a: Position, b: Position, c: Position, d: Position) {
  if (onSegment(c, a, b) || onSegment(d, a, b) || onSegment(a, c, d) || onSegment(b, c, d)) return true;
  return orientation(a, b, c) * orientation(a, b, d) < 0 &&
    orientation(c, d, a) * orientation(c, d, b) < 0;
}

function ringsMeet(first: Ring, second: Ring) {
  return first.slice(1).some((end, index) =>
    second.slice(1).some((otherEnd, otherIndex) => segmentsMeet(first[index], end, second[otherIndex], otherEnd)));
}

function locateInRing(point: Position, ring: Ring): 'outside' | 'inside' | 'edge' {
  let inside = false;
  for (let index = 1; index < ring.length; index++) {
    const a = ring[index - 1];
    const b = ring[index];
    if (onSegment(point, a, b)) return 'edge';
    if ((a[1] > point[1]) !== (b[1] > point[1]) &&
      point[0] < a[0] + (b[0] - a[0]) * (point[1] - a[1]) / (b[1] - a[1])) inside = !inside;
  }
  return inside ? 'inside' : 'outside';
}

function containsPoint(point: Position, [shell, ...holes]: Polygon) {
  return locateInRing(point, shell) !== 'outside' && holes.every(hole => locateInRing(point, hole) === 'outside');
}

function validRing(ring: Ring) {
  const origin = ring[0];
  const last = ring.length - 1;
  if (!samePosition(origin, ring[last]) || new Set(ring.slice(0, last).map(position => position.join(','))).size !== last) return false;
  let doubledArea = 0;
  for (let index = 0; index < last; index++) {
    const a = ring[index];
    const b = ring[index + 1];
    const next = ring[(index + 2) % last];
    // Use GeoJSON's planar, lon/lat edges. A fence across 180° must be split there.
    if (Math.abs(a[0] - b[0]) >= 180 || onSegment(next, a, b) || onSegment(a, b, next)) return false;
    doubledArea += (a[0] - origin[0]) * (b[1] - origin[1]) - (b[0] - origin[0]) * (a[1] - origin[1]);
    for (let other = index + 2; other < last; other++) {
      if (index === 0 && other === last - 1) continue; // Adjacent closing edge.
      if (segmentsMeet(a, b, ring[other], ring[other + 1])) return false;
    }
  }
  return doubledArea !== 0;
}

function polygonsOf(geometry: Geometry): readonly Polygon[] {
  return geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
}

function validGeometry(geometry: Geometry) {
  const polygons = polygonsOf(geometry);
  return polygons.every(([shell, ...holes], index) => {
    if (!validRing(shell) || !holes.every((hole, holeIndex) => validRing(hole) &&
      locateInRing(hole[0], shell) === 'inside' && !ringsMeet(shell, hole) &&
      holes.slice(0, holeIndex).every(otherHole => !ringsMeet(hole, otherHole) &&
        locateInRing(hole[0], otherHole) === 'outside' && locateInRing(otherHole[0], hole) === 'outside'))) return false;
    return polygons.slice(0, index).every(otherPolygon =>
      !containsPoint(shell[0], otherPolygon) && !containsPoint(otherPolygon[0][0], polygons[index]) &&
      !polygons[index].some(ring => otherPolygon.some(otherRing => ringsMeet(ring, otherRing))));
  });
}

const reference = z.string().trim().min(1);
export const arGeofenceSchema = z.object({
  geometryVersion: reference,
  sourceReference: reference,
  approvalReference: reference,
  geometry: geometrySchema.refine(validGeometry, 'Invalid geofence boundaries'),
}).strict().readonly();
export type ArGeofence = z.infer<typeof arGeofenceSchema>;
export const arGeofenceRegistrySchema = z.object({
  schemaVersion: z.literal(1),
  destinations: z.partialRecord(z.enum(destinationIds), arGeofenceSchema).readonly(),
}).strict().readonly();

const bundled = arGeofenceRegistrySchema.safeParse(bundledGeofences);
export function getBundledArGeofence(id: DestinationId): ArGeofence | null {
  return bundled.success && Object.hasOwn(bundled.data.destinations, id) ? bundled.data.destinations[id] ?? null : null;
}

function distanceToSegment(point: Coordinate, a: Position, b: Position) {
  const middleLongitude = (a[0] + b[0]) / 2;
  const longitude = point.longitude + 360 * Math.round((middleLongitude - point.longitude) / 360);
  // Find the closest point along the GeoJSON segment in a local metre projection.
  const longitudeScale = Math.cos(point.latitude * Math.PI / 180);
  const dx = (b[0] - a[0]) * longitudeScale;
  const dy = b[1] - a[1];
  const projection = ((longitude - a[0]) * longitudeScale * dx + (point.latitude - a[1]) * dy) / (dx * dx + dy * dy);
  const fraction = Math.min(1, Math.max(0, projection));
  return distanceMeters(point, { longitude: a[0] + (b[0] - a[0]) * fraction, latitude: a[1] + dy * fraction });
}

export function geofenceProximity(fence: ArGeofence, point: Coordinate) {
  const position: Position = [point.longitude, point.latitude];
  const polygons = polygonsOf(fence.geometry);
  const contained = polygons.some(polygon => containsPoint(position, polygon));
  let boundaryMeters = Infinity;
  for (const polygon of polygons) {
    for (const ring of polygon) {
      if (locateInRing(position, ring) === 'edge') return { contained, boundaryMeters: 0 };
      for (let index = 1; index < ring.length; index++) {
        boundaryMeters = Math.min(boundaryMeters, distanceToSegment(point, ring[index - 1], ring[index]));
      }
    }
  }
  return { contained, boundaryMeters };
}
