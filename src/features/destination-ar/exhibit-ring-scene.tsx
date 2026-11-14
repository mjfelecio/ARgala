import { DestinationRingSceneHost, type RingScenePresentation } from './destination-ring-scene';
import { buildExhibitSlots } from './exhibit-layout';
import { ExhibitTile } from './exhibit-tile';
import { ExhibitFrame } from './exhibit-frame';
import type { ComponentProps } from 'react';
import { getExhibitStageProfile, buildDestinationStageSlots, type ExhibitStageProfile } from './exhibit-stage';
import { destinationIds, type DestinationId } from '@/features/destinations/catalog';
import { DestinationStageScenery } from './destination-stage-scenery';
import { DanaoScenery, ExhibitArrival, ExhibitGalleryEntry, ExhibitStoryTile, PhotoIslandStoryTile } from './danao-stage';
import { ExhibitGalleryPanel } from './exhibit-gallery-panel';
import { createPhotoIslandsProfile } from './photo-islands';
import { PhotoIslandScenery } from './photo-island-scenery';

// Immutable render configuration only. Each mounted scene creates its own
// controller, tokens, deadlines, refs and native navigator; no state is global.
export const exhibitPresentation: RingScenePresentation = Object.freeze({
  animationPrefix: 'argalaExhibit', buildSlots: buildExhibitSlots,
  Tile: ExhibitTile, Frame: ExhibitFrame, revealImages: true, isolateReader: true,
});
function createStagePresentation(profile: ExhibitStageProfile): RingScenePresentation {
  const animationPrefix = profile.destinationId === 'D01' ? 'argalaExhibitDanao' : `argalaExhibit${profile.destinationId}`;
  return Object.freeze({
    animationPrefix, buildSlots: (entries, basis) => buildDestinationStageSlots(profile, entries, basis),
    Tile: profile.photoIslands ? PhotoIslandStoryTile : ExhibitStoryTile, Frame: ExhibitFrame, revealImages: false, pageMotion: false, focusGlint: false, isolateReader: true,
    stage: Object.freeze({ profile, Entry: ExhibitGalleryEntry, Panel: ExhibitGalleryPanel,
      Scenery: profile.photoIslands ? function IslandScenery({ basis }: ComponentProps<typeof DanaoScenery>) { return <PhotoIslandScenery profile={profile} basis={basis} />; }
        : profile.destinationId === 'D01' ? DanaoScenery : function StageScenery({ basis }: ComponentProps<typeof DanaoScenery>) { return <DestinationStageScenery profile={profile} basis={basis} />; },
      Arrival: function StageArrival(props: ComponentProps<typeof ExhibitArrival>) { return <ExhibitArrival {...props} animationPrefix={animationPrefix} />; },
    }),
  });
}
// Retain the accepted front composition for a one-line rollback. The owner
// accepted refined Danao spacing and physical taps before this nine-stage rollout.
export const danaoFrontStagePresentation = createStagePresentation(getExhibitStageProfile('D01')!);
const presentations = Object.freeze(Object.fromEntries(destinationIds.map(id => [id, createStagePresentation(createPhotoIslandsProfile(getExhibitStageProfile(id)!))])) as Record<DestinationId, RingScenePresentation>);
export function getExhibitStagePresentation(id: string): RingScenePresentation | null {
  return getExhibitStageProfile(id) ? presentations[id as DestinationId] : null;
}
export const danaoStagePresentation = presentations.D01;
// Bind once at module load. Destination/principal changes mount a new session;
// page commits never manufacture a replacement component or native navigator.
const hosts = Object.freeze(Object.fromEntries(destinationIds.map(id => [id, function DestinationExhibitHost(props: ComponentProps<typeof DestinationRingSceneHost>) {
  return <DestinationRingSceneHost {...props} presentation={presentations[id]} />;
}])) as Record<DestinationId, typeof DestinationRingSceneHost>);
export function getExhibitSceneHost(id: string): typeof DestinationRingSceneHost | null {
  return getExhibitStageProfile(id) ? hosts[id as DestinationId] : null;
}
export const ExhibitRingSceneHost = hosts.D01;
