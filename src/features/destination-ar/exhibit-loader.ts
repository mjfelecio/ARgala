import { destinationIds } from '@/features/destinations/catalog';
import { isViroSpikeEnabled } from './dev-guard';

export type PresentationMode = 'classic' | 'exhibit';
/** No production/native/geographic admission. Only the explicitly selected featured stage is available. */
export async function loadExhibitScene(destinationId: string) {
  if (!isViroSpikeEnabled() || !destinationIds.some(id => id === destinationId)) return null;
  return (await import('./exhibit-ring-scene')).getExhibitSceneHost(destinationId);
}
