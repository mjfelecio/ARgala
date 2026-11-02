import { expect, it } from 'vitest';
import { ArSession } from './session';
const identity = { admissionId: 'test', destinationId: 'D01', principalId: 'test', provenance: 'verified' as const };
it('settles interrupted reveal on tracking loss and never replays it or clears reading progress', () => {
  const session = new ArSession(identity, ['overview', 'history']); const attempt = session.begin(identity, 1000)!;
  session.authorizeMount(attempt, identity, 1000, () => true); session.ready(attempt, 1000, true);
  session.saveProgress(attempt, { selectedId: null, cursors: { history: { page: 2, offset: 12, size: 'large', locale: 'en' } }, openedIds: ['history'] });
  session.track(attempt, 'limited'); expect(session.getSnapshot().revealedCount).toBe(2);
  session.track(attempt, 'normal'); expect(session.getSnapshot().phase).toBe('exploring');
  expect(session.getSnapshot().progress.cursors.history.page).toBe(2);
  expect(session.getSnapshot().progress.openedIds).toEqual(['history']);
});
