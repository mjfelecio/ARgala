import * as React from 'react';
import { vi } from 'vitest';
import { HeroUINativeProviderRaw } from 'heroui-native/provider-raw';

const nativeUi = vi.hoisted(() => ({ reactions: new Set<() => void>() }));

// Keep HeroUI components real; only native runtime boundaries are replaced.
vi.mock('react-native', () => ({
  Easing: { bezier: () => (value: number) => value }, Animated: { Interpolation: class {}, Value: class { interpolate() { return 0; } } }, BackHandler: { addEventListener: () => ({ remove() {} }) }, TextInput: 'input', View: 'view', Text: 'text', Pressable: 'button', ScrollView: 'scroll',
  Platform: { OS: 'android', select: (values: Record<string, unknown>) => values.android ?? values.default },
  ActivityIndicator: 'progress', StyleSheet: { create: (styles: unknown) => styles, flatten: (styles: unknown) => styles, absoluteFillObject: {}, hairlineWidth: 1 },
  I18nManager: { isRTL: false }, PixelRatio: { get: () => 1 },
  useWindowDimensions: () => ({ width: 360, height: 800 }),
}));
vi.mock('react-native-safe-area-context', () => ({ SafeAreaView: 'safe-area', SafeAreaListener: 'safe-area-listener', useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));
vi.mock('uniwind', () => ({ useUniwind: () => ({ theme: 'light', hasAdaptiveThemes: false }), useResolveClassNames: (classes: string) => ({ padding: classes.includes('p-8') ? 32 : classes.includes('p-4') ? 16 : 8, borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: '#FFFFFF', borderRadius: 0 }), useCSSVariable: (name: string | string[]) => Array.isArray(name) ? name.map(() => '#247A53') : '#247A53', withUniwind: (component: unknown) => component }));
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
  const { createElement, forwardRef, useImperativeHandle } = await import('react');
  return { default: forwardRef((props: Record<string, unknown>, ref) => {
    useImperativeHandle(ref, () => ({ snapToIndex: (index: number) => {
      (props.onChange as (index: number, position: number) => void)?.(index, (props.containerHeight as number) - (props.snapPoints as number[])[index]);
    } }));
    return createElement('dialog', props, createElement((props.handleComponent as React.ElementType) ?? 'header', { accessible: true, animatedIndex: props.animatedIndex, animatedPosition: props.animatedPosition }), props.children as React.ReactNode);
  }), BottomSheetScrollView: 'section', BottomSheetHandle: 'header' };
});

export { nativeUi };
