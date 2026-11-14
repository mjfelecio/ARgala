import { afterEach, expect, it, vi } from 'vitest';
import { loadExhibitScene } from './exhibit-loader';

const evaluation = vi.hoisted(() => vi.fn());
vi.mock('./exhibit-ring-scene', () => { evaluation(); return { ExhibitRingSceneHost: () => null }; });
afterEach(() => { vi.unstubAllEnvs(); evaluation.mockClear(); });
it('never evaluates Exhibit for release builds, a disabled flag, another destination or ACLC', async () => {
  Object.assign(globalThis, { __DEV__: false }); vi.stubEnv('EXPO_PUBLIC_VIRO_SPIKE', '1');
  expect(await loadExhibitScene('D01')).toBeNull();
  Object.assign(globalThis, { __DEV__: true }); vi.stubEnv('EXPO_PUBLIC_VIRO_SPIKE', '0');
  expect(await loadExhibitScene('D01')).toBeNull();
  vi.stubEnv('EXPO_PUBLIC_VIRO_SPIKE', '1');
  for (const id of ['D02', 'D09', 'pilot-aclc']) expect(await loadExhibitScene(id)).toBeNull();
  expect(evaluation).not.toHaveBeenCalled();
});
it('loads only the explicitly selected D01 development Exhibit', async () => {
  Object.assign(globalThis, { __DEV__: true }); vi.stubEnv('EXPO_PUBLIC_VIRO_SPIKE', '1');
  expect(await loadExhibitScene('D01')).toBeTypeOf('function');
  expect(evaluation).toHaveBeenCalledOnce();
});
