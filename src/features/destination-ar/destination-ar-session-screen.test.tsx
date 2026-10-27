import { nativeUi, withHeroUI } from '@/test/native-ui';
import * as React from 'react';
import * as Reanimated from 'react-native-reanimated';
import { createRequire } from 'node:module';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { createInstance, type i18n } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { localizationOptions } from '@/i18n/options';
import SessionRoute, { DestinationArSessionExperience } from './destination-ar-session-screen';
import { ViroRingRoute } from './dev-entry';
import { router } from 'expo-router';
const native = vi.hoisted(() => ({ active: true, focused: true, reduced: false, eligible: true,
  principal: 'owner' as string | null, context: null as React.Context<unknown> | null, focusContext: null as React.Context<boolean | undefined> | null,
  transitions: new Map<string, Set<(event: { data: { closing: boolean } }) => void>>(), get: vi.fn(), request: vi.fn(), support: vi.fn(), getItem: vi.fn(), setItem: vi.fn(), load: vi.fn(), gate: vi.fn(),
}));
vi.mock('@/lib/use-app-active', () => ({ useAppActive: () => native.active }));
vi.mock('@/features/auth/provider', () => ({ useAuth: () => ({ session: native.principal ? { user: { id: native.principal } } : null }) }));
vi.mock('@react-native-async-storage/async-storage', () => ({ default: { getItem: native.getItem, setItem: native.setItem } }));
vi.mock('expo-camera', () => ({ Camera: { getCameraPermissionsAsync: native.get, requestCameraPermissionsAsync: native.request } }));
vi.mock('./ring-loader', () => ({ loadRingScene: native.load }));
vi.mock('expo-router', async () => {
  const require = createRequire(import.meta.url); const focus = require('expo-router/build/react-navigation/core/useIsFocused');
  native.context = require('expo-router/build/react-navigation/core/NavigationContext').NavigationContext; native.focusContext = focus.IsFocusedContext;
  return { useNavigation: require('expo-router/build/react-navigation/core/useNavigation').useNavigation, useIsFocused: focus.useIsFocused,
    router: { push: vi.fn(), back: vi.fn(), canGoBack: () => true, navigate: vi.fn() } };
});
vi.mock('@reactvision/react-viro', async () => {
  const R = await import('react');
  return { ViroARScene: 'native-scene', ViroQuad: 'quad', ViroText: 'viro-text',
    ViroNode: R.forwardRef((props: { children?: React.ReactNode }, ref) => { R.useImperativeHandle(ref, () => ({ setNativeProps: vi.fn() })); return R.createElement('node', props, props.children); }),
    ViroARSceneNavigator: (props: { initialScene: { scene: () => React.JSX.Element } }) => R.createElement('native-navigator', props, R.createElement(props.initialScene.scene)),
    ViroMaterials: { createMaterials: vi.fn() }, ViroAnimations: { registerAnimations: vi.fn() }, ViroTrackingStateConstants: { TRACKING_UNAVAILABLE: 1, TRACKING_LIMITED: 2, TRACKING_NORMAL: 3 } };
});
const identity = { admissionId: 'development-entry', destinationId: 'development-aclc', principalId: 'owner', provenance: 'development' as const };
const granted = { granted: true, canAskAgain: true, status: 'granted', expires: 'never' };
const navigation = { isFocused: () => native.focused, addListener: (name: string, callback: (event: { data: { closing: boolean } }) => void) => {
  const set = native.transitions.get(name) ?? new Set(); native.transitions.set(name, set); set.add(callback); return () => set.delete(callback);
} };
let tree: ReactTestRenderer | undefined; let translations: i18n; let child: () => React.ReactElement;
function wrapper() { return React.createElement(I18nextProvider, { i18n: translations }, withHeroUI(React.createElement(native.context!.Provider, { value: navigation }, React.createElement(native.focusContext!.Provider, { value: native.focused }, child())))); }
async function mount(element?: () => React.ReactElement) { if (element) child = element; await act(async () => { tree = create(wrapper()); }); }
async function update() { await act(async () => tree!.update(wrapper())); }
async function layout() { await act(async () => tree!.root.findByProps({ testID: 'destination-ar-scene' }).props.onLayout({ nativeEvent: { layout: { width: 360, height: 800 } } })); }
async function press(key: string) { await act(async () => tree!.root.findAllByType('button').find(node => node.props.accessibilityLabel === translations.t(key))!.props.onPress()); }
async function settle() { await act(async () => { await vi.dynamicImportSettled(); }); }
async function start() { await press('destinationAr.start'); await settle(); }
const cameras = () => tree!.root.findAllByType('native-navigator' as React.ElementType);
const copy = () => JSON.stringify(tree!.toJSON());
function node(id: string) { return tree!.root.findAllByType('node' as React.ElementType).find(value => value.props.testID === id)!; }
async function click(id: string) { await act(async () => node(id).props.onClick?.()); }
function text(id: string) { return tree!.root.findAllByType('viro-text' as React.ElementType).find(value => value.props.testID === id)!.props.text as string; }
async function ready(position = [0, 2, 0], forward = [0, 0, -1]) {
  await act(async () => { const scene = tree!.root.findByType('native-scene' as React.ElementType); scene.props.onTrackingUpdated(3, 1); scene.props.onCameraTransformUpdate({ position, forward }); });
}
async function finish() { await act(async () => node('ring-focused-panel').props.animation.onFinish()); }
async function active(value: boolean) { native.active = value; await update(); await settle(); }
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true, __DEV__: true }); vi.stubEnv('EXPO_PUBLIC_VIRO_SPIKE', '1'); vi.useFakeTimers(); vi.setSystemTime(1000);
  native.active = native.focused = native.eligible = true; native.reduced = false; native.principal = 'owner'; native.transitions.clear();
  vi.spyOn(Reanimated, 'useReducedMotion').mockImplementation(() => native.reduced);
  native.get.mockReset().mockResolvedValue(granted); native.request.mockReset().mockResolvedValue({ ...granted, granted: false, status: 'denied' });
  native.support.mockReset().mockImplementation(callback => callback('SUPPORTED')); nativeUi.modules.VRTARSceneNavigatorModule = { isARSupportedOnDevice: native.support };
  native.getItem.mockReset().mockImplementation(async key => key === 'argala.ar-introduction.v1' ? 'complete' : null); native.setItem.mockReset().mockResolvedValue(undefined);
  native.gate.mockReset().mockImplementation(() => native.eligible); native.load.mockReset().mockImplementation(async () => (await import('./destination-ring-scene')).DestinationRingSceneHost);
  translations = createInstance(); await translations.use(initReactI18next).init({ ...localizationOptions, resources: structuredClone(localizationOptions.resources), lng: 'en', react: { useSuspense: false } });
  child = () => React.createElement(DestinationArSessionExperience, { identity, freshEligible: native.gate });
  const original = console.error; vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => { if (!String(args[0]).startsWith('react-test-renderer is deprecated')) original(...args); });
});
afterEach(async () => { await act(async () => tree?.unmount()); tree = undefined; vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });
it.each([false, true])('guards M3 release/disabled entry before storage, permissions or loading (development=%s)', async development => {
  Object.assign(globalThis, { __DEV__: development }); vi.stubEnv('EXPO_PUBLIC_VIRO_SPIKE', development ? '0' : '1');
  await mount(() => React.createElement(ViroRingRoute)); expect(copy()).toContain(translations.t('destinationAr.unavailable'));
  expect(native.getItem).not.toHaveBeenCalled(); expect(native.get).not.toHaveBeenCalled(); expect(native.load).not.toHaveBeenCalled();
});
it('resolves lazy native code before final eligibility and waits for installed stack transition readiness', async () => {
  const module = Promise.withResolvers<typeof import('./destination-ring-scene').DestinationRingSceneHost>(); native.load.mockReturnValueOnce(module.promise);
  await mount(); await layout(); await act(async () => native.transitions.get('transitionStart')?.forEach(cb => cb({ data: { closing: false } })));
  await press('destinationAr.start'); expect(native.gate).not.toHaveBeenCalled(); expect(cameras()).toHaveLength(0);
  native.eligible = false; await act(async () => module.resolve((await import('./destination-ring-scene')).DestinationRingSceneHost)); await settle();
  expect(native.gate).not.toHaveBeenCalled(); await act(async () => native.transitions.get('transitionEnd')?.forEach(cb => cb({ data: { closing: false } })));
  expect(native.gate).toHaveBeenCalledOnce(); expect(cameras()).toHaveLength(0); expect(copy()).toContain(translations.t('destinationAr.errors.entry-ineligible'));
});
it('releases rendering on background, restores logical panel/page/size from a new pose and avoids duplicate preference reads', async () => {
  await mount(); await layout(); await start(); await ready(); native.gate.mockClear(); await click('ring-tile-history'); await finish(); await click('ring-action-next'); await click('ring-action-larger');
  const page = text('ring-page-indicator'); const oldTracking = tree!.root.findByType('native-scene' as React.ElementType).props.onTrackingUpdated;
  await active(false); expect(cameras()).toHaveLength(0); native.eligible = false;
  await act(async () => native.transitions.get('transitionStart')?.forEach(cb => cb({ data: { closing: false } })));
  await active(true); expect(cameras()).toHaveLength(0);
  await act(async () => native.transitions.get('transitionEnd')?.forEach(cb => cb({ data: { closing: false } }))); await settle(); await ready([6, 3, 4], [1, 0, 0]);
  expect(node('ring-focused-panel').props.position).toEqual([7.15, 3, 4]); expect(text('ring-page-indicator')).toBe(page);
  expect(native.getItem).toHaveBeenCalledTimes(2); expect(native.get).toHaveBeenCalledTimes(2); expect(native.request).not.toHaveBeenCalled(); expect(native.gate).not.toHaveBeenCalled();
  await act(async () => oldTracking(2, 1)); expect(copy()).not.toContain(translations.t('destinationAr.trackingLost'));
});
it('stages the first reveal only after ready, pauses on loss and makes Skip explicit', async () => {
  native.getItem.mockResolvedValue(null); await mount(); await layout(); await start(); expect(node('ring-tile-overview')).toBeUndefined();
  await ready(); expect(node('ring-tile-overview')).toBeDefined(); expect(node('ring-tile-history')).toBeUndefined();
  await act(async () => { await vi.advanceTimersByTimeAsync(600); }); expect(node('ring-tile-history')).toBeDefined(); await click('ring-tile-history'); expect(node('ring-focused-panel')).toBeUndefined();
  await act(async () => tree!.root.findByType('native-scene' as React.ElementType).props.onTrackingUpdated(2, 1));
  await act(async () => { await vi.advanceTimersByTimeAsync(2000); }); expect(node('ring-tile-facts')).toBeUndefined();
  await press('destinationSession.skip'); expect(node('ring-tile-facts')).toBeDefined();
  await ready(); await click('ring-tile-history'); expect(node('ring-focused-panel')).toBeDefined();
  expect(native.setItem).toHaveBeenCalledWith('argala.ar-introduction.v1', 'complete');
});
it('skips staged reveal for reduced motion while retaining the native content boundary', async () => {
  native.reduced = true; native.getItem.mockResolvedValue(null); await mount(); await layout(); await start(); await ready();
  expect(node('ring-tile-history')).toBeDefined(); await click('ring-tile-history'); await finish();
  expect(tree!.root.findByType('safe-area' as React.ElementType).findAllByType('text').flatMap(value => value.children).join(' ')).not.toContain('This is development sample text');
});
it('does not auto-restart initial or recovering installation interruptions', async () => {
  await mount(); await layout(); await start(); await active(false); await active(true);
  expect(cameras()).toHaveLength(0); expect(native.support).toHaveBeenCalledOnce(); await press('common.retry'); await settle(); await ready();
  await active(false); await active(true); expect(cameras()).toHaveLength(1); const calls = native.support.mock.calls.length;
  await active(false); await active(true); expect(cameras()).toHaveLength(0); expect(native.support).toHaveBeenCalledTimes(calls);
});
it('rechecks revoked grants on live resume without prompting', async () => {
  await mount(); await layout(); await start(); await ready(); await active(false);
  native.get.mockResolvedValue({ ...granted, granted: false, canAskAgain: false, status: 'denied' }); await active(true);
  expect(cameras()).toHaveLength(0); expect(native.request).not.toHaveBeenCalled(); expect(copy()).toContain(translations.t('destinationAr.permission'));
});
it('keeps permission-attempt ownership outside the navigator and requires explicit retry after settlement', async () => {
  native.get.mockResolvedValue({ ...granted, granted: false, status: 'denied' });
  const request = Promise.withResolvers<typeof granted>(); native.request.mockReturnValueOnce(request.promise);
  await mount(); await layout(); await start(); await press('camera.allow'); await active(false); await active(true);
  await act(async () => request.resolve(granted)); expect(cameras()).toHaveLength(0); expect(native.request).toHaveBeenCalledOnce();
  native.get.mockResolvedValue(granted); await press('common.retry'); await settle(); expect(cameras()).toHaveLength(1);
});
it('expires at five minutes, prevents fresh remote entry and closes before Exit navigation', async () => {
  await mount(); await layout(); await start(); await ready(); await active(false); native.eligible = false;
  await act(async () => { await vi.advanceTimersByTimeAsync(300000); }); await active(true); expect(cameras()).toHaveLength(0);
  expect(copy()).toContain(translations.t('destinationSession.expired')); expect(cameras()).toHaveLength(0);
  await press('destinationAr.exit'); expect(router.back).toHaveBeenCalled();
});
it('keys real route ownership by authentication identity and never revives the former native frame', async () => {
  await mount(() => React.createElement(SessionRoute)); await layout(); await start(); await ready();
  native.principal = 'other-owner'; await update(); expect(cameras()).toHaveLength(0); expect(copy()).toContain(translations.t('destinationAr.idle'));
  expect(native.support).toHaveBeenCalledOnce(); native.principal = null; await update(); expect(cameras()).toHaveLength(0); expect(copy()).toContain(translations.t('destinationAr.unavailable'));
});
it.each(['en', 'ja', 'ko'])('maps %s entry/setup failures and language changes to real resources with explicit recovery', async locale => {
  await translations.changeLanguage(locale); native.eligible = false; await mount(); await layout(); await start();
  expect(copy()).toContain(translations.t('destinationAr.errors.entry-ineligible'));
  await act(async () => { await translations.changeLanguage(locale === 'en' ? 'ja' : 'en'); }); expect(copy()).toContain(translations.t('destinationAr.errors.entry-ineligible'));
  native.eligible = true; native.support.mockImplementationOnce(() => { throw new Error('PRIVATE_NATIVE_ERROR'); });
  await press('common.retry'); expect(copy()).toContain(translations.t('destinationAr.errors.failed')); expect(copy()).not.toContain('PRIVATE_NATIVE_ERROR');
  await press('common.retry'); await settle(); expect(cameras()).toHaveLength(1);
});
it('retires lazy-load rejection after blur instead of reviving an abandoned attempt', async () => {
  const module = Promise.withResolvers<never>(); native.load.mockReturnValueOnce(module.promise);
  await mount(); await layout(); await press('destinationAr.start'); await active(false); await active(true);
  await act(async () => module.reject(new Error('PRIVATE_BUNDLE_FAILURE'))); expect(cameras()).toHaveLength(0); expect(copy()).not.toContain('PRIVATE_BUNDLE_FAILURE');
  expect(copy()).toContain(translations.t('destinationAr.interrupted'));
});

it('uses the installed focus snapshot and releases rendering through navigation blur and delayed return', async () => {
  native.focused = false; await mount(); await layout(); await press('destinationAr.start'); expect(native.support).not.toHaveBeenCalled();
  native.focused = true; await update(); await start(); await ready(); native.focused = false; await update(); expect(cameras()).toHaveLength(0);
  await act(async () => native.transitions.get('transitionStart')?.forEach(cb => cb({ data: { closing: false } })));
  native.focused = true; await update(); expect(cameras()).toHaveLength(0);
  await act(async () => native.transitions.get('transitionEnd')?.forEach(cb => cb({ data: { closing: false } }))); await settle(); expect(cameras()).toHaveLength(1);
});
it('closes a live admission before Exit even when navigation disposal is delayed', async () => {
  await mount(); await layout(); await start(); await ready(); const oldReady = tree!.root.findByType('native-scene' as React.ElementType).props.onCameraTransformUpdate;
  await press('destinationAr.exit'); expect(cameras()).toHaveLength(0); expect(router.back).toHaveBeenCalled();
  await act(async () => oldReady({ position: [10, 2, 0], forward: [1, 0, 0] })); expect(cameras()).toHaveLength(0);
  const checks = native.support.mock.calls.length; await press('common.retry'); expect(native.support).toHaveBeenCalledTimes(checks);
});
it('bounds delayed native code loading and rejects a late completion without granting admission', async () => {
  const module = Promise.withResolvers<typeof import('./destination-ring-scene').DestinationRingSceneHost>(); native.load.mockReturnValueOnce(module.promise);
  await mount(); await layout(); await press('destinationAr.start'); expect(cameras()).toHaveLength(0);
  await act(async () => { await vi.advanceTimersByTimeAsync(20000); }); expect(copy()).toContain(translations.t('destinationAr.errors.startup-timeout'));
  await act(async () => module.resolve((await import('./destination-ring-scene')).DestinationRingSceneHost)); await settle(); expect(cameras()).toHaveLength(0); expect(native.gate).not.toHaveBeenCalled();
});
it('maps an active module failure to a localized fallback and permits explicit recovery', async () => {
  native.load.mockRejectedValueOnce(new Error('PRIVATE_MODULE_ERROR')); await mount(); await layout(); await start();
  expect(copy()).toContain(translations.t('destinationAr.errors.failed')); expect(copy()).not.toContain('PRIVATE_MODULE_ERROR');
  await press('common.retry'); await settle(); expect(cameras()).toHaveLength(1);
});
it.each(['destinationId', 'admissionId'] as const)('invalidates restoration when %s changes within a retained owner', async field => {
  let selectedIdentity = identity; await mount(() => React.createElement(DestinationArSessionExperience, { identity: selectedIdentity, freshEligible: native.gate }));
  await layout(); await start(); await ready(); await active(false); selectedIdentity = { ...identity, [field]: 'other-development' }; await active(true);
  expect(cameras()).toHaveLength(0); expect(native.support).toHaveBeenCalledOnce();
});

it.each(['en', 'ja', 'ko'])('offers %s explicit Retry for prolonged tracking loss and restores the panel in a fresh native frame', async locale => {
  await translations.changeLanguage(locale);
  expect(translations.getResource(locale, 'translation', 'destinationSession.retryTracking')).toBeTruthy();
  await mount(); await layout(); await start(); await ready(); native.gate.mockClear(); await click('ring-tile-history'); await finish(); await click('ring-action-next');
  const page = text('ring-page-indicator'); await act(async () => tree!.root.findByType('native-scene' as React.ElementType).props.onTrackingUpdated(2, 1));
  await act(async () => { await vi.advanceTimersByTimeAsync(6000); }); expect(native.support).toHaveBeenCalledOnce(); expect(cameras()).toHaveLength(1);
  native.eligible = false; await press('destinationSession.retryTracking'); await settle(); expect(node('ring-focused-panel')).toBeUndefined();
  await ready([9, 2, 1], [0, 0, 1]); expect(node('ring-focused-panel').props.position).toEqual([9, 2, 2.15]); expect(text('ring-page-indicator')).toBe(page);
  expect(native.gate).not.toHaveBeenCalled(); expect(native.get).toHaveBeenCalledTimes(2); expect(native.request).not.toHaveBeenCalled();
});
it('does not automatically repeat an interrupted explicit tracking recovery', async () => {
  await mount(); await layout(); await start(); await ready(); await act(async () => tree!.root.findByType('native-scene' as React.ElementType).props.onTrackingUpdated(1, 1));
  await press('destinationSession.retryTracking'); await settle(); expect(cameras()).toHaveLength(1); await active(false); await active(true);
  expect(cameras()).toHaveLength(0); expect(native.support).toHaveBeenCalledTimes(2); await press('common.retry'); await settle(); expect(native.support).toHaveBeenCalledTimes(3);
});
it('waits for fresh route eligibility before its first native mount, then retains the established exemption', async () => {
 let entryReady = false; const established = vi.fn();
 child = () => <DestinationArSessionExperience identity={identity} freshEligible={() => native.eligible} entryReady={entryReady} onEstablished={established} />;
 await mount(); await layout(); await start();
 expect(cameras()).toHaveLength(0);
 entryReady = true; await update(); await ready();
 expect(established).toHaveBeenCalledOnce(); expect(cameras()).toHaveLength(1);
 entryReady = false; native.eligible = false; await update();
 expect(cameras()).toHaveLength(1);
});
it('retires interrupted initial mounting instead of automatically recreating a pending native view', async () => {
 let entryReady = true;
 child = () => <DestinationArSessionExperience identity={identity} freshEligible={() => native.eligible} entryReady={entryReady} />;
 await mount(); await layout(); await start(); expect(cameras()).toHaveLength(1);
 entryReady = false; await update(); expect(cameras()).toHaveLength(0);
 entryReady = true; await update(); expect(cameras()).toHaveLength(0);
 await press('common.retry'); await settle(); expect(cameras()).toHaveLength(1);
});
it('cannot promote pending startup to live when fresh eligibility fails at first tracking-ready', async () => {
 const established = vi.fn(); child = () => <DestinationArSessionExperience identity={identity} freshEligible={() => native.eligible} onEstablished={established} />;
 await mount(); await layout(); await start(); native.eligible = false; await ready();
 expect(established).not.toHaveBeenCalled(); expect(cameras()).toHaveLength(0);
});
it.each(['en', 'ko', 'ja'])('offers a fresh map handoff instead of an unrecoverable expired Retry in %s', async language => {
 const returned = vi.fn(); const exited = vi.fn(); await translations.changeLanguage(language);
 child = () => <DestinationArSessionExperience identity={identity} freshEligible={() => native.eligible} onReturn={returned} onExit={exited} />;
 await mount(); await layout(); await start(); await ready(); await active(false);
 await act(async () => { vi.advanceTimersByTime(300000); }); await active(true);
 expect(copy()).toContain(translations.t('destinationSession.expired'));
 expect(tree!.root.findAllByType('button').some(button => button.props.accessibilityLabel === translations.t('common.retry'))).toBe(false);
 expect(cameras()).toHaveLength(0);
 await press('arrival.returnToMap'); expect(returned).toHaveBeenCalledOnce(); expect(exited).toHaveBeenCalledOnce();
});
