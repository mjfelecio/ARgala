import { AR } from '@/config/limits';
import type { Place } from './service';

/** A short-lived in-memory handoff. Reading this observer never calls a provider. */
export const placeSelectionOptions = (providerId: string | null) => ({
  queryKey: ['place-selection', providerId],
  queryFn: async (): Promise<Place | null> => null,
  enabled: false, gcTime: AR.nearbyReuseMs,
});
