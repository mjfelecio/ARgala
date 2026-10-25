import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { ArSession, suspensionGraceMs, type LogicalArProgress, type SessionIdentity } from './session';
import { useViroStartup, type StartupPolicy } from './use-viro-startup';
import type { TrackingState } from './types';
type Options = { identity: SessionIdentity; tileIds: readonly string[]; running: boolean; transitionReady: boolean; measured: boolean; freshEligible(): boolean; reveal: boolean };

/** Owns logical progress and attempts above the disposable native navigator.
 * The route keys this owner by principal/destination; mismatches also fail closed.
 */
export function useArSession({ identity, tileIds, running, transitionReady, measured, freshEligible, reveal }: Options) {
  const [owner] = useState(() => ({ identity: { ...identity }, session: new ArSession(identity, tileIds) }));
  const model = owner.session; const session = useSyncExternalStore(model.subscribe, model.getSnapshot, model.getSnapshot);
  const token = useRef(0);
  const matches = owner.identity.destinationId === identity.destinationId && owner.identity.principalId === identity.principalId && owner.identity.provenance === identity.provenance;
  const policy = useMemo<StartupPolicy>(() => ({
    begin() { const next = model.begin(identity, Date.now()); if (next === null) return false; token.current = next; return true; },
    authorizeMount: () => model.authorizeMount(token.current, identity, Date.now(), freshEligible),
    ready: () => model.ready(token.current, Date.now(), reveal),
    interrupt: () => model.suspend(Date.now()),
    fail: () => model.fail(token.current, Date.now()),
  }), [model, identity, freshEligible, reveal]);
  const startup = useViroStartup({ running: running && matches && session.phase !== 'closed', transitionReady, measured, policy });
  const start = startup.start;
  useEffect(() => { if (!matches) model.close(); }, [matches, model]);
  useEffect(() => {
    if (!session.established || session.suspendedAt === null) return;
    if (!model.canRestore(Date.now())) { model.expire(Date.now()); return; }
    const timer = setTimeout(() => model.expire(Date.now()), Math.max(0, suspensionGraceMs - (Date.now() - session.suspendedAt)));
    return () => clearTimeout(timer);
  }, [model, session.established, session.suspendedAt, running]);
  useEffect(() => {
    if (running && transitionReady && measured && matches && session.phase === 'suspended' && model.canRestore(Date.now())) void start();
  }, [running, transitionReady, measured, matches, session.phase, model, start]);
  useEffect(() => {
    if (session.phase !== 'reveal') return;
    const timer = setInterval(() => model.advanceReveal(session.attempt), 2400 / Math.max(1, tileIds.length));
    return () => clearInterval(timer);
  }, [model, session.phase, session.attempt, tileIds.length]);
  const onTracking = useCallback((value: TrackingState) => model.track(session.attempt, value), [model, session.attempt]);
  const onProgress = useCallback((value: LogicalArProgress) => model.saveProgress(session.attempt, value), [model, session.attempt]);
  const close = useCallback(() => model.close(), [model]);
  const finishReveal = useCallback(() => model.finishReveal(session.attempt), [model, session.attempt]);
  const expired = session.phase === 'expired';
  return { session, onTracking, onProgress, close, finishReveal, startup: {
    ...startup, phase: expired ? 'failed' as const : startup.phase, errorCode: expired ? 'entry-ineligible' as const : startup.errorCode,
    mountScene: startup.mountScene && matches && !expired && session.phase !== 'closed',
  } };
}
