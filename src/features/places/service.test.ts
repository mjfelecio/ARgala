import { beforeEach, expect, it, vi } from 'vitest';
import { detailsRequestSchema } from '../../../supabase/functions/_shared/contracts';
import { createEndpoint } from '../../../supabase/functions/_shared/endpoint';
import { getPlaceDetails } from '../../../supabase/functions/_shared/places';
import { placesService } from './service';

const invoke = vi.hoisted(() => vi.fn());
vi.mock('@/lib/supabase', () => ({ getSupabase: () => ({ functions: { invoke } }) }));
const consume = vi.fn(async () => true);
const fetcher = vi.fn<typeof fetch>();
function connect(providerId: string) {
  const endpoint = createEndpoint(detailsRequestSchema, (input) => getPlaceDetails(input, { key: 'unit-test-key', fetcher }), {
    authenticate: async () => 'test-user', consume,
  });
  fetcher.mockImplementation(async () => Response.json({ id: providerId, displayName: { text: 'Synthetic place' }, location: { latitude: 0, longitude: 0 } }));
  invoke.mockImplementation(async (_name, { body }) => {
    const response = await endpoint(new Request('https://example.com/place-details', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test' }, body: JSON.stringify(body),
    }));
    return response.ok ? { data: await response.json(), error: null } : { data: null, error: { context: response } };
  });
}
beforeEach(() => { invoke.mockReset(); consume.mockClear(); fetcher.mockReset(); });
it.each([513, 1000, 4063])('passes a %i-character Place ID unchanged from client through Edge to Google', async (length) => {
  // Synthetic URL-safe ID; Google's identifier contract has no maximum length.
  const providerId = 'A'.repeat(length);
  connect(providerId);
  const result = await placesService.details(providerId, 'ja');
  expect(result.providerId).toBe(providerId);
  expect(invoke).toHaveBeenCalledWith('place-details', { body: { providerId, language: 'ja' } });
  expect(fetcher.mock.calls[0][0]).toBe(`https://places.googleapis.com/v1/places/${providerId}?languageCode=ja`);
  expect(consume).toHaveBeenCalledTimes(1);
  if (length === 4063) expect(new TextEncoder().encode(JSON.stringify({ providerId, language: 'ja' })).byteLength).toBe(4096);
});
it('rejects a details envelope above 4096 bytes before quota consumption or a Google call', async () => {
  // The 33-byte JSON envelope makes this request 4097 bytes even though the ID is smaller than 4096.
  const providerId = 'A'.repeat(4064);
  connect(providerId);
  await expect(placesService.details(providerId, 'en')).rejects.toMatchObject({ code: 'BODY_TOO_LARGE' });
  expect(consume).not.toHaveBeenCalled();
  expect(fetcher).not.toHaveBeenCalled();
});
it('rejects an ID that alone exceeds the request budget before invoking Edge', () => {
  expect(() => placesService.details('A'.repeat(4097))).toThrow();
  expect(invoke).not.toHaveBeenCalled();
});
