import type { QueryClient } from '@tanstack/react-query';
import { AR } from '@/config/limits';
import type { Language } from '../../../supabase/functions/_shared/contracts';
import { placesService, type Place } from './service';
import { isCompleteDiscoveryPlace, isReusablePlaceData } from './selection';

/**
 * The Google adapter requests the same fields for Nearby and Details. A
 * normalized discovery response already contains every field we can display;
 * absent optional fields are legitimate omissions, not a reason to pay again.
 * Unknown handoffs still need explicit recovery. Keep this aligned with the
 * shared field mask in supabase/functions/_shared/places.ts.
 */
function reusableDetails(client: QueryClient, providerId: string | null, language: Language): { place: Place; updatedAt: number } | undefined {
  if (!providerId) return undefined;
  const full = client.getQueryState<Place>(['place-details', providerId, language]);
  if (full?.data?.providerId === providerId && isReusablePlaceData(full.dataUpdatedAt)) return { place: full.data, updatedAt: full.dataUpdatedAt };
  for (const query of client.getQueryCache().findAll({ queryKey: ['places'] })) {
    if (query.queryKey[2] !== language || !Array.isArray(query.state.data) || !isReusablePlaceData(query.state.dataUpdatedAt)) continue;
    const place = (query.state.data as Place[]).find(p => p.providerId === providerId && isCompleteDiscoveryPlace(p));
    if (place) return { place, updatedAt: query.state.dataUpdatedAt };
  }
  return undefined;
}

export function availablePlaceDetails(client: QueryClient, providerId: string | null, language: Language): Place | undefined {
  return reusableDetails(client, providerId, language)?.place;
}

/** Disabled observers may seed from verified, same-language transient data. */
export function placeDetailsOptions(client: QueryClient, providerId: string | null, language: Language) {
  const cached = reusableDetails(client, providerId, language);
  return {
    queryKey: ['place-details', providerId, language],
    queryFn: () => placesService.details(providerId!, language),
    initialData: cached?.place,
    // Copying Nearby fields must not restart their reuse window.
    initialDataUpdatedAt: cached?.updatedAt,
    gcTime: AR.nearbyReuseMs,
  };
}
