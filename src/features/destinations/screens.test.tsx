import { withHeroUI } from '@/test/native-ui';
import * as React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { QueryClient, QueryClientProvider, notifyManager } from '@tanstack/react-query';
import { createInstance, type i18n } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { router } from 'expo-router';
import { queryClient } from '@/lib/query';
import { localizationOptions } from '@/i18n/options';
import { placesService } from '@/features/places/service';
import { listDestinations } from './catalog';
import DestinationsScreen from './destinations-screen';
import DestinationScreen from './destination-screen';

const controls = vi.hoisted(() => ({ params: { destinationId: 'D01' } as Record<string, unknown>, language: 'en' as 'en' | 'ko' | 'ja', focused: true, active: true, back: true }));
vi.mock('expo-router', () => ({ useLocalSearchParams: () => controls.params, useIsFocused: () => controls.focused,
  router: { push: vi.fn(), back: vi.fn(), canGoBack: () => controls.back, navigate: vi.fn(), dismissTo: vi.fn() } }));
vi.mock('@/features/settings/provider', () => ({ useSettings: () => ({ language: controls.language }) }));
vi.mock('@/lib/use-app-active', () => ({ useAppActive: () => controls.active }));
vi.mock('@/features/arrival-reminders/native', () => ({ optionalNotifications: () => null, reminderNative: { available: () => false } }));
vi.mock('@react-native-async-storage/async-storage', () => ({ default: { getItem: async () => null, setItem: async () => {} } }));
vi.mock('@/features/auth/provider', () => ({ useAuth: () => ({ session: null, loading: false }) }));
vi.mock('@/features/places/service', () => ({ placesService: { nearby: vi.fn(), details: vi.fn() } }));
vi.mock('@/features/location/use-device-location', () => ({ useDeviceLocation: () => { throw new Error('Catalog must not acquire GPS'); } }));
let client: QueryClient;
let translations: i18n;
let tree: ReactTestRenderer | undefined;
function render(element: React.ReactElement = <DestinationScreen />) { return <I18nextProvider i18n={translations}><QueryClientProvider client={client}>{withHeroUI(element)}</QueryClientProvider></I18nextProvider>; }
async function mount(element?: React.ReactElement) { await act(async () => { tree = create(render(element)); }); }
function output() { return JSON.stringify(tree!.toJSON()); }
function button(key: string) { return tree!.root.findAllByType('button').find(b => b.props.accessibilityLabel === translations.t(key)); }
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true, __DEV__: false });
  Object.assign(controls, { params: { destinationId: 'D01' }, language: 'en', focused: true, active: true, back: true });
  vi.clearAllMocks(); notifyManager.setScheduler(cb => cb());
  client = new QueryClient({ defaultOptions: queryClient.getDefaultOptions() });
  translations = createInstance(); await translations.use(initReactI18next).init({ ...localizationOptions, lng: 'en', react: { useSuspense: false } });
  const original = console.error; vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => { if (!String(args[0]).startsWith('react-test-renderer is deprecated')) original(...args); });
});
afterEach(async () => { await act(async () => tree?.unmount()); tree = undefined; client.clear(); notifyManager.setScheduler(cb => setTimeout(cb, 0)); vi.restoreAllMocks(); });
it('lists all nine provisional names with working stable-ID navigation and no sensors or provider work', async () => {
  await mount(<DestinationsScreen />);
  for (const destination of listDestinations()) {
    expect(output()).toContain(destination.provisionalName);
    const card = tree!.root.findAllByType('button').find(b => b.props.accessibilityLabel === destination.provisionalName)!;
    await act(async () => card.props.onPress());
    expect(router.navigate).toHaveBeenLastCalledWith({ pathname: '/destinations/[destinationId]', params: { destinationId: destination.id } });
  }
  expect(placesService.nearby).not.toHaveBeenCalled(); expect(placesService.details).not.toHaveBeenCalled();
});
it.each(listDestinations())('opens $id directly, honestly representing incomplete content without paid requests', async destination => {
  controls.params = { destinationId: destination.id }; await mount();
  expect(output()).toContain(destination.provisionalName);
  for (const key of ['destinations.provisional', 'destinations.contentPending', 'destinations.centerMissing', 'destinations.entranceMissing']) expect(output()).toContain(translations.t(key));
  expect(button('placeDetails.directions')?.props.disabled).toBe(true);
  expect(placesService.nearby).not.toHaveBeenCalled(); expect(placesService.details).not.toHaveBeenCalled();
});
it.each(listDestinations())('does not emit duplicate sibling keys for $id', async destination => {
  controls.params = { destinationId: destination.id }; await mount();
  const keyWarnings = vi.mocked(console.error).mock.calls.filter(args =>
    args.some(argument => String(argument).includes('same key')));
  expect(keyWarnings).toEqual([]);
});
it.each([undefined, 'D10', ['D01'], '../D01'])('handles an invalid deep link %j and returns safely', async id => {
  controls.params = { destinationId: id }; controls.back = false; await mount();
  expect(output()).toContain(translations.t('destinations.unavailable'));
  await act(async () => button('placeDetails.back')!.props.onPress()); expect(router.navigate).toHaveBeenCalledWith('/destinations');
});
it('uses history for Back and translates missing states with actual resources on locale changes', async () => {
  await mount(); await act(async () => button('placeDetails.back')!.props.onPress()); expect(router.back).toHaveBeenCalledOnce();
  for (const language of ['en', 'ko', 'ja'] as const) {
    controls.language = language;
    await act(async () => { await translations.changeLanguage(language); tree!.update(render()); });
    for (const key of ['destinations.title', 'destinations.provisional', 'destinations.contentPending', 'destinations.centerMissing', 'destinations.entranceMissing']) {
      expect(translations.t(key)).not.toBe(key); expect(output()).toContain(translations.t(key));
    }
  }
  expect(placesService.nearby).not.toHaveBeenCalled();
});
it('shows only localized prearrival teaser instead of approved rich copy', async () => {
 const catalog = await import('./catalog');
 const fixture = catalog.destinationSchema.parse({ id: 'D01', provisionalName: 'Synthetic fixture', copy: { en: { overview: { value: 'Approved test overview', approvalReference: 'Test' } } } });
 vi.spyOn(catalog, 'getDestination').mockReturnValue(fixture);
 await mount();
 for (const language of ['en', 'ja', 'ko'] as const) {
   controls.language = language; await act(async () => { await translations.changeLanguage(language); tree!.update(render()); });
   expect(output()).not.toContain('Approved test overview'); expect(output()).toContain(translations.t('arrival.teaser'));
 }
});
it('routes an approved visitor entrance exactly once without obtaining GPS on the catalog screen', async () => {
 const catalog = await import('./catalog'); const { claimRoutePreviewIntent } = await import('@/features/directions/route-preview-intent');
 const fixture = catalog.destinationSchema.parse({ id: 'D01', provisionalName: 'Synthetic fixture', routeEntrance: { latitude: 0.01, longitude: 0.01 }, routeEntranceApprovalReference: 'Test-only entrance' });
 vi.spyOn(catalog, 'getDestination').mockReturnValue(fixture); await mount();
 await act(async () => { button('placeDetails.directions')!.props.onPress(); button('placeDetails.directions')!.props.onPress(); });
 expect(router.push).toHaveBeenCalledOnce(); const target = vi.mocked(router.push).mock.calls[0][0] as { pathname: string; params: { token: string } };
 expect(target.pathname).toBe('/directions'); expect(claimRoutePreviewIntent(client, target.params.token)).toMatchObject({ place: { provider: 'curated', source: 'curated', id: 'destination:D01', providerId: 'curated_D01', coordinates: fixture.routeEntrance } });
 expect(claimRoutePreviewIntent(client, target.params.token)).toBeNull(); expect(placesService.details).not.toHaveBeenCalled();
 controls.focused = false; await act(async () => tree!.update(render())); controls.focused = true; await act(async () => tree!.update(render())); expect(router.push).toHaveBeenCalledOnce();
});
it('does not create directions intent from an inactive catalog owner', async () => {
 const catalog = await import('./catalog');
 vi.spyOn(catalog, 'getDestination').mockReturnValue(catalog.destinationSchema.parse({ id: 'D01', provisionalName: 'Synthetic fixture', routeEntrance: { latitude: 0, longitude: 0 }, routeEntranceApprovalReference: 'Test' }));
 controls.active = false; await mount(); await act(async () => button('placeDetails.directions')!.props.onPress()); expect(router.push).not.toHaveBeenCalled();
});

it('opens the ACLC pilot card on the existing map without acquiring catalog GPS', async () => {
  await mount(<DestinationsScreen />);
  const card = tree!.root.findAllByType('button').find(b => b.props.accessibilityLabel === 'ACLC College of Ormoc');
  expect(card).toBeDefined();
  await act(async () => card!.props.onPress());
  expect(router.navigate).toHaveBeenCalledWith({ pathname: '/', params: { featuredDestinationId: 'pilot-aclc' } });
  expect(placesService.details).not.toHaveBeenCalled();
});
it('keeps approved featured overview and history out of prearrival 2D details', async () => {
 const catalog = await import('./catalog');
 const fixture = catalog.destinationSchema.parse({ id: 'D01', provisionalName: 'Synthetic featured', copy: { en: { overview: { value: 'Private approved overview', approvalReference: 'test' }, highlights: { value: ['Private approved highlight'], approvalReference: 'test' } } } });
 vi.spyOn(catalog, 'getDestination').mockReturnValue(fixture);
 await mount();
 expect(output()).not.toContain('Private approved overview'); expect(output()).not.toContain('Private approved highlight');
 expect(output()).toContain(translations.t('arrival.teaser'));
});
