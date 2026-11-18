import { Platform } from 'react-native';
import type { WatcherSample } from '@/features/destinations/proximity';

type CameraHeadingModule = {
  addListener(event: 'onHeading', listener: (event: { owner: number; degrees: number | null; measuredAt: number }) => void): { remove(): void };
  setLocation(owner: number, latitude: number, longitude: number, timestamp: number): void;
  start(owner: number): void;
  stop(owner: number): void;
};

export function cameraHeadingModule(): CameraHeadingModule | null {
  if (Platform.OS !== 'android') return null;
  try {
    // The JS bundle can also run on an older compatible Viro client.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const core: typeof import('expo-modules-core') = require('expo-modules-core');
    return core.requireOptionalNativeModule<CameraHeadingModule>('ArCameraHeading');
  } catch {
    return null;
  }
}

export function updateHeadingLocation(module: CameraHeadingModule, owner: number, fix: WatcherSample) {
  module.setLocation(owner, fix.position.latitude, fix.position.longitude, fix.timestamp);
}
