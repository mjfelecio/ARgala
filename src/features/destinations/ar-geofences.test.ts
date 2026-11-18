import { expect, it } from 'vitest';
import { arGeofenceRegistrySchema, arGeofenceSchema, geofenceProximity, getBundledArGeofence } from './ar-geofences';
import { destinationIds } from './catalog';

const shell = [[0, 0], [0.004, 0], [0.004, 0.006], [0, 0.006], [0, 0]];
const hole = [[0.001, 0.001], [0.001, 0.003], [0.003, 0.003], [0.003, 0.001], [0.001, 0.001]];
const source = { geometryVersion: 'synthetic-1', sourceReference: 'synthetic survey', approvalReference: 'synthetic approval' };
const polygon = { ...source, geometry: { type: 'Polygon', coordinates: [shell, hole] } };

it('includes the outside edge and excludes hole interiors and edges', () => {
  const fence = arGeofenceSchema.parse(polygon);
  expect(geofenceProximity(fence, { longitude: 0, latitude: 0.002 })).toEqual({ contained: true, boundaryMeters: 0 });
  expect(geofenceProximity(fence, { longitude: 0.001, latitude: 0.002 })).toEqual({ contained: false, boundaryMeters: 0 });
  expect(geofenceProximity(fence, { longitude: 0.002, latitude: 0.002 })).toMatchObject({ contained: false });
  expect(geofenceProximity(fence, { longitude: 0.0035, latitude: 0.002 })).toMatchObject({ contained: true });
});

it('measures to the closest extent of any component, including a hole', () => {
  const separate = [[0.008, 0], [0.012, 0], [0.012, 0.006], [0.008, 0.006], [0.008, 0]];
  const fence = arGeofenceSchema.parse({ ...source, geometry: { type: 'MultiPolygon', coordinates: [[shell, hole], [separate]] } });
  expect(geofenceProximity(fence, { longitude: 0.009, latitude: 0.002 }).contained).toBe(true);
  expect(geofenceProximity(fence, { longitude: 0.0079, latitude: 0.002 }).boundaryMeters).toBeCloseTo(11.1195, 3);
  expect(geofenceProximity(fence, { longitude: 0.0011, latitude: 0.002 }).boundaryMeters).toBeCloseTo(11.1195, 3);
});

it.each([
  { ...polygon, approvalReference: ' ' },
  { ...polygon, sourceReference: undefined },
  { ...polygon, geometryVersion: undefined },
  { ...source, geometry: { type: 'Polygon', coordinates: [shell.slice(0, -1)] } },
  { ...source, geometry: { type: 'Polygon', coordinates: [[[200, 0], ...shell.slice(1)]] } },
  { ...source, geometry: { type: 'Polygon', coordinates: [[[0, 0], [0.001, 0], [0.002, 0], [0, 0]]] } },
  { ...source, geometry: { type: 'Polygon', coordinates: [[[0, 0], [0.003, 0.003], [0.003, 0], [0.001, 0.003], [0, 0]]] } },
  { ...source, geometry: { type: 'Polygon', coordinates: [hole, shell] } },
  { ...source, geometry: { type: 'Polygon', coordinates: [shell, hole, hole] } },
  { ...source, geometry: { type: 'MultiPolygon', coordinates: [[shell], [hole]] } },
])('rejects invalid geometry or missing provenance %#', input => {
  expect(arGeofenceSchema.safeParse(input).success).toBe(false);
});

it('requires the registry schema version and keys only the nine featured destinations', () => {
  expect(arGeofenceRegistrySchema.safeParse({ schemaVersion: 2, destinations: { D01: polygon } }).success).toBe(false);
  expect(arGeofenceRegistrySchema.safeParse({ schemaVersion: 1, destinations: { 'pilot-aclc': polygon } }).success).toBe(false);
  expect(destinationIds.every(id => getBundledArGeofence(id) === null)).toBe(true);
});

it('includes a diagonal outer edge despite floating-point roundoff at WGS84 coordinates', () => {
  const start = [-105.30841, 12.34003];
  const end = [-105.30537, 12.37094];
  const fence = arGeofenceSchema.parse({ ...source, geometry: {
    type: 'Polygon', coordinates: [[start, end, [end[0] - 0.003, end[1]], start]],
  } });
  const point = { longitude: start[0] + (end[0] - start[0]) * 0.64, latitude: start[1] + (end[1] - start[1]) * 0.64 };
  expect(geofenceProximity(fence, point)).toEqual({ contained: true, boundaryMeters: 0 });
});
