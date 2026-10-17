import { expect, it } from 'vitest';
import { z } from 'zod';
import { createEndpoint } from './endpoint.ts';
const schema = z.object({ value: z.string() }).strict();
const allow = { authenticate: async () => 'user', consume: async () => true };
const request = (body = '{"value":"accepted"}', headers: Record<string, string> = {}) => new Request('https://example.com/function', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer valid', ...headers }, body });
it('authenticates and limits calls before executing provider work', async () => {
  let calls = 0; const action = async (input: { value: string }) => { calls++; return input.value; };
  const unauthenticated = createEndpoint(schema, action, { ...allow, authenticate: async () => null });
  expect((await unauthenticated(request())).status).toBe(401);
  const limited = createEndpoint(schema, action, { ...allow, consume: async () => false });
  expect((await limited(request())).status).toBe(429); expect(calls).toBe(0);
  const response = await createEndpoint(schema, action, allow)(request());
  expect(await response.json()).toEqual({ data: 'accepted' }); expect(calls).toBe(1);
});
it('rejects invalid JSON, schemas, methods and oversized streamed bodies', async () => {
  let calls = 0; const endpoint = createEndpoint(schema, async () => { calls++; return 'ok'; }, allow);
  for (const body of ['{', '{}']) expect((await endpoint(request(body))).status).toBe(400);
  expect((await endpoint(request('x'.repeat(4097)))).status).toBe(413);
  expect((await endpoint(new Request('https://example.com', { method: 'GET' }))).status).toBe(405);
  expect((await endpoint(request('{}', { Authorization: '' }))).status).toBe(401);
  expect(calls).toBe(0);
});
it('fails closed when the limiter fails and hides unexpected error details', async () => {
  let called = false;
  const endpoint = createEndpoint(schema, async () => { called = true; return null; }, { ...allow, consume: async () => { throw new Error('private database secret'); } });
  const response = await endpoint(request()); expect(response.status).toBe(500); expect(JSON.stringify(await response.json())).not.toContain('secret'); expect(called).toBe(false);
});
