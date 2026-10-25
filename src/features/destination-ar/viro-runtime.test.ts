import { beforeEach, expect, it, vi } from 'vitest';
import { readViroSupport, cameraPermission } from './viro-runtime';

const native = vi.hoisted(() => ({ modules: {} as Record<string, unknown>, get: vi.fn(), request: vi.fn() }));
vi.mock('react-native', () => ({ Platform: { OS: 'android' }, NativeModules: native.modules }));
vi.mock('expo-camera', () => ({ Camera: { getCameraPermissionsAsync: native.get, requestCameraPermissionsAsync: native.request } }));
const grant = { granted: true, canAskAgain: true, status: 'granted', expires: 'never' };
beforeEach(() => {
  for (const key of Object.keys(native.modules)) delete native.modules[key];
  native.get.mockReset().mockResolvedValue(grant); native.request.mockReset().mockResolvedValue(grant);
});

it('distinguishes an old APK with no native Viro module from unsupported hardware', async () => {
  expect(await readViroSupport()).toBe('native-unavailable');
});
it.each([
  ['SUPPORTED', 'supported'], ['UNSUPPORTED', 'unsupported'], ['TRANSIENT', 'checking'], ['UNKNOWN', 'checking'],
  ['unrecognized native result', 'failed'],
])('maps native %s without parsing an English error', async (result, expected) => {
  native.modules.VRTARSceneNavigatorModule = { isARSupportedOnDevice: (callback: (value: string) => void) => callback(result) };
  expect(await readViroSupport()).toBe(expected);
});
it('maps rejected native support setup to a stable fallback', async () => {
  native.modules.VRTARSceneNavigatorModule = { isARSupportedOnDevice: () => { throw new Error('private diagnostic'); } };
  expect(await readViroSupport()).toBe('failed');
});
it('checks an existing grant without prompting', async () => {
  expect(await cameraPermission(true)).toMatchObject({ granted: true });
  expect(native.request).not.toHaveBeenCalled();
});
it('shares a pending permission activity and checks grants again once it settles', async () => {
  native.get.mockResolvedValue({ ...grant, granted: false, status: 'undetermined' });
  const permission = Promise.withResolvers<typeof grant>();
  native.request.mockReturnValue(permission.promise);
  const first = cameraPermission(true);
  await Promise.resolve();
  const replacementOwner = cameraPermission(true);
  permission.resolve(grant);
  await expect(first).resolves.toMatchObject({ granted: true });
  await expect(replacementOwner).resolves.toMatchObject({ granted: true });
  expect(native.request).toHaveBeenCalledOnce();
  native.get.mockResolvedValue({ ...grant, granted: false, canAskAgain: false, status: 'denied' });
  await expect(cameraPermission(false)).resolves.toMatchObject({ granted: false });
  expect(native.get).toHaveBeenCalledTimes(2);
  expect(native.request).toHaveBeenCalledOnce();
});
it('does not open a permission prompt when a delayed read resolves after its owner is retired', async () => {
  const read = Promise.withResolvers<typeof grant>();
  native.get.mockReturnValue(read.promise);
  let current = true;
  const permission = cameraPermission(true, { isCurrent: () => current });
  current = false;
  read.resolve({ ...grant, granted: false, status: 'denied' });
  await permission;
  expect(native.request).not.toHaveBeenCalled();
});
it('does not let a hung passive read poison a later explicit check', async () => {
  const read = Promise.withResolvers<typeof grant>();
  native.get.mockReturnValueOnce(read.promise);
  const first = cameraPermission(false);
  let secondResult: unknown;
  const second = cameraPermission(false).then(value => { secondResult = value; });
  try {
    await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
    expect(secondResult).toMatchObject({ granted: true });
    expect(native.get).toHaveBeenCalledTimes(2);
  } finally { read.resolve(grant); await first; await second; }
});
