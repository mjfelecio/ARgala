import { withHeroUI } from '@/test/native-ui';
import * as React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { QueryClient, QueryClientProvider, notifyManager } from '@tanstack/react-query';
import { createInstance, type i18n } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { queryClient } from '@/lib/query';
import { localizationOptions } from '@/i18n/options';
import { EdgeRequestError } from '@/lib/edge-error';
import { placesService, type Place } from './service';
import { placeSelectionOptions } from './selection';
import PlaceDetailsScreen from './place-details-screen';

const controls = vi.hoisted(() => ({ params: { providerId: 'north' } as Record<string, unknown>, language: 'en' as 'en' | 'ko' | 'ja', focused: true, active: true, back: true }));
vi.mock('expo-router', () => ({ useLocalSearchParams: () => controls.params, useIsFocused: () => controls.focused,
  router: { back: vi.fn(), canGoBack: () => controls.back, navigate: vi.fn(), dismissTo: vi.fn() } }));
vi.mock('@/features/settings/provider', () => ({ useSettings: () => ({ language: controls.language }) }));
vi.mock('@/lib/use-app-active', () => ({ useAppActive: () => controls.active }));
vi.mock('./service', () => ({ placesService: { details: vi.fn(), nearby: vi.fn() } }));
vi.mock('@/features/map/attributions', () => ({ ProviderAttributions: ({ places }: { places: Place[] }) => React.createElement('aside', {}, places.flatMap(p => p.attributions.map(a => a.name))), useOpenProviderLink: () => vi.fn() }));
const place: Place = { id: 'google:north', provider: 'google', providerId: 'north', name: 'North place', coordinates: { latitude: 10, longitude: 124 }, attributions: [] };
let tree: ReactTestRenderer | undefined; let client: QueryClient; let translations: i18n;
function render() { return <I18nextProvider i18n={translations}><QueryClientProvider client={client}>{withHeroUI(<PlaceDetailsScreen />)}</QueryClientProvider></I18nextProvider>; }
async function mount() { await act(async () => { tree = create(render()); }); }
function output() { return JSON.stringify(tree!.toJSON()); }
function button(key: string) { return tree!.root.findAllByType('button').find(b => b.props.accessibilityLabel === translations.t(key)); }
async function press(key: string) { const b = button(key); expect(b, key).toBeDefined(); expect(b!.props.isDisabled).not.toBe(true); await act(async () => { b!.props.onPress(); }); }
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true, __DEV__: false });
  Object.assign(controls, { params: { providerId: 'north' }, language: 'en', active: true, focused: true, back: true });
  vi.clearAllMocks(); vi.mocked(placesService.details).mockReset().mockResolvedValue(place);
  notifyManager.setScheduler(cb => cb());
  client = new QueryClient({ defaultOptions: queryClient.getDefaultOptions() });
  translations = createInstance(); await translations.use(initReactI18next).init({ ...localizationOptions, lng: 'en', react: { useSuspense: false } });
  const original = console.error; vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => { if (!String(args[0]).startsWith('react-test-renderer is deprecated')) original(...args); });
});
afterEach(async () => { await act(async () => tree?.unmount()); tree = undefined; client.clear(); notifyManager.setScheduler(cb => setTimeout(cb, 0)); vi.restoreAllMocks(); });
it('reads the cached selection and never requests details on entry', async () => {
  client.setQueryData(placeSelectionOptions('north').queryKey, place); await mount();
  expect(output()).toContain(place.name); expect(placesService.details).not.toHaveBeenCalled();
});
it.each([undefined, '', '../bad', ['north', 'south'], 'x'.repeat(4097)])('handles invalid or missing provider ID %j without a request', async id => {
  controls.params = { providerId: id }; await mount();
  expect(output()).toContain(translations.t('placeDetails.unavailable')); expect(button('placeDetails.load')).toBeUndefined(); expect(placesService.details).not.toHaveBeenCalled();
});
it('recovers a cold-open selection only after explicit Load Details', async () => {
  await mount(); expect(output()).toContain(translations.t('placeDetails.unavailable')); expect(placesService.details).not.toHaveBeenCalled();
  await press('placeDetails.load'); expect(placesService.details).toHaveBeenCalledExactlyOnceWith('north', 'en');
  expect(output()).toContain(place.name); expect(button('placeDetails.load')).toBeUndefined();
});
it('retains summary on a sanitized failure and recovers explicitly', async () => {
  client.setQueryData(placeSelectionOptions('north').queryKey, place);
  vi.mocked(placesService.details).mockRejectedValueOnce(new EdgeRequestError('RATE_LIMITED'));
  await mount(); await press('placeDetails.load'); expect(output()).toContain(place.name); expect(output()).toContain(translations.t('service.rateLimited'));
  await press('placeDetails.load'); expect(placesService.details).toHaveBeenCalledTimes(2); expect(button('placeDetails.load')).toBeUndefined();
});
it('ignores cached detail for another provider ID', async () => {
  client.setQueryData(['place-details', 'north', 'en'], { ...place, providerId: 'south', name: 'Wrong place' }); await mount();
  expect(output()).not.toContain('Wrong place'); expect(button('placeDetails.load')).toBeDefined();
});
