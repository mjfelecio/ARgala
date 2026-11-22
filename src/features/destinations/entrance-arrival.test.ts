import { expect, it } from 'vitest';
import { distanceMeters } from '@/features/location/geo';
import { destinationSchema } from './catalog';
import { EntranceArrivalStore, entranceTarget } from './entrance-arrival';
import type { ArrivalInput } from './proximity';

const point = { latitude: 0, longitude: 0 };
const destination = destinationSchema.parse({
  id: 'D01', provisionalName: 'Synthetic site', center: { latitude: 1, longitude: 1 }, centerApprovalReference: 'Display only',
  routeEntrance: point, routeEntranceApprovalReference: 'Approved test entrance',
});
const target = entranceTarget(destination)!;
const sample = (timestamp: number, meters = 0, accuracy: number | null = 5): ArrivalInput => ({
  running: true, watcherStatus: 'ready', sample: { timestamp, accuracy, position: { latitude: meters / 6371008.8 * 180 / Math.PI, longitude: 0 } },
});

it('takes the cited directions entrance independently of center, geometry and the hidden pilot', () => {
  expect(target).toEqual({ id: 'D01', point });
  expect(entranceTarget({ ...destination, routeEntranceApprovalReference: undefined })).toBeNull();
  expect(entranceTarget({ ...destination, routeEntrance: undefined })).toBeNull();
  expect(entranceTarget({ ...destination, id: 'pilot-aclc' })).toBeNull();
});

it('shows distance from a fresh watcher and requires two distinct fixes before notifying', () => {
  const store = new EntranceArrivalStore();
  const lease = store.acquire(target, 10000);
  store.setEnabled(lease, true, 10000);
  const publish = (time: number, meters = 0, accuracy: number | null = 5) => store.publish(lease, sample(time, meters, accuracy), time);
  publish(10000, 25, 20);
  expect(store.getSnapshot()).toMatchObject({ status: 'distance', distanceMeters: 25, showNotice: false });
  publish(13000, 10);
  expect(store.getSnapshot()).toMatchObject({ status: 'checking', showNotice: false });
  store.tick(lease, 15999);
  expect(store.getSnapshot()?.showNotice).toBe(false);
  publish(15999, 10);
  expect(store.getSnapshot()?.showNotice).toBe(false);
  publish(16000, 10);
  expect(store.getSnapshot()).toMatchObject({ status: 'reached', showNotice: true });
});

it.each([[19.99, true], [20, true], [20.01, false]])(
  'evaluates the raw %s m distance with a fix reporting 50 m accuracy',
  (meters, reached) => {
    const store = new EntranceArrivalStore();
    const lease = store.acquire(target, 10000);
    store.setEnabled(lease, true, 10000);
    const first = sample(10000, meters, 50);
    expect(distanceMeters(point, first.sample!.position)).toBe(meters);
    store.publish(lease, first, 10000);
    store.publish(lease, sample(13000, meters, 50), 13000);
    expect(store.getSnapshot()).toMatchObject({ distanceMeters: 20, showNotice: reached });
  },
);

it('requires consent and deduplicates an approach across screen, selection, permission and lifecycle gaps', () => {
  const store = new EntranceArrivalStore();
  const map = store.acquire(target, 10000);
  for (const time of [10000, 13000]) store.publish(map, sample(time), time);
  expect(store.getSnapshot()).toMatchObject({ enabled: false, status: 'reached', showNotice: false });
  store.setEnabled(map, true, 13000);
  expect(store.getSnapshot()?.showNotice).toBe(true);
  store.dismiss(map);
  expect(store.getSnapshot()?.showNotice).toBe(false);
  store.release(map);
  const other = store.acquire({ ...target, id: 'D03' }, 13000);
  expect(store.getSnapshot()?.enabled).toBe(false);
  const directions = store.acquire(target, 14000);
  store.release(other);
  store.setEnabled(map, false, 14000);
  expect(store.getSnapshot()?.enabled).toBe(true);
  store.publish(directions, sample(13000), 14000);
  expect(store.getSnapshot()).toMatchObject({ status: 'uncertain', showNotice: false });
  for (const time of [16000, 19000]) store.publish(directions, sample(time), time);
  expect(store.getSnapshot()).toMatchObject({ status: 'reached', showNotice: false });
  store.publish(directions, { ...sample(22000), watcherStatus: 'error' }, 22000);
  for (const time of [25000, 28000]) store.publish(directions, sample(time), time);
  expect(store.getSnapshot()).toMatchObject({ status: 'reached', showNotice: false });
});

it('rearms only after a corroborated meaningful exit', () => {
  const store = new EntranceArrivalStore();
  const lease = store.acquire(target, 10000);
  store.setEnabled(lease, true, 10000);
  const publish = (time: number, meters: number) => store.publish(lease, sample(time, meters), time);
  publish(10000, 0);
  publish(13000, 0);
  expect(store.getSnapshot()?.showNotice).toBe(true);
  publish(16000, 50);
  publish(19000, 50);
  publish(22000, 0);
  publish(25000, 0);
  expect(store.getSnapshot()?.showNotice).toBe(false);
  publish(31000, 75);
  publish(34000, 75);
  publish(40000, 0);
  publish(43000, 0);
  expect(store.getSnapshot()?.showNotice).toBe(true);
});

it('expires stale evidence and rejects invalid or implausible watcher fixes', () => {
  const store = new EntranceArrivalStore();
  const lease = store.acquire(target, 10000);
  store.setEnabled(lease, true, 10000);
  const publish = (time: number, meters: number, accuracy: number | null = 5) => store.publish(lease, sample(time, meters, accuracy), time);
  publish(10000, 200);
  publish(13000, 0);
  expect(store.getSnapshot()).toMatchObject({ distanceMeters: null, status: 'uncertain' });
  publish(16000, 0, null);
  publish(19000, 0, 51);
  expect(store.getSnapshot()).toMatchObject({ distanceMeters: null, status: 'uncertain' });
  publish(22000, 0);
  publish(25000, 0);
  expect(store.getSnapshot()?.showNotice).toBe(true);
  store.tick(lease, 35001);
  expect(store.getSnapshot()).toMatchObject({ distanceMeters: null, status: 'uncertain', showNotice: false });
});
