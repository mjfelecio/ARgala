import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
const key = 'argala.ar-introduction.v1';
let writes: Promise<unknown> = Promise.resolve();
async function read() { await writes; return await AsyncStorage.getItem(key) === 'complete'; }
function write() { const result = writes.then(() => AsyncStorage.setItem(key, 'complete')); writes = result.catch(() => undefined); return result; }
type IntroError = 'load-failed' | 'save-failed';
/** Only the one-time hint flag is stored. Native/session progress is not. */
export function useArIntroduction() {
  const [seen, setSeen] = useState(false); const [error, setError] = useState<IntroError | null>(null); const [pending, setPending] = useState(true);
  const alive = useRef(false); const revision = useRef(0); const currentSeen = useRef(false);
  const load = useCallback(() => {
    const version = revision.current;
    return read().then(value => { if (alive.current && version === revision.current) { currentSeen.current = value; setSeen(value); setError(null); } })
      .catch(() => { if (alive.current && version === revision.current) setError('load-failed'); })
      .finally(() => { if (alive.current && version === revision.current) setPending(false); });
  }, []);
  useEffect(() => { alive.current = true; void load(); return () => { alive.current = false; }; }, [load]);
  const save = useCallback(async () => {
    const version = ++revision.current; currentSeen.current = true; setSeen(true); setPending(true);
    try { await write(); if (alive.current && version === revision.current) setError(null); }
    catch { if (alive.current && version === revision.current) setError('save-failed'); }
    finally { if (alive.current && version === revision.current) setPending(false); }
  }, []);
  const complete = useCallback(async () => { if (!currentSeen.current) await save(); }, [save]);
  const retry = useCallback(async () => { if (pending) return; if (error === 'save-failed') await save(); else { setPending(true); await load(); } }, [pending, error, save, load]);
  return { seen, error, pending, complete, retry };
}
