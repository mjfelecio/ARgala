import { z } from 'zod';
import { coordinateSchema, detailsRequestSchema, type Language } from '../../../supabase/functions/_shared/contracts';
import { presentationCatalog } from './presentation-catalog';
import { aclcDirectionsEntrance, aclcDisplayPoint, aclcLocationReference } from './aclc-locations';

export const destinationIds = ['D01', 'D02', 'D03', 'D04', 'D05', 'D06', 'D07', 'D08', 'D09', 'D10'] as const;
export type DestinationId = typeof destinationIds[number];
export const featuredDestinationIds = [...destinationIds, 'pilot-aclc'] as const;
export type FeaturedDestinationId = typeof featuredDestinationIds[number];
const text = z.string().trim().min(1);
const approvedText = z.object({ value: text, approvalReference: text }).strict();
const approvedHighlights = z.object({ value: z.array(text).min(1).readonly(), approvalReference: text }).strict();
const translatedText = z.object({ en: approvedText.optional(), ko: approvedText.optional(), ja: approvedText.optional() }).strict();
const copy = z.object({ overview: approvedText.optional(), highlights: approvedHighlights.optional() }).strict();
const guide = z.object({ arrival: text, bestTime: text, activities: z.array(text), preparation: z.array(text), safety: z.array(text) }).strict();
const approvedGuide = z.object({ value: guide, approvalReference: text }).strict();
const mediaSchema = z.object({
  kind: z.enum(['emblem', 'document']).optional(),
  offlineRightsReference: text.optional(),
  usageScope: text.optional(),
  id: text, source: z.number().int().positive(), credit: text, rightsReference: text, approvalReference: text,
  // A bundled require(...) asset only; no remote photo loading or provider-photo cache.
  alt: translatedText.extend({ en: approvedText }), caption: translatedText.optional(),
}).strict();
const arTileSchema = z.object({
  presentation: z.enum(['photo', 'gallery', 'story']).optional(),
  id: text.max(80), role: z.enum(['overview', 'history']).optional(),
  title: translatedText, body: translatedText,
  mediaIds: z.array(text).refine(items => new Set(items).size === items.length).readonly().optional(),
}).strict();
const arSchema = z.object({
  schemaVersion: z.literal(1), contentVersion: text.max(80),
  storyApproval: z.object({ contentVersion: text.max(80), approvalReference: text, reviewer: text, reviewedAt: z.iso.date(),
    scope: z.literal('school-presentation').optional(),
    primaryChapterIds: z.array(text.max(80)).min(1).max(12).refine(ids => new Set(ids).size === ids.length).readonly(),
  }).strict().optional(),
  activation: z.object({ point: coordinateSchema, pointApprovalReference: text,
    radiusMeters: z.number().finite().min(10).max(1000), radiusApprovalReference: text }).strict().optional(),
  providerAssociation: z.object({ providerId: detailsRequestSchema.shape.providerId, approvalReference: text }).strict().optional(),
  tiles: z.array(arTileSchema).max(12).refine(items => new Set(items.map(item => item.id)).size === items.length)
    .refine(items => ['overview', 'history'].every(role => items.filter(item => item.role === role).length <= 1)).readonly(),
}).strict();
export const destinationSchema = z.object({
  id: z.enum(featuredDestinationIds), provisionalName: text, verifiedName: approvedText.optional(),
  localizedNames: translatedText.optional(),
  visitorGuide: z.object({ en: approvedGuide, ja: approvedGuide, ko: approvedGuide }).strict().optional(),
  requiresGuide: z.boolean().optional(), coverMediaId: text.optional(),
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

// Owner-supplied presentation content and independent local access confirmation.
// None of these display/navigation fields establish native AR or Passport authority.
const catalog: readonly Destination[] = Object.freeze(presentationCatalog.map(item => destinationSchema.parse(item)));
export const listDestinations = (): readonly Destination[] => catalog;
const pilot = destinationSchema.parse({
  id: 'pilot-aclc', provisionalName: 'ACLC College of Ormoc',
  center: aclcDisplayPoint, centerApprovalReference: aclcLocationReference,
  routeEntrance: aclcDirectionsEntrance, routeEntranceApprovalReference: aclcLocationReference,
  ar: { schemaVersion: 1, contentVersion: 'pilot-inputs-2026-10-27', tiles: [],
    activation: { point: aclcDisplayPoint, pointApprovalReference: aclcLocationReference, radiusMeters: 50,
      radiusApprovalReference: 'Approved blueprint tentative 50m trial; field calibration pending' } },
});
export const listFeaturedDestinations = listDestinations;
/** Historic journal/reminder records and the developer diagnostic retain their ID. */
export function getDestination(id: unknown): Destination | null {
  return id === 'pilot-aclc' ? pilot : typeof id === 'string' ? catalog.find(d => d.id === id) ?? null : null;
}
export const destinationName = (destination: Destination, language: Language = 'en') =>
  localizedContent(destination.localizedNames, language)?.value ?? destination.verifiedName?.value ?? destination.provisionalName;

/** Content falls back independently; an untranslated highlight cannot hide an approved overview. */
export function localizedContent<T>(values: Partial<Record<Language, { value: T; approvalReference: string }>> | undefined, language: Language): { value: T; englishFallback: boolean } | null {
  const local = values?.[language];
  if (local) return { value: local.value, englishFallback: false };
  return values?.en ? { value: values.en.value, englishFallback: language !== 'en' } : null;
}
