import content from '../destination-ar/featured-presentation-content.json';
import aclcHandoff from '../../../docs/content/final-handoff-2026-11-19/destination-D10.json';
import { presentationPhotoAssets } from '../destination-ar/featured-presentation-media-assets';
import { aclcDirectionsEntrance, aclcDisplayPoint, aclcLocationReference } from './aclc-locations';

const baselineReference = 'Owner-supplied college presentation content 2026-11-13-presentation-v1; docs/content/presentation-2026-11-13/INTEGRATE.md';
const handoffReference = 'Owner-approved final content handoff 2026-11-19 for the nonpublished school project';
const aclcGalleryReference = 'ACLC campus gallery supplement, 2026-11-22; docs/content/final-handoff-2026-11-19/README.md';
const schoolExhibitReference = 'Owner-supplied ACLC school exhibit package 2026-11-22; docs/content/aclc-opencode-handoff.md';
const locationReference = 'Owner local access confirmation, 2026-11-13; docs/content/presentation-2026-11-13/locations.json';

/** School presentation content. Bundled media provides neither wider publication
 * rights nor GPS authority. */
export const presentationCatalog = content.destinations.map(destination => {
  const isAclc = destination.id === 'D10';
  const reference = isAclc ? schoolExhibitReference : baselineReference;
  const chapterReference = isAclc ? handoffReference : reference;
  const value = <T,>(item: T, referenceForValue = reference) => ({ value: item, approvalReference: referenceForValue });
  const translated = (item: { en: string; ja: string; ko: string }, referenceForValue = reference) =>
    ({ en: value(item.en, referenceForValue), ja: value(item.ja, referenceForValue), ko: value(item.ko, referenceForValue) });
  const media = [destination.coverMediaId, ...destination.gallery.filter(id => id !== destination.coverMediaId)].map(id => {
    const photo = content.media.find(item => item.id === id);
    if (!photo) throw new Error(`Missing bundled presentation media: ${id}`);
    const mediaReference = photo.kind ? aclcGalleryReference : id === 'D10-archive-2014' ? handoffReference : reference;
    return { id, kind: photo.kind, source: presentationPhotoAssets[id as keyof typeof presentationPhotoAssets],
      credit: photo.credit, rightsReference: photo.sourceUrl, approvalReference: mediaReference,
      usageScope: photo.usageScope ?? 'Owner-approved nonpublished school presentation',
      alt: translated(photo.alt, mediaReference), caption: translated(photo.caption, mediaReference) };
  });
  // Verified entry uses the reviewed chapters and their captured media bindings.
  const chapters = (isAclc ? aclcHandoff.chapters : destination.chapters).map((chapter, index) => ({
    id: chapter.id, role: index === 0 ? 'overview' as const : undefined,
    title: translated(chapter.title, chapterReference), body: translated(chapter.body, chapterReference), presentation: 'story' as const, mediaIds: chapter.mediaIds,
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
      ...(isAclc ? { onSiteGalleryMediaIds: media.map(photo => photo.id) } : {}),
      storyApproval: {
        scope: 'school-presentation', approvalReference: handoffReference, reviewer: 'Project owner', reviewedAt: '2026-11-19',
        contentVersion: content.contentVersion, primaryChapterIds: chapters.filter(chapter => chapter.mediaIds.length).map(chapter => chapter.id),
      },
    },
  };
});
