import type { Destination } from '@/features/destinations/catalog';
import { destinationHistory, historyTranslations, type HistoryScope } from '@/features/destinations/history-content';
import { exhibitVisitorCopy } from '@/i18n/locales/ar-exhibit-visitor';
import en from '@/i18n/locales/en.json';
import ja from '@/i18n/locales/ja.json';
import ko from '@/i18n/locales/ko.json';
import { EXHIBIT_HISTORY_ID, EXHIBIT_VISIT_PLAN_ID, type RingContent } from './ring-content';

const destinationCopy = { en: en.destinations, ja: ja.destinations, ko: ko.destinations };
const sections = ['arrival', 'bestTime', 'activities', 'preparation', 'safety'] as const;
const copyReference = 'ARgala exhibit interface copy';
type Language = keyof typeof destinationCopy;
type LocalizedText = { value: string; approvalReference: string };

function inEveryLanguage(read: (language: Language) => LocalizedText) {
  return { en: read('en'), ja: read('ja'), ko: read('ko') };
}

function visitPlanBody(destination: Destination, language: Language): LocalizedText {
  const guide = destination.visitorGuide?.[language];
  const copy = destinationCopy[language];
  const parts = destination.requiresGuide ? [copy.guideRequired] : [];
  if (guide) {
    for (const section of sections) {
      const items = guide.value[section];
      const text = typeof items === 'string' ? items : items.join('\n');
      if (text) parts.push(`${copy.visitorGuide[section]}\n${text}`);
    }
  } else {
    parts.push(exhibitVisitorCopy[language].visitPlanUnavailable);
  }
  return { value: parts.join('\n\n'), approvalReference: guide?.approvalReference ?? copyReference };
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
  const plan: RingContent = {
    id: EXHIBIT_VISIT_PLAN_ID,
    approved: {
      title: inEveryLanguage(language => ({ value: exhibitVisitorCopy[language].visitPlan, approvalReference: copyReference })),
      body: inEveryLanguage(language => visitPlanBody(destination, language)),
    },
  };
  const history = destinationHistory(destination.id, historyScope);
  if (history) return [...chapters, plan, {
    id: EXHIBIT_HISTORY_ID,
    role: 'history',
    hasHistorySources: true,
    ...(history.media && !history.creativeCommons ? { restrictCapture: true as const } : {}),
    approved: {
      title: historyTranslations(history.entry.title),
      body: historyTranslations(history.entry.text),
      presentation: 'story',
      media: history.media ? [history.media] : [],
    },
  }];
  return chapters.some(chapter => chapter.role === 'history') ? [...chapters, plan] : [...chapters, plan, historyPlaceholder];
}
