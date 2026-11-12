import { isViroSpikeEnabled } from './dev-guard';
/** Evaluation remains behind both development guards, never native admission. */
export async function loadDevelopmentSession() {
  if (!isViroSpikeEnabled()) return null;
  return (await import('./destination-ar-session-screen')).default;
}
