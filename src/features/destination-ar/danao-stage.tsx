import { useEffect, useLayoutEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { ViroAnimations, ViroImage, ViroNode, ViroPolyline } from '@reactvision/react-viro';
import { useReducedMotion } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { ArText } from './ar-text';
import { ExhibitFrame } from './exhibit-frame';
import { chapterPresentation } from './chapter-presentation';
import type { InformationTile } from './information-tile';
import type { Basis, RingSlot } from './scene-geometry';
import type { ExhibitStageProfile } from './exhibit-stage';
import type { ArNativeStyle } from './native-styles';
import type { IntroVariant } from './intro-policy';
import { photoIslandMetrics, photoIslandCoverSize, type ExhibitGalleryEntrance } from './photo-islands';
import { exhibitVisitorLocale } from '@/i18n/locales/ar-exhibit-visitor';
import { EXHIBIT_HISTORY_ID } from './ring-content';
import { fitPhotoInsideRoundedFrame } from './native-panel-geometry';

/** Finite native-only reveal, inside the route-owned introduction deadline. */
export function ExhibitArrival({ children, deployment, order, animationPrefix = 'argalaExhibitDanao' }: { animationPrefix?: string; children: ReactNode; deployment?: IntroVariant; order: number }) {
  const ref = useRef<ViroNode>(null); const reduced = useReducedMotion();
  const animate = !!deployment && deployment !== 'none' && deployment !== 'reduced' && !reduced;
  useEffect(() => {
    const name = `${animationPrefix}Arrival${order}`;
    const node = ref.current;
    if (!animate) { node?.setNativeProps({ opacity: 1, position: [0, 0, 0] }); return; }
    ViroAnimations.registerAnimations({ [name]: { duration: deployment === 'full' ? 650 : 250,
      delay: deployment === 'full' ? order * 130 : 0, easing: 'EaseOut', properties: { opacity: 1, positionY: 0 } } });
    node?.setNativeProps({ animation: { name, run: true, loop: false, interruptible: true } });
    return () => { node?.setNativeProps({ animation: { name, run: false, interruptible: true } }); };
  }, [animate, deployment, order, animationPrefix]);
  return <ViroNode ref={ref} testID={`exhibit-arrival-${order}`} ignoreEventHandling={!!deployment} opacity={animate ? 0.4 : 1} position={[0, animate ? -0.04 : 0, 0]}>{children}</ViroNode>;
}

function useCoverAction(enabled: boolean, action: () => void) {
  const current = useRef<(() => void) | null>(null);
  useLayoutEffect(() => { current.current = enabled ? action : null; return () => { current.current = null; }; }, [enabled, action]);
  return () => current.current?.();
}

export function ExhibitGalleryEntry({ profile, entry = { id: profile.galleryId }, slot, enabled, style, onSelect }: { profile: ExhibitStageProfile; entry?: ExhibitGalleryEntrance; slot: RingSlot; enabled: boolean; style: ArNativeStyle; onSelect(id: string): void }) {
  const { t } = useTranslation(); const [failed, setFailed] = useState(false); const alive = useRef(false);
  useLayoutEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const select = useCoverAction(enabled, () => onSelect(entry.id));
  const photo = profile.media.find(photo => photo.id === entry.mediaId) ?? profile.media[0];
  const island = entry.id !== profile.galleryId;
  const { width, height } = photoIslandCoverSize(profile, entry);
  const photoSize = fitPhotoInsideRoundedFrame({ width, height }, { width: width + 0.04, height: height + 0.04 });
  return <ViroNode testID={island ? `exhibit-island-entry-${photo.id}` : 'exhibit-gallery-entry'} position={slot.position} rotation={slot.rotation} onClick={enabled ? select : undefined}>
    <ExhibitFrame width={width + 0.04} height={height + 0.04} decorations={false} interactiveSurface={enabled} />
    {!failed ? <ViroImage testID={island ? `exhibit-island-cover-${photo.id}` : 'exhibit-gallery-cover'} source={photo.source} width={photoSize.width} height={photoSize.height} position={[0, 0, 0.007]}
      renderingOrder={2} resizeMode="ScaleToFit" imageClipMode="ClipToBounds" highAccuracyEvents ignoreEventHandling={!enabled} onError={() => { if (alive.current) setFailed(true); }} />
      : <ArText position={[0, 0, 0.01]} width={width - 0.12} height={0.12} text={t('presentation.galleryOpen')} style={style.text(4)} />}
  </ViroNode>;
}

export function PhotoIslandStoryTile({ content, slot, enabled, style, onSelect, opened = false, ordinal = 1, chapterCount = 1 }: ComponentProps<typeof InformationTile>) {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const chapter = chapterPresentation(content, locale, key => t(key), key => i18n.exists(key));
  const label = content.id === EXHIBIT_HISTORY_ID ? exhibitVisitorLocale(locale).history : t('destinationStories.chapter', { current: ordinal, total: chapterCount });
  const select = useCoverAction(enabled, () => onSelect(content.id));
  return <ViroNode testID={`ring-tile-${content.id}`} position={slot.position} rotation={slot.rotation} onClick={enabled ? select : undefined}>
    <ExhibitFrame width={photoIslandMetrics.storyWidth} height={photoIslandMetrics.storyHeight} decorations={false} interactiveSurface={enabled} />
    <ArText position={[0, 0.18, 0.007]} width={0.94} height={0.075} text={label} style={style.text(3.3, 'left')} />
    <ArText position={[0, 0.005, 0.007]} width={0.94} height={0.19} text={chapter.coverTitle} style={style.text(5.3, 'left', '600')} />
    <ArText testID={opened ? `ring-opened-${content.id}` : undefined} position={[0, -0.185, 0.007]} width={0.94} height={0.075}
      text={t(opened ? 'destinationStories.opened' : 'presentation.readStory')} style={style.text(3.3, 'left')} />
  </ViroNode>;
}

const ridges: [number, number, number][][] = [
  [[-1.65, 0.1, 0], [-1.35, 0.28, 0], [-1.1, 0.18, 0], [-0.7, 0.55, 0], [-0.3, 0.34, 0], [0.15, 0.66, 0], [0.52, 0.4, 0], [0.9, 0.58, 0], [1.4, 0.26, 0], [1.65, 0.4, 0]],
  [[-1.65, 0.04, 0.035], [-1.22, 0.13, 0.035], [-0.86, 0.32, 0.035], [-0.4, 0.16, 0.035], [0.1, 0.37, 0.035], [0.55, 0.19, 0.035], [1.1, 0.35, 0.035], [1.65, 0.07, 0.035]],
  [[-1.65, -0.08, 0.07], [-1.12, -0.02, 0.07], [-0.6, 0.1, 0.07], [0, 0.02, 0.07], [0.5, 0.15, 0.07], [1.1, 0.02, 0.07], [1.65, -0.08, 0.07]],
];
const ripples = [1, 0.76, 0.5].map(scale => Array.from({ length: 41 }, (_, index): [number, number, number] => {
  const angle = index * Math.PI / 20;
  return [Math.cos(angle) * 1.45 * scale, -0.96 + Math.sin(angle) * 0.15 * scale, 0.1];
}));

/** Six static contour meshes. Abstract scenery carries no terrain/location data. */
export function DanaoScenery({ basis }: { basis: Basis }) {
  const reduced = useReducedMotion();
  if (reduced) return null;
  return <ViroNode testID="exhibit-danao-scenery" ignoreEventHandling position={[basis.forward[0] * 2.75, 0, basis.forward[2] * 2.75]} rotation={[0, basis.yaw, 0]}>
    {ridges.map((points, index) => <ViroPolyline key={`ridge-${index}`} ignoreEventHandling renderingOrder={-1} points={points} thickness={0.006 - index * 0.001} materials="argalaRingEdge" opacity={0.25 + index * 0.12} />)}
    {ripples.map((points, index) => <ViroPolyline key={`water-${index}`} ignoreEventHandling renderingOrder={-1} points={points} thickness={0.003} materials="argalaRingEdge" opacity={0.32 - index * 0.06} />)}
  </ViroNode>;
}
