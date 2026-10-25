import { expect, it, vi } from 'vitest';
import { createReadingStore, readReadingSize } from './reading-preference';
it('defaults invalid/missing reading preferences without touching general app settings', () => {
  for (const value of [null, 'bad', '{}', '{"version":2,"size":"large"}', '{"version":1,"size":"huge"}']) expect(readReadingSize(value)).toBe('standard');
  expect(readReadingSize('{"version":1,"size":"large"}')).toBe('large');
});
it('serializes writes, survives a failed write, and reads the same dedicated key', async () => {
  const first = Promise.withResolvers<void>();
  const storage = { getItem: vi.fn().mockResolvedValue('{"version":1,"size":"small"}'), setItem: vi.fn().mockReturnValueOnce(first.promise).mockResolvedValueOnce(undefined) };
  const store = createReadingStore(storage);
  const a = store.write('small').catch(() => undefined); const b = store.write('large');
  await Promise.resolve(); expect(storage.setItem).toHaveBeenCalledTimes(1);
  first.reject(new Error('PRIVATE_STORAGE_FAILURE')); await a; await b;
  expect(storage.setItem.mock.calls.map(call => JSON.parse(call[1]).size)).toEqual(['small', 'large']);
  expect(await store.read()).toBe('small');
  expect(storage.getItem.mock.calls[0][0]).toBe(storage.setItem.mock.calls[0][0]);
  expect(storage.getItem.mock.calls[0][0]).not.toBe('argala.preferences.v1');
});
