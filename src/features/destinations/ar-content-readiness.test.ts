import { expect, it } from 'vitest';
import { destinationSchema, listDestinations } from './catalog';
import { arStoryReadiness } from './ar-content-readiness';
const text = { value: 'Synthetic fixture', approvalReference: 'test review' };
const translated = { en: text, ja: text, ko: text };
const media = (id: string) => ({ id, source: id === 'a' ? 1 : 2, credit: 'Test author', rightsReference: 'Test license', offlineRightsReference: 'Test offline permission', approvalReference: 'Test review', alt: translated, caption: translated });
const fixture = () => ({ id: 'D01', provisionalName: 'Synthetic fixture', media: [media('a'), media('b')], ar: { schemaVersion: 1, contentVersion: 'test',
  storyApproval: { contentVersion: 'test', approvalReference: 'Test editorial assessment', reviewer: 'Test reviewer', reviewedAt: '2026-11-02', primaryChapterIds: ['overview'] },
  tiles: [{ id: 'overview', role: 'overview', title: translated, body: translated, mediaIds: ['a', 'b'] }, { id: 'visitor', title: translated, body: translated }] } });
it('requires human editorial approval even for multiple reviewed images', () => {
  const input = fixture();
  expect(arStoryReadiness(input).ready).toBe(true);
  expect(arStoryReadiness({ ...input, ar: { ...input.ar, storyApproval: undefined } }).ready).toBe(false);
});
it('rejects a single cover reused across chapters while allowing text-led supporting chapters', () => {
  const input = fixture();
  expect(arStoryReadiness({ ...input, ar: { ...input.ar, tiles: input.ar.tiles.map(tile => ({ ...tile, mediaIds: ['a'] })) } }).ready).toBe(false);
  expect(arStoryReadiness(input).ready).toBe(true);
});
it('requires bound section media, offline rights and reviewed text, captions and alt in every launch language', () => {
  const input = fixture();
  for (const field of ['rightsReference', 'offlineRightsReference', 'approvalReference', 'caption', 'alt']) {
    expect(arStoryReadiness({ ...input, media: input.media.map(item => ({ ...item, [field]: undefined })) }).ready).toBe(false);
  }
  expect(arStoryReadiness({ ...input, media: input.media.map(item => ({ ...item, caption: { en: text } })) }).ready).toBe(false);
  expect(arStoryReadiness({ ...input, ar: { ...input.ar, tiles: input.ar.tiles.map(tile => ({ ...tile, body: { en: text } })) } }).ready).toBe(false);
  expect(arStoryReadiness({ ...input, ar: { ...input.ar, storyApproval: { ...input.ar.storyApproval, primaryChapterIds: ['missing'] } } }).ready).toBe(false);
});
it('leaves provisional map catalog valid and never promotes pilot or draft content', () => {
  for (const destination of listDestinations()) { expect(destinationSchema.safeParse(destination).success).toBe(true); expect(arStoryReadiness(destination).ready).toBe(false); }
  expect(arStoryReadiness({ ...fixture(), id: 'pilot-aclc' }).ready).toBe(false);
});
it('does not reuse editorial approval for another content version or duplicate aliases of one cover', () => {
  const input = fixture();
  expect(arStoryReadiness({ ...input, ar: { ...input.ar, contentVersion: 'unreviewed-revision' } }).ready).toBe(false);
  expect(arStoryReadiness({ ...input, media: input.media.map(item => ({ ...item, source: 1 })) }).ready).toBe(false);
});
