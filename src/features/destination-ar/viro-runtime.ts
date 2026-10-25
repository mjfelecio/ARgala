import { NativeModules, Platform } from 'react-native';
import { Camera } from 'expo-camera';
import type { ArSupport } from './types';

const { getCameraPermissionsAsync, requestCameraPermissionsAsync } = Camera;

/** Pinned 3.0.3 callback boundary: retain enum codes hidden by Viro's boolean helper.
 * Supported hardware is not a promise that AR services are installed/current.
 */
export function readViroSupport(): Promise<ArSupport> {
  const native = NativeModules.VRTARSceneNavigatorModule;
  if (Platform.OS !== 'android' || typeof native?.isARSupportedOnDevice !== 'function') return Promise.resolve('native-unavailable');
  return new Promise(resolve => {
    try {
      native.isARSupportedOnDevice((result: unknown) => {
        switch (result) {
          case 'SUPPORTED': resolve('supported'); break;
          case 'UNSUPPORTED': resolve('unsupported'); break;
          case 'UNKNOWN': case 'TRANSIENT': resolve('checking'); break;
          default: resolve('failed');
        }
      });
    } catch { resolve('failed'); }
  });
}

type CameraOwner = { isCurrent(): boolean; onPrompt?(): void };
// Only an actual OS request is shared. Passive reads can be abandoned; retaining
// a hung read globally would poison retries and later foreground owners.
let pendingCameraRequest: ReturnType<typeof requestCameraPermissionsAsync> | null = null;
export async function cameraPermission(prompt: boolean, owner: CameraOwner = { isCurrent: () => true }) {
  if (pendingCameraRequest) { owner.onPrompt?.(); return pendingCameraRequest; }
  const permission = await getCameraPermissionsAsync();
  // The owner may have blurred or expired while the native read was pending.
  if (!owner.isCurrent() || permission.granted || !permission.canAskAgain || !prompt) return permission;
  if (pendingCameraRequest) { owner.onPrompt?.(); return pendingCameraRequest; }
  owner.onPrompt?.();
  pendingCameraRequest = requestCameraPermissionsAsync().finally(() => { pendingCameraRequest = null; });
  return pendingCameraRequest;
}
