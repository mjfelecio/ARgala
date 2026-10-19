import * as React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { getCurrentCoordinates, requestLocationPermission, subscribeToLocation, subscribeToHeading } from './service';
import { useDeviceLocation } from './use-device-location';
import ArScreen from '@/features/ar/ar-screen';

const navigation = vi.hoisted(() => ({
  active: true, focused: true, ref: { current: null as object | null },
  context: null as React.Context<unknown> | null, focusContext: null as React.Context<boolean | undefined> | null,
  value: { isFocused: () => true, addListener: () => () => {} },
  remove: vi.fn(), headingRemove: vi.fn(), cameraGranted: false, cameraQueries: vi.fn(),
}));

vi.mock('expo-router', async () => {
  // Exercise the installed SDK hooks. Their CJS dependencies need Node's module
  // cache rather than an ESM hook mock; only navigation contexts/ref are fixtures.
  const { createRequire, Module } = await import('node:module');
  const require = createRequire(import.meta.url);
  const core = require('expo-router/build/react-navigation/core/useNavigation');
  const focus = require('expo-router/build/react-navigation/core/useIsFocused');
  navigation.context = require('expo-router/build/react-navigation/core/NavigationContext').NavigationContext;
  navigation.focusContext = focus.IsFocusedContext;
  const restore: (() => void)[] = [];
  try {
    for (const id of ['expo-router/build/useFocusEffect', 'expo-router/build/link/useLoadedNavigation']) {
      const path = require.resolve(id);
      const previous = require.cache[path];
      delete require.cache[path];
      restore.push(() => { if (previous) require.cache[path] = previous; else delete require.cache[path]; });
    }
    for (const [id, exports] of [
      ['expo-router/build/react-navigation/native', core],
      ['expo-router/build/useNavigation', core],
      ['expo-router/build/global-state/router-store', { store: { navigationRef: navigation.ref } }],
    ] as const) {
      const path = require.resolve(id);
      const previous = require.cache[path];
      const replacement = new Module(path);
      replacement.exports = exports; replacement.loaded = true;
      require.cache[path] = replacement;
      restore.push(() => { if (previous) require.cache[path] = previous; else delete require.cache[path]; });
    }
    return { useFocusEffect: require('expo-router/build/useFocusEffect').useFocusEffect, useIsFocused: focus.useIsFocused };
  } finally { restore.reverse().forEach((undo) => undo()); }
});
vi.mock('./service', () => ({
  requestLocationPermission: vi.fn(async () => ({ granted: true, canAskAgain: true })),
  isLocationEnabled: vi.fn(async () => true), getCurrentCoordinates: vi.fn(),
  subscribeToLocation: vi.fn(async () => ({ remove: navigation.remove })),
  subscribeToHeading: vi.fn(async () => ({ remove: navigation.headingRemove })),
}));
vi.mock('@/lib/use-app-active', () => ({ useAppActive: () => navigation.active }));
vi.mock('expo-camera', async () => {
  const { createElement, useCallback, useEffect, useState } = await import('react');
  return {
    CameraView: (props: Record<string, unknown>) => createElement('video', props),
    useCameraPermissions: (options?: { get?: boolean }) => {
      const [permission, setPermission] = useState<{ granted: boolean; canAskAgain: boolean } | null>(null);
      const get = useCallback(async () => {
        navigation.cameraQueries();
        const response = { granted: navigation.cameraGranted, canAskAgain: true };
        setPermission(response); return response;
      }, []);
      useEffect(() => { if (options?.get !== false) void get(); }, [get, options?.get]);
      return [permission, get, get];
    },
  };
});
vi.mock('react-native', () => ({ View: 'view', Text: 'text', Alert: { alert: vi.fn() }, Linking: { openSettings: vi.fn() },
  StyleSheet: { create: (styles: unknown) => styles, absoluteFill: {} } }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('@/features/settings/provider', () => ({ useSettings: () => ({ activationRadiusMeters: 100 }) }));
vi.mock('@/ui/shared', async () => {
  const { createElement } = await import('react');
  return { Screen: 'screen', Notice: 'notice', Action: (props: Record<string, unknown>) => createElement('button', props) };
});

let tree: ReactTestRenderer | undefined;
let current: ReturnType<typeof useDeviceLocation>;
const fix: Awaited<ReturnType<typeof getCurrentCoordinates>> = { coords: {
  latitude: 11, longitude: 124, accuracy: 8, altitude: null, altitudeAccuracy: null, heading: null, speed: null,
}, timestamp: 1 };
function Probe() {
  const location = useDeviceLocation();
  React.useEffect(() => { current = location; }, [location]);
  return null;
}
function render(child = React.createElement(Probe)) {
  return React.createElement(navigation.context!.Provider, { value: navigation.value },
    React.createElement(navigation.focusContext!.Provider, { value: navigation.focused }, child));
}
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true, __DEV__: false });
  vi.useFakeTimers();
  navigation.active = true; navigation.focused = true; navigation.ref.current = null;
  navigation.remove.mockClear(); navigation.headingRemove.mockClear(); navigation.cameraQueries.mockClear(); navigation.cameraGranted = false;
  vi.mocked(subscribeToLocation).mockReset().mockResolvedValue({ remove: navigation.remove });
  vi.mocked(subscribeToHeading).mockReset().mockResolvedValue({ remove: navigation.headingRemove });
  vi.mocked(requestLocationPermission).mockClear();
  vi.mocked(getCurrentCoordinates).mockReset().mockResolvedValue(fix);
  const original = console.error;
  vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    if (!String(args[0]).startsWith('react-test-renderer is deprecated')) original(...args);
  });
});
afterEach(async () => { await act(async () => tree?.unmount()); tree = undefined; vi.clearAllTimers(); vi.useRealTimers(); vi.restoreAllMocks(); });

it('starts GPS for a focused SDK route before the navigation container ref is assigned', async () => {
  await act(async () => { tree = create(render()); });
  expect(requestLocationPermission).toHaveBeenCalledOnce();
  expect(current.status).toBe('ready');
});
it('starts the GPS deadline even while the SDK navigation container ref is pending', async () => {
  vi.mocked(getCurrentCoordinates).mockImplementation(() => new Promise(() => {}));
  await act(async () => { tree = create(render()); });
  await act(async () => { await vi.advanceTimersByTimeAsync(15000); });
  expect(current.errorCode).toBe('timeout');
  expect(current.status).toBe('error');
});
it('stops GPS immediately when the SDK route context loses focus', async () => {
  navigation.ref.current = navigation.value;
  await act(async () => { tree = create(render()); });
  expect(current.status).toBe('ready');
  navigation.focused = false;
  await act(async () => { tree!.update(render()); });
  expect(navigation.remove).toHaveBeenCalledOnce();
});
it('refreshes camera permission after foreground return without a ready container ref', async () => {
  await act(async () => { tree = create(render(React.createElement(ArScreen))); });
  expect(navigation.cameraQueries).toHaveBeenCalledOnce();
  expect(tree!.root.findAllByType('video')).toHaveLength(0);
  navigation.active = false;
  await act(async () => { tree!.update(render(React.createElement(ArScreen))); });
  navigation.cameraGranted = true; navigation.active = true;
  await act(async () => { tree!.update(render(React.createElement(ArScreen))); });
  expect(navigation.cameraQueries).toHaveBeenCalledTimes(2);
  expect(tree!.root.findAllByType('video')).toHaveLength(1);
});

it('retires camera, GPS and compass on tab blur, then restarts on return with pending navigation readiness', async () => {
  navigation.cameraGranted = true;
  await act(async () => { tree = create(render(React.createElement(ArScreen))); });
  expect(tree!.root.findAllByType('video')).toHaveLength(1);
  navigation.focused = false;
  await act(async () => { tree!.update(render(React.createElement(ArScreen))); });
  expect(tree!.root.findAllByType('video')).toHaveLength(0);
  expect(navigation.remove).toHaveBeenCalledOnce();
  expect(navigation.headingRemove).toHaveBeenCalledOnce();
  navigation.focused = true;
  await act(async () => { tree!.update(render(React.createElement(ArScreen))); });
  expect(tree!.root.findAllByType('video')).toHaveLength(1);
  expect(subscribeToLocation).toHaveBeenCalledTimes(2);
  expect(subscribeToHeading).toHaveBeenCalledTimes(2);
  await act(async () => { tree!.unmount(); }); tree = undefined;
  expect(navigation.remove).toHaveBeenCalledTimes(2);
  expect(navigation.headingRemove).toHaveBeenCalledTimes(2);
});

it('cleans up GPS and compass even when native subscription setup finishes after leaving the AR tab', async () => {
  const gps = Promise.withResolvers<Awaited<ReturnType<typeof subscribeToLocation>>>();
  const compass = Promise.withResolvers<Awaited<ReturnType<typeof subscribeToHeading>>>();
  vi.mocked(subscribeToLocation).mockReturnValue(gps.promise);
  vi.mocked(subscribeToHeading).mockReturnValue(compass.promise);
  await act(async () => { tree = create(render(React.createElement(ArScreen))); });
  navigation.focused = false;
  await act(async () => { tree!.update(render(React.createElement(ArScreen))); });
  await act(async () => { gps.resolve({ remove: navigation.remove }); compass.resolve({ remove: navigation.headingRemove }); });
  expect(navigation.remove).toHaveBeenCalledOnce();
  expect(navigation.headingRemove).toHaveBeenCalledOnce();
  expect(tree!.root.findAllByType('video')).toHaveLength(0);
});

vi.mock('@/features/ar/ar-discovery', async () => {
  const { createElement, Fragment } = await import('react');
  return { ArDiscovery: ({ preview, cameraStatus }: { preview: React.ReactNode; cameraStatus: React.ReactNode }) => createElement(Fragment, null, preview, cameraStatus) };
});
