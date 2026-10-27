import { isViroSpikeEnabled } from './dev-guard';
/** Draft data modules are evaluated only behind both runtime development guards. */
export async function loadDraftRingContent() {
  if (!isViroSpikeEnabled()) return null;
  return (await import('./development-aclc-research')).developmentResearchRingContent;
}
