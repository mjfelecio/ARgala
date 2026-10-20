import { withHeroUI } from '@/test/native-ui';
import * as React from 'react';
import { createInstance, type i18n } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { localizationOptions } from '@/i18n/options';
import { RadiusControl } from './radius-control';

let tree: ReactTestRenderer | undefined;
let translations: i18n;
function Harness({ initial = '123', disabled = false }) {
  const [value, setValue] = React.useState(initial);
  return <RadiusControl value={value} onChange={setValue} disabled={disabled} />;
}
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true, __DEV__: false });
  translations = createInstance();
  await translations.use(initReactI18next).init({ ...localizationOptions, lng: 'en', react: { useSuspense: false } });
  const original = console.error;
  vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => { if (!String(args[0]).startsWith('react-test-renderer is deprecated')) original(...args); });
});
afterEach(async () => { await act(async () => tree?.unmount()); tree = undefined; vi.restoreAllMocks(); });
async function mount(initial = '123', disabled = false) { await act(async () => { tree = create(<I18nextProvider i18n={translations}>{withHeroUI(<Harness initial={initial} disabled={disabled} />)}</I18nextProvider>); }); }
const input = () => tree!.root.findByType('input');
const thumb = () => tree!.root.findAllByType('view').find(node => node.props.role === 'slider')!;
it('preserves a precise non-preset radius and synchronizes presets, entry and the real slider', async () => {
  await mount();
  expect(thumb().props.accessibilityValue).toMatchObject({ min: 10, max: 1000, now: 123 });
  for (const value of [50, 100, 200, 500]) {
    const preset = tree!.root.findAllByType('button').find(node => node.props.accessibilityLabel === translations.t('settings.meters', { count: value }))!;
    await act(async () => preset.props.onPress());
    expect(input().props.value).toBe(String(value));
    expect(thumb().props.accessibilityValue.now).toBe(value);
  }
  await act(async () => input().props.onChangeText('123'));
  await act(async () => thumb().props.onAccessibilityAction({ nativeEvent: { actionName: 'increment' } }));
  expect(input().props.value).toBe('124');
  await act(async () => thumb().props.onAccessibilityAction({ nativeEvent: { actionName: 'decrement' } }));
  expect(input().props.value).toBe('123');
});
it.each(['10', '100', '123', '1000'])('represents valid integer %s exactly', async value => {
  await mount(value);
  expect(input().props.value).toBe(value);
  expect(thumb().props.accessibilityValue.now).toBe(Number(value));
  expect(JSON.stringify(tree!.toJSON())).not.toContain(translations.t('settings.invalid'));
});
it.each(['9', '1001', '', '12.3', 'NaN'])('retains invalid keyboard draft %s with a localized error until explicit recovery', async value => {
  await mount();
  await act(async () => input().props.onChangeText(value));
  expect(input().props.value).toBe(value);
  expect(JSON.stringify(tree!.toJSON())).toContain(translations.t('settings.invalid'));
  await act(async () => input().props.onChangeText('10'));
  expect(thumb().props.accessibilityValue.now).toBe(10);
  expect(JSON.stringify(tree!.toJSON())).not.toContain(translations.t('settings.invalid'));
});
it('disables entry, presets and slider while saving', async () => {
  await mount('123', true);
  expect(input().props.editable).toBe(false);
  expect(thumb().props.accessibilityState.disabled).toBe(true);
  expect(tree!.root.findAllByType('button').filter(node => node.props.accessibilityLabel).every(node => node.props.accessibilityState.disabled)).toBe(true);
});
