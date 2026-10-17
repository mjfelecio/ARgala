import { z } from 'zod';
import { beforeEach, expect, it, vi } from 'vitest';
import { invokeEdge } from './edge';
const invoke = vi.hoisted(() => vi.fn());
vi.mock('./supabase', () => ({ getSupabase: () => ({ functions: { invoke } }) }));
const schema = z.object({ value: z.number() });
beforeEach(() => { invoke.mockReset(); });
it.each(['RATE_LIMITED', 'UPSTREAM_ERROR', 'FUTURE_ERROR'])('preserves structured Edge code %s for the UI', async (code) => {
  invoke.mockResolvedValue({ data: null, error: { context: Response.json({ error: { code, message: 'Server English text' } }) } });
  await expect(invokeEdge('example', {}, schema)).rejects.toMatchObject({ code });
});
it.each(['not-json', '{"error":{"message":"Missing code"}}'])('turns malformed Edge failures into a typed service fallback: %s', async (body) => {
  invoke.mockResolvedValue({ data: null, error: { context: new Response(body) } });
  await expect(invokeEdge('example', {}, schema)).rejects.toMatchObject({ code: 'SERVICE_UNAVAILABLE' });
});
it('turns transport failures into a typed service fallback', async () => {
  invoke.mockResolvedValue({ data: null, error: new Error('Fetch failed') });
  await expect(invokeEdge('example', {}, schema)).rejects.toMatchObject({ code: 'SERVICE_UNAVAILABLE' });
});
it('rejects invalid successful payloads with a typed response error', async () => {
  invoke.mockResolvedValue({ data: { data: { value: 'wrong' } }, error: null });
  await expect(invokeEdge('example', {}, schema)).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
});
it('returns validated successful data', async () => {
  invoke.mockResolvedValue({ data: { data: { value: 7 } }, error: null });
  await expect(invokeEdge('example', {}, schema)).resolves.toEqual({ value: 7 });
});
