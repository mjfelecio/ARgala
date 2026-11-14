import { ViroNode, ViroPolyline } from '@reactvision/react-viro';
import { useReducedMotion } from 'react-native-reanimated';
import { DanaoScenery } from './danao-stage';
import type { ExhibitStageProfile } from './exhibit-stage';
import type { Basis } from './scene-geometry';
import { photoIslandMetrics, photoIslandStoryY } from './photo-islands';
import { DestinationStageScenery } from './destination-stage-scenery';

const bayOutline: [number, number, number][] = Array.from({ length: 17 }, (_, index) => {
  const angle = index * Math.PI / 8;
  return [Math.cos(angle) * 0.96, Math.sin(angle) * 0.055, 0];
});

/** Shared display bases, with each destination's retained symbolic welcome.
 * No floor/GPS anchoring, frame callbacks or extra running effects. */
export function PhotoIslandScenery({ profile, basis }: { profile: ExhibitStageProfile; basis: Basis }) {
  const reduced = useReducedMotion();
  if (reduced) return null;
  return <ViroNode testID="exhibit-photo-island-scenery" ignoreEventHandling>
    {profile.destinationId === 'D01' ? <DanaoScenery basis={basis} /> : <DestinationStageScenery profile={profile} basis={basis} />}
    {profile.photoIslands?.map((bay, index) => {
      const angle = bay.angle * Math.PI / 180;
      const x = Math.sin(angle) * photoIslandMetrics.storyRadius;
      const z = Math.cos(angle) * photoIslandMetrics.storyRadius;
      return <ViroNode key={index} testID={`exhibit-island-shore-${index}`} ignoreEventHandling
        position={[basis.right[0] * x + basis.forward[0] * z, photoIslandStoryY(profile, index) - 0.39, basis.right[2] * x + basis.forward[2] * z]}
        rotation={[0, basis.yaw - bay.angle, 0]}>
        <ViroPolyline ignoreEventHandling renderingOrder={-1} points={bayOutline} thickness={0.003} materials="argalaRingEdge" opacity={0.3} />
        <ViroPolyline ignoreEventHandling renderingOrder={-1} position={[0, -0.08, -0.025]} scale={[0.8, 0.8, 0.8]} points={bayOutline} thickness={0.002} materials="argalaRingEdge" opacity={0.2} />
      </ViroNode>;
    })}
  </ViroNode>;
}
