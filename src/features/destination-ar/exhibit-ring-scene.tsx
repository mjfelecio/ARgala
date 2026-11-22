import { DestinationRingSceneHost, type RingScenePresentation } from './destination-ring-scene';
import { ExhibitFrame } from './exhibit-frame';
import type { ComponentProps } from 'react';
import { getExhibitStageProfile, buildDestinationStageSlots, type ExhibitStageProfile } from './exhibit-stage';
import { destinationIds, type DestinationId } from '@/features/destinations/catalog';
import { DanaoScenery, ExhibitArrival, ExhibitGalleryEntry, PhotoIslandStoryTile, PhotoIslandGuidePanel } from './danao-stage';
import { ExhibitGalleryPanel } from './exhibit-gallery-panel';
import { createPhotoIslandsProfile, restrictPhotoIslandsProfile } from './photo-islands';
import { PhotoIslandScenery } from './photo-island-scenery';

// Immutable configuration only. Every mounted scene owns its native session,
// controller, tokens, deadlines and callbacks independently.
function createStagePresentation(profile: ExhibitStageProfile): RingScenePresentation {
  const animationPrefix = profile.destinationId === 'D01' ? 'argalaExhibitDanao' : `argalaExhibit${profile.destinationId}`;
  return Object.freeze({
    animationPrefix, buildSlots: (entries, basis) => buildDestinationStageSlots(profile, entries, basis),
    Tile: PhotoIslandStoryTile, Guide: PhotoIslandGuidePanel, Frame: ExhibitFrame, revealImages: false, pageMotion: false, focusGlint: false, isolateReader: true,
    // The shared engine's gallery owner requires an actual authorized photo.
    // Story-only entries still use the same Photo Islands story layout/reader.
    ...(profile.media.length ? { stage: Object.freeze({ profile, Entry: ExhibitGalleryEntry, Panel: ExhibitGalleryPanel,
      Scenery: function IslandScenery({ basis }: ComponentProps<typeof DanaoScenery>) { return <PhotoIslandScenery profile={profile} basis={basis} />; },
      Arrival: function StageArrival(props: ComponentProps<typeof ExhibitArrival>) { return <ExhibitArrival {...props} animationPrefix={animationPrefix} />; },
    }) } : {}),
  });
}
const profiles = Object.freeze(Object.fromEntries(destinationIds.map(id => [id, createPhotoIslandsProfile(getExhibitStageProfile(id)!)])) as Record<DestinationId, ExhibitStageProfile>);
const presentations = Object.freeze(Object.fromEntries(destinationIds.map(id => [id, createStagePresentation(profiles[id])])) as Record<DestinationId, RingScenePresentation>);
export function getExhibitStagePresentation(id: string, allowedMediaIds?: readonly string[]): RingScenePresentation | null {
  if (!getExhibitStageProfile(id)) return null;
  return allowedMediaIds === undefined ? presentations[id as DestinationId] : createStagePresentation(restrictPhotoIslandsProfile(profiles[id as DestinationId], allowedMediaIds));
}
export const danaoStagePresentation = presentations.D01;
function bindHost(presentation: RingScenePresentation): typeof DestinationRingSceneHost {
  return function DestinationExhibitHost(props: ComponentProps<typeof DestinationRingSceneHost>) {
    return <DestinationRingSceneHost {...props} presentation={presentation} />;
  };
}
// Full showcase hosts are bound once. A real entry binds its immutable authorized
// configuration once during explicit startup; page commits never replace it.
const hosts = Object.freeze(Object.fromEntries(destinationIds.map(id => [id, bindHost(presentations[id])])) as Record<DestinationId, typeof DestinationRingSceneHost>);
export function getExhibitSceneHost(id: string, allowedMediaIds?: readonly string[]): typeof DestinationRingSceneHost | null {
  const presentation = getExhibitStagePresentation(id, allowedMediaIds);
  if (!presentation) return null;
  return allowedMediaIds === undefined ? hosts[id as DestinationId] : bindHost(presentation);
}
