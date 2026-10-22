import { AR } from '@/config/limits';
import type { Place } from './service';
import type { QueryClient } from '@tanstack/react-query';
import type { Language } from '../../../supabase/functions/_shared/contracts';

/** The shared Google Nearby/Details field mask supplies the full display contract. */
export const isCompleteDiscoveryPlace = (place: Place) => place.provider === 'google' && place.source === 'discovery';
/** Observation/garbage collection must not extend provider-data reuse. */
export const isReusablePlaceData = (updatedAt: number, now = Date.now()) => updatedAt > 0 && updatedAt <= now && now - updatedAt <= AR.nearbyReuseMs;

const prefix = ['place-selection'] as const;
/** Configure retention before creating an unobserved query during navigation. */
export function setPlaceSelection(client: QueryClient, place: Place, language?: Language, updatedAt?: number) {
  client.setQueryDefaults(prefix, { gcTime: AR.nearbyReuseMs });
  client.setQueryData([...prefix, place.providerId], place);
  if (language && isCompleteDiscoveryPlace(place)) {
    const key = ['place-details', place.providerId, language];
    const current = client.getQueryState(key);
    const responseUpdatedAt = updatedAt ?? (current?.data ? current.dataUpdatedAt : Date.now());
    if (!isReusablePlaceData(responseUpdatedAt)) return;
    client.setQueryDefaults(key, { gcTime: AR.nearbyReuseMs });
    if (!current?.data || current.dataUpdatedAt < responseUpdatedAt) client.setQueryData(key, place, { updatedAt: responseUpdatedAt });
  }
}

/** A short-lived in-memory handoff. Reading this observer never calls a provider. */
export const placeSelectionOptions = (providerId: string | null) => ({
  queryKey: [...prefix, providerId],
  queryFn: async (): Promise<Place | null> => null,
  enabled: false, gcTime: AR.nearbyReuseMs,
});
