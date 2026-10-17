import * as React from 'react';
import { createInstance } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { localizationOptions } from '@/i18n/options';
import SettingsScreen from './settings-screen';

vi.mock('./provider', () => ({ useSettings: () => ({ activationRadiusMeters: 100, language: 'en', storageError: null, save: vi.fn() }) }));
vi.mock('@/features/auth/sign-out-action', () => ({ SignOutAction: () => null }));
vi.mock('react-native', () => ({ Text: 'span' }));
vi.mock('@/ui/shared', async () => {
  const { createElement } = await import('react');
  return { Screen: 'section', Notice: 'output', styles: { title: {} },
    Action: (props: Record<string, unknown>) => createElement('button', props),
    Field: (props: Record<string, unknown>) => createElement('input', props) };
});
let tree: ReactTestRenderer | undefined;
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const original = console.error;
  vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => { if (!String(args[0]).startsWith('react-test-renderer is deprecated')) original(...args); });
});
afterEach(async () => { await act(async () => tree?.unmount()); tree = undefined; vi.restoreAllMocks(); });
it.each([
  { language: 'ko', expected: '지원되는 언어와 올바른 AR 활성화 반경을 선택하세요.' },
  { language: 'ja', expected: '対応する言語と有効なAR有効範囲を選んでください。' },
])('updates a visible settings validation message when language changes to $language', async ({ language, expected }) => {
  const i18n = createInstance();
  await i18n.use(initReactI18next).init({ ...localizationOptions, lng: 'en', react: { useSuspense: false } });
  await act(async () => { tree = create(React.createElement(I18nextProvider, { i18n }, React.createElement(SettingsScreen))); });
  await act(async () => { tree!.root.findByType('input').props.onChangeText('0'); });
  const save = tree!.root.findAllByType('button').find((button) => button.props.title === 'Save settings');
  await act(async () => { save!.props.onPress(); });
  expect(tree!.root.findAllByType('output').map((node) => node.props.children)).toContain('Choose a supported language and a valid activation radius.');
  await act(async () => { await i18n.changeLanguage(language); });
  expect(tree!.root.findAllByType('output').map((node) => node.props.children)).toContain(expected);
});
