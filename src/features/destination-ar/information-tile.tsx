import { ViroNode, ViroQuad, ViroText } from '@reactvision/react-viro';
import { useTranslation } from 'react-i18next';
import type { RingContent } from './development-ring-content';
import type { RingSlot } from './scene-geometry';
import type { ArNativeStyle } from './native-styles';
export function InformationTile({ content, slot, enabled, style, onSelect }: { content: RingContent; slot: RingSlot; enabled: boolean; style: ArNativeStyle; onSelect(id: string): void }) {
  const { t } = useTranslation();
  return <ViroNode testID={`ring-tile-${content.id}`} position={slot.position} rotation={slot.rotation} onClick={enabled ? () => onSelect(content.id) : undefined}>
    <ViroQuad width={0.71} height={0.71} materials="argalaRingEdge" />
    <ViroQuad width={0.68} height={0.68} position={[0, 0, 0.003]} opacity={0.94} materials="argalaRingSurface" />
    <ViroText position={[0, 0.23, 0.006]} width={0.61} height={0.08} text={t('destinationRing.sampleLabel')} style={style.text(3)} />
    <ViroText position={[0, 0.02, 0.006]} width={0.61} height={0.22} text={t(content.titleKey)} style={style.text(5, 'center', '600')} />
    <ViroText position={[0, -0.22, 0.006]} width={0.61} height={0.12} text={t('destinationRing.hold')} style={style.text(3)} />
  </ViroNode>;
}
export function NativePanelAction({ id, label, position, width = 0.28, enabled, style, onPress }: {
  id: string; label: string; position: [number, number, number]; width?: number; enabled: boolean; style: ArNativeStyle; onPress(): void;
}) {
  return <ViroNode testID={`ring-action-${id}`} position={position} opacity={enabled ? 1 : 0.35} onClick={enabled ? onPress : undefined}>
    <ViroQuad width={width} height={0.12} materials="argalaRingAction" />
    <ViroText position={[0, 0, 0.004]} width={width - 0.02} height={0.1} text={label} style={style.text(3)} />
  </ViroNode>;
}
