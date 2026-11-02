import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import type { FeaturedDestinationId } from '@/features/destinations/catalog';
import type { ArrivalInput } from '@/features/destinations/proximity';
import type { Language } from '../../../supabase/functions/_shared/contracts';
import { ArAdmissionStore } from './admission-store';
export const AdmissionContext = createContext<ArAdmissionStore | null>(null);
export const useArAdmission = () => useContext(AdmissionContext);
const subscribeNothing = () => () => {};
const noSnapshot = () => null;
export function useAdmissionSnapshot(store: ArAdmissionStore | null) {
  return useSyncExternalStore(store?.subscribe ?? subscribeNothing, store?.getSnapshot ?? noSnapshot, noSnapshot);
}
/** Own a focused admission source; publish existing GPS evidence without starting sensors or provider work. */
export function useAdmissionSource(store: ArAdmissionStore | null, id: FeaturedDestinationId | null, input: ArrivalInput, select = false) {
  const { running, watcherStatus, sample } = input;
  // A captured action belongs to this foreground/selection scope. Async development
  // loading must never borrow the lease from a later focus or selected destination.
  const owner = useMemo(() => ({ store, id, running, select }), [store, id, running, select]);
  const lease = useRef<{ owner: typeof owner; token: number } | null>(null);
  const committedOwner = useRef<typeof owner | null>(null);
  // Retire old actions at commit, before passive lease cleanup/publication.
  useLayoutEffect(() => {
    committedOwner.current = owner;
    return () => { if (committedOwner.current === owner) committedOwner.current = null; };
  }, [owner]);
  useEffect(() => {
    if (!store || !running) return;
    if (select) store.select(id);
    if (!id) return;
    const token = store.acquire(id);
    if (token === null) return;
    lease.current = { owner, token };
    const timer = setInterval(() => store.tick(), 1000);
    return () => { clearInterval(timer); store.release(token); if (lease.current?.owner === owner) lease.current = null; };
  }, [store, id, running, select, owner]);
  useEffect(() => {
    if (store && lease.current?.owner === owner) store.publish(lease.current.token, { running, watcherStatus, sample });
  }, [store, id, running, watcherStatus, sample, owner]);
  const begin = useCallback((kind: 'approved' | 'draft', language: Language) =>
    store && id && committedOwner.current === owner && lease.current?.owner === owner ? store.begin(lease.current.token, id, kind, language) : null, [store, id, owner]);
  const beginSimulation = useCallback((kind: 'approved' | 'draft', language: Language) =>
    store && id && committedOwner.current === owner && lease.current?.owner === owner ? store.beginSimulation(lease.current.token, id, kind, language) : null, [store, id, owner]);
  return { begin, beginSimulation };
}
