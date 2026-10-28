import { ringCopy } from './ring-copy';
import { ArText } from './ar-text';
import { ViroNode, ViroQuad } from '@reactvision/react-viro';
import { useTranslation } from 'react-i18next';
import type { RingContent } from './development-ring-content';
import type { RingSlot } from './scene-geometry';
import type { ArNativeStyle } from './native-styles';
export function InformationTile({ content, slot, enabled, style, onSelect }: { content: RingContent; slot: RingSlot; enabled: boolean; style: ArNativeStyle; onSelect(id: string): void }) {
  const { t, i18n } = useTranslation();
  return <ViroNode testID={`ring-tile-${content.id}`} position={slot.position} rotation={slot.rotation} onClick={enabled ? () => onSelect(content.id) : undefined}>
    <ViroQuad renderingOrder={0} ignoreEventHandling width={0.71} height={0.71} materials="argalaRingEdge" />
    <ViroQuad renderingOrder={1} highAccuracyEvents ignoreEventHandling={!enabled} width={0.68} height={0.68} position={[0, 0, 0.003]} opacity={0.94} materials="argalaRingSurface" />
    <ArText position={[0, 0.23, 0.006]} width={0.61} height={0.08} text={content.approved ? 'ARgala' : t('destinationRing.sampleLabel')} style={style.text(3)} />
    <ArText position={[0, 0.02, 0.006]} width={0.61} height={0.22} text={ringCopy(content, 'title', i18n.resolvedLanguage ?? i18n.language, key => t(key), key => i18n.exists(key))} style={style.text(5, 'center', '600')} />
    <ArText position={[0, -0.22, 0.006]} width={0.61} height={0.12} text={t('destinationRing.hold')} style={style.text(3)} />
  </ViroNode>;
}
export function NativePanelAction({ id, label, position, width = 0.28, enabled, style, onPress, renderingOrder = 2 }: {
  id: string; label: string; position: [number, number, number]; width?: number; enabled: boolean; style: ArNativeStyle; onPress(): void; renderingOrder?: number;
}) {
  // A rotated backplate AABB can sort ahead of an actual button. Test the
  // visible quad triangles only; its parent remains the sole click owner.
  return <ViroNode testID={`ring-action-${id}`} position={position} opacity={enabled ? 1 : 0.35} onClick={enabled ? onPress : undefined}>
    <ViroQuad renderingOrder={renderingOrder} highAccuracyEvents ignoreEventHandling={!enabled} width={width} height={0.18} materials="argalaRingAction" />
    <ArText renderingOrder={renderingOrder + 1} position={[0, 0, 0.004]} width={width - 0.02} height={0.15} text={label} style={style.text(4)} />
  </ViroNode>;
}
