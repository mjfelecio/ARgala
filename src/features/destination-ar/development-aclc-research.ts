import type { RingContent } from './ring-content';
/** Owner-authorized research DRAFT, not catalog approval. Sources/limits in docs/content/aclc-research-draft.md. */
export const developmentResearchRingContent: readonly RingContent[] = [
  { id: 'overview', role: 'overview', titleKey: 'aclcResearch.overview.title', bodyKey: 'aclcResearch.overview.body' },
  { id: 'history', role: 'history', titleKey: 'aclcResearch.history.title', bodyKey: 'aclcResearch.history.body' },
  { id: 'visitor-notes', titleKey: 'aclcResearch.notes.title', bodyKey: 'aclcResearch.notes.body' },
  { id: 'facts', titleKey: 'aclcResearch.facts.title', bodyKey: 'aclcResearch.facts.body' },
];
