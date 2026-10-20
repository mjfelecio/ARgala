import { withHeroUI } from '@/test/native-ui';
import * as React from 'react';
import { createInstance, type i18n } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { localizationOptions } from '@/i18n/options';
import { CredentialsFields } from './credentials-fields';

let tree: ReactTestRenderer | undefined;
let translations: i18n;
const onEmailChange = vi.fn(); const onPasswordChange = vi.fn();
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true, __DEV__: false });
  onEmailChange.mockClear(); onPasswordChange.mockClear();
  translations = createInstance();
  await translations.use(initReactI18next).init({ ...localizationOptions, lng: 'en', react: { useSuspense: false } });
  const original = console.error;
  vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => { if (!String(args[0]).startsWith('react-test-renderer is deprecated')) original(...args); });
});
afterEach(async () => { await act(async () => tree?.unmount()); tree = undefined; vi.restoreAllMocks(); });
async function render(registering = false, disabled = false) {
  await act(async () => { tree = create(<I18nextProvider i18n={translations}>{withHeroUI(<CredentialsFields email="user@example.com" password=" space " registering={registering} disabled={disabled} onEmailChange={onEmailChange} onPasswordChange={onPasswordChange} />)}</I18nextProvider>); });
}
const inputs = () => tree!.root.findAllByType('input');
it.each([false, true])('uses the same controlled, labeled HeroUI fields (registering=%s)', async registering => {
  await render(registering);
  const [email, password] = inputs();
  expect(inputs()).toHaveLength(2);
  expect(email.props).toMatchObject({ value: 'user@example.com', keyboardType: 'email-address', autoCapitalize: 'none', autoCorrect: false, autoComplete: 'email', accessibilityLabel: translations.t('auth.email') });
  expect(password.props).toMatchObject({ value: ' space ', secureTextEntry: true, autoCapitalize: 'none', autoCorrect: false, autoComplete: registering ? 'new-password' : 'current-password', accessibilityLabel: translations.t('auth.password') });
  expect(email.props.className).toContain('variant-primary');
  expect(password.props.className).toContain('variant-primary');
  await act(async () => { email.props.onChangeText(' other@example.com '); password.props.onChangeText(' raw '); });
  expect(onEmailChange).toHaveBeenCalledWith(' other@example.com ');
  expect(onPasswordChange).toHaveBeenCalledWith(' raw ');
});
it('toggles password visibility accessibly without changing controlled credentials', async () => {
  await render();
  let toggle = tree!.root.findAllByType('button').find(node => node.props.accessibilityLabel === translations.t(inputs()[1].props.secureTextEntry ? 'auth.showPassword' : 'auth.hidePassword'))!;
  expect(toggle.props.accessibilityLabel).toBe(translations.t('auth.showPassword'));
  await act(async () => toggle.props.onPress());
  expect(inputs()[1].props.secureTextEntry).toBe(false);
  toggle = tree!.root.findAllByType('button').find(node => node.props.accessibilityLabel === translations.t(inputs()[1].props.secureTextEntry ? 'auth.showPassword' : 'auth.hidePassword'))!;
  expect(toggle.props.accessibilityLabel).toBe(translations.t('auth.hidePassword'));
  await act(async () => toggle.props.onPress());
  expect(inputs()[1].props.secureTextEntry).toBe(true);
  expect(onPasswordChange).not.toHaveBeenCalled();
});
it('disables inputs and password visibility during submission', async () => {
  await render(false, true);
  expect(inputs().every(input => input.props.editable === false)).toBe(true);
  expect(tree!.root.findAllByType('button').find(node => node.props.accessibilityLabel === translations.t(inputs()[1].props.secureTextEntry ? 'auth.showPassword' : 'auth.hidePassword'))!.props.disabled).toBe(true);
});
it.each(['en', 'ko', 'ja'] as const)('shows registration guidance from actual %s resources only in registration', async language => {
  await translations.changeLanguage(language);
  await render(true);
  expect(JSON.stringify(tree!.toJSON())).toContain(translations.t('auth.passwordHint'));
  expect(translations.exists('auth.passwordHint', { lng: language, fallbackLng: false })).toBe(true);
  await act(async () => tree!.unmount()); tree = undefined;
  await render(false);
  expect(JSON.stringify(tree!.toJSON())).not.toContain(translations.t('auth.passwordHint'));
});
it('applies approved typography to the actual HeroUI label text', async () => {
  await render();
  for (const key of ['auth.email', 'auth.password']) {
    const label = tree!.root.findAllByType('text' as React.ElementType).find(node => node.children.includes(translations.t(key)))!;
    expect(label.props.className).toContain('text-sm');
    expect(label.props.className).toContain('font-semibold');
  }
});
