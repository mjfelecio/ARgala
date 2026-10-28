import type { Language } from '../../../supabase/functions/_shared/contracts';
import type { useAdmissionSource } from './admission-context';
import { isViroSpikeEnabled } from './dev-guard';
export type SimulationSource = Pick<ReturnType<typeof useAdmissionSource>, 'beginSimulation'>;
export async function simulateArEntry(source: SimulationSource, kind: 'approved' | 'draft', language: Language) {
  if (!isViroSpikeEnabled()) return null;
  return (await import('./development-simulation')).beginSimulatedEntry(source, kind, language);
}
