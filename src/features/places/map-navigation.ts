import { router } from 'expo-router';
import type { QueryClient } from '@tanstack/react-query';
import { createMapSelectionIntent, type MapSelectionInput } from './map-selection-intent';
import { isReusablePlaceData, setPlaceSelection } from './selection';

/** Call only from an explicit current foreground action, never an effect or URL redirect. */
export function openGooglePlaceOnMap(client: QueryClient, input: Omit<MapSelectionInput, 'principalId'> & { principalId?: string }): void {
  if (input.place) setPlaceSelection(client, input.place, input.updatedAt && isReusablePlaceData(input.updatedAt) ? input.language : undefined, input.updatedAt);
  const selectionToken = createMapSelectionIntent(client, { ...input, principalId: input.principalId ?? 'guest' });
  router.navigate({ pathname: '/', params: { placeId: input.providerId, selectionToken } });
}
