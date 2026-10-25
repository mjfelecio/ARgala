import type { ReadingCursor } from './content-layout';
import type { TrackingState } from './types';
export const suspensionGraceMs = 5 * 60 * 1000;
export type SessionIdentity = { destinationId: string; principalId: string; provenance: 'development' | 'verified' };
export type LogicalArProgress = { selectedId: string | null; cursors: Record<string, ReadingCursor> };
type Phase = 'idle' | 'preflight' | 'initializing' | 'reveal' | 'exploring' | 'limited' | 'suspended' | 'interrupted' | 'failed' | 'expired' | 'closed';
export type SessionSnapshot = { phase: Phase; attempt: number; established: boolean; suspendedAt: number | null; progress: LogicalArProgress; revealedCount: number };
const emptyProgress = (): LogicalArProgress => ({ selectedId: null, cursors: {} });

/** Route-owned logical state only. A fresh instance never inherits admission.
 * No camera transform, coordinates, provider response or persisted session data.
 */
export class ArSession {
  private state: SessionSnapshot = Object.freeze({ phase: 'idle', attempt: 0, established: false, suspendedAt: null, progress: emptyProgress(), revealedCount: 0 });
  private listeners = new Set<() => void>();
  private resumePhase: 'reveal' | 'exploring' = 'exploring';
  private ids: ReadonlySet<string>;
  constructor(private readonly identity: SessionIdentity, ids: readonly string[]) { this.identity = { ...identity }; this.ids = new Set(ids); }
  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private write(patch: Partial<SessionSnapshot>) { this.state = Object.freeze({ ...this.state, ...patch }); this.listeners.forEach(listener => listener()); }
  private matches(identity: SessionIdentity) { return identity.destinationId === this.identity.destinationId && identity.principalId === this.identity.principalId && identity.provenance === this.identity.provenance; }
  private current(attempt: number) { return attempt === this.state.attempt && this.state.phase !== 'closed' && this.state.phase !== 'expired'; }
  canRestore(now: number) {
    const start = this.state.suspendedAt;
    return this.state.established && start !== null && Number.isFinite(now) && now >= start && now - start < suspensionGraceMs;
  }
  begin(identity: SessionIdentity, now: number): number | null {
    if (!this.matches(identity)) { this.close(); return null; }
    if (this.state.phase === 'closed' || ['preflight', 'initializing', 'reveal', 'exploring', 'limited'].includes(this.state.phase)) return null;
    if (this.state.established && !this.canRestore(now)) this.expire(now);
    const attempt = this.state.attempt + 1;
    this.write({ attempt, phase: 'preflight' }); return attempt;
  }
  authorizeMount(attempt: number, identity: SessionIdentity, now: number, freshEligible: () => boolean) {
    if (!this.matches(identity)) { this.close(); return false; }
    if (!this.current(attempt) || this.state.phase !== 'preflight') return false;
    if (this.state.established) {
      if (!this.canRestore(now)) { this.expire(now); return false; }
    } else {
      let eligible = false;
      try { eligible = freshEligible(); } catch { /* A missing/failed gate never grants entry. */ }
      if (!eligible) { this.write({ phase: 'failed' }); return false; }
    }
    this.write({ phase: 'initializing' }); return true;
  }
  ready(attempt: number, now: number, reveal: boolean) {
    if (!this.current(attempt) || this.state.phase !== 'initializing') return false;
    if (this.state.established && !this.canRestore(now)) { this.expire(now); return false; }
    const first = !this.state.established;
    this.write({ established: true, suspendedAt: null, phase: first && reveal && this.ids.size > 0 ? 'reveal' : 'exploring', revealedCount: first && reveal ? Math.min(1, this.ids.size) : this.ids.size }); return true;
  }
  track(attempt: number, tracking: TrackingState) {
    if (!this.current(attempt)) return;
    const phase = this.state.phase;
    if (tracking !== 'normal' && (phase === 'reveal' || phase === 'exploring')) { this.resumePhase = phase; this.write({ phase: 'limited' }); }
    else if (tracking === 'normal' && phase === 'limited') this.write({ phase: this.resumePhase });
  }
  finishReveal(attempt: number) {
    if (!this.current(attempt)) return;
    if (this.state.phase === 'reveal') this.write({ phase: 'exploring', revealedCount: this.ids.size });
    else if (this.state.phase === 'limited' && this.resumePhase === 'reveal') { this.resumePhase = 'exploring'; this.write({ revealedCount: this.ids.size }); }
  }
  advanceReveal(attempt: number) {
    if (!this.current(attempt) || this.state.phase !== 'reveal') return;
    if (this.state.revealedCount >= this.ids.size) this.finishReveal(attempt);
    else this.write({ revealedCount: this.state.revealedCount + 1 });
  }
  suspend(now: number) {
    const phase = this.state.phase;
    if (['idle', 'closed', 'expired', 'suspended', 'interrupted', 'failed'].includes(phase)) return;
    const liveFrame = ['reveal', 'exploring', 'limited'].includes(phase);
    // Interrupted initial/recovery startup never auto-creates another native
    // view: its install-attempt flag would reset and could repeat a prompt.
    this.write({ attempt: this.state.attempt + 1, phase: liveFrame ? 'suspended' : 'interrupted',
      suspendedAt: this.state.established ? this.state.suspendedAt ?? now : null });
  }
  fail(attempt: number, now: number) {
    if (!this.current(attempt)) return;
    this.write({ phase: 'failed', suspendedAt: this.state.established ? this.state.suspendedAt ?? now : null });
  }
  expire(now: number) {
    if (!this.state.established || this.canRestore(now)) return false;
    this.write({ phase: 'expired', established: false, suspendedAt: null, attempt: this.state.attempt + 1, progress: emptyProgress() }); return true;
  }
  saveProgress(attempt: number, progress: LogicalArProgress) {
    if (!this.current(attempt) || !['reveal', 'exploring', 'limited'].includes(this.state.phase)) return;
    const cursors: Record<string, ReadingCursor> = {};
    for (const id of this.ids) {
      const cursor = progress.cursors[id];
      if (!cursor || !Number.isSafeInteger(cursor.page) || cursor.page < 0 || !Number.isSafeInteger(cursor.offset) || cursor.offset < 0 || !['small', 'standard', 'large'].includes(cursor.size) || typeof cursor.locale !== 'string') continue;
      cursors[id] = Object.freeze({ page: cursor.page, offset: cursor.offset, locale: cursor.locale, size: cursor.size });
    }
    this.write({ progress: Object.freeze({ selectedId: progress.selectedId !== null && this.ids.has(progress.selectedId) ? progress.selectedId : null, cursors: Object.freeze(cursors) }) });
  }
  close() { this.write({ phase: 'closed', established: false, suspendedAt: null, attempt: this.state.attempt + 1, progress: emptyProgress() }); }
}
