import historyReview from '../../../docs/content/final-handoff-2026-11-19/history-review.json';
import historyImages from '../../../docs/content/final-handoff-2026-11-19/history-images.json';
import sources from '../../../docs/content/final-handoff-2026-11-19/sources.json';
import { historyVisualTranslations } from '@/i18n/locales/ar-history-visuals';
import { destinationHistorySummaries } from '@/i18n/locales/destination-history';
import type { DestinationMedia } from './catalog';

export const schoolPresentationHistoryScope = 'offline-school-presentation';
export type HistoryScope = typeof schoolPresentationHistoryScope;
type VisualId = keyof typeof historyVisualTranslations;
type BundledVisualId = Exclude<VisualId, 'HI-D01-01'>;

const photos: Record<BundledVisualId, number> = {
  'HI-D02-01': require('../../../assets/presentation/history/HI-D02-01-bazzania-globuliformis-plate6.png'),
  'HI-D03-01': require('../../../assets/presentation/history/HI-D03-01-janagdan-petition-2018.jpg'),
  'HI-D04-01': require('../../../assets/presentation/history/HI-D04-01-naungan-boardwalk-2023.jpg'),
  'HI-D05-01': require('../../../assets/presentation/history/HI-D05-01-ormoc-pina-festival-2019.jpg'),
  'HI-D06-01': require('../../../assets/presentation/history/HI-D06-01-cabletow-golf-1994-page53.png'),
  'HI-D07-01': require('../../../assets/presentation/history/HI-D07-01-alto-peak-approach-2010.jpg'),
  'HI-D08-01': require('../../../assets/presentation/history/HI-D08-01-heavens-peak-sunflowers-2019.jpg'),
  'HI-D09-01': require('../../../assets/presentation/history/HI-D09-01-sabin-resort-2013.jpg'),
  'HI-D10-01': require('../../../assets/presentation/featured/D10-archive-2014.jpg'),
};

const handoffReference = '2026-11-19 History content handoff for the offline school project';
const schoolExhibitReference = 'Owner-supplied ACLC school exhibit package 2026-11-22; docs/content/aclc-opencode-handoff.md';
export function historyTranslations(text: { en: string; ja: string; ko: string }, reference = handoffReference) {
  const approved = (value: string) => ({ value, approvalReference: reference });
  return { en: approved(text.en), ja: approved(text.ja), ko: approved(text.ko) };
}

const sourcesById = new Map(sources.sources.map(source => [source.id, source]));
const histories = new Map(historyReview.entries.map(entry => {
  const visual = historyImages.entries.find(item =>
    item.destinationId === entry.destinationId && entry.historyMediaReferences.includes(item.visualId));
  if (!visual) throw new Error(`Missing History visual for ${entry.destinationId}`);
  const translations = historyVisualTranslations[visual.visualId as VisualId];
  const reference = entry.destinationId === 'D10' ? schoolExhibitReference : handoffReference;
  const caption = historyTranslations({ en: visual.captionEn, ja: translations.ja.caption, ko: translations.ko.caption }, reference);
  const alt = historyTranslations({ en: visual.altEn, ja: translations.ja.alt, ko: translations.ko.alt }, reference);
  const creativeCommons = visual.status === 'licensed_asset_bundled_review_pending';
  const media: DestinationMedia | undefined = visual.assetPath && visual.authorCredit ? {
    id: visual.visualId,
    source: photos[visual.visualId as BundledVisualId],
    credit: creativeCommons ? `${visual.authorCredit} · ${visual.license}` : visual.authorCredit,
    rightsReference: visual.licenseUrl,
    approvalReference: reference,
    usageScope: historyImages.distributionScope,
    alt,
    caption,
  } : undefined;
  const sourceIds = new Set(entry.claims.flatMap(claim => claim.sourceIds));
  const citations = [...sourceIds].map(id => {
    const source = sourcesById.get(id);
    if (!source) throw new Error(`Missing History citation ${id}`);
    return source;
  });
  const summary = destinationHistorySummaries[entry.destinationId as keyof typeof destinationHistorySummaries];
  return [entry.destinationId, { entry, summary, visual, caption, creativeCommons, media, citations, reference }];
}));

/** The supplied history review and visual manifest have no public release approval. */
export function destinationHistory(destinationId: string, scope?: HistoryScope) {
  return scope === schoolPresentationHistoryScope ? histories.get(destinationId) : undefined;
}
