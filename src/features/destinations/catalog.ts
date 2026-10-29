import { z } from 'zod';
import { coordinateSchema, detailsRequestSchema, type Language } from '../../../supabase/functions/_shared/contracts';

export const destinationIds = ['D01', 'D02', 'D03', 'D04', 'D05', 'D06', 'D07', 'D08', 'D09'] as const;
export type DestinationId = typeof destinationIds[number];
export const featuredDestinationIds = [...destinationIds, 'pilot-aclc'] as const;
export type FeaturedDestinationId = typeof featuredDestinationIds[number];
const text = z.string().trim().min(1);
const approvedText = z.object({ value: text, approvalReference: text }).strict();
const approvedHighlights = z.object({ value: z.array(text).min(1).readonly(), approvalReference: text }).strict();
const translatedText = z.object({ en: approvedText.optional(), ko: approvedText.optional(), ja: approvedText.optional() }).strict();
const copy = z.object({ overview: approvedText.optional(), highlights: approvedHighlights.optional() }).strict();
const mediaSchema = z.object({
  id: text, source: z.number().int().positive(), credit: text, rightsReference: text, approvalReference: text,
  // A bundled require(...) asset only; no remote photo loading or provider-photo cache.
  alt: translatedText.extend({ en: approvedText }), caption: translatedText.optional(),
}).strict();
const arTileSchema = z.object({
  id: text.max(80), role: z.enum(['overview', 'history']).optional(),
  title: translatedText, body: translatedText,
  mediaIds: z.array(text).refine(items => new Set(items).size === items.length).readonly().optional(),
}).strict();
const arSchema = z.object({
  schemaVersion: z.literal(1), contentVersion: text.max(80),
  activation: z.object({ point: coordinateSchema, pointApprovalReference: text,
    radiusMeters: z.number().finite().min(10).max(1000), radiusApprovalReference: text }).strict().optional(),
  providerAssociation: z.object({ providerId: detailsRequestSchema.shape.providerId, approvalReference: text }).strict().optional(),
  tiles: z.array(arTileSchema).max(12).refine(items => new Set(items.map(item => item.id)).size === items.length)
    .refine(items => ['overview', 'history'].every(role => items.filter(item => item.role === role).length <= 1)).readonly(),
}).strict();
export const destinationSchema = z.object({
  id: z.enum(featuredDestinationIds), provisionalName: text, verifiedName: approvedText.optional(),
  ar: arSchema.optional(),
  center: coordinateSchema.optional(), centerApprovalReference: text.optional(),
  routeEntrance: coordinateSchema.optional(), routeEntranceApprovalReference: text.optional(),
  copy: z.object({ en: copy.optional(), ko: copy.optional(), ja: copy.optional() }).strict().optional(),
  media: z.array(mediaSchema).refine(items => new Set(items.map(item => item.id)).size === items.length).readonly().optional(),
}).strict().refine(d => !d.center || !!d.centerApprovalReference, { path: ['centerApprovalReference'] })
  .refine(d => !d.routeEntrance || !!d.routeEntranceApprovalReference, { path: ['routeEntranceApprovalReference'] })
  .refine(d => (d.ar?.tiles ?? []).every(tile => (tile.mediaIds ?? []).every(id => d.media?.some(media => media.id === id))), { path: ['ar', 'tiles'] }).readonly();
export type Destination = z.infer<typeof destinationSchema>;
export type DestinationMedia = z.infer<typeof mediaSchema>;

// Draft SRS §3 labels, deliberately without geographic or tourism assertions.
const catalog: readonly Destination[] = Object.freeze([
  ['D01', 'Lake Danao Natural Park'], ['D02', 'Lake Kasudsuran'], ['D03', 'Lake Janagdan'],
  ['D04', 'Ormoc Mangrove Eco Park'], ['D05', 'Pineapple Farm'], ['D06', 'Leyte Golf and Country Club'],
  ['D07', 'Alto Peak'], ['D08', 'Heaven’s Peak'], ['D09', 'Sabin Resort Hotel'],
].map(([id, provisionalName]) => destinationSchema.parse({ id, provisionalName })));
export const listDestinations = (): readonly Destination[] => catalog;
const pilotApproval = 'Owner supplied entrance and approved Maps place activation center, 2026-10-27; docs/aclc-pilot-inputs.md';
const pilotPoint = { latitude: 11.022973, longitude: 124.6054992 };
const pilot = destinationSchema.parse({
  id: 'pilot-aclc', provisionalName: 'ACLC College of Ormoc',
  center: pilotPoint, centerApprovalReference: pilotApproval,
  routeEntrance: { latitude: 11.022845368322905, longitude: 124.60452610504089 },
  routeEntranceApprovalReference: pilotApproval,
  ar: { schemaVersion: 1, contentVersion: 'pilot-inputs-2026-10-27', tiles: [],
    activation: { point: pilotPoint, pointApprovalReference: pilotApproval, radiusMeters: 50,
      radiusApprovalReference: 'Approved blueprint tentative 50m trial; field calibration pending' } },
});
/** Pilot is not a change to the client launch roster. */
export const listFeaturedDestinations = (): readonly Destination[] => [...catalog, pilot];
export function getDestination(id: unknown): Destination | null {
  return typeof id === 'string' ? listFeaturedDestinations().find(d => d.id === id) ?? null : null;
}
export const destinationName = (destination: Destination) => destination.verifiedName?.value ?? destination.provisionalName;

/** Content falls back independently; an untranslated highlight cannot hide an approved overview. */
export function localizedContent<T>(values: Partial<Record<Language, { value: T; approvalReference: string }>> | undefined, language: Language): { value: T; englishFallback: boolean } | null {
  const local = values?.[language];
  if (local) return { value: local.value, englishFallback: false };
  return values?.en ? { value: values.en.value, englishFallback: language !== 'en' } : null;
}
