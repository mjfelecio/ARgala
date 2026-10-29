import { z } from 'zod';
import { destinationSchema, featuredDestinationIds, type Destination } from '@/features/destinations/catalog';

export const CONTENT_MAX_BYTES = 524288;
export function utf8Length(value: string) {
  let bytes = 0;
  for (const char of value) {
    const code = char.codePointAt(0)!;
    bytes += code <= 0x7f ? 1 : code <= 0x7ff ? 2 : code <= 0xffff ? 3 : 4;
  }
  return bytes;
}
const reference = z.string().trim().min(1).max(500);
const localized = (max: number) => {
  const approved = z.object({ value: z.string().trim().min(1).max(max), approvalReference: reference }).strict();
  return z.object({ en: approved, ja: approved, ko: approved }).strict();
};
const tile = z.object({
  id: z.string().regex(/^[A-Za-z0-9_-]{1,80}$/), role: z.enum(['overview', 'history']).optional(),
  title: localized(200), body: localized(6000),
}).strict();
const record = z.object({
  id: z.enum(featuredDestinationIds), contentVersion: z.string().trim().min(1).max(80),
  tiles: z.array(tile).min(1).max(12)
    .refine(items => new Set(items.map(item => item.id)).size === items.length)
    .refine(items => items.filter(item => item.role === 'overview').length === 1 && items.filter(item => item.role === 'history').length <= 1),
}).strict();
export const contentManifestSchema = z.object({
  schemaVersion: z.literal(1), catalogVersion: z.literal(1), revision: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  approvalStatus: z.literal('approved'), destinations: z.array(record).max(featuredDestinationIds.length)
    .refine(items => new Set(items.map(item => item.id)).size === items.length),
}).strict().refine(value => utf8Length(JSON.stringify(value)) <= CONTENT_MAX_BYTES).readonly();
export type ContentManifest = z.infer<typeof contentManifestSchema>;

/** Complete text overlay; geometry, provider mappings and licensed bundle assets never come from this protocol. */
export function resolveContent(destination: Destination | null, manifest: ContentManifest | null): Destination | null {
  if (!destination) return null;
  const update = manifest?.destinations.find(item => item.id === destination.id);
  return update ? destinationSchema.parse({ ...destination, ar: {
    ...destination.ar, schemaVersion: 1, contentVersion: update.contentVersion,
    tiles: update.tiles.map(tile => {
      const mediaIds = destination.ar?.tiles.find(bundled => bundled.id === tile.id)?.mediaIds;
      return { ...tile, ...(mediaIds ? { mediaIds } : {}) };
    }),
  } }) : destination;
}
