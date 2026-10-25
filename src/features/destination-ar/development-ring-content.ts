import type { RingEntry } from './scene-geometry';
export type RingContent = RingEntry & { titleKey: string; bodyKey: string };
/** Development-only, independently written layout samples. No destination facts/media. */
export const developmentRingContent: readonly RingContent[] = [
  { id: 'overview', role: 'overview', titleKey: 'destinationRing.mock.overview.title', bodyKey: 'destinationRing.mock.overview.body' },
  { id: 'history', role: 'history', titleKey: 'destinationRing.mock.history.title', bodyKey: 'destinationRing.mock.history.body' },
  { id: 'visitor-notes', titleKey: 'destinationRing.mock.notes.title', bodyKey: 'destinationRing.mock.notes.body' },
  { id: 'facts', titleKey: 'destinationRing.mock.facts.title', bodyKey: 'destinationRing.mock.facts.body' },
];
