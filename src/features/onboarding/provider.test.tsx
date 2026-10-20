import { deferred, Harness, resetRuntime, runtime } from './test-harness';
import * as React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { useSettings } from '@/features/settings/provider';
import { onboardingStorageKey as key } from './completion';
import { useOnboarding } from './provider';
const preferencesKey = 'argala.preferences.v1';
let tree: ReactTestRenderer | undefined;
let onboarding: ReturnType<typeof useOnboarding>;
let settings: ReturnType<typeof useSettings>;
function Probe() {
  const value = useOnboarding(); const preferences = useSettings();
  React.useEffect(() => { onboarding = value; settings = preferences; });
  return <text>{value.status}</text>;
}
async function mount() { await act(async () => { tree = create(<Harness><Probe /></Harness>); }); }
async function rerender() { await act(async () => { tree!.update(<Harness><Probe /></Harness>); }); }
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true, __DEV__: false });
  resetRuntime();
  await i18n.changeLanguage('en');
  const original = console.error;
  vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => { if (!String(args[0]).startsWith('react-test-renderer is deprecated')) original(...args); });
});
afterEach(async () => { await act(async () => tree?.unmount()); tree = undefined; vi.restoreAllMocks(); });
it('waits for restored auth, then requires onboarding with the supported device language', async () => {
  runtime.auth.loading = true;
  await mount();
  expect(onboarding.status).toBe('loading');
  expect(runtime.getItem).not.toHaveBeenCalledWith(key);
  runtime.auth.loading = false;
  await rerender();
  expect(onboarding.status).toBe('required');
  expect(settings).toMatchObject({ language: 'ja', activationRadiusMeters: 100 });
});
it.each(['{}', '{broken', '', '{"language":"ko","activationRadiusMeters":345}'])('migrates legacy preferences %s without rewriting them', async raw => {
  runtime.values.set(preferencesKey, raw);
  await mount();
  expect(onboarding.status).toBe('completed');
  expect(runtime.values.get(key)).toBe('complete');
  expect(runtime.setItem).not.toHaveBeenCalledWith(preferencesKey, expect.anything());
  expect(runtime.values.get(preferencesKey)).toBe(raw);
});
it('bypasses completed installs and does not rewrite their preferences', async () => {
  runtime.values.set(key, 'complete');
  await mount();
  expect(onboarding.status).toBe('completed');
  expect(runtime.setItem).not.toHaveBeenCalled();
});
it('saves existing radius and chosen language before committing completion, deduplicating rapid presses', async () => {
  runtime.values.set(key, 'pending');
  runtime.values.set(preferencesKey, JSON.stringify({ language: 'en', activationRadiusMeters: 345 }));
  await mount();
  const saving = deferred<void>();
  runtime.setItem.mockImplementation(async (k, value) => {
    if (k === preferencesKey) await saving.promise;
    runtime.values.set(k, value);
  });
  let first!: Promise<void>; let second!: Promise<void>;
  await act(async () => { first = onboarding.complete('ko'); second = onboarding.complete('ko'); });
  expect(onboarding.status).toBe('required');
  expect(runtime.setItem).not.toHaveBeenCalledWith(key, 'complete');
  await act(async () => { saving.resolve(); await Promise.all([first, second]); });
  expect(runtime.setItem.mock.calls.map(([k, value]) => [k, k === preferencesKey ? JSON.parse(value) : value])).toEqual([
    [key, 'pending'], [preferencesKey, { language: 'ko', activationRadiusMeters: 345 }], [key, 'complete'],
  ]);
  expect(onboarding.status).toBe('completed');
  expect(settings).toMatchObject({ language: 'ko', activationRadiusMeters: 345 });
  await act(async () => { tree!.unmount(); }); tree = undefined;
  await mount();
  expect(onboarding.status).toBe('completed');
  expect(settings).toMatchObject({ language: 'ko', activationRadiusMeters: 345 });
});
it.each(['pending', 'preferences', 'complete'])('keeps failed %s writes retryable, including across restart', async failAt => {
  await mount();
  runtime.setItem.mockImplementation(async (k, value) => {
    if ((failAt === 'preferences' && k === preferencesKey) || (k === key && value === failAt)) throw new Error('private storage detail');
    runtime.values.set(k, value);
  });
  await act(async () => { await expect(onboarding.complete('ko')).rejects.toThrow(); });
  expect(onboarding.status).toBe('required');
  expect(runtime.values.get(key)).not.toBe('complete');
  if (failAt !== 'complete') expect(runtime.setItem).not.toHaveBeenCalledWith(key, 'complete');
  await act(async () => { tree!.unmount(); }); tree = undefined;
  await mount();
  expect(onboarding.status).toBe('required');
  runtime.setItem.mockImplementation(async (k, value) => { runtime.values.set(k, value); });
  await act(async () => { await onboarding.complete('ko'); });
  expect(onboarding.status).toBe('completed');
});
it.each([key, preferencesKey])('shows recovery for failed %s reads and rereads on explicit retry', async failedKey => {
  runtime.getItem.mockImplementation(async k => { if (k === failedKey) throw new Error('private storage detail'); return null; });
  await mount();
  expect(onboarding.status).toBe('error');
  expect(runtime.setItem).not.toHaveBeenCalled();
  runtime.getItem.mockImplementation(async k => runtime.values.get(k) ?? null);
  await act(async () => { onboarding.retry(); });
  expect(onboarding.status).toBe('required');
});
it('blocks legacy migration on failed marker write until explicit retry', async () => {
  runtime.values.set(preferencesKey, '{}');
  runtime.setItem.mockRejectedValue(new Error('failed'));
  await mount();
  expect(onboarding.status).toBe('error');
  runtime.setItem.mockImplementation(async (k, value) => { runtime.values.set(k, value); });
  await act(async () => { onboarding.retry(); });
  expect(onboarding.status).toBe('completed');
});
it('bypasses signed-in users even when storage is unavailable and retains bypass on sign-out', async () => {
  runtime.auth.session = { user: { id: 'existing' } };
  runtime.getItem.mockRejectedValue(new Error('failed'));
  runtime.setItem.mockRejectedValue(new Error('failed'));
  await mount();
  expect(onboarding.status).toBe('completed');
  runtime.auth.session = null;
  await rerender();
  expect(onboarding.status).toBe('completed');
});
it('retires delayed reads on auth changes and unmount', async () => {
  const delayed = deferred<string | null>();
  runtime.getItem.mockImplementation(async k => k === key ? delayed.promise : null);
  await mount();
  expect(onboarding.status).toBe('loading');
  runtime.auth.session = { user: { id: 'restored' } };
  await rerender();
  expect(onboarding.status).toBe('completed');
  await act(async () => { delayed.resolve(null); });
  expect(onboarding.status).toBe('completed');
  await act(async () => { tree!.unmount(); }); tree = undefined;
  expect(runtime.values.get(key)).toBe('complete');
});
it('does not write completion after unmount during the preference save', async () => {
  await mount();
  const delayed = deferred<void>();
  runtime.setItem.mockImplementation(async (k, value) => { if (k === preferencesKey) await delayed.promise; runtime.values.set(k, value); });
  let saving!: Promise<void>;
  await act(async () => { saving = onboarding.complete('ja'); });
  await act(async () => { tree!.unmount(); }); tree = undefined;
  await act(async () => { delayed.resolve(); await saving.catch(() => {}); });
  expect(runtime.values.get(key)).toBe('pending');
});
