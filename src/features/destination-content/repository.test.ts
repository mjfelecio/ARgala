import { expect, it, vi } from 'vitest';
import { ContentRepository } from './repository';
import { manifest } from './test-fixtures';

function setup() {
  const disk = new Map<string, string>();
  const storage = { getItem: vi.fn(async (key: string) => disk.get(key) ?? null), setItem: vi.fn(async (key: string, value: string) => { disk.set(key, value); }) };
  return { disk, storage, repository: new ContentRepository(storage, 'https://synthetic.example') };
}
it('persists only validated curated text and restores it across repository restart', async () => {
  const { repository, storage, disk } = setup();
  expect(await repository.open()).toBeNull();
  expect((await repository.install(manifest(), () => true)).revision).toBe(1);
  expect((await new ContentRepository(storage, 'https://synthetic.example').open())?.revision).toBe(1);
  expect(await new ContentRepository(storage, 'https://other.example').open()).toBeNull();
  expect([...disk.values()].join()).not.toMatch(/latitude|longitude|providerId|accessToken|source/);
});
it('serializes updates, prevents rollback and rejects same-revision replacement', async () => {
  const { repository } = setup();
  await Promise.all([repository.install(manifest(3), () => true), repository.install(manifest(2), () => true)]);
  expect((await repository.open())?.revision).toBe(3);
  await expect(repository.install({ ...manifest(3), destinations: [] }, () => true)).rejects.toThrow();
  expect((await repository.install(manifest(3), () => true)).revision).toBe(3);
  expect((await repository.install({ ...manifest(4), destinations: [] }, () => true)).destinations).toEqual([]);
});
it('keeps previous data on invalid input, failed writes and retired owners', async () => {
  const { repository, storage } = setup();
  await repository.install(manifest(), () => true);
  await expect(repository.install({ ...manifest(2), approvalStatus: 'draft' }, () => true)).rejects.toThrow();
  storage.setItem.mockRejectedValueOnce(new Error('private storage error'));
  await expect(repository.install(manifest(2), () => true)).rejects.toThrow();
  await expect(repository.install(manifest(3), () => false)).rejects.toThrow();
  expect((await repository.open())?.revision).toBe(1);
});
it('falls back from corrupt/oversized cache, permits trusted repair and does not overwrite failed reads', async () => {
  const { repository, disk, storage } = setup();
  await repository.install(manifest(), () => true);
  const key = [...disk.keys()][0];
  for (const invalid of ['not-json', 'x'.repeat(524289), JSON.stringify({ ...manifest(), schemaVersion: 999 })]) {
    disk.set(key, invalid); expect(await repository.open()).toBeNull();
  }
  await repository.install(manifest(2), () => true);
  storage.getItem.mockRejectedValueOnce(new Error('disk read failure'));
  await expect(repository.install(manifest(3), () => true)).rejects.toThrow();
  expect((await repository.open())?.revision).toBe(2);
});
