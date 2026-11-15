import { withHeroUI } from '@/test/native-ui';
import * as React from 'react';
import { createInstance } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { localizationOptions } from '@/i18n/options';
import { SignOutAction } from './sign-out-action';
import { AuthProvider, useAuth } from './provider';

const auth = vi.hoisted(() => ({
  signOut: vi.fn(), getSession: vi.fn(),
  onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
  startAutoRefresh: vi.fn(), stopAutoRefresh: vi.fn(),
}));
vi.mock('@/lib/supabase', () => ({ getSupabase: () => ({ auth }) }));
vi.mock('@/ui/shared', async () => {
  const { createElement } = await import('react');
  return { Screen: 'section', Notice: 'output', styles: { title: {} }, Action: (props: Record<string, unknown>) => createElement('button', props) };
});
const translations = createInstance();
await translations.use(initReactI18next).init({ ...localizationOptions, lng: 'en', react: { useSuspense: false } });
let tree: ReactTestRenderer;
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true, __DEV__: false });
  auth.signOut.mockReset().mockResolvedValue({ error: null });
  auth.getSession.mockReset().mockResolvedValue({ data: { session: null }, error: null });
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(async () => { await act(async () => tree?.unmount()); vi.restoreAllMocks(); });
async function render(component: React.ReactNode) { await act(async () => { tree = create(React.createElement(I18nextProvider, { i18n: translations }, withHeroUI(component))); }); }
it.each(['ko', 'ja'])('localizes sign-out errors in %s', async language => {
  await translations.changeLanguage(language);
  auth.signOut.mockResolvedValue({ error: new Error('private') });
  await render(React.createElement(SignOutAction));
  await act(async () => tree.root.findAllByType('button').find(button => button.props.title === translations.t('auth.signOut'))!.props.onPress());
  expect(JSON.stringify(tree.toJSON())).toContain(translations.t('auth.logoutFailed'));
  expect(JSON.stringify(tree.toJSON())).not.toContain('private');
});
function SessionProbe() { return React.createElement('output', null, useAuth().error); }
it.each(['returned', 'thrown'])('exposes a translation key for a %s session restoration error', async failure => {
  if (failure === 'returned') auth.getSession.mockResolvedValue({ data: { session: null }, error: new Error('private') });
  else auth.getSession.mockRejectedValue(new Error('private'));
  await render(React.createElement(AuthProvider, null, React.createElement(SessionProbe)));
  expect(tree.root.findByType('output').props.children).toBe('auth.restoreFailed');
});
function RestoredSessionProbe() {
  const { session, loading } = useAuth();
  return React.createElement('output', null, loading ? 'pending' : session?.user.id ?? 'signed-out');
}
it('restores the existing session through the real provider after reopening', async () => {
  auth.getSession.mockResolvedValue({ data: { session: { user: { id: 'assigned-tester' } } }, error: null });
  await render(React.createElement(AuthProvider, null, React.createElement(RestoredSessionProbe)));
  expect(tree.root.findByType('output').props.children).toBe('assigned-tester');
  await act(async () => tree.unmount());
  await render(React.createElement(AuthProvider, null, React.createElement(RestoredSessionProbe)));
  expect(tree.root.findByType('output').props.children).toBe('assigned-tester');
  expect(auth.getSession).toHaveBeenCalledTimes(2);
});
