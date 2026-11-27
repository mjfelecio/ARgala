import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ArAdmissionStore } from './admission-store';
import { syntheticApprovedDestination, syntheticArrivalPoint, syntheticFeaturedGeofence } from '@/features/destinations/ar-geofence-fixtures';
import { getDestination } from '@/features/destinations/catalog';
import type { ArrivalInput } from '@/features/destinations/proximity';
import { contentManifestSchema, resolveContent } from '@/features/destination-content/model';
import { manifest } from '@/features/destination-content/test-fixtures';
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
it('captures an approved content revision per entry without granting geographic authority', () => {
 let update = contentManifestSchema.parse(manifest());
 const store = new ArAdmissionStore('owner', id => resolveContent(getDestination(id), update));
 store.select('pilot-aclc'); const initial = store.acquire('pilot-aclc')!;
 store.publish(initial, { running: true, watcherStatus: 'pending', sample: null });
 expect(store.begin(initial, 'pilot-aclc', 'approved', 'en')).toBeNull();
 const { lease } = ready(store);
 const first = store.take(store.begin(lease, 'pilot-aclc', 'approved', 'en'), 'pilot-aclc')!;
 expect(first.destination.ar?.contentVersion).toBe('test-1');
 update = contentManifestSchema.parse(manifest(2));
 expect(first.destination.ar?.contentVersion).toBe('test-1');
 expect(first.authorizeMount()).toBe(true);
 const second = store.take(store.begin(lease, 'pilot-aclc', 'approved', 'en'), 'pilot-aclc')!;
 expect(second.destination.ar?.contentVersion).toBe('test-2');
 expect(first.authorizeMount()).toBe(false);
 update = contentManifestSchema.parse({ ...manifest(3), destinations: [] });
 expect(second.destination.ar?.contentVersion).toBe('test-2');
 expect(store.begin(lease, 'pilot-aclc', 'approved', 'en')).toBeNull();
});

it('rechecks the latest raw approved-radius reading at pending mount and tracking establishment', () => {
 const store = new ArAdmissionStore('owner'); store.select('pilot-aclc'); const lease = store.acquire('pilot-aclc')!;
 const reading = (timestamp: number, meters: number): ArrivalInput => ({ running: true, watcherStatus: 'ready', sample: {
  position: { latitude: point.latitude + meters / 111195, longitude: point.longitude }, accuracy: 50, timestamp,
 } });
 for (const time of [10000, 13000]) { vi.mocked(Date.now).mockReturnValue(time); store.publish(lease, reading(time, 45)); }
 const entry = store.take(store.begin(lease, 'pilot-aclc', 'draft', 'en'), 'pilot-aclc')!;
 expect(entry).not.toBeNull(); expect(entry.authorizeMount()).toBe(true);
 vi.mocked(Date.now).mockReturnValue(16000); store.publish(lease, reading(16000, 51));
 // The same callback is used immediately before native mount and first tracking-ready.
 expect(entry.authorizeMount()).toBe(false); expect(store.getSnapshot()?.eligible).toBe(false);
});

it('claims the unlock once per principal, destination and corroborated visit', () => {
 const featured = syntheticApprovedDestination();
 let available = false;
 const unavailable = { ...featured, ar: undefined };
 const store = new ArAdmissionStore('owner', id => id === 'D01' ? available ? featured : unavailable : getDestination(id), syntheticFeaturedGeofence);
 const report = (lease: number, timestamp: number, longitude = 0) => {
  vi.mocked(Date.now).mockReturnValue(timestamp);
  store.publish(lease, { running: true, watcherStatus: 'ready', sample: { position: { ...syntheticArrivalPoint, longitude }, accuracy: 5, timestamp } });
 };
 store.select('D01');
 const explore = store.acquire('D01')!;
 report(explore, 10000);
 expect(store.claimUnlock(explore, 'D01', 'en')).toBe(false);
 report(explore, 13000);
 expect(store.claimUnlock(explore, 'D01', 'en')).toBe(false);
 available = true;
 expect(store.claimUnlock(explore, 'D01', 'en')).toBe(true);
 store.release(explore);
 store.select('D02');
 store.select('D01');
 const directions = store.acquire('D01')!;
 report(directions, 16000);
 report(directions, 19000);
 expect(store.getSnapshot()?.eligible).toBe(true);
 expect(store.claimUnlock(explore, 'D01', 'en')).toBe(false);
 expect(store.claimUnlock(directions, 'D01', 'en')).toBe(false);
 report(directions, 22000, 0.00025);
 expect(store.begin(directions, 'D01', 'approved', 'en')).toBeNull();
 report(directions, 25000);
 report(directions, 28000);
 expect(store.claimUnlock(directions, 'D01', 'en')).toBe(false);
 report(directions, 31000, 0.0004);
 report(directions, 34000, 0.0004);
 report(directions, 37000);
 report(directions, 40000);
 expect(store.claimUnlock(directions, 'D01', 'en')).toBe(true);
 expect(store.begin(directions, 'D01', 'approved', 'en')).toBeTypeOf('string');
 store.close();
 expect(store.claimUnlock(directions, 'D01', 'en')).toBe(false);
});

it('reports the live admission decision only to the current guarded lease', () => {
  vi.stubEnv('EXPO_PUBLIC_VIRO_SPIKE', '1');
  const store = new ArAdmissionStore('guest');
  store.select('D10');
  const lease = store.acquire('D10')!;
  const position = { latitude: 0, longitude: 0 };
  vi.mocked(Date.now).mockReturnValue(12000);
  store.publish(lease, { running: true, watcherStatus: 'ready', sample: { position, timestamp: 12000, accuracy: 51 } });
  expect(store.fieldEvidence(lease)).toMatchObject({ decision: 'accuracy', accuracy: 51, ageMs: 0, count: 0 });
  store.publish(lease, { running: true, watcherStatus: 'ready', sample: { position, timestamp: 12000, accuracy: 8 } });
  expect(store.fieldEvidence(lease)).toMatchObject({ decision: 'outside', contained: false, count: 0 });
  store.tick();
  expect(store.fieldEvidence(lease)?.repeated).toBe(true);
  vi.mocked(Date.now).mockReturnValue(22001);
  store.tick();
  expect(store.fieldEvidence(lease)).toMatchObject({ decision: 'stale-fix', contained: null, ageMs: 10001 });
  vi.stubEnv('EXPO_PUBLIC_VIRO_SPIKE', '0');
  expect(store.fieldEvidence(lease)).toBeNull();
  vi.stubEnv('EXPO_PUBLIC_VIRO_SPIKE', '1');
  vi.stubGlobal('__DEV__', false);
  expect(store.fieldEvidence(lease)).toBeNull();
  vi.stubGlobal('__DEV__', true);
  store.release(lease);
  expect(store.fieldEvidence(lease)).toBeNull();
  vi.unstubAllGlobals();
});
