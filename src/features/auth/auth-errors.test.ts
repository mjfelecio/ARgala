import { withHeroUI } from '@/test/native-ui';
import * as React from 'react';
import { AuthApiError, AuthRetryableFetchError, AuthWeakPasswordError } from '@supabase/supabase-js';
import { createInstance, type i18n } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { localizationOptions } from '@/i18n/options';
import SignInScreen from './sign-in-screen';
import { SignOutAction } from './sign-out-action';
import { AuthProvider, useAuth } from './provider';

const auth = vi.hoisted(() => ({
  signInWithPassword: vi.fn(), signUp: vi.fn(), signOut: vi.fn(), getSession: vi.fn(),
  onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
  startAutoRefresh: vi.fn(), stopAutoRefresh: vi.fn(),
}));
vi.mock('expo-router', () => ({ router: { replace: vi.fn() } }));
vi.mock('@/lib/supabase', () => ({ getSupabase: () => ({ auth }) }));
vi.mock('@/ui/shared', async () => {
  const { createElement } = await import('react');
  return {
    Screen: 'section', Notice: 'output', styles: { title: {} },
    Action: (props: Record<string, unknown>) => createElement('button', props),
    Field: (props: Record<string, unknown>) => createElement('input', props),
  };
});
let tree: ReactTestRenderer | undefined;
let translations: i18n;
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true, __DEV__: false });
  auth.signInWithPassword.mockReset().mockResolvedValue({ data: { session: null }, error: null });
  auth.signUp.mockReset().mockResolvedValue({ data: { session: null }, error: null });
  auth.signOut.mockReset().mockResolvedValue({ error: null });
  auth.getSession.mockReset().mockResolvedValue({ data: { session: null }, error: null });
  translations = createInstance();
  await translations.use(initReactI18next).init({ ...localizationOptions, lng: 'en', react: { useSuspense: false } });
  const original = console.error;
  vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => { if (!String(args[0]).startsWith('react-test-renderer is deprecated')) original(...args); });
});
afterEach(async () => { await act(async () => tree?.unmount()); tree = undefined; vi.restoreAllMocks(); });
async function render(component: React.ReactNode) {
  await act(async () => { tree = create(React.createElement(I18nextProvider, { i18n: translations }, withHeroUI(component))); });
}
async function press(key: string) {
  const action = tree!.root.findAllByType('button').find((button) => (button.props.accessibilityLabel ?? button.props.title) === translations.t(key));
  expect(action).toBeDefined();
  await act(async () => { action!.props.onPress(); });
}
async function fillCredentials() {
  await act(async () => {
    const fields = tree!.root.findAllByType('input');
    fields.find((field) => field.props.accessibilityLabel === translations.t('auth.email'))!.props.onChangeText('test@example.com');
    fields.find((field) => field.props.accessibilityLabel === translations.t('auth.password'))!.props.onChangeText('password123');
  });
}
it.each([
  { mode: 'signInWithPassword', code: 'invalid_credentials', language: 'ko', message: '이메일 또는 비밀번호가 올바르지 않습니다.' },
  { mode: 'signInWithPassword', code: 'email_not_confirmed', language: 'ja', message: 'ログインする前に、メールアドレスを確認してください。' },
  { mode: 'signUp', code: 'weak_password', language: 'ko', message: '더 안전한 비밀번호를 선택하세요.' },
  { mode: 'signUp', code: 'over_email_send_rate_limit', language: 'ja', message: '試行回数が多すぎます。しばらく待ってから再試行してください。' },
  { mode: 'signUp', code: 'user_already_exists', language: 'ko', message: '이 이메일로 등록된 계정이 있습니다. 로그인해 보세요.' },
  { mode: 'signUp', code: 'future_error', language: 'ja', message: '認証に失敗しました。再試行してください。' },
  { mode: 'signInWithPassword', code: 'toString', language: 'ko', message: '인증하지 못했습니다. 다시 시도하세요.' },
  { mode: 'signInWithPassword', code: null, language: 'ja', message: '認証に失敗しました。再試行してください。' },
] as const)('localizes $mode $code in $language without displaying SDK messages', async ({ mode, code, language, message }) => {
  await translations.changeLanguage(language);
  const failure = code === 'weak_password' ? new AuthWeakPasswordError('Raw SDK English', 400, [])
    : code ? new AuthApiError('Raw SDK English', 400, code) : new AuthRetryableFetchError('Network English', 0);
  if (code) auth[mode].mockResolvedValue({ data: { session: null }, error: failure });
  else auth[mode].mockRejectedValue(failure);
  await render(React.createElement(SignInScreen));
  if (mode === 'signUp') await press('auth.newAccount');
  await fillCredentials();
  await press(mode === 'signUp' ? 'auth.register' : 'auth.signIn');
  expect(JSON.stringify(tree!.toJSON())).toContain(message);
  expect(JSON.stringify(tree!.toJSON())).not.toContain(failure.message);
});
it('updates an existing authentication error when the selected language changes', async () => {
  auth.signInWithPassword.mockResolvedValue({ data: { session: null }, error: new AuthApiError('Invalid credentials', 400, 'invalid_credentials') });
  await render(React.createElement(SignInScreen));
  await fillCredentials(); await press('auth.signIn');
  await act(async () => { await translations.changeLanguage('ja'); });
  expect(JSON.stringify(tree!.toJSON())).toContain('メールアドレスまたはパスワードが正しくありません。');
});
it.each([
  { language: 'ko', message: '로그아웃하지 못했습니다. 다시 시도하세요.' },
  { language: 'ja', message: 'ログアウトできませんでした。再試行してください。' },
])('uses the translated sign-out fallback in $language', async ({ language, message }) => {
  await translations.changeLanguage(language);
  auth.signOut.mockResolvedValue({ error: new Error('SDK logout English') });
  await render(React.createElement(SignOutAction));
  await press('auth.signOut');
  expect(JSON.stringify(tree!.toJSON())).toContain(message);
});
function SessionProbe() { return React.createElement('output', null, useAuth().error); }
it.each(['returned', 'thrown'])('exposes a translation key for a %s session restoration error', async (failure) => {
  if (failure === 'returned') auth.getSession.mockResolvedValue({ data: { session: null }, error: new Error('SDK session English') });
  else auth.getSession.mockRejectedValue(new Error('SDK session English'));
  await render(React.createElement(AuthProvider, null, React.createElement(SessionProbe)));
  expect(tree!.root.findByType('output').props.children).toBe('auth.restoreFailed');
});

it('deduplicates two submit presses from the same render before React flushes busy state', async () => {
  let resolve!: (value: unknown) => void;
  auth.signInWithPassword.mockReturnValue(new Promise(done => { resolve = done; }));
  await render(React.createElement(SignInScreen)); await fillCredentials();
  const button = tree!.root.findAllByType('button').find(node => node.props.accessibilityLabel === translations.t('auth.signIn'))!;
  await act(async () => { button.props.onPress(); button.props.onPress(); });
  const count = auth.signInWithPassword.mock.calls.length;
  await act(async () => { resolve({ data: { session: null }, error: null }); });
  expect(count).toBe(1);
});
