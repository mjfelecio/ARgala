import { afterEach, expect, it, vi } from 'vitest';
import { ContentError, createContentService } from './service';
import { manifest } from './test-fixtures';
const config = { url: 'https://synthetic.example', key: 'sb_publishable_test' };
const account = { principalId: 'user-a', accessToken: 'captured-token' };
afterEach(() => vi.useRealTimers());
it('reads only the configured RPC using the captured token; null means no published update', async () => {
  const network = vi.fn(async () => new Response(JSON.stringify(manifest())));
  const service = createContentService(config, network);
  expect((await service(account, new AbortController().signal))?.revision).toBe(1);
  expect(network.mock.calls[0]).toEqual([config.url + '/rest/v1/rpc/get_destination_content', expect.objectContaining({
    method: 'POST', body: '{}', redirect: 'error', headers: expect.objectContaining({ Authorization: 'Bearer captured-token', apikey: config.key }),
  })]);
  expect(await createContentService(config, async () => new Response('null'))(account, new AbortController().signal)).toBeNull();
});
it.each([[401, 'content.authRequired'], [403, 'content.authRequired'], [404, 'content.unavailable'], [500, 'content.failed']])('maps status %s to a safe code', async (status, code) => {
  await expect(createContentService(config, async () => new Response('PRIVATE server failure', { status: Number(status) }))(account, new AbortController().signal)).rejects.toMatchObject({ code });
});
it('rejects wrong schema, draft and extra fields, unknown failures, invalid length and oversized streamed data', async () => {
  for (const response of [
    new Response('not-json'), new Response(JSON.stringify({ ...manifest(), approvalStatus: 'draft' })),
    new Response(JSON.stringify({ ...manifest(), cameraFrame: 'forbidden' })),
    new Response('{}', { headers: { 'content-length': 'NaN' } }),
    new Response(new ReadableStream({ start(c) { c.enqueue(new Uint8Array(524289)); c.close(); } })),
  ]) await expect(createContentService(config, async () => response)(account, new AbortController().signal)).rejects.toBeInstanceOf(ContentError);
  await expect(createContentService(config, async () => { throw new Error('private raw error'); })(account, new AbortController().signal)).rejects.toMatchObject({ code: 'content.failed' });
});
it('fails closed without authentication/HTTPS or when already aborted, before network work', async () => {
  const network = vi.fn(async () => new Response('null'));
  for (const user of [{ principalId: 'guest', accessToken: '' }, { principalId: 'user', accessToken: '' }])
    await expect(createContentService(config, network)(user, new AbortController().signal)).rejects.toMatchObject({ code: 'content.authRequired' });
  await expect(createContentService({ ...config, url: 'http://synthetic.example' }, network)(account, new AbortController().signal)).rejects.toBeInstanceOf(ContentError);
  await expect(createContentService(config, network)(account, AbortSignal.abort())).rejects.toBeInstanceOf(ContentError);
  expect(network).not.toHaveBeenCalled();
});
it('bounds hung fetch/body work and cancels requests even when the network ignores abort', async () => {
  vi.useFakeTimers();
  const service = createContentService(config, () => new Promise(() => {}));
  const result = service(account, new AbortController().signal);
  const rejected = expect(result).rejects.toMatchObject({ code: 'content.timeout' });
  await vi.advanceTimersByTimeAsync(15000); await rejected;
  const controller = new AbortController();
  const pending = service(account, controller.signal);
  const cancelled = expect(pending).rejects.toMatchObject({ code: 'content.failed' });
  controller.abort(); await cancelled;
});
