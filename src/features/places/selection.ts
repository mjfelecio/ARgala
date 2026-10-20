import { AR } from '@/config/limits';
import type { Place } from './service';
import type { QueryClient } from '@tanstack/react-query';

const prefix = ['place-selection'] as const;
/** Configure retention before creating an unobserved query during navigation. */
export function setPlaceSelection(client: QueryClient, place: Place) {
  client.setQueryDefaults(prefix, { gcTime: AR.nearbyReuseMs });
  client.setQueryData([...prefix, place.providerId], place);
}

/** A short-lived in-memory handoff. Reading this observer never calls a provider. */
export const placeSelectionOptions = (providerId: string | null) => ({
  queryKey: [...prefix, providerId],
  queryFn: async (): Promise<Place | null> => null,
  enabled: false, gcTime: AR.nearbyReuseMs,
});
