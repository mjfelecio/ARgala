import { QueryClient } from '@tanstack/react-query';
import { afterEach, expect, it, vi } from 'vitest';
import { queryClient } from '@/lib/query';
import { claimMapSelectionIntent, createMapSelectionIntent } from './map-selection-intent';
const client = new QueryClient({ defaultOptions: queryClient.getDefaultOptions() });
afterEach(() => { client.clear(); vi.useRealTimers(); });
it('claims explicit user intent once and preserves partial seed identity without complete data authority', () => {
  const token = createMapSelectionIntent(client, { providerId: 'test', principalId: 'owner', name: 'My label', coordinates: { latitude: 1, longitude: 2 }, language: 'en' });
  const value = claimMapSelectionIntent(client, token, 'owner');
  expect(value).toMatchObject({ providerId: 'test', name: 'My label', principalId: 'owner' });
  expect(value).not.toHaveProperty('source');
  expect(claimMapSelectionIntent(client, token, 'owner')).toBeNull();
  expect(client.getQueryData(['place-details', 'test', 'en'])).toBeUndefined();
});
it('retires intents on principal replacement, expiry, rollback or a newer selection', () => {
  vi.useFakeTimers(); vi.setSystemTime(100000);
  const input = { providerId: 'test', principalId: 'owner' };
  const wrong = createMapSelectionIntent(client, input);
  expect(claimMapSelectionIntent(client, wrong, 'other')).toBeNull();
  const old = createMapSelectionIntent(client, input);
  createMapSelectionIntent(client, input);
  expect(claimMapSelectionIntent(client, old, 'owner')).toBeNull();
  const expired = createMapSelectionIntent(client, input);
  vi.advanceTimersByTime(30000);
  expect(claimMapSelectionIntent(client, expired, 'owner')).toBeNull();
  const rollback = createMapSelectionIntent(client, input);
  vi.setSystemTime(1);
  expect(claimMapSelectionIntent(client, rollback, 'owner')).toBeNull();
});
