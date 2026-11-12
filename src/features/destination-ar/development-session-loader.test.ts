import { afterEach, expect, it, vi } from 'vitest';
import { loadDevelopmentSession } from './development-session-loader';
const read = vi.hoisted(() => vi.fn());
vi.mock('./destination-ar-session-screen', () => ({ get default() { read(); return () => null; } }));
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); read.mockClear(); });
it.each([[false, '1'], [true, '0'], [false, '0']] as const)('never evaluates the development session outside both guards (%s/%s)', async (development, flag) => {
  vi.stubGlobal('__DEV__', development); vi.stubEnv('EXPO_PUBLIC_VIRO_SPIKE', flag);
  expect(await loadDevelopmentSession()).toBeNull(); expect(read).not.toHaveBeenCalled();
});
it('resolves the guarded session component without mounting native AR', async () => {
  vi.stubGlobal('__DEV__', true); vi.stubEnv('EXPO_PUBLIC_VIRO_SPIKE', '1');
  expect(await loadDevelopmentSession()).toBeTypeOf('function'); expect(read).toHaveBeenCalledOnce();
});
