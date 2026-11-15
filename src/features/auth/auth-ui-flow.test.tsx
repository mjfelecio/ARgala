import { withHeroUI } from '@/test/native-ui';
import React from 'react';
import { AuthApiError, AuthRetryableFetchError } from '@supabase/supabase-js';
import { createInstance } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { localizationOptions } from '@/i18n/options';
import { GuestContext, type GuestAccess } from './guest-context';
import SignInScreen from './sign-in-screen';

const boundary = vi.hoisted(() => ({ signInWithPassword: vi.fn(), signUp: vi.fn(), signInWithOAuth: vi.fn(), resetPasswordForEmail: vi.fn(), enter: vi.fn(), retry: vi.fn(), replace: vi.fn() }));
vi.mock('./google-sign-in', () => ({ signInWithGoogle: boundary.signInWithOAuth, GoogleBrowserUnavailable: class extends Error {} }));
vi.mock('@/lib/supabase', () => ({ getSupabase: () => ({ auth: boundary }) }));
vi.mock('expo-router', () => ({ router: { replace: boundary.replace } }));
const translations = createInstance();
await translations.use(initReactI18next).init({ ...localizationOptions, lng: 'en', react: { useSuspense: false } });
let tree: ReactTestRenderer | undefined;
let guest: GuestAccess;
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true, __DEV__: false });
  vi.clearAllMocks();
  boundary.signInWithPassword.mockReset().mockResolvedValue({ data: { session: { user: { id: 'tester' } } }, error: null });
  boundary.enter.mockReset().mockResolvedValue(false);
  guest = { enabled: false, loading: false, error: null, enter: boundary.enter, retry: boundary.retry };
  await translations.changeLanguage('en');
  const original = console.error;
  vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => { if (!String(args[0]).startsWith('react-test-renderer is deprecated')) original(...args); });
});
afterEach(async () => {
  await act(async () => tree?.unmount()); tree = undefined;
  expect(boundary.signUp).not.toHaveBeenCalled();
  expect(boundary.signInWithOAuth).not.toHaveBeenCalled();
  expect(boundary.resetPasswordForEmail).not.toHaveBeenCalled();
  vi.restoreAllMocks();
});
async function mount() {
  await act(async () => { tree = create(withHeroUI(<I18nextProvider i18n={translations}><GuestContext.Provider value={guest}><SignInScreen /></GuestContext.Provider></I18nextProvider>)); });
}
function action(key = 'auth.signIn') { return tree!.root.findAllByType('button').find(node => node.props.accessibilityLabel === translations.t(key))!; }
function inputs() { return tree!.root.findAllByType('input'); }
function output() { return JSON.stringify(tree!.toJSON()); }
async function fill(email = ' tester@example.com ', password = ' exact password ') {
  await act(async () => { inputs()[0].props.onChangeText(email); inputs()[1].props.onChangeText(password); });
}
async function submit() { await act(async () => action().props.onPress()); }
function deferred<T>() { let resolve!: (value: T) => void; let reject!: (reason: unknown) => void; const promise = new Promise<T>((done, fail) => { resolve = done; reject = fail; }); return { promise, resolve, reject }; }

it('starts no auth on mount, language change or remount and exposes only tester login and Guest', async () => {
  await mount();
  await act(async () => { await translations.changeLanguage('ja'); });
  await act(async () => tree!.unmount()); tree = undefined;
  await mount();
  expect(boundary.signInWithPassword).not.toHaveBeenCalled();
  expect(boundary.enter).not.toHaveBeenCalled();
  for (const key of ['auth.register', 'auth.googleSignIn']) expect(action(key)).toBeUndefined();
  expect(action('journal.continueGuest')).toBeDefined();
});
it.each(['en', 'ja', 'ko'])('uses actual %s tester instructions and notice without registration actions', async language => {
  await translations.changeLanguage(language); await mount();
  for (const key of ['auth.testerInstructions', 'auth.registrationUnavailable']) {
    expect(translations.exists(key, { lng: language, fallbackLng: false })).toBe(true);
    expect(output()).toContain(translations.t(key));
  }
  expect(inputs().map(node => node.props.accessibilityLabel)).toEqual([translations.t('auth.email'), translations.t('auth.password')]);
  if (language === 'en') expect(output()).toContain('Registration is unavailable in this demo. Please contact the developers to gain tester access.');
});
it('trims only the email, accepts short existing passwords and clears the password on success', async () => {
  await mount(); await fill(' tester@example.com ', ' x '); await submit();
  expect(boundary.signInWithPassword).toHaveBeenCalledExactlyOnceWith({ email: 'tester@example.com', password: ' x ' });
  expect(inputs()[1].props.value).toBe('');
  expect(boundary.replace).not.toHaveBeenCalled(); // Session provider/route guard owns successful login.
});
it.each([['bad', 'password'], ['tester@example.com', ''], ['', 'password']])('validates input before any SDK call (%s)', async (email, password) => {
  await mount(); await fill(email, password); await submit();
  expect(boundary.signInWithPassword).not.toHaveBeenCalled();
  expect(output()).toContain(translations.t('auth.invalid'));
});
it('keeps keyboard scrolling, password autofill and an accessible visibility control', async () => {
  await mount(); await fill();
  expect(tree!.root.findByType('keyboard-avoiding' as React.ElementType).props.behavior).toBe('height');
  expect(tree!.root.findByType('scroll' as React.ElementType).props).toMatchObject({ keyboardShouldPersistTaps: 'handled', keyboardDismissMode: 'on-drag' });
  expect(inputs()[0].props).toMatchObject({ autoComplete: 'email', autoCapitalize: 'none', autoCorrect: false, keyboardType: 'email-address' });
  expect(inputs()[1].props).toMatchObject({ autoComplete: 'current-password', secureTextEntry: true });
  await act(async () => action('auth.showPassword').props.onPress());
  expect(inputs()[1].props.secureTextEntry).toBe(false);
  await act(async () => action('auth.hidePassword').props.onPress());
  expect(inputs()[1].props.secureTextEntry).toBe(true);
  await act(async () => inputs()[1].props.onSubmitEditing());
  expect(boundary.signInWithPassword).toHaveBeenCalledTimes(1);
});
it.each(['login', 'guest'])('shares one pending owner across duplicate and competing actions (%s first)', async first => {
  const pending = deferred<never>();
  if (first === 'login') boundary.signInWithPassword.mockReturnValue(pending.promise);
  else boundary.enter.mockReturnValue(pending.promise);
  await mount(); await fill();
  const login = action().props.onPress, enter = action('journal.continueGuest').props.onPress;
  await act(async () => { if (first === 'login') { login(); login(); enter(); } else { enter(); enter(); login(); } });
  expect(boundary.signInWithPassword).toHaveBeenCalledTimes(first === 'login' ? 1 : 0);
  expect(boundary.enter).toHaveBeenCalledTimes(first === 'guest' ? 1 : 0);
  expect(inputs().every(node => node.props.editable === false)).toBe(true);
  expect(action('auth.showPassword').props.disabled).toBe(true);
  await act(async () => action('auth.showPassword').props.onPress());
  expect(inputs()[1].props.secureTextEntry).toBe(true);
  await act(async () => pending.reject(new Error('private')));
  expect(action().props.disabled).toBe(false);
});
it('blocks retained callbacks while Guest restoration is pending', async () => {
  guest.loading = true; await mount(); await fill();
  await act(async () => { action().props.onPress(); action('journal.continueGuest').props.onPress(); });
  expect(boundary.signInWithPassword).not.toHaveBeenCalled(); expect(boundary.enter).not.toHaveBeenCalled();
});
const failures = [
  [new AuthApiError('private invalid', 400, 'invalid_credentials'), 'auth.invalidCredentials'],
  [new AuthApiError('private inactive', 400, 'email_not_confirmed'), 'auth.emailNotConfirmed'],
  [new AuthApiError('private limit', 429, 'over_request_rate_limit'), 'auth.rateLimited'],
  [new AuthRetryableFetchError('private network', 0), 'auth.networkFailed'],
  [new AuthApiError('private unknown', 500, 'unexpected_failure'), 'auth.failed'],
  [new Error('private setup'), 'auth.failed'],
] as const;
it.each(['en', 'ja', 'ko'])('maps SDK failures, preserves credentials, follows language changes and recovers in %s', async language => {
  await translations.changeLanguage(language); await mount(); await fill();
  for (const [failure, key] of failures) {
    boundary.signInWithPassword.mockResolvedValueOnce({ data: { session: null }, error: failure });
    await submit();
    expect(output()).toContain(translations.t(key)); expect(output()).not.toContain('private');
    expect(inputs()[1].props.value).toBe(' exact password ');
    expect(translations.exists(key, { lng: language, fallbackLng: false })).toBe(true);
    await act(async () => { await translations.changeLanguage(language === 'en' ? 'ja' : 'en'); });
    expect(output()).toContain(translations.t(key));
    await act(async () => { await translations.changeLanguage(language); });
  }
  await submit(); expect(inputs()[1].props.value).toBe('');
  expect(tree!.root.findAll(node => node.props.accessibilityRole === 'alert')).toHaveLength(0);
});
it('directs unconfirmed testers to developers instead of confirmation email', async () => {
  boundary.signInWithPassword.mockResolvedValueOnce({ error: new AuthApiError('private', 400, 'email_not_confirmed') });
  await mount(); await fill(); await submit();
  expect(output()).toContain('Please contact the developers to activate your tester account.');
  expect(output()).not.toContain('Confirm your email');
});
it('catches rejected SDK promises and permits explicit retry', async () => {
  boundary.signInWithPassword.mockRejectedValueOnce(new AuthRetryableFetchError('private', 0));
  await mount(); await fill(); await submit(); expect(output()).toContain(translations.t('auth.networkFailed'));
  await submit(); expect(boundary.signInWithPassword).toHaveBeenCalledTimes(2);
});
it.each(['resolve', 'reject'])('retires UI work and retained actions after unmount (%s)', async completion => {
  const pending = deferred<unknown>(); boundary.signInWithPassword.mockReturnValue(pending.promise);
  await mount(); await fill(); const login = action().props.onPress, enter = action('journal.continueGuest').props.onPress;
  await act(async () => login()); await act(async () => tree!.unmount()); tree = undefined;
  await act(async () => { if (completion === 'resolve') pending.resolve({ data: { session: null }, error: null }); else pending.reject(new Error('private')); });
  await act(async () => { login(); enter(); });
  expect(boundary.signInWithPassword).toHaveBeenCalledTimes(1); expect(boundary.enter).not.toHaveBeenCalled(); expect(boundary.replace).not.toHaveBeenCalled();
});
it.each(['resolve', 'reject'])('retires Guest UI completion and late navigation after unmount (%s)', async completion => {
  const pending = deferred<boolean>(); boundary.enter.mockReturnValue(pending.promise);
  await mount(); const enter = action('journal.continueGuest').props.onPress;
  await act(async () => enter()); await act(async () => tree!.unmount()); tree = undefined;
  await act(async () => { if (completion === 'resolve') pending.resolve(true); else pending.reject(new Error('private')); });
  await act(async () => enter());
  expect(boundary.enter).toHaveBeenCalledTimes(1); expect(boundary.replace).not.toHaveBeenCalled();
});
