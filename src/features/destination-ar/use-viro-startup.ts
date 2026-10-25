import { useCallback, useEffect, useRef, useState } from 'react';
import { cameraPermission, readViroSupport } from './viro-runtime';
import type { StartupError, StartupPhase } from './types';

type State = { phase: StartupPhase; errorCode: StartupError | null; canAskAgain: boolean; attempt: number };
const initial: State = { phase: 'idle', errorCode: null, canAskAgain: true, attempt: 0 };
const startupTimeoutMs = 20000;

/** M1 is an explicit development probe, with no geographic admission or resume grant.
 * Attempt ownership lives above the disposable navigator. Resume never mounts a
 * replacement view (and hence never recreates an ARCore install prompt) by itself.
 */
export function useViroStartup({ running, transitionReady, measured }: { running: boolean; transitionReady: boolean; measured: boolean }) {
  const [state, setState] = useState<State>(initial);
  const current = useRef(state);
  const sequence = useRef(0);
  const alive = useRef(true);
  const operation = useRef<{ attempt: number; stage: 'support' | 'permission-check' | 'permission-request' } | null>(null);
  const [pending, setPending] = useState(false);
  const deadline = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const write = useCallback((next: State) => {
    current.current = next;
    if (alive.current) setState(next);
  }, []);
  const retire = useCallback(() => { sequence.current += 1; clearTimeout(timer.current); }, []);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; retire(); };
  }, [retire]);
  useEffect(() => {
    if (running) return;
    retire();
    if (operation.current?.stage !== 'permission-request') { operation.current = null; setPending(false); }
    if (current.current.phase !== 'idle') write({ ...current.current, phase: 'interrupted', errorCode: null });
  }, [running, retire, write]);

  const start = useCallback(async (prompt = false) => {
    if (!running || operation.current) return;
    retire(); const attempt = sequence.current;
    const valid = () => alive.current && sequence.current === attempt;
    const fail = (errorCode: StartupError) => {
      if (!valid()) return;
      // A hung support callback is safe to abandon. An outstanding permission
      // activity must settle before another owner can offer a new prompt.
      if (operation.current?.stage !== 'permission-request') { operation.current = null; setPending(false); }
      retire(); write({ ...current.current, phase: 'failed', errorCode });
    };
    operation.current = { attempt, stage: 'support' }; setPending(true);
    write({ ...initial, attempt, phase: 'checking' });
    deadline.current = Date.now() + startupTimeoutMs;
    timer.current = setTimeout(() => fail('startup-timeout'), startupTimeoutMs);
    try {
      const support = await readViroSupport();
      if (!valid()) return;
      if (support !== 'supported') { fail(support); return; }
      operation.current = { attempt, stage: 'permission-check' };
      const permission = await cameraPermission(prompt, {
        isCurrent: () => valid() && Date.now() < deadline.current,
        onPrompt: () => { if (valid()) operation.current = { attempt, stage: 'permission-request' }; },
      });
      if (!valid()) return;
      if (!permission.granted) {
        clearTimeout(timer.current);
        write({ ...current.current, phase: 'permission', canAskAgain: permission.canAskAgain });
      } else write({ ...current.current, phase: 'prepared' });
    } catch { fail('permission-failed'); }
    finally {
      if (operation.current?.attempt === attempt) {
        operation.current = null; if (alive.current) setPending(false);
      }
    }
  }, [running, retire, write]);

  useEffect(() => {
    if (running && transitionReady && measured && current.current.phase === 'prepared') write({ ...current.current, phase: 'initializing' });
  }, [running, transitionReady, measured, state.phase, write]);
  const onReady = useCallback(() => {
    if (!running || sequence.current !== state.attempt || current.current.phase !== 'initializing') return;
    if (Date.now() >= deadline.current) {
      retire(); write({ ...current.current, phase: 'failed', errorCode: 'startup-timeout' }); return;
    }
    clearTimeout(timer.current); write({ ...current.current, phase: 'live' });
  }, [running, state.attempt, retire, write]);
  const onFailure = useCallback(() => {
    if (sequence.current !== state.attempt || !alive.current) return;
    retire(); write({ ...current.current, phase: 'failed', errorCode: 'failed' });
  }, [state.attempt, retire, write]);
  return { ...state, pending, start, onReady, onFailure,
    mountScene: running && transitionReady && measured && (state.phase === 'initializing' || state.phase === 'live'),
  };
}
