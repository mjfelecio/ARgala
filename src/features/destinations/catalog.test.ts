import { expect, it } from 'vitest';
import { destinationSchema, getDestination, listDestinations, localizedContent } from './catalog';

it('contains exactly the nine provisional SRS labels in stable order without unverified facts', () => {
  const all = listDestinations();
  expect(all.map(d => d.id)).toEqual(['D01', 'D02', 'D03', 'D04', 'D05', 'D06', 'D07', 'D08', 'D09']);
  expect(all.map(d => d.provisionalName)).toEqual(['Lake Danao Natural Park', 'Lake Kasudsuran', 'Lake Janagdan', 'Ormoc Mangrove Eco Park', 'Pineapple Farm', 'Leyte Golf and Country Club', 'Alto Peak', 'Heaven’s Peak', 'Sabin Resort Hotel']);
  for (const d of all) {
    expect(destinationSchema.safeParse(d).success).toBe(true);
    for (const field of ['center', 'routeEntrance', 'verifiedName', 'copy', 'media']) expect(d).not.toHaveProperty(field);
    expect(getDestination(d.id)).toEqual(d);
  }
});
it.each([null, undefined, '', 'D10', 'd01', ['D01'], '../D01'])('rejects unknown ID %j', id => expect(getDestination(id)).toBeNull());
const base = { id: 'D01', provisionalName: 'Synthetic test destination' };
it.each([{ latitude: NaN, longitude: 0 }, { latitude: Infinity, longitude: 0 }, { latitude: 91, longitude: 0 }, { latitude: 0, longitude: -181 }])('rejects invalid coordinates %j', center => {
  expect(destinationSchema.safeParse({ ...base, center, centerApprovalReference: 'test-only' }).success).toBe(false);
});
it('requires independent approvals for centers, entrances, display names and every copy field', () => {
  expect(destinationSchema.safeParse({ ...base, center: { latitude: 0, longitude: 0 } }).success).toBe(false);
  expect(destinationSchema.safeParse({ ...base, routeEntrance: { latitude: 0, longitude: 0 }, centerApprovalReference: 'test' }).success).toBe(false);
  expect(destinationSchema.safeParse({ ...base, verifiedName: { value: 'Name' } }).success).toBe(false);
  expect(destinationSchema.safeParse({ ...base, copy: { en: { overview: { value: 'Test', approvalReference: 'test' }, highlights: { value: ['Test'] } } } }).success).toBe(false);
  expect(destinationSchema.safeParse({ ...base, center: { latitude: 0, longitude: 0 }, centerApprovalReference: 'test' }).success).toBe(true);
});
it('requires bundled media, rights, credit, descriptive alt and approval', () => {
  const media = { id: 'test', source: 1, credit: 'Test credit', rightsReference: 'Test rights', approvalReference: 'Test approval', alt: { en: { value: 'Synthetic test image', approvalReference: 'Test alt approval' } } };
  expect(destinationSchema.safeParse({ ...base, media: [media] }).success).toBe(true);
  for (const field of ['source', 'credit', 'rightsReference', 'approvalReference', 'alt']) expect(destinationSchema.safeParse({ ...base, media: [{ ...media, [field]: undefined }] }).success).toBe(false);
  expect(destinationSchema.safeParse({ ...base, media: [{ ...media, source: { uri: 'https://example.com/photo' } }] }).success).toBe(false);
});
it('falls back per approved field to English, marking only an actual fallback', () => {
  const content = { en: { value: 'Approved English', approvalReference: 'test' }, ja: { value: '日本語', approvalReference: 'test' } };
  expect(localizedContent(content, 'ko')).toEqual({ value: 'Approved English', englishFallback: true });
  expect(localizedContent(content, 'ja')).toEqual({ value: '日本語', englishFallback: false });
  expect(localizedContent(content, 'en')).toEqual({ value: 'Approved English', englishFallback: false });
  expect(localizedContent(undefined, 'ko')).toBeNull();
  expect(localizedContent({ ja: content.ja }, 'ko')).toBeNull();
});

it('binds AR galleries only to unique approved media IDs owned by this destination', () => {
  const media = { id: 'synthetic-photo', source: 1, credit: 'Synthetic credit', rightsReference: 'test rights', approvalReference: 'test only', alt: { en: { value: 'Synthetic image', approvalReference: 'test only' } } };
  const tile = { id: 'history', title: {}, body: {}, mediaIds: [media.id] };
  const input = { ...base, media: [media], ar: { schemaVersion: 1, contentVersion: 'test', tiles: [tile] } };
  expect(destinationSchema.parse(input).ar?.tiles[0]).toHaveProperty('mediaIds', [media.id]);
  for (const mediaIds of [[media.id, media.id], ['unknown'], [1], ['https://example.com/image']]) {
    expect(destinationSchema.safeParse({ ...input, ar: { ...input.ar, tiles: [{ ...tile, mediaIds }] } }).success).toBe(false);
  }
  expect(destinationSchema.safeParse({ ...input, media: [] }).success).toBe(false);
  expect(destinationSchema.safeParse({ ...input, ar: { ...input.ar, tiles: [{ ...tile, media: [media] }] } }).success).toBe(false);
});
