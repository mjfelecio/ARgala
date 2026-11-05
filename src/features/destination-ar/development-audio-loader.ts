import { isViroSpikeEnabled } from './dev-guard';
/** Never evaluate audition asset modules in release/ordinary destination entry. */
export async function loadDevelopmentSystemAudio() {
  if (!isViroSpikeEnabled()) return null;
  return (await import('./development-system-audio')).developmentSystemAudio;
}
