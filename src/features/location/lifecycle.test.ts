import { expect, it, vi } from 'vitest';
import { manageSubscription } from './lifecycle';
it('removes a native subscription that resolves after its owner leaves', async () => {
  let resolve!: (value: { remove(): void }) => void;
  const pending = new Promise<{ remove(): void }>((done) => { resolve = done; });
  const remove = vi.fn(); const onError = vi.fn();
  const stop = manageSubscription(() => pending, onError);
  stop(); resolve({ remove }); await pending; await Promise.resolve();
  expect(remove).toHaveBeenCalledOnce(); expect(onError).not.toHaveBeenCalled();
});
it('removes an established subscription and reports setup failures', async () => {
  const remove = vi.fn(); const errors: unknown[] = [];
  const stop = manageSubscription(async () => ({ remove }), (error) => errors.push(error));
  await Promise.resolve(); stop(); stop(); expect(remove).toHaveBeenCalledOnce();
  const failure = new Error('sensor absent');
  manageSubscription(async () => { throw failure; }, (error) => errors.push(error));
  await Promise.resolve(); await Promise.resolve(); expect(errors).toEqual([failure]);
});
