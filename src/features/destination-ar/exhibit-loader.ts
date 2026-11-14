import { isViroSpikeEnabled } from './dev-guard';

export type PresentationMode = 'classic' | 'exhibit';
/** No production/native/geographic admission. D01 is the only review prototype. */
export async function loadExhibitScene(destinationId: string) {
  if (!isViroSpikeEnabled() || destinationId !== 'D01') return null;
  return (await import('./exhibit-ring-scene')).ExhibitRingSceneHost;
}
