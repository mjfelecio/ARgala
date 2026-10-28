import { nativeUi, withHeroUI } from '@/test/native-ui';
import * as React from 'react';
import { createInstance, type i18n } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { QueryClient, QueryClientProvider, notifyManager } from '@tanstack/react-query';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { routeService, type WalkingRoute } from '@/features/directions/service';
import { placesService, type Place } from '@/features/places/service';
import { queryClient } from '@/lib/query';
import { EdgeRequestError } from '@/lib/edge-error';
import { localizationOptions } from '@/i18n/options';
import MapScreen from './map-screen';
import { MapRecenter } from './map-recenter';

const controls = vi.hoisted(() => ({
  fit: vi.fn(), animate: vi.fn(), active: true, focused: true,
  language: 'en' as 'en' | 'ko' | 'ja',
  position: { latitude: 38.5, longitude: -120.2 },
  params: {} as { placeId?: string },
  hasLocation: true, locationStatus: 'ready', accuracy: 8, watcherSample: null as { position: { latitude: number; longitude: number }; accuracy: number; timestamp: number } | null,
}));
vi.mock('expo-constants', () => ({ default: { expoConfig: { extra: { mapsConfigured: true } } } }));
vi.mock('expo-router', () => ({ router: { navigate: vi.fn(), push: vi.fn(), setParams: vi.fn(() => { controls.params = {}; }) }, useIsFocused: () => controls.focused, useLocalSearchParams: () => controls.params }));
vi.mock('react-native-maps', async () => {
  const { createElement, forwardRef, useImperativeHandle } = await import('react');
  const MapView = forwardRef((props: Record<string, unknown>, ref) => {
    useImperativeHandle(ref, () => ({ fitToCoordinates: controls.fit, animateToRegion: controls.animate }));
    return createElement('map', props);
  });
  return { default: MapView, Circle: 'circle', Marker: 'marker', Callout: 'callout', Polyline: 'polyline', PROVIDER_GOOGLE: 'google' };
});
vi.mock('@/features/settings/provider', () => ({ useSettings: () => ({ activationRadiusMeters: 100, language: controls.language }) }));
vi.mock('@/features/location/use-device-location', () => ({ useDeviceLocation: () => ({ watcherStatus: 'ready', watcherSample: controls.watcherSample, position: controls.hasLocation ? controls.position : null, accuracy: controls.accuracy, status: controls.locationStatus, retry: vi.fn() }) }));
vi.mock('@/lib/use-app-active', () => ({ useAppActive: () => controls.active }));
vi.mock('@/features/places/service', () => ({ placesService: { search: vi.fn(), nearby: vi.fn(), details: vi.fn() } }));
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
it.each(['denied', 'no-maps', 'ready'])('opens the catalog from the %s Home state without provider calls', async state => {
  controls.hasLocation = state !== 'denied';
  Constants.expoConfig!.extra!.mapsConfigured = state !== 'no-maps';
  try {
    await act(async () => { tree = create(renderMap()); });
    await press('destinations.title');
    expect(router.navigate).toHaveBeenCalledWith('/destinations');
    expect(placesService.nearby).not.toHaveBeenCalled(); expect(placesService.details).not.toHaveBeenCalled();
  } finally { Constants.expoConfig!.extra!.mapsConfigured = true; }
});
let client: QueryClient;
let translations: i18n;
let tree: ReactTestRenderer | undefined;
function renderMap() { return React.createElement(I18nextProvider, { i18n: translations }, React.createElement(QueryClientProvider, { client }, withHeroUI(React.createElement(MapScreen)))); }
async function press(title: string) {
  const action = tree!.root.findAllByType('button').find((button) => (button.props.title ?? button.props.accessibilityLabel) === translations.t(title));
  expect(action).toBeDefined();
  await act(async () => { action!.props.onPress(); });
}
async function selectPlace(laidOut = true) {
  await act(async () => { tree = create(renderMap()); });
  if (laidOut) await act(async () => { tree!.root.findByProps({testID:'home-map-scene'}).props.onLayout({ nativeEvent: { layout: { width: 360, height: 720 } } }); });
  await act(async () => { tree!.root.findByType('map').props.onMapReady(); });
  await act(async () => {
    const sheet=tree!.root.findByType('dialog'); sheet.props.onChange(0, sheet.props.containerLayoutState.get().height - 120);
    tree!.root.findAllByType('view').find(n => n.props.testID === 'home-map-controls')!.props.onLayout({ nativeEvent: { layout: { height: 96 } } });
  });
  await press('map.search');
  await act(async () => { tree!.root.findByType('marker').props.onPress(); });
}
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true, __DEV__: false });
  controls.hasLocation = true; controls.locationStatus = 'ready'; controls.accuracy = 8;
  vi.mocked(router.push).mockClear();
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
  vi.mocked(routeService.walking).mockReset().mockResolvedValue(walkingRoute);
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
    tree!.root.findByProps({testID:'home-map-scene'}).props.onLayout({ nativeEvent: { layout: { width: 360, height: 720 } } });
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
  expect(tree!.root.findByType('map').props.mapPadding).toEqual({ top: 120, bottom: 108, left: 8, right: 8 });
  await act(async () => {
    const sheet = tree!.root.findByType('dialog');
    sheet.props.onChange(0, sheet.props.containerLayoutState.get().height - 280);
  });
  expect(tree!.root.findByType('map').props.mapPadding.bottom).toBe(148);
  expect(placesService.nearby).not.toHaveBeenCalled();
  expect(placesService.details).not.toHaveBeenCalled();
  expect(routeService.walking).not.toHaveBeenCalled();
});
it.each(['focused', 'active'] as const)('disables the retained native location layer when %s ownership ends', async lifecycle => {
  await act(async () => { tree = create(renderMap()); });
  const map = tree!.root.findByType('map');
  await act(async () => map.props.onMapReady());
  expect(map.props.showsUserLocation).toBe(true);
  controls[lifecycle] = false;
  await act(async () => tree!.update(renderMap()));
  expect(tree!.root.findByType('map')).toBe(map);
  expect(map.props.showsUserLocation).toBe(false);
  controls[lifecycle] = true; controls.hasLocation = false;
  await act(async () => tree!.update(renderMap()));
  expect(map.props.showsUserLocation).toBe(false);
  controls.hasLocation = true;
  await act(async () => tree!.update(renderMap()));
  expect(map.props.showsUserLocation).toBe(true);
  expect(controls.fit).not.toHaveBeenCalled(); expect(controls.animate).not.toHaveBeenCalled();
  expect(placesService.nearby).not.toHaveBeenCalled(); expect(placesService.details).not.toHaveBeenCalled();
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
  await act(async () => { tree!.root.findByProps({testID:'home-map-scene'}).props.onLayout({ nativeEvent: { layout: { width: 360, height: 720 } } }); });
  expect(tree!.root.findByType('map').props).toHaveProperty('mapPadding');
  await act(async () => { tree!.root.findByType('map').props.onMapReady(); });
  expect(tree!.root.findByType('map').props.mapPadding).toBeDefined();
  expect(placesService.nearby).not.toHaveBeenCalled();
  expect(placesService.details).not.toHaveBeenCalled();
  expect(routeService.walking).not.toHaveBeenCalled();
});
it.each(['focused', 'active'] as const)('does not repeat paid queries after %s changes or location-driven remounts', async (lifecycle) => {
  await selectPlace();
  for (let navigation = 0; navigation < 2; navigation++) {
    controls[lifecycle] = false;
    await act(async () => { tree!.update(renderMap()); });
    controls[lifecycle] = true;
    await act(async () => { tree!.update(renderMap()); });
  }
  expect(placesService.nearby).toHaveBeenCalledTimes(1);
  expect(placesService.details).toHaveBeenCalledTimes(1);
  expect(routeService.walking).not.toHaveBeenCalled();
  await act(async () => { tree!.unmount(); });
  // Location restarts can remove the map observer; production immediately discards unused data.
  await new Promise((resolve) => setTimeout(resolve, 0));
  controls.position = { latitude: 38.51, longitude: -120.21 };
  await act(async () => { tree = create(renderMap()); });
  await act(async () => { tree!.root.findByType('map').props.onMapReady(); });
  expect(placesService.nearby).toHaveBeenCalledTimes(1);
  expect(placesService.details).toHaveBeenCalledTimes(1);
  expect(routeService.walking).not.toHaveBeenCalled();
  await press('map.search');
  expect(placesService.nearby).toHaveBeenCalledTimes(2);
  expect(placesService.nearby).toHaveBeenLastCalledWith({ center: { latitude: 38.51, longitude: -120.21 }, radiusMeters: 1000, language: 'en' });
});

it('uses supported custom marker callouts and reuses complete Nearby data without a paid details request', async () => {
  vi.mocked(placesService.nearby).mockResolvedValue([{ ...destination, source: 'discovery' }]);
  await act(async () => { tree = create(renderMap()); });
  await act(async () => { tree!.root.findByType('map').props.onMapReady(); });
  await press('map.search');
  const marker = tree!.root.findByType('marker');
  expect(marker.props.title).toBe(destination.name);
  expect(marker.findByType('callout' as React.ElementType).props.tooltip).toBe(true);
  await act(async () => marker.props.onPress());
  expect(placesService.details).not.toHaveBeenCalled();
  expect(JSON.stringify(tree!.toJSON())).toContain(destination.name);
  await press('map.expand'); await press('map.collapse');
  expect(tree!.root.findByType('map')).toBeDefined();
  expect(placesService.details).not.toHaveBeenCalled();
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
  { stage: 'nearby', code: 'FUTURE_ERROR', language: 'ja', message: 'リクエストを完了できませんでした。再試行してください。' },
  { stage: 'details', code: 'toString', language: 'ko', message: '요청을 완료하지 못했습니다. 다시 시도하세요.' },
] as const)('translates $stage failures in $language ($code) without displaying provider text', async ({ stage, code, language, message }) => {
  controls.language = language;
  await translations.changeLanguage(language);
  const failure = code === null ? new Error('Raw provider English') : new EdgeRequestError(code);
  if (stage === 'nearby') vi.mocked(placesService.nearby).mockRejectedValue(failure);
  if (stage === 'details') vi.mocked(placesService.details).mockRejectedValue(failure);
  await act(async () => { tree = create(renderMap()); });
  await act(async () => { tree!.root.findByType('map').props.onMapReady(); });
  await press('map.search');
  if (stage !== 'nearby') await act(async () => { tree!.root.findByType('marker').props.onPress(); });
  const content = JSON.stringify(tree!.toJSON());
  expect(content).toContain(message);
  expect(content).not.toContain(failure.message);
});

it('accepts an AR Place ID from memory without paid calls and reuses the Directions handoff', async () => {
  client.setQueryData(['place-selection', destination.providerId], destination);
  controls.params = { placeId: destination.providerId };
  await act(async () => { tree = create(renderMap()); });
  await act(async () => { tree!.root.findByType('map').props.onMapReady(); });
  expect(JSON.stringify(tree!.toJSON())).toContain(destination.name);
  expect(placesService.nearby).not.toHaveBeenCalled();
  expect(placesService.details).not.toHaveBeenCalled();
  expect(tree!.root.findByType('aside').props.places).toContainEqual(destination);
  await press('placeDetails.directions');
  expect(router.push).toHaveBeenCalledWith({pathname:'/directions',params:{token:expect.any(String)}});
  expect(routeService.walking).not.toHaveBeenCalled();
  expect(tree!.root.findAllByType('polyline')).toHaveLength(0);
});
it('consumes a new AR selection on an existing map without automatic details calls', async () => {
  await act(async () => { tree = create(renderMap()); });
  await act(async () => { tree!.root.findByType('map').props.onMapReady(); });
  client.setQueryData(['place-selection', destination.providerId], destination);
  controls.params = { placeId: destination.providerId };
  await act(async () => { tree!.update(renderMap()); });
  expect(JSON.stringify(tree!.toJSON())).toContain(destination.name);
  expect(placesService.details).not.toHaveBeenCalled();
  await press('placeDetails.directions'); expect(routeService.walking).not.toHaveBeenCalled();
});
it('reopens the same consumed AR Place ID after closing the selection', async () => {
  client.setQueryData(['place-selection', destination.providerId], destination);
  controls.params = { placeId: destination.providerId };
  await act(async () => { tree = create(renderMap()); });
  await act(async () => { tree!.root.findByType('map').props.onMapReady(); });
  await press('map.closePlace');
  expect(tree!.root.findAllByType('button').some((b) => (b.props.title ?? b.props.accessibilityLabel) === translations.t('placeDetails.directions'))).toBe(false);
  controls.params = { placeId: destination.providerId };
  await act(async () => { tree!.update(renderMap()); });
  expect(tree!.root.findAllByType('button').some((b) => (b.props.title ?? b.props.accessibilityLabel) === translations.t('placeDetails.directions'))).toBe(true);
  expect(placesService.details).not.toHaveBeenCalled();
});
it('offers an explicit details request when the handoff has expired', async () => {
  controls.params = { placeId: destination.providerId };
  await act(async () => { tree = create(renderMap()); });
  await act(async () => { tree!.root.findByType('map').props.onMapReady(); });
  expect(JSON.stringify(tree!.toJSON())).toContain(translations.t('map.selectionUnavailable'));
  expect(placesService.details).not.toHaveBeenCalled();
  await press('ar.more'); expect(placesService.details).toHaveBeenCalledWith(destination.providerId, 'en');
  expect(tree!.root.findAllByType('button').some((b) => (b.props.title ?? b.props.accessibilityLabel) === translations.t('placeDetails.directions'))).toBe(true);
});

it('offers floating Home controls and spends nothing on mount, pan, locale, navigation or invalidation', async () => {
 await act(async () => { tree = create(renderMap()); });
 await act(async () => { tree!.root.findByType('map').props.onMapReady(); });
 expect(tree!.root.findAllByType('button').map(b => b.props.accessibilityLabel)).toEqual(expect.arrayContaining([translations.t('map.search'), translations.t('destinations.title'), translations.t('search.categories.restaurants')]));
 // Native region changes update draft geometry only.
 await act(async () => { tree!.root.findByType('map').props.onRegionChangeComplete?.({ latitude: 10, longitude: 20 }); });
 await press('destinations.title'); expect(router.navigate).toHaveBeenLastCalledWith('/destinations');
 expect(tree!.root.findAllByType('button').some(b => b.props.accessibilityLabel === translations.t('map.settings'))).toBe(false);
 controls.focused = false; controls.active = false;
 await act(async () => { tree!.update(renderMap()); });
 controls.focused = true; controls.active = true; controls.language = 'ja';
 await act(async () => { await translations.changeLanguage('ja'); tree!.update(renderMap()); await client.invalidateQueries(); });
 expect(placesService.nearby).not.toHaveBeenCalled(); expect(placesService.details).not.toHaveBeenCalled(); expect(routeService.walking).not.toHaveBeenCalled();
 await press('map.search'); expect(placesService.nearby).toHaveBeenCalledTimes(1);
});
it('expands and collapses selected content without fetching and preserves Google credits', async () => {
 await selectPlace();
 await press('map.expand'); await press('map.collapse');
 expect(JSON.stringify(tree!.toJSON())).toContain(destination.name);
 expect(tree!.root.findByType('aside').props.places).toContainEqual(destination);
 expect(placesService.nearby).toHaveBeenCalledTimes(1); expect(placesService.details).toHaveBeenCalledTimes(1); expect(routeService.walking).not.toHaveBeenCalled();
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
 await selectPlace();
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

it('updates Google credit padding during a sheet gesture without fitting on Home', async () => {
 await selectPlace();
 const calls=controls.fit.mock.calls.length;
 const sheet=tree!.root.findByType('dialog');
 await act(async()=>{ sheet.props.animatedPosition.set(440); nativeUi.reactions.forEach(tick=>tick()); });
 expect(tree!.root.findByType('map').props.mapPadding.bottom).toBe(40);
 expect(controls.fit).toHaveBeenCalledTimes(calls);
 await act(async()=>sheet.props.onChange(1,440));
 expect(controls.fit.mock.calls.length).toBe(calls);
 expect(placesService.nearby).toHaveBeenCalledTimes(1); expect(placesService.details).toHaveBeenCalledTimes(1); expect(routeService.walking).not.toHaveBeenCalled();
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

it('retains expanded sheet geometry when header size changes without a new native snap-index event', async () => {
 await selectPlace();
 let sheet=tree!.root.findByType('dialog');
 await act(async()=>sheet.props.onChange(1,sheet.props.containerLayoutState.get().height-sheet.props.snapPoints[1]));
 await act(async()=>tree!.root.findByProps({testID:'home-map-controls'}).props.onLayout({nativeEvent:{layout:{height:180}}}));
 sheet=tree!.root.findByType('dialog');
 expect(sheet.props.snapPoints[1]).toBe(452);
 expect(tree!.root.findByType('map').props.mapPadding.bottom).toBe(212);
});
it('publishes the final same-index bounce position even inside the gesture update interval', async () => {
 await selectPlace();
 const sheet=tree!.root.findByType('dialog'); const peek=sheet.props.snapPoints[0];
 await act(async()=>{ sheet.props.animatedPosition.set(720-peek-40); nativeUi.reactions.forEach(tick=>tick()); });
 expect(tree!.root.findByType('map').props.mapPadding.bottom).toBeCloseTo(64);
 await act(async()=>{ sheet.props.animatedPosition.set(720-peek); nativeUi.reactions.forEach(tick=>tick()); });
 expect(tree!.root.findByType('map').props.mapPadding.bottom).toBeCloseTo(24);
});

// Focus changes restart GPS before the next fix. The retained map must keep
// selection, route observers and native readiness through that interval.
it('preserves selected POI and expanded sheet through tab switches and GPS startup', async () => {
 await selectPlace();
 await press('map.expand');
 const mapInstance = tree!.root.findByType('map');
 expect(tree!.root.findAllByType('button').find(b => b.props.accessibilityLabel === translations.t('map.collapse'))!.props.accessibilityState.expanded).toBe(true);
 for (const focused of [false, true]) {
  controls.focused = focused; controls.hasLocation = false;
  await act(async () => { tree!.update(renderMap()); });
  expect(tree!.root.findByType('map')).toBe(mapInstance);
  expect(tree!.root.findAllByType('polyline')).toHaveLength(0);
  expect(tree!.root.findAllByType('button').find(b => b.props.accessibilityLabel === translations.t('map.collapse'))!.props.accessibilityState.expanded).toBe(true);
  expect(tree!.root.findAllByType('button').find(b => b.props.accessibilityLabel === 'Search Nearby')!.props.disabled).toBe(true);
 }
 controls.hasLocation = true;
 await act(async () => { tree!.update(renderMap()); });
 expect(tree!.root.findAllByType('button').find(b => b.props.accessibilityLabel === 'Search Nearby')!.props.disabled).toBe(false);
 expect(placesService.nearby).toHaveBeenCalledTimes(1);
 expect(placesService.details).toHaveBeenCalledTimes(1);
 expect(routeService.walking).not.toHaveBeenCalled();
});

it('keeps the expanded sheet and Google credits within the smaller scene above the tab bar', async () => {
 await selectPlace();
 await press('map.expand');
 // The navigator owns the bottom inset; the map must not reserve it again.
 expect(tree!.root.findByType('safe-area' as React.ElementType).props.edges).toEqual(['left', 'right']);
 await act(async () => { tree!.root.findByProps({testID:'home-map-scene'}).props.onLayout({ nativeEvent: { layout: { width: 360, height: 580 } } }); });
 const sheet = tree!.root.findByType('dialog');
 expect(tree!.root.findAllByType('button').find(b => b.props.accessibilityLabel === translations.t('map.collapse'))!.props.accessibilityState.expanded).toBe(true);
 expect(sheet.props.containerLayoutState.get().height).toBe(580);
 const padding = tree!.root.findByType('map').props.mapPadding;
 expect(padding.bottom).toBe(sheet.props.snapPoints[1]-sheet.props.snapPoints[0]+24);
 expect(padding.bottom).toBeGreaterThan(0);
 expect(padding.top + padding.bottom).toBeLessThan(tree!.root.findByType('map').props.style.height);
 expect(tree!.root.findAllByType('aside')).toHaveLength(1);
 expect(placesService.nearby).toHaveBeenCalledTimes(1);
 expect(routeService.walking).not.toHaveBeenCalled();
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

it('separates Recenter from the search bar and keeps it attached to the native sheet position', async () => {
 await act(async()=>{ tree=create(renderMap()); });
 await act(async()=>tree!.root.findByType('map').props.onMapReady());
 const top=tree!.root.findByProps({testID:'home-map-controls'});
 expect(top.findAllByType('button').some(b=>b.props.accessibilityLabel===translations.t('map.recenter'))).toBe(false);
 const floating=tree!.root.findByType(MapRecenter);
 expect(floating.props.position).toBe(tree!.root.findByType('dialog').props.animatedPosition);
 const button=floating.findAllByType('button')[0];
 await act(async()=>button.props.onPress());
 expect(controls.animate).toHaveBeenCalledWith({...controls.position,latitudeDelta:0.02,longitudeDelta:0.02},400);
 expect(placesService.nearby).not.toHaveBeenCalled();
 expect(routeService.walking).not.toHaveBeenCalled();
 expect(tree!.root.findAllByType('safe-area' as React.ElementType).at(-1)!.props.edges).toEqual(['left','right']);
});

it('moves the floating Recenter on the UI thread with the sheet without calculating or fitting a Home route', async () => {
 await selectPlace();
 const sheet=tree!.root.findByType('dialog');
 const floating=tree!.root.findByProps({testID:'map-recenter'});
 const style=()=>nativeUi.animatedStyles.get(floating.props.style)!();
 const fits=controls.fit.mock.calls.length;
 await act(async()=>sheet.props.animatedPosition.set(440));
 expect(style()).toMatchObject({transform:[{translateY:376}],opacity:1});
 await act(async()=>sheet.props.animatedPosition.set(380));
 expect(style()).toMatchObject({transform:[{translateY:316}],opacity:1});
 expect(controls.fit).toHaveBeenCalledTimes(fits);
 expect(placesService.nearby).toHaveBeenCalledTimes(1);
 expect(routeService.walking).not.toHaveBeenCalled();
});

it('uses the shared light map style and reserves the status inset for controls rather than the map', async () => {
 await act(async()=>{ tree=create(renderMap()); });
 const map=tree!.root.findByType('map');
 expect(map.props.customMapStyle).toBeDefined();
 // Keep the reported userInterfaceStyle initial-prop crash path inactive.
 expect(map.props).not.toHaveProperty('userInterfaceStyle');
 expect(tree!.root.findByType('safe-area' as React.ElementType).props.edges).toEqual(['left','right']);
 await act(async()=>{
  tree!.root.findByProps({testID:'home-map-scene'}).props.onLayout({nativeEvent:{layout:{width:360,height:720}}});
  tree!.root.findByProps({testID:'home-map-controls'}).props.onLayout({nativeEvent:{layout:{height:100}}});
 });
 await act(async()=>map.props.onMapReady());
 expect(tree!.root.findByType('map').props.mapPadding.top).toBe(100+nativeUi.insets.top);
});

it('opens Directions in one action from Home and never calculates a route on Home',async()=>{
 await act(async()=>{tree=create(renderMap());});
 await act(async()=>tree!.root.findByType('map').props.onMapReady());
 await press('map.search');await act(async()=>tree!.root.findByType('marker').props.onPress());
 const action=tree!.root.findAllByType('button').find(b=>b.props.accessibilityLabel===translations.t('placeDetails.directions'));
 expect(action).toBeDefined();
 await act(async()=>{action!.props.onPress();action!.props.onPress();});
 expect(router.push).toHaveBeenCalledTimes(1);
 expect(router.push).toHaveBeenCalledWith({pathname:'/directions',params:{token:expect.any(String)}});
 expect(routeService.walking).not.toHaveBeenCalled();
});

it('holds the collapsed map frame while the sheet expands and returns from focus', async()=>{
 await selectPlace();
 const scene=tree!.root.findByProps({testID:'home-map-scene'});
 await act(async()=>scene.props.onLayout({nativeEvent:{layout:{width:360,height:720}}}));
 const map=tree!.root.findByType('map');const sheet=tree!.root.findByType('dialog');
 const height=Math.min(720,720-sheet.props.snapPoints[0]+24);expect(map.props.style.height).toBe(height);
 await press('map.expand');expect(map.props.style.height).toBe(height);
 await act(async()=>sheet.props.onChange(1,720-sheet.props.snapPoints[1]));
 expect(map.props.style.height).toBe(height);
 expect(map.props.mapPadding.bottom).toBe(sheet.props.snapPoints[1]-sheet.props.snapPoints[0]+24);
 controls.focused=false;await act(async()=>tree!.update(renderMap()));
 controls.focused=true;await act(async()=>tree!.update(renderMap()));
 expect(tree!.root.findByType('map')).toBe(map);expect(map.props.style.height).toBe(height);
 expect(controls.fit).not.toHaveBeenCalled();
});

it('bounds native padding in very short scenes and ignores transient zero scene layouts',async()=>{
 await selectPlace();const map=tree!.root.findByType('map');
 await act(async()=>tree!.root.findByProps({testID:'home-map-scene'}).props.onLayout({nativeEvent:{layout:{width:360,height:80}}}));
 expect(map.props.mapPadding.top+map.props.mapPadding.bottom).toBeLessThan(map.props.style.height);
 const height=map.props.style.height;
 await act(async()=>tree!.root.findByProps({testID:'home-map-scene'}).props.onLayout({nativeEvent:{layout:{width:0,height:0}}}));
 expect(map.props.style.height).toBe(height);expect(tree!.root.findByType('map')).toBe(map);
});

it('opens the approved ACLC map point and minimal sheet without GPS or paid provider details', async () => {
  const { getDestination } = await import('@/features/destinations/catalog');
  controls.params = { featuredDestinationId: 'pilot-aclc' } as typeof controls.params;
  controls.hasLocation = false;
  await act(async () => { tree = create(renderMap()); });
  expect(tree!.root.findByType('map').props.initialRegion).toMatchObject(getDestination('pilot-aclc')!.center!);
  expect(JSON.stringify(tree!.toJSON())).toContain('ACLC College of Ormoc');
  expect(tree!.root.findByType('map').props.showsUserLocation).toBe(false);
  expect(placesService.details).not.toHaveBeenCalled(); expect(placesService.nearby).not.toHaveBeenCalled();
});
it('retains the requested featured center until the current native map becomes ready', async () => {
  controls.params = { featuredDestinationId: 'pilot-aclc' } as typeof controls.params;
  await act(async () => { tree = create(renderMap()); });
  expect(controls.animate).not.toHaveBeenCalled();
  await act(async () => tree!.root.findByType('map').props.onMapReady());
  expect(controls.animate).toHaveBeenCalledWith(expect.objectContaining({ latitude: 11.022973, longitude: 124.6054992 }), 400);
});
it('allows a known featured selection after an initial GPS-denied screen', async () => {
  controls.hasLocation = false;
  await act(async () => { tree = create(renderMap()); });
  expect(tree!.root.findAllByType('map')).toHaveLength(0);
  controls.params = { featuredDestinationId: 'pilot-aclc' } as typeof controls.params;
  await act(async () => tree!.update(renderMap()));
  expect(tree!.root.findAllByType('map')).toHaveLength(1);
});
it.each(['initial', 'handoff'] as const)('keeps exact-associated provider %s selection minimal without losing the map', async entry => {
 const catalog = await import('@/features/destinations/catalog'); const selection = await import('@/features/places/selection');
 const pilot = catalog.getDestination('pilot-aclc')!;
 const approved = catalog.destinationSchema.parse({ ...pilot, ar: { ...pilot.ar, providerAssociation: { providerId: destination.providerId, approvalReference: 'Synthetic test association' } } });
 vi.spyOn(catalog, 'listFeaturedDestinations').mockReturnValue([approved]);
 vi.spyOn(catalog, 'getDestination').mockImplementation(id => id === 'pilot-aclc' ? approved : null);
 selection.setPlaceSelection(client, { ...destination, source: 'discovery', description: 'Rich provider copy must stay hidden' }, 'en');
 let original: unknown;
 if (entry === 'handoff') { await act(async () => { tree = create(renderMap()); }); original = tree!.root.findByType('map'); }
 controls.params = { placeId: destination.providerId };
 await act(async () => { if (tree) tree.update(renderMap()); else tree = create(renderMap()); });
 const { HomePlaceSheet } = await import('./place-sheet'); const sheet = tree!.root.findByType(HomePlaceSheet);
 expect(sheet.props.selectedPlace?.provider).toBe('curated'); expect(sheet.props.selectedPlace).not.toHaveProperty('description');
 expect(sheet.props.onViewDetails).toBeUndefined();
 if (original) expect(tree!.root.findByType('map')).toBe(original);
 expect(placesService.details).not.toHaveBeenCalled();
});
it('submits text/category/settled area only on explicit Search This Area and never lifecycle refreshes', async () => {
 vi.mocked(placesService.search).mockResolvedValue([{ ...destination, source: 'discovery' }]);
 await act(async () => { tree = create(renderMap()); });
 await act(async () => tree!.root.findByType('map').props.onMapReady());
 await act(async () => tree!.root.findByType('map').props.onRegionChangeComplete({ latitude: 1, longitude: 2, latitudeDelta: 0.1, longitudeDelta: 0.1 }));
 await act(async () => tree!.root.findByType('input').props.onChangeText('dinner'));
 await press('search.categories.restaurants');
 expect(placesService.search).not.toHaveBeenCalled(); expect(placesService.nearby).not.toHaveBeenCalled();
 await press('search.thisArea');
 expect(placesService.search).toHaveBeenCalledWith({ query: 'dinner', category: 'restaurants', language: 'en', area: { center: { latitude: 1, longitude: 2 }, radiusMeters: 5000 } });
 await act(async () => { await new Promise(resolve => setTimeout(resolve, 5)); });
 await act(async () => tree!.root.findByType('map').props.onPoiClick({ nativeEvent: { placeId: destination.providerId } }));
 expect(placesService.details).not.toHaveBeenCalled();
 controls.focused = false; await act(async () => tree!.update(renderMap())); controls.focused = true;
 await act(async () => { tree!.update(renderMap()); void client.invalidateQueries({ queryKey: ['places'] }); });
 expect(placesService.search).toHaveBeenCalledOnce();
});

it('keeps denied-GPS global selection separate from physical proximity and permits Directions', async () => {
 controls.hasLocation = false; controls.locationStatus = 'denied';
 vi.mocked(placesService.search).mockResolvedValue([{ ...destination, source: 'discovery' }]);
 vi.mocked(router.setParams).mockImplementation(params => { controls.params = { ...controls.params, ...params }; });
 try {
  await act(async () => { tree = create(renderMap()); });
  await act(async () => tree!.root.findByType('input').props.onChangeText('destination'));
  await press('map.search'); await act(async () => { await new Promise(resolve => setTimeout(resolve, 5)); });
  await act(async () => tree!.root.findAllByType('button').find(button => button.props.accessibilityLabel === destination.name)!.props.onPress());
  await act(async () => tree!.root.findByType('map').props.onMapReady());
  const { HomePlaceSheet } = await import('./place-sheet'); const sheet = tree!.root.findByType(HomePlaceSheet);
  expect(sheet.props.selectionSummary).toBe(translations.t('map.proximityUnavailable'));
  expect(sheet.props.canRequest).toBe(true);
  await press('placeDetails.directions');
  expect(router.push).toHaveBeenCalled(); expect(routeService.walking).not.toHaveBeenCalled();
 } finally { vi.mocked(router.setParams).mockImplementation(() => { controls.params = {}; }); }
});
it('allows explicit area-search recovery with a known viewport and no GPS', async () => {
 controls.params = { featuredDestinationId: 'pilot-aclc' } as typeof controls.params; controls.hasLocation = false;
 vi.mocked(placesService.search).mockRejectedValue(new Error('private provider detail'));
 await act(async () => { tree = create(renderMap()); });
 await act(async () => { const map = tree!.root.findByType('map'); map.props.onMapReady(); map.props.onRegionChangeComplete({ latitude: 1, longitude: 2, latitudeDelta: 0.01, longitudeDelta: 0.01 }); });
 await act(async () => tree!.root.findByType('input').props.onChangeText('test'));
 await press('search.thisArea'); await act(async () => { await new Promise(resolve => setTimeout(resolve, 5)); });
 const retry = tree!.root.findAllByType('button').find(button => button.props.accessibilityLabel === translations.t('common.retry'))!;
 expect(retry.props.disabled).toBe(false);
 await act(async () => retry.props.onPress());
 expect(placesService.search).toHaveBeenCalledTimes(2);
});

it('hands a corroborated selected ACLC launch to the guarded native route with development provenance', async () => {
 const { AdmissionContext } = await import('@/features/destination-ar/admission-context'); const { ArAdmissionStore } = await import('@/features/destination-ar/admission-store');
 const { getDestination } = await import('@/features/destinations/catalog');
 Object.assign(globalThis, { __DEV__: true }); vi.stubEnv('EXPO_PUBLIC_VIRO_SPIKE', '1');
 const store = new ArAdmissionStore('owner'); controls.params = { featuredDestinationId: 'pilot-aclc' } as typeof controls.params;
 const render = () => React.createElement(AdmissionContext.Provider, { value: store }, renderMap());
 try {
  await act(async () => { tree = create(render()); }); await act(async () => tree!.root.findByType('map').props.onMapReady());
  for (const time of [10000, 13000, 16000]) {
   vi.spyOn(Date, 'now').mockReturnValue(time); controls.watcherSample = { position: getDestination('pilot-aclc')!.center!, accuracy: 5, timestamp: time };
   await act(async () => tree!.update(render()));
  }
  await press('arrival.launchDraft');
  const target = vi.mocked(router.push).mock.calls.at(-1)![0] as { pathname: string; params: { destinationId: 'pilot-aclc'; entryToken: string } };
  expect(target.pathname).toBe('/destination-ar/[destinationId]');
  expect(store.take(target.params.entryToken, target.params.destinationId)?.identity.provenance).toBe('development');
  expect(placesService.details).not.toHaveBeenCalled(); expect(placesService.search).not.toHaveBeenCalled();
 } finally { controls.watcherSample = null; Object.assign(globalThis, { __DEV__: false }); vi.unstubAllEnvs(); }
});
it('offers opted-in simulated arrival without converting a browsing point into GPS evidence', async () => {
 const { AdmissionContext } = await import('@/features/destination-ar/admission-context'); const { ArAdmissionStore } = await import('@/features/destination-ar/admission-store');
 Object.assign(globalThis, { __DEV__: true }); vi.stubEnv('EXPO_PUBLIC_VIRO_SPIKE', '1'); controls.hasLocation = false;
 const store = new ArAdmissionStore('owner'); controls.params = { featuredDestinationId: 'pilot-aclc' } as typeof controls.params;
 try {
  await act(async () => { tree = create(React.createElement(AdmissionContext.Provider, { value: store }, renderMap())); });
  await press('arrival.simulate'); await act(async () => { await vi.dynamicImportSettled(); });
  const target = vi.mocked(router.push).mock.calls.at(-1)![0] as unknown as { params: { entryToken: string } };
  expect(store.take(target.params.entryToken, 'pilot-aclc')).toMatchObject({ simulated: true, identity: { provenance: 'development' } });
  expect(store.getSnapshot()?.eligible).toBe(false); expect(placesService.nearby).not.toHaveBeenCalled(); expect(placesService.search).not.toHaveBeenCalled();
 } finally { Object.assign(globalThis, { __DEV__: false }); vi.unstubAllEnvs(); }
});
it('does not offer the ACLC draft simulation for a different destination selected through a map link', async () => {
 const { AdmissionContext } = await import('@/features/destination-ar/admission-context'); const { ArAdmissionStore } = await import('@/features/destination-ar/admission-store');
 Object.assign(globalThis, { __DEV__: true }); vi.stubEnv('EXPO_PUBLIC_VIRO_SPIKE', '1'); controls.params = { featuredDestinationId: 'D01' } as typeof controls.params;
 try {
  await act(async () => { tree = create(React.createElement(AdmissionContext.Provider, { value: new ArAdmissionStore('owner') }, renderMap())); });
  expect(tree!.root.findAllByType('button').some(button => button.props.accessibilityLabel === translations.t('arrival.simulate'))).toBe(false);
 } finally { Object.assign(globalThis, { __DEV__: false }); vi.unstubAllEnvs(); }
});
