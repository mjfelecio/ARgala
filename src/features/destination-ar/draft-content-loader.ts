import type { FeaturedDestinationId } from '@/features/destinations/catalog';
import { isViroSpikeEnabled } from './dev-guard';
/** Draft data modules are evaluated only behind both runtime development guards. */
export async function loadDraftRingContent(destinationId: FeaturedDestinationId) {
  if (destinationId !== 'pilot-aclc' || !isViroSpikeEnabled()) return null;
  return (await import('./development-aclc-research')).developmentResearchRingContent;
}
