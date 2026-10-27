import { z } from 'zod';
import { coordinateSchema, detailsRequestSchema, DISCOVERY_LIMITS, httpsUrlSchema, nearbyRequestSchema, placesSearchRequestSchema, placeSchema, type Place } from './contracts.ts';
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
  return await nearby(nearbyRequestSchema.parse(input), dependencies);
}
async function nearby(request: z.infer<typeof nearbyRequestSchema>, dependencies: GoogleDependencies, type?: string): Promise<Place[]> {
  const response = await googleJson('https://places.googleapis.com/v1/places:searchNearby', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Goog-FieldMask': fields.map((field) => `places.${field}`).join(',') },
    body: JSON.stringify({ ...(type ? { includedTypes: [type] } : {}), maxResultCount: DISCOVERY_LIMITS.maxResults, rankPreference: 'DISTANCE', languageCode: request.language, locationRestriction: { circle: { center: request.center, radius: request.radiusMeters } } }),
  }, dependencies);
  const parsed = z.object({ places: z.array(z.unknown()).max(DISCOVERY_LIMITS.maxResults).default([]) }).safeParse(response);
  if (!parsed.success) throw new ApiError('UPSTREAM_INVALID', 502, 'The provider returned invalid search data.');
  return parsed.data.places.map(normalizePlace);
}
export async function getPlaceDetails(input: unknown, dependencies: GoogleDependencies): Promise<Place> {
  const request = detailsRequestSchema.parse(input);
  return normalizePlace(await googleJson(`https://places.googleapis.com/v1/places/${encodeURIComponent(request.providerId)}?languageCode=${request.language}`, { method: 'GET', headers: { 'X-Goog-FieldMask': fields.join(',') } }, dependencies));
}

const categoryType = { all: undefined, attractions: 'tourist_attraction', restaurants: 'restaurant', hotels: 'hotel', shopping: 'shopping_mall' } as const;
function geographicDistance(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const rad = (value: number) => value * Math.PI / 180;
  const h = Math.sin(rad(b.latitude - a.latitude) / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(rad(b.longitude - a.longitude) / 2) ** 2;
  return 6371008.8 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, h))));
}
/** Explicit text/category search. Bias never implies containment; filter by the submitted circle. */
export async function searchPlaces(input: unknown, dependencies: GoogleDependencies): Promise<Place[]> {
  const request = placesSearchRequestSchema.parse(input);
  const type = categoryType[request.category];
  if (!request.query) return nearby({ ...request.area!, language: request.language }, dependencies, type);
  const response = await googleJson('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Goog-FieldMask': fields.map(field => `places.${field}`).join(',') },
    body: JSON.stringify({ textQuery: request.query, pageSize: DISCOVERY_LIMITS.maxResults, languageCode: request.language,
      ...(type ? { includedType: type, strictTypeFiltering: true } : {}),
      ...(request.area ? { locationBias: { circle: { center: request.area.center, radius: request.area.radiusMeters } } } : {}) }),
  }, dependencies);
  const parsed = z.object({ places: z.array(z.unknown()).max(DISCOVERY_LIMITS.maxResults).default([]) }).safeParse(response);
  if (!parsed.success) throw new ApiError('UPSTREAM_INVALID', 502, 'The provider returned invalid search data.');
  return parsed.data.places.map(normalizePlace).filter(place => !request.area || geographicDistance(request.area.center, place.coordinates) <= request.area.radiusMeters);
}
