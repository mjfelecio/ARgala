import { afterEach, expect, it, vi } from 'vitest';
import { loadDevelopmentSystemAudio } from './development-audio-loader';
const read = vi.hoisted(() => vi.fn());
vi.mock('./development-system-audio', () => ({ get developmentSystemAudio() { read(); return 'synthetic-audition-only'; } }));
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); read.mockClear(); });
it.each([[false, '1'], [true, '0'], [false, '0']] as const)('does not evaluate audition files outside both development gates (%s/%s)', async (development, flag) => {
  vi.stubGlobal('__DEV__', development); vi.stubEnv('EXPO_PUBLIC_VIRO_SPIKE', flag);
  expect(await loadDevelopmentSystemAudio()).toBeNull(); expect(read).not.toHaveBeenCalled();
});
it('loads the explicit development audition manifest', async () => {
  vi.stubGlobal('__DEV__', true); vi.stubEnv('EXPO_PUBLIC_VIRO_SPIKE', '1');
  expect(await loadDevelopmentSystemAudio()).toBe('synthetic-audition-only'); expect(read).toHaveBeenCalledOnce();
});
