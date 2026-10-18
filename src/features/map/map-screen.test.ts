import * as React from 'react';
import { createInstance, type i18n } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { QueryClient, QueryClientProvider, notifyManager } from '@tanstack/react-query';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { router } from 'expo-router';
import { routeService, type WalkingRoute } from '@/features/directions/service';
import { placesService, type Place } from '@/features/places/service';
import { queryClient } from '@/lib/query';
import { EdgeRequestError } from '@/lib/edge-error';
import { localizationOptions } from '@/i18n/options';
import MapScreen from './map-screen';

const controls = vi.hoisted(() => ({
  fit: vi.fn(), active: true, focused: true,
  language: 'en' as 'en' | 'ko' | 'ja',
  position: { latitude: 38.5, longitude: -120.2 },
  params: {} as { placeId?: string },
}));
vi.mock('expo-constants', () => ({ default: { expoConfig: { extra: { mapsConfigured: true } } } }));
vi.mock('expo-router', () => ({ router: { push: vi.fn(), setParams: vi.fn(() => { controls.params = {}; }) }, useIsFocused: () => controls.focused, useLocalSearchParams: () => controls.params }));
vi.mock('react-native', () => ({ View: 'view', Text: 'text', ScrollView: 'scroll', Pressable: 'button', ActivityIndicator: 'progress', StyleSheet: { create: (styles: unknown) => styles } }));
vi.mock('react-native-maps', async () => {
  const { createElement, forwardRef, useImperativeHandle } = await import('react');
  const MapView = forwardRef((props: Record<string, unknown>, ref) => {
    useImperativeHandle(ref, () => ({ fitToCoordinates: controls.fit }));
    return createElement('map', props);
  });
  return { default: MapView, Circle: 'circle', Marker: 'marker', Polyline: 'polyline', PROVIDER_GOOGLE: 'google' };
});
vi.mock('@/features/settings/provider', () => ({ useSettings: () => ({ activationRadiusMeters: 100, language: controls.language }) }));
vi.mock('@/features/location/use-device-location', () => ({ useDeviceLocation: () => ({ position: controls.position, accuracy: 8 }) }));
vi.mock('@/features/location/status', () => ({ LocationStatus: () => null }));
vi.mock('@/lib/use-app-active', () => ({ useAppActive: () => controls.active }));
vi.mock('@/features/places/service', () => ({ placesService: { nearby: vi.fn(), details: vi.fn() } }));
vi.mock('@/features/directions/service', () => ({ routeService: { walking: vi.fn() } }));
vi.mock('./attributions', async () => {
  const { createElement } = await import('react');
  return { ProviderAttributions: (props: Record<string, unknown>) => createElement('aside', props), useOpenProviderLink: () => vi.fn() };
});
vi.mock('@/ui/shared', async () => {
  const { createElement } = await import('react');
  return { Screen: 'screen', Notice: 'output', Action: (props: Record<string, unknown>) => createElement('button', props) };
});
const destination: Place = { id: 'google:destination', provider: 'google', providerId: 'destination', name: 'Destination', coordinates: { latitude: 43.252, longitude: -126.453 }, attributions: [] };
const walkingRoute: WalkingRoute = { encodedPolyline: '_p~iF~ps|U_ulLnnqC_mqNvxq`@', distanceMeters: 800000, durationSeconds: 600000, warnings: [] };
const coordinates = [{ latitude: 38.5, longitude: -120.2 }, { latitude: 40.7, longitude: -120.95 }, { latitude: 43.252, longitude: -126.453 }];
let client: QueryClient;
let translations: i18n;
let tree: ReactTestRenderer | undefined;
let request: PromiseWithResolvers<WalkingRoute>;
function renderMap() { return React.createElement(I18nextProvider, { i18n: translations }, React.createElement(QueryClientProvider, { client }, React.createElement(MapScreen))); }
async function press(title: string) {
  const action = tree!.root.findAllByType('button').find((button) => (button.props.title ?? button.props.accessibilityLabel) === translations.t(title));
  expect(action).toBeDefined();
  await act(async () => { action!.props.onPress(); });
}
async function startRoute(laidOut = true) {
  await act(async () => { tree = create(renderMap()); });
  if (laidOut) await act(async () => { tree!.root.findByType('map').props.onLayout({ nativeEvent: { layout: { width: 360, height: 320 } } }); });
  await act(async () => { tree!.root.findByType('map').props.onMapReady(); });
  await press('map.search');
  await act(async () => { tree!.root.findByType('marker').props.onPress(); });
  await press('map.walk');
}
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  controls.params = {}; controls.fit.mockReset(); controls.active = true; controls.focused = true;
  controls.language = 'en';
  translations = createInstance();
  await translations.use(initReactI18next).init({ ...localizationOptions, lng: 'en', react: { useSuspense: false } });
  controls.position = { latitude: 38.5, longitude: -120.2 };
  // Deliver query notifications within act, without depending on timer timing.
  notifyManager.setScheduler((callback) => callback());
  client = new QueryClient({ defaultOptions: queryClient.getDefaultOptions() });
  vi.mocked(placesService.nearby).mockReset().mockResolvedValue([destination]);
  vi.mocked(placesService.details).mockReset().mockResolvedValue(destination);
  request = Promise.withResolvers<WalkingRoute>();
  vi.mocked(routeService.walking).mockReset().mockReturnValue(request.promise);
  const original = console.error;
  vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => { if (!String(args[0]).startsWith('react-test-renderer is deprecated')) original(...args); });
});
afterEach(async () => {
  await act(async () => tree?.unmount()); tree = undefined; client.clear();
  notifyManager.setScheduler((callback) => setTimeout(callback, 0));
  vi.restoreAllMocks();
});
it('fits the loaded walking polyline with padding and keeps the viewport stable on GPS updates', async () => {
  await startRoute();
  expect(controls.fit).not.toHaveBeenCalled();
  expect(routeService.walking).toHaveBeenCalledWith({ origin: { latitude: 38.5, longitude: -120.2 }, destination: destination.coordinates, language: 'en' });
  await act(async () => { request.resolve(walkingRoute); });
  expect(tree!.root.findByType('polyline').props.coordinates).toEqual(coordinates);
  expect(controls.fit).toHaveBeenCalledTimes(1);
  const [fitted, options] = controls.fit.mock.calls[0];
  expect(fitted).toEqual(coordinates);
  expect(options.animated).toBe(true);
  for (const side of ['top', 'right', 'bottom', 'left']) expect(options.edgePadding[side]).toBeGreaterThanOrEqual(32);
  controls.position = { latitude: 38.501, longitude: -120.201 };
  await act(async () => { tree!.update(renderMap()); });
  expect(controls.fit).toHaveBeenCalledTimes(1);
});
it('does not update the viewport when a walking request fails', async () => {
  await startRoute();
  await act(async () => { request.reject(new Error('Route unavailable')); });
  expect(tree!.root.findAllByType('polyline')).toHaveLength(0);
  expect(controls.fit).not.toHaveBeenCalled();
});
it('defers fitting an in-flight result until the map regains focus', async () => {
  await startRoute();
  controls.focused = false;
  await act(async () => { tree!.update(renderMap()); });
  await act(async () => { request.resolve(walkingRoute); });
  expect(controls.fit).not.toHaveBeenCalled();
  controls.focused = true;
  await act(async () => { tree!.update(renderMap()); });
  expect(controls.fit).toHaveBeenCalledWith(coordinates, expect.any(Object));
});
it('waits for a nonzero Android map layout before fitting a loaded route', async () => {
  await startRoute(false);
  await act(async () => { request.resolve(walkingRoute); });
  expect(controls.fit).not.toHaveBeenCalled();
  await act(async () => { tree!.root.findByType('map').props.onLayout({ nativeEvent: { layout: { width: 360, height: 0 } } }); });
  expect(controls.fit).not.toHaveBeenCalled();
  await act(async () => { tree!.root.findByType('map').props.onLayout({ nativeEvent: { layout: { width: 360, height: 320 } } }); });
  expect(controls.fit).toHaveBeenCalledWith(coordinates, expect.any(Object));
});
it.each(['focused', 'active'] as const)('does not repeat paid queries after %s changes or location-driven remounts', async (lifecycle) => {
  await startRoute();
  await act(async () => { request.resolve(walkingRoute); });
  for (let navigation = 0; navigation < 2; navigation++) {
    controls[lifecycle] = false;
    await act(async () => { tree!.update(renderMap()); });
    controls[lifecycle] = true;
    await act(async () => { tree!.update(renderMap()); });
  }
  expect(placesService.nearby).toHaveBeenCalledTimes(1);
  expect(placesService.details).toHaveBeenCalledTimes(1);
  expect(routeService.walking).toHaveBeenCalledTimes(1);
  await act(async () => { tree!.unmount(); });
  // Location restarts can remove the map observer; production immediately discards unused data.
  await new Promise((resolve) => setTimeout(resolve, 0));
  controls.position = { latitude: 38.51, longitude: -120.21 };
  await act(async () => { tree = create(renderMap()); });
  await act(async () => { tree!.root.findByType('map').props.onMapReady(); });
  expect(placesService.nearby).toHaveBeenCalledTimes(1);
  expect(placesService.details).toHaveBeenCalledTimes(1);
  expect(routeService.walking).toHaveBeenCalledTimes(1);
  await press('map.search');
  expect(placesService.nearby).toHaveBeenCalledTimes(2);
  expect(placesService.nearby).toHaveBeenLastCalledWith({ center: { latitude: 38.51, longitude: -120.21 }, radiusMeters: 1000, language: 'en' });
});
it('requests nearby results only on Search, including repeated searches at the same coordinates', async () => {
  await act(async () => { tree = create(renderMap()); });
  await act(async () => { tree!.root.findByType('map').props.onMapReady(); });
  expect(placesService.nearby).not.toHaveBeenCalled();
  await press('map.search');
  expect(tree!.root.findAllByType('marker')).toHaveLength(1);
  await press('map.search');
  expect(placesService.nearby).toHaveBeenCalledTimes(2);
  controls.position = { latitude: 38.52, longitude: -120.22 };
  await act(async () => { tree!.update(renderMap()); });
  expect(placesService.nearby).toHaveBeenCalledTimes(2);
  await press('map.search');
  expect(placesService.nearby).toHaveBeenCalledTimes(3);
  expect(placesService.nearby).toHaveBeenLastCalledWith({ center: { latitude: 38.52, longitude: -120.22 }, radiusMeters: 1000, language: 'en' });
});
it('does not retry a failed nearby request on refocus and allows an explicit Search retry', async () => {
  vi.mocked(placesService.nearby).mockRejectedValueOnce(new Error('Nearby unavailable'));
  await act(async () => { tree = create(renderMap()); });
  await act(async () => { tree!.root.findByType('map').props.onMapReady(); });
  await press('map.search');
  controls.focused = false;
  await act(async () => { tree!.update(renderMap()); });
  controls.focused = true;
  await act(async () => { tree!.update(renderMap()); });
  expect(placesService.nearby).toHaveBeenCalledTimes(1);
  await press('map.search');
  expect(placesService.nearby).toHaveBeenCalledTimes(2);
  expect(tree!.root.findAllByType('marker')).toHaveLength(1);
});
it.each([
  { stage: 'nearby', code: 'RATE_LIMITED', language: 'ko', message: '요청이 너무 많습니다. 1분 후에 다시 시도하세요.' },
  { stage: 'details', code: 'UPSTREAM_ERROR', language: 'ja', message: 'サービスを利用できません。接続を確認して再試行してください。' },
  { stage: 'route', code: 'ROUTE_UNAVAILABLE', language: 'ko', message: '이 목적지로 가는 도보 경로가 없습니다.' },
  { stage: 'nearby', code: 'FUTURE_ERROR', language: 'ja', message: 'リクエストを完了できませんでした。再試行してください。' },
  { stage: 'details', code: 'toString', language: 'ko', message: '요청을 완료하지 못했습니다. 다시 시도하세요.' },
  { stage: 'route', code: null, language: 'ja', message: 'リクエストを完了できませんでした。再試行してください。' },
] as const)('translates $stage failures in $language ($code) without displaying provider text', async ({ stage, code, language, message }) => {
  controls.language = language;
  await translations.changeLanguage(language);
  const failure = code === null ? new Error('Raw provider English') : new EdgeRequestError(code);
  if (stage === 'nearby') vi.mocked(placesService.nearby).mockRejectedValue(failure);
  if (stage === 'details') vi.mocked(placesService.details).mockRejectedValue(failure);
  if (stage === 'route') vi.mocked(routeService.walking).mockRejectedValue(failure);
  await act(async () => { tree = create(renderMap()); });
  await act(async () => { tree!.root.findByType('map').props.onMapReady(); });
  await press('map.search');
  if (stage !== 'nearby') await act(async () => { tree!.root.findByType('marker').props.onPress(); });
  if (stage === 'route') await press('map.walk');
  const notices = tree!.root.findAllByType('output').map((node) => node.props.children);
  expect(notices).toContain(message);
  expect(notices).not.toContain(failure.message);
});

it('accepts an AR Place ID from memory without paid calls and reuses the walking route flow', async () => {
  client.setQueryData(['place-selection', destination.providerId], destination);
  controls.params = { placeId: destination.providerId };
  await act(async () => { tree = create(renderMap()); });
  await act(async () => { tree!.root.findByType('map').props.onMapReady(); });
  expect(JSON.stringify(tree!.toJSON())).toContain(destination.name);
  expect(placesService.nearby).not.toHaveBeenCalled();
  expect(placesService.details).not.toHaveBeenCalled();
  expect(tree!.root.findByType('aside').props.places).toContainEqual(destination);
  await press('map.walk');
  expect(routeService.walking).toHaveBeenCalledWith({ origin: controls.position, destination: destination.coordinates, language: 'en' });
  await act(async () => { request.resolve(walkingRoute); });
  expect(tree!.root.findAllByType('polyline')).toHaveLength(1);
});
it('consumes a new AR selection on an existing map without automatic details calls', async () => {
  await act(async () => { tree = create(renderMap()); });
  await act(async () => { tree!.root.findByType('map').props.onMapReady(); });
  client.setQueryData(['place-selection', destination.providerId], destination);
  controls.params = { placeId: destination.providerId };
  await act(async () => { tree!.update(renderMap()); });
  expect(JSON.stringify(tree!.toJSON())).toContain(destination.name);
  expect(placesService.details).not.toHaveBeenCalled();
  await press('map.walk'); expect(routeService.walking).toHaveBeenCalledTimes(1);
});
it('reopens the same consumed AR Place ID after closing the selection', async () => {
  client.setQueryData(['place-selection', destination.providerId], destination);
  controls.params = { placeId: destination.providerId };
  await act(async () => { tree = create(renderMap()); });
  await act(async () => { tree!.root.findByType('map').props.onMapReady(); });
  await press('map.closePlace');
  expect(tree!.root.findAllByType('button').some((b) => (b.props.title ?? b.props.accessibilityLabel) === translations.t('map.walk'))).toBe(false);
  controls.params = { placeId: destination.providerId };
  await act(async () => { tree!.update(renderMap()); });
  expect(tree!.root.findAllByType('button').some((b) => (b.props.title ?? b.props.accessibilityLabel) === translations.t('map.walk'))).toBe(true);
  expect(placesService.details).not.toHaveBeenCalled();
});
it('offers an explicit details request when the handoff has expired', async () => {
  controls.params = { placeId: destination.providerId };
  await act(async () => { tree = create(renderMap()); });
  await act(async () => { tree!.root.findByType('map').props.onMapReady(); });
  expect(JSON.stringify(tree!.toJSON())).toContain(translations.t('map.selectionUnavailable'));
  expect(placesService.details).not.toHaveBeenCalled();
  await press('ar.more'); expect(placesService.details).toHaveBeenCalledWith(destination.providerId, 'en');
  expect(tree!.root.findAllByType('button').some((b) => (b.props.title ?? b.props.accessibilityLabel) === translations.t('map.walk'))).toBe(true);
});

it('offers floating Home controls and spends nothing on mount, pan, locale, navigation or invalidation', async () => {
 await act(async () => { tree = create(renderMap()); });
 await act(async () => { tree!.root.findByType('map').props.onMapReady(); });
 expect(tree!.root.findAllByType('button').filter(b => b.props.accessibilityRole === 'button')).toHaveLength(4);
 // Native region changes have no paid-refresh handler.
 await act(async () => { tree!.root.findByType('map').props.onRegionChangeComplete?.({ latitude: 10, longitude: 20 }); });
 await press('map.camera'); expect(router.push).toHaveBeenLastCalledWith('/ar');
 await press('map.settings'); expect(router.push).toHaveBeenLastCalledWith('/settings');
 controls.focused = false; controls.active = false;
 await act(async () => { tree!.update(renderMap()); });
 controls.focused = true; controls.active = true; controls.language = 'ja';
 await act(async () => { await translations.changeLanguage('ja'); tree!.update(renderMap()); await client.invalidateQueries(); });
 expect(placesService.nearby).not.toHaveBeenCalled(); expect(placesService.details).not.toHaveBeenCalled(); expect(routeService.walking).not.toHaveBeenCalled();
 await press('map.search'); expect(placesService.nearby).toHaveBeenCalledTimes(1);
});
