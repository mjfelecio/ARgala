import * as React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import ArScreen from './ar-screen';
const controls = vi.hoisted(() => ({ permission: { granted: true, canAskAgain: true } as { granted: boolean; canAskAgain: boolean } | null, active: true, focused: true, getPermission: vi.fn(), requestPermission: vi.fn() }));
vi.mock('expo-camera', async () => {
  const { createElement } = await import('react');
  const CameraView = Object.assign((props: Record<string, unknown>) => createElement('video', props), {
    // Matches SDK 57 Android: the web-only native method is unavailable.
    isAvailableAsync: async () => { throw new Error('Native camera availability API is unavailable'); },
  });
  return { CameraView, useCameraPermissions: () => [controls.permission, controls.requestPermission, controls.getPermission] };
});
vi.mock('expo-router', async () => {
  const { useEffect } = await import('react');
  return { useIsFocused: () => controls.focused, useFocusEffect: (callback: () => void) => useEffect(callback, [callback]) };
});
vi.mock('react-native', () => ({ View: 'view', Text: 'text', StyleSheet: { create: (styles: unknown) => styles, absoluteFill: {} } }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('@/features/settings/provider', () => ({ useSettings: () => ({ activationRadiusMeters: 100 }) }));
vi.mock('@/features/location/use-device-location', () => ({ useDeviceLocation: () => ({ headingStatus: 'ready', position: null, accuracy: null, heading: null }) }));
vi.mock('@/features/location/status', () => ({ LocationStatus: () => null, SystemSettingsAction: () => null }));
vi.mock('@/lib/use-app-active', () => ({ useAppActive: () => controls.active }));
vi.mock('@/ui/shared', async () => {
  const { createElement } = await import('react');
  return { Screen: 'screen', Notice: 'notice', Action: ({ title, onPress }: { title: string; onPress: () => void }) => createElement('button', { title, onPress }) };
});
let tree: ReactTestRenderer | undefined;
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true, __DEV__: false });
  controls.permission = { granted: true, canAskAgain: true }; controls.active = true; controls.focused = true;
  controls.getPermission.mockReset().mockResolvedValue(controls.permission); controls.requestPermission.mockReset().mockResolvedValue(controls.permission);
  const original = console.error;
  vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => { if (!String(args[0]).startsWith('react-test-renderer is deprecated')) original(...args); });
});
afterEach(async () => { await act(async () => tree?.unmount()); tree = undefined; vi.restoreAllMocks(); });
it('mounts the Android preview when permission is granted without a web availability API', async () => {
  await act(async () => { tree = create(React.createElement(ArScreen)); });
  expect(tree!.root.findAllByType('video')).toHaveLength(1);
});
it('shows and recovers from an initial camera permission lookup failure', async () => {
  controls.permission = null; controls.getPermission.mockRejectedValue(new Error('native permission lookup failed'));
  await act(async () => { tree = create(React.createElement(ArScreen)); });
  const retry = tree!.root.findAllByType('button').find((button) => button.props.title === 'common.retry');
  expect(retry).toBeDefined();
  controls.getPermission.mockImplementation(async () => { controls.permission = { granted: true, canAskAgain: true }; return controls.permission; });
  await act(async () => { retry!.props.onPress(); });
  expect(controls.getPermission).toHaveBeenCalledTimes(2);
  expect(tree!.root.findAllByType('video')).toHaveLength(1);
});
it('unmounts preview while backgrounded or unfocused', async () => {
  controls.active = false;
  await act(async () => { tree = create(React.createElement(ArScreen)); });
  expect(tree!.root.findAllByType('video')).toHaveLength(0);
  controls.active = true; await act(async () => { tree!.update(React.createElement(ArScreen)); });
  expect(tree!.root.findAllByType('video')).toHaveLength(1);
  controls.focused = false; await act(async () => { tree!.update(React.createElement(ArScreen)); });
  expect(tree!.root.findAllByType('video')).toHaveLength(0);
});
