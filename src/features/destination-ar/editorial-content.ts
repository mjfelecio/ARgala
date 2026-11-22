import type { DestinationId } from '@/features/destinations/catalog';
import type { Language } from '../../../supabase/functions/_shared/contracts';
import type { LocalizedReaderBlocks, ReaderBlock, RingContent } from './ring-content';
import featuredContent from './featured-presentation-content.json';
import breaks from './editorial-breaks';
import en from '@/i18n/locales/en.json';
import ja from '@/i18n/locales/ja.json';
import ko from '@/i18n/locales/ko.json';

export const visitorCopy = { en: en.destinations, ja: ja.destinations, ko: ko.destinations };
export const readerLanguages = ['en', 'ja', 'ko'] as const;

type Break = readonly [anchor: string, kind: ReaderBlock['kind'], heading?: keyof typeof en.destinations.visitorGuide];
const edits: Partial<Record<string, Record<Language, readonly Break[]>>> = breaks;

/** Layout annotations address the original text. A changed or unavailable body keeps its normal reader. */
export function editorialBlocks(id: DestinationId, chapter: string, language: Language, body: string): ReaderBlock[] | undefined {
  const boundaries = edits[`${id}/${chapter}`]?.[language];
  if (!boundaries?.length) return undefined;
  const blocks: ReaderBlock[] = [];
  let start = 0;
  let kind: ReaderBlock['kind'] = 'paragraph';
  for (const [anchor, nextKind, heading] of boundaries) {
    const index = body.indexOf(anchor, start + 1);
    if (index < 0) return undefined;
    blocks.push({ kind, text: body.slice(start, index).trim() });
    if (heading) blocks.push({ kind: 'heading', text: visitorCopy[language].visitorGuide[heading] });
    start = index;
    kind = nextKind;
  }
  blocks.push({ kind, text: body.slice(start).trim() });
  return blocks;
}

export function formatAuthorizedStory(destinationId: DestinationId, chapter: RingContent): RingContent {
  const original = featuredContent.destinations.find(item => item.id === destinationId)?.chapters.find(item => item.id === chapter.id);
  if (!original || !chapter.approved) return chapter;
  const localized: LocalizedReaderBlocks = {};
  for (const language of readerLanguages) {
    const approved = chapter.approved.body[language];
    if (approved?.value !== original.body[language]) continue;
    const blocks = editorialBlocks(destinationId, chapter.id, language, approved.value);
    if (blocks) localized[language] = blocks;
  }
  return Object.keys(localized).length ? { ...chapter, readerBlocks: localized } : chapter;
}
