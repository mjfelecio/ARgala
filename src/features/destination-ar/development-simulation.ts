import type { Language } from '../../../supabase/functions/_shared/contracts';
import type { SimulationSource } from './simulation-loader';
import { isViroSpikeEnabled } from './dev-guard';
/** No synthetic coordinates enter the device evidence model. The receipt remains development-only. */
export function beginSimulatedEntry(source: SimulationSource, kind: 'approved' | 'draft', language: Language) {
  return isViroSpikeEnabled() ? source.beginSimulation(kind, language) : null;
}
