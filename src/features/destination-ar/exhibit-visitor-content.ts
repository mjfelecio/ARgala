import type { Destination } from '@/features/destinations/catalog';
import { destinationHistory, historyTranslations, type HistoryScope } from '@/features/destinations/history-content';
import { exhibitVisitorCopy } from '@/i18n/locales/ar-exhibit-visitor';
import { editorialBlocks, formatAuthorizedStory, readerLanguages, visitorCopy } from './editorial-content';
import { EXHIBIT_HISTORY_ID, EXHIBIT_VISIT_PLAN_ID, type ReaderBlock, type RingContent } from './ring-content';

const sections = ['arrival', 'bestTime', 'activities', 'preparation', 'safety'] as const;
const copyReference = 'ARgala exhibit interface copy';
type Language = keyof typeof visitorCopy;
type LocalizedText = { value: string; approvalReference: string };

function inEveryLanguage(read: (language: Language) => LocalizedText) {
  return { en: read('en'), ja: read('ja'), ko: read('ko') };
}

function visitPlanBlocks(destination: Destination, language: Language): ReaderBlock[] {
  const guide = destination.visitorGuide?.[language]?.value;
  const copy = visitorCopy[language];
  const blocks: ReaderBlock[] = [];
  if (destination.requiresGuide) blocks.push({ kind: 'callout', text: copy.guideRequired });
  if (!guide) return [...blocks, { kind: 'paragraph', text: exhibitVisitorCopy[language].visitPlanUnavailable }];

  for (const section of sections) {
    const items = guide[section];
    if (!items.length) continue;
    blocks.push({ kind: 'heading', text: copy.visitorGuide[section] });
    if (typeof items === 'string') blocks.push({ kind: 'paragraph', text: items });
    else blocks.push(...items.map((text): ReaderBlock => ({ kind: 'bullet', text })));
  }
  return blocks;
}

const historyPlaceholder: RingContent = {
  id: EXHIBIT_HISTORY_ID,
  role: 'history',
  approved: {
    title: inEveryLanguage(language => ({ value: exhibitVisitorCopy[language].history, approvalReference: copyReference })),
    body: inEveryLanguage(language => ({ value: exhibitVisitorCopy[language].historyUnavailable, approvalReference: copyReference })),
  },
};

/** Add local reader entrances after the caller has chosen its authorized
 * chapters. Visitor guidance has no media or admission authority. */
export function withExhibitVisitorContent(destination: Destination, chapters: readonly RingContent[], historyScope?: HistoryScope): readonly RingContent[] {
  if (destination.id === 'pilot-aclc' || !chapters.length) return chapters;
  const destinationId = destination.id;
  const stories = chapters.map(chapter => formatAuthorizedStory(destinationId, chapter));
  const readerBlocks = { en: visitPlanBlocks(destination, 'en'), ja: visitPlanBlocks(destination, 'ja'), ko: visitPlanBlocks(destination, 'ko') };
  const plan: RingContent = {
    id: EXHIBIT_VISIT_PLAN_ID,
    readerBlocks,
    approved: {
      title: inEveryLanguage(language => ({ value: exhibitVisitorCopy[language].visitPlan, approvalReference: copyReference })),
      body: inEveryLanguage(language => ({
        value: readerBlocks[language].map(block => block.text).join('\n'),
        approvalReference: destination.visitorGuide?.[language].approvalReference ?? copyReference,
      })),
    },
  };
  const history = destinationHistory(destination.id, historyScope);
  if (history) return [...stories, plan, {
    id: EXHIBIT_HISTORY_ID,
    role: 'history',
    readerBlocks: Object.fromEntries(readerLanguages.flatMap(language => {
      const blocks = editorialBlocks(destinationId, EXHIBIT_HISTORY_ID, language, history.entry.text[language]);
      return blocks ? [[language, blocks]] : [];
    })),
    hasHistorySources: true,
    ...(history.media && !history.creativeCommons ? { restrictCapture: true as const } : {}),
    approved: {
      title: historyTranslations(history.entry.title),
      body: historyTranslations(history.entry.text),
      presentation: 'story',
      media: history.media ? [history.media] : [],
    },
  }];
  return chapters.some(chapter => chapter.role === 'history') ? [...stories, plan] : [...stories, plan, historyPlaceholder];
}
