import { detailsRequestSchema, nearbyRequestSchema, nearbyResponseSchema, placeSchema, type Language, type NearbySearch, type Place } from '../../../supabase/functions/_shared/contracts';
import { invokeEdge } from '@/lib/edge';
export type { Place, NearbySearch };
export interface PlacesService {
  nearby(request: NearbySearch): Promise<Place[]>;
  details(providerId: string, language?: Language): Promise<Place>;
}
export const placesService: PlacesService = {
  nearby: (request) => invokeEdge('places-nearby', nearbyRequestSchema.parse(request), nearbyResponseSchema),
  details: (providerId, language = 'en') => invokeEdge('place-details', detailsRequestSchema.parse({ providerId, language }), placeSchema),
};
