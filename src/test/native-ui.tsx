import * as React from 'react';
import { vi } from 'vitest';
import { HeroUINativeProviderRaw } from 'heroui-native/provider-raw';
import type { BottomSheetProps } from '@gorhom/bottom-sheet';

const nativeUi = vi.hoisted(() => ({ modules: {} as Record<string, unknown>, sheetReady: true, fontScale: 1, mutableValueWrites: [] as unknown[], animatedStyles: new WeakMap<object, () => Record<string, unknown>>(), reactions: new Set<() => void>(), openURL: vi.fn(), alert: vi.fn(), insets: { top: 24, bottom: 24, left: 0, right: 0 } }));

// Keep HeroUI components real; only native runtime boundaries are replaced.
vi.mock('react-native', () => ({
  NativeModules: nativeUi.modules,
  Button: (props: { title: string }) => React.createElement('button', { accessibilityLabel: props.title, ...props }),
  AppState: { currentState: 'active', addEventListener: () => ({ remove: vi.fn() }) }, KeyboardAvoidingView: 'keyboard-avoiding',
  Alert: { alert: nativeUi.alert }, Linking: { openURL: nativeUi.openURL, openSettings: vi.fn() },
  Easing: { bezier: () => (value: number) => value }, Animated: { Interpolation: class {}, Value: class { interpolate() { return 0; } } }, BackHandler: { addEventListener: () => ({ remove() {} }) }, Image: 'img', TextInput: 'input', View: 'view', Text: 'text', Pressable: 'button', ScrollView: 'scroll',
  Platform: { OS: 'android', select: (values: Record<string, unknown>) => values.android ?? values.default },
  Modal: 'modal', ActivityIndicator: 'progress', StyleSheet: { create: (styles: unknown) => styles, flatten: (styles: unknown) => styles, absoluteFillObject: {}, hairlineWidth: 1 },
  I18nManager: { isRTL: false }, PixelRatio: { get: () => 1 },
  useWindowDimensions: () => ({ width: 360, height: 800, fontScale: nativeUi.fontScale }),
}));
vi.mock('expo-status-bar', () => ({ StatusBar: 'status-bar' }));
vi.mock('react-native-safe-area-context', () => ({ SafeAreaView: 'safe-area', SafeAreaListener: 'safe-area-listener', useSafeAreaInsets: () => nativeUi.insets }));
vi.mock('uniwind', () => ({ useUniwind: () => ({ theme: 'light', hasAdaptiveThemes: false }), useResolveClassNames: (classes: string) => ({ padding: classes.includes('p-8') ? 32 : classes.includes('p-4') ? 16 : 8, ...(classes.includes('h-16') ? { height: 64 } : {}), borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: '#FFFFFF', borderRadius: 0 }), useCSSVariable: (name: string | string[]) => Array.isArray(name) ? name.map(value => value === '--color-muted' ? '#3F4942' : '#247A53') : '#247A53', withUniwind: (component: unknown) => component }));
vi.mock('@expo/vector-icons/Ionicons', () => ({ default: 'icon' }));
vi.mock('react-native-svg', () => ({ default: 'svg', Svg: 'svg', Path: 'path', Circle: 'circle', Defs: 'defs', LinearGradient: 'gradient', Stop: 'stop', Rect: 'rect', G: 'g' }));
vi.mock('react-native-gesture-handler', () => {
  function gesture(kind: string) {
    const handlers: Record<string, (...args: unknown[]) => void> = {};
    return { kind, handlers,
      runOnJS() { return this; }, enabled() { return this; },
      onBegin(callback: (...args: unknown[]) => void) { handlers.begin = callback; return this; },
      onUpdate(callback: (...args: unknown[]) => void) { handlers.update = callback; return this; },
      onEnd(callback: (...args: unknown[]) => void) { handlers.end = callback; return this; },
      onFinalize(callback: (...args: unknown[]) => void) { handlers.finalize = callback; return this; },
    };
  }
  return { GestureDetector: 'gesture', Gesture: { Tap: () => gesture('tap'), Pan: () => gesture('pan') } };
});
vi.mock('react-native-worklets', () => ({ scheduleOnRN: (callback: (...args: unknown[]) => unknown, ...args: unknown[]) => callback(...args) }));
vi.mock('react-native-reanimated', async () => {
  const chain = { duration() { return this; }, springify() { return this; }, delay() { return this; }, easing() { return this; }, withInitialValues() { return this; } };
  return {
    makeMutable: (value: unknown) => {
      let current = value;
      return {
        get value() { return current; },
        // The installed useReactiveSharedValue assigns .value during render.
        set value(next: unknown) { nativeUi.mutableValueWrites.push(next); current = next; },
        get() { return current; }, set(next: unknown) { current = next; },
      };
    },
    default: { View: 'view', Text: 'text', createAnimatedComponent: (component: unknown) => component },
    useSharedValue: (value: unknown) => React.useRef({ value, get() { return this.value; }, set(next: unknown) { this.value = typeof next === 'function' ? next(this.value) : next; } }).current,
    useAnimatedStyle: (factory: () => Record<string, unknown>) => {
      const style = React.useRef({}).current;
      nativeUi.animatedStyles.set(style, factory);
      return style;
    }, useAnimatedProps: () => ({}), useAnimatedRef: () => React.useRef(null),
    useDerivedValue: () => ({ value: 0 }), useAnimatedReaction: (prepare: () => unknown, react: (next: unknown, previous: unknown) => void) => {
      React.useEffect(() => {
        let previous: unknown = null;
        const tick = () => { const next = prepare(); react(next, previous); previous = next; };
        nativeUi.reactions.add(tick);
        return () => { nativeUi.reactions.delete(tick); };
      }, [prepare, react]);
    },
    withTiming: (value: unknown) => value, withSpring: (value: unknown) => value, withRepeat: (value: unknown) => value,
    withSequence: (value: unknown) => value, cancelAnimation: () => {}, interpolate: () => 0, interpolateColor: () => '#247A53',
    runOnJS: (callback: unknown) => callback, Easing: { linear: () => 0, quad: () => 0, out: () => () => 0, in: () => () => 0, inOut: () => () => 0, bezier: () => () => 0 },
    Keyframe: class { duration() { return this; } }, useReducedMotion: () => true, useAnimatedScrollHandler: () => ({}), FadeIn: chain, FadeOut: chain, LinearTransition: chain, ReduceMotion: { System: 'system' }, Extrapolation: { CLAMP: 'clamp' },
  };
});

export function withHeroUI(children: React.ReactNode) {
  return <HeroUINativeProviderRaw config={{ animation: 'disable-all', devInfo: { stylingPrinciples: false } }}>{children}</HeroUINativeProviderRaw>;
}

// The native sheet driver exposes gesture/position events; application composition stays real.
vi.mock('@gorhom/bottom-sheet', async () => {
  const { createElement, forwardRef, useImperativeHandle, useEffect } = await import('react');
  const { usePropsValidator } = await vi.importActual<typeof import('@gorhom/bottom-sheet/lib/typescript/hooks/usePropsValidator')>('@gorhom/bottom-sheet/lib/module/hooks/usePropsValidator.js');
  const { useReactiveSharedValue } = await vi.importActual<typeof import('@gorhom/bottom-sheet/lib/typescript/hooks/useReactiveSharedValue')>('@gorhom/bottom-sheet/lib/module/hooks/useReactiveSharedValue.js');
  return { default: forwardRef((props: BottomSheetProps, ref) => {
    const nativeIndex = useReactiveSharedValue(props.animateOnMount ? -1 : props.index ?? 0);
    const sheetReady = nativeUi.sheetReady;
    // Model the index-prop effect and the native layout-ready reaction.
    useEffect(() => { if (sheetReady) nativeIndex.set(props.index ?? 0); }, [nativeIndex, props.index, sheetReady]);
    // Keep the installed library's JS prop contract; mock only the native driver.
    usePropsValidator(props);
    useImperativeHandle(ref, () => ({ snapToIndex: (index: number) => {
      // SDK 5.2.14 discards imperative requests before native layout is ready.
      if (!nativeUi.sheetReady) return;
      nativeIndex.set(index);
      (props.onChange as (index: number, position: number) => void)?.(index, props.containerLayoutState!.get().height - (props.snapPoints as number[])[index]);
    } }));
    return createElement('dialog', { ...props, nativeIndex }, createElement((props.handleComponent as React.ElementType) ?? 'header', { accessible: true, animatedIndex: props.animatedIndex, animatedPosition: props.animatedPosition }), props.children as React.ReactNode);
  }), BottomSheetScrollView: 'section', BottomSheetHandle: 'header' };
});

export { nativeUi };
