import { withHeroUI } from '@/test/native-ui';
import * as React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { createInstance, type i18n } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { localizationOptions } from '@/i18n/options';
import ShowcaseScreen from './showcase-screen';
import { DevelopmentShowcase } from './showcase-gate';

let tree: ReactTestRenderer;
let translations: i18n;
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  vi.stubGlobal('__DEV__', true);
  translations = createInstance();
  await translations.use(initReactI18next).init({ ...localizationOptions, lng: 'en', react: { useSuspense: false } });
  const original = console.error;
  vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => { if (!String(args[0]).startsWith('react-test-renderer is deprecated')) original(...args); });
  await act(async () => { tree = create(React.createElement(I18nextProvider, { i18n: translations }, withHeroUI(React.createElement(ShowcaseScreen)))); });
});
afterEach(async () => { await act(async () => tree?.unmount()); vi.restoreAllMocks(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
function button(key: string) {
  return tree.root.findAllByType('button').find(node => node.props.accessibilityLabel === translations.t(key))!;
}
function visibleText() { return tree.root.findAllByType('text').map(node => node.props.children).flat().join(' '); }
it('selects and resets local showcase state with accessible selected feedback', async () => {
  expect(visibleText()).toContain(translations.t('showcase.idle'));
  await act(async () => button('showcase.select').props.onPress());
  expect(visibleText()).toContain(translations.t('showcase.selected'));
  expect(button('showcase.select').props.accessibilityState.selected).toBe(true);
  await act(async () => button('showcase.reset').props.onPress());
  expect(visibleText()).toContain(translations.t('showcase.idle'));
  expect(button('showcase.select').props.accessibilityState.selected).toBe(false);
});
it('exposes disabled and busy actions while preserving their labels', () => {
  expect(button('showcase.disabled').props.disabled).toBe(true);
  expect(button('showcase.loading').props.disabled).toBe(true);
  expect(button('showcase.loading').props.accessibilityState.busy).toBe(true);
  expect(visibleText()).toContain(translations.t('showcase.loading'));
});
it.each(['ko', 'ja'])('translates the current selected state and actions after switching to %s', async language => {
  await act(async () => button('showcase.select').props.onPress());
  await act(async () => { await translations.changeLanguage(language); });
  expect(visibleText()).toContain(translations.t('showcase.selected'));
  expect(button('showcase.reset')).toBeDefined();
  expect(visibleText()).not.toContain(localizationOptions.resources.en.translation.showcase.selected);
});

it.each([[false, '1', false], [true, undefined, false], [true, '0', false], [true, '1', true]])('gates the diagnostic when development=%s and flag=%s', async (development, flag, enabled) => {
  vi.stubGlobal('__DEV__', development);
  vi.stubEnv('EXPO_PUBLIC_UI_SHOWCASE', flag);
  await act(async () => { tree.update(React.createElement(I18nextProvider, { i18n: translations }, withHeroUI(React.createElement(DevelopmentShowcase, null, React.createElement('main'))))); });
  expect(tree.root.findAllByType('main')).toHaveLength(enabled ? 0 : 1);
  expect(visibleText().includes(translations.t('showcase.title'))).toBe(enabled);
});
