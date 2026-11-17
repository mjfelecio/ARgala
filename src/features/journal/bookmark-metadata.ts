import { z } from 'zod';
import { coordinateSchema } from '../../../supabase/functions/_shared/contracts';
import { bookmarkKey, type Journal } from './model';

export const BOOKMARK_PIN_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
// Share the app's existing text-input budget; metadata also shares the journal's 1 MiB ceiling.
export const BOOKMARK_TEXT_MAX_LENGTH = 256;
export const bookmarkPinSchema = z.object({ coordinates: coordinateSchema, capturedAt: z.number().int().positive().safe() }).strict();
export const bookmarkMetadataSchema = z.object({
  label: z.string().trim().min(1).max(BOOKMARK_TEXT_MAX_LENGTH).optional(),
  note: z.string().trim().min(1).max(BOOKMARK_TEXT_MAX_LENGTH).optional(),
  pin: bookmarkPinSchema.optional(),
}).strict();
/** User-authored text and an expiring local pin; never a saved provider response. */
export type BookmarkMetadata = z.infer<typeof bookmarkMetadataSchema>;
export type BookmarkMetadataMap = Record<string, BookmarkMetadata>;
export function validBookmarkPin(metadata: BookmarkMetadata | undefined, now = Date.now()) {
  const parsed = bookmarkPinSchema.safeParse(metadata?.pin);
  if (!parsed.success || parsed.data.capturedAt > now || now - parsed.data.capturedAt >= BOOKMARK_PIN_MAX_AGE_MS) return undefined;
  return parsed.data;
}
export function cleanBookmarkMetadata(journal: Journal, metadata: BookmarkMetadataMap, now = Date.now()): BookmarkMetadataMap {
  const clean: BookmarkMetadataMap = {};
  for (const reference of journal.bookmarks) {
    const key = bookmarkKey(reference); const value = metadata[key]; if (!value) continue;
    const { pin: _pin, ...text } = value; const pin = validBookmarkPin(value, now);
    clean[key] = { ...text, ...(pin ? { pin } : {}) };
  }
  return clean;
}
export function mergeBookmarkMetadata(account: BookmarkMetadataMap, guest: BookmarkMetadataMap): BookmarkMetadataMap {
  const merged = { ...account };
  for (const [key, value] of Object.entries(guest)) {
    const own = merged[key]; const ownPin = validBookmarkPin(own); const guestPin = validBookmarkPin(value);
    const pin = guestPin && (!ownPin || guestPin.capturedAt > ownPin.capturedAt) ? guestPin : ownPin;
    const label=own?.label??value.label;const note=own?.note??value.note;
    merged[key] = {...(label?{label}:{}),...(note?{note}:{}),...(pin?{pin}:{})};
  }
  return merged;
}
