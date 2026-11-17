import { nativeUi, withHeroUI } from '@/test/native-ui';
import * as React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { QueryClient, QueryClientProvider, notifyManager } from '@tanstack/react-query';
import { createInstance, type i18n } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { queryClient } from '@/lib/query';
import { localizationOptions } from '@/i18n/options';
import { placesService, type Place } from './service';
import PlaceDetailsScreen from './place-details-screen';

const controls = vi.hoisted(() => ({ params: { providerId: 'north' } as Record<string, unknown>, language: 'en' as 'en' | 'ko' | 'ja', focused: true, active: true, back: true }));
vi.mock('expo-router', () => ({ useLocalSearchParams: () => controls.params, useIsFocused: () => controls.focused,
  router: { push: vi.fn(), back: vi.fn(), canGoBack: () => controls.back, navigate: vi.fn(), dismissTo: vi.fn() } }));
vi.mock('@/features/settings/provider', () => ({ useSettings: () => ({ language: controls.language }) }));
vi.mock('@/lib/use-app-active', () => ({ useAppActive: () => controls.active }));
vi.mock('./service', () => ({ placesService: { details: vi.fn(), nearby: vi.fn() } }));
const place: Place = { id: 'google:north', provider: 'google', providerId: 'north', name: 'North place', coordinates: { latitude: 10, longitude: 124 }, attributions: [] };
let tree: ReactTestRenderer | undefined; let client: QueryClient; let translations: i18n;
function render() { return <I18nextProvider i18n={translations}><QueryClientProvider client={client}>{withHeroUI(<PlaceDetailsScreen />)}</QueryClientProvider></I18nextProvider>; }
async function mount() { await act(async () => { tree = create(render()); }); }
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true, __DEV__: false });
  Object.assign(controls, { params: { providerId: 'north' }, language: 'en', active: true, focused: true, back: true });
  vi.clearAllMocks(); nativeUi.openURL.mockReset().mockResolvedValue(undefined); vi.mocked(placesService.details).mockReset().mockResolvedValue(place);
  notifyManager.setScheduler(cb => cb());
  client = new QueryClient({ defaultOptions: queryClient.getDefaultOptions() });
  translations = createInstance(); await translations.use(initReactI18next).init({ ...localizationOptions, lng: 'en', react: { useSuspense: false } });
  const original = console.error; vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => { if (!String(args[0]).startsWith('react-test-renderer is deprecated')) original(...args); });
});
afterEach(async () => { await act(async () => tree?.unmount()); tree = undefined; client.clear(); notifyManager.setScheduler(cb => setTimeout(cb, 0)); vi.restoreAllMocks(); });
it('redirects an old place URL to the map sheet without paid lookup authority', async () => {
  const { router } = await import('expo-router');
  await mount();
  expect(router.dismissTo).toHaveBeenCalledWith({ pathname: '/', params: { placeId: 'north' } });
  expect(placesService.details).not.toHaveBeenCalled();
  expect(tree!.root.findAllByType('button')).toHaveLength(0);
  expect(tree!.root.findAllByType('text')).toHaveLength(0);
});
it('waits for foreground focus and redirects once, including repeated resume', async () => {
  const { router } = await import('expo-router');
  controls.focused = false; await mount();
  expect(router.dismissTo).not.toHaveBeenCalled();
  controls.focused = true; await act(async () => tree!.update(render()));
  controls.active = false; await act(async () => tree!.update(render()));
  controls.active = true; await act(async () => tree!.update(render()));
  expect(router.dismissTo).toHaveBeenCalledTimes(1);
  expect(placesService.details).not.toHaveBeenCalled();
});
it('sends invalid legacy IDs safely to Explore', async () => {
  const { router } = await import('expo-router');
  controls.params = { providerId: ['invalid'] }; await mount();
  expect(router.dismissTo).toHaveBeenCalledWith('/');
  expect(placesService.details).not.toHaveBeenCalled();
});
