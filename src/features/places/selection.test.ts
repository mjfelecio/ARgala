import { QueryClient } from '@tanstack/react-query';
import { afterEach, expect, it, vi } from 'vitest';
import { AR } from '@/config/limits';
import { queryClient } from '@/lib/query';
import type { Place } from './service';
import { placeSelectionOptions, setPlaceSelection } from './selection';
afterEach(() => vi.useRealTimers());
it('retains a handoff through navigation delay, expires it while unused and permits auth clear', async () => {
  vi.useFakeTimers();
  const client = new QueryClient({ defaultOptions: queryClient.getDefaultOptions() });
  const place: Place = { id: 'google:test', provider: 'google', providerId: 'test', name: 'Synthetic test', coordinates: { latitude: 0, longitude: 0 }, attributions: [] };
  setPlaceSelection(client, place);
  await vi.advanceTimersByTimeAsync(1000);
  expect(client.getQueryData(placeSelectionOptions(place.providerId).queryKey)).toEqual(place);
  await vi.advanceTimersByTimeAsync(AR.nearbyReuseMs);
  expect(client.getQueryData(placeSelectionOptions(place.providerId).queryKey)).toBeUndefined();
  setPlaceSelection(client, place); client.clear(); expect(client.getQueryData(placeSelectionOptions(place.providerId).queryKey)).toBeUndefined();
});

it('retains complete same-language discovery details before the navigation handoff is observed', async () => {
  vi.useFakeTimers();
  const client = new QueryClient({ defaultOptions: queryClient.getDefaultOptions() });
  const place: Place = { id: 'google:test', provider: 'google', providerId: 'test', source: 'discovery', name: 'Synthetic test', coordinates: { latitude: 0, longitude: 0 }, attributions: [] };
  setPlaceSelection(client, place, 'en');
  await vi.advanceTimersByTimeAsync(1000);
  expect(client.getQueryData(['place-details', 'test', 'en'])).toEqual(place);
  expect(client.getQueryData(['place-details', 'test', 'ja'])).toBeUndefined();
  await vi.advanceTimersByTimeAsync(AR.nearbyReuseMs);
  expect(client.getQueryData(['place-details', 'test', 'en'])).toBeUndefined();
  setPlaceSelection(client, { ...place, source: undefined }, 'en');
  expect(client.getQueryData(['place-details', 'test', 'en'])).toBeUndefined();
  setPlaceSelection(client, place, 'en'); client.clear();
  expect(client.getQueryData(['place-details', 'test', 'en'])).toBeUndefined();
});
