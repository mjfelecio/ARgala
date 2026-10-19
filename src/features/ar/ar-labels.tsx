import { Pressable, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AR } from '@/config/limits';
import type { OverlayLabel } from './projection';

type Props = { labels: OverlayLabel[]; selectedId: string | null; onSelect(id: string): void; top: number; bottom: number; fontScale: number };
/** Identical bounded hit areas keep the rendered badges and collision lanes aligned. */
export function ArLabels({ labels, selectedId, onSelect, top, bottom, fontScale }: Props) {
  const { t } = useTranslation();
  const height = 32 + 64 * Math.max(1, fontScale);
  const stride = height + AR.labelGap;
  const slots = Math.max(0, Math.min(AR.maxLabels, Math.floor((bottom - top + AR.labelGap) / stride)));
  return <>{labels.slice(0, slots).map((label, lane) => {
    const selected = selectedId === label.place.providerId;
    const distance = t('ar.distance', { meters: Math.round(label.distance) });
    return <Pressable key={label.place.providerId} testID={`ar-label-${label.place.providerId}`}
      accessibilityRole="button" accessibilityState={{ selected }} accessibilityLabel={`${label.place.name}, ${distance}`}
      onPress={() => onSelect(label.place.providerId)}
      className={selected ? 'absolute justify-center gap-1 rounded-card border-2 border-brand-primary bg-surface px-3 py-2' : 'absolute justify-center gap-1 rounded-pill border border-outline bg-surface px-3 py-2'}
      style={{ left: label.left, top: top + lane * stride, width: label.width, height }}>
      {selected && <Text numberOfLines={1} className="font-sans text-xs font-semibold text-brand-strong">{t('ar.selected')}</Text>}
      <Text numberOfLines={1} className="font-sans text-sm font-semibold text-foreground">{label.place.name}</Text>
      <Text numberOfLines={1} className="font-sans text-xs text-muted">{distance}</Text>
    </Pressable>;
  })}</>;
}
