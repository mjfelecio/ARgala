import * as React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useReadingSize } from './use-reading-size';
const storage = vi.hoisted(() => ({ getItem: vi.fn(), setItem: vi.fn() }));
vi.mock('@react-native-async-storage/async-storage', () => ({ default: storage }));
let tree: ReactTestRenderer; let current: ReturnType<typeof useReadingSize>;
function Probe() { const value = useReadingSize(); React.useEffect(() => { current = value; }, [value]); return null; }
async function mount() { await act(async () => { tree = create(React.createElement(Probe)); }); }
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  storage.getItem.mockReset().mockResolvedValue(null); storage.setItem.mockReset().mockResolvedValue(undefined);
  const original = console.error; vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => { if (!String(args[0]).startsWith('react-test-renderer is deprecated')) original(...args); });
});
afterEach(async () => { await act(async () => tree?.unmount()); vi.restoreAllMocks(); });
it('does not overwrite a user size change with a delayed stored preference', async () => {
  const delayed = Promise.withResolvers<string | null>(); storage.getItem.mockReturnValueOnce(delayed.promise);
  await mount(); await act(async () => current.change(1));
  await act(async () => delayed.resolve('{"version":1,"size":"small"}'));
  expect(current.size).toBe('large');
  expect(JSON.parse(storage.setItem.mock.calls.at(-1)![1]).size).toBe('large');
});
it('clamps repeated size changes without starting redundant writes', async () => {
  await mount(); await act(async () => { current.change(-1); current.change(-1); });
  expect(current.size).toBe('small'); expect(storage.setItem).toHaveBeenCalledOnce();
});
it('keeps the chosen size after save failure and explicitly retries without exposing native errors', async () => {
  storage.setItem.mockRejectedValueOnce(new Error('PRIVATE_NATIVE_ERROR'));
  await mount(); await act(async () => current.change(1));
  expect(current.size).toBe('large'); expect(current.error).toBe('save-failed');
  await act(async () => current.retry());
  expect(current.error).toBeNull(); expect(storage.setItem).toHaveBeenCalledTimes(2);
});
it('recovers from a failed load only through explicit retry', async () => {
  storage.getItem.mockRejectedValueOnce(new Error('PRIVATE_NATIVE_ERROR'));
  await mount(); expect(current.error).toBe('load-failed'); expect(current.size).toBe('standard');
  storage.getItem.mockResolvedValue('{"version":1,"size":"large"}');
  await act(async () => current.retry()); expect(current.size).toBe('large'); expect(current.error).toBeNull();
});
