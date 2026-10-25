import { ArText } from './ar-text';
import { useEffect, useRef } from 'react';
import { ViroAnimations, ViroNode, ViroQuad } from '@reactvision/react-viro';
import { useReducedMotion } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { paginate, readingMetrics, reflowCursor, type ReadingCursor } from './content-layout';
import type { RingContent } from './development-ring-content';
import type { FocusSelection } from './ring-controller';
import { ringMetrics } from './scene-geometry';
import { readingSizes, type ReadingSize } from './reading-preference';
import type { ArNativeStyle } from './native-styles';
import type { useReadingSize } from './use-reading-size';
import { NativePanelAction } from './information-tile';

export function InformationPanel({ selection, content, previous, reading, enabled, style, onCursor, onClose, onComplete }: {
  selection: FocusSelection; content: RingContent; previous?: ReadingCursor; reading: ReturnType<typeof useReadingSize>; enabled: boolean; style: ArNativeStyle;
  onCursor(id: string, cursor: ReadingCursor): void; onClose(): void; onComplete(token: number): void;
}) {
  const { t, i18n } = useTranslation(); const ref = useRef<ViroNode>(null); const reduced = useReducedMotion();
  const moving = selection.phase !== 'focused'; const closing = selection.phase === 'closing';
  const name = closing ? 'argalaRingClose' : 'argalaRingFocus';
  useEffect(() => {
    if (!moving) return;
    const from = selection.from; const to = selection.to;
    const rotationDelta = ((to.rotation[1] - from.rotation[1] + 180) % 360 + 360) % 360 - 180;
    ViroAnimations.registerAnimations({ [name]: { duration: reduced ? 0 : ringMetrics.transitionMs, easing: 'EaseInEaseOut', properties: {
      positionX: to.position[0], positionY: to.position[1], positionZ: to.position[2], rotateY: from.rotation[1] + rotationDelta,
      scaleX: to.scale, scaleY: to.scale, scaleZ: to.scale,
    } } });
  }, [moving, name, reduced, selection.from, selection.to, selection.token]);
  useEffect(() => {
    // Register before running. Explicit native commands also pause/resume the
    // same animation without recapturing a heading or feeding frames to React.
    ref.current?.setNativeProps({ animation: { name, run: moving && enabled, interruptible: true } });
  }, [moving, enabled, name, selection.token]);
  const body = t(content.bodyKey); const locale = i18n.resolvedLanguage ?? i18n.language;
  function layout(size: ReadingSize) {
    try { return paginate(body, size); }
    catch { return paginate(t('destinationRing.contentFailed'), size); }
  }
  const pages = layout(reading.size);
  const cursor = reflowCursor(pages, previous, locale, reading.size);
  const page = pages[cursor.page]; const interactive = enabled && !moving;
  const transform = moving ? selection.from : selection.to;
  function changeSize(delta: number) {
    const next = readingSizes[Math.min(2, Math.max(0, readingSizes.indexOf(reading.size) + delta))];
    onCursor(content.id, reflowCursor(layout(next), cursor, locale, next)); reading.change(delta);
  }
  return <ViroNode ref={ref} key={selection.token} testID="ring-focused-panel" position={transform.position} rotation={transform.rotation}
    scale={[transform.scale, transform.scale, transform.scale]} opacity={enabled ? 1 : 0.35}
    animation={{ name, run: false, onFinish: () => onComplete(selection.token), interruptible: true }}>
    <ViroQuad renderingOrder={0} ignoreEventHandling width={ringMetrics.panelWidth + 0.025} height={ringMetrics.panelHeight + 0.025} materials="argalaRingEdge" />
    <ViroQuad renderingOrder={1} ignoreEventHandling width={ringMetrics.panelWidth} height={ringMetrics.panelHeight} position={[0, 0, 0.003]} opacity={0.96} materials="argalaRingSurface" />
    <ArText position={[0, closing ? 0 : 0.4, 0.006]} width={1.12} height={0.14} text={t(content.titleKey)} style={style.text(8, 'center', '600')} />
    {!closing && <>
      <ArText testID="ring-sample-label" position={[0, 0.3, 0.006]} width={1.12} height={0.06} text={t('destinationRing.sampleLabel')} style={style.text(3)} />
      <ArText testID="ring-body" position={[0, 0.035, 0.006]} width={1.08} height={0.44} text={page.text || t('destinationRing.empty')}
        textLineBreakMode="None" textClipMode="ClipToBounds" style={style.text(readingMetrics[reading.size].fontSize, 'left')} />
      <NativePanelAction id="previous" label={t('destinationRing.previous')} position={[-0.4, -0.27, 0.012]} enabled={interactive && cursor.page > 0} style={style}
        onPress={() => onCursor(content.id, { ...cursor, page: cursor.page - 1, offset: pages[cursor.page - 1].start })} />
      <ArText testID="ring-page-indicator" position={[0, -0.27, 0.012]} width={0.4} height={0.1} text={t('destinationRing.page', { current: cursor.page + 1, total: pages.length })} style={style.text(3)} />
      <NativePanelAction id="next" label={t('destinationRing.next')} position={[0.4, -0.27, 0.012]} enabled={interactive && cursor.page < pages.length - 1} style={style}
        onPress={() => onCursor(content.id, { ...cursor, page: cursor.page + 1, offset: pages[cursor.page + 1].start })} />
      <NativePanelAction id="smaller" label={t('destinationRing.smaller')} width={0.2} position={[-0.42, -0.49, 0.012]} enabled={interactive && reading.size !== 'small'} style={style} onPress={() => changeSize(-1)} />
      <NativePanelAction id="larger" label={t('destinationRing.larger')} width={0.2} position={[-0.17, -0.49, 0.012]} enabled={interactive && reading.size !== 'large'} style={style} onPress={() => changeSize(1)} />
      <NativePanelAction id="close" label={t('destinationRing.close')} width={0.46} position={[0.28, -0.49, 0.012]} enabled={interactive} style={style} onPress={onClose} />
      {reading.error && <ViroNode position={[0, 0, 0.025]}>
        <ViroQuad renderingOrder={4} ignoreEventHandling width={1.12} height={0.5} materials="argalaRingSurface" />
        <ArText renderingOrder={5} testID="ring-reading-error" position={[0, 0.06, 0.004]} width={1.02} height={0.23} text={t(`destinationRing.${reading.error}`)} style={style.text(4)} />
        <NativePanelAction renderingOrder={5} id="preference-retry" label={t('common.retry')} width={0.45} position={[0, -0.155, 0.006]} enabled={interactive && !reading.pending} style={style} onPress={() => void reading.retry()} />
      </ViroNode>}
    </>}
  </ViroNode>;
}
