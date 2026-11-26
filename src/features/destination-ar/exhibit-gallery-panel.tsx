import { useCallback, useLayoutEffect, useMemo } from 'react';
import { ViroNode } from '@reactvision/react-viro';
import { useTranslation } from 'react-i18next';
import { ArText } from './ar-text';
import { ExhibitFrame } from './exhibit-frame';
import { BundledGalleryPage, type ReadingCommand } from './information-panel';
import { NativePanelAction } from './information-tile';
import { galleryPages, galleryCursor, cursorAtPage } from './information-gallery';
import { readingSizes, type ReadingSize } from './reading-preference';
import { readerLayout } from './reader-layout';
import { ringMetrics } from './scene-geometry';
import { usePanelTransition } from './use-panel-transition';
import type { ReadingCursor } from './content-layout';
import type { ArNativeStyle } from './native-styles';
import type { FocusSelection } from './ring-controller';
import type { ExhibitStageProfile } from './exhibit-stage';
import type { useReadingSize } from './use-reading-size';

// Metadata gets its own full-height native actions, inside the original canvas.
export const exhibitGalleryLayout = {
  image: { y: 0.14, height: 0.64 }, caption: { y: -0.32, height: 0.22 }, metadataY: -0.525,
} as const;

/** A photo browser, never a synthetic chapter or an opening-progress producer. */
export function ExhibitGalleryPanel({ profile, selection, previous, reading, enabled, style, animationPrefix,
  onCursor, onClose, onComplete, onPageChange, onReadingControls, externalReadingControls = false, canInteract,
}: {
  profile: ExhibitStageProfile; selection: FocusSelection; previous?: ReadingCursor; reading: ReturnType<typeof useReadingSize>;
  enabled: boolean; style: ArNativeStyle; animationPrefix: string; decorations?: boolean; externalReadingControls?: boolean;
  onCursor(cursor: ReadingCursor): void; onClose(): void; onComplete(token: number): void; onPageChange?(): void;
  onReadingControls?(command: ReadingCommand | null): void;
  canInteract?(): boolean;
}) {
  const { t, i18n } = useTranslation(); const locale = i18n.resolvedLanguage ?? i18n.language;
  const hasNonPhotoMedia = profile.media.some(item => item.kind);
  const { ref, moving, closing, animation, transform } = usePanelTransition(selection, enabled, onComplete, animationPrefix);
  const layout = useCallback((size: ReadingSize) => galleryPages([], profile.media, locale, size,
    credit => t('destinationRing.imageCredit', { credit }), t('destinations.englishFallback'), 'gallery', exhibitGalleryLayout.caption.height), [profile.media, locale, t]);
  const pages = useMemo(() => layout(reading.size), [layout, reading.size]);
  const validPrevious = profile.media.some(photo => photo.id === previous?.mediaId) ? previous : undefined;
  const cursor = galleryCursor(pages, validPrevious, locale, reading.size); const page = pages[cursor.page];
  const photoIndex = profile.media.findIndex(photo => photo.id === page.media!.id);
  const metadataIndices = pages.flatMap((value, index) => value.media?.id === page.media!.id ? [index] : []);
  const metadataIndex = metadataIndices.indexOf(cursor.page);
  const interactive = enabled && !moving;
  function changePage(index: number) {
    if (!interactive || canInteract?.() === false) return;
    onCursor(cursorAtPage(pages, index, locale, reading.size)); onPageChange?.();
  }
  function changePhoto(delta: -1 | 1) {
    const next = profile.media[photoIndex + delta];
    if (next) changePage(pages.findIndex(value => value.media?.id === next.id));
  }
  const changeSize = useCallback<ReadingCommand>(delta => {
    if (!interactive || canInteract?.() === false) return;
    const size = readingSizes[Math.min(2, Math.max(0, readingSizes.indexOf(reading.size) + delta))];
    onCursor(galleryCursor(layout(size), cursor, locale, size)); reading.change(delta);
  }, [reading, onCursor, layout, cursor, locale, interactive, canInteract]);
  useLayoutEffect(() => {
    if (!interactive) { onReadingControls?.(null); return; }
    let current = true;
    onReadingControls?.(delta => { if (current) changeSize(delta); });
    return () => { current = false; onReadingControls?.(null); };
  }, [interactive, changeSize, onReadingControls]);
  return <ViroNode ref={ref} key={selection.token} testID="ring-focused-panel" position={transform.position} rotation={transform.rotation}
    scale={[transform.scale, transform.scale, transform.scale]} opacity={enabled ? 1 : 0.35} animation={animation}>
    <ExhibitFrame variant="reader" width={ringMetrics.panelWidth + 0.025} height={ringMetrics.panelHeight + 0.025} decorations={false} />
    <ArText testID="exhibit-gallery-heading" position={[-0.22, closing ? 0 : 0.55, 0.006]} width={0.65} height={0.08} text={t(hasNonPhotoMedia ? 'destinations.campusGallery' : 'presentation.galleryTitle')} style={style.text(4, 'left', '600')} />
    {!closing && <>
      <ArText testID="exhibit-photo-position" position={[0.35, 0.55, 0.006]} width={0.4} height={0.08} text={t(hasNonPhotoMedia ? 'destinations.imagePosition' : 'presentation.photoPosition', { current: photoIndex + 1, total: profile.media.length })} style={style.text(3)} />
      <BundledGalleryPage key={page.media!.id} page={page} size={reading.size} style={style} enabled={interactive} layout={exhibitGalleryLayout} animationPrefix={animationPrefix} />
      {selection.phase === 'focused' && <>
        {metadataIndices.length > 1 && <ViroNode testID="exhibit-caption-toolbar" position={[0, exhibitGalleryLayout.metadataY, 0.012]}>
          <NativePanelAction id="gallery-caption-previous" label={t('presentation.captionBack')} width={0.32} position={[-0.38, 0, 0]} enabled={interactive && metadataIndex > 0} style={style} onPress={() => changePage(metadataIndices[metadataIndex - 1])} />
          <ArText testID="exhibit-caption-position" position={[0, 0, 0.004]} width={0.36} height={0.1} text={t('destinationRing.page', { current: metadataIndex + 1, total: metadataIndices.length })} style={style.text(3)} />
          <NativePanelAction id="gallery-caption-next" label={t('presentation.captionMore')} width={0.32} position={[0.38, 0, 0]} enabled={interactive && metadataIndex < metadataIndices.length - 1} style={style} onPress={() => changePage(metadataIndices[metadataIndex + 1])} />
        </ViroNode>}
        <ViroNode testID="exhibit-gallery-toolbar" position={[0, readerLayout.toolbar.y, 0.012]}>
          <ExhibitFrame variant="toolbar" width={ringMetrics.panelWidth} height={readerLayout.toolbar.height} decorations={false} />
          <NativePanelAction id="gallery-photo-previous" label={t('destinationRing.previous')} width={0.36} position={[-0.4, 0, 0.004]} enabled={interactive && photoIndex > 0} style={style} onPress={() => changePhoto(-1)} />
          <NativePanelAction id="gallery-photo-next" label={t('destinationRing.next')} width={0.36} position={[0, 0, 0.004]} enabled={interactive && photoIndex < profile.media.length - 1} style={style} onPress={() => changePhoto(1)} />
          <NativePanelAction id="close" primary label={t('destinationRing.close')} width={0.36} position={[0.4, 0, 0.004]} enabled={interactive} style={style} onPress={onClose} />
        </ViroNode>
        {!externalReadingControls && <ViroNode position={[0, readerLayout.toolbar.y - 0.22, 0.012]}>
          <NativePanelAction id="smaller" label={t('destinationRing.smaller')} width={0.2} position={[-0.15, 0, 0]} enabled={interactive && reading.size !== 'small'} style={style} onPress={() => changeSize(-1)} />
          <NativePanelAction id="larger" label={t('destinationRing.larger')} width={0.2} position={[0.15, 0, 0]} enabled={interactive && reading.size !== 'large'} style={style} onPress={() => changeSize(1)} />
        </ViroNode>}
      </>}
    </>}
  </ViroNode>;
}
