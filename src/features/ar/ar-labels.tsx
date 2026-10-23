import { Pressable, Text } from 'react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AR } from '@/config/limits';
import type { OverlayLabel } from './projection';
import { snapLabelLeft } from './label-placement';

type Props = { labels: OverlayLabel[]; selectedId: string | null; onSelect(id: string): void; top: number; bottom: number; fontScale: number };

function ArLabel({ label, lane, selected, onSelect, top, stride, laneHeight, scale }: {
  label: OverlayLabel; lane: number; selected: boolean; onSelect(id: string): void;
  top: number; stride: number; laneHeight: number; scale: number;
}) {
  const { t } = useTranslation();
  const [displayed, setDisplayed] = useState(() => ({
    left: snapLabelLeft(null, label.left, AR.labelGap, label.maxLeft), width: label.width, maxLeft: label.maxLeft, lane,
  }));
  const reset = displayed.width !== label.width || displayed.maxLeft !== label.maxLeft || displayed.lane !== lane;
  const left = snapLabelLeft(reset ? null : displayed.left, label.left, AR.labelGap, label.maxLeft);
  if (displayed.left !== left || reset) setDisplayed({ left, width: label.width, maxLeft: label.maxLeft, lane });
  const distance = t('ar.distance', { meters: Math.round(label.distance) });
  return <Pressable testID={`ar-label-${label.place.providerId}`}
    accessibilityRole="button" accessibilityState={{ selected }} accessibilityLabel={`${label.place.name}, ${distance}`}
    onPress={() => onSelect(label.place.providerId)}
    className={selected ? 'absolute justify-center gap-1 rounded-card border-2 border-white bg-brand-strong px-3 py-2' : 'absolute justify-center gap-1 rounded-pill border border-white/80 bg-ink/95 px-3 py-2'}
    style={{ left, top: top + lane * stride, width: label.width, height: selected ? laneHeight : 24 + 36 * scale }}>
    {selected && <Text numberOfLines={1} className="font-sans text-sm font-bold text-white">{t('ar.selected')}</Text>}
    <Text numberOfLines={1} className="font-sans text-sm font-semibold text-white">{label.place.name}</Text>
    <Text numberOfLines={1} className="font-sans text-sm text-white">{distance}</Text>
  </Pressable>;
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
