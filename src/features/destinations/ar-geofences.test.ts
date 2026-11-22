import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { arGeofenceRegistrySchema, arGeofenceSchema, resolveApprovedGeofences, geofenceProximity, getBundledArGeofence } from './ar-geofences';
import { destinationIds } from './catalog';
import raw from './data/approved-visitor-geofences.geojson.json';
import sidecar from './data/approved-geofence-mapping.json';

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

it('requires the registry schema version and keys only the permanent featured destinations', () => {
  expect(arGeofenceRegistrySchema.safeParse({ schemaVersion: 2, destinations: { D01: polygon } }).success).toBe(false);
  expect(arGeofenceRegistrySchema.safeParse({ schemaVersion: 1, destinations: { 'pilot-aclc': polygon } }).success).toBe(false);
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

it('bundles exactly the owner GeoJSON bytes and resolves every stable ID by exact sidecar label', () => {
  const original = readFileSync(new URL('./data/approved-visitor-geofences.geojson', import.meta.url));
  const runtime = readFileSync(new URL('./data/approved-visitor-geofences.geojson.json', import.meta.url));
  expect(runtime.equals(original)).toBe(true);
  expect(createHash('sha256').update(original).digest('hex')).toBe('d2dea011cb845d5fe27d289f592b4539200896bb97de614ad4cc5dce44d97b33');
  const mapping = readFileSync(new URL('./data/approved-geofence-mapping.json', import.meta.url));
  expect(createHash('sha256').update(mapping).digest('hex')).toBe('93de68c86648e500b7df8a79948af8b664ac9bae119784d3f64fdc37088e2cdd');
  expect(sidecar.sourceFileSha256).toBe('d2dea011cb845d5fe27d289f592b4539200896bb97de614ad4cc5dce44d97b33');
  expect(sidecar.features).toHaveLength(10);
  expect(resolveApprovedGeofences({ ...raw, features: raw.features.toReversed() }, sidecar)).toEqual(resolveApprovedGeofences(raw, sidecar));
  expect(destinationIds).toHaveLength(10);
  expect(destinationIds).toEqual(['D01', 'D02', 'D03', 'D04', 'D05', 'D06', 'D07', 'D08', 'D09', 'D10']);
  for (const id of destinationIds) {
    const record = sidecar.features.find(entry => entry.destinationId === id)!;
    const feature = raw.features.find(item => item.properties.label === record.sourceLabelExact)!;
    expect(getBundledArGeofence(id)?.geometry).toEqual(feature.geometry);
    expect(getBundledArGeofence(id)?.sourceReference).toContain(record.sourceLabelExact);
  }
});

it('rejects unknown, duplicate, renamed, unapproved and incomplete mappings', () => {
  const changedFirst = (changes: Partial<typeof sidecar.features[number]>) =>
    ({ ...sidecar, features: [{ ...sidecar.features[0], ...changes }, ...sidecar.features.slice(1)] });
  for (const changes of [
    { sourceLabelExact: 'Lake Danao' }, { sourceLabelExact: 'Lake Janagdan' }, { destinationId: 'pilot-aclc' },
    { destinationId: 'D03' }, { sourceFeatureIndex: 1 }, { approvalStatus: 'draft' },
  ]) expect(resolveApprovedGeofences(raw, changedFirst(changes))).toBeNull();
  expect(resolveApprovedGeofences(raw, { ...sidecar, features: sidecar.features.slice(1) })).toBeNull();
  expect(resolveApprovedGeofences({ ...raw, features: [raw.features[1], ...raw.features.slice(1)] }, sidecar)).toBeNull();
});
