import { withHeroUI } from '@/test/native-ui';
import * as React from 'react';
import { createRequire } from 'node:module';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { I18nextProvider } from 'react-i18next';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { SettingsProvider, useSettings } from './provider';
import { AuthProvider } from '@/features/auth/provider';
import ProfileScreen from '@/features/navigation/profile-screen';
import SettingsScreen from './settings-screen';
import { queryClient } from '@/lib/query';

const boundary = vi.hoisted(() => ({ stored: null as string | null, getItem: vi.fn(), setItem: vi.fn(), focused: true,
  auth: { getSession: vi.fn(), onAuthStateChange: vi.fn(), signOut: vi.fn(), startAutoRefresh: vi.fn(), stopAutoRefresh: vi.fn() },
  authChanged: null as ((event: string, session: unknown) => void) | null,
  session: { user: { id: 'signed-in-user', email: 'traveler@example.com' } } as { user: { id: string; email?: string } } | null,
  version: '1.0.0' as string | undefined,
}));
vi.mock('@react-native-async-storage/async-storage', () => ({ default: { getItem: boundary.getItem, setItem: boundary.setItem } }));
vi.mock('expo-localization', () => ({ getLocales: () => [{ languageTag: 'en' }] }));
vi.mock('@/lib/supabase', () => ({ getSupabase: () => ({ auth: boundary.auth }) }));
vi.mock('expo-constants', () => ({ default: { get expoConfig() { return { version: boundary.version }; } } }));
vi.mock('expo-router', async () => {
  const { createRequire } = await import('node:module');
  const require = createRequire(import.meta.url);
  return { useIsFocused: require('expo-router/build/react-navigation/core/useIsFocused').useIsFocused,
    router: { canGoBack: vi.fn(() => true), back: vi.fn(), navigate: vi.fn() } };
});
const require = createRequire(import.meta.url);
const { IsFocusedContext } = require('expo-router/build/react-navigation/core/useIsFocused');
const { NavigationContext } = require('expo-router/build/react-navigation/core/NavigationContext');
const navigation = { isFocused: () => boundary.focused, addListener: () => () => {} };
let tree: ReactTestRenderer | undefined;
let screen: 'tab' | 'stack';
let committed: ReturnType<typeof useSettings>;
function Probe() { committed = useSettings(); return null; }
function render() {
  return <I18nextProvider i18n={i18n}>{withHeroUI(<SettingsProvider><AuthProvider>
    <NavigationContext.Provider value={navigation}><IsFocusedContext.Provider value={boundary.focused}>
      <Probe />{screen === 'tab' ? <ProfileScreen /> : <SettingsScreen />}
    </IsFocusedContext.Provider></NavigationContext.Provider>
  </AuthProvider></SettingsProvider>)}</I18nextProvider>;
}
async function mount(entry: 'tab' | 'stack' = 'tab') { screen = entry; await act(async () => { tree = create(render()); }); }
async function redraw() { await act(async () => tree!.update(render())); }
const copy = () => JSON.stringify(tree!.toJSON());
const input = () => tree!.root.findByType('input');
function button(key: string) { return tree!.root.findAllByType('button').find(node => node.props.accessibilityLabel === i18n.t(key))!; }
async function radius(value: string) { await act(async () => input().props.onChangeText(value)); }
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
  await i18n.changeLanguage('en');
  const original = console.error;
  vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => { if (!String(args[0]).startsWith('react-test-renderer is deprecated')) original(...args); });
});
afterEach(async () => { await act(async () => tree?.unmount()); tree = undefined; queryClient.clear(); vi.restoreAllMocks(); });
it.each(['tab', 'stack'] as const)('saves both draft preferences explicitly from %s and preserves 123 m after reopening', async entry => {
  await mount(entry);
  expect(button('common.save').props.accessibilityState.disabled).toBe(true);
  await radius('123'); await language('한국어');
  expect(i18n.language).toBe('en'); expect(boundary.setItem).not.toHaveBeenCalled();
  await save();
  expect(boundary.setItem).toHaveBeenCalledExactlyOnceWith('argala.preferences.v1', JSON.stringify({ activationRadiusMeters: 123, language: 'ko' }));
  expect(i18n.language).toBe('ko'); expect(copy()).toContain(i18n.t('common.saved'));
  await act(async () => tree!.unmount()); tree = undefined; await mount(entry);
  expect(input().props.value).toBe('123'); expect(committed.language).toBe('ko');
  expect(button('common.save').props.accessibilityState.disabled).toBe(true);
});
it.each(['9', '1001', '', '12.3', 'NaN'])('blocks invalid draft %s through the real screen, then permits recovery', async value => {
  await mount(); await radius(value);
  expect(copy()).toContain(i18n.t('settings.invalid'));
  expect(button('common.save').props.accessibilityState.disabled).toBe(true);
  await save(); expect(boundary.setItem).not.toHaveBeenCalled();
  await radius('10'); await save(); expect(committed.activationRadiusMeters).toBe(10);
});
it('guards same-tick double saves, waits for persistence and retains failed drafts for explicit retry', async () => {
  const pending = Promise.withResolvers<void>();
  boundary.setItem.mockReturnValueOnce(pending.promise);
  await mount(); await radius('123');
  const submit = button('common.save');
  await act(async () => { submit.props.onPress(); submit.props.onPress(); });
  expect(boundary.setItem).toHaveBeenCalledTimes(1);
  expect(copy()).not.toContain(i18n.t('common.saved'));
  expect(button('settings.saving').props.accessibilityState).toMatchObject({ busy: true, disabled: true });
  await act(async () => pending.reject(new Error('PRIVATE storage failure')));
  expect(input().props.value).toBe('123'); expect(copy()).toContain(i18n.t('settings.saveFailed')); expect(copy()).not.toContain('PRIVATE');
  await act(async () => { await i18n.changeLanguage('ja'); });
  expect(copy()).toContain(i18n.t('settings.saveFailed'));
  await save(); expect(committed.activationRadiusMeters).toBe(123); expect(copy()).toContain(i18n.t('common.saved'));
});
it('drops unsaved edits on tab departure and starts pristine with installed focus hooks before navigation readiness', async () => {
  await mount(); await radius('500'); await language('日本語');
  boundary.focused = false; await redraw(); boundary.focused = true; await redraw();
  expect(input().props.value).toBe('100'); expect(committed.language).toBe('en');
  expect(button('common.save').props.accessibilityState.disabled).toBe(true);
  expect(boundary.setItem).not.toHaveBeenCalled();
});
it('synchronizes an external save only when pristine and does not clobber dirty edits on rerender or language change', async () => {
  await mount();
  await act(async () => committed.save({ activationRadiusMeters: 123, language: 'ko' }));
  expect(input().props.value).toBe('123');
  await radius('500');
  await act(async () => committed.save({ activationRadiusMeters: 200, language: 'ja' }));
  await redraw(); expect(input().props.value).toBe('500');
  await save(); expect(committed).toMatchObject({ activationRadiusMeters: 500, language: 'ko' });
});
it.each(['ko', 'ja'])('relocalizes validation and storage errors through actual %s resources', async locale => {
  boundary.getItem.mockRejectedValueOnce(new Error('PRIVATE disk failure'));
  await mount(); await radius('0');
  expect(copy()).toContain(i18n.t('settings.invalid')); expect(copy()).toContain(i18n.t('settings.loadFailed'));
  await act(async () => { await i18n.changeLanguage(locale); });
  expect(copy()).toContain(i18n.t('settings.invalid')); expect(copy()).toContain(i18n.t('settings.loadFailed')); expect(copy()).not.toContain('PRIVATE');
  await radius('1000'); await save(); expect(copy()).not.toContain(i18n.t('settings.loadFailed'));
});
it('shows no stale saved success after a subsequent edit', async () => {
  await mount(); await radius('123'); await save(); expect(copy()).toContain(i18n.t('common.saved'));
  await radius('200'); expect(copy()).not.toContain(i18n.t('common.saved')); expect(copy()).toContain(i18n.t('settings.unsaved'));
});
