import { expect, it } from 'vitest';
import { destinationSchema, getDestination, listDestinations, listFeaturedDestinations } from './catalog';
import { approvedArContent, activationPolicy } from './ar-content';
const approved = (value: string) => ({ value, approvalReference: 'synthetic test approval' });
const base = { id: 'pilot-aclc', provisionalName: 'Synthetic pilot' };
const ar = { schemaVersion: 1, contentVersion: 'test-1', tiles: [
  { id: 'overview', role: 'overview', title: { en: approved('Test title') }, body: { en: approved('Test body') } },
  { id: 'history', role: 'history', title: { en: approved('Test history') }, body: { en: approved('Test history body') } },
] };
it('keeps the pilot separate from the nine provisional launch labels and contains no invented authority', () => {
  expect(listDestinations()).toHaveLength(9);
  expect(listFeaturedDestinations().map(d => d.id)).toEqual([...listDestinations().map(d => d.id), 'pilot-aclc']);
  const pilot = getDestination('pilot-aclc');
  expect(pilot).not.toBeNull();
  for (const key of ['copy', 'media']) expect(pilot).not.toHaveProperty(key);
  expect(pilot?.center).toEqual({ latitude: 11.022973, longitude: 124.6054992 });
  expect(pilot?.routeEntrance).toEqual({ latitude: 11.022845368322905, longitude: 124.60452610504089 });
  expect(activationPolicy(pilot)).toMatchObject({ point: pilot?.center, radiusMeters: 50 });
  expect(pilot?.ar?.providerAssociation).toBeUndefined();
  expect(approvedArContent(pilot, 'en')).toEqual([]);
});
it('requires independent activation and radius approvals and never substitutes a display/entrance point', () => {
  const point = { latitude: 0, longitude: 0 };
  expect(activationPolicy(destinationSchema.parse({ ...base, center: point, centerApprovalReference: 'test' }))).toBeNull();
  const activation = { point, pointApprovalReference: 'test', radiusMeters: 50, radiusApprovalReference: 'test' };
  expect(destinationSchema.safeParse({ ...base, ar: { ...ar, activation } }).success).toBe(true);
  for (const key of ['pointApprovalReference', 'radiusApprovalReference']) {
    expect(destinationSchema.safeParse({ ...base, ar: { ...ar, activation: { ...activation, [key]: undefined } } }).success).toBe(false);
  }
  expect(destinationSchema.safeParse({ ...base, ar: { ...ar, providerAssociation: { providerId: 'test-id' } } }).success).toBe(false);
});
it('validates versions, stable tile identity, unique roles and every translated field approval', () => {
  expect(destinationSchema.safeParse({ ...base, ar }).success).toBe(true);
  for (const invalid of [
    { ...ar, schemaVersion: 2 }, { ...ar, contentVersion: '' },
    { ...ar, tiles: [ar.tiles[0], ar.tiles[0]] },
    { ...ar, tiles: [ar.tiles[0], { ...ar.tiles[0], id: 'duplicate-role' }] },
    { ...ar, tiles: [{ ...ar.tiles[0], body: { ko: { value: 'Test' } } }] },
    { ...ar, tiles: [{ ...ar.tiles[0], angle: 123 }] },
  ]) expect(destinationSchema.safeParse({ ...base, ar: invalid }).success).toBe(false);
});
it('falls back per field and omits categories without any approved body', () => {
  const destination = destinationSchema.parse({ ...base, ar: { ...ar, tiles: [
    { ...ar.tiles[0], title: { en: approved('Test title'), ja: approved('見出し') } },
    { id: 'missing', title: { en: approved('No body') }, body: {} },
  ] } });
  expect(approvedArContent(destination, 'ja')).toEqual([
    { id: 'overview', role: 'overview', title: '見出し', body: 'Test body', englishFallback: true },
  ]);
});
