import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
let writes: Promise<unknown> = Promise.resolve();
async function read(key: string) { await writes; return await AsyncStorage.getItem(key) === 'complete'; }
function write(key: string) { const result = writes.then(() => AsyncStorage.setItem(key, 'complete')); writes = result.catch(() => undefined); return result; }
type IntroError = 'load-failed' | 'save-failed';
type Scope = { destinationId: string; provenance: 'verified' | 'development' };
/** Per-install presentation flags only. Cinematic history is destination and
 * provenance scoped; the legacy global help hint is intentionally independent.
 * Call complete after tracking-ready/settlement; it never grants admission.
 */
export function useArIntroduction(scope?: Scope) {
  const key = scope ? `argala.ar-cinematic.v1:${scope.provenance}:${encodeURIComponent(scope.destinationId)}` : 'argala.ar-introduction.v1';
  const [state, setState] = useState({ key, seen: false, error: null as IntroError | null, pending: true });
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const owner = useRef({ key, alive: false, revision: 0, seen: false });
  const load = useCallback(() => {
    const version = owner.current.revision;
    return read(key).then(value => {
      if (owner.current.alive && owner.current.key === key && version === owner.current.revision) {
        owner.current.seen = value; setLoadedKey(key); setState({ key, seen: value, error: null, pending: false });
      }
    }).catch(() => {
      if (owner.current.alive && owner.current.key === key && version === owner.current.revision) { setLoadedKey(key); setState({ key, seen: owner.current.seen, error: 'load-failed', pending: false }); }
    });
  }, [key]);
  useEffect(() => {
    owner.current = { key, alive: true, revision: owner.current.revision + 1, seen: false };
    void load(); return () => { owner.current.alive = false; owner.current.revision++; };
  }, [key, load]);
  const save = useCallback(async () => {
    if (!owner.current.alive || owner.current.key !== key) return;
    const version = ++owner.current.revision; owner.current.seen = true;
    setState({ key, seen: true, error: null, pending: true });
    try { await write(key); if (owner.current.alive && owner.current.key === key && version === owner.current.revision) setState({ key, seen: true, error: null, pending: false }); }
    catch { if (owner.current.alive && owner.current.key === key && version === owner.current.revision) setState({ key, seen: true, error: 'save-failed', pending: false }); }
  }, [key]);
  const complete = useCallback(async () => { if (owner.current.key === key && !owner.current.seen) await save(); }, [key, save]);
  const current = state.key === key ? state : { seen: false, error: null, pending: true };
  const retry = useCallback(async () => {
    if (current.pending || !owner.current.alive || owner.current.key !== key) return;
    if (current.error === 'save-failed') await save();
    else { setState({ key, seen: owner.current.seen, error: null, pending: true }); await load(); }
  }, [current.pending, current.error, key, save, load]);
  return { loaded: loadedKey === key, seen: current.seen, error: current.error, pending: current.pending, complete, retry };
}
