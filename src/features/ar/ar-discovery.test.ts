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

const controls = vi.hoisted(() => ({ active: true, focused: true, granted: true,
  language: 'en' as 'en' | 'ko' | 'ja', radius: 100,
  location: { status: 'ready', watcherStatus: 'ready', position: { latitude: 0, longitude: 0 } as { latitude: number; longitude: number } | null,
    accuracy: 5 as number | null, positionTimestamp: 0, watcherTimestamp: 0, headingTimestamp: 0,
    headingStatus: 'ready', heading: { degrees: 0, accuracy: 3, reference: 'true' } as { degrees: number; accuracy: number; reference: string } | null, retry: vi.fn() },
  navigate: vi.fn(), getPermission: vi.fn(),
}));
vi.mock('expo-router', () => ({ useIsFocused: () => controls.focused, router: { navigate: controls.navigate } }));
vi.mock('expo-camera', async () => {
  const { createElement } = await import('react');
  return { CameraView: (props: Record<string, unknown>) => createElement('video', props),
    useCameraPermissions: () => [{ granted: controls.granted, canAskAgain: true }, controls.getPermission, controls.getPermission] };
});
vi.mock('react-native', () => ({ View: 'view', Text: 'text', Image: 'img', Pressable: 'pressable', ScrollView: 'scroll',
  Alert: { alert: vi.fn() }, Linking: { openSettings: vi.fn(), openURL: vi.fn() },
  StyleSheet: { create: (styles: unknown) => styles, absoluteFill: {} } }));
vi.mock('@/features/settings/provider', () => ({ useSettings: () => ({ language: controls.language, activationRadiusMeters: controls.radius }) }));
vi.mock('@/features/location/use-device-location', () => ({ useDeviceLocation: () => controls.location }));
vi.mock('@/lib/use-app-active', () => ({ useAppActive: () => controls.active }));
vi.mock('@/features/places/service', () => ({ placesService: { nearby: vi.fn(), details: vi.fn() } }));
vi.mock('@/ui/shared', async () => {
  const { createElement } = await import('react');
  return { Screen: 'screen', Notice: 'output', Action: (props: Record<string, unknown>) => createElement('button', props) };
});
const north: Place = { id: 'google:north', providerId: 'north', provider: 'google', name: 'North Cafe', address: 'First Street',
  coordinates: { latitude: 0.0001, longitude: 0 }, attributions: [{ name: 'Local Provider', uri: 'https://example.com/credits' }] };
const south: Place = { ...north, id: 'google:south', providerId: 'south', name: 'South Park', coordinates: { latitude: -0.002, longitude: 0 } };
let client: QueryClient; let translations: i18n; let tree: ReactTestRenderer | undefined;
const render = () => React.createElement(I18nextProvider, { i18n: translations }, React.createElement(QueryClientProvider, { client }, React.createElement(ArScreen)));
const output = () => JSON.stringify(tree!.toJSON());
async function mount() { await act(async () => { tree = create(render()); }); }
async function press(key: string) {
  const button = tree!.root.findAllByType('button').find((b) => b.props.title === translations.t(key));
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
  controls.navigate.mockReset(); controls.getPermission.mockReset().mockResolvedValue({ granted: true });
  vi.mocked(placesService.nearby).mockReset().mockResolvedValue([north, south]);
  vi.mocked(placesService.details).mockReset().mockResolvedValue({ ...north, description: 'Provider description' });
  notifyManager.setScheduler((callback) => callback());
  client = new QueryClient({ defaultOptions: queryClient.getDefaultOptions() });
  translations = createInstance(); await translations.use(initReactI18next).init({ ...localizationOptions, lng: 'en', react: { useSuspense: false } });
  const original = console.error;
  vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => { if (!String(args[0]).startsWith('react-test-renderer is deprecated')) original(...args); });
});
afterEach(async () => { await act(async () => tree?.unmount()); tree = undefined; client.clear(); notifyManager.setScheduler((callback) => setTimeout(callback, 0)); vi.useRealTimers(); vi.restoreAllMocks(); });
it('scans at current GPS only on action, selects camera labels, and requests details explicitly', async () => {
  await mount(); expect(placesService.nearby).not.toHaveBeenCalled();
  await scan();
  expect(placesService.nearby).toHaveBeenCalledWith({ center: { latitude: 0, longitude: 0 }, radiusMeters: 1000, language: 'en' });
  await act(async () => { tree!.root.findByProps({ testID: 'ar-viewport' }).props.onLayout({ nativeEvent: { layout: { width: 360 } } }); });
  const labels = tree!.root.findAllByType(Pressable).filter((p) => p.props.testID?.startsWith('ar-label-'));
  expect(labels).toHaveLength(1);
  await act(async () => { labels[0].props.onPress(); });
  expect(output()).toContain('First Street'); expect(output()).toContain(translations.t('ar.distance', { meters: 11 }));
  expect(placesService.details).not.toHaveBeenCalled();
  await press('ar.more'); await settle(); expect(output()).toContain('Provider description');
  await press('ar.directions'); expect(controls.navigate).toHaveBeenCalledWith({ pathname: '/', params: { placeId: 'north' } });
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
  const button = tree!.root.findAllByType('button').find((b) => b.props.title === translations.t('ar.scan'))!;
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
  await act(async () => { tree!.root.findByProps({ testID: 'ar-viewport' }).props.onLayout({ nativeEvent: { layout: { width: 320 } } }); });
  await act(async () => { tree!.root.findByProps({ testID: 'ar-list-place19' }).props.onPress(); });
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
  await mount(); await scan(); await press('ar.more'); await settle();
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
 await mount(); await scan(); await press('ar.more'); await settle();
 expect(output()).toContain('Provider description');
 expect(tree!.root.findAllByType('button').filter(b=>b.props.title===translations.t('ar.more'))).toHaveLength(0);
 expect(placesService.details).toHaveBeenCalledTimes(1);
});

it('allows an explicit details request in a new language after hiding the loaded-language action', async () => {
 await mount(); await scan(); await press('ar.more'); await settle();
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
  await mount(); await scan(); await press('placeDetails.view');
  expect(controls.navigate).toHaveBeenLastCalledWith({ pathname: '/place/[providerId]', params: { providerId: north.providerId } });
  expect(client.getQueryData(['place-selection', north.providerId])).toEqual(north);
  expect(placesService.details).not.toHaveBeenCalled(); expect(placesService.nearby).toHaveBeenCalledTimes(1);
  controls.focused = false; await update(); expect(tree!.root.findAllByType('video')).toHaveLength(0);
  controls.focused = true; await update(); expect(tree!.root.findByProps({ testID: 'ar-selected-name' }).props.children).toBe(north.name);
  expect(placesService.details).not.toHaveBeenCalled(); expect(placesService.nearby).toHaveBeenCalledTimes(1);
});
