import content from '../destination-ar/featured-presentation-content.json';
import { presentationPhotoAssets } from '../destination-ar/featured-presentation-media-assets';
import { aclcDirectionsEntrance, aclcDisplayPoint, aclcLocationReference } from './aclc-locations';

const baselineReference = 'Owner-supplied college presentation content 2026-11-13-presentation-v1; docs/content/presentation-2026-11-13/INTEGRATE.md';
const handoffReference = 'Owner-approved final content handoff 2026-11-19 for the nonpublished school project';
const locationReference = 'Owner local access confirmation, 2026-11-13; docs/content/presentation-2026-11-13/locations.json';

/** Data-only projection from the exact handoff. School use is scoped to the
 * bundled handoff and provides neither wider publication rights nor GPS authority. */
export const presentationCatalog = content.destinations.map(destination => {
  const isAclc = destination.id === 'D10';
  const reference = isAclc ? handoffReference : baselineReference;
  const value = <T,>(item: T) => ({ value: item, approvalReference: reference });
  const translated = (item: { en: string; ja: string; ko: string }) => ({ en: value(item.en), ja: value(item.ja), ko: value(item.ko) });
  const media = [destination.coverMediaId, ...destination.gallery.filter(id => id !== destination.coverMediaId)].map(id => {
    const photo = content.media.find(item => item.id === id);
    if (!photo) throw new Error(`Missing bundled presentation media: ${id}`);
    return { id, source: presentationPhotoAssets[id as keyof typeof presentationPhotoAssets],
      credit: photo.credit, rightsReference: photo.sourceUrl, approvalReference: reference,
      usageScope: photo.usageScope ?? 'Owner-approved nonpublished school presentation',
      alt: translated(photo.alt), caption: translated(photo.caption) };
  });
  const chapters = destination.chapters.map((chapter, index) => ({
    id: chapter.id, role: index === 0 ? 'overview' as const : undefined,
    title: translated(chapter.title), body: translated(chapter.body), presentation: 'story' as const, mediaIds: chapter.mediaIds,
  }));
  return {
    id: destination.id, provisionalName: destination.name.en, verifiedName: value(destination.name.en),
    localizedNames: translated(destination.name), coverMediaId: destination.coverMediaId, media,
    center: isAclc ? aclcDisplayPoint : destination.location.center ?? undefined,
    centerApprovalReference: isAclc ? aclcLocationReference : locationReference,
    routeEntrance: isAclc ? aclcDirectionsEntrance : destination.location.routeEntrance ?? undefined,
    routeEntranceApprovalReference: isAclc ? aclcLocationReference : locationReference,
    copy: {
      en: { overview: value(destination.summary.en), highlights: value(destination.visitorGuide.en.activities) },
      ja: { overview: value(destination.summary.ja), highlights: value(destination.visitorGuide.ja.activities) },
      ko: { overview: value(destination.summary.ko), highlights: value(destination.visitorGuide.ko.activities) },
    },
    requiresGuide: destination.requiresGuide,
    visitorGuide: { en: value(destination.visitorGuide.en), ja: value(destination.visitorGuide.ja), ko: value(destination.visitorGuide.ko) },
    ar: {
      schemaVersion: 1, contentVersion: content.contentVersion, tiles: chapters,
      storyApproval: {
        scope: 'school-presentation', approvalReference: handoffReference, reviewer: 'Project owner', reviewedAt: '2026-11-19',
        contentVersion: content.contentVersion, primaryChapterIds: chapters.filter(chapter => chapter.mediaIds.length).map(chapter => chapter.id),
      },
    },
  };
});
