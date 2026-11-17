import { destinationIds } from '@/features/destinations/catalog';
/** Render configuration only; geographic and content admission belong to the caller.
 * An omitted media list is the supplied showcase; an explicit list is a strict fence. */
export async function loadExhibitScene(destinationId: string, allowedMediaIds?: readonly string[]) {
  if (!destinationIds.some(id => id === destinationId)) return null;
  return (await import('./exhibit-ring-scene')).getExhibitSceneHost(destinationId, allowedMediaIds);
}
