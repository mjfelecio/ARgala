import { z } from 'zod';
import { detailsRequestSchema } from '../../../supabase/functions/_shared/contracts';
import { featuredDestinationIds, type FeaturedDestinationId } from '@/features/destinations/catalog';
const featuredId = z.enum(featuredDestinationIds);
export const bookmarkSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('google'), id: detailsRequestSchema.shape.providerId }).strict(),
  z.object({ kind: z.literal('featured'), id: featuredId }).strict(),
]);
export type Bookmark = z.infer<typeof bookmarkSchema>;
export const journalSchema = z.object({ version: z.literal(1),
  bookmarks: z.array(bookmarkSchema).max(1000),
  stamps: z.array(z.object({ destinationId: featuredId, visitedAt: z.number().int().positive().safe() }).strict()).max(featuredDestinationIds.length),
}).strict().refine(s => new Set(s.bookmarks.map(bookmarkKey)).size === s.bookmarks.length && new Set(s.stamps.map(x=>x.destinationId)).size === s.stamps.length);
export type Journal = z.infer<typeof journalSchema>;
export const emptyJournal = (): Journal => ({ version: 1, bookmarks: [], stamps: [] });
export const bookmarkKey = (ref: Bookmark) => `${ref.kind}:${ref.id}`;
export function saveBookmark(state: Journal, reference: Bookmark, saved: boolean): Journal {
  const ref=bookmarkSchema.parse(reference); const bookmarks=state.bookmarks.filter(x=>bookmarkKey(x)!==bookmarkKey(ref));
  if(saved) bookmarks.push(ref);
  return journalSchema.parse({...state,bookmarks});
}
/** Called only by the established-session bridge; no coordinate/history data retained. */
export function stampDestination(state: Journal, destinationId: FeaturedDestinationId, visitedAt: number, provenance: 'verified' | 'development'): Journal {
  if(provenance !== 'verified' || state.stamps.some(s=>s.destinationId===destinationId)) return state;
  return journalSchema.parse({...state,stamps:[...state.stamps,{destinationId,visitedAt}]});
}
export function mergeJournal(account: Journal, guest: Journal): Journal {
  const bookmarks=new Map(account.bookmarks.map(x=>[bookmarkKey(x),x])); guest.bookmarks.forEach(x=>bookmarks.set(bookmarkKey(x),x));
  const stamps=new Map(account.stamps.map(x=>[x.destinationId,x]));
  guest.stamps.forEach(x=>{ const old=stamps.get(x.destinationId); if(!old || x.visitedAt<old.visitedAt) stamps.set(x.destinationId,x); });
  return journalSchema.parse({version:1,bookmarks:[...bookmarks.values()],stamps:[...stamps.values()]});
}
