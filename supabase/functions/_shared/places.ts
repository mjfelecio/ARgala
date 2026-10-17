import { z } from 'zod';
import { coordinateSchema, detailsRequestSchema, DISCOVERY_LIMITS, httpsUrlSchema, nearbyRequestSchema, placeSchema, type Place } from './contracts.ts';
import { ApiError } from './errors.ts';
import { googleJson, type GoogleDependencies } from './google.ts';
const googlePlaceSchema = z.object({
  id: z.string().min(1), displayName: z.object({ text: z.string().min(1) }), location: coordinateSchema,
  formattedAddress: z.string().optional(), googleMapsUri: httpsUrlSchema.optional(),
  attributions: z.array(z.object({ provider: z.string(), providerUri: httpsUrlSchema.optional() })).default([]),
});
const fields = ['id', 'displayName', 'location', 'formattedAddress', 'googleMapsUri', 'attributions'];
export function normalizePlace(value: unknown): Place {
  const parsed = googlePlaceSchema.safeParse(value);
  if (!parsed.success) throw new ApiError('UPSTREAM_INVALID', 502, 'The provider returned invalid place data.');
  const place = parsed.data;
  return placeSchema.parse({ id: `google:${place.id}`, provider: 'google', providerId: place.id, name: place.displayName.text, coordinates: place.location, source: 'discovery',
    ...(place.formattedAddress ? { address: place.formattedAddress } : {}), ...(place.googleMapsUri ? { mapsUri: place.googleMapsUri } : {}),
    attributions: place.attributions.map((item) => ({ name: item.provider, ...(item.providerUri ? { uri: item.providerUri } : {}) })),
  });
}
export async function searchNearby(input: unknown, dependencies: GoogleDependencies): Promise<Place[]> {
  const request = nearbyRequestSchema.parse(input);
  const response = await googleJson('https://places.googleapis.com/v1/places:searchNearby', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Goog-FieldMask': fields.map((field) => `places.${field}`).join(',') },
    body: JSON.stringify({ maxResultCount: DISCOVERY_LIMITS.maxResults, rankPreference: 'DISTANCE', languageCode: request.language, locationRestriction: { circle: { center: request.center, radius: request.radiusMeters } } }),
  }, dependencies);
  const parsed = z.object({ places: z.array(z.unknown()).max(DISCOVERY_LIMITS.maxResults).default([]) }).safeParse(response);
  if (!parsed.success) throw new ApiError('UPSTREAM_INVALID', 502, 'The provider returned invalid search data.');
  return parsed.data.places.map(normalizePlace);
}
export async function getPlaceDetails(input: unknown, dependencies: GoogleDependencies): Promise<Place> {
  const request = detailsRequestSchema.parse(input);
  return normalizePlace(await googleJson(`https://places.googleapis.com/v1/places/${encodeURIComponent(request.providerId)}?languageCode=${request.language}`, { method: 'GET', headers: { 'X-Goog-FieldMask': fields.join(',') } }, dependencies));
}
