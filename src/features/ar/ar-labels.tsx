import { Pressable, Text } from 'react-native';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Animated, { cancelAnimation, Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { AR } from '@/config/limits';
import type { OverlayLabel } from './projection';

type Props = { labels: OverlayLabel[]; selectedId: string | null; onSelect(id: string): void; top: number; bottom: number; fontScale: number };
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function ArLabel({ label, lane, selected, onSelect, top, stride, laneHeight, scale }: {
  label: OverlayLabel; lane: number; selected: boolean; onSelect(id: string): void;
  top: number; stride: number; laneHeight: number; scale: number;
}) {
  const { t } = useTranslation();
  const x = useSharedValue(label.left);
  const previous = useRef({ left: label.left, width: label.width, lane });
  useEffect(() => {
    const old = previous.current;
    // Interpolate presentation only. Reflow and large jumps snap to their new
    // lane; lost/stale direction removes this component immediately upstream.
    if (old.width !== label.width || old.lane !== lane || Math.abs(old.left - label.left) > label.width) x.set(label.left);
    else if (old.left !== label.left) x.set(withTiming(label.left, { duration: 80, easing: Easing.linear, reduceMotion: ReduceMotion.System }));
    previous.current = { left: label.left, width: label.width, lane };
    return () => cancelAnimation(x);
  }, [label.left, label.width, lane, x]);
  const movement = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));
  const distance = t('ar.distance', { meters: Math.round(label.distance) });
  return <AnimatedPressable testID={`ar-label-${label.place.providerId}`}
    accessibilityRole="button" accessibilityState={{ selected }} accessibilityLabel={`${label.place.name}, ${distance}`}
    onPress={() => onSelect(label.place.providerId)}
    className={selected ? 'absolute justify-center gap-1 rounded-card border-2 border-white bg-brand-strong px-3 py-2' : 'absolute justify-center gap-1 rounded-pill border border-white/80 bg-ink/95 px-3 py-2'}
    style={[{ left: 0, top: top + lane * stride, width: label.width, height: selected ? laneHeight : 24 + 36 * scale }, movement]}>
    {selected && <Text numberOfLines={1} className="font-sans text-sm font-bold text-white">{t('ar.selected')}</Text>}
    <Text numberOfLines={1} className="font-sans text-sm font-semibold text-white">{label.place.name}</Text>
    <Text numberOfLines={1} className="font-sans text-sm text-white">{distance}</Text>
  </AnimatedPressable>;
}

/** Reserve the largest badge in every lane; compact pills keep the same safe hit bounds. */
export function ArLabels({ labels, selectedId, onSelect, top, bottom, fontScale }: Props) {
  const scale = Math.max(1, fontScale);
  const laneHeight = 24 + 64 * scale;
  const stride = laneHeight + AR.labelGap;
  const slots = Math.max(0, Math.min(AR.maxLabels, Math.floor((bottom - top + AR.labelGap) / stride)));
  return <>{labels.slice(0, slots).map((label, lane) => <ArLabel key={label.place.providerId} label={label} lane={lane}
    selected={selectedId === label.place.providerId} onSelect={onSelect} top={top} stride={stride} laneHeight={laneHeight} scale={scale} />)}</>;
}
