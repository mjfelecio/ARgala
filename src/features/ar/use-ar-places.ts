import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { AR, DISCOVERY } from '@/config/limits';
import { distanceMeters, isCoordinate, type Coordinate } from '@/features/location/geo';
import { placesService, type NearbySearch, type Place } from '@/features/places/service';

export const nearbyOptions = (request: NearbySearch) => ({
  queryKey: ['places', request.center, request.language ?? 'en'],
  queryFn: () => placesService.nearby(request), staleTime: 0, gcTime: AR.nearbyReuseMs,
});
function reusableSearch(client: QueryClient, position: Coordinate | null, language: string): NearbySearch | null {
  if (!position) return null;
  const query = client.getQueryCache().findAll({ queryKey: ['places'] }).filter((q) => {
    const [, center, lang] = q.queryKey;
    return lang === language && isCoordinate(center) && Array.isArray(q.state.data) &&
      Date.now() - q.state.dataUpdatedAt <= AR.nearbyReuseMs &&
      distanceMeters(position, center) <= AR.nearbyReuseDistanceMeters;
  }).sort((a, b) => b.state.dataUpdatedAt - a.state.dataUpdatedAt)[0];
  return query ? { center: query.queryKey[1] as Coordinate, language: query.queryKey[2] as NearbySearch['language'], radiusMeters: DISCOVERY.radiusMeters } : null;
}
export function useArPlaces(position: Coordinate | null, language: NonNullable<NearbySearch['language']>) {
  const client = useQueryClient();
  const [request, setRequest] = useState<NearbySearch | null>(() => reusableSearch(client, position, language));
  // Once GPS starts, adopt a compatible resolved search exactly once. This is
  // a local state adjustment, never a provider request or a refetch effect.
  if (!request && position) {
    const cached = reusableSearch(client, position, language);
    if (cached) setRequest(cached);
  }
  const nearby = useQuery<Place[]>({ ...(request ? nearbyOptions(request) : { queryKey: ['ar-idle'], queryFn: async () => [] }),
    enabled: false, placeholderData: (previous) => previous });
  const [detailRequest, setDetailRequest] = useState<{ providerId: string; language: typeof language } | null>(null);
  const detailsOptions = (value: NonNullable<typeof detailRequest>) => ({ queryKey: ['place-details', value.providerId, value.language],
    queryFn: () => placesService.details(value.providerId, value.language), staleTime: 0, gcTime: AR.nearbyReuseMs });
  const details = useQuery({ ...(detailRequest ? detailsOptions(detailRequest) : { queryKey: ['ar-details-idle'], queryFn: async (): Promise<Place | null> => null }), enabled: false });
  function scan() {
    if (!position || nearby.isFetching) return;
    const next = { center: { ...position }, language, radiusMeters: DISCOVERY.radiusMeters };
    setRequest(next);
    void client.fetchQuery(nearbyOptions(next)).catch(() => {});
  }
  function more(providerId: string) {
    if (details.isFetching) return;
    const next = { providerId, language }; setDetailRequest(next);
    void client.fetchQuery(detailsOptions(next)).catch(() => {});
  }
  return { nearby, details, detailRequest, request, scan, more };
}
