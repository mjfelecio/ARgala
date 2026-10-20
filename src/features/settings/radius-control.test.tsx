import { withHeroUI } from '@/test/native-ui';
import * as React from 'react';
import { createInstance, type i18n } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { localizationOptions } from '@/i18n/options';
import { RadiusControl } from './radius-control';
import { Slider } from 'heroui-native/slider';

let tree: ReactTestRenderer | undefined;
let translations: i18n;
const parentRender = vi.fn();
function Harness({ initial = '123', disabled = false }) {
  const [value, setValue] = React.useState(initial);
  parentRender(value);
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
  expect(input().props.value).toBe('130');
  await act(async () => thumb().props.onAccessibilityAction({ nativeEvent: { actionName: 'decrement' } }));
  expect(input().props.value).toBe('120');
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

const gesture = (kind: string) => tree!.root.findAllByType('gesture' as React.ElementType).find(node => node.props.gesture.kind === kind)!.props.gesture;
async function measureTrack() {
  await act(async () => {
    tree!.root.findByType(Slider.Track).findAllByType('view').find(node => node.props.onLayout)!.props.onLayout({ nativeEvent: { layout: { width: 300, height: 20 } } });
    thumb().props.onLayout({ nativeEvent: { layout: { width: 20, height: 20 } } });
  });
}
it('uses 10 m detents and keeps gesture updates local until the real slider finishes dragging', async () => {
  await mount(); await measureTrack();
  const renders = parentRender.mock.calls.length;
  await act(async () => gesture('pan').handlers.begin());
  for (const translationX of [28, 56, 84]) {
    await act(async () => gesture('pan').handlers.update({ translationX, translationY: 0 }));
    expect(thumb().props.accessibilityValue.now % 10).toBe(0);
    expect(input().props.value).toBe(String(thumb().props.accessibilityValue.now));
    expect(parentRender.mock.calls.length).toBe(renders);
  }
  expect(input().props.value).toBe('420');
  await act(async () => gesture('pan').handlers.finalize());
  expect(parentRender.mock.calls.length).toBe(renders + 1);
  expect(parentRender.mock.lastCall).toEqual(['420']);
});
it('commits real track taps, clamps endpoints, and retains precise entry after slider interaction', async () => {
  await mount(); await measureTrack();
  await act(async () => gesture('tap').handlers.end({ x: 150, y: 10 }, true));
  expect(input().props.value).toBe('510');
  expect(parentRender.mock.lastCall).toEqual(['510']);
  await act(async () => gesture('tap').handlers.end({ x: 0, y: 10 }, true));
  expect(input().props.value).toBe('10');
  await act(async () => thumb().props.onAccessibilityAction({ nativeEvent: { actionName: 'decrement' } }));
  expect(input().props.value).toBe('10');
  await act(async () => gesture('tap').handlers.end({ x: 300, y: 10 }, true));
  expect(input().props.value).toBe('1000');
  await act(async () => thumb().props.onAccessibilityAction({ nativeEvent: { actionName: 'increment' } }));
  expect(input().props.value).toBe('1000');
  await act(async () => input().props.onChangeText('127'));
  expect(thumb().props.accessibilityValue.now).toBe(127);
  expect(parentRender.mock.lastCall).toEqual(['127']);
});
