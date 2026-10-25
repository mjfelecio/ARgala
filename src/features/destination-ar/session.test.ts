import { expect, it, vi } from 'vitest';
import { ArSession, suspensionGraceMs } from './session';
const identity = { admissionId: 'development-entry', destinationId: 'development-aclc', principalId: 'owner', provenance: 'development' as const };
const ids = ['overview', 'history'];
function create() { return new ArSession(identity, ids); }
function initialize(session: ArSession, now = 1000) {
  const token = session.begin(identity, now)!;
  expect(session.authorizeMount(token, identity, now + 1, () => true)).toBe(true);
  return token;
}
function live(session: ArSession) { const token = initialize(session); expect(session.ready(token, 1010, false)).toBe(true); return token; }
it('keeps admission pending until tracking-ready and revalidates immediately before mount', () => {
  const session = create(); const eligible = vi.fn(() => true);
  const token = session.begin(identity, 1000)!; expect(session.getSnapshot().established).toBe(false);
  expect(eligible).not.toHaveBeenCalled(); eligible.mockReturnValue(false);
  expect(session.authorizeMount(token, identity, 1001, eligible)).toBe(false);
  expect(eligible).toHaveBeenCalledOnce(); expect(session.ready(token, 1002, false)).toBe(false);
  expect(session.getSnapshot().established).toBe(false);
});
it.each(['preflight', 'initializing'] as const)('requires fresh eligibility after interrupted initial %s without automatic restoration', phase => {
  const session = create(); const token = session.begin(identity, 1000)!;
  if (phase === 'initializing') session.authorizeMount(token, identity, 1001, () => true);
  session.suspend(1100); expect(session.getSnapshot().phase).toBe('interrupted'); expect(session.canRestore(1200)).toBe(false);
  const retry = session.begin(identity, 1200)!;
  expect(session.authorizeMount(retry, identity, 1201, () => false)).toBe(false);
  expect(session.ready(token, 1202, false)).toBe(false);
});
it('grants outside-radius continuation only to a session that was live', () => {
  const session = create(); live(session); session.suspend(2000);
  const fresh = vi.fn(() => false); const token = session.begin(identity, 3000)!;
  expect(session.authorizeMount(token, identity, 3001, fresh)).toBe(true); expect(fresh).not.toHaveBeenCalled();
  expect(session.ready(token, 3010, false)).toBe(true); expect(session.getSnapshot().phase).toBe('exploring');
});
it.each([299000, 300000, 300001, -1])('enforces grace exactly at elapsed %s and fails closed for clock rollback', elapsed => {
  const session = create(); live(session); session.suspend(2000);
  expect(session.canRestore(2000 + elapsed)).toBe(elapsed >= 0 && elapsed < suspensionGraceMs);
});
it('rechecks recovery expiry immediately before mount and ready', () => {
  const session = create(); live(session); session.suspend(2000);
  let token = session.begin(identity, 301000)!;
  expect(session.authorizeMount(token, identity, 302000, () => true)).toBe(false);
  expect(session.getSnapshot().phase).toBe('expired');
  token = initialize(session, 400000); session.ready(token, 400010, false); session.suspend(401000);
  token = session.begin(identity, 700000)!; session.authorizeMount(token, identity, 700001, () => false);
  expect(session.ready(token, 701000, false)).toBe(false); expect(session.getSnapshot().phase).toBe('expired');
});
it('does not automatically repeat installation after an interrupted recovery attempt', () => {
  const session = create(); live(session); session.suspend(2000); expect(session.getSnapshot().phase).toBe('suspended');
  const token = session.begin(identity, 2500)!; session.authorizeMount(token, identity, 2501, () => false);
  session.suspend(2600); expect(session.getSnapshot().phase).toBe('interrupted');
  expect(session.canRestore(3000)).toBe(true); expect(session.getSnapshot().suspendedAt).toBe(2000);
  expect(session.ready(token, 3000, false)).toBe(false);
});
it.each(['admissionId', 'destinationId', 'principalId', 'provenance'] as const)('invalidates ownership on %s change', field => {
  const session = create(); const token = live(session);
  expect(session.authorizeMount(token, { ...identity, [field]: 'changed' }, 1500, () => true)).toBe(false);
  expect(session.getSnapshot().phase).toBe('closed'); expect(session.canRestore(1501)).toBe(false);
});
it('retains whitelisted logical progress without poses or arbitrary caller fields', () => {
  const session = create(); const token = live(session);
  const progress = { selectedId: 'history', cursors: { history: { page: 2, offset: 50, locale: 'en', size: 'large' as const, position: [1, 2, 3] } }, position: [4, 5, 6] };
  session.saveProgress(token, progress); progress.cursors.history.page = 90;
  session.suspend(2000); const next = session.begin(identity, 3000)!; session.authorizeMount(next, identity, 3001, () => false);
  expect(session.getSnapshot().progress).toEqual({ selectedId: 'history', cursors: { history: { page: 2, offset: 50, locale: 'en', size: 'large' } } });
  expect(JSON.stringify(session.getSnapshot())).not.toContain('position');
  session.saveProgress(token, { selectedId: null, cursors: {} }); expect(session.getSnapshot().progress.selectedId).toBe('history');
});
it('retains reveal phase across same-frame tracking loss and ignores stale callbacks', () => {
  const session = create(); const token = initialize(session); session.ready(token, 1020, true);
  session.track(token, 'limited'); expect(session.getSnapshot().phase).toBe('limited');
  session.track(token, 'normal'); expect(session.getSnapshot().phase).toBe('reveal');
  session.finishReveal(token); expect(session.getSnapshot().phase).toBe('exploring');
  session.suspend(2000); session.track(token, 'normal'); expect(session.getSnapshot().phase).toBe('suspended');
});
it('ends progress on explicit exit or a fresh process-owned instance', () => {
  const session = create(); const token = live(session); session.close();
  expect(session.begin(identity, 2000)).toBeNull(); expect(session.ready(token, 2001, false)).toBe(false);
  expect(create().getSnapshot()).toMatchObject({ established: false, phase: 'idle', progress: { selectedId: null, cursors: {} } });
});
it('notifies subscribers with stable snapshots only on transitions', () => {
  const session = create(); const callback = vi.fn(); const stop = session.subscribe(callback);
  expect(session.getSnapshot()).toBe(session.getSnapshot()); live(session); expect(callback).toHaveBeenCalled();
  stop(); callback.mockClear(); session.close(); expect(callback).not.toHaveBeenCalled();
});

it('expires by an independent elapsed clock when wall time rolls back but remains after suspension', () => {
  let elapsed = 1000; const session = new ArSession(identity, ids, () => elapsed); live(session); elapsed = 2000; session.suspend(2000);
  elapsed = 302000; expect(session.expire(122000)).toBe(true); expect(session.canRestore(242000)).toBe(false);
  const token = session.begin(identity, 242000)!; expect(session.authorizeMount(token, identity, 242001, () => false)).toBe(false);
});
it('permits an explicit tracking recovery while retaining logical progress and live admission', () => {
  const session = create(); const old = live(session); session.saveProgress(old, { selectedId: 'history', cursors: { history: { page: 2, offset: 50, locale: 'en', size: 'large' } } });
  session.track(old, 'limited'); expect(session.retryTracking(old, 2000)).toBe(true); expect(session.getSnapshot().phase).toBe('suspended');
  expect(session.retryTracking(old, 2001)).toBe(false); const next = session.begin(identity, 2010)!;
  const fresh = vi.fn(() => false); expect(session.authorizeMount(next, identity, 2011, fresh)).toBe(true); expect(fresh).not.toHaveBeenCalled();
  expect(session.ready(next, 2012, false)).toBe(true); expect(session.getSnapshot().progress.selectedId).toBe('history'); expect(session.getSnapshot().progress.cursors.history.page).toBe(2);
});
it('ignores an old suspension-expiry callback after tracking has recovered live', () => {
  const session = create(); live(session); session.suspend(2000); const token = session.begin(identity, 2010)!;
  session.authorizeMount(token, identity, 2011, () => false); session.ready(token, 2012, false);
  expect(session.expire(302000)).toBe(false); expect(session.getSnapshot().phase).toBe('exploring');
});
