import { DestinationRingSceneHost, type RingScenePresentation } from './destination-ring-scene';
import { buildExhibitSlots } from './exhibit-layout';
import { ExhibitTile } from './exhibit-tile';
import { ExhibitFrame } from './exhibit-frame';
import type { ComponentProps } from 'react';

// Immutable render configuration only. Each mounted scene creates its own
// controller, tokens, deadlines, refs and native navigator; no state is global.
export const exhibitPresentation: RingScenePresentation = Object.freeze({
  animationPrefix: 'argalaExhibit', buildSlots: buildExhibitSlots,
  Tile: ExhibitTile, Frame: ExhibitFrame, revealImages: true,
});
export function ExhibitRingSceneHost(props: ComponentProps<typeof DestinationRingSceneHost>) {
  return <DestinationRingSceneHost {...props} presentation={exhibitPresentation} />;
}
