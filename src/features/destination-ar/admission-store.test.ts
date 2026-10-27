import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ArAdmissionStore } from './admission-store';
import { getDestination } from '@/features/destinations/catalog';
import type { ArrivalInput } from '@/features/destinations/proximity';
const point = getDestination('pilot-aclc')!.center!;
const sample = (timestamp: number): ArrivalInput => ({ running: true, watcherStatus: 'ready', sample: { position: point, accuracy: 5, timestamp } });
beforeEach(() => { Object.assign(globalThis, { __DEV__: true }); vi.stubEnv('EXPO_PUBLIC_VIRO_SPIKE', '1'); vi.spyOn(Date, 'now').mockReturnValue(10000); });
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });
function ready(store = new ArAdmissionStore('owner')) {
 store.select('pilot-aclc'); const lease = store.acquire('pilot-aclc')!;
 for (const time of [10000, 13000, 16000]) { vi.mocked(Date.now).mockReturnValue(time); store.publish(lease, sample(time)); }
 return { store, lease };
}
it('claims a single pending handoff, then requires fresh route-owned evidence before first mount', () => {
 const { store, lease } = ready(); const handle = store.begin(lease, 'pilot-aclc', 'draft', 'en');
 const entry = store.take(handle, 'pilot-aclc');
 expect(entry?.identity).toMatchObject({ destinationId: 'pilot-aclc', principalId: 'owner', provenance: 'development' });
 expect(store.take(handle, 'pilot-aclc')).toBeNull();
 store.release(lease); expect(entry?.authorizeMount()).toBe(false);
 const routeLease = store.acquire('pilot-aclc')!;
 for (const time of [19000, 22000, 25000]) { vi.mocked(Date.now).mockReturnValue(time); store.publish(routeLease, sample(time)); }
 expect(entry?.authorizeMount()).toBe(true);
});
it('ignores retired producers and cannot launch from a hidden map lease', () => {
 const { store, lease } = ready(); const replacement = store.acquire('pilot-aclc')!;
 store.publish(lease, sample(16000));
 expect(store.begin(lease, 'pilot-aclc', 'draft', 'en')).toBeNull();
 store.release(lease); expect(store.currentLease()).toBe(replacement);
});
it.each(['selection', 'principal', 'exit'] as const)('retires pending first mounts on %s change', reason => {
 const { store, lease } = ready(); const entry = store.take(store.begin(lease, 'pilot-aclc', 'draft', 'en'), 'pilot-aclc')!;
 if (reason === 'selection') store.select('D01'); else if (reason === 'principal') store.close(); else store.endEntry(entry.identity.admissionId);
 expect(entry.authorizeMount()).toBe(false);
});
it('rejects dead/expired handoffs and unapproved production content', () => {
 const { store, lease } = ready();
 expect(store.take('made-up', 'pilot-aclc')).toBeNull();
 expect(store.begin(lease, 'pilot-aclc', 'approved', 'en')).toBeNull();
 const handle = store.begin(lease, 'pilot-aclc', 'draft', 'en');
 vi.mocked(Date.now).mockReturnValue(46000);
 expect(store.take(handle, 'pilot-aclc')).toBeNull();
});
it('never creates draft admission in release or with the opt-in disabled', () => {
 const { store, lease } = ready();
 Object.assign(globalThis, { __DEV__: false }); expect(store.begin(lease, 'pilot-aclc', 'draft', 'en')).toBeNull();
 Object.assign(globalThis, { __DEV__: true }); vi.stubEnv('EXPO_PUBLIC_VIRO_SPIKE', '0'); expect(store.begin(lease, 'pilot-aclc', 'draft', 'en')).toBeNull();
});
it('keeps simulated arrival separate from real GPS evidence and retires it on Exit', () => {
 const store = new ArAdmissionStore('owner'); store.select('pilot-aclc'); const lease = store.acquire('pilot-aclc')!;
 store.publish(lease, { running: true, watcherStatus: 'pending', sample: null });
 const handle = store.beginSimulation(lease, 'pilot-aclc', 'draft', 'en'); const entry = store.take(handle, 'pilot-aclc')!;
 expect(entry.simulated).toBe(true); expect(entry.identity.provenance).toBe('development');
 expect(store.getSnapshot()?.eligible).toBe(false); expect(entry.authorizeMount()).toBe(true);
 store.release(lease); expect(entry.authorizeMount()).toBe(true);
 store.endEntry(entry.identity.admissionId); expect(entry.authorizeMount()).toBe(false);
});
it('never admits simulated arrival in release, including a retained development handle', () => {
 const { store, lease } = ready(); const handle = store.beginSimulation(lease, 'pilot-aclc', 'draft', 'en');
 Object.assign(globalThis, { __DEV__: false });
 expect(store.beginSimulation(lease, 'pilot-aclc', 'draft', 'en')).toBeNull(); expect(store.take(handle, 'pilot-aclc')).toBeNull();
});
it('cannot attach the ACLC research draft to another selected destination', () => {
 const store = new ArAdmissionStore('owner'); store.select('D01'); const lease = store.acquire('D01')!;
 store.publish(lease, { running: true, watcherStatus: 'pending', sample: null });
 expect(store.beginSimulation(lease, 'D01', 'draft', 'en')).toBeNull();
});
