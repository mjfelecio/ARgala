import { withHeroUI } from '@/test/native-ui';
import * as React from 'react';
import { Pressable } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { QueryClient, QueryClientProvider, QueryObserver, notifyManager, focusManager } from '@tanstack/react-query';
import { createInstance, type i18n } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { queryClient } from '@/lib/query';
import { localizationOptions } from '@/i18n/options';
import { EdgeRequestError } from '@/lib/edge-error';
import { placesService, type Place } from '@/features/places/service';
import { AR } from '@/config/limits';
import ArScreen from './ar-screen';
import { claimRoutePreviewIntent } from '@/features/directions/route-preview-intent';
import { useRoutePreview } from '@/features/directions/use-route-preview';
import { routeService } from '@/features/directions/service';

const controls = vi.hoisted(() => ({ active: true, focused: true, granted: true,
  language: 'en' as 'en' | 'ko' | 'ja', radius: 100,
  location: { status: 'ready', watcherStatus: 'ready', position: { latitude: 0, longitude: 0 } as { latitude: number; longitude: number } | null,
    accuracy: 5 as number | null, positionTimestamp: 0, watcherTimestamp: 0, headingTimestamp: 0,
    headingStatus: 'ready', heading: { degrees: 0, accuracy: 3, reference: 'true' } as { degrees: number; accuracy: number; reference: string } | null, retry: vi.fn() },
  navigate: vi.fn(), push: vi.fn(), getPermission: vi.fn(), params: {} as { placeId?: string },
}));
vi.mock('expo-router', () => ({ useIsFocused: () => controls.focused, useLocalSearchParams: () => controls.params, router: { navigate: controls.navigate, push: controls.push, setParams: vi.fn(() => { controls.params = {}; }) } }));
vi.mock('expo-camera', async () => {
  const { createElement } = await import('react');
  return { CameraView: (props: Record<string, unknown>) => createElement('video', props),
    useCameraPermissions: () => [{ granted: controls.granted, canAskAgain: true }, controls.getPermission, controls.getPermission] };
});
vi.mock('@/features/settings/provider', () => ({ useSettings: () => ({ language: controls.language, activationRadiusMeters: controls.radius }) }));
vi.mock('@/features/location/use-device-location', () => ({ useDeviceLocation: () => controls.location }));
vi.mock('@/lib/use-app-active', () => ({ useAppActive: () => controls.active }));
vi.mock('@/features/directions/service', () => ({ routeService: { walking: vi.fn() } }));
vi.mock('@/features/places/service', () => ({ placesService: { nearby: vi.fn(), details: vi.fn() } }));
vi.mock('@/ui/shared', async () => {
  const { createElement } = await import('react');
  return { Screen: 'screen', Notice: 'output', Action: (props: Record<string, unknown>) => createElement('button', props) };
});
const north: Place = { id: 'google:north', providerId: 'north', provider: 'google', name: 'North Cafe', address: 'First Street',
  coordinates: { latitude: 0.0001, longitude: 0 }, attributions: [{ name: 'Local Provider', uri: 'https://example.com/credits' }] };
const south: Place = { ...north, id: 'google:south', providerId: 'south', name: 'South Park', coordinates: { latitude: -0.002, longitude: 0 } };
let client: QueryClient; let translations: i18n; let tree: ReactTestRenderer | undefined; let previewTree: ReactTestRenderer | undefined;
const render = () => React.createElement(I18nextProvider, { i18n: translations }, React.createElement(QueryClientProvider, { client }, withHeroUI(React.createElement(ArScreen))));
const output = () => JSON.stringify(tree!.toJSON());
async function mount() {
  await act(async () => { tree = create(render()); });
  await act(async () => {
    tree!.root.findByProps({ testID: 'ar-viewport' }).props.onLayout({ nativeEvent: { layout: { width: 360, height: 640 } } });
    tree!.root.findByProps({ testID: 'ar-chrome' }).props.onLayout({ nativeEvent: { layout: { height: 120 } } });
  });
}
async function press(key: string) {
  const button = tree!.root.findAllByType('button').find((b) => (b.props.title ?? b.props.accessibilityLabel) === translations.t(key));
  expect(button, key).toBeDefined(); expect(button!.props.disabled).not.toBe(true);
  await act(async () => { button!.props.onPress(); });
}
async function settle() { await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); }); }
async function scan() { await press('ar.scan'); await settle(); }
async function update() { await act(async () => { tree!.update(render()); }); }
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true, __DEV__: false });
  controls.active = true; controls.focused = true; controls.granted = true; controls.language = 'en'; controls.radius = 100;
  Object.assign(controls.location, { status: 'ready', watcherStatus: 'ready', position: { latitude: 0, longitude: 0 }, accuracy: 5,
    positionTimestamp: Date.now(), watcherTimestamp: Date.now(), headingTimestamp: Date.now(), headingStatus: 'ready', heading: { degrees: 0, accuracy: 3, reference: 'true' } });
  controls.params = {}; controls.navigate.mockReset(); controls.push.mockReset(); controls.getPermission.mockReset().mockResolvedValue({ granted: true });
  vi.mocked(placesService.nearby).mockReset().mockResolvedValue([north, south]);
  vi.mocked(placesService.details).mockReset().mockResolvedValue({ ...north, description: 'Provider description' });
  vi.mocked(routeService.walking).mockReset().mockResolvedValue({ encodedPolyline: '??AA', distanceMeters: 100, durationSeconds: 80, warnings: [] });
  notifyManager.setScheduler((callback) => callback());
  client = new QueryClient({ defaultOptions: queryClient.getDefaultOptions() });
  translations = createInstance(); await translations.use(initReactI18next).init({ ...localizationOptions, lng: 'en', react: { useSuspense: false } });
  const original = console.error;
  vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => { if (!String(args[0]).startsWith('react-test-renderer is deprecated')) original(...args); });
});
afterEach(async () => { await act(async () => { tree?.unmount(); previewTree?.unmount(); }); tree = undefined; previewTree = undefined; client.clear(); notifyManager.setScheduler((callback) => setTimeout(callback, 0)); vi.useRealTimers(); vi.restoreAllMocks(); });
it('scans at current GPS only on action, selects camera labels, and requests details explicitly', async () => {
  await mount(); expect(placesService.nearby).not.toHaveBeenCalled();
  await scan();
  expect(placesService.nearby).toHaveBeenCalledWith({ center: { latitude: 0, longitude: 0 }, radiusMeters: 1000, language: 'en' });
  await act(async () => { tree!.root.findByProps({ testID: 'ar-viewport' }).props.onLayout({ nativeEvent: { layout: { width: 360, height: 760 } } }); });
  await act(async () => { tree!.root.findByProps({ testID: 'ar-chrome' }).props.onLayout({ nativeEvent: { layout: { height: 120 } } }); });
  const labels = tree!.root.findAllByType(Pressable).filter((p) => p.props.testID?.startsWith('ar-label-'));
  expect(labels).toHaveLength(1);
  await act(async () => { labels[0].props.onPress(); });
  expect(output()).toContain('First Street'); expect(output()).toContain(translations.t('ar.distance', { meters: 11 }));
  expect(placesService.details).not.toHaveBeenCalled();
  await press('ar.more'); await settle(); expect(output()).toContain('Provider description');
  await press('placeDetails.map'); expect(controls.navigate).toHaveBeenCalledWith({ pathname: '/', params: { placeId: 'north' } });
  expect(output()).toContain('Google Maps'); expect(output()).toContain('Local Provider');
});
it('keeps manual selection through heading changes and offers inspection outside activation range', async () => {
  controls.radius = 10; await mount(); await scan();
  expect(output()).toContain(translations.t('ar.noneActive', { meters: 10 }));
  await act(async () => { tree!.root.findByProps({ testID: 'ar-list-south' }).props.onPress(); });
  controls.location.heading = { degrees: 180, accuracy: 3, reference: 'true' }; await update();
  expect(tree!.root.findByProps({ testID: 'ar-selected-name' }).props.children).toBe('South Park');
  expect(placesService.details).not.toHaveBeenCalled();
});
it('reuses suitable in-memory map results and never pays on lifecycle, movement, language, remount or invalidation', async () => {
  client.setQueryData(['places', { latitude: 0, longitude: 0 }, 'en'], [north]);
  await mount(); expect(output()).toContain('North Cafe');
  controls.focused = false; await update(); controls.focused = true; await update();
  controls.active = false; await update(); controls.active = true; await update();
  controls.location.position = { latitude: 0.00001, longitude: 0 }; await update();
  controls.language = 'ja'; await act(async () => { await translations.changeLanguage('ja'); }); await update();
  await act(async () => { await client.invalidateQueries(); focusManager.setFocused(false); focusManager.setFocused(true); });
  await act(async () => { tree!.unmount(); }); await mount();
  expect(placesService.nearby).not.toHaveBeenCalled(); expect(placesService.details).not.toHaveBeenCalled();
  await scan(); expect(placesService.nearby).toHaveBeenCalledTimes(1);
});
it('retains a list with denied camera permission and suppresses overlays for bad heading', async () => {
  controls.granted = false; await mount(); await scan();
  expect(tree!.root.findAllByType('video')).toHaveLength(0); expect(output()).toContain('North Cafe');
  controls.granted = true; controls.location.heading = { degrees: NaN, accuracy: 0, reference: 'true' }; await update();
  expect(output()).toContain(translations.t('ar.headingFallback'));
  expect(tree!.root.findAllByType(Pressable).filter((p) => p.props.testID?.startsWith('ar-label-'))).toHaveLength(0);
});
it('blocks scans with denied location and retains cached places without claiming fresh distance', async () => {
  client.setQueryData(['places', { latitude: 0, longitude: 0 }, 'en'], [north]); await mount();
  controls.location.status = 'denied'; controls.location.position = null; await update();
  const button = tree!.root.findAllByType('button').find((b) => (b.props.title ?? b.props.accessibilityLabel) === translations.t('ar.scan'))!;
  expect(button.props.disabled).toBe(true); expect(output()).toContain(translations.t('ar.trackingFallback'));
  expect(output()).toContain('North Cafe'); expect(placesService.nearby).not.toHaveBeenCalled();
});
it.each(['stale', 'watcher', 'accuracy', 'heading'] as const)('falls back from %s sensor data and stops preview on blur', async (failure) => {
  await mount(); await scan();
  if (failure === 'stale') controls.location.positionTimestamp = Date.now() - AR.positionMaxAgeMs - 1;
  if (failure === 'watcher') controls.location.watcherStatus = 'error';
  if (failure === 'accuracy') controls.location.accuracy = 1000;
  if (failure === 'heading') controls.location.headingTimestamp = Date.now() - AR.headingMaxAgeMs - 1;
  await update();
  expect(output()).toContain(translations.t(failure === 'heading' ? 'ar.headingFallback' : 'ar.trackingFallback'));
  expect(output()).toContain('North Cafe');
  controls.focused = false; await update(); expect(tree!.root.findAllByType('video')).toHaveLength(0);
  expect(placesService.nearby).toHaveBeenCalledTimes(1);
});
it('shows loading, empty results and explicit refresh', async () => {
  const pending = Promise.withResolvers<Place[]>(); vi.mocked(placesService.nearby).mockReturnValueOnce(pending.promise);
  await mount(); await press('ar.scan'); expect(output()).toContain(translations.t('ar.scanning'));
  await act(async () => { pending.resolve([]); }); await settle();
  expect(output()).toContain(translations.t('ar.empty')); await scan(); expect(output()).toContain('North Cafe');
});
it.each(['RATE_LIMITED', 'unknown'] as const)('localizes %s search errors, language changes and explicit recovery', async (code) => {
  vi.mocked(placesService.nearby).mockRejectedValueOnce(code === 'unknown' ? new Error('raw private failure') : new EdgeRequestError(code));
  await mount(); await scan(); expect(output()).toContain(translations.t(code === 'unknown' ? 'service.failed' : 'service.rateLimited'));
  controls.language = 'ko'; await act(async () => { await translations.changeLanguage('ko'); }); await update();
  expect(output()).toContain(translations.t(code === 'unknown' ? 'service.failed' : 'service.rateLimited'));
  expect(output()).not.toContain('raw private failure'); expect(placesService.nearby).toHaveBeenCalledTimes(1);
  await scan(); expect(output()).toContain('North Cafe');
});

it('expires GPS and compass samples on the clock and removes its freshness timer on blur', async () => {
  vi.useFakeTimers(); await mount();
  await press('ar.scan'); await act(async () => { await vi.advanceTimersByTimeAsync(1); });
  expect(output()).toContain('North Cafe');
  await act(async () => { await vi.advanceTimersByTimeAsync(AR.headingMaxAgeMs + 1000); });
  expect(output()).toContain(translations.t('ar.headingFallback'));
  await act(async () => { await vi.advanceTimersByTimeAsync(AR.positionMaxAgeMs); });
  expect(output()).toContain(translations.t('ar.trackingFallback'));
  const timers = vi.getTimerCount(); controls.focused = false; await update();
  expect(vi.getTimerCount()).toBe(timers - 1);
  expect(placesService.nearby).toHaveBeenCalledTimes(1);
});
it('retains selection when twenty colocated labels compete for three slots', async () => {
  const places = Array.from({ length: 20 }, (_, i) => ({ ...north, providerId: `place${i}`, id: `google:place${i}`, name: `Place ${i}` }));
  vi.mocked(placesService.nearby).mockResolvedValue(places); await mount(); await scan();
  await act(async () => { tree!.root.findByProps({ testID: 'ar-viewport' }).props.onLayout({ nativeEvent: { layout: { width: 320, height: 760 } } }); });
  await act(async () => { tree!.root.findByProps({ testID: 'ar-list-place19' }).props.onPress(); });
  await press('ar.collapse');
  await act(async () => { tree!.root.findByProps({ testID: 'ar-chrome' }).props.onLayout({ nativeEvent: { layout: { height: 120 } } }); });
  const labels = tree!.root.findAllByType(Pressable).filter((p) => p.props.testID?.startsWith('ar-label-'));
  expect(labels).toHaveLength(3); expect(labels.some((p) => p.props.testID === 'ar-label-place19')).toBe(true);
  expect(tree!.root.findByProps({ testID: 'ar-selected-name' }).props.children).toBe('Place 19');
  controls.location.heading = { degrees: 180, accuracy: 3, reference: 'true' }; await update();
  expect(tree!.root.findByProps({ testID: 'ar-selected-name' }).props.children).toBe('Place 19');
  expect(tree!.root.findAllByType(Pressable).filter((p) => p.props.testID?.startsWith('ar-list-'))).toHaveLength(20);
});
it.each(['RATE_LIMITED', 'unknown'] as const)('renders details failure %s in Japanese and recovers without automatic retries', async (code) => {
  controls.language = 'ja'; await translations.changeLanguage('ja');
  vi.mocked(placesService.details).mockRejectedValueOnce(code === 'unknown' ? new Error('native raw error') : new EdgeRequestError(code));
  await mount(); await scan(); await press('ar.expand'); await press('ar.more'); await settle();
  expect(output()).toContain(translations.t(code === 'unknown' ? 'service.failed' : 'service.rateLimited'));
  expect(output()).not.toContain('native raw error');
  controls.focused = false; await update(); controls.focused = true; await update();
  expect(placesService.details).toHaveBeenCalledTimes(1);
  await press('ar.more'); await settle(); expect(output()).toContain('Provider description');
});
it('shows the official Google Maps attribution asset with its accessible name', async () => {
  await mount(); await scan();
  const attribution = tree!.root.findByProps({ accessibilityLabel: 'Google Maps' });
  expect(attribution.props.source).toBeDefined();
});

it('does not let a fresh one-shot position mask stale continuous tracking', async () => {
  await mount(); await scan();
  controls.location.positionTimestamp = Date.now();
  controls.location.watcherTimestamp = Date.now() - AR.positionMaxAgeMs - 1;
  await update();
  expect(output()).toContain(translations.t('ar.trackingFallback'));
});
it.each([
  { degrees: NaN, accuracy: 3, reference: 'true' },
  { degrees: 0, accuracy: 1, reference: 'true' },
  { degrees: 0, accuracy: 3, reference: 'magnetic' },
])('retains list access for uncertain heading $reference/$accuracy/$degrees', async (heading) => {
  controls.location.heading = heading; await mount(); await scan();
  expect(output()).toContain(translations.t('ar.headingFallback'));
  expect(output()).toContain('North Cafe');
});
it('adopts cached results after delayed GPS startup without issuing a new search', async () => {
  controls.location.position = null; controls.location.status = 'loading';
  client.setQueryData(['places', { latitude: 0, longitude: 0 }, 'en'], [north]);
  // The map remains mounted in the Router stack while AR waits for GPS.
  // Keep its disabled observer, using the real gcTime=0 defaults.
  const source = new QueryObserver(client, { queryKey: ['places', { latitude: 0, longitude: 0 }, 'en'], enabled: false });
  const stop = source.subscribe(() => {});
  try {
    await mount(); expect(output()).not.toContain('North Cafe');
    controls.location.position = { latitude: 0, longitude: 0 }; controls.location.status = 'ready'; await update();
    expect(output()).toContain('North Cafe'); expect(placesService.nearby).not.toHaveBeenCalled();
  } finally { stop(); }
});
it('does not reuse a distant or expired search and waits for explicit Scan', async () => {
  client.setQueryData(['places', { latitude: 1, longitude: 0 }, 'en'], [north]);
  client.setQueryData(['places', { latitude: 0, longitude: 0 }, 'en'], [north], { updatedAt: Date.now() - AR.nearbyReuseMs - 1 });
  await mount(); expect(output()).not.toContain('North Cafe'); expect(placesService.nearby).not.toHaveBeenCalled();
  await scan(); expect(output()).toContain('North Cafe');
});

it('removes the additional-details action once the selected place has full details', async () => {
 await mount(); await scan(); await press('ar.expand'); await press('ar.more'); await settle();
 expect(output()).toContain('Provider description');
 expect(tree!.root.findAllByType('button').filter(b=>b.props.title===translations.t('ar.more'))).toHaveLength(0);
 expect(placesService.details).toHaveBeenCalledTimes(1);
});

it('allows an explicit details request in a new language after hiding the loaded-language action', async () => {
 await mount(); await scan(); await press('ar.expand'); await press('ar.more'); await settle();
 expect(tree!.root.findAllByType('button').some(b=>b.props.title===translations.t('ar.more'))).toBe(false);
 controls.language='ja';
 await act(async()=>{ await translations.changeLanguage('ja'); tree!.update(render()); });
 expect(placesService.details).toHaveBeenCalledTimes(1);
 await press('ar.more'); await settle();
 expect(placesService.details).toHaveBeenLastCalledWith(north.providerId,'ja');
 expect(placesService.details).toHaveBeenCalledTimes(2);
 expect(tree!.root.findAllByType('button').some(b=>b.props.title===translations.t('ar.more'))).toBe(false);
});
it('opens the same protected Details page from AR without a paid request and keeps the selected POI on return', async () => {
  await mount(); await scan(); await press('ar.expand'); await press('placeDetails.view');
  expect(controls.navigate).toHaveBeenLastCalledWith({ pathname: '/place/[providerId]', params: { providerId: north.providerId } });
  expect(client.getQueryData(['place-selection', north.providerId])).toEqual(north);
  expect(placesService.details).not.toHaveBeenCalled(); expect(placesService.nearby).toHaveBeenCalledTimes(1);
  controls.focused = false; await update(); expect(tree!.root.findAllByType('video')).toHaveLength(0);
  controls.focused = true; await update(); expect(tree!.root.findByProps({ testID: 'ar-selected-name' }).props.children).toBe(north.name);
  expect(placesService.details).not.toHaveBeenCalled(); expect(placesService.nearby).toHaveBeenCalledTimes(1);
});
it('accepts a Details selection outside nearby results without scanning or claiming a fresh distance', async () => {
  client.setQueryData(['place-selection', south.providerId], south); controls.params = { placeId: south.providerId }; controls.location.position = null;
  await mount(); expect(tree!.root.findByProps({ testID: 'ar-selected-name' }).props.children).toBe(south.name);
  expect(tree!.root.findByType('dialog').props.nativeIndex.get()).toBe(1);
  expect(output()).toContain(translations.t('ar.distanceUnknown')); expect(placesService.nearby).not.toHaveBeenCalled(); expect(placesService.details).not.toHaveBeenCalled();
  controls.focused = false; await update(); controls.focused = true; await update();
  expect(tree!.root.findByProps({ testID: 'ar-selected-name' }).props.children).toBe(south.name); expect(placesService.nearby).not.toHaveBeenCalled();
});
it('adopts a new Details selection on an already mounted AR screen and retains explicit selection priority', async () => {
  await mount(); await scan(); client.setQueryData(['place-selection', south.providerId], south); controls.params = { placeId: south.providerId }; await update();
  expect(tree!.root.findByProps({ testID: 'ar-selected-name' }).props.children).toBe(south.name);
  expect(tree!.root.findByType('dialog').props.nativeIndex.get()).toBe(1);
  expect(placesService.nearby).toHaveBeenCalledTimes(1); expect(placesService.details).not.toHaveBeenCalled();
});
it('does not offer another paid load when complete details already exist for the handed-off place', async () => {
  client.setQueryData(['place-selection', south.providerId], south); client.setQueryData(['place-details', south.providerId, 'en'], south); controls.params = { placeId: south.providerId };
  await mount(); expect(tree!.root.findAllByType('button').some(b => (b.props.title ?? b.props.accessibilityLabel) === translations.t('ar.more'))).toBe(false);
  expect(placesService.details).not.toHaveBeenCalled();
});
it('shows Google and third-party credits for a Details handoff even without nearby results', async () => {
  client.setQueryData(['place-selection', south.providerId], south); controls.params = { placeId: south.providerId }; await mount();
  expect(output()).toContain('Google Maps'); expect(output()).toContain('Local Provider'); expect(placesService.nearby).not.toHaveBeenCalled();
});

it('renders one compact AR heading with honest compass state and accessible Map and Scan controls', async () => {
  await mount();
  expect(output()).toContain(translations.t('ar.title'));
  expect(output()).toContain(translations.t('ar.bearing', { degrees: 0 }));
  const buttons = tree!.root.findAllByType('button');
  const mapButton = buttons.find(b => b.props.accessibilityLabel === translations.t('navigation.backToMap'));
  const scanButton = buttons.find(b => b.props.accessibilityLabel === translations.t('ar.scan'));
  expect(mapButton).toBeDefined(); expect(scanButton).toBeDefined();
  expect(mapButton!.props.className).toContain('min-h-12'); expect(scanButton!.props.className).toContain('min-h-12');
  await press('navigation.backToMap'); expect(controls.navigate).toHaveBeenCalledWith('/');
  controls.location.heading = { degrees: 20, accuracy: 1, reference: 'magnetic' }; await update();
  expect(output()).toContain(translations.t('ar.compassUnavailable'));
  expect(output()).not.toContain(translations.t('ar.bearing', { degrees: 20 }));
  expect(placesService.nearby).not.toHaveBeenCalled();
});
it('keeps a nearest eligible selection compact until the user opens the sheet', async () => {
  await mount(); await scan();
  expect(tree!.root.findByProps({ testID: 'ar-selected-name' }).props.children).toBe(north.name);
  expect(tree!.root.findByType('dialog').props.nativeIndex.get()).toBe(0);
  expect(tree!.root.findAllByType('button').some(b => b.props.accessibilityLabel === translations.t('ar.collapse'))).toBe(false);
  await press('ar.expand');
  expect(tree!.root.findByType('dialog').props.nativeIndex.get()).toBe(1);
});
it('docks a compact panel over the camera and keeps credits outside its scrolling content', async () => {
  await mount();
  expect(tree!.root.findAllByType('dialog')).toHaveLength(1);
  await scan();
  const credits = tree!.root.findByProps({ testID: 'ar-attributions' });
  expect(credits.findByProps({ accessibilityLabel: 'Google Maps' })).toBeDefined();
  expect(credits.parent!.findAllByType('dialog')).toHaveLength(1);
  expect(tree!.root.findByType('dialog').findAllByProps({ testID: 'ar-attributions' })).toHaveLength(0);
  await press('ar.expand'); await press('ar.collapse'); expect(output()).toContain('Local Provider');
  controls.granted = false; controls.location.heading = null; await update();
  await press('ar.expand');
  await act(async () => { tree!.root.findByProps({ testID: 'ar-list-south' }).props.onPress(); });
  expect(tree!.root.findByProps({ testID: 'ar-selected-name' }).props.children).toBe(south.name);
  expect(placesService.nearby).toHaveBeenCalledTimes(1); expect(placesService.details).not.toHaveBeenCalled();
});

it('creates exactly one single-use AR route intent on Directions and preserves the selected summary', async () => {
  await mount(); await scan();
  await press('ar.expand');
  expect(routeService.walking).not.toHaveBeenCalled();
  const button = tree!.root.findAllByType('button').find(b => b.props.accessibilityLabel === translations.t('ar.directions'))!;
  await act(async () => { button.props.onPress(); button.props.onPress(); });
  expect(controls.push).toHaveBeenCalledTimes(1);
  const target = controls.push.mock.calls[0][0];
  expect(target).toMatchObject({ pathname: '/directions', params: { token: expect.any(String) } });
  expect(claimRoutePreviewIntent(client, target.params.token)).toMatchObject({ place: north, source: 'ar' });
  expect(claimRoutePreviewIntent(client, target.params.token)).toBeNull();
  expect(client.getQueryData(['place-selection', north.providerId])).toEqual(north);
  expect(routeService.walking).not.toHaveBeenCalled();
});
it('spends one route call through the real preview hook and never renews intent on AR lifecycle or preview remount', async () => {
  await mount(); await scan();
  await act(async () => { tree!.root.findByProps({ testID: 'ar-list-south' }).props.onPress(); });
  controls.focused = false; await update(); controls.focused = true; await update();
  controls.active = false; await update(); controls.active = true; await update();
  controls.location.heading = { degrees: 180, accuracy: 3, reference: 'true' }; await update();
  await act(async () => { await client.invalidateQueries(); });
  await act(async () => { tree!.unmount(); }); await mount();
  controls.language = 'ko';
  await act(async () => { await translations.changeLanguage('ko'); }); await update();
  expect(routeService.walking).not.toHaveBeenCalled(); expect(controls.push).not.toHaveBeenCalled();
  expect(client.getQueryCache().findAll({ queryKey: ['route-preview-intent'] })).toHaveLength(0);
  await act(async () => { tree!.root.findByProps({ testID: 'ar-list-south' }).props.onPress(); });
  await press('ar.directions'); const token = controls.push.mock.calls[0][0].params.token;
  controls.focused = false; await update(); controls.focused = true;
  function Probe() { useRoutePreview(token, true); return null; }
  const preview = () => React.createElement(QueryClientProvider, { client }, React.createElement(Probe));
  await act(async () => { previewTree = create(preview()); });
  controls.location.positionTimestamp = Date.now(); controls.location.watcherTimestamp = Date.now();
  await act(async () => { previewTree!.update(preview()); }); await settle();
  expect(routeService.walking).toHaveBeenCalledTimes(1);
  expect(routeService.walking).toHaveBeenLastCalledWith({ origin: { latitude: 0, longitude: 0 }, destination: south.coordinates, language: 'ko' });
  controls.focused = false; await act(async () => { previewTree!.update(preview()); });
  controls.focused = true; controls.active = false; await act(async () => { previewTree!.update(preview()); });
  controls.active = true; await act(async () => { previewTree!.update(preview()); });
  await act(async () => { previewTree!.unmount(); previewTree = create(preview()); }); await settle();
  expect(routeService.walking).toHaveBeenCalledTimes(1);
  await update(); expect(tree!.root.findByProps({ testID: 'ar-selected-name' }).props.children).toBe(south.name);
  expect(placesService.nearby).toHaveBeenCalledTimes(1); expect(placesService.details).not.toHaveBeenCalled();
});
it.each(['en', 'ko', 'ja'] as const)('keeps actual %s camera failure, fallback list and recovery copy live across a language change', async language => {
  await mount(); await scan();
  await act(async () => { tree!.root.findByType('video').props.onMountError({ message: 'private camera diagnostic' }); });
  expect(output()).toContain(translations.t('camera.mountFailed'));
  expect(output()).toContain(translations.t('ar.cameraFallback'));
  expect(tree!.root.findAllByType('video')).toHaveLength(0);
  controls.language = language;
  await act(async () => { await translations.changeLanguage(language); }); await update();
  expect(output()).toContain(translations.t('camera.mountFailed'));
  expect(output()).toContain(translations.t('ar.title'));
  expect(output()).toContain(translations.t('ar.cameraFallback'));
  expect(output()).not.toContain('private camera diagnostic');
  await act(async () => { tree!.root.findByProps({ testID: 'ar-list-south' }).props.onPress(); });
  expect(tree!.root.findByProps({ testID: 'ar-selected-name' }).props.children).toBe(south.name);
  await press('camera.retry'); expect(tree!.root.findAllByType('video')).toHaveLength(1);
  expect(output()).not.toContain(translations.t('camera.mountFailed'));
  expect(placesService.nearby).toHaveBeenCalledTimes(1); expect(placesService.details).not.toHaveBeenCalled(); expect(routeService.walking).not.toHaveBeenCalled();
});
it('retains collapsed selection through short viewport changes and suppresses labels without room', async () => {
  const places = Array.from({ length: 5 }, (_, i) => ({ ...north, providerId: `cjk${i}`, id: `google:cjk${i}`, name: '아주 긴 장소 이름 とても長い場所の名前' }));
  vi.mocked(placesService.nearby).mockResolvedValue(places); await mount(); await scan();
  await act(async () => { tree!.root.findByProps({ testID: 'ar-list-cjk4' }).props.onPress(); });
  await press('ar.collapse');
  const resize = async (width: number, height: number) => act(async () => { tree!.root.findByProps({ testID: 'ar-viewport' }).props.onLayout({ nativeEvent: { layout: { width, height } } }); });
  await resize(320, 180);
  expect(tree!.root.findAllByType(Pressable).filter(p => p.props.testID?.startsWith('ar-label-'))).toHaveLength(0);
  expect(output()).toContain('Google Maps');
  await resize(360, 640);
  expect(tree!.root.findAllByType('button').some(b => b.props.accessibilityLabel === translations.t('ar.expand'))).toBe(true);
  expect(tree!.root.findByProps({ testID: 'ar-selected-name' }).props.children).toBe(places[4].name);
  expect(tree!.root.findAllByType(Pressable).filter(p => p.props.testID?.startsWith('ar-label-'))).toHaveLength(3);
  expect(placesService.nearby).toHaveBeenCalledTimes(1); expect(placesService.details).not.toHaveBeenCalled(); expect(routeService.walking).not.toHaveBeenCalled();
});
