import { expect, it } from 'vitest';
import { DestinationProximity, type ArrivalInput } from './proximity';
const point = { latitude: 0, longitude: 0 }; // Synthetic geometry, never ACLC coordinates.
const policy = { point, pointApprovalReference: 'test', radiusMeters: 50, radiusApprovalReference: 'test' };
const input = (timestamp: number, meters = 0, accuracy: number | null = 5): ArrivalInput => ({
  running: true, watcherStatus: 'ready', sample: { position: { latitude: meters / 111195, longitude: 0 }, accuracy, timestamp },
});
function admitted() {
  const model = new DestinationProximity('pilot-aclc', policy);
  for (const time of [10000, 13000, 16000]) model.update(input(time), time);
  return model;
}
it('requires three distinct continuous readings spanning six seconds', () => {
  const model = new DestinationProximity('pilot-aclc', policy);
  expect(model.update(input(10000), 10000).eligible).toBe(false);
  expect(model.update(input(13000), 13000).eligible).toBe(false);
  expect(model.update(input(16000), 16000).eligible).toBe(true);
});
it('does not count duplicate samples or a burst with insufficient elapsed time', () => {
  const model = new DestinationProximity('pilot-aclc', policy);
  for (const time of [10000, 10000, 11000, 12000]) expect(model.update(input(time), time).eligible).toBe(false);
  expect(model.update(input(16000), 16000).eligible).toBe(true);
});
it.each([
  { ...input(16000), running: false },
  { ...input(16000), watcherStatus: 'error' as const },
  { ...input(16000), sample: null }, input(16000, 0, null), input(16000, 0, -1), input(16000, 0, 21),
  input(16000, 0, NaN), input(27001), input(5999), input(16000, 46, 5),
])('immediately revokes new admission on uncertain location %j', bad => {
  expect(admitted().update(bad, 26000).eligible).toBe(false);
});
it('expires at independent clock ticks even with no sensor events', () => {
  const model = admitted();
  expect(model.update(input(16000), 26000).eligible).toBe(true);
  expect(model.update(input(16000), 26001).eligible).toBe(false);
  expect(model.update(input(16000), 26002).eligible).toBe(false);
});
it('rejects backwards samples without letting the old stream reacquire', () => {
  const model = admitted();
  expect(model.update(input(15000), 17000).eligible).toBe(false);
  expect(model.update(input(16000), 17000).eligible).toBe(false);
  expect(model.update(input(18000), 18000).eligible).toBe(false);
  expect(model.update(input(21000), 21000).eligible).toBe(false);
  expect(model.update(input(24000), 24000).eligible).toBe(true);
});
it('rejects an implausible jump instead of admitting a teleported near fix', () => {
  const model = new DestinationProximity('pilot-aclc', policy);
  model.update(input(10000, 400), 10000);
  expect(model.update(input(13000), 13000).eligible).toBe(false);
  expect(model.update(input(16000), 16000).eligible).toBe(false);
  expect(model.update(input(19000), 19000).eligible).toBe(false);
  expect(model.update(input(22000), 22000).eligible).toBe(true);
});
it('dedupes milestones and keeps dismissal through jitter, but resets after corroborated exit', () => {
  const model = admitted();
  expect(model.snapshot().milestone).toBe('arrived');
  model.dismiss();
  expect(model.update(input(19000), 19000).showInvitation).toBe(false);
  expect(model.update(input(22000, 46), 22000).eligible).toBe(false);
  expect(model.update(input(25000), 25000).showInvitation).toBe(false);
  for (const time of [35000, 38000, 41000]) model.update(input(time, 75), time);
  for (const time of [51000, 54000, 57000]) model.update(input(time), time);
  expect(model.snapshot().showInvitation).toBe(true);
});
it('clears all progress on selection change and never uses unknown activation metadata', () => {
  expect(new DestinationProximity('D01', policy).update(input(16000), 16000).eligible).toBe(false);
  expect(new DestinationProximity('pilot-aclc', null).update(input(16000), 16000).status).toBe('unavailable');
});
it('does not corroborate across a gap with no fresh stream', () => {
  const model = new DestinationProximity('pilot-aclc', policy);
  model.update(input(10000), 10000);
  model.update(input(13000), 13000);
  expect(model.update(input(30000), 30000).eligible).toBe(false);
});
