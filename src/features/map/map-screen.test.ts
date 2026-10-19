import { nativeUi, withHeroUI } from '@/test/native-ui';
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
  fit: vi.fn(), animate: vi.fn(), active: true, focused: true,
  language: 'en' as 'en' | 'ko' | 'ja',
  position: { latitude: 38.5, longitude: -120.2 },
  params: {} as { placeId?: string },
  hasLocation: true, locationStatus: 'ready', accuracy: 8,
}));
vi.mock('expo-constants', () => ({ default: { expoConfig: { extra: { mapsConfigured: true } } } }));
vi.mock('expo-router', () => ({ router: { navigate: vi.fn(), push: vi.fn(), setParams: vi.fn(() => { controls.params = {}; }) }, useIsFocused: () => controls.focused, useLocalSearchParams: () => controls.params }));
vi.mock('react-native-maps', async () => {
  const { createElement, forwardRef, useImperativeHandle } = await import('react');
  const MapView = forwardRef((props: Record<string, unknown>, ref) => {
    useImperativeHandle(ref, () => ({ fitToCoordinates: controls.fit, animateToRegion: controls.animate }));
    return createElement('map', props);
  });
  return { default: MapView, Circle: 'circle', Marker: 'marker', Polyline: 'polyline', PROVIDER_GOOGLE: 'google' };
});
vi.mock('@/features/settings/provider', () => ({ useSettings: () => ({ activationRadiusMeters: 100, language: controls.language }) }));
vi.mock('@/features/location/use-device-location', () => ({ useDeviceLocation: () => ({ position: controls.hasLocation ? controls.position : null, accuracy: controls.accuracy, status: controls.locationStatus, retry: vi.fn() }) }));
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
function renderMap() { return React.createElement(I18nextProvider, { i18n: translations }, React.createElement(QueryClientProvider, { client }, withHeroUI(React.createElement(MapScreen)))); }
async function press(title: string) {
  const action = tree!.root.findAllByType('button').find((button) => (button.props.title ?? button.props.accessibilityLabel) === translations.t(title));
  expect(action).toBeDefined();
  await act(async () => { action!.props.onPress(); });
}
async function startRoute(laidOut = true) {
  await act(async () => { tree = create(renderMap()); });
  if (laidOut) await act(async () => { tree!.root.findByType('map').props.onLayout({ nativeEvent: { layout: { width: 360, height: 720 } } }); });
  await act(async () => { tree!.root.findByType('map').props.onMapReady(); });
  await act(async () => {
    const sheet=tree!.root.findByType('dialog'); sheet.props.onChange(0, sheet.props.containerLayoutState.get().height - 120);
    tree!.root.findAllByType('view').find(n => n.props.testID === 'home-map-controls')!.props.onLayout({ nativeEvent: { layout: { height: 96 } } });
  });
  await press('map.search');
  await act(async () => { tree!.root.findByType('marker').props.onPress(); });
  await press('map.walk');
}
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true, __DEV__: false });
  controls.hasLocation = true; controls.locationStatus = 'ready'; controls.accuracy = 8;
  controls.params = {}; controls.fit.mockReset(); controls.animate.mockReset(); controls.active = true; controls.focused = true;
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
it('withholds native map padding through layout and lifecycle updates until Google Maps is ready', async () => {
  await act(async () => { tree = create(renderMap()); });
  expect(tree!.root.findByType('map').props).not.toHaveProperty('mapPadding');
  // Android can have nonzero layout while its GoogleMap reference is still null.
  await act(async () => {
    tree!.root.findByType('map').props.onLayout({ nativeEvent: { layout: { width: 360, height: 720 } } });
    tree!.root.findByProps({ testID: 'home-map-controls' }).props.onLayout({ nativeEvent: { layout: { height: 96 } } });
  });
  await act(async () => {
    const sheet = tree!.root.findByType('dialog');
    sheet.props.onChange(0, sheet.props.containerLayoutState.get().height - 240);
  });
  controls.active = false;
  await act(async () => { tree!.update(renderMap()); });
  controls.active = true;
  await act(async () => { tree!.update(renderMap()); });
  expect(tree!.root.findByType('map').props).not.toHaveProperty('mapPadding');
  expect(controls.fit).not.toHaveBeenCalled();
  await act(async () => { tree!.root.findByType('map').props.onMapReady(); });
  expect(tree!.root.findByType('map').props.mapPadding).toEqual({ top: 96, bottom: 240, left: 8, right: 8 });
  await act(async () => {
    const sheet = tree!.root.findByType('dialog');
    sheet.props.onChange(0, sheet.props.containerLayoutState.get().height - 280);
  });
  expect(tree!.root.findByType('map').props.mapPadding.bottom).toBe(280);
  expect(placesService.nearby).not.toHaveBeenCalled();
  expect(placesService.details).not.toHaveBeenCalled();
  expect(routeService.walking).not.toHaveBeenCalled();
});
it('retains the map through a focus-driven GPS restart without requiring new native readiness', async () => {
  await act(async () => { tree = create(renderMap()); });
  await act(async () => { tree!.root.findByType('map').props.onMapReady(); });
  expect(tree!.root.findByType('map').props.mapPadding).toBeDefined();
  controls.hasLocation = false;
  await act(async () => { tree!.update(renderMap()); });
  expect(tree!.root.findAllByType('map')).toHaveLength(1);
  controls.hasLocation = true;
  await act(async () => { tree!.update(renderMap()); });
  await act(async () => { tree!.root.findByType('map').props.onLayout({ nativeEvent: { layout: { width: 360, height: 720 } } }); });
  expect(tree!.root.findByType('map').props).toHaveProperty('mapPadding');
  await act(async () => { tree!.root.findByType('map').props.onMapReady(); });
  expect(tree!.root.findByType('map').props.mapPadding).toBeDefined();
  expect(placesService.nearby).not.toHaveBeenCalled();
  expect(placesService.details).not.toHaveBeenCalled();
  expect(routeService.walking).not.toHaveBeenCalled();
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
  const content = JSON.stringify(tree!.toJSON());
  expect(content).toContain(message);
  expect(content).not.toContain(failure.message);
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
 await press('map.camera'); expect(router.navigate).toHaveBeenLastCalledWith('/ar');
 expect(tree!.root.findAllByType('button').some(b => b.props.accessibilityLabel === translations.t('map.settings'))).toBe(false);
 controls.focused = false; controls.active = false;
 await act(async () => { tree!.update(renderMap()); });
 controls.focused = true; controls.active = true; controls.language = 'ja';
 await act(async () => { await translations.changeLanguage('ja'); tree!.update(renderMap()); await client.invalidateQueries(); });
 expect(placesService.nearby).not.toHaveBeenCalled(); expect(placesService.details).not.toHaveBeenCalled(); expect(routeService.walking).not.toHaveBeenCalled();
 await press('map.search'); expect(placesService.nearby).toHaveBeenCalledTimes(1);
});
it('frames routes above measured overlays without double-counting Android padding', async () => {
 await startRoute();
 const panel=tree!.root.findByType('dialog');
 const header=tree!.root.findAllByType('view').find(n=>n.props.testID==='home-map-controls');
 expect(panel).toBeDefined(); expect(header).toBeDefined();
 await act(async()=>{
  tree!.root.findByType('map').props.onLayout({nativeEvent:{layout:{width:360,height:720}}});
  panel!.props.onChange(0, panel!.props.containerLayoutState.get().height - 240);
  header!.props.onLayout({nativeEvent:{layout:{height:180}}});
 });
 await act(async()=>request.resolve(walkingRoute));
 const padding=tree!.root.findByType('map').props.mapPadding;
 expect(padding.top).toBeGreaterThanOrEqual(180); expect(padding.bottom).toBeGreaterThanOrEqual(240);
 const fitPadding=controls.fit.mock.lastCall![1].edgePadding;
 expect(padding.top+fitPadding.top+padding.bottom+fitPadding.bottom).toBeLessThan(720);
 expect(fitPadding.bottom).toBeLessThan(240);
 const calls=controls.fit.mock.calls.length;
 await act(async()=>panel!.props.onChange(1, panel!.props.containerLayoutState.get().height - 320));
 expect(controls.fit.mock.calls.length).toBeGreaterThan(calls);
 expect(placesService.nearby).toHaveBeenCalledTimes(1); expect(placesService.details).toHaveBeenCalledTimes(1); expect(routeService.walking).toHaveBeenCalledTimes(1);
});
it('expands and collapses selected content without fetching and preserves Google credits', async () => {
 await startRoute(); await act(async()=>request.resolve({...walkingRoute,warnings:['Returned warning']}));
 await press('map.expand'); await press('map.collapse');
 expect(JSON.stringify(tree!.toJSON())).toContain('Returned warning');
 expect(tree!.root.findByType('aside').props.places).toContainEqual(destination);
 expect(placesService.nearby).toHaveBeenCalledTimes(1); expect(placesService.details).toHaveBeenCalledTimes(1); expect(routeService.walking).toHaveBeenCalledTimes(1);
});

it.each(['denied','disabled'])('keeps %s location guidance and recovery visible with no active Search', async (status) => {
 controls.hasLocation=false; controls.locationStatus=status;
 await act(async()=>{ tree=create(renderMap()); });
 expect(JSON.stringify(tree!.toJSON())).toContain(translations.t(`location.${status}`));
 expect(tree!.root.findAllByType('map')).toHaveLength(0);
 expect(tree!.root.findAllByType('button').some(b=>(b.props.title??b.props.accessibilityLabel)===translations.t('location.retry'))).toBe(true);
 expect(placesService.nearby).not.toHaveBeenCalled();
});
it('retains approximate-location feedback alongside usable discovery controls', async () => {
 controls.accuracy=500;
 await act(async()=>{ tree=create(renderMap()); });
 expect(JSON.stringify(tree!.toJSON())).toContain(translations.t('location.approximate',{meters:500}));
 expect(placesService.nearby).not.toHaveBeenCalled();
});

it('hides the paid details action after success, including expansion, and recovers explicitly after cache reset', async () => {
 await startRoute();
 await press('map.expand');
 const detailButtons=()=>tree!.root.findAllByType('button').filter(b=>(b.props.title??b.props.accessibilityLabel)===translations.t('ar.more'));
 expect(detailButtons()).toHaveLength(0);
 expect(placesService.details).toHaveBeenCalledTimes(1);
 await act(async()=>client.resetQueries({queryKey:['place-details']}));
 expect(detailButtons()).toHaveLength(1);
 expect(placesService.details).toHaveBeenCalledTimes(1);
 await press('ar.more');
 expect(placesService.details).toHaveBeenCalledTimes(2);
 expect(detailButtons()).toHaveLength(0);
});

it('updates Google credit padding during a sheet gesture and fits a route only after settling', async () => {
 await startRoute(); await act(async()=>request.resolve(walkingRoute));
 const calls=controls.fit.mock.calls.length;
 const sheet=tree!.root.findByType('dialog');
 await act(async()=>{ sheet.props.animatedPosition.set(440); nativeUi.reactions.forEach(tick=>tick()); });
 expect(tree!.root.findByType('map').props.mapPadding.bottom).toBe(280);
 expect(controls.fit).toHaveBeenCalledTimes(calls);
 await act(async()=>sheet.props.onChange(1,440));
 expect(controls.fit.mock.calls.length).toBeGreaterThan(calls);
 expect(placesService.nearby).toHaveBeenCalledTimes(1); expect(placesService.details).toHaveBeenCalledTimes(1); expect(routeService.walking).toHaveBeenCalledTimes(1);
});
it('keeps summary-only details recovery explicit through failure, expansion and language changes', async () => {
 vi.mocked(placesService.details).mockRejectedValueOnce(new EdgeRequestError('RATE_LIMITED'));
 await act(async()=>{ tree=create(renderMap()); });
 await act(async()=>tree!.root.findByType('map').props.onMapReady());
 await press('map.search'); await act(async()=>tree!.root.findByType('marker').props.onPress());
 expect(JSON.stringify(tree!.toJSON())).toContain(destination.name);
 expect(JSON.stringify(tree!.toJSON())).toContain(translations.t('service.rateLimited'));
 await press('map.expand');
 await act(async()=>{ await translations.changeLanguage('ja'); });
 expect(JSON.stringify(tree!.toJSON())).toContain(translations.t('service.rateLimited'));
 expect(placesService.details).toHaveBeenCalledTimes(1);
 await press('ar.more');
 expect(placesService.details).toHaveBeenCalledTimes(2);
 expect(tree!.root.findAllByType('button').some(b=>b.props.accessibilityLabel===translations.t('ar.more'))).toBe(false);
});

it('retains expanded route geometry when header size changes without a new native snap-index event', async () => {
 await startRoute(); await act(async()=>request.resolve(walkingRoute));
 let sheet=tree!.root.findByType('dialog');
 await act(async()=>sheet.props.onChange(1,sheet.props.containerLayoutState.get().height-sheet.props.snapPoints[1]));
 await act(async()=>tree!.root.findByProps({testID:'home-map-controls'}).props.onLayout({nativeEvent:{layout:{height:180}}}));
 sheet=tree!.root.findByType('dialog');
 expect(sheet.props.snapPoints[1]).toBe(476);
 expect(tree!.root.findByType('map').props.mapPadding.bottom).toBe(476);
 expect(controls.fit.mock.lastCall![1].edgePadding.top).toBe(16);
});
it('publishes the final same-index bounce position even inside the gesture update interval', async () => {
 await startRoute();
 const sheet=tree!.root.findByType('dialog'); const peek=sheet.props.snapPoints[0];
 await act(async()=>{ sheet.props.animatedPosition.set(720-peek-40); nativeUi.reactions.forEach(tick=>tick()); });
 expect(tree!.root.findByType('map').props.mapPadding.bottom).toBeCloseTo(peek+40);
 await act(async()=>{ sheet.props.animatedPosition.set(720-peek); nativeUi.reactions.forEach(tick=>tick()); });
 expect(tree!.root.findByType('map').props.mapPadding.bottom).toBeCloseTo(peek);
});

// Focus changes restart GPS before the next fix. The retained map must keep
// selection, route observers and native readiness through that interval.
it('preserves selected POI, route and expanded sheet through tab switches and GPS startup', async () => {
 await startRoute();
 await act(async () => { request.resolve(walkingRoute); });
 await press('map.expand');
 const mapInstance = tree!.root.findByType('map');
 expect(tree!.root.findAllByType('button').find(b => b.props.accessibilityLabel === translations.t('map.collapse'))!.props.accessibilityState.expanded).toBe(true);
 for (const focused of [false, true]) {
  controls.focused = focused; controls.hasLocation = false;
  await act(async () => { tree!.update(renderMap()); });
  expect(tree!.root.findByType('map')).toBe(mapInstance);
  expect(tree!.root.findByType('polyline').props.coordinates).toEqual(coordinates);
  expect(tree!.root.findAllByType('button').find(b => b.props.accessibilityLabel === translations.t('map.collapse'))!.props.accessibilityState.expanded).toBe(true);
  expect(tree!.root.findAllByType('button').find(b => b.props.accessibilityLabel === 'Search Nearby')!.props.disabled).toBe(true);
 }
 controls.hasLocation = true;
 await act(async () => { tree!.update(renderMap()); });
 expect(tree!.root.findAllByType('button').find(b => b.props.accessibilityLabel === 'Search Nearby')!.props.disabled).toBe(false);
 expect(placesService.nearby).toHaveBeenCalledTimes(1);
 expect(placesService.details).toHaveBeenCalledTimes(1);
 expect(routeService.walking).toHaveBeenCalledTimes(1);
});

it('keeps the expanded sheet and Google credits within the smaller scene above the tab bar', async () => {
 await startRoute();
 await act(async () => { request.resolve(walkingRoute); });
 await press('map.expand');
 // The navigator owns the bottom inset; the map must not reserve it again.
 expect(tree!.root.findByType('safe-area' as React.ElementType).props.edges).toEqual(['left', 'right']);
 await act(async () => { tree!.root.findByType('map').props.onLayout({ nativeEvent: { layout: { width: 360, height: 580 } } }); });
 const sheet = tree!.root.findByType('dialog');
 expect(tree!.root.findAllByType('button').find(b => b.props.accessibilityLabel === translations.t('map.collapse'))!.props.accessibilityState.expanded).toBe(true);
 expect(sheet.props.containerLayoutState.get().height).toBe(580);
 const padding = tree!.root.findByType('map').props.mapPadding;
 expect(padding.bottom).toBe(sheet.props.snapPoints[1]);
 expect(padding.bottom).toBeGreaterThan(0);
 expect(padding.top + padding.bottom).toBeLessThan(580);
 expect(tree!.root.findAllByType('aside')).toHaveLength(1);
 expect(placesService.nearby).toHaveBeenCalledTimes(1);
 expect(routeService.walking).toHaveBeenCalledTimes(1);
});
it('opens the protected Details page from a selected Map POI with its cached summary and no extra request', async () => {
  client.setQueryData(['place-selection', destination.providerId], destination); controls.params = { placeId: destination.providerId };
  await act(async () => { tree = create(renderMap()); });
  await press('placeDetails.view');
  expect(router.navigate).toHaveBeenLastCalledWith({ pathname: '/place/[providerId]', params: { providerId: destination.providerId } });
  expect(client.getQueryData(['place-selection', destination.providerId])).toEqual(destination);
  expect(placesService.details).not.toHaveBeenCalled(); expect(placesService.nearby).not.toHaveBeenCalled(); expect(routeService.walking).not.toHaveBeenCalled();
  controls.focused = false; await act(async () => tree!.update(renderMap())); controls.focused = true; await act(async () => tree!.update(renderMap()));
  expect(JSON.stringify(tree!.toJSON())).toContain(destination.name); expect(placesService.details).not.toHaveBeenCalled();
});
it('centers a Details handoff only when the existing native map is ready without a provider call', async () => {
  client.setQueryData(['place-selection', destination.providerId], destination); controls.params = { placeId: destination.providerId };
  await act(async () => { tree = create(renderMap()); }); expect(controls.animate).not.toHaveBeenCalled();
  await act(async () => { tree!.root.findByType('map').props.onMapReady(); });
  expect(controls.animate).toHaveBeenCalledExactlyOnceWith({ ...destination.coordinates, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 400);
  controls.focused = false; await act(async () => tree!.update(renderMap())); controls.focused = true; await act(async () => tree!.update(renderMap()));
  expect(controls.animate).toHaveBeenCalledTimes(1); expect(placesService.details).not.toHaveBeenCalled(); expect(routeService.walking).not.toHaveBeenCalled();
});

it('opens View Route with the completed result and captured origin, without spending again, and preserves Home route on Back', async () => {
  const { claimRoutePreviewIntent } = await import('@/features/directions/route-preview-intent');
  await startRoute(); await act(async () => { request.resolve(walkingRoute); });
  const action = tree!.root.findAllByType('button').find(b => b.props.accessibilityLabel === translations.t('directions.view'));
  expect(action).toBeDefined(); controls.position = { latitude: 10, longitude: 124 }; await act(async () => { tree!.update(renderMap()); });
  await act(async () => { action!.props.onPress(); action!.props.onPress(); });
  expect(router.push).toHaveBeenCalledOnce(); const opened = vi.mocked(router.push).mock.calls[0][0] as { pathname: string; params: { token: string } };
  expect(opened.pathname).toBe('/directions'); expect(claimRoutePreviewIntent(client, opened.params.token)).toMatchObject({ source: 'map', place: destination, existing: { origin: { latitude: 38.5, longitude: -120.2 }, route: walkingRoute } });
  expect(routeService.walking).toHaveBeenCalledOnce(); controls.focused = false; await act(async () => { tree!.update(renderMap()); });
  controls.params = { placeId: destination.providerId }; controls.focused = true; await act(async () => { tree!.update(renderMap()); });
  expect(tree!.root.findByType('polyline').props.coordinates).toEqual(coordinates); expect(routeService.walking).toHaveBeenCalledOnce();
});
