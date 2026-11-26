import type { Destination } from '@/features/destinations/catalog';
import { destinationHistory, historyTranslations, type HistoryScope } from '@/features/destinations/history-content';
import { exhibitVisitorCopy } from '@/i18n/locales/ar-exhibit-visitor';
import { editorialBlocks, formatAuthorizedStory, readerLanguages, visitorCopy } from './editorial-content';
import { EXHIBIT_HISTORY_ID, EXHIBIT_GUIDE_IDS, exhibitGuideSections, type ExhibitGuideSection, type ReaderBlock, type RingContent } from './ring-content';
import { visitGuideEssentials } from './visit-guide-essentials';

const copyReference = 'ARgala exhibit interface copy';
type Language = keyof typeof visitorCopy;
type LocalizedText = { value: string; approvalReference: string };

function inEveryLanguage(read: (language: Language) => LocalizedText) {
  return { en: read('en'), ja: read('ja'), ko: read('ko') };
}

function guideSection(destination: Destination, section: ExhibitGuideSection): RingContent {
  const sectionTitle = (language: Language) => {
    if (section === 'safety') return exhibitVisitorCopy[language].safety;
    if (section === 'activities' && language === 'en') return exhibitVisitorCopy.en.thingsToDo;
    return visitorCopy[language].visitorGuide[section];
  };
  const blocks = (language: Language, essentials: boolean): ReaderBlock[] => {
    const copy = visitorCopy[language];
    const items = essentials && destination.id !== 'pilot-aclc'
      ? visitGuideEssentials[destination.id][language][section]
      : destination.visitorGuide?.[language].value[section];
    const heading: ReaderBlock = { kind: 'heading', text: sectionTitle(language) };
    const required = destination.requiresGuide && section === 'arrival';
    const guidance: ReaderBlock[] = typeof items === 'string'
      ? [{ kind: 'paragraph', text: items }]
      : items?.map(text => ({ kind: section === 'safety' ? 'callout' : 'bullet', text })) ??
        [{ kind: 'paragraph', text: exhibitVisitorCopy[language].visitGuideUnavailable }];
    return [...(essentials ? [heading] : []), ...(required ? [{ kind: 'callout' as const, text: copy.guideRequired }] : []), ...guidance];
  };

  const readerBlocks = { en: blocks('en', false), ja: blocks('ja', false), ko: blocks('ko', false) };
  return {
    id: EXHIBIT_GUIDE_IDS[section],
    readerBlocks,
    guideEssentials: { en: blocks('en', true), ja: blocks('ja', true), ko: blocks('ko', true) },
    approved: {
      title: inEveryLanguage(language => ({ value: sectionTitle(language), approvalReference: copyReference })),
      body: inEveryLanguage(language => ({
        value: readerBlocks[language].map(block => block.text).join('\n'),
        approvalReference: destination.visitorGuide?.[language].approvalReference ?? copyReference,
      })),
    },
  };
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
  const guidance = exhibitGuideSections.map(section => guideSection(destination, section));
  const history = destinationHistory(destination.id, historyScope);
  if (history) return [...stories, ...guidance, {
    id: EXHIBIT_HISTORY_ID,
    role: 'history',
    readerBlocks: Object.fromEntries(readerLanguages.flatMap(language => {
      const blocks = editorialBlocks(destinationId, EXHIBIT_HISTORY_ID, language, history.entry.text[language]);
      return blocks ? [[language, blocks]] : [];
    })),
    hasHistorySources: true,
    ...(history.media && !history.creativeCommons ? { restrictCapture: true as const } : {}),
    approved: {
      title: historyTranslations(history.entry.title, history.reference),
      body: historyTranslations(history.entry.text, history.reference),
      presentation: 'story',
      media: history.media ? [history.media] : [],
    },
  }];
  return chapters.some(chapter => chapter.role === 'history') ? [...stories, ...guidance] : [...stories, ...guidance, historyPlaceholder];
}
