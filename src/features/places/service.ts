import { placesSearchRequestSchema, type PlacesSearch, detailsRequestSchema, nearbyRequestSchema, nearbyResponseSchema, placeSchema, type Language, type NearbySearch, type Place } from '../../../supabase/functions/_shared/contracts';
import { invokeEdge } from '@/lib/edge';
export type { Place, NearbySearch, PlacesSearch };
export interface PlacesService {
  search(request: PlacesSearch): Promise<Place[]>;
  nearby(request: NearbySearch): Promise<Place[]>;
  details(providerId: string, language?: Language): Promise<Place>;
}
export const placesService: PlacesService = {
  search: request => invokeEdge('places-search', placesSearchRequestSchema.parse(request), nearbyResponseSchema),
  nearby: (request) => invokeEdge('places-nearby', nearbyRequestSchema.parse(request), nearbyResponseSchema),
  details: (providerId, language = 'en') => invokeEdge('place-details', detailsRequestSchema.parse({ providerId, language }), placeSchema),
};
