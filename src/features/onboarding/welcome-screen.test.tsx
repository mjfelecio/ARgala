import { deferred, Harness, resetRuntime, runtime } from './test-harness';
import * as React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { focusManager, onlineManager, useQueryClient } from '@tanstack/react-query';
import i18n from '@/i18n';
import { localizationOptions } from '@/i18n/options';
import { useSettings } from '@/features/settings/provider';
import { useOnboarding } from './provider';
import { onboardingStorageKey } from './completion';
import WelcomeScreen from './welcome-screen';
import { ScenicLandscape } from '@/ui/scenic-landscape';

const boundaries = vi.hoisted(() => ({ permission: vi.fn(), watch: vi.fn(), provider: vi.fn() }));
vi.mock('expo-location', () => ({ requestForegroundPermissionsAsync: boundaries.permission, getForegroundPermissionsAsync: boundaries.permission, watchPositionAsync: boundaries.watch, watchHeadingAsync: boundaries.watch }));
vi.mock('expo-camera', () => ({ useCameraPermissions: boundaries.permission, CameraView: 'camera' }));
vi.mock('@/lib/edge', () => ({ invokeEdge: boundaries.provider }));
let tree: ReactTestRenderer | undefined;
let state: { status: string; language: string; radius: number; queries: number };
function Flow() {
  const onboarding = useOnboarding(); const settings = useSettings(); const client = useQueryClient();
  React.useEffect(() => { state = { status: onboarding.status, language: settings.language, radius: settings.activationRadiusMeters, queries: client.getQueryCache().getAll().length }; });
  return onboarding.status === 'required' ? <WelcomeScreen /> : <text>{onboarding.status}</text>;
}
async function mount() { await act(async () => { tree = create(<Harness><Flow /></Harness>); }); }
function radios() { return tree!.root.findAllByType('button').filter(node => node.props.role === 'radio'); }
function button(label: string) { return tree!.root.findAllByType('button').find(node => node.props.accessibilityLabel === label)!; }
function copy() { return JSON.stringify(tree!.toJSON()); }
async function select(language: string) {
  const labels: Record<string, string> = { en: 'English', ko: '한국어', ja: '日本語' };
  await act(async () => { button(labels[language]).props.onPress(); });
}
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true, __DEV__: false });
  resetRuntime(); Object.values(boundaries).forEach(mock => mock.mockClear());
  await i18n.changeLanguage('en');
  const original = console.error;
  vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => { if (!String(args[0]).startsWith('react-test-renderer is deprecated')) original(...args); });
});
afterEach(async () => { await act(async () => tree?.unmount()); tree = undefined; focusManager.setFocused(undefined); onlineManager.setOnline(true); vi.restoreAllMocks(); });
it('defaults to the supported device locale and exposes three exclusive accessible radios', async () => {
  await mount();
  expect(radios().map(node => [node.props.accessibilityLabel, node.props.accessibilityState.checked])).toEqual([['English', false], ['한국어', false], ['日本語', true]]);
  expect(copy()).toContain(localizationOptions.resources.ja.translation.onboarding.title);
  expect(tree!.root.findAll(node => node.props.role === 'radiogroup')).not.toHaveLength(0);
});
it.each(['en', 'ko', 'ja'] as const)('previews %s copy locally, then persists through real SettingsProvider with radius intact', async language => {
  runtime.values.set(onboardingStorageKey, 'pending');
  runtime.values.set('argala.preferences.v1', JSON.stringify({ language: 'en', activationRadiusMeters: 285 }));
  await mount(); await select(language);
  const resources = localizationOptions.resources[language].translation.onboarding;
  for (const key of ['title', 'tagline', 'description', 'continue', 'settingsNote'] as const) expect(copy()).toContain(resources[key]);
  expect(radios().filter(node => node.props.accessibilityState.checked)).toHaveLength(1);
  expect(state.language).toBe('en'); expect(i18n.language).toBe('en');
  expect(runtime.setItem).not.toHaveBeenCalled();
  await act(async () => { button(resources.continue).props.onPress(); });
  expect(state).toMatchObject({ status: 'completed', language, radius: 285, queries: 0 });
  expect(JSON.parse(runtime.values.get('argala.preferences.v1')!)).toEqual({ language, activationRadiusMeters: 285 });
  expect(runtime.values.get(onboardingStorageKey)).toBe('complete');
  await act(async () => { tree!.unmount(); }); tree = undefined; await mount();
  expect(state).toMatchObject({ status: 'completed', language, radius: 285 });
});
it('disables all choices and announces busy while deduplicating rapid Continue presses', async () => {
  await mount(); await select('en');
  const saving = deferred<void>();
  runtime.setItem.mockImplementation(async (key, value) => { if (key === 'argala.preferences.v1') await saving.promise; runtime.values.set(key, value); });
  const action = button('Continue');
  await act(async () => { action.props.onPress(); action.props.onPress(); });
  expect(radios().every(node => node.props.disabled)).toBe(true);
  const busy = button('Saving…');
  expect(busy.props.isDisabled ?? busy.props.disabled).toBe(true);
  expect(busy.props.accessibilityState.busy).toBe(true);
  expect(runtime.setItem.mock.calls.filter(([key]) => key === 'argala.preferences.v1')).toHaveLength(1);
  await act(async () => { saving.resolve(); });
  expect(state.status).toBe('completed');
});
it.each(['en', 'ko', 'ja'] as const)('maps unknown write failures to actual %s resources, updates with selection, and recovers', async language => {
  await mount(); await select(language);
  runtime.setItem.mockImplementation(async (key, value) => { if (key === onboardingStorageKey && value === 'complete') throw new Error('PRIVATE native failure'); runtime.values.set(key, value); });
  let resources = localizationOptions.resources[language].translation.onboarding;
  await act(async () => { button(resources.continue).props.onPress(); });
  expect(state.status).toBe('required'); expect(copy()).toContain(resources.saveFailed);
  expect(copy()).not.toContain('PRIVATE native failure');
  const next = language === 'en' ? 'ko' : 'en';
  await select(next);
  resources = localizationOptions.resources[next].translation.onboarding;
  expect(copy()).toContain(resources.saveFailed);
  runtime.setItem.mockImplementation(async (key, value) => { runtime.values.set(key, value); });
  await act(async () => { button(resources.continue).props.onPress(); });
  expect(state.status).toBe('completed'); expect(copy()).not.toContain(resources.saveFailed);
});
it('keeps the full page scrollable, safe-area aware and free of remote images', async () => {
  await mount();
  const scroll = tree!.root.findByType('scroll' as React.ElementType);
  expect(scroll.props.contentContainerClassName).toContain('grow');
  expect(tree!.root.findAllByType('img' as React.ElementType)).toHaveLength(0);
  expect(copy()).not.toContain('googleusercontent');
  expect(tree!.root.findAllByType('safe-area' as React.ElementType).some(node => node.props.edges.includes('bottom'))).toBe(true);
  // Large-text/native layout still needs Android UAT; no fixed text row heights.
  expect(radios().every(node => node.props.className.includes('min-h-'))).toBe(true);
});
it('has no sensor, network, or query side effects on mount, focus, foreground, locale change or remount', async () => {
  const fetch = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Unexpected network'));
  await mount();
  for (const language of ['en', 'ko', 'ja']) {
    await select(language);
    await act(async () => { focusManager.setFocused(false); focusManager.setFocused(true); onlineManager.setOnline(false); onlineManager.setOnline(true); });
  }
  await act(async () => { tree!.unmount(); }); tree = undefined; await mount();
  expect(state.queries).toBe(0); expect(fetch).not.toHaveBeenCalled();
  expect(boundaries.permission).not.toHaveBeenCalled(); expect(boundaries.watch).not.toHaveBeenCalled(); expect(boundaries.provider).not.toHaveBeenCalled();
});

it('retains the shared local scenic hero while language selection stays functional', async () => {
  await mount();
  expect(tree!.root.findAllByType(ScenicLandscape)).toHaveLength(1);
  expect(tree!.root.findAllByType('svg' as React.ElementType)).toHaveLength(1);
  await select('ko');
  expect(copy()).toContain(localizationOptions.resources.ko.translation.onboarding.title);
  expect(boundaries.permission).not.toHaveBeenCalled();
  expect(boundaries.provider).not.toHaveBeenCalled();
});
