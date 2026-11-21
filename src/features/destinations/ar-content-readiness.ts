import { destinationSchema } from './catalog';

export type ArStoryReadiness = { ready: boolean; reason: 'approved' | 'invalid' | 'pilot' | 'editorial-pending' | 'media-pending' | 'translation-pending'; scope?: 'school-presentation' };
/** Editorial approval is necessary, never inferred from a photo count. These
 * mechanical checks reject an empty/one-cover assessment, not judge story quality.
 * This reports full launch-story readiness, not geographic admission authority.
 */
export function arStoryReadiness(input: unknown): ArStoryReadiness {
  const parsed = destinationSchema.safeParse(input);
  if (!parsed.success) return { ready: false, reason: 'invalid' };
  const destination = parsed.data;
  if (destination.id === 'pilot-aclc') return { ready: false, reason: 'pilot' };
  const approval = destination.ar?.storyApproval;
  if (!approval || approval.contentVersion !== destination.ar?.contentVersion) return { ready: false, reason: 'editorial-pending' };
  const chapters = destination.ar!.tiles;
  const primary = chapters.filter(tile => approval.primaryChapterIds.includes(tile.id));
  const ids = new Set(primary.flatMap(tile => tile.mediaIds ?? []));
  const school = approval.scope === 'school-presentation';
  const minimumPhotos = school && destination.id === 'D10' ? 1 : 2;
  if (primary.length !== approval.primaryChapterIds.length || ids.size < minimumPhotos || primary.some(tile => !tile.mediaIds?.length)) return { ready: false, reason: 'media-pending' };
  const media = (destination.media ?? []).filter(item => chapters.some(tile => tile.mediaIds?.includes(item.id)));
  if (new Set(media.filter(item => ids.has(item.id)).map(item => item.source)).size < minimumPhotos ||
      media.some(item => school ? !item.usageScope : !item.offlineRightsReference)) return { ready: false, reason: 'media-pending' };
  for (const language of ['en', 'ja', 'ko'] as const) {
    if (chapters.some(tile => !tile.title[language] || !tile.body[language]) || media.some(item => !item.alt[language] || !item.caption?.[language])) return { ready: false, reason: 'translation-pending' };
  }
  return { ready: true, reason: 'approved', ...(school ? { scope: 'school-presentation' } : {}) };
}
