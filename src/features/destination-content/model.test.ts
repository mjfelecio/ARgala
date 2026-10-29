import { expect, it } from 'vitest';
import { getDestination } from '@/features/destinations/catalog';
import { contentManifestSchema, resolveContent } from './model';

import { manifest } from './test-fixtures';

it('resolves approved localized text without changing geometry, provider association, media or the bundle', () => {
  const base = getDestination('pilot-aclc')!;
  const update = contentManifestSchema.parse(manifest());
  const next = resolveContent(base, update)!;
  expect(next.ar?.tiles[0].body.ja?.value).toBe('Synthetic test ja');
  expect(next.center).toEqual(base.center);
  expect(next.routeEntrance).toEqual(base.routeEntrance);
  expect(next.ar?.activation).toEqual(base.ar?.activation);
  expect(next.ar?.providerAssociation).toEqual(base.ar?.providerAssociation);
  expect(next.media).toEqual(base.media);
  expect(base.ar?.tiles).toEqual([]);
  expect(resolveContent(null, update)).toBeNull();
  expect(resolveContent(base, null)).toBe(base);
  expect(resolveContent(getDestination('D01'), update)).toBe(getDestination('D01'));
});
it('rejects drafts, wrong versions, duplicate IDs, unknown IDs, missing locales, oversized text and unapproved fields', () => {
  const valid = manifest();
  const tile = valid.destinations[0].tiles[0];
  for (const value of [
    { ...valid, approvalStatus: 'draft' }, { ...valid, schemaVersion: 2 }, { ...valid, catalogVersion: 2 },
    { ...valid, revision: 0 }, { ...valid, revision: Number.MAX_SAFE_INTEGER + 1 },
    { ...valid, destinations: [...valid.destinations, ...valid.destinations] },
    { ...valid, destinations: [{ ...valid.destinations[0], id: 'unrelated-poi' }] },
    { ...valid, destinations: [{ ...valid.destinations[0], tiles: [{ ...tile, body: { en: tile.body.en } }] }] },
    { ...valid, destinations: [{ ...valid.destinations[0], tiles: [{ ...tile, title: { ...tile.title, en: { value: 'x'.repeat(201), approvalReference: 'test' } } }] }] },
    { ...valid, destinations: [{ ...valid.destinations[0], tiles: [tile, tile] }] },
    { ...valid, destinations: [{ ...valid.destinations[0], center: { latitude: 1, longitude: 1 } }] },
    { ...valid, destinations: [{ ...valid.destinations[0], media: [{ source: 1 }] }] },
    { ...valid, destinations: [{ ...valid.destinations[0], tiles: [{ ...tile, role: undefined }] }] },
  ]) expect(contentManifestSchema.safeParse(value).success).toBe(false);
});

it('accepts an empty approved withdrawal snapshot', () => {
  expect(contentManifestSchema.parse({ ...manifest(2), destinations: [] }).destinations).toEqual([]);
});

it('retains only matching reviewed bundle image bindings through text-only updates without changing captured content', async () => {
  const { destinationSchema } = await import('@/features/destinations/catalog');
  const update = contentManifestSchema.parse(manifest());
  const tile = update.destinations[0].tiles[0];
  const base = destinationSchema.parse({ ...getDestination('pilot-aclc'),
    media: [{ id: 'synthetic-photo', source: 1, credit: 'Synthetic credit', rightsReference: 'test', approvalReference: 'test', alt: { en: { value: 'Synthetic image', approvalReference: 'test' } } }],
    ar: { ...getDestination('pilot-aclc')!.ar, tiles: [{ ...tile, body: { en: { value: 'Captured text', approvalReference: 'test' } }, mediaIds: ['synthetic-photo'] }] },
  });
  const before = JSON.stringify(base);
  const next = resolveContent(base, update)!;
  expect(next.ar?.tiles[0]).toHaveProperty('mediaIds', ['synthetic-photo']);
  expect(next.ar?.tiles[0].body.en?.value).toBe('Synthetic test en');
  expect(JSON.stringify(base)).toBe(before);
  const renamed = contentManifestSchema.parse({ ...update, destinations: [{ ...update.destinations[0], tiles: [{ ...tile, id: 'new-tile' }] }] });
  expect(resolveContent(base, renamed)!.ar?.tiles[0]).not.toHaveProperty('mediaIds');
  expect(contentManifestSchema.safeParse({ ...update, destinations: [{ ...update.destinations[0], tiles: [{ ...tile, mediaIds: ['synthetic-photo'] }] }] }).success).toBe(false);
});
