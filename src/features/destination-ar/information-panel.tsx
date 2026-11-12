import { HolographicGlint } from './holographic-glint';
import { PageTransition } from './page-transition';
import { HolographicFrame } from './holographic-frame';
import { chapterPresentation } from './chapter-presentation';
import { ArText } from './ar-text';
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ViroAnimations, ViroImage, ViroNode, ViroQuad } from '@reactvision/react-viro';
import { useReducedMotion } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { paginate, readingMetrics, type ReadingCursor } from './content-layout';
import type { RingContent } from './development-ring-content';
import type { FocusSelection } from './ring-controller';
import { ringMetrics } from './scene-geometry';
import { readingSizes, type ReadingSize } from './reading-preference';
import type { ArNativeStyle } from './native-styles';
import type { useReadingSize } from './use-reading-size';
import { galleryPages, galleryCursor, cursorAtPage, type GalleryPage } from './information-gallery';
import { NativePanelAction, nativePanelActionHeight } from './information-tile';
import { readingContentWidth } from './reading-widths';

const bottomRowY = -ringMetrics.panelHeight / 2 + 0.04 + nativePanelActionHeight / 2;
const pageRowY = bottomRowY + nativePanelActionHeight + 0.04;
const contentBottom = pageRowY + nativePanelActionHeight / 2 + 0.02;
const bodyHeight = 0.5;
const bodyY = contentBottom + bodyHeight / 2;
const captionHeight = 0.2;
// Photo pages use the heading space; the chapter counter, caption and controls
// keep their existing bounds. Text pages retain the original heading/body.
const imageHeight = 0.46 - (contentBottom + captionHeight + 0.02);
const imageY = contentBottom + captionHeight + 0.02 + imageHeight / 2;
export type ReadingCommand = (delta: -1 | 1) => void;

export function InformationPanel({ selection, content, previous, reading, enabled, style, onCursor, onClose, onComplete, onPageChange, decorations = true, ordinal = 1, chapterCount = 1, openedCount = 0, externalReadingControls = false, onReadingControls }: {
  selection: FocusSelection; content: RingContent; previous?: ReadingCursor; reading: ReturnType<typeof useReadingSize>; enabled: boolean; style: ArNativeStyle; decorations?: boolean;
  onPageChange?(): void; onCursor(id: string, cursor: ReadingCursor): void; onClose(): void; onComplete(token: number): void;
  ordinal?: number; chapterCount?: number; openedCount?: number;
  externalReadingControls?: boolean; onReadingControls?(command: ReadingCommand | null): void;
}) {
  const { t, i18n } = useTranslation(); const ref = useRef<ViroNode>(null); const reduced = useReducedMotion();
  const moving = selection.phase !== 'focused'; const closing = selection.phase === 'closing';
  const name = closing ? 'argalaRingClose' : 'argalaRingFocus';
  const [registeredToken, setRegisteredToken] = useState<number | null>(null);
  const completion = useRef(onComplete);
  useLayoutEffect(() => { completion.current = onComplete; return () => { completion.current = () => {}; }; }, [onComplete]);
  const finish = useCallback(() => completion.current(selection.token), [selection.token]);
  useLayoutEffect(() => {
    if (!moving) return;
    const from = selection.from; const to = selection.to;
    const rotationDelta = ((to.rotation[1] - from.rotation[1] + 180) % 360 + 360) % 360 - 180;
    ViroAnimations.registerAnimations({ [name]: { duration: reduced ? 0 : ringMetrics.transitionMs, easing: 'EaseInEaseOut', properties: {
      positionX: to.position[0], positionY: to.position[1], positionZ: to.position[2], rotateY: from.rotation[1] + rotationDelta,
      scaleX: to.scale, scaleY: to.scale, scaleZ: to.scale,
    } } });
    let current = true;
    void Promise.resolve().then(() => { if (current) setRegisteredToken(selection.token); });
    return () => { current = false; };
  }, [moving, name, reduced, selection.from, selection.to, selection.token]);
  // One declarative owner: an unrelated React commit cannot pause an animation
  // started imperatively. Registration completes before run becomes true.
  const animation = useMemo(() => ({ name, run: moving && enabled && registeredToken === selection.token, onFinish: finish, interruptible: true }), [name, moving, enabled, registeredToken, selection.token, finish]);
  useLayoutEffect(() => {
    if (!moving) ref.current?.setNativeProps({ position: selection.to.position, rotation: selection.to.rotation, scale: [selection.to.scale, selection.to.scale, selection.to.scale] });
  }, [moving, selection.to, selection.token]);
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const chapter = chapterPresentation(content, locale, key => t(key), key => i18n.exists(key));
  const layout = useCallback((size: ReadingSize) => {
    let pages;
    try { pages = paginate(chapter.body, size, chapter.title); }
    catch { pages = paginate(t('destinationRing.contentFailed'), size); }
    return galleryPages(pages, chapter.media, locale, size, credit => t('destinationRing.imageCredit', { credit }), t('destinations.englishFallback'), chapter.presentation);
  }, [chapter.body, chapter.title, chapter.media, chapter.presentation, locale, t]);
  const pages = useMemo(() => layout(reading.size), [layout, reading.size]);
  const cursor = galleryCursor(pages, previous, locale, reading.size);
  const page = pages[cursor.page]; const interactive = enabled && !moving;
  const transform = moving ? selection.from : selection.to;
  function changePage(page: number) {
    onCursor(content.id, cursorAtPage(pages, page, locale, reading.size)); onPageChange?.();
  }
  const changeSize = useCallback((delta: -1 | 1) => {
    const next = readingSizes[Math.min(2, Math.max(0, readingSizes.indexOf(reading.size) + delta))];
    onCursor(content.id, galleryCursor(layout(next), cursor, locale, next)); reading.change(delta);
  }, [reading, onCursor, content.id, layout, cursor, locale]);
  useLayoutEffect(() => {
    if (!interactive) { onReadingControls?.(null); return; }
    let current = true;
    onReadingControls?.(delta => { if (current) changeSize(delta); });
    return () => { current = false; onReadingControls?.(null); };
  }, [interactive, changeSize, onReadingControls]);
  return <ViroNode ref={ref} key={selection.token} testID="ring-focused-panel" position={transform.position} rotation={transform.rotation}
    scale={[transform.scale, transform.scale, transform.scale]} opacity={enabled ? 1 : 0.35}
    animation={animation}>
    <HolographicFrame reader width={ringMetrics.panelWidth + 0.025} height={ringMetrics.panelHeight + 0.025} decorations={false} />
    <ArText testID="ring-chapter-title" position={[0, closing ? 0 : page.kind === 'image' ? 0.495 : 0.425, 0.006]} width={1.12} height={!closing && page.kind === 'image' ? 0.05 : 0.16} text={chapter.coverTitle} style={style.text(!closing && page.kind === 'image' ? 3.5 : 8, 'left', '600')} />
    {!closing && <>
      {decorations && <HolographicGlint id="ring-focus-glint" width={ringMetrics.panelWidth + 0.025} height={ringMetrics.panelHeight + 0.025} active={interactive} reduced={reduced} />}
      <ArText testID="ring-chapter-position" position={[-0.3, 0.555, 0.006]} width={0.52} height={0.06} text={t('destinationStories.chapter', { current: ordinal, total: chapterCount })} style={style.text(3, 'left')} />
      <ArText testID="ring-sample-label" position={[0.28, 0.555, 0.006]} width={0.56} height={0.06} text={content.approved ? t('destinationStories.openedCount', { count: openedCount, total: chapterCount }) : t('destinationRing.sampleLabel')} style={style.text(3)} />
      <PageTransition identity={`${content.id}:${cursor.page}:${locale}:${reading.size}`} enabled={interactive} reduced={reduced}>
      {page.kind === 'image' ? <BundledGalleryPage key={`${page.media!.id}:${page.media!.source}`} page={page} size={reading.size} style={style} enabled={interactive} /> : <ArText testID="ring-body" position={[0, bodyY, 0.006]} width={readingContentWidth} height={bodyHeight} text={(page.flowText ?? page.text) || t('destinationRing.empty')}
        textLineBreakMode="WordWrap" textClipMode="ClipToBounds" style={style.text(readingMetrics[reading.size].fontSize, 'left')} />}
      </PageTransition>
      <NativePanelAction id="previous" label={t('destinationRing.previous')} width={0.34} position={[-0.4, pageRowY, 0.012]} enabled={interactive && cursor.page > 0} style={style}
        onPress={() => changePage(cursor.page - 1)} />
      <ArText testID="ring-page-indicator" position={[0, pageRowY, 0.012]} width={0.4} height={0.1} text={t('destinationRing.page', { current: cursor.page + 1, total: pages.length })} style={style.text(3)} />
      <NativePanelAction id="next" label={t('destinationRing.next')} width={0.34} position={[0.4, pageRowY, 0.012]} enabled={interactive && cursor.page < pages.length - 1} style={style}
        onPress={() => changePage(cursor.page + 1)} />
      {!externalReadingControls && <>
        <NativePanelAction id="smaller" label={t('destinationRing.smaller')} width={0.2} position={[-0.42, bottomRowY, 0.012]} enabled={interactive && reading.size !== 'small'} style={style} onPress={() => changeSize(-1)} />
        <NativePanelAction id="larger" label={t('destinationRing.larger')} width={0.2} position={[-0.17, bottomRowY, 0.012]} enabled={interactive && reading.size !== 'large'} style={style} onPress={() => changeSize(1)} />
      </>}
      <NativePanelAction id="close" primary label={t('destinationRing.close')} width={0.46} position={[0.28, bottomRowY, 0.012]} enabled={interactive} style={style} onPress={onClose} />
      {reading.error && !externalReadingControls && <ViroNode position={[0, 0, 0.025]}>
        <ViroQuad renderingOrder={4} ignoreEventHandling width={1.12} height={0.5} materials="argalaRingSurface" />
        <ArText renderingOrder={5} testID="ring-reading-error" position={[0, 0.06, 0.004]} width={1.02} height={0.23} text={t(`destinationRing.${reading.error}`)} style={style.text(4)} />
        <NativePanelAction renderingOrder={5} id="preference-retry" label={t('common.retry')} width={0.45} position={[0, -0.155, 0.006]} enabled={interactive && !reading.pending} style={style} onPress={() => void reading.retry()} />
      </ViroNode>}
    </>}
  </ViroNode>;
}



/** Keep the native image mounted through caption pages, but replace an attempt
 * on explicit Retry. A bundled source replacement starts clean under its key.
 */
function BundledGalleryPage(props: { page: GalleryPage; size: ReadingSize; style: ArNativeStyle; enabled: boolean }) {
  const [attempt, setAttempt] = useState(0);
  return <GalleryImageAttempt key={attempt} {...props} onRetry={() => setAttempt(previous => previous + 1)} />;
}
function GalleryImageAttempt({ page, size, style, enabled, onRetry }: { page: GalleryPage; size: ReadingSize; style: ArNativeStyle; enabled: boolean; onRetry(): void }) {
  const { t } = useTranslation(); const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading');
  const alive = useRef(false); const settled = useRef(false);
  useLayoutEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  function finish(success: boolean) {
    if (!alive.current || settled.current) return;
    settled.current = true; setStatus(success ? 'ready' : 'failed');
  }
  function fail() { if (alive.current) { settled.current = true; setStatus('failed'); } }
  return <>
    {status === 'failed' ? <>
      <ArText testID="ring-gallery-error" position={[0, imageY + 0.095, 0.008]} width={readingContentWidth} height={0.18}
        text={t('destinationRing.imageFailed')} style={style.text(4)} />
      <NativePanelAction id="image-retry" label={t('common.retry')} position={[0, imageY - 0.11, 0.012]} width={0.46}
        enabled={enabled} style={style} onPress={onRetry} />
    </> : <>
      <ViroImage testID="ring-gallery-image" source={page.media!.source} position={[0, imageY, 0.006]} width={readingContentWidth} height={imageHeight}
        renderingOrder={2} ignoreEventHandling resizeMode="ScaleToFit" imageClipMode="ClipToBounds"
        onError={fail} onLoadEnd={event => {
          // Pinned Android VRTImage emits completion only after setting the
          // bitmap, with no success field. Explicit false and onError still fail.
          finish(event.nativeEvent?.success !== false);
        }} />
      {status === 'loading' && <ArText testID="ring-gallery-loading" position={[0, imageY, 0.008]} width={readingContentWidth} height={imageHeight}
        text={t('common.loading')} style={style.text(4)} />}
    </>}
    <ArText testID="ring-gallery-caption" position={[0, contentBottom + captionHeight / 2, 0.006]} width={readingContentWidth} height={captionHeight} text={page.flowText ?? page.text}
      textLineBreakMode="WordWrap" textClipMode="ClipToBounds" style={style.text(readingMetrics[size].fontSize, 'left')} />
  </>;
}
