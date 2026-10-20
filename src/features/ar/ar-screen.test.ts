import * as React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import ArScreen from './ar-screen';
const controls = vi.hoisted(() => ({ permission: { granted: true, canAskAgain: true } as { granted: boolean; canAskAgain: boolean } | null,
  active: true, activateDuringSubscribe: false, focused: true, getPermission: vi.fn(), requestPermission: vi.fn(), listeners: new Set<(state: string) => void>() }));
vi.mock('expo-camera', async () => {
  const { createElement, useCallback, useState } = await import('react');
  const CameraView = Object.assign((props: Record<string, unknown>) => createElement('video', props), {
    // Matches SDK 57 Android: the web-only native method is unavailable.
    isAvailableAsync: async () => { throw new Error('Native camera availability API is unavailable'); },
  });
  return { CameraView, useCameraPermissions: () => {
    const [permission, setPermission] = useState(controls.permission);
    const request = useCallback(async () => { const result = await controls.requestPermission(); setPermission(result); return result; }, []);
    const get = useCallback(async () => { const result = await controls.getPermission(); setPermission(result); return result; }, []);
    return [permission, request, get];
  } };
});
vi.mock('expo-router', async () => {
  const { useEffect } = await import('react');
  return { useIsFocused: () => controls.focused, useFocusEffect: (callback: () => void) => useEffect(callback, [callback]) };
});
vi.mock('react-native', () => ({ View: 'view', Text: 'text', StyleSheet: { create: (styles: unknown) => styles, absoluteFill: {} }, AppState: {
  get currentState() { return controls.active ? 'active' : 'background'; },
  addEventListener: (_event: string, listener: (state: string) => void) => {
    if (controls.activateDuringSubscribe) controls.active = true;
    controls.listeners.add(listener);
    return { remove: () => controls.listeners.delete(listener) };
  },
} }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('@/features/settings/provider', () => ({ useSettings: () => ({ activationRadiusMeters: 100 }) }));
vi.mock('@/features/location/use-device-location', () => ({ useDeviceLocation: () => ({ headingStatus: 'ready', position: null, accuracy: null, heading: null }) }));
vi.mock('@/features/location/status', () => ({ LocationStatus: () => null, SystemSettingsAction: () => null }));
vi.mock('@/ui/shared', async () => {
  const { createElement } = await import('react');
  return { Screen: 'screen', Notice: 'notice', Action: ({ title, onPress }: { title: string; onPress: () => void }) => createElement('button', { title, onPress }) };
});
let tree: ReactTestRenderer | undefined;
async function mount() {
 await act(async()=>{tree=create(React.createElement(ArScreen));});
 await act(async()=>tree!.root.findByProps({testID:'ar-scene'}).props.onLayout({nativeEvent:{layout:{width:360,height:800}}}));
}

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true, __DEV__: false });
  controls.permission = { granted: true, canAskAgain: true }; controls.active = true; controls.focused = true;
  controls.activateDuringSubscribe = false; controls.listeners.clear();
  controls.getPermission.mockReset().mockImplementation(async () => controls.permission); controls.requestPermission.mockReset().mockImplementation(async () => controls.permission);
  const original = console.error;
  vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => { if (!String(args[0]).startsWith('react-test-renderer is deprecated')) original(...args); });
});
afterEach(async () => { await act(async () => tree?.unmount()); tree = undefined; vi.restoreAllMocks(); });
it('mounts the Android preview when permission is granted without a web availability API', async () => {
  await mount();
  expect(tree!.root.findAllByType('video')).toHaveLength(1);
});
it('shows and recovers from an initial camera permission lookup failure', async () => {
  controls.permission = null; controls.getPermission.mockRejectedValue(new Error('native permission lookup failed'));
  await mount();
  const retry = tree!.root.findAllByType('button').find((button) => button.props.title === 'common.retry');
  expect(retry).toBeDefined();
  controls.getPermission.mockImplementation(async () => { controls.permission = { granted: true, canAskAgain: true }; return controls.permission; });
  await act(async () => { retry!.props.onPress(); });
  expect(controls.getPermission).toHaveBeenCalledTimes(2);
  expect(tree!.root.findAllByType('video')).toHaveLength(1);
});
it('unmounts preview while backgrounded or unfocused', async () => {
  controls.active = false;
  await mount();
  expect(tree!.root.findAllByType('video')).toHaveLength(0);
  controls.active = true; await act(async () => { controls.listeners.forEach((listener) => listener('active')); });
  expect(tree!.root.findAllByType('video')).toHaveLength(1);
  controls.focused = false; await act(async () => { tree!.update(React.createElement(ArScreen)); });
  expect(tree!.root.findAllByType('video')).toHaveLength(0);
});
it('opens an already-permitted camera without reopening after a foreground subscription race', async () => {
  controls.active = false; controls.activateDuringSubscribe = true;
  await mount();
  expect(tree!.root.findAllByType('video')).toHaveLength(1);
  expect(controls.getPermission).toHaveBeenCalledOnce();
});
it('opens the preview immediately after granting camera permission', async () => {
  controls.permission = { granted: false, canAskAgain: true };
  controls.requestPermission.mockImplementation(async () => { controls.permission = { granted: true, canAskAgain: true }; return controls.permission; });
  await mount();
  expect(tree!.root.findAllByType('video')).toHaveLength(0);
  await act(async () => { tree!.root.findAllByType('button').find((button) => button.props.title === 'camera.allow')!.props.onPress(); });
  expect(tree!.root.findAllByType('video')).toHaveLength(1);
});

vi.mock('@/features/ar/ar-discovery', async () => {
  const { createElement, Fragment } = await import('react');
  return { ArDiscovery: ({ cameraStatus }: { cameraStatus: React.ReactNode }) => createElement(Fragment, null, cameraStatus) };
});

it('keeps development camera UI free of raw sensor state while retaining permission guidance', async () => {
  Object.assign(globalThis, { __DEV__: true });
  controls.permission = { granted: false, canAskAgain: true };
  await mount();
  const output = JSON.stringify(tree!.toJSON());
  expect(output).toContain('camera.permission');
  expect(output).not.toMatch(/sensorDebug|permissionGranted|headingStatus|activationRadiusMeters/);
});

it('waits for positive root bounds before mounting the native camera', async()=>{
 await act(async()=>{tree=create(React.createElement(ArScreen));});
 expect(tree!.root.findAllByType('video')).toHaveLength(0);
 const scene=tree!.root.findByProps({testID:'ar-scene'});
 await act(async()=>scene.props.onLayout({nativeEvent:{layout:{width:360,height:0}}}));
 expect(tree!.root.findAllByType('video')).toHaveLength(0);
 await act(async()=>scene.props.onLayout({nativeEvent:{layout:{width:360,height:800}}}));
 expect(tree!.root.findByType('video').props.style).toMatchObject({width:360,height:800});
});
