import { DestinationRingSceneHost, type RingScenePresentation } from './destination-ring-scene';
import { buildExhibitSlots } from './exhibit-layout';
import { ExhibitTile } from './exhibit-tile';
import { ExhibitFrame } from './exhibit-frame';
import type { ComponentProps } from 'react';
import { danaoStageProfile, buildStageSlots } from './exhibit-stage';
import { DanaoScenery, ExhibitArrival, ExhibitGalleryEntry, ExhibitStoryTile } from './danao-stage';
import { ExhibitGalleryPanel } from './exhibit-gallery-panel';

// Immutable render configuration only. Each mounted scene creates its own
// controller, tokens, deadlines, refs and native navigator; no state is global.
export const exhibitPresentation: RingScenePresentation = Object.freeze({
  animationPrefix: 'argalaExhibit', buildSlots: buildExhibitSlots,
  Tile: ExhibitTile, Frame: ExhibitFrame, revealImages: true, isolateReader: true,
});
export const danaoStagePresentation: RingScenePresentation = Object.freeze({
  animationPrefix: 'argalaExhibitDanao', buildSlots: buildStageSlots,
  Tile: ExhibitStoryTile, Frame: ExhibitFrame, revealImages: true, isolateReader: true,
  stage: Object.freeze({ profile: danaoStageProfile, Entry: ExhibitGalleryEntry, Panel: ExhibitGalleryPanel, Scenery: DanaoScenery, Arrival: ExhibitArrival }),
});
export function ExhibitRingSceneHost(props: ComponentProps<typeof DestinationRingSceneHost>) {
  return <DestinationRingSceneHost {...props} presentation={danaoStagePresentation} />;
}
