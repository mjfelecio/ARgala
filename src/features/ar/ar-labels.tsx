import { Pressable, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AR } from '@/config/limits';
import type { OverlayLabel } from './projection';

type Props = { labels: OverlayLabel[]; selectedId: string | null; onSelect(id: string): void; top: number; bottom: number; fontScale: number };
/** Reserve the largest badge in every lane; compact pills keep the same safe hit bounds. */
export function ArLabels({ labels, selectedId, onSelect, top, bottom, fontScale }: Props) {
  const { t } = useTranslation();
  const scale = Math.max(1, fontScale);
  const laneHeight = 24 + 64 * scale;
  const stride = laneHeight + AR.labelGap;
  const slots = Math.max(0, Math.min(AR.maxLabels, Math.floor((bottom - top + AR.labelGap) / stride)));
  return <>{labels.slice(0, slots).map((label, lane) => {
    const selected = selectedId === label.place.providerId;
    const distance = t('ar.distance', { meters: Math.round(label.distance) });
    return <Pressable key={label.place.providerId} testID={`ar-label-${label.place.providerId}`}
      accessibilityRole="button" accessibilityState={{ selected }} accessibilityLabel={`${label.place.name}, ${distance}`}
      onPress={() => onSelect(label.place.providerId)}
      className={selected ? 'absolute justify-center gap-1 rounded-card border-2 border-white bg-brand-strong px-3 py-2' : 'absolute justify-center gap-1 rounded-pill border border-white/80 bg-ink/95 px-3 py-2'}
      style={{ left: label.left, top: top + lane * stride, width: label.width, height: selected ? laneHeight : 24 + 36 * scale }}>
      {selected && <Text numberOfLines={1} className="font-sans text-sm font-bold text-white">{t('ar.selected')}</Text>}
      <Text numberOfLines={1} className="font-sans text-sm font-semibold text-white">{label.place.name}</Text>
      <Text numberOfLines={1} className="font-sans text-sm text-white">{distance}</Text>
    </Pressable>;
  })}</>;
}
