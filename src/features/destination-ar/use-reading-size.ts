import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createReadingStore, readingSizes, type ReadingSize } from './reading-preference';
const store = createReadingStore(AsyncStorage);
export type ReadingError = 'load-failed' | 'save-failed';
export function useReadingSize() {
  const [size, setSize] = useState<ReadingSize>('standard');
  const [error, setError] = useState<ReadingError | null>(null);
  const [pending, setPending] = useState(true);
  const latest = useRef(size); const revision = useRef(0); const loadSequence = useRef(0); const alive = useRef(false);
  const load = useCallback(() => {
    const request = ++loadSequence.current; const version = revision.current;
    const valid = () => alive.current && request === loadSequence.current && version === revision.current;
    return store.read().then(loaded => {
      if (valid()) { latest.current = loaded; setSize(loaded); setError(null); }
    }).catch(() => { if (valid()) setError('load-failed'); })
      .finally(() => { if (valid()) setPending(false); });
  }, []);
  useEffect(() => {
    alive.current = true; void load();
    return () => { alive.current = false; };
  }, [load]);
  const save = useCallback(async (value: ReadingSize, version: number) => {
    setPending(true);
    try { await store.write(value); if (alive.current && version === revision.current) setError(null); }
    catch { if (alive.current && version === revision.current) setError('save-failed'); }
    finally { if (alive.current && version === revision.current) setPending(false); }
  }, []);
  const change = useCallback((delta: number) => {
    const index = Math.min(2, Math.max(0, readingSizes.indexOf(latest.current) + delta));
    const next = readingSizes[index]; if (next === latest.current) return;
    latest.current = next; setSize(next); setError(null); void save(next, ++revision.current);
  }, [save]);
  const retry = useCallback(async () => {
    if (pending) return;
    if (error === 'load-failed') { setPending(true); await load(); }
    else if (error === 'save-failed') await save(latest.current, ++revision.current);
  }, [error, pending, load, save]);
  return { size, error, pending, change, retry };
}
