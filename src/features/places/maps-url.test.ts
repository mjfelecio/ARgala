import { expect, it } from 'vitest';
import { googleMapsPlaceUrl } from './maps-url';
it('opens a precise Google identity without needing a details response', () => {
  const url = new URL(googleMapsPlaceUrl({ providerId: 'ChIJ-test', name: 'A & B' }));
  expect(url.origin).toBe('https://www.google.com');
  expect(url.searchParams.get('query_place_id')).toBe('ChIJ-test');
  expect(url.searchParams.get('query')).toBe('A & B');
});
it('uses curated coordinates without forwarding internal IDs to Google', () => {
  const url = new URL(googleMapsPlaceUrl({ providerId: 'curated_D01', name: 'Lake', coordinates: { latitude: 11, longitude: 124 } }));
  expect(url.searchParams.get('query')).toBe('11,124');
  expect(url.searchParams.has('query_place_id')).toBe(false);
});
