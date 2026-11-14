import { afterEach, expect, it, vi } from 'vitest';
import { loadExhibitScene } from './exhibit-loader';

const evaluation = vi.hoisted(() => vi.fn());
vi.mock('./exhibit-ring-scene', () => { evaluation(); return { getExhibitSceneHost: (id: string) => () => id }; });
afterEach(() => { vi.unstubAllEnvs(); evaluation.mockClear(); });
it('never evaluates Exhibit for release builds, a disabled flag, unknown destinations or ACLC', async () => {
  Object.assign(globalThis, { __DEV__: false }); vi.stubEnv('EXPO_PUBLIC_VIRO_SPIKE', '1');
  expect(await loadExhibitScene('D01')).toBeNull();
  Object.assign(globalThis, { __DEV__: true }); vi.stubEnv('EXPO_PUBLIC_VIRO_SPIKE', '0');
  expect(await loadExhibitScene('D01')).toBeNull();
  vi.stubEnv('EXPO_PUBLIC_VIRO_SPIKE', '1');
  for (const id of ['D10', 'unknown', 'pilot-aclc']) expect(await loadExhibitScene(id)).toBeNull();
  expect(evaluation).not.toHaveBeenCalled();
});
it('loads only explicitly selected featured development Exhibits', async () => {
  Object.assign(globalThis, { __DEV__: true }); vi.stubEnv('EXPO_PUBLIC_VIRO_SPIKE', '1');
  for (const id of ['D01', 'D02', 'D03', 'D04', 'D05', 'D06', 'D07', 'D08', 'D09']) expect(await loadExhibitScene(id)).toBeTypeOf('function');
  expect(evaluation).toHaveBeenCalledOnce();
});
