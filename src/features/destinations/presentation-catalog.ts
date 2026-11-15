import content from '../destination-ar/featured-presentation-content.json';
import { presentationPhotoAssets } from '../destination-ar/featured-presentation-media-assets';

const reference = `Owner-supplied college presentation content ${content.contentVersion}; docs/content/presentation-2026-11-13/INTEGRATE.md`;
const locationReference = 'Owner local access confirmation, 2026-11-13; docs/content/presentation-2026-11-13/locations.json';
const value = <T,>(item: T) => ({ value: item, approvalReference: reference });
const translated = (item: { en: string; ja: string; ko: string }) => ({ en: value(item.en), ja: value(item.ja), ko: value(item.ko) });

/** Data-only projection. No scene imports, editorial release approval or GPS grants. */
export const presentationCatalog = content.destinations.map(destination => {
  const media = [destination.coverMediaId, ...destination.gallery.filter(id => id !== destination.coverMediaId)].map(id => {
    const photo = content.media.find(item => item.id === id);
    if (!photo) throw new Error(`Missing bundled presentation media: ${id}`);
    return { id, source: presentationPhotoAssets[id as keyof typeof presentationPhotoAssets],
      credit: photo.credit, rightsReference: photo.sourceUrl, approvalReference: reference,
      alt: translated(photo.alt), caption: translated(photo.caption) };
  });
  return {
    id: destination.id, provisionalName: destination.name.en, verifiedName: value(destination.name.en),
    localizedNames: translated(destination.name), coverMediaId: destination.coverMediaId, media,
    center: destination.location.center, centerApprovalReference: locationReference,
    routeEntrance: destination.location.routeEntrance, routeEntranceApprovalReference: locationReference,
    copy: {
      en: { overview: value(destination.summary.en), highlights: value(destination.visitorGuide.en.activities) },
      ja: { overview: value(destination.summary.ja), highlights: value(destination.visitorGuide.ja.activities) },
      ko: { overview: value(destination.summary.ko), highlights: value(destination.visitorGuide.ko.activities) },
    },
    requiresGuide: destination.requiresGuide,
    visitorGuide: { en: value(destination.visitorGuide.en), ja: value(destination.visitorGuide.ja), ko: value(destination.visitorGuide.ko) },
  };
});
