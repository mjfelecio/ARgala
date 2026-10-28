import { withHeroUI } from '@/test/native-ui';
import * as React from 'react';
import { AuthApiError } from '@supabase/supabase-js';
import { createInstance, type i18n } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { localizationOptions } from '@/i18n/options';
import SignInScreen from './sign-in-screen';

const auth = vi.hoisted(() => ({ signInWithPassword: vi.fn(), signUp: vi.fn() }));
vi.mock('expo-router', () => ({ router: { replace: vi.fn() } }));
vi.mock('@/lib/supabase', () => ({ getSupabase: () => ({ auth }) }));
let tree: ReactTestRenderer | undefined;
let translations: i18n;
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true, __DEV__: false });
  Object.values(auth).forEach(mock => mock.mockReset().mockResolvedValue({ data: { session: null }, error: null }));
  translations = createInstance();
  await translations.use(initReactI18next).init({ ...localizationOptions, lng: 'en', react: { useSuspense: false } });
  const original = console.error;
  vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => { if (!String(args[0]).startsWith('react-test-renderer is deprecated')) original(...args); });
});
afterEach(async () => { await act(async () => tree?.unmount()); tree = undefined; vi.restoreAllMocks(); });
async function mount() { await act(async () => { tree = create(<I18nextProvider i18n={translations}>{withHeroUI(<SignInScreen />)}</I18nextProvider>); }); }
const copy = () => JSON.stringify(tree!.toJSON());
function button(key: string) { return tree!.root.findAllByType('button').find(node => node.props.accessibilityLabel === translations.t(key))!; }
async function press(key: string) { await act(async () => button(key).props.onPress()); }
async function fill(email: string, password: string) {
  await act(async () => {
    const inputs = tree!.root.findAllByType('input');
    inputs[0].props.onChangeText(email); inputs[1].props.onChangeText(password);
  });
}
it.each([{ email: 'bad', password: 'password', invalid: 0 }, { email: 'test@example.com', password: '', invalid: 1 }])('rejects invalid credentials and marks the relevant field: $email / $invalid', async ({ email, password, invalid }) => {
  await mount(); await fill(email, password); await press('auth.signIn');
  expect(auth.signInWithPassword).not.toHaveBeenCalled();
  expect(copy()).toContain(translations.t('auth.invalid'));
  expect(tree!.root.findAllByType('input')[invalid].props.className).toContain('android:border-danger');
});
it('submits trimmed email and exact short password, but rejects the same password for registration', async () => {
  await mount(); await fill(' user@example.com ', ' space '); await press('auth.signIn');
  expect(auth.signInWithPassword).toHaveBeenCalledExactlyOnceWith({ email: 'user@example.com', password: ' space ' });
  expect(tree!.root.findAllByType('input')[1].props.value).toBe('');
  await press('auth.newAccount'); await fill('user@example.com', '123456'); await press('auth.register');
  expect(auth.signUp).not.toHaveBeenCalled(); expect(copy()).toContain(translations.t('auth.invalidRegistration'));
});
it.each([7, 129])('rejects a %i character registration password before calling Supabase', async length => {
  await mount(); await press('auth.newAccount'); await fill('user@example.com', 'x'.repeat(length)); await press('auth.register');
  expect(auth.signUp).not.toHaveBeenCalled(); expect(copy()).toContain(translations.t('auth.invalidRegistration'));
});
it.each(['en', 'ko', 'ja'] as const)('retains no-session confirmation and permits explicit sign-in in %s', async language => {
  await translations.changeLanguage(language);
  await mount(); await press('auth.newAccount'); await fill(' user@example.com ', ' password '); await press('auth.register');
  expect(auth.signUp).toHaveBeenCalledExactlyOnceWith({ email: 'user@example.com', password: ' password ' });
  expect(copy()).toContain(translations.t('auth.confirm'));
  expect(tree!.root.findAllByType('input')[1].props.value).toBe('');
  const next = language === 'ja' ? 'ko' : 'ja';
  await act(async () => { await translations.changeLanguage(next); });
  expect(copy()).toContain(translations.t('auth.confirm'));
  await press('auth.existing');
  expect(copy()).not.toContain(translations.t('auth.confirm'));
  expect(button('auth.signIn')).toBeDefined();
});
it('retains failed credentials, relocalizes generic error, clears it on mode switch and allows recovery', async () => {
  auth.signUp.mockRejectedValueOnce(new Error('PRIVATE provider detail'));
  await mount(); await press('auth.newAccount'); await fill('user@example.com', 'password123'); await press('auth.register');
  expect(copy()).toContain(translations.t('auth.failed')); expect(copy()).not.toContain('PRIVATE provider detail');
  expect(tree!.root.findAllByType('input')[1].props.value).toBe('password123');
  await act(async () => { await translations.changeLanguage('ko'); });
  expect(copy()).toContain(translations.t('auth.failed')); expect(button('auth.register')).toBeDefined();
  await press('auth.existing'); expect(copy()).not.toContain(translations.t('auth.failed'));
  await press('auth.signIn'); expect(auth.signInWithPassword).toHaveBeenCalledTimes(1);
});
it.each(['signInWithPassword', 'signUp'] as const)('blocks duplicate %s and mode changes throughout a pending request, then recovers', async method => {
  let resolve!: (value: unknown) => void;
  auth[method].mockReturnValueOnce(new Promise(done => { resolve = done; }));
  await mount();
  const registering = method === 'signUp';
  if (registering) await press('auth.newAccount');
  await fill('user@example.com', 'password123');
  const submit = button(registering ? 'auth.register' : 'auth.signIn');
  const switchMode = button(registering ? 'auth.existing' : 'auth.newAccount');
  await act(async () => { submit.props.onPress(); submit.props.onPress(); switchMode.props.onPress(); });
  expect(auth[method]).toHaveBeenCalledTimes(1);
  expect(tree!.root.findAllByType('input').every(input => !input.props.editable)).toBe(true);
  expect(button('common.connecting').props.accessibilityState).toMatchObject({ busy: true, disabled: true });
  await act(async () => { resolve({ data: { session: null }, error: new AuthApiError('PRIVATE', 400, 'invalid_credentials') }); });
  expect(copy()).toContain(translations.t('auth.invalidCredentials'));
  expect(copy()).not.toContain('PRIVATE');
  await press(registering ? 'auth.register' : 'auth.signIn'); expect(auth[method]).toHaveBeenCalledTimes(2);
});
it('does not infer a session from a successful response or make auth calls on mount, locale change or remount', async () => {
  await mount();
  await act(async () => { await translations.changeLanguage('ja'); });
  await act(async () => tree!.unmount()); tree = undefined; await mount();
  expect(auth.signUp).not.toHaveBeenCalled(); expect(auth.signInWithPassword).not.toHaveBeenCalled();
  auth.signUp.mockResolvedValueOnce({ data: { session: { user: { id: 'user' } } }, error: null });
  await press('auth.newAccount'); await fill('user@example.com', 'password123'); await press('auth.register');
  expect(copy()).not.toContain(translations.t('auth.confirm'));
  expect(button('auth.register')).toBeDefined(); // Root session guard alone owns navigation.
});
it.each(['en', 'ko', 'ja'] as const)('renders both approved modes and all new labels from %s resources', async language => {
  await translations.changeLanguage(language); await mount();
  for (const key of ['welcomeBack', 'signInSubtitle', 'newHere', 'showPassword'] as const) {
    expect(translations.exists(`auth.${key}`, { lng: language, fallbackLng: false })).toBe(true);
    expect(copy()).toContain(translations.t(`auth.${key}`));
  }
  expect(copy()).not.toContain(translations.t('auth.passwordHint'));
  await press('auth.newAccount');
  for (const key of ['startExploring', 'registerSubtitle', 'alreadyMember', 'passwordHint'] as const) {
    expect(translations.exists(`auth.${key}`, { lng: language, fallbackLng: false })).toBe(true);
    expect(copy()).toContain(translations.t(`auth.${key}`));
  }
  expect(copy()).not.toContain(translations.t('auth.welcomeBack'));
  expect(button('auth.register')).toBeDefined();
  await press('auth.existing'); expect(button('auth.signIn')).toBeDefined();
});
it('keeps white content growing through safe areas inside a keyboard-friendly scroll container', async () => {
  await mount();
  expect(tree!.root.findAllByType('keyboard-avoiding' as React.ElementType)).toHaveLength(1);
  const scroll = tree!.root.findByType('scroll' as React.ElementType);
  expect(scroll.props).toMatchObject({ keyboardShouldPersistTaps: 'handled', keyboardDismissMode: 'on-drag', contentContainerClassName: 'grow' });
  const bottom = tree!.root.findAllByType('safe-area' as React.ElementType).find(node => node.props.edges.includes('bottom'))!;
  expect(bottom.props.className).toContain('grow');
  const content = bottom.parent!;
  expect(content.props.className).toContain('grow');
  expect(content.props.className).toContain('rounded-b-none');
  expect(tree!.root.findAllByType('svg' as React.ElementType)).toHaveLength(1);
  expect(tree!.root.findAllByType('img' as React.ElementType)).toHaveLength(0);
  expect(copy()).not.toContain('alex.explorer'); expect(copy()).not.toContain('googleusercontent');
  expect(tree!.root.findAllByType('button').some(node => /back|戻る|뒤로/i.test(node.props.accessibilityLabel ?? ''))).toBe(false);
  expect(tree!.root.findAll(node => node.props.accessibilityRole === 'tablist')).toHaveLength(0);
  expect(tree!.root.findAllByType('input').every(input => input.props.allowFontScaling !== false)).toBe(true);
});
