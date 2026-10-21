import type { QueryClient } from '@tanstack/react-query';
import { AR } from '@/config/limits';
import type { Language } from '../../../supabase/functions/_shared/contracts';
import { placesService, type Place } from './service';
import { isCompleteDiscoveryPlace } from './selection';

/**
 * The Google adapter requests the same fields for Nearby and Details. A
 * normalized discovery response already contains every field we can display;
 * absent optional fields are legitimate omissions, not a reason to pay again.
 * Unknown handoffs still need explicit recovery. Keep this aligned with the
 * shared field mask in supabase/functions/_shared/places.ts.
 */
export function availablePlaceDetails(client: QueryClient, providerId: string | null, language: Language): Place | undefined {
  if (!providerId) return undefined;
  const full = client.getQueryData<Place>(['place-details', providerId, language]);
  if (full?.providerId === providerId) return full;
  for (const query of client.getQueryCache().findAll({ queryKey: ['places'] })) {
    if (query.queryKey[2] !== language || !Array.isArray(query.state.data)) continue;
    const place = (query.state.data as Place[]).find(p => p.providerId === providerId && isCompleteDiscoveryPlace(p));
    if (place) return place;
  }
  return undefined;
}

/** Disabled observers may seed from verified, same-language transient data. */
export const placeDetailsOptions = (client: QueryClient, providerId: string | null, language: Language) => ({
  queryKey: ['place-details', providerId, language],
  queryFn: () => placesService.details(providerId!, language),
  initialData: () => availablePlaceDetails(client, providerId, language),
  gcTime: AR.nearbyReuseMs,
});
