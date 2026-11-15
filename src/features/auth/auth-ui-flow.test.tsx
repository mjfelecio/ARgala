import { withHeroUI } from '@/test/native-ui';
import React from 'react';
import { createInstance } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { localizationOptions } from '@/i18n/options';
import SignInScreen from './sign-in-screen';

const boundary = vi.hoisted(() => ({ signIn: vi.fn() }));
vi.mock('./google-sign-in', () => ({ signInWithGoogle: boundary.signIn, GoogleBrowserUnavailable: class GoogleBrowserUnavailable extends Error {} }));
vi.mock('expo-router', () => ({ router: { replace: vi.fn() } }));
const translations = createInstance();
await translations.use(initReactI18next).init({ ...localizationOptions, lng: 'en', react: { useSuspense: false } });
let tree: ReactTestRenderer;
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true, __DEV__: false });
  boundary.signIn.mockReset().mockResolvedValue('cancelled');
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(async () => { await act(async () => tree?.unmount()); vi.restoreAllMocks(); });
async function mount() { await act(async () => { tree = create(withHeroUI(<I18nextProvider i18n={translations}><SignInScreen /></I18nextProvider>)); }); }
function action() { return tree.root.findAllByType('button').find(node => node.props.accessibilityLabel === translations.t('auth.googleSignIn'))!; }
it('starts no login on mount and deduplicates pending presses', async () => {
  let resolve!: (value: string) => void;
  boundary.signIn.mockReturnValue(new Promise(done => { resolve = done; }));
  await mount(); expect(boundary.signIn).not.toHaveBeenCalled();
  const button = action();
  await act(async () => { button.props.onPress(); button.props.onPress(); });
  expect(boundary.signIn).toHaveBeenCalledTimes(1);
  expect(tree.root.findAllByType('button').find(node => node.props.accessibilityLabel === translations.t('common.connecting'))?.props.accessibilityState.busy).toBe(true);
  await act(async () => resolve('cancelled'));
  expect(action()).toBeDefined();
});
it.each(['en', 'ja', 'ko'])('localizes failure without exposing provider details in %s', async language => {
  await translations.changeLanguage(language);
  boundary.signIn.mockRejectedValueOnce(new Error('private provider detail'));
  await mount(); await act(async () => action().props.onPress());
  expect(JSON.stringify(tree.toJSON())).toContain(translations.t('auth.failed'));
  expect(JSON.stringify(tree.toJSON())).not.toContain('private provider detail');
  await act(async () => action().props.onPress());
  expect(boundary.signIn).toHaveBeenCalledTimes(2);
  expect(JSON.stringify(tree.toJSON())).not.toContain(translations.t('auth.failed'));
});
