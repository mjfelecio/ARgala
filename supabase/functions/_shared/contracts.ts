import { z } from 'zod';

export const DISCOVERY_LIMITS = { maxRadiusMeters: 5000, maxResults: 20 } as const;
export const coordinateSchema = z.object({ latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180) }).strict();
export const languageSchema = z.enum(['en', 'ko', 'ja']);
export type Language = z.infer<typeof languageSchema>;
export const httpsUrlSchema = z.url().refine((value) => new URL(value).protocol === 'https:');
const providerIdSchema = z.string().min(1).max(512).regex(/^[A-Za-z0-9_-]+$/);
export const nearbyRequestSchema = z.object({ center: coordinateSchema, radiusMeters: z.number().positive().max(DISCOVERY_LIMITS.maxRadiusMeters), language: languageSchema.default('en') }).strict();
export const detailsRequestSchema = z.object({ providerId: providerIdSchema, language: languageSchema.default('en') }).strict();
export const placeSchema = z.object({
  id: z.string().min(1), provider: z.string().min(1), providerId: z.string().min(1), name: z.string().min(1), coordinates: coordinateSchema,
  description: z.string().optional(), address: z.string().optional(), source: z.enum(['discovery', 'curated']).optional(),
  mapsUri: httpsUrlSchema.optional(), attributions: z.array(z.object({ name: z.string(), uri: httpsUrlSchema.optional() })),
});
export const nearbyResponseSchema = z.array(placeSchema).max(DISCOVERY_LIMITS.maxResults);
export const errorSchema = z.object({ error: z.object({ code: z.string(), message: z.string() }) });
export type Place = z.infer<typeof placeSchema>;
export type NearbySearch = z.input<typeof nearbyRequestSchema>;
