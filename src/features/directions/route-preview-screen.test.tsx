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
import PlaceDetailsScreen from '@/features/places/place-details-screen';
import { placeSelectionOptions } from '@/features/places/selection';

const controls = vi.hoisted(() => ({ token: undefined as unknown, details: false, providerId: 'north', active: true, focused: true, mapsConfigured: true, language: 'en' as 'en' | 'ko' | 'ja', fit: vi.fn(), animate: vi.fn(), retry: vi.fn(), canBack: true,
  location: { status: 'ready', watcherStatus: 'ready', errorCode: null as string | null, position: { latitude: 38.5, longitude: -120.2 } as { latitude: number; longitude: number } | null, positionTimestamp: Date.now(), watcherTimestamp: Date.now(), accuracy: 8, canAskAgain: true } }));
vi.mock('expo-router', () => ({ useLocalSearchParams: () => ({ token: controls.token, providerId: controls.providerId }), useIsFocused: () => controls.focused,
  router: { back: vi.fn(), canGoBack: () => controls.canBack, push: vi.fn(), navigate: vi.fn(), dismissTo: vi.fn(), setParams: vi.fn() } }));
vi.mock('expo-constants', () => ({ default: { get expoConfig() { return { extra: { mapsConfigured: controls.mapsConfigured } }; } } }));
vi.mock('@/features/settings/provider', () => ({ useSettings: () => ({ language: controls.language }) }));
vi.mock('@/features/location/use-device-location', () => ({ useDeviceLocation: () => ({ ...controls.location, retry: controls.retry }) }));
vi.mock('@/lib/use-app-active', () => ({ useAppActive: () => controls.active }));
vi.mock('@/features/places/service', () => ({ placesService: { details: vi.fn(), nearby: vi.fn() } }));
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
function render() { return <I18nextProvider i18n={translations}><QueryClientProvider client={client}>{withHeroUI(controls.details ? <PlaceDetailsScreen /> : <RoutePreviewScreen />)}</QueryClientProvider></I18nextProvider>; }
async function mount() { await act(async () => { tree = create(render()); }); }
async function update() { await act(async () => { tree!.update(render()); }); }
function output() { return JSON.stringify(tree!.toJSON()); }
function button(key: string) { return tree!.root.findAllByType('button').find(b => b.props.accessibilityLabel === translations.t(key)); }
async function press(key: string) { const b = button(key); expect(b, key).toBeDefined(); expect(b!.props.disabled).not.toBe(true); await act(async () => { b!.props.onPress(); }); }
function handoff(existing = true, target = place) { controls.token = createRoutePreviewIntent(client, target, existing ? { origin, destination: target.coordinates, route } : undefined); }
async function layout() { await act(async () => {
  tree!.root.findByType('map').props.onLayout({ nativeEvent: { layout: { width: 360, height: 720 } } });
  tree!.root.findByProps({ testID: 'route-preview-dock' }).props.onLayout({ nativeEvent: { layout: { height: 280 } } });
}); }
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true, __DEV__: false }); vi.clearAllMocks(); vi.spyOn(Date, 'now').mockReturnValue(1800000000000);
  Object.assign(controls, { token: undefined, details: false, active: true, focused: true, mapsConfigured: true, language: 'en', canBack: true });
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
it('retains its Google selection until details mounts after a navigation delay', async () => {
  handoff(); await mount(); await press('directions.details');
  await act(async () => { tree!.unmount(); }); tree = undefined;
  await new Promise(resolve => setTimeout(resolve, 10));
  controls.details = true; await mount();
  expect(output()).toContain(place.name);
});
it('spends one intent only when delayed foreground GPS becomes fresh, with no repeat on lifecycle or locale changes', async () => {
  const { focusManager, onlineManager } = await import('@tanstack/react-query');
  handoff(false); controls.location.status = 'loading'; controls.location.position = null; await mount(); expect(routeService.walking).not.toHaveBeenCalled();
  Object.assign(controls.location, { status: 'ready', position: origin, positionTimestamp: Date.now(), watcherTimestamp: Date.now() }); await update();
  expect(routeService.walking).toHaveBeenCalledExactlyOnceWith({ origin, destination: place.coordinates, language: 'en' });
  controls.active = false; controls.focused = false; await update(); controls.active = true; controls.focused = true; await update();
  await act(async () => { await translations.changeLanguage('ja'); controls.language = 'ja'; await client.invalidateQueries(); focusManager.setFocused(false); focusManager.setFocused(true); onlineManager.setOnline(false); onlineManager.setOnline(true); });
  await update(); await act(async () => { tree!.unmount(); }); await mount();
  expect(routeService.walking).toHaveBeenCalledTimes(1); expect(output()).toContain(place.name); expect(tree!.root.findByType('polyline').props.coordinates).toEqual(coordinates);
});
it.each(['stale-position', 'stale-watcher', 'watcher-error', 'denied', 'disabled', 'timeout', 'inaccurate', 'unknown-accuracy'])('does not spend quota with %s GPS', async failure => {
  handoff(false);
  if (failure === 'stale-position') controls.location.positionTimestamp = Date.now() - 60000;
  if (failure === 'stale-watcher') controls.location.watcherTimestamp = Date.now() - 60000;
  if (failure === 'watcher-error') controls.location.watcherStatus = 'error';
  if (failure === 'denied' || failure === 'disabled') controls.location.status = failure;
  if (failure === 'timeout') { controls.location.status = 'error'; controls.location.errorCode = 'timeout'; }
  if (failure === 'inaccurate') controls.location.accuracy = 1000;
  if (failure === 'unknown-accuracy') controls.location.accuracy = Number.NaN;
  await mount(); expect(routeService.walking).not.toHaveBeenCalled(); expect(tree!.root.findAllByType('polyline')).toHaveLength(0); expect(button('location.retry')).toBeDefined();
});
it('does not use the previous foreground owner’s retained fix on resume', async () => {
  handoff(false); controls.active = false; await mount();
  const oldTime = controls.location.watcherTimestamp;
  vi.spyOn(Date, 'now').mockReturnValue(oldTime + 1000); controls.active = true; await update(); expect(routeService.walking).not.toHaveBeenCalled();
  Object.assign(controls.location, { watcherTimestamp: oldTime + 1000, positionTimestamp: oldTime + 1000 }); await update(); expect(routeService.walking).toHaveBeenCalledOnce();
});
it('requires a new explicit retry after error and guards rapid double retry', async () => {
  vi.mocked(routeService.walking).mockRejectedValueOnce(new Error('Private provider diagnostic')); handoff(false); await mount(); expect(routeService.walking).toHaveBeenCalledOnce();
  expect(output()).toContain(translations.t('service.failed')); expect(output()).not.toContain('Private provider diagnostic');
  controls.active = false; await update(); controls.active = true; await update(); await act(async () => { await client.invalidateQueries(); }); expect(routeService.walking).toHaveBeenCalledOnce();
  const retry = button('directions.retry')!; expect(retry).toBeDefined(); await act(async () => { retry.props.onPress(); retry.props.onPress(); }); expect(routeService.walking).toHaveBeenCalledTimes(2); expect(output()).toContain(place.name);
});
it('never re-arms a waiting intent after remount; an explicit retry creates new intent', async () => {
  handoff(false); controls.location.status = 'loading'; await mount(); await act(async () => { tree!.unmount(); });
  controls.location.status = 'ready'; await mount(); expect(routeService.walking).not.toHaveBeenCalled(); expect(output()).not.toContain(translations.t('directions.waiting')); expect(button('location.retry')).toBeUndefined(); await press('directions.retry'); expect(routeService.walking).toHaveBeenCalledOnce();
});
it('revokes waiting authorization and ignores late paid results after QueryClient auth clear', async () => {
  handoff(false); controls.location.status = 'loading'; await mount(); await act(async () => { client.clear(); }); controls.location.status = 'ready'; await update(); expect(routeService.walking).not.toHaveBeenCalled();
  handoff(false); await act(async () => { tree!.unmount(); }); const pending = Promise.withResolvers<WalkingRoute>(); vi.mocked(routeService.walking).mockReturnValue(pending.promise); await mount(); expect(routeService.walking).toHaveBeenCalledOnce();
  await act(async () => { client.clear(); pending.resolve(route); }); expect(client.getQueryCache().getAll().every(q => !q.state.data)).toBe(true);
});
it('bounds waiting intent lifetime and never spends an expired lease', async () => {
  handoff(false); controls.location.status = 'loading'; await mount();
  vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 120001); controls.location.status = 'ready'; controls.location.positionTimestamp = Date.now(); controls.location.watcherTimestamp = Date.now(); await update(); expect(routeService.walking).not.toHaveBeenCalled(); expect(output()).toContain(translations.t('directions.unavailable')); expect(button('location.retry')).toBeUndefined(); expect(output()).not.toContain(translations.t('directions.waiting'));
});
it.each(['ROUTE_UNAVAILABLE', 'RATE_LIMITED', 'UNAUTHORIZED', 'UPSTREAM_INVALID', 'FUTURE', null])('translates %s along the real error-to-UI path and recovers explicitly', async code => {
  const { EdgeRequestError } = await import('@/lib/edge-error'); const { edgeErrorMessageKey } = await import('@/lib/edge-error');
  const failure = code ? new EdgeRequestError(code) : new Error('Private route diagnostic'); vi.mocked(routeService.walking).mockRejectedValueOnce(failure); handoff(false); await mount();
  for (const language of ['en', 'ko', 'ja']) {
    await act(async () => { await translations.changeLanguage(language); }); expect(output()).toContain(translations.t(edgeErrorMessageKey(failure))); expect(output()).not.toContain(failure.message);
  }
  await press('directions.retry'); expect(tree!.root.findByType('polyline').props.coordinates).toEqual(coordinates); expect(routeService.walking).toHaveBeenCalledTimes(2);
});
it.each(['?', '??', 'malformed'])('rejects invalid/degenerate returned polyline %s without inventing a route', async encodedPolyline => {
  vi.mocked(routeService.walking).mockResolvedValue({ ...route, encodedPolyline }); handoff(false); await mount(); expect(routeService.walking).toHaveBeenCalledOnce(); expect(tree!.root.findAllByType('polyline')).toHaveLength(0); expect(output()).toContain(translations.t('service.unavailable')); expect(button('directions.retry')).toBeDefined();
});

it('connects one Details tap through the actual intent handoff to a single delayed-GPS preview request', async () => {
  controls.details = true; controls.location.status = 'loading'; client.setQueryData(placeSelectionOptions(place.providerId).queryKey, place);
  vi.mocked(router.push).mockImplementationOnce(href => { if (typeof href !== 'string' && href.params && 'token' in href.params) controls.token = href.params.token; });
  await mount(); await act(async () => { const action = button('placeDetails.directions')!; action.props.onPress(); action.props.onPress(); });
  expect(router.push).toHaveBeenCalledOnce(); controls.details = false; await update(); expect(routeService.walking).not.toHaveBeenCalled();
  controls.location.status = 'ready'; await update(); expect(routeService.walking).toHaveBeenCalledExactlyOnceWith({ origin, destination: place.coordinates, language: 'en' });
  expect(tree!.root.findByType('polyline').props.coordinates).toEqual(coordinates);
});
it('shows map loading until native readiness and resets readiness for a new intent/map instance', async () => {
  handoff(); await mount(); expect(output()).toContain(translations.t('map.loading')); await layout();
  await act(async () => { tree!.root.findByType('map').props.onMapReady(); }); expect(output()).not.toContain(translations.t('map.loading'));
  handoff(); await update(); expect(tree!.root.findByType('map').props).not.toHaveProperty('mapPadding'); expect(output()).toContain(translations.t('map.loading'));
});
it.each(['en', 'ko', 'ja'] as const)('renders actual %s resources, long names, no address and scrollable short-height geometry without fabricated metadata', async language => {
  controls.language = language; await translations.changeLanguage(language);
  const target = { ...place, name: 'A long destination 日本語 한국어 '.repeat(15), address: undefined }; handoff(true, target); await mount();
  expect(output()).toContain(target.name); expect(output()).not.toContain(place.address); expect(output()).toContain(translations.t('directions.title')); expect(output()).toContain(translations.t('directions.snapshot'));
  expect(output()).toContain('Returned credit'); expect(output()).not.toContain('Flat Terrain'); expect(output()).not.toContain('Start Navigation'); expect(output()).not.toContain('directions.');
  expect(tree!.root.findAllByType('text').find(n => n.props.children === target.name)!.props.numberOfLines).toBeUndefined();
  expect(tree!.root.findByType('safe-area' as React.ElementType).props.edges).toEqual(['top', 'bottom', 'left', 'right']);
  await act(async () => {
    tree!.root.findByType('map').props.onLayout({ nativeEvent: { layout: { width: 640, height: 240 } } });
    tree!.root.findByProps({ testID: 'route-preview-dock' }).props.onLayout({ nativeEvent: { layout: { height: 132 } } });
    tree!.root.findByType('map').props.onMapReady();
  });
  expect(tree!.root.findByProps({ testID: 'route-preview-dock' }).props.style.maxHeight).toBe(132); expect(tree!.root.findByType('map').props.mapPadding.bottom).toBe(132);
  expect(tree!.root.findAllByType('scroll' as React.ElementType)).toHaveLength(1); expect(controls.fit).toHaveBeenCalled(); expect(routeService.walking).not.toHaveBeenCalled();
});
it('has a working Back fallback and real attribution link with sanitized link failures', async () => {
  controls.canBack = false; handoff(); await mount(); await press('directions.back'); expect(router.dismissTo).toHaveBeenCalledWith({ pathname: '/', params: { placeId: place.providerId } });
  const credit = tree!.root.findAllByType('text').find(n => n.props.children === 'Returned credit')!;
  await act(async () => { credit.props.onPress(); }); expect(nativeUi.openURL).toHaveBeenCalledWith('https://example.com/credit');
  nativeUi.openURL.mockRejectedValue(new Error('Private link diagnostic')); await act(async () => { credit.props.onPress(); }); expect(nativeUi.alert).toHaveBeenLastCalledWith(translations.t('map.linkFailed'));
});
it('keeps a pending request stable through remount and never duplicates it', async () => {
  const pending = Promise.withResolvers<WalkingRoute>(); vi.mocked(routeService.walking).mockReturnValue(pending.promise); handoff(false); await mount(); expect(output()).toContain(translations.t('map.routeLoading'));
  await act(async () => { tree!.unmount(); }); await mount(); expect(routeService.walking).toHaveBeenCalledOnce();
  await act(async () => { pending.resolve(route); }); expect(tree!.root.findByType('polyline').props.coordinates).toEqual(coordinates); expect(routeService.walking).toHaveBeenCalledOnce();
});
it('handles a synchronous adapter failure through the localized error path', async () => {
  vi.mocked(routeService.walking).mockImplementationOnce(() => { throw new Error('Private adapter diagnostic'); }); handoff(false); await mount();
  expect(output()).toContain(translations.t('service.failed')); expect(output()).not.toContain('Private adapter diagnostic'); await press('directions.retry'); expect(routeService.walking).toHaveBeenCalledTimes(2);
});
it('bounds native padding and fitting through actual controls measurements and short-height resize ordering', async () => {
  handoff(); await mount(); await layout();
  const controlsView = tree!.root.findAllByType('view').find(n => typeof n.props.className === 'string' && n.props.className.includes('right-4') && n.props.className.includes('top-4'))!;
  await act(async () => { controlsView.props.onLayout({ nativeEvent: { layout: { height: 104 } } }); tree!.root.findByType('map').props.onMapReady(); }); controls.fit.mockClear();
  // Native viewport callback can precede the dock's new measurement.
  await act(async () => { tree!.root.findByType('map').props.onLayout({ nativeEvent: { layout: { width: 640, height: 240 } } }); });
  let padding = tree!.root.findByType('map').props.mapPadding; expect(padding.top + padding.bottom).toBeLessThan(240); expect(controls.fit).not.toHaveBeenCalled();
  await act(async () => { tree!.root.findByProps({ testID: 'route-preview-dock' }).props.onLayout({ nativeEvent: { layout: { height: 132 } } }); });
  padding = tree!.root.findByType('map').props.mapPadding; expect(padding.top + padding.bottom).toBeLessThan(240);
  expect(controlsView.props.className).toContain('flex-row');
  await act(async () => { controlsView.props.onLayout({ nativeEvent: { layout: { height: 48 } } }); });
  padding = tree!.root.findByType('map').props.mapPadding; expect(padding.top + padding.bottom).toBeLessThan(240);
  expect(controls.fit).toHaveBeenCalled(); const fitPadding = controls.fit.mock.calls.at(-1)![1].edgePadding;
  expect(padding.top + padding.bottom + fitPadding.top + fitPadding.bottom).toBeLessThan(240);
});
it('rechecks wall-clock freshness at the paid-call boundary even before the periodic clock catches up', async () => {
  handoff(false); controls.location.status = 'loading'; await mount();
  vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 60000); controls.location.status = 'ready'; await update(); expect(routeService.walking).not.toHaveBeenCalled();
});
it('marks the submitted destination separately from later place metadata coordinates', async () => {
  controls.token = createRoutePreviewIntent(client, { ...place, coordinates: { latitude: 43.3, longitude: -126.5 } }, { origin, destination: place.coordinates, route });
  await mount(); expect(tree!.root.findAllByType('marker').find(m => m.props.title === place.name)!.props.coordinate).toEqual(place.coordinates); expect(routeService.walking).not.toHaveBeenCalled();
});
it('does not let an older waiting screen spend a replacement screen’s retry intent', async () => {
  handoff(false); controls.location.status = 'loading'; await mount(); const older = tree!;
  await mount(); await press('directions.retry'); await act(async () => { tree!.unmount(); }); tree = older;
  controls.location.status = 'ready'; await update(); expect(routeService.walking).not.toHaveBeenCalled();
  await press('directions.retry'); expect(routeService.walking).toHaveBeenCalledOnce();
});
it('returns curated routes to their catalog details and never hands a curated ID to Home Google selection', async () => {
 const curated: Place = { id: 'destination:D01', providerId: 'curated_D01', provider: 'curated', source: 'curated', name: 'Synthetic catalog subject', coordinates: place.coordinates, attributions: [] };
 handoff(true, curated); await mount();
 await press('directions.details'); expect(router.dismissTo).toHaveBeenLastCalledWith({ pathname: '/destinations/[destinationId]', params: { destinationId: 'D01' } });
 await press('directions.map'); expect(router.dismissTo).toHaveBeenLastCalledWith('/');
 expect(client.getQueryData(placeSelectionOptions(curated.providerId).queryKey)).toBeUndefined(); expect(routeService.walking).not.toHaveBeenCalled();
});
it('acquires one walking route to the approved curated entrance and does not repeat it after focus or language changes', async () => {
 const curated: Place = { id: 'destination:D01', providerId: 'curated_D01', provider: 'curated', source: 'curated', name: 'Synthetic catalog subject', coordinates: place.coordinates, attributions: [] };
 handoff(false, curated); await mount();
 expect(routeService.walking).toHaveBeenCalledExactlyOnceWith({ origin, destination: curated.coordinates, language: 'en' });
 controls.focused = false; controls.active = false; await update(); controls.focused = true; controls.active = true; await update();
 controls.language = 'ja'; await act(async () => { await translations.changeLanguage('ja'); }); await update(); expect(routeService.walking).toHaveBeenCalledOnce();
 await press('directions.details'); expect(router.dismissTo).toHaveBeenLastCalledWith({ pathname: '/destinations/[destinationId]', params: { destinationId: 'D01' } });
});

it('applies the shared light Clean Explorer map treatment without affecting its route', async()=>{
 handoff();await mount();
 const map=tree!.root.findByType('map');
 expect(map.props.userInterfaceStyle).toBe('light');
 expect(map.props.customMapStyle.some((style:{featureType?:string})=>style.featureType==='water')).toBe(true);
 expect(tree!.root.findByType('polyline').props.coordinates).toEqual(coordinates);
 expect(routeService.walking).not.toHaveBeenCalled();
});
