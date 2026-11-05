import { afterEach, expect, it, vi } from 'vitest';
import { loadDevelopmentGalleryContent } from './development-gallery-loader';
const read = vi.hoisted(() => vi.fn());
vi.mock('./development-gallery-content', () => ({ get developmentGalleryContent() { read(); return [{ id: 'synthetic-test-only' }]; } }));
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); read.mockClear(); });
it.each([[false, '1'], [true, '0'], [false, '0']] as const)('never evaluates sample assets outside both development gates (%s/%s)', async (development, flag) => {
  vi.stubGlobal('__DEV__', development); vi.stubEnv('EXPO_PUBLIC_VIRO_SPIKE', flag);
  expect(await loadDevelopmentGalleryContent()).toBeNull(); expect(read).not.toHaveBeenCalled();
});
it('loads sample content only through the explicit development path', async () => {
  vi.stubGlobal('__DEV__', true); vi.stubEnv('EXPO_PUBLIC_VIRO_SPIKE', '1');
  expect(await loadDevelopmentGalleryContent()).toEqual([{ id: 'synthetic-test-only' }]); expect(read).toHaveBeenCalledOnce();
});
