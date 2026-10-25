import { nativeUi, withHeroUI } from '@/test/native-ui';
import * as React from 'react';
import { createRequire } from 'node:module';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { createInstance, type i18n } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { localizationOptions } from '@/i18n/options';
import DestinationArScreen from './destination-ar-screen';
import { ViroSpikeRoute, ViroSpikeLaunch } from './dev-entry';
import { router } from 'expo-router';

const native = vi.hoisted(() => ({
  active: true, focused: true, context: null as React.Context<unknown> | null,
  focusContext: null as React.Context<boolean | undefined> | null,
  transitions: new Map<string, Set<(e: { data: { closing: boolean } }) => void>>(),
  get: vi.fn(), request: vi.fn(), support: vi.fn(),
}));
vi.mock('@/lib/use-app-active', () => ({ useAppActive: () => native.active }));
vi.mock('expo-camera', () => ({ Camera: { getCameraPermissionsAsync: native.get, requestCameraPermissionsAsync: native.request } }));
vi.mock('expo-router', async () => {
  const require = createRequire(import.meta.url);
  const core = require('expo-router/build/react-navigation/core/useNavigation');
  const focus = require('expo-router/build/react-navigation/core/useIsFocused');
  native.context = require('expo-router/build/react-navigation/core/NavigationContext').NavigationContext;
  native.focusContext = focus.IsFocusedContext;
  return { useNavigation: core.useNavigation, useIsFocused: focus.useIsFocused,
    router: { push: vi.fn(), back: vi.fn(), canGoBack: () => true, navigate: vi.fn() } };
});
// Only the native renderer is replaced. The screen, controller, permission/support
// adapter, installed SDK hooks, shared controls and actual locale resources run.
vi.mock('@reactvision/react-viro', () => ({
  ViroARScene: 'native-scene', ViroNode: 'node', ViroQuad: 'quad', ViroText: 'viro-text',
  ViroARSceneNavigator: (props: { initialScene: { scene: () => React.JSX.Element } }) => React.createElement('native-navigator', props, React.createElement(props.initialScene.scene)),
  ViroMaterials: { createMaterials: vi.fn() },
  ViroTrackingStateConstants: { TRACKING_UNAVAILABLE: 1, TRACKING_LIMITED: 2, TRACKING_NORMAL: 3 },
}));

const navigation = { isFocused: () => native.focused, addListener: (name: string, callback: (e: { data: { closing: boolean } }) => void) => {
  const listeners = native.transitions.get(name) ?? new Set(); native.transitions.set(name, listeners); listeners.add(callback);
  return () => listeners.delete(callback);
} };
let tree: ReactTestRenderer | undefined; let translations: i18n;
function wrapper(child: React.ReactNode) {
  return React.createElement(I18nextProvider, { i18n: translations }, withHeroUI(
    React.createElement(native.context!.Provider, { value: navigation }, React.createElement(native.focusContext!.Provider, { value: native.focused }, child))));
}
async function mount(child = React.createElement(DestinationArScreen)) { await act(async () => { tree = create(wrapper(child)); }); }
async function update() { await act(async () => tree!.update(wrapper(React.createElement(DestinationArScreen)))); }
async function layout() { await act(async () => tree!.root.findByProps({ testID: 'destination-ar-scene' }).props.onLayout({ nativeEvent: { layout: { width: 360, height: 800 } } })); }
async function press(key: string) { await act(async () => tree!.root.findAllByType('button').find(node => node.props.accessibilityLabel === translations.t(key))!.props.onPress()); }
const camera = () => tree!.root.findAllByType('native-navigator' as React.ElementType);
const copy = () => JSON.stringify(tree!.toJSON());
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true, __DEV__: true });
  vi.stubEnv('EXPO_PUBLIC_VIRO_SPIKE', '1'); vi.useFakeTimers();
  native.active = true; native.focused = true; native.transitions.clear();
  native.get.mockReset().mockResolvedValue({ granted: true, status: 'granted', canAskAgain: true, expires: 'never' });
  native.request.mockReset().mockResolvedValue({ granted: false, status: 'denied', canAskAgain: true, expires: 'never' });
  native.support.mockReset().mockImplementation(callback => callback('SUPPORTED'));
  nativeUi.modules.VRTARSceneNavigatorModule = { isARSupportedOnDevice: native.support };
  translations = createInstance();
  await translations.use(initReactI18next).init({ ...localizationOptions, lng: 'en', react: { useSuspense: false } });
  const original = console.error;
  vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => { if (!String(args[0]).startsWith('react-test-renderer is deprecated')) original(...args); });
});
afterEach(async () => { await act(async () => tree?.unmount()); tree = undefined; vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });

it.each([false, true])('protects dead development entry when dev=%s but the build/opt-in guard is incomplete', async development => {
  Object.assign(globalThis, { __DEV__: development });
  vi.stubEnv('EXPO_PUBLIC_VIRO_SPIKE', development ? '0' : '1');
  await mount(React.createElement(ViroSpikeRoute));
  expect(copy()).toContain(translations.t('destinationAr.unavailable'));
  expect(native.get).not.toHaveBeenCalled(); expect(native.support).not.toHaveBeenCalled(); expect(camera()).toHaveLength(0);
});
it('launches the opt-in spike from an explicit development action', async () => {
  await mount(React.createElement(ViroSpikeLaunch));
  await press('destinationAr.title');
  expect(router.push).toHaveBeenCalledWith('/viro-spike');
  expect(native.support).not.toHaveBeenCalled();
});
it('waits for explicit Start, measured bounds and native stack transition completion with installed focus hooks', async () => {
  await mount(); expect(native.support).not.toHaveBeenCalled();
  await act(async () => native.transitions.get('transitionStart')?.forEach(callback => callback({ data: { closing: false } })));
  await press('destinationAr.start'); await layout(); expect(camera()).toHaveLength(0);
  await act(async () => native.transitions.get('transitionEnd')?.forEach(callback => callback({ data: { closing: false } })));
  await act(async () => { await vi.dynamicImportSettled(); });
  expect(camera()).toHaveLength(1); expect(camera()[0].props.provider).toBe('none');
  const scene = tree!.root.findByType('native-scene' as React.ElementType);
  await act(async () => { scene.props.onTrackingUpdated(3, 1); scene.props.onCameraTransformUpdate({ position: [0, 0, 0], forward: [0, 0, -1] }); });
  expect(copy()).toContain(translations.t('destinationAr.live'));
  native.focused = false; await update(); expect(camera()).toHaveLength(0);
  native.focused = true; await update(); expect(camera()).toHaveLength(0);
  expect(copy()).toContain(translations.t('destinationAr.interrupted'));
});
it('does not remount or repeat AR-services startup after an initializing system-activity interruption', async () => {
  await mount(); await layout(); await press('destinationAr.start'); expect(camera()).toHaveLength(1);
  native.active = false; await update(); expect(camera()).toHaveLength(0);
  native.active = true; await update(); expect(camera()).toHaveLength(0);
  expect(native.support).toHaveBeenCalledOnce();
  await press('common.retry'); expect(camera()).toHaveLength(1); expect(native.support).toHaveBeenCalledTimes(2);
});
it.each(['en', 'ko', 'ja'])('renders %s permission failure, unknown fallback, recovery and live language changes from real resources', async language => {
  await translations.changeLanguage(language);
  await mount(); await layout();
  native.get.mockRejectedValueOnce(new Error('PRIVATE_NATIVE_MESSAGE'));
  await press('destinationAr.start');
  expect(translations.exists('destinationAr.errors.permission-failed')).toBe(true);
  expect(copy()).not.toContain('destinationAr.errors.');
  expect(copy()).toContain(translations.t('destinationAr.errors.permission-failed'));
  expect(copy()).not.toContain('PRIVATE_NATIVE_MESSAGE');
  native.support.mockImplementationOnce(() => { throw new Error('PRIVATE_SUPPORT_MESSAGE'); });
  await press('common.retry');
  expect(copy()).toContain(translations.t('destinationAr.errors.failed')); expect(copy()).not.toContain('PRIVATE_SUPPORT_MESSAGE');
  await act(async () => { await translations.changeLanguage(language === 'en' ? 'ja' : 'en'); });
  expect(copy()).toContain(translations.t('destinationAr.errors.failed'));
  await press('common.retry'); expect(camera()).toHaveLength(1);
});
it('shows denial/settings guidance and a bounded initialization failure without automatic retries', async () => {
  native.get.mockResolvedValue({ granted: false, canAskAgain: false, status: 'denied', expires: 'never' });
  await mount(); await layout(); await press('destinationAr.start');
  expect(copy()).toContain(translations.t('destinationAr.permission')); expect(native.request).not.toHaveBeenCalled();
  native.get.mockResolvedValue({ granted: true, canAskAgain: true, status: 'granted', expires: 'never' });
  await press('common.retry'); expect(camera()).toHaveLength(1);
  await act(async () => { await vi.advanceTimersByTimeAsync(20000); });
  expect(camera()).toHaveLength(0); expect(copy()).toContain(translations.t('destinationAr.errors.startup-timeout'));
  expect(native.support).toHaveBeenCalledTimes(2);
});
it('never prompts after Allow if its permission read finishes after SDK focus is lost', async () => {
  native.get.mockResolvedValueOnce({ granted: false, canAskAgain: true, status: 'undetermined', expires: 'never' });
  await mount(); await layout(); await press('destinationAr.start');
  const delayed = Promise.withResolvers<{ granted: boolean; canAskAgain: boolean; status: string; expires: string }>();
  native.get.mockReturnValueOnce(delayed.promise);
  await press('camera.allow');
  native.focused = false; await update();
  await act(async () => delayed.resolve({ granted: false, canAskAgain: true, status: 'denied', expires: 'never' }));
  expect(native.request).not.toHaveBeenCalled();
  native.focused = true; await update();
  expect(camera()).toHaveLength(0); expect(copy()).toContain(translations.t('destinationAr.interrupted'));
});

it.each([
  ['en', 'Hold the square briefly, then release to interact.', 'Hold, then release', 'Interaction received'],
  ['ko', '사각형을 잠시 누른 뒤 손을 떼어 상호작용하세요.', '길게 누른 뒤 떼기', '상호작용 확인됨'],
  ['ja', '四角形をしばらく押してから離すと操作できます。', '長押しして離す', '操作を確認'],
])('localizes %s hold guidance and completed native interaction feedback', async (language, guidance, action, received) => {
  await translations.changeLanguage(language);
  await mount(); await layout(); await press('destinationAr.start');
  await act(async () => { await vi.dynamicImportSettled(); });
  const scene = tree!.root.findByType('native-scene' as React.ElementType);
  await act(async () => {
    scene.props.onTrackingUpdated(3, 1);
    scene.props.onCameraTransformUpdate({ position: [0, 0, 0], forward: [0, 0, -1] });
  });
  expect(copy()).toContain(guidance);
  const label = () => tree!.root.findByType('viro-text' as React.ElementType).props.text as string;
  expect(label()).toContain(action);
  // The native renderer reports completion after release. This callback does
  // not simulate a touch duration or prove Viro's native gesture recognition.
  await act(async () => tree!.root.findByType('node' as React.ElementType).props.onClick());
  expect(label()).toContain(received);
  await act(async () => { await translations.changeLanguage(language === 'en' ? 'ja' : 'en'); });
  expect(label()).toBe(translations.t('destinationAr.squareTapped'));
  expect(copy()).toContain(translations.t('destinationAr.live'));
  await act(async () => tree!.root.findByType('node' as React.ElementType).props.onClick());
  expect(label()).toBe(translations.t('destinationAr.square'));
});
