import { describe, expect, it } from 'vitest';
import { nearbyRequestSchema, detailsRequestSchema } from './contracts.ts';
import { getPlaceDetails, normalizePlace, searchNearby } from './places.ts';
// Synthetic unit fixtures, never used as application discovery data.
const fixture = { id: 'test-place', displayName: { text: 'Test place' }, location: { latitude: 0, longitude: 0 }, attributions: [{ provider: 'Test provider', providerUri: 'https://example.com' }] };
const request = { center: { latitude: 0, longitude: 0 }, radiusMeters: 1000, language: 'en' };
describe('Places boundaries', () => {
  it('accepts arbitrary centers and rejects invalid coordinates or unbounded searches', () => {
    expect(nearbyRequestSchema.safeParse({ ...request, center: { latitude: -33, longitude: 151 } }).success).toBe(true);
    for (const input of [{ ...request, radiusMeters: 5001 }, { ...request, radiusMeters: 0 }, { ...request, center: { latitude: 91, longitude: 0 } }, { ...request, center: { latitude: NaN, longitude: 0 } }]) expect(nearbyRequestSchema.safeParse(input).success).toBe(false);
    expect(detailsRequestSchema.safeParse({ providerId: '../bad', language: 'en' }).success).toBe(false);
  });
  it('normalizes identifiers, coordinates and attribution without inventing descriptions', () => {
    expect(normalizePlace(fixture)).toMatchObject({ id: 'google:test-place', provider: 'google', providerId: 'test-place', name: 'Test place', coordinates: fixture.location, attributions: [{ name: 'Test provider', uri: 'https://example.com' }] });
    expect(normalizePlace(fixture)).not.toHaveProperty('description');
    expect(() => normalizePlace({ ...fixture, location: {} })).toThrow();
  });
  it('requests at most 20 results with an explicit mask and no tourist type filter', async () => {
    let submitted: Record<string, unknown> = {}; let mask = '';
    const fetcher: typeof fetch = async (_url, init) => { submitted = JSON.parse(String(init?.body)); mask = new Headers(init?.headers).get('X-Goog-FieldMask') ?? ''; return Response.json({ places: [fixture] }); };
    const result = await searchNearby(request, { key: 'unit-test-key', fetcher });
    expect(result).toMatchObject([{ providerId: 'test-place' }]);
    expect(submitted.maxResultCount).toBe(20); expect(submitted).not.toHaveProperty('includedTypes');
    expect(submitted.locationRestriction).toEqual({ circle: { center: request.center, radius: 1000 } });
    expect(mask).toContain('places.attributions'); expect(mask).not.toContain('*');
  });
  it('supports empty searches, details and safely translated upstream failures', async () => {
    expect(await searchNearby(request, { key: 'test', fetcher: async () => Response.json({}) })).toEqual([]);
    expect(await getPlaceDetails({ providerId: 'test-place', language: 'en' }, { key: 'test', fetcher: async () => Response.json(fixture) })).toMatchObject({ name: 'Test place' });
    await expect(searchNearby(request, { key: 'secret', fetcher: async () => new Response('secret upstream error', { status: 403 }) })).rejects.toThrow('provider');
    await expect(searchNearby(request, { key: 'test', fetcher: async () => Response.json({ places: [{}] }) })).rejects.toThrow();
  });
});
