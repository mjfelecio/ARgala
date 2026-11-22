import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import type { Destination } from './catalog';
import { EntranceArrivalStore, entranceTarget } from './entrance-arrival';
import type { ArrivalInput } from './proximity';

export const EntranceArrivalContext = createContext<EntranceArrivalStore | null>(null);
const subscribeNothing = () => () => {};
const noSnapshot = () => null;

/** Borrow the existing watcher during this screen's own foreground lease. */
export function useEntranceArrival(destination: Destination | null, input: ArrivalInput) {
  const store = useContext(EntranceArrivalContext);
  const target = entranceTarget(destination);
  const id = target?.id;
  const latitude = target?.point.latitude;
  const longitude = target?.point.longitude;
  const { running, watcherStatus, sample } = input;
  const owner = useMemo(() => store && running && id && latitude !== undefined && longitude !== undefined
    ? { key: Symbol(), store, target: { id, point: { latitude, longitude } } } : null, [store, running, id, latitude, longitude]);
  const current = useRef<typeof owner>(null);
  const lease = useRef<{ owner: NonNullable<typeof owner>; token: number } | null>(null);
  const latest = useRef(input);
  useLayoutEffect(() => {
    current.current = owner;
    return () => { if (current.current === owner) current.current = null; };
  }, [owner]);
  useLayoutEffect(() => {
    latest.current = { running, watcherStatus, sample };
    if (owner && lease.current?.owner === owner) owner.store.publish(lease.current.token, latest.current);
  }, [owner, running, watcherStatus, sample]);
  useEffect(() => {
    if (!owner) return;
    const token = owner.store.acquire(owner.target, Date.now(), owner.key);
    lease.current = { owner, token };
    owner.store.publish(token, latest.current);
    const timer = setInterval(() => owner.store.tick(token), 1000);
    return () => {
      clearInterval(timer);
      owner.store.release(token);
      if (lease.current?.owner === owner) lease.current = null;
    };
  }, [owner]);

  const snapshot = useSyncExternalStore(store?.subscribe ?? subscribeNothing, store?.getSnapshot ?? noSnapshot, noSnapshot);
  return {
    snapshot: owner && snapshot?.owner === owner.key ? snapshot : null,
    setEnabled(enabled: boolean) {
      if (owner && current.current === owner && lease.current?.owner === owner) owner.store.setEnabled(lease.current.token, enabled);
    },
    dismiss() {
      if (owner && current.current === owner && lease.current?.owner === owner) owner.store.dismiss(lease.current.token);
    },
  };
}
