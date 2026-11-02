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
  transitions: new Map<string, Set<(event: { data: { closing: boolean } }) => void>>(), get: vi.fn(), request: vi.fn(), support: vi.fn(), getItem: vi.fn(), setItem: vi.fn(), gallery: vi.fn(), audio: vi.fn(), load: vi.fn(), gate: vi.fn(), screenshot: vi.fn(),
}));
vi.mock('./holographic-assets', () => ({ holographicAssets: { glint: 108, frame: 101, overview: 102, history: 103, highlights: 104, 'visitor-notes': 105, facts: 106, chapter: 107 } }));
vi.mock('@/lib/use-app-active', () => ({ useAppActive: () => native.active }));
vi.mock('@/features/auth/provider', () => ({ useAuth: () => ({ session: native.principal ? { user: { id: native.principal } } : null }) }));
vi.mock('@react-native-async-storage/async-storage', () => ({ default: { getItem: native.getItem, setItem: native.setItem } }));
vi.mock('expo-camera', () => ({ Camera: { getCameraPermissionsAsync: native.get, requestCameraPermissionsAsync: native.request } }));
vi.mock('@/features/settings/provider', () => ({ useSettings: () => ({ systemVoice: true, soundEffects: true }) }));
vi.mock('./intro-emblem-asset', () => ({ introEmblemAsset: 1 }));
vi.mock('./development-audio-loader', () => ({ loadDevelopmentSystemAudio: native.audio }));
vi.mock('./development-gallery-loader', () => ({ loadDevelopmentGalleryContent: native.gallery }));
vi.mock('./ring-loader', () => ({ loadRingScene: native.load }));
vi.mock('@/features/ar-photo/ar-photo-controls', async () => { const R = await import('react'); return { ArPhotoControls: (props: Record<string, unknown>) => R.createElement('photo-controls', props) }; });
vi.mock('expo-router', async () => {
  const require = createRequire(import.meta.url); const focus = require('expo-router/build/react-navigation/core/useIsFocused');
  native.context = require('expo-router/build/react-navigation/core/NavigationContext').NavigationContext; native.focusContext = focus.IsFocusedContext;
  return { useNavigation: require('expo-router/build/react-navigation/core/useNavigation').useNavigation, useIsFocused: focus.useIsFocused,
    router: { push: vi.fn(), back: vi.fn(), canGoBack: () => true, navigate: vi.fn() } };
});
vi.mock('@reactvision/react-viro', async () => {
  const R = await import('react');
  return { ViroSound: 'viro-sound', ViroARScene: 'native-scene', ViroQuad: 'quad', ViroText: 'viro-text', ViroImage: 'viro-image',
    ViroNode: R.forwardRef((props: { children?: React.ReactNode }, ref) => { R.useImperativeHandle(ref, () => ({ setNativeProps: vi.fn() })); return R.createElement('node', props, props.children); }),
    ViroARSceneNavigator: R.forwardRef((props: { initialScene: { scene: () => React.JSX.Element } }, ref) => {
      R.useImperativeHandle(ref, () => ({ arSceneNavigator: { takeScreenshot: native.screenshot } }), []);
      return R.createElement('native-navigator', props, R.createElement(props.initialScene.scene));
    }),
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
it.each(['en', 'ja', 'ko'])('opens bounded %s help without remounting the camera and fences retained native actions', async locale => {
  await translations.changeLanguage(locale); await mount(); await layout(); await start(); await ready();
  const camera = cameras()[0]; const retained = node('ring-tile-history').props.onClick;
  await press('destinationRing.help');
  expect(copy()).toContain(translations.t('destinationStories.helpTitle'));
  expect(node('ring-tile-history').props.onClick).toBeUndefined();
  await act(async () => retained()); expect(node('ring-focused-panel')).toBeUndefined();
  expect(cameras()[0]).toBe(camera);
  expect(tree!.root.findAllByType('photo-controls' as React.ElementType)).toHaveLength(0);
  await press('destinationStories.dismissHelp');
  await ready(); await click('ring-tile-history'); await finish();
  expect(node('ring-focused-panel')).toBeDefined();
  expect(native.support).toHaveBeenCalledOnce();
});
it('bounds the complete top utility stack to the measured short scene and keeps one scroll owner', async () => {
  await mount(); await layout(); await start(); await ready();
  await act(async () => tree!.root.findByProps({ testID: 'destination-ar-scene' }).props.onLayout({ nativeEvent: { layout: { width: 320, height: 360 } } }));
  await press('destinationRing.help');
  await act(async () => tree!.root.findByType('native-scene' as React.ElementType).props.onTrackingUpdated(2, 1));
  const top = tree!.root.findAllByType('safe-area' as React.ElementType).find(node => node.props.testID === 'ar-top-utilities')!;
  expect(top.props.style.maxHeight).toBe(360);
  const body = tree!.root.findByProps({ testID: 'ar-utility-body' });
  expect(body.findAllByProps({ testID: 'ar-help' })).toHaveLength(1);
  expect(body.findAllByProps({ accessibilityLabel: translations.t('destinationStories.dismissHelp') }).length).toBeGreaterThan(0);
  expect(cameras()).toHaveLength(1);
});
it('hands photo capture only to the current live navigator and retires the old frame callback on background', async () => {
  await mount(); await layout(); expect(tree!.root.findAllByType('photo-controls' as React.ElementType)).toHaveLength(0);
  await start(); await ready();
  const photo = tree!.root.findByType('photo-controls' as React.ElementType); expect(photo.props.running).toBe(true);
  native.screenshot.mockResolvedValueOnce({ success: true, url: '/synthetic.jpg', errorCode: -1 });
  const capture = photo.props.capture;
  await capture('synthetic-photo'); expect(native.screenshot).toHaveBeenCalledWith('synthetic-photo', false);
  const key = photo.props.sessionKey;
  await active(false); expect(tree!.root.findAllByType('photo-controls' as React.ElementType)).toHaveLength(0);
  expect((await capture('retired-photo')).errorCode).toBe(6); expect(native.screenshot).toHaveBeenCalledOnce();
  await active(true); await settle(); await ready();
  expect(tree!.root.findByType('photo-controls' as React.ElementType).props.sessionKey).not.toBe(key);
});
it.each(['UNSUPPORTED', 'SUPPORTED', 'TRANSIENT', 'UNKNOWN', 'FAILED', 'MISSING'])('offers fallback only for definite native incapability: %s', async result => {
  if (result === 'MISSING') delete nativeUi.modules.VRTARSceneNavigatorModule;
  else native.support.mockImplementation(callback => callback(result));
  await mount(() => React.createElement(DestinationArSessionExperience, { identity, freshEligible: native.gate, unsupportedFallback: React.createElement('fallback-reader') }));
  expect(tree!.root.findAllByType('fallback-reader' as React.ElementType)).toHaveLength(0);
  await layout(); await start();
  expect(tree!.root.findAllByType('fallback-reader' as React.ElementType)).toHaveLength(result === 'UNSUPPORTED' ? 1 : 0);
  if (result === 'UNSUPPORTED') { expect(native.get).not.toHaveBeenCalled(); expect(cameras()).toHaveLength(0); expect(native.load).not.toHaveBeenCalled(); }
});
function node(id: string) { return tree!.root.findAllByType('node' as React.ElementType).find(value => value.props.testID === id)!; }
async function click(id: string) { await act(async () => node(id).props.onClick?.()); }
function text(id: string) { return tree!.root.findAllByType('viro-text' as React.ElementType).find(value => value.props.testID === id)!.props.text as string; }
async function ready(position = [0, 2, 0], forward = [0, 0, -1], settleIntro = true) {
  await act(async () => { const scene = tree!.root.findByType('native-scene' as React.ElementType); scene.props.onTrackingUpdated(3, 1); scene.props.onCameraTransformUpdate({ position, forward }); });
  if (settleIntro) { await act(async () => { await vi.advanceTimersByTimeAsync(650); }); await act(async () => tree!.root.findAllByType('native-scene' as React.ElementType)[0]?.props.onCameraTransformUpdate({ position, forward })); }
}
async function finish() { await act(async () => node('ring-focused-panel').props.animation.onFinish()); }
async function active(value: boolean) { native.active = value; await update(); await settle(); }
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true, __DEV__: true }); vi.stubEnv('EXPO_PUBLIC_VIRO_SPIKE', '1'); vi.useFakeTimers(); vi.setSystemTime(1000);
  native.active = native.focused = native.eligible = true; native.reduced = false; native.principal = 'owner'; native.transitions.clear();
  vi.spyOn(Reanimated, 'useReducedMotion').mockImplementation(() => native.reduced);
  native.get.mockReset().mockResolvedValue(granted); native.request.mockReset().mockResolvedValue({ ...granted, granted: false, status: 'denied' });
  native.screenshot.mockReset(); native.audio.mockReset().mockResolvedValue(null); native.gallery.mockReset().mockImplementation(async () => (await import('./development-ring-content')).developmentRingContent);
  native.support.mockReset().mockImplementation(callback => callback('SUPPORTED')); nativeUi.modules.VRTARSceneNavigatorModule = { isARSupportedOnDevice: native.support };
  native.getItem.mockReset().mockImplementation(async key => key.startsWith('argala.ar-') ? 'complete' : null); native.setItem.mockReset().mockResolvedValue(undefined);
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
  expect(node('ring-focused-panel').props.position).toEqual([7.5, 3, 4]); expect(text('ring-page-indicator')).toBe(page);
  expect(native.getItem).toHaveBeenCalledTimes(2); expect(native.get).toHaveBeenCalledTimes(2); expect(native.request).not.toHaveBeenCalled(); expect(native.gate).not.toHaveBeenCalled();
  await act(async () => oldTracking(2, 1)); expect(copy()).not.toContain(translations.t('destinationAr.trackingLost'));
});
it('restores the same approved image and caption page through the real screen session owner', async () => {
  const approved = (value: string) => ({ value, approvalReference: 'Synthetic test only' });
  const media = { id: 'test-cover', source: 1, credit: 'Test credit', approvalReference: 'test', rightsReference: 'test', alt: { en: approved('Test image') }, caption: { en: approved('Complete synthetic caption '.repeat(20)) } };
  child = () => <DestinationArSessionExperience identity={identity} freshEligible={native.gate} content={[{ id: 'overview', role: 'overview', approved: { title: { en: approved('Test chapter') }, body: { en: approved('Complete body') }, media: [media] } }]} />;
  await mount(); await layout(); await start(); await ready(); await click('ring-tile-overview'); await finish(); await click('ring-action-next');
  const caption = text('ring-gallery-caption'); const page = text('ring-page-indicator');
  await active(false); await active(true); await ready([6, 3, 4], [1, 0, 0]);
  expect(tree!.root.findByProps({ testID: 'ring-gallery-image' }).props.source).toBe(1);
  expect(text('ring-gallery-caption')).toBe(caption); expect(text('ring-page-indicator')).toBe(page);
});
it('starts full native deployment only after ready and makes Skip settle to interactive canonical slots', async () => {
  native.getItem.mockResolvedValue(null); await mount(); await layout(); await start(); expect(node('ring-tile-overview')).toBeUndefined();
  expect(native.setItem).not.toHaveBeenCalled();
  await ready([0, 2, 0], [0, 0, -1], false);
  expect(node('cinematic-emblem')).toBeDefined(); expect(node('cinematic-history')).toBeDefined();
  await click('ring-tile-history'); expect(node('ring-focused-panel')).toBeUndefined();
  await press('destinationSession.skip'); expect(node('cinematic-history')).toBeUndefined();
  await ready(); await click('ring-tile-history'); expect(node('ring-focused-panel')).toBeDefined();
  expect(native.setItem).toHaveBeenCalledWith('argala.ar-cinematic.v1:development:development-aclc', 'complete');
});
it('skips staged reveal for reduced motion while retaining the native content boundary', async () => {
  native.reduced = true; native.getItem.mockResolvedValue(null); await mount(); await layout(); await start(); await ready();
  expect(node('ring-tile-history')).toBeDefined(); await click('ring-tile-history'); await finish();
  expect(tree!.root.findAllByType('safe-area' as React.ElementType).flatMap(area => area.findAllByType('text')).flatMap(value => value.children).join(' ')).not.toContain('This is development sample text');
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
  await ready([9, 2, 1], [0, 0, 1]); expect(node('ring-focused-panel').props.position).toEqual([9, 2, 2.5]); expect(text('ring-page-indicator')).toBe(page);
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
it('keeps local earned-progress recovery feedback visible after tracking-ready', async()=>{
 await mount(()=>React.createElement(DestinationArSessionExperience,{identity,freshEligible:native.gate,progressFeedback:React.createElement('text',null,'journal-save-recovery')}));await layout();await start();await ready();expect(copy()).toContain('journal-save-recovery');
});

it('deploys a return entrance briefly and settles immediately on tracking loss without replay', async () => {
  native.getItem.mockImplementation(async key => key.startsWith('argala.ar-') ? 'complete' : null);
  await mount(); await layout(); await start(); await ready([0, 2, 0], [0, 0, -1], false);
  expect(node('cinematic-history')).toBeDefined();
  await act(async () => { await vi.advanceTimersByTimeAsync(649); });
  expect(node('ring-tile-history').props.onClick).toBeUndefined();
  await act(async () => { await vi.advanceTimersByTimeAsync(1); }); await ready();
  expect(node('cinematic-history')).toBeUndefined();
  await click('ring-tile-history'); await finish();
  const transform = node('ring-focused-panel').props.position;
  await act(async () => tree!.root.findByType('native-scene' as React.ElementType).props.onTrackingUpdated(2, 1));
  await ready(); expect(node('cinematic-history')).toBeUndefined();
  expect(node('ring-focused-panel').props.position).toEqual(transform);
});
it('keeps the same native navigator while retrying an intro-history storage failure during deployment', async () => {
  native.getItem.mockImplementation(async key => { if (key.startsWith('argala.ar-cinematic')) throw new Error('PRIVATE'); return null; });
  await mount(); await layout(); await start(); await ready([0, 2, 0], [0, 0, -1], false);
  const camera = cameras()[0]; const read = Promise.withResolvers<string | null>(); native.getItem.mockReturnValue(read.promise);
  await act(async () => { void tree!.root.findAllByType('button').find(node => node.props.accessibilityLabel === translations.t('common.retry'))!.props.onPress(); });
  expect(cameras()[0]).toBe(camera);
  await act(async () => read.resolve(null)); expect(cameras()[0]).toBe(camera);
});

it.each(['en', 'ja', 'ko'])('loads development samples before native startup with localized %s failure and explicit retry', async locale => {
  await translations.changeLanguage(locale);
  const pending = Promise.withResolvers<never>(); native.gallery.mockReturnValueOnce(pending.promise);
  await mount(() => React.createElement(SessionRoute));
  expect(copy()).toContain(translations.t('common.loading'));
  expect(native.getItem).not.toHaveBeenCalled(); expect(native.support).not.toHaveBeenCalled(); expect(native.load).not.toHaveBeenCalled();
  await act(async () => pending.reject(new Error('PRIVATE_ASSET_ERROR')));
  expect(copy()).toContain(translations.t('destinationRing.contentFailed')); expect(copy()).not.toContain('PRIVATE_ASSET_ERROR');
  await act(async () => { await translations.changeLanguage(locale === 'en' ? 'ja' : 'en'); });
  expect(copy()).toContain(translations.t('destinationRing.contentFailed')); expect(native.gallery).toHaveBeenCalledOnce();
  await press('common.retry'); expect(native.gallery).toHaveBeenCalledTimes(2);
  await layout(); await start(); await ready(); expect(cameras()).toHaveLength(1);
});
it('retires development sample completion when its principal leaves', async () => {
  const pending = Promise.withResolvers<never>(); native.gallery.mockReturnValueOnce(pending.promise);
  await mount(() => React.createElement(SessionRoute)); native.principal = null; await update();
  await act(async () => pending.reject(new Error('RETIRED_ASSET_ERROR')));
  expect(copy()).toContain(translations.t('destinationAr.unavailable')); expect(copy()).not.toContain(translations.t('destinationRing.contentFailed'));
  expect(native.getItem).not.toHaveBeenCalled(); expect(native.support).not.toHaveBeenCalled();
});

it.each(['en', 'ja', 'ko'])('previews the full development entrance in %s without clearing history or replaying on tracking recovery', async locale => {
  await translations.changeLanguage(locale);
  await mount(() => React.createElement(SessionRoute)); await layout();
  await press('destinationStories.previewEntrance'); await settle(); await ready([0, 2, 0], [0, 0, -1], false);
  expect(tree!.root.findAllByType('node' as React.ElementType).filter(item => item.props.testID === 'cinematic-emblem')).toHaveLength(1);
  await act(async () => { await vi.advanceTimersByTimeAsync(3000); });
  expect(tree!.root.findAllByType('node' as React.ElementType).filter(item => item.props.testID === 'cinematic-emblem')).toHaveLength(0);
  await act(async () => tree!.root.findByType('native-scene' as React.ElementType).props.onTrackingUpdated(2, 1));
  await ready(); expect(tree!.root.findAllByType('node' as React.ElementType).filter(item => item.props.testID === 'cinematic-emblem')).toHaveLength(0);
  expect(native.setItem).not.toHaveBeenCalledWith(expect.stringContaining('ar-cinematic'), expect.anything());
});

it('keeps the development entrance preview out of verified destination admission', async () => {
  await mount(() => React.createElement(DestinationArSessionExperience, { identity: { ...identity, provenance: 'verified' }, freshEligible: native.gate }));
  expect(tree!.root.findAllByProps({ accessibilityLabel: translations.t('destinationStories.previewEntrance') })).toHaveLength(0);
  expect(native.get).not.toHaveBeenCalled(); expect(native.support).not.toHaveBeenCalled();
});

const auditionClip = (source: number) => ({ source, rightsReference: 'Synthetic rights', approvalReference: 'Synthetic audition request only', previewOnly: true as const });
const auditionManifest = { voices: { en: auditionClip(201), ja: auditionClip(202), ko: auditionClip(203) }, effects: { deployed: auditionClip(204), focused: auditionClip(205), trackingLost: auditionClip(206), pageChanged: auditionClip(207), closed: auditionClip(208) } };
it.each(['en', 'ja', 'ko'])('auditions %s voice on explicit full preview and plays event effects without stale native finishes interrupting them', async locale => {
  native.audio.mockResolvedValue(auditionManifest); await translations.changeLanguage(locale);
  await mount(() => React.createElement(SessionRoute)); await layout(); await press('destinationStories.previewEntrance'); await settle(); await ready([0, 2, 0], [0, 0, -1], false);
  const sound = () => tree!.root.findAllByType('viro-sound' as React.ElementType)[0];
  expect(sound().props.source).toBe(auditionManifest.voices[locale as 'en' | 'ja' | 'ko'].source);
  const oldFinish = sound().props.onFinish; await act(async () => oldFinish());
  await act(async () => { await vi.advanceTimersByTimeAsync(3000); });
  expect(sound().props.source).toBe(204); await act(async () => sound().props.onFinish());
  await ready(); await click('ring-tile-history'); await finish(); expect(sound().props.source).toBe(205);
  await act(async () => oldFinish()); expect(sound().props.source).toBe(205);
  await act(async () => sound().props.onFinish()); await click('ring-action-next'); expect(sound().props.source).toBe(207);
  await act(async () => sound().props.onFinish()); await click('ring-action-close'); await finish(); expect(sound().props.source).toBe(208);
  await active(false); expect(sound()).toBeUndefined();
});
it('keeps failed optional audition loading from blocking native entry or exposing diagnostic messages', async () => {
  native.audio.mockRejectedValue(new Error('PRIVATE_AUDIO_ERROR'));
  await mount(() => React.createElement(SessionRoute)); await layout(); await start(); await ready();
  expect(cameras()).toHaveLength(1); expect(copy()).not.toContain('PRIVATE_AUDIO_ERROR');
});
it('starts AR while optional audio is pending and accepts late effects without remounting or speaking late', async () => {
  const pending = Promise.withResolvers<typeof auditionManifest>(); native.audio.mockReturnValueOnce(pending.promise);
  await mount(() => React.createElement(SessionRoute)); await layout(); await start(); await ready();
  const camera = cameras()[0];
  await act(async () => pending.resolve(auditionManifest)); expect(cameras()[0]).toBe(camera);
  expect(tree!.root.findAllByType('viro-sound' as React.ElementType)).toHaveLength(0);
  await click('ring-tile-history'); await finish();
  expect(tree!.root.findByType('viro-sound' as React.ElementType).props.source).toBe(205);
});
