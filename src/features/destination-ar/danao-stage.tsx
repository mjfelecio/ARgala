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
import { photoIslandMetrics, type ExhibitGalleryEntrance } from './photo-islands';

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
  const island = !!entry.mediaId;
  return <ViroNode testID={island ? `exhibit-island-entry-${photo.id}` : 'exhibit-gallery-entry'} position={slot.position} rotation={slot.rotation} onClick={enabled ? select : undefined}>
    <ExhibitFrame width={island ? photoIslandMetrics.photoWidth : 1.25} height={island ? photoIslandMetrics.photoHeight : 0.77} decorations={false} interactiveSurface={enabled} />
    {!failed && <ViroImage testID={island ? `exhibit-island-cover-${photo.id}` : 'exhibit-gallery-cover'} source={photo.source} width={island ? 0.73 : 1.13} height={island ? 0.39 : 0.43} position={[0, island ? 0.065 : 0.095, 0.007]}
      renderingOrder={2} resizeMode="ScaleToFill" imageClipMode="ClipToBounds" highAccuracyEvents ignoreEventHandling={!enabled} onError={() => { if (alive.current) setFailed(true); }} />}
    <ArText position={[0, island ? -0.19 : -0.205, 0.01]} width={island ? 0.72 : 1.1} height={island ? 0.08 : 0.105}
      text={t(island ? 'presentation.photoPosition' : 'presentation.galleryExplore', { current: profile.media.indexOf(photo) + 1, total: profile.media.length })} style={style.text(island ? 3.6 : 5, 'left', '600')} />
    <ArText position={[0, island ? -0.265 : -0.315, 0.01]} width={island ? 0.72 : 1.1} height={0.065}
      text={t(island ? 'presentation.galleryOpen' : 'presentation.galleryCount', { count: profile.media.length })} style={style.text(island ? 2.8 : 3, 'left')} />
    {!island && profile.photoIslands && <ArText testID="exhibit-islands-hint" position={[0, -0.54, 0.01]} width={1.9} height={0.12}
      text={t('presentation.islandsLookAround')} style={style.text(3.8)} />}
  </ViroNode>;
}

export function PhotoIslandStoryTile(props: ComponentProps<typeof InformationTile>) {
  return <ExhibitStoryTile {...props} island />;
}
export function ExhibitStoryTile({ content, slot, enabled, style, onSelect, opened = false, ordinal = 1, chapterCount = 1, decorations = true, island = false }: ComponentProps<typeof InformationTile> & { island?: boolean }) {
  const { t, i18n } = useTranslation();
  const reduced = useReducedMotion();
  const chapter = chapterPresentation(content, i18n.resolvedLanguage ?? i18n.language, key => t(key), key => i18n.exists(key));
  const select = useCoverAction(enabled, () => onSelect(content.id));
  return <ViroNode testID={`ring-tile-${content.id}`} position={slot.position} rotation={slot.rotation} onClick={enabled ? select : undefined}>
    <ExhibitFrame width={island ? photoIslandMetrics.storyWidth : 0.58} height={island ? photoIslandMetrics.storyHeight : 0.42} decorations={false} interactiveSurface={enabled} />
    <ArText position={[0, island ? 0.18 : 0.14, 0.007]} width={island ? 0.94 : 0.49} height={island ? 0.075 : 0.055} text={t('destinationStories.chapter', { current: ordinal, total: chapterCount })} style={style.text(island ? 3.3 : 2.8, 'left')} />
    <ArText position={[0, 0.005, 0.007]} width={island ? 0.94 : 0.49} height={island ? 0.19 : 0.16} text={chapter.coverTitle} style={style.text(island ? 5.3 : 4.5, 'left', '600')} />
    <ArText testID={opened ? `ring-opened-${content.id}` : undefined} position={[0, island ? -0.185 : -0.145, 0.007]} width={island ? 0.94 : 0.49} height={island ? 0.075 : 0.055}
      text={t(opened ? 'destinationStories.opened' : 'presentation.readStory')} style={style.text(island ? 3.3 : 2.8, 'left')} />
    {decorations && !reduced && !island && <ViroPolyline ignoreEventHandling renderingOrder={1} thickness={0.003} opacity={0.8} materials={ordinal === 3 ? 'argalaRingAction' : 'argalaRingEdge'}
      points={ordinal === 1 ? [[-0.25, 0.205, 0.005], [-0.12, 0.205, 0.005], [-0.04, 0.22, 0.005], [0.04, 0.205, 0.005], [0.25, 0.205, 0.005]]
        : ordinal === 2 ? [[-0.25, 0.205, 0.005], [-0.14, 0.225, 0.005], [0, 0.205, 0.005], [0.14, 0.225, 0.005], [0.25, 0.205, 0.005]]
          : [[-0.25, 0.205, 0.005], [-0.08, 0.205, 0.005], [0, 0.245, 0.005], [0.08, 0.205, 0.005], [0.25, 0.205, 0.005]]} />}
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
