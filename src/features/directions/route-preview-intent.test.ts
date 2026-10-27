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
 c.setQueryData(['route-preview-session','old'],{status:'success',language:'en',intent:{place,createdAt:Date.now(),source:'ar'},result});
 const token=createRoutePreviewIntent(c,place,undefined,'map');
 expect(claimRoutePreviewIntent(c,token)?.existing).toEqual(result);
});

it.each(['pending','failed','expired','different-provider','different-destination','different-language'])('does not reuse %s sessions as a completed route',kind=>{
 const c=client();const target=kind==='different-provider'?{...place,providerId:'other'}:place;
 const result={origin:{latitude:11,longitude:125},destination:kind==='different-destination'?{latitude:12,longitude:124}:place.coordinates,route:{distanceMeters:1,durationSeconds:1,encodedPolyline:'??AA',warnings:[]}};
 c.setQueryData(['route-preview-session','old'],{status:['pending','failed'].includes(kind)?kind:'success',language:kind==='different-language'?'ja':'en',intent:{place:target,createdAt:Date.now()-(kind==='expired'?120001:0),source:'ar'},result});
 expect(claimRoutePreviewIntent(c,createRoutePreviewIntent(c,place))?.existing).toBeUndefined();
});

it('carries explicit featured context only for an exact approved curated entrance', async () => {
 const { getDestination } = await import('@/features/destinations/catalog');
 const { destinationToRoutePlace } = await import('@/features/destinations/routing');
 const target = destinationToRoutePlace(getDestination('pilot-aclc')!)!;
 const c = client();
 expect(claimRoutePreviewIntent(c, createRoutePreviewIntent(c, target, undefined, 'details', 'en', 'pilot-aclc'))?.featuredDestinationId).toBe('pilot-aclc');
 expect(claimRoutePreviewIntent(c, createRoutePreviewIntent(c, target))?.featuredDestinationId).toBeUndefined();
 expect(claimRoutePreviewIntent(c, createRoutePreviewIntent(c, place, undefined, 'map', 'en', 'pilot-aclc'))?.featuredDestinationId).toBeUndefined();
 expect(claimRoutePreviewIntent(c, createRoutePreviewIntent(c, { ...target, coordinates: { latitude: 0, longitude: 0 } }, undefined, 'map', 'en', 'pilot-aclc'))?.featuredDestinationId).toBeUndefined();
});
