import { afterEach, expect, it, vi } from 'vitest';
import { loadExhibitScene } from './exhibit-loader';

const { evaluation, host } = vi.hoisted(() => ({ evaluation: vi.fn(), host: vi.fn((id: string, allowed?: readonly string[]) => () => ({ id, allowed })) }));
vi.mock('./exhibit-ring-scene', () => { evaluation(); return { getExhibitSceneHost: host }; });
afterEach(() => { vi.unstubAllEnvs(); evaluation.mockClear(); host.mockClear(); });
it('does not evaluate native code for unknown destinations or diagnostics', async () => {
  for (const id of ['D10', 'unknown', 'pilot-aclc']) expect(await loadExhibitScene(id)).toBeNull();
  expect(evaluation).not.toHaveBeenCalled();
});
it('loads all nine destination exhibits in release without the spike flag', async () => {
  Object.assign(globalThis, { __DEV__: false }); vi.stubEnv('EXPO_PUBLIC_VIRO_SPIKE', '');
  for (const id of ['D01', 'D02', 'D03', 'D04', 'D05', 'D06', 'D07', 'D08', 'D09']) expect(await loadExhibitScene(id)).toBeTypeOf('function');
  expect(evaluation).toHaveBeenCalledOnce();
});

it('preserves an explicit empty or partial media authorization when loading the host', async () => {
  await loadExhibitScene('D01', []); expect(host).toHaveBeenLastCalledWith('D01', []);
  await loadExhibitScene('D01', ['D01-maps-01']); expect(host).toHaveBeenLastCalledWith('D01', ['D01-maps-01']);
  await loadExhibitScene('D01'); expect(host).toHaveBeenLastCalledWith('D01', undefined);
});
