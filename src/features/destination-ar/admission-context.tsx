import { createContext, useCallback, useContext, useEffect, useRef, useSyncExternalStore } from 'react';
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
/** Publish an existing focused GPS owner; this hook never starts a sensor or provider request. */
export function useAdmissionSource(store: ArAdmissionStore | null, id: FeaturedDestinationId | null, input: ArrivalInput, select = false) {
  const lease = useRef<number | null>(null);
  const { running, watcherStatus, sample } = input;
  useEffect(() => {
    if (!store || !running) return;
    if (select) store.select(id);
    if (!id) return;
    const token = store.acquire(id); lease.current = token;
    if (token === null) return;
    const timer = setInterval(() => store.tick(), 1000);
    return () => { clearInterval(timer); store.release(token); if (lease.current === token) lease.current = null; };
  }, [store, id, running, select]);
  useEffect(() => {
    if (store && lease.current !== null) store.publish(lease.current, { running, watcherStatus, sample });
  }, [store, id, running, watcherStatus, sample]);
  const begin = useCallback((kind: 'approved' | 'draft', language: Language) =>
    store && id && lease.current !== null ? store.begin(lease.current, id, kind, language) : null, [store, id]);
  const beginSimulation = useCallback((kind: 'approved' | 'draft', language: Language) =>
    store && id && lease.current !== null ? store.beginSimulation(lease.current, id, kind, language) : null, [store, id]);
  return { begin, beginSimulation };
}
