import { useLayoutEffect, useRef } from 'react';
import { HolographicFrame } from './holographic-frame';
import { ChapterEmblem } from './chapter-emblem';
import { chapterPresentation } from './chapter-presentation';
import { ArText } from './ar-text';
import { ViroNode, ViroQuad } from '@reactvision/react-viro';
import { useTranslation } from 'react-i18next';
import type { RingContent } from './development-ring-content';
import type { RingSlot } from './scene-geometry';
import type { ArNativeStyle } from './native-styles';
import { nativePanelActionHeight } from './reader-layout';
export { nativePanelActionHeight } from './reader-layout';
export function InformationTile({ content, slot, enabled, style, onSelect, decorations = true, ordinal = 1, chapterCount = 1, opened = false }: { content: RingContent; slot: RingSlot; enabled: boolean; style: ArNativeStyle; onSelect(id: string): void; decorations?: boolean; ordinal?: number; chapterCount?: number; opened?: boolean }) {
  const { t, i18n } = useTranslation();
  const chapter = chapterPresentation(content, i18n.resolvedLanguage ?? i18n.language, key => t(key), key => i18n.exists(key));
  return <ViroNode testID={`ring-tile-${content.id}`} position={slot.position} rotation={slot.rotation} onClick={enabled ? () => onSelect(content.id) : undefined}>
    <HolographicFrame width={0.71} height={0.71} decorations={decorations} interactiveSurface={enabled} />
    <ArText position={[0, 0.275, 0.006]} width={0.61} height={0.07} text={t('destinationStories.chapter', { current: ordinal, total: chapterCount })} style={style.text(3)} />
    <ChapterEmblem content={content} />
    <ArText position={[0, -0.055, 0.006]} width={0.59} height={0.14} text={chapter.coverTitle} style={style.text(5.5, 'center', '600')} />
    {opened && <ArText testID={`ring-opened-${content.id}`} position={[0, -0.205, 0.006]} width={0.59} height={0.06} text={t('destinationStories.opened')} style={style.text(3)} />}
    <ArText position={[0, -0.28, 0.006]} width={0.61} height={0.07} text={content.approved ? t('destinationRing.tap') : t('destinationRing.sampleLabel')} style={style.text(3)} />
  </ViroNode>;
}
export function NativePanelAction({ id, label, position, width = 0.28, enabled, style, onPress, renderingOrder = 2, primary = false }: {
  id: string; label: string; position: [number, number, number]; width?: number; enabled: boolean; style: ArNativeStyle; onPress(): void; renderingOrder?: number; primary?: boolean;
}) {
  const current = useRef<(() => void) | null>(null);
  useLayoutEffect(() => { current.current = enabled ? onPress : null; return () => { current.current = null; }; }, [enabled, onPress]);
  // A rotated backplate AABB can sort ahead of an actual button. Test the
  // visible quad triangles only; its parent remains the sole click owner.
  return <ViroNode testID={`ring-action-${id}`} position={position} opacity={enabled ? 1 : 0.35} onClick={enabled ? () => current.current?.() : undefined}>
    <ViroQuad renderingOrder={renderingOrder} highAccuracyEvents ignoreEventHandling={!enabled} width={width} height={nativePanelActionHeight} materials={primary ? 'argalaRingRoundedAction' : 'argalaRingRoundedSurface'} />
    <ArText renderingOrder={renderingOrder + 1} position={[0, 0, 0.004]} width={width - 0.02} height={0.15} text={label} style={style.text(4)} />
  </ViroNode>;
}
