import { isViroSpikeEnabled } from './dev-guard';
/** Sample assets are evaluated only behind both development guards. */
export async function loadDevelopmentGalleryContent() {
  if (!isViroSpikeEnabled()) return null;
  return (await import('./development-gallery-content')).developmentGalleryContent;
}
