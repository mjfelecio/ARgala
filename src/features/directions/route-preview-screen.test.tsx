import { nativeUi, withHeroUI } from '@/test/native-ui';
import * as React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { QueryClient, QueryClientProvider, notifyManager } from '@tanstack/react-query';
import { createInstance, type i18n } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { router } from 'expo-router';
import { queryClient } from '@/lib/query';
import { localizationOptions } from '@/i18n/options';
import type { Place } from '@/features/places/service';
import { createRoutePreviewIntent } from './route-preview-intent';
import { routeService, type WalkingRoute } from './service';
import RoutePreviewScreen from './route-preview-screen';

const controls = vi.hoisted(() => ({ token: undefined as unknown, active: true, focused: true, mapsConfigured: true, language: 'en' as 'en' | 'ko' | 'ja', fit: vi.fn(), animate: vi.fn(), retry: vi.fn(), canBack: true,
  location: { status: 'ready', watcherStatus: 'ready', errorCode: null as string | null, position: { latitude: 38.5, longitude: -120.2 } as { latitude: number; longitude: number } | null, positionTimestamp: Date.now(), watcherTimestamp: Date.now(), accuracy: 8, canAskAgain: true } }));
vi.mock('expo-router', () => ({ useLocalSearchParams: () => ({ token: controls.token }), useIsFocused: () => controls.focused,
  router: { back: vi.fn(), canGoBack: () => controls.canBack, push: vi.fn(), navigate: vi.fn(), dismissTo: vi.fn(), setParams: vi.fn() } }));
vi.mock('expo-constants', () => ({ default: { get expoConfig() { return { extra: { mapsConfigured: controls.mapsConfigured } }; } } }));
vi.mock('@/features/settings/provider', () => ({ useSettings: () => ({ language: controls.language }) }));
vi.mock('@/features/location/use-device-location', () => ({ useDeviceLocation: () => ({ ...controls.location, retry: controls.retry }) }));
vi.mock('@/lib/use-app-active', () => ({ useAppActive: () => controls.active }));
vi.mock('./service', () => ({ routeService: { walking: vi.fn() } }));
vi.mock('react-native-maps', async () => {
  const { createElement, forwardRef, useImperativeHandle } = await import('react');
  return { default: forwardRef((props: Record<string, unknown>, ref) => { useImperativeHandle(ref, () => ({ fitToCoordinates: controls.fit, animateToRegion: controls.animate })); return createElement('map', props); }),
    Marker: 'marker', Polyline: 'polyline', PROVIDER_GOOGLE: 'google' };
});
const place: Place = { id: 'google:north', providerId: 'north', provider: 'google', name: 'Real destination', address: 'Returned address', coordinates: { latitude: 43.252, longitude: -126.453 }, attributions: [{ name: 'Returned credit', uri: 'https://example.com/credit' }] };
const origin = { latitude: 38.5, longitude: -120.2 };
const route: WalkingRoute = { distanceMeters: 867, durationSeconds: 301, encodedPolyline: '_p~iF~ps|U_ulLnnqC_mqNvxq`@', warnings: ['Actual provider warning'] };
const coordinates = [origin, { latitude: 40.7, longitude: -120.95 }, place.coordinates];
let tree: ReactTestRenderer | undefined; let client: QueryClient; let translations: i18n;
function render() { return <I18nextProvider i18n={translations}><QueryClientProvider client={client}>{withHeroUI(<RoutePreviewScreen />)}</QueryClientProvider></I18nextProvider>; }
async function mount() { await act(async () => { tree = create(render()); }); }
async function update() { await act(async () => { tree!.update(render()); }); }
function output() { return JSON.stringify(tree!.toJSON()); }
function button(key: string) { return tree!.root.findAllByType('button').find(b => b.props.accessibilityLabel === translations.t(key)); }
async function press(key: string) { const b = button(key); expect(b, key).toBeDefined(); expect(b!.props.disabled).not.toBe(true); await act(async () => { b!.props.onPress(); }); }
function handoff(existing = true, target = place) { controls.token = createRoutePreviewIntent(client, target, existing ? { origin, route } : undefined); }
async function layout() { await act(async () => {
  tree!.root.findByType('map').props.onLayout({ nativeEvent: { layout: { width: 360, height: 720 } } });
  tree!.root.findByProps({ testID: 'route-preview-dock' }).props.onLayout({ nativeEvent: { layout: { height: 280 } } });
}); }
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true, __DEV__: false }); vi.clearAllMocks();
  Object.assign(controls, { token: undefined, active: true, focused: true, mapsConfigured: true, language: 'en', canBack: true });
  Object.assign(controls.location, { status: 'ready', watcherStatus: 'ready', errorCode: null, position: origin, positionTimestamp: Date.now(), watcherTimestamp: Date.now(), accuracy: 8 });
  vi.mocked(routeService.walking).mockReset().mockResolvedValue(route); nativeUi.openURL.mockReset().mockResolvedValue(undefined);
  client = new QueryClient({ defaultOptions: queryClient.getDefaultOptions() }); notifyManager.setScheduler(cb => cb());
  translations = createInstance(); await translations.use(initReactI18next).init({ ...localizationOptions, lng: 'en', react: { useSuspense: false } });
  const original = console.error; vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => { if (!String(args[0]).startsWith('react-test-renderer is deprecated')) original(...args); });
});
afterEach(async () => { await act(async () => tree?.unmount()); tree = undefined; client.clear(); notifyManager.setScheduler(cb => setTimeout(cb, 0)); vi.restoreAllMocks(); });
it.each([undefined, '', 'unknown', ['bad']])('never requests a route from bare or invalid entry %j', async token => {
  controls.token = token; await mount(); expect(routeService.walking).not.toHaveBeenCalled(); expect(output()).toContain(translations.t('directions.unavailable')); expect(tree!.root.findAllByType('polyline')).toHaveLength(0);
});
it('renders the exact existing route, captured origin, destination and real warnings without requesting', async () => {
  handoff(); controls.location.position = { latitude: 10, longitude: 124 }; await mount();
  expect(routeService.walking).not.toHaveBeenCalled(); expect(tree!.root.findByType('polyline').props.coordinates).toEqual(coordinates);
  expect(tree!.root.findAllByType('marker').find(m => m.props.title === translations.t('directions.origin'))!.props.coordinate).toEqual(origin);
  const target = tree!.root.findAllByType('marker').find(m => m.props.title === place.name)!; expect(target.props.coordinate).toEqual(place.coordinates);
  expect(tree!.root.findByType('polyline').props.strokeColor).toBeDefined(); expect(target.props.pinColor).toBeDefined();
  expect(output()).toContain(translations.t('map.routeSummary', { meters: 867, minutes: 6 })); expect(output()).toContain('Actual provider warning'); expect(output()).toContain(place.address);
  expect(output()).toContain(translations.t('map.walkingCaution')); expect(output()).toContain('Returned credit');
});
it('withholds native padding and fitting until this map instance is ready and measures its dock', async () => {
  handoff(); await mount(); await layout(); expect(tree!.root.findByType('map').props).not.toHaveProperty('mapPadding'); expect(controls.fit).not.toHaveBeenCalled();
  await act(async () => { tree!.root.findByType('map').props.onMapReady(); });
  expect(tree!.root.findByType('map').props.mapPadding.bottom).toBe(280); expect(controls.fit).toHaveBeenCalledWith(coordinates, expect.any(Object));
  controls.fit.mockClear(); controls.location.position = { latitude: 10, longitude: 124 }; await update(); expect(controls.fit).not.toHaveBeenCalled();
  await press('directions.fit'); expect(controls.fit).toHaveBeenCalledOnce(); await press('directions.recenter'); expect(controls.animate).toHaveBeenCalledWith(expect.objectContaining(controls.location.position), expect.any(Number));
});
it('returns to Map with selection or to the selected Place Details without provider work', async () => {
  handoff(); await mount(); await press('directions.map'); expect(router.dismissTo).toHaveBeenCalledWith({ pathname: '/', params: { placeId: place.providerId } });
  await press('directions.details'); expect(router.dismissTo).toHaveBeenCalledWith({ pathname: '/place/[providerId]', params: { providerId: place.providerId } });
  await press('directions.back'); expect(router.back).toHaveBeenCalledOnce(); expect(routeService.walking).not.toHaveBeenCalled();
});
it('shows honest Maps configuration guidance without spending quota', async () => {
  controls.mapsConfigured = false; handoff(false); await mount(); expect(output()).toContain(translations.t('map.missingKey')); expect(routeService.walking).not.toHaveBeenCalled();
});
