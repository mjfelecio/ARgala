import * as React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { createInstance, type i18n } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { localizationOptions } from '@/i18n/options';
import ShowcaseScreen from './showcase-screen';
import { HeroUINativeProviderRaw } from 'heroui-native/provider-raw';
import { DevelopmentShowcase } from './showcase-gate';

// Keep HeroUI components real; only native runtime boundaries are replaced.
vi.mock('react-native', () => ({
  Easing: { bezier: () => (value: number) => value }, Animated: { Interpolation: class {}, Value: class { interpolate() { return 0; } } }, BackHandler: { addEventListener: () => ({ remove() {} }) }, TextInput: 'input', View: 'view', Text: 'text', Pressable: 'button', ScrollView: 'scroll',
  Platform: { OS: 'android', select: (values: Record<string, unknown>) => values.android ?? values.default },
  StyleSheet: { create: (styles: unknown) => styles, flatten: (styles: unknown) => styles, absoluteFillObject: {}, hairlineWidth: 1 },
  I18nManager: { isRTL: false }, PixelRatio: { get: () => 1 },
  useWindowDimensions: () => ({ width: 360, height: 800 }),
}));
vi.mock('react-native-safe-area-context', () => ({ SafeAreaView: 'safe-area', SafeAreaListener: 'safe-area-listener', useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));
vi.mock('uniwind', () => ({ useUniwind: () => ({ theme: 'light', hasAdaptiveThemes: false }), useCSSVariable: (name: string | string[]) => Array.isArray(name) ? name.map(() => '#247A53') : '#247A53', withUniwind: (component: unknown) => component }));
vi.mock('@expo/vector-icons/Ionicons', () => ({ default: 'icon' }));
vi.mock('react-native-svg', () => ({ default: 'svg', Svg: 'svg', Path: 'path', Circle: 'circle', Defs: 'defs', LinearGradient: 'gradient', Stop: 'stop', Rect: 'rect', G: 'g' }));
vi.mock('react-native-gesture-handler', () => ({ GestureDetector: 'gesture', Gesture: { Tap: () => ({ enabled() { return this; }, onBegin() { return this; }, onFinalize() { return this; } }) } }));
vi.mock('react-native-worklets', () => ({ scheduleOnRN: (callback: (...args: unknown[]) => unknown, ...args: unknown[]) => callback(...args) }));
vi.mock('react-native-reanimated', async () => {
  const chain = { duration() { return this; }, springify() { return this; }, delay() { return this; }, easing() { return this; }, withInitialValues() { return this; } };
  return {
    default: { View: 'view', Text: 'text', createAnimatedComponent: (component: unknown) => component },
    useSharedValue: (value: unknown) => React.useRef({ value, get() { return this.value; }, set(next: unknown) { this.value = next; } }).current,
    useAnimatedStyle: () => ({}), useAnimatedProps: () => ({}), useAnimatedRef: () => React.useRef(null),
    useDerivedValue: () => ({ value: 0 }), useAnimatedReaction: () => {},
    withTiming: (value: unknown) => value, withSpring: (value: unknown) => value, withRepeat: (value: unknown) => value,
    withSequence: (value: unknown) => value, cancelAnimation: () => {}, interpolate: () => 0, interpolateColor: () => '#247A53',
    runOnJS: (callback: unknown) => callback, Easing: { linear: () => 0, quad: () => 0, out: () => () => 0, in: () => () => 0, inOut: () => () => 0, bezier: () => () => 0 },
    Keyframe: class { duration() { return this; } }, useReducedMotion: () => true, useAnimatedScrollHandler: () => ({}), FadeIn: chain, FadeOut: chain, LinearTransition: chain, ReduceMotion: { System: 'system' }, Extrapolation: { CLAMP: 'clamp' },
  };
});

function withHeroUI(children: React.ReactNode) {
  return <HeroUINativeProviderRaw config={{ animation: 'disable-all', devInfo: { stylingPrinciples: false } }}>{children}</HeroUINativeProviderRaw>;
}
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
