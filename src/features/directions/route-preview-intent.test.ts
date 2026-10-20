import { QueryClient } from '@tanstack/react-query';
import { afterEach, expect, it, vi } from 'vitest';
import { queryClient } from '@/lib/query';
import type { Place } from '@/features/places/service';
import { claimRoutePreviewIntent, createRoutePreviewIntent } from './route-preview-intent';
const clients: QueryClient[] = [];
function client() { const c = new QueryClient({ defaultOptions: queryClient.getDefaultOptions() }); clients.push(c); return c; }
const place: Place = { id: 'google:test', providerId: 'test', provider: 'google', name: 'Test', coordinates: { latitude: 10, longitude: 124 }, attributions: [] };
afterEach(() => { clients.forEach(c => c.clear()); vi.useRealTimers(); });
it('creates a single-use explicit directions intent without changing the provider ID', () => {
  const c = client(); const token = createRoutePreviewIntent(c, place);
  expect(claimRoutePreviewIntent(c, token)).toMatchObject({ place, source: 'details', createdAt: expect.any(Number) });
  expect(claimRoutePreviewIntent(c, token)).toBeNull();
});
it.each([undefined, '', ['token'], '../bad', 'unknown', 'x'.repeat(513)])('rejects invalid or unknown token %j', token => {
  expect(claimRoutePreviewIntent(client(), token)).toBeNull();
});
it('expires pending intents even before unused query garbage collection', () => {
  vi.useFakeTimers(); const c = client(); const token = createRoutePreviewIntent(c, place);
  vi.setSystemTime(Date.now() + 120001); expect(claimRoutePreviewIntent(c, token)).toBeNull();
});
it('retains the exact existing route and captured origin', () => {
  const c = client(); const existing = { origin: { latitude: 11, longitude: 125 }, destination: place.coordinates, route: { distanceMeters: 900, durationSeconds: 750, encodedPolyline: '??AA', warnings: ['Returned warning'] } };
  const token = createRoutePreviewIntent(c, place, existing);
  expect(claimRoutePreviewIntent(c, token)).toMatchObject({ place, source: 'map', existing });
});
it('revokes pending intents on auth clear and when a new target is handed off', () => {
  const c = client(); const first = createRoutePreviewIntent(c, place); const second = createRoutePreviewIntent(c, { ...place, providerId: 'other' });
  expect(claimRoutePreviewIntent(c, first)).toBeNull(); c.clear(); expect(claimRoutePreviewIntent(c, second)).toBeNull();
});

it('reuses a completed matching preview through a new explicit handoff without granting request authority from cache',()=>{
 const c=client(); const result={origin:{latitude:11,longitude:125},destination:place.coordinates,route:{distanceMeters:900,durationSeconds:750,encodedPolyline:'??AA',warnings:['Warning']}};
 c.setQueryData(['route-preview-session','old'],{status:'success',intent:{place,createdAt:Date.now(),source:'ar'},result});
 const token=createRoutePreviewIntent(c,place,undefined,'map');
 expect(claimRoutePreviewIntent(c,token)?.existing).toEqual(result);
});
