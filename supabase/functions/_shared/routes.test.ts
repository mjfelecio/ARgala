import { expect, it } from 'vitest';
import { computeWalkingRoute } from './routes.ts';
const request = { origin: { latitude: 0, longitude: 0 }, destination: { latitude: 0, longitude: 0.001 }, language: 'en' };
it('sends WALK coordinates and normalizes distance, fractional seconds, polyline and warnings', async () => {
  let submitted: Record<string, unknown> = {}; let mask = '';
  const result = await computeWalkingRoute(request, { key: 'test', fetcher: async (_url, init) => {
    submitted = JSON.parse(String(init?.body)); mask = new Headers(init?.headers).get('X-Goog-FieldMask') ?? '';
    return Response.json({ routes: [{ distanceMeters: 120, duration: '90.5s', polyline: { encodedPolyline: '??' }, warnings: ['Test warning'] }] });
  } });
  expect(submitted.travelMode).toBe('WALK'); expect(submitted.origin).toEqual({ location: { latLng: request.origin } });
  expect(mask).toContain('routes.polyline.encodedPolyline'); expect(mask).not.toContain('*');
  expect(result).toEqual({ distanceMeters: 120, durationSeconds: 90.5, encodedPolyline: '??', warnings: ['Test warning'] });
});
it('reports unavailable routes and rejects invalid coordinates and upstream payloads', async () => {
  await expect(computeWalkingRoute(request, { key: 'test', fetcher: async () => Response.json({}) })).rejects.toThrow('No walking route');
  await expect(computeWalkingRoute({ ...request, origin: { latitude: 99, longitude: 0 } }, { key: 'test', fetcher: async () => { throw new Error('must not call'); } })).rejects.toThrow();
  await expect(computeWalkingRoute(request, { key: 'test', fetcher: async () => Response.json({ routes: [{ duration: 'bad' }] }) })).rejects.toThrow('invalid');
});

it.each(['walking', 'driving'] as const)('previews explicit %s mode with exact server travel mapping', async mode => {
  const { computeRoutePreview } = await import('./routes.ts');
  let submitted: Record<string, unknown> = {};
  const result = await computeRoutePreview({ origin: { latitude: 0, longitude: 0 }, destination: { latitude: 0.1, longitude: 0.1 }, mode }, {
    key: 'test', fetcher: async (_url, init) => { submitted = JSON.parse(String(init?.body)); return Response.json({ routes: [{ distanceMeters: 1, duration: '2s', polyline: { encodedPolyline: '??AA' } }] }); },
  });
  expect(submitted.travelMode).toBe(mode === 'walking' ? 'WALK' : 'DRIVE');
  expect(result.mode).toBe(mode);
});
it('rejects unknown travel modes before invoking Google', async () => {
  const { computeRoutePreview } = await import('./routes.ts');
  let calls = 0;
  await expect(computeRoutePreview({ origin: { latitude: 0, longitude: 0 }, destination: { latitude: 0.1, longitude: 0.1 }, mode: 'flying' }, { key: 'test', fetcher: async () => { calls++; return Response.json({}); } })).rejects.toThrow();
  expect(calls).toBe(0);
});
