import { withHeroUI } from '@/test/native-ui';
import * as React from 'react';
import { createRequire } from 'node:module';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { I18nextProvider } from 'react-i18next';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { SettingsProvider, useSettings } from './provider';
import { AuthProvider, useAuth } from '@/features/auth/provider';
import ProfileScreen from '@/features/navigation/profile-screen';
import SettingsScreen from './settings-screen';
import { AuthApiError } from '@supabase/supabase-js';
import { AppState, Linking } from 'react-native';
import { requestForegroundPermissionsAsync, watchPositionAsync, watchHeadingAsync, getCurrentPositionAsync } from 'expo-location';
import { Camera } from 'expo-camera';
import { Slider } from 'heroui-native/slider';
import { router } from 'expo-router';
import RootNavigation from '@/features/navigation/root-navigation';
import { queryClient } from '@/lib/query';

const boundary = vi.hoisted(() => ({ stored: null as string | null, getItem: vi.fn(), setItem: vi.fn(), focused: true,
  auth: { getSession: vi.fn(), onAuthStateChange: vi.fn(), signOut: vi.fn(), startAutoRefresh: vi.fn(), stopAutoRefresh: vi.fn() },
  authChanged: null as ((event: string, session: unknown) => void) | null,
  session: { user: { id: 'signed-in-user', email: 'traveler@example.com' } } as { user: { id: string; email?: string } } | null,
  version: '1.0.0' as string | undefined,
}));
vi.mock('@react-native-async-storage/async-storage', () => ({ default: { getItem: boundary.getItem, setItem: boundary.setItem } }));
vi.mock('expo-location', () => ({ requestForegroundPermissionsAsync: vi.fn(), watchPositionAsync: vi.fn(), watchHeadingAsync: vi.fn(), getCurrentPositionAsync: vi.fn() }));
vi.mock('expo-camera', () => ({ Camera: { requestCameraPermissionsAsync: vi.fn() } }));
vi.mock('@/features/arrival-reminders/native', () => ({ optionalNotifications: () => null, reminderNative: { available: () => false } }));
vi.mock('expo-localization', () => ({ getLocales: () => [{ languageTag: 'en' }] }));
vi.mock('@/lib/supabase', () => ({ getSupabase: () => ({ auth: boundary.auth }) }));
vi.mock('expo-constants', () => ({ default: { get expoConfig() { return { version: boundary.version }; } } }));
vi.mock('@/features/onboarding/provider', () => ({ useOnboarding: () => ({ status: 'completed' }) }));
vi.mock('expo-router', async () => {
  const { createRequire } = await import('node:module');
  const require = createRequire(import.meta.url);
  const Stack = Object.assign((props: React.PropsWithChildren) => React.createElement('stack', props), { Screen: (props: Record<string, unknown>) => React.createElement('route', props), Protected: ({ guard, children }: React.PropsWithChildren<{ guard: boolean }>) => guard ? children : null });
  return { Stack, useIsFocused: require('expo-router/build/react-navigation/core/useIsFocused').useIsFocused,
    router: { canGoBack: vi.fn(() => true), back: vi.fn(), navigate: vi.fn() } };
});
const require = createRequire(import.meta.url);
const { IsFocusedContext } = require('expo-router/build/react-navigation/core/useIsFocused');
const { NavigationContext } = require('expo-router/build/react-navigation/core/NavigationContext');
const navigation = { isFocused: () => boundary.focused, addListener: () => () => {} };
let tree: ReactTestRenderer | undefined;
let screen: 'tab' | 'stack';
let committed: ReturnType<typeof useSettings>;
function Probe() { const value = useSettings(); React.useEffect(() => { committed = value; }, [value]); return null; }
function AccountScreen() { const { session } = useAuth(); return <><RootNavigation />{session && (screen === 'tab' ? <ProfileScreen /> : <SettingsScreen />)}</>; }
function render() {
  return <I18nextProvider i18n={i18n}>{withHeroUI(<SettingsProvider><AuthProvider>
    <NavigationContext.Provider value={navigation}><IsFocusedContext.Provider value={boundary.focused}>
      <Probe /><AccountScreen />
    </IsFocusedContext.Provider></NavigationContext.Provider>
  </AuthProvider></SettingsProvider>)}</I18nextProvider>;
}
async function mount(entry: 'tab' | 'stack' = 'tab') { screen = entry; await act(async () => { tree = create(render()); }); }
async function redraw() { await act(async () => tree!.update(render())); }
const copy = () => JSON.stringify(tree!.toJSON());
const displayedRadius=()=>tree!.root.findAllByType('view').find(n=>n.props.role==='slider')!.props.accessibilityValue.now;
function button(key: string) { return tree!.root.findAllByType('button').find(node => node.props.accessibilityLabel === i18n.t(key))!; }
async function radius(value: string) { await act(async () => tree!.root.findByType(Slider).props.onChangeEnd(Number(value))); }
async function language(label: string) { await act(async () => tree!.root.findAllByType('button').find(node => node.props.accessibilityLabel === label)!.props.onPress()); }
async function save() { await act(async () => button('common.save').props.onPress()); }
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true, __DEV__: false });
  vi.clearAllMocks(); boundary.focused = true; boundary.stored = null; boundary.version = '1.0.0';
  boundary.session = { user: { id: 'signed-in-user', email: 'traveler@example.com' } };
  boundary.getItem.mockImplementation(async () => boundary.stored);
  boundary.setItem.mockImplementation(async (_key: string, raw: string) => { boundary.stored = raw; });
  boundary.auth.getSession.mockImplementation(async () => ({ data: { session: boundary.session }, error: null }));
  boundary.auth.onAuthStateChange.mockImplementation(callback => { boundary.authChanged = callback; return { data: { subscription: { unsubscribe: vi.fn() } } }; });
  boundary.auth.signOut.mockResolvedValue({ error: null });
  vi.mocked(Linking.openSettings).mockReset().mockResolvedValue();
  await i18n.changeLanguage('en');
  const original = console.error;
  vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => { if (!String(args[0]).startsWith('react-test-renderer is deprecated')) original(...args); });
});
afterEach(async () => { await act(async () => tree?.unmount()); tree = undefined; queryClient.clear(); vi.restoreAllMocks(); });
it.each(['tab', 'stack'] as const)('saves both draft preferences explicitly from %s and preserves 123 m after reopening', async entry => {
  boundary.stored=JSON.stringify({activationRadiusMeters:123,language:'en'});
  await mount(entry);
  expect(button('common.save').props.accessibilityState.disabled).toBe(true);
  await language('한국어');
  expect(i18n.language).toBe('en'); expect(boundary.setItem).not.toHaveBeenCalled();
  await save();
  expect(boundary.setItem).toHaveBeenCalledExactlyOnceWith('argala.preferences.v1', JSON.stringify({ activationRadiusMeters: 123, language: 'ko' }));
  expect(i18n.language).toBe('ko'); expect(copy()).toContain(i18n.t('common.saved'));
  await act(async () => tree!.unmount()); tree = undefined; await mount(entry);
  expect(displayedRadius()).toBe(123); expect(committed.language).toBe('ko');
  expect(button('common.save').props.accessibilityState.disabled).toBe(true);
});
it('offers only slider/presets with bounded values and requires explicit Save',async()=>{
 await mount();expect(tree!.root.findAllByType('input')).toHaveLength(0);
 await radius('1000');expect(displayedRadius()).toBe(1000);expect(boundary.setItem).not.toHaveBeenCalled();
 await save();expect(committed.activationRadiusMeters).toBe(1000);
});
it('guards same-tick double saves, waits for persistence and retains failed drafts for explicit retry', async () => {
  const pending = Promise.withResolvers<void>();
  boundary.setItem.mockReturnValueOnce(pending.promise);
  await mount(); await radius('200');
  const submit = button('common.save');
  await act(async () => { submit.props.onPress(); submit.props.onPress(); });
  expect(boundary.setItem).toHaveBeenCalledTimes(1);
  expect(copy()).not.toContain(i18n.t('common.saved'));
  expect(button('settings.saving').props.accessibilityState).toMatchObject({ busy: true, disabled: true });
  await act(async () => pending.reject(new Error('PRIVATE storage failure')));
  expect(displayedRadius()).toBe(200); expect(copy()).toContain(i18n.t('settings.saveFailed')); expect(copy()).not.toContain('PRIVATE');
  await act(async () => { await i18n.changeLanguage('ja'); });
  expect(copy()).toContain(i18n.t('settings.saveFailed'));
  await save(); expect(committed.activationRadiusMeters).toBe(200); expect(copy()).toContain(i18n.t('common.saved'));
});
it('drops unsaved edits on tab departure and starts pristine with installed focus hooks before navigation readiness', async () => {
  await mount(); await radius('500'); await language('日本語');
  boundary.focused = false; await redraw(); boundary.focused = true; await redraw();
  expect(displayedRadius()).toBe(100); expect(committed.language).toBe('en');
  expect(button('common.save').props.accessibilityState.disabled).toBe(true);
  expect(boundary.setItem).not.toHaveBeenCalled();
});
it('synchronizes an external save only when pristine and does not clobber dirty edits on rerender or language change', async () => {
  await mount();
  await act(async () => committed.save({ activationRadiusMeters: 123, language: 'ko' }));
  expect(displayedRadius()).toBe(123);
  await radius('500');
  await act(async () => committed.save({ activationRadiusMeters: 200, language: 'ja' }));
  await redraw(); expect(displayedRadius()).toBe(500);
  await save(); expect(committed).toMatchObject({ activationRadiusMeters: 500, language: 'ko' });
});
it.each(['ko', 'ja'])('relocalizes storage errors through actual %s resources', async locale => {
  boundary.getItem.mockRejectedValueOnce(new Error('PRIVATE disk failure'));
  await mount(); await radius('200');
  expect(copy()).toContain(i18n.t('settings.loadFailed'));
  await act(async () => { await i18n.changeLanguage(locale); });
  expect(copy()).toContain(i18n.t('settings.loadFailed')); expect(copy()).not.toContain('PRIVATE');
  await radius('1000'); await save(); expect(copy()).not.toContain(i18n.t('settings.loadFailed'));
});
it('shows no stale saved success after a subsequent edit', async () => {
  await mount(); await radius('200'); await save(); expect(copy()).toContain(i18n.t('common.saved'));
  await radius('500'); expect(copy()).not.toContain(i18n.t('common.saved')); expect(copy()).toContain(i18n.t('settings.unsaved'));
});

it.each(['tab', 'stack'] as const)('shows one compact title, real account/version and correct insets in %s', async entry => {
  await mount(entry);
  const titles = tree!.root.findAllByType('text').filter(node => node.props.children === i18n.t('settings.profileTitle'));
  expect(titles).toHaveLength(1);
  expect(copy()).toContain('traveler@example.com'); expect(copy()).toContain('1.0.0');
  expect(tree!.root.findAllByType('text').some(node => node.props.children === 'T')).toBe(true);
  expect(copy()).not.toContain('alex.explorer'); expect(copy()).not.toContain('v1.4.2'); expect(copy()).not.toContain('Terms');
  expect(tree!.root.findAllByType('safe-area' as React.ElementType).at(-1)!.props.edges).toEqual(entry === 'tab' ? ['top', 'left', 'right'] : ['top', 'bottom', 'left', 'right']);
  expect(Boolean(button('common.back'))).toBe(entry === 'stack');
});
it('uses a neutral account fallback and localized missing version', async () => {
  boundary.session = { user: { id: 'signed-in-user' } }; boundary.version = undefined;
  await mount(); expect(copy()).toContain(i18n.t('settings.emailUnavailable')); expect(copy()).toContain(i18n.t('settings.versionUnavailable'));
  expect(tree!.root.findAllByType('icon' as React.ElementType).some(node => node.props.name === 'person-outline')).toBe(true);
});
it('preserves stack Back and provides an Explore fallback for a direct link', async () => {
  await mount('stack'); await act(async () => button('common.back').props.onPress()); expect(router.back).toHaveBeenCalledOnce();
  vi.mocked(router.canGoBack).mockReturnValueOnce(false);
  await act(async () => button('common.back').props.onPress()); expect(router.navigate).toHaveBeenCalledWith('/');
});
it('opens system settings only on press, keeps failure localized and permits explicit recovery', async () => {
  vi.mocked(Linking.openSettings).mockRejectedValueOnce(new Error('PRIVATE native settings error'));
  await mount(); expect(Linking.openSettings).not.toHaveBeenCalled();
  await act(async () => button('common.openSettings').props.onPress());
  expect(copy()).toContain(i18n.t('common.settingsError')); expect(copy()).not.toContain('PRIVATE');
  await act(async () => { await i18n.changeLanguage('ja'); }); expect(copy()).toContain(i18n.t('common.settingsError'));
  await act(async () => button('common.openSettings').props.onPress());
  expect(Linking.openSettings).toHaveBeenCalledTimes(2); expect(copy()).not.toContain(i18n.t('common.settingsError'));
});
it.each([new AuthApiError('PRIVATE auth detail', 429, 'over_request_rate_limit'), new Error('PRIVATE unknown')])('keeps sign-out failures localized and retryable: %s', async failure => {
  boundary.auth.signOut.mockResolvedValueOnce({ error: failure });
  await mount(); await act(async () => button('auth.signOut').props.onPress());
  const key = failure instanceof AuthApiError ? 'auth.rateLimited' : 'auth.logoutFailed';
  expect(copy()).toContain(i18n.t(key)); expect(copy()).not.toContain('PRIVATE');
  await act(async () => { await i18n.changeLanguage('ko'); }); expect(copy()).toContain(i18n.t(key));
  expect(copy()).toContain('traveler@example.com');
  await act(async () => button('auth.signOut').props.onPress()); expect(boundary.auth.signOut).toHaveBeenCalledTimes(2); expect(copy()).not.toContain(i18n.t(key));
});
it('guards repeated sign-out, clears provider cache via the real auth callback and exposes only Sign In after success', async () => {
  const pending = Promise.withResolvers<{ error: null }>(); boundary.auth.signOut.mockReturnValueOnce(pending.promise);
  await mount();
  const logout = button('auth.signOut');
  await act(async () => { logout.props.onPress(); logout.props.onPress(); });
  expect(boundary.auth.signOut).toHaveBeenCalledTimes(1);
  expect(button('auth.signingOut').props.accessibilityState).toMatchObject({ busy: true, disabled: true });
  queryClient.setQueryData(['nearby'], { private: 'provider-cache' });
  await act(async () => { boundary.authChanged!('SIGNED_OUT', null); pending.resolve({ error: null }); });
  expect(queryClient.getQueryData(['nearby'])).toBeUndefined(); expect(copy()).not.toContain('traveler@example.com');
  expect(tree!.root.findAllByType('route' as React.ElementType).map(node => node.props.name)).toEqual(['sign-in']);
});
it.each([
  { locale: 'ko', back: '뒤로', device: '기기 설정 열기', failure: '설정을 열 수 없습니다. Android 설정에서 직접 열어 주세요.' },
  { locale: 'ja', back: '戻る', device: '端末の設定を開く', failure: '設定を開けません。Androidの設定から直接開いてください。' },
])('renders localized Back and device-settings recovery in $locale', async ({ locale, back, device, failure }) => {
  await mount('stack');
  await act(async () => { await i18n.changeLanguage(locale); });
  expect(tree!.root.findAllByType('button').some(node => node.props.accessibilityLabel === back)).toBe(true);
  const open = tree!.root.findAllByType('button').find(node => node.props.accessibilityLabel === device)!;
  expect(open).toBeDefined();
  vi.mocked(Linking.openSettings).mockRejectedValueOnce(new Error('PRIVATE'));
  await act(async () => open.props.onPress()); expect(copy()).toContain(failure);
});

it('waits for a pending Save through blur/refocus and shows no stale success after an abandoned screen', async () => {
  const pending = Promise.withResolvers<void>(); boundary.setItem.mockReturnValueOnce(pending.promise);
  await mount(); await radius('200'); await act(async () => button('common.save').props.onPress());
  boundary.focused = false; await redraw();
  await act(async () => pending.resolve());
  expect(copy()).not.toContain(i18n.t('common.saved'));
  boundary.focused = true; await redraw();
  expect(displayedRadius()).toBe(200); expect(button('common.save').props.accessibilityState.disabled).toBe(true);
  expect(boundary.setItem).toHaveBeenCalledTimes(1);
});
it('allows an already submitted save to finish after unmount without updating another screen draft', async () => {
  const pending = Promise.withResolvers<void>(); boundary.setItem.mockReturnValueOnce(pending.promise);
  await mount(); await radius('200'); await act(async () => button('common.save').props.onPress());
  // Keep the provider mounted while the route leaves, just as the parent stack does.
  boundary.session = null;
  await act(async () => boundary.authChanged!('SIGNED_OUT', null));
  await act(async () => pending.resolve());
  expect(committed.activationRadiusMeters).toBe(200);
  expect(copy()).not.toContain(i18n.t('common.saved'));
});
it('keeps mount, drafts, locale changes, refocus, foreground return and remount free of paid requests and sensors', async () => {
  const fetch = vi.spyOn(globalThis, 'fetch');
  const listeners: ((state: import('react-native').AppStateStatus) => void)[] = [];
  vi.spyOn(AppState, 'addEventListener').mockImplementation((_event, listener) => { listeners.push(listener); return { remove: vi.fn() }; });
  await mount(); await radius('200'); await language('한국어');
  await act(async () => { await i18n.changeLanguage('ja'); });
  boundary.focused = false; await redraw(); boundary.focused = true; await redraw();
  await act(async () => { listeners.forEach(listener => listener('background')); listeners.forEach(listener => listener('active')); });
  await act(async () => tree!.unmount()); tree = undefined; await mount();
  expect(fetch).not.toHaveBeenCalled(); expect(requestForegroundPermissionsAsync).not.toHaveBeenCalled();
  expect(watchPositionAsync).not.toHaveBeenCalled(); expect(watchHeadingAsync).not.toHaveBeenCalled(); expect(getCurrentPositionAsync).not.toHaveBeenCalled();
  expect(Camera.requestCameraPermissionsAsync).not.toHaveBeenCalled(); expect(boundary.setItem).not.toHaveBeenCalled();
});

it('commits a drag to the draft only on release, requires Save, and restores the saved radius', async () => {
  await mount();
  const gesture = () => tree!.root.findAllByType('gesture' as React.ElementType).find(node => node.props.gesture.kind === 'pan')!.props.gesture;
  await act(async () => {
    tree!.root.findByType(Slider.Track).findAllByType('view').find(node => node.props.onLayout)!.props.onLayout({ nativeEvent: { layout: { width: 300, height: 20 } } });
    tree!.root.findAllByType('view').find(node => node.props.role === 'slider')!.props.onLayout({ nativeEvent: { layout: { width: 20, height: 20 } } });
  });
  await act(async () => gesture().handlers.begin());
  await act(async () => gesture().handlers.update({ translationX: 28, translationY: 0 }));
  expect(displayedRadius()).toBe(200);
  expect(button('common.save').props.accessibilityState.disabled).toBe(true);
  expect(boundary.setItem).not.toHaveBeenCalled();
  await act(async () => gesture().handlers.finalize());
  expect(button('common.save').props.accessibilityState.disabled).toBe(false);
  expect(committed.activationRadiusMeters).toBe(100);
  await save();
  expect(committed.activationRadiusMeters).toBe(200);
  await act(async () => tree!.unmount()); tree = undefined; await mount();
  expect(displayedRadius()).toBe(200);
});
it('abandons an unfinished slider interaction on blur even when the parent draft never changed', async () => {
  await mount();
  const slider = () => tree!.root.findByType(Slider);
  await act(async () => slider().props.onChange(500));
  expect(displayedRadius()).toBe(500);
  boundary.focused = false; await redraw(); boundary.focused = true; await redraw();
  expect(displayedRadius()).toBe(100);
  expect(button('common.save').props.accessibilityState.disabled).toBe(true);
  expect(boundary.setItem).not.toHaveBeenCalled();
});

const sticky=()=>tree!.root.findAllByProps({testID:'settings-draft-actions'})[0];
async function measureSettings(viewport=600,top=1200,height=48){
 await act(async()=>{
  tree!.root.findByType('scroll' as React.ElementType).props.onLayout({nativeEvent:{layout:{height:viewport}}});
  tree!.root.findByProps({testID:'settings-save-action'}).props.onLayout({nativeEvent:{layout:{y:top,height}}});
 });
}
async function scrollSettings(y:number){await act(async()=>tree!.root.findByType('scroll' as React.ElementType).props.onScroll({nativeEvent:{contentOffset:{y},layoutMeasurement:{height:600}}}));}
it('shows sticky Save/Undo only for dirty drafts while the regular Save is offscreen, including scrolling in both directions',async()=>{
 await mount();await measureSettings();expect(sticky()).toBeUndefined();
 await radius('500');expect(sticky()).toBeDefined();
 await scrollSettings(601);expect(sticky()).toBeUndefined(); // Regular Save begins entering the viewport.
 await scrollSettings(1250);expect(sticky()).toBeDefined(); // It has scrolled above the viewport.
 await scrollSettings(700);expect(sticky()).toBeUndefined();
 await scrollSettings(0);expect(sticky()).toBeDefined();
 expect(boundary.setItem).not.toHaveBeenCalled();
});
it('Undo restores both drafts to the latest saved settings and discards an unfinished slider preview',async()=>{
 await mount();await measureSettings();await language('한국어');
 await act(async()=>tree!.root.findByType(Slider).props.onChange(500));expect(displayedRadius()).toBe(500);
 await act(async()=>sticky().findAllByType('button').find(n=>n.props.accessibilityLabel===i18n.t('settings.undoChanges'))!.props.onPress());
 expect(displayedRadius()).toBe(100);expect(sticky()).toBeUndefined();expect(boundary.setItem).not.toHaveBeenCalled();
 await radius('500');await language('한국어');
 await act(async()=>committed.save({activationRadiusMeters:200,language:'ja'}));
 const writes=boundary.setItem.mock.calls.length;
 await act(async()=>sticky().findAllByType('button').find(n=>n.props.accessibilityLabel===i18n.t('settings.undoChanges'))!.props.onPress());
 expect(displayedRadius()).toBe(200);expect(sticky()).toBeUndefined();expect(boundary.setItem).toHaveBeenCalledTimes(writes);
 expect(tree!.root.findAllByType('button').find(n=>n.props.accessibilityLabel==='日本語')!.props['aria-checked']).toBe(true);
});
it('sticky Save shares persistence and busy guards; errors retain edits and Undo never races a submitted save',async()=>{
 const pending=Promise.withResolvers<void>();boundary.setItem.mockReturnValueOnce(pending.promise);
 await mount();await measureSettings();await radius('500');
 const action=sticky().findAllByType('button').find(n=>n.props.accessibilityLabel===i18n.t('common.save'))!;
 await act(async()=>{action.props.onPress();action.props.onPress();});
 expect(boundary.setItem).toHaveBeenCalledTimes(1);
 const undo=sticky().findAllByType('button').find(n=>n.props.accessibilityLabel===i18n.t('settings.undoChanges'))!;
 expect(undo.props.accessibilityState.disabled).toBe(true);
 await act(async()=>undo.props.onPress());expect(displayedRadius()).toBe(500);
 await act(async()=>pending.reject(new Error('PRIVATE disk failure')));
 expect(sticky()).toBeDefined();expect(copy()).toContain(i18n.t('settings.saveFailed'));expect(copy()).not.toContain('PRIVATE');
 for(const locale of ['en','ja','ko']) {
  await act(async()=>{await i18n.changeLanguage(locale);});
  expect(sticky().findAllByType('text').some(n=>n.props.children===i18n.t('settings.saveFailed'))).toBe(true);
 }
 await act(async()=>sticky().findAllByType('button').find(n=>n.props.accessibilityLabel===i18n.t('common.save'))!.props.onPress());
 expect(committed.activationRadiusMeters).toBe(500);expect(sticky()).toBeUndefined();
});
it.each(['en','ja','ko'])('localizes sticky actions in %s and recomputes visibility after layout changes',async locale=>{
 await mount();await act(async()=>{await i18n.changeLanguage(locale);});await radius('500');
 expect(sticky()).toBeUndefined(); // Wait for actual layout rather than guessing visibility.
 await measureSettings(600,900);expect(sticky()).toBeDefined();
 for(const key of ['settings.saveShort','settings.undo','settings.undoChanges']){expect(i18n.t(key)).not.toBe(key);expect(copy()).toContain(i18n.t(key));}
 await measureSettings(1000,900);expect(sticky()).toBeUndefined();
 await measureSettings(600,400);expect(sticky()).toBeUndefined();
 await measureSettings(600,900);expect(sticky()).toBeDefined();
 boundary.focused=false;await redraw();expect(sticky()).toBeUndefined();
});
