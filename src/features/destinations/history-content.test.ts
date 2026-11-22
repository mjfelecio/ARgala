import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import historyImages from '../../../docs/content/final-handoff-2026-11-19/history-images.json';
import historyReview from '../../../docs/content/final-handoff-2026-11-19/history-review.json';
import { destinationHistory, schoolPresentationHistoryScope } from './history-content';
import { getDestination } from './catalog';

it('keeps the handoff’s claim-to-source links and restricted use scope', () => {
  for (const entry of historyReview.entries) {
    expect(destinationHistory(entry.destinationId)).toBeUndefined();
    const history = destinationHistory(entry.destinationId, schoolPresentationHistoryScope)!;
    expect(history.entry).toBe(entry);
    for (const language of ['en', 'ja', 'ko'] as const) {
      expect(history.summary[language]).toBeTruthy();
      expect(history.summary[language]).not.toMatch(/[\r\n]/);
      expect(history.summary[language].length).toBeLessThan(entry.text[language].length);
    }
    expect(history.citations.map(source => source.id)).toEqual([...new Set(entry.claims.flatMap(claim => claim.sourceIds))]);
    expect(history.entry.approvedForOnsiteDistribution).toBe(false);
  }
  expect(historyImages.releaseApproved).toBe(false);
  expect(destinationHistory('pilot-aclc', schoolPresentationHistoryScope)).toBeUndefined();
});

it('bundles the original nine History visuals byte-for-byte and reuses the archival D10 cover', () => {
  const bundled = historyImages.entries.filter(entry => entry.assetPath);
  expect(bundled).toHaveLength(9);
  expect(bundled.filter(entry => entry.status === 'licensed_asset_bundled_review_pending').map(entry => entry.license)).toEqual(['CC BY 3.0', 'CC BY-SA 4.0']);
  const sources = new Set<number>();
  for (const entry of bundled) {
    const path = entry.destinationId === 'D10' ? 'featured/D10-archive-2014.jpg' : entry.assetPath!.replace('media/', '');
    const data = readFileSync(new URL(`../../../assets/presentation/${path}`, import.meta.url));
    expect(data.byteLength).toBe(entry.byteLength);
    expect(createHash('sha256').update(data).digest('hex')).toBe(entry.sha256);
    const media = destinationHistory(entry.destinationId, schoolPresentationHistoryScope)!.media!;
    expect(media.id).toBe(entry.visualId);
    expect(media.alt.en.value).toBe(entry.altEn);
    expect(media.caption!.en!.value).toBe(entry.captionEn);
    expect(media.alt.ja?.value).toBeTruthy();
    expect(media.alt.ko?.value).toBeTruthy();
    expect(media.caption?.ja?.value).toBeTruthy();
    expect(media.caption?.ko?.value).toBeTruthy();
    expect(media.credit).toContain(entry.authorCredit);
    expect(media.offlineRightsReference).toBeUndefined();
    sources.add(media.source);
  }
  expect(sources.size).toBe(9);
  expect(destinationHistory('D01', schoolPresentationHistoryScope)?.media).toBeUndefined();
  expect(destinationHistory('D10', schoolPresentationHistoryScope)?.media?.source).toBe(getDestination('D10')?.media?.[0]?.source);
});
