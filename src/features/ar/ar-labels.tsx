import { Pressable, Text } from 'react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AR } from '@/config/limits';
import type { OverlayLabel } from './projection';
import { snapLabelLeft } from './label-placement';

type Props = { labels: OverlayLabel[]; selectedId: string | null; onSelect(id: string): void; onInspect(id: string): void; top: number; bottom: number; fontScale: number };

function ArLabel({ label, lane, selected, onSelect, onInspect, top, stride, laneHeight, scale }: {
  label: OverlayLabel; lane: number; selected: boolean; onSelect(id: string): void; onInspect(id: string): void;
  top: number; stride: number; laneHeight: number; scale: number;
}) {
  const { t } = useTranslation();
  const [displayed, setDisplayed] = useState(() => ({
    left: snapLabelLeft(null, label.left, AR.labelGap, label.maxLeft), width: label.width, maxLeft: label.maxLeft, lane,
  }));
  const reset = displayed.width !== label.width || displayed.maxLeft !== label.maxLeft || displayed.lane !== lane;
  const left = snapLabelLeft(reset ? null : displayed.left, label.left, AR.labelGap, label.maxLeft);
  if (displayed.left !== left || reset) setDisplayed({ left, width: label.width, maxLeft: label.maxLeft, lane });
  const distance = t('ar.approximateDistance', { meters: Math.round(label.distance) });
  const rich = selected;
  const metadata = selected ? label.place.address?.trim() || label.place.description?.trim() || '' : '';
  const status = selected
    ? label.eligible ? t('ar.selectedWithinRange') : t('ar.selected')
    : '';
  const action = selected ? t('placeDetails.view') : t('ar.selectPlace');
  const height = !rich ? 24 + 36 * scale : metadata ? laneHeight : 32 + 80 * scale;
  const accessibilityLabel = [label.place.name, distance, status, metadata, action].filter(Boolean).join(', ');
  const textColor = selected ? 'text-white' : 'text-foreground';
  return <Pressable testID={`ar-label-${label.place.providerId}`}
    accessibilityRole="button" accessibilityState={{ selected }} accessibilityLabel={accessibilityLabel}
    onPress={() => selected ? onInspect(label.place.providerId) : onSelect(label.place.providerId)}
    className={selected
      ? 'absolute justify-center gap-1 rounded-card border-2 border-white bg-brand-strong px-3 py-2 shadow-sm'
      : 'absolute justify-center gap-1 rounded-card border border-brand-primary bg-surface px-3 py-2 shadow-sm'}
    style={{ left, top: top + lane * stride, width: label.width, height }}>
    <Text numberOfLines={1} className={`font-sans text-sm leading-4 font-semibold ${textColor}`}>{label.place.name}</Text>
    <Text numberOfLines={1} className={`font-sans text-xs leading-4 ${textColor}`}>{distance}</Text>
    {rich && <>
      <Text numberOfLines={1} className={`font-sans text-xs leading-4 ${textColor}`}>{status}</Text>
      {metadata ? <Text numberOfLines={2} className={`font-sans text-xs leading-4 ${textColor}`}>{metadata}</Text> : null}
      <Text numberOfLines={1} className={`font-sans text-xs leading-4 ${textColor}`}>{action}</Text>
    </>}
  </Pressable>;
}

/** Reserve the largest badge in every lane; compact pills keep the same safe hit bounds. */
export function ArLabels({ labels, selectedId, onSelect, onInspect, top, bottom, fontScale }: Props) {
  const scale = Math.max(1, fontScale);
  const laneHeight = 32 + 112 * scale;
  const stride = laneHeight + AR.labelGap;
  const slots = Math.max(0, Math.min(AR.maxLabels, Math.floor((bottom - top + AR.labelGap) / stride)));
  return <>{labels.slice(0, slots).map((label, lane) => <ArLabel key={label.place.providerId} label={label} lane={lane}
    selected={selectedId === label.place.providerId} onSelect={onSelect} onInspect={onInspect} top={top} stride={stride} laneHeight={laneHeight} scale={scale} />)}</>;
}
