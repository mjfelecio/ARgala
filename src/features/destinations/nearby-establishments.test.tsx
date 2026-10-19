import { nativeUi, withHeroUI } from '@/test/native-ui';
import * as React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { QueryClient, QueryClientProvider, notifyManager, focusManager, onlineManager } from '@tanstack/react-query';
import { createInstance, type i18n } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { router } from 'expo-router';
import { queryClient } from '@/lib/query';
import { localizationOptions } from '@/i18n/options';
import { EdgeRequestError } from '@/lib/edge-error';
import { placesService, type Place } from '@/features/places/service';
import { placeSelectionOptions } from '@/features/places/selection';
import { destinationSchema, type Destination } from './catalog';
import { NearbyEstablishments } from './nearby-establishments';
const controls = vi.hoisted(() => ({ language: 'en' as 'en' | 'ko' | 'ja', focused: true, active: true }));
vi.mock('expo-router', () => ({ useIsFocused: () => controls.focused, router: { navigate: vi.fn() } }));
vi.mock('@/features/settings/provider', () => ({ useSettings: () => ({ language: controls.language }) }));
vi.mock('@/lib/use-app-active', () => ({ useAppActive: () => controls.active }));
vi.mock('@/features/places/service', () => ({ placesService: { nearby: vi.fn(), details: vi.fn() } }));
vi.mock('@/features/location/use-device-location', () => ({ useDeviceLocation: () => { throw new Error('Nearby browsing must not acquire GPS'); } }));
const destination = destinationSchema.parse({ id: 'D01', provisionalName: 'Synthetic test site', center: { latitude: 0, longitude: 0 }, centerApprovalReference: 'Test-only coordinates' });
const place = (meters: number): Place => ({ id: `google:test_${meters}`, providerId: `test_${meters}`, provider: 'google', name: `Synthetic establishment ${meters}`, coordinates: { latitude: meters / 6371008.8 * 180 / Math.PI, longitude: 0 }, attributions: [{ name: 'Synthetic provider credit', uri: 'https://example.com/credit' }] });
let client: QueryClient; let translations: i18n; let tree: ReactTestRenderer | undefined;
function render(target: Destination = destination) { return <I18nextProvider i18n={translations}><QueryClientProvider client={client}>{withHeroUI(<NearbyEstablishments destination={target} />)}</QueryClientProvider></I18nextProvider>; }
async function mount(target?: Destination) { await act(async () => { tree = create(render(target)); }); }
const output = () => JSON.stringify(tree!.toJSON());
function button(key = 'destinations.exploreNearby') { return tree!.root.findAllByType('button').find(b => b.props.accessibilityLabel === translations.t(key)); }
async function search() { await act(async () => button()!.props.onPress()); }
beforeEach(async () => {
 Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true, __DEV__: false }); Object.assign(controls, { language: 'en', active: true, focused: true });
 vi.clearAllMocks(); vi.mocked(placesService.nearby).mockReset().mockResolvedValue([place(499), place(500), place(500.1), place(501)]);
 nativeUi.openURL.mockReset().mockResolvedValue(undefined); notifyManager.setScheduler(cb => cb());
 client = new QueryClient({ defaultOptions: queryClient.getDefaultOptions() });
 translations = createInstance(); await translations.use(initReactI18next).init({ ...localizationOptions, lng: 'en', react: { useSuspense: false } });
 const original = console.error; vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => { if (!String(args[0]).startsWith('react-test-renderer is deprecated')) original(...args); });
});
afterEach(async () => { await act(async () => tree?.unmount()); tree = undefined; client.clear(); notifyManager.setScheduler(cb => setTimeout(cb, 0)); focusManager.setFocused(undefined); onlineManager.setOnline(true); vi.restoreAllMocks(); });
it('has no request on entry, then explicitly searches the destination center and filters before rounding', async () => {
 await mount(); expect(placesService.nearby).not.toHaveBeenCalled(); expect(output()).toContain(translations.t('destinations.nearbyUnsearched'));
 await search(); expect(placesService.nearby).toHaveBeenCalledExactlyOnceWith({ center: destination.center, radiusMeters: 500, language: 'en' });
 expect(output()).toContain(place(499).name); expect(output()).toContain(place(500).name); expect(output()).not.toContain(place(500.1).name); expect(output()).not.toContain(place(501).name);
 expect(output()).toContain(translations.t('destinations.fromDestination', { meters: 499 })); expect(output()).toContain(translations.t('destinations.nearbyLimit', { count: 20 })); expect(output()).toContain('Google Maps'); expect(output()).toContain('Synthetic provider credit');
});
it.each([undefined, { latitude: NaN, longitude: 0 }])('blocks missing/invalid center %j before provider work', async center => {
 await mount({ ...destination, center }); expect(button()?.props.disabled).toBe(true); await search(); expect(placesService.nearby).not.toHaveBeenCalled();
 expect(output()).toContain(translations.t(center ? 'destinations.centerInvalid' : 'destinations.centerMissing'));
});
it('does not accept a center without its independent approval', async () => {
 await mount({ ...destination, centerApprovalReference: undefined }); await search(); expect(placesService.nearby).not.toHaveBeenCalled();
});
it('retains provider ID, selection and real credit on opening the existing details flow', async () => {
 await mount(); await search();
 const row = tree!.root.findAllByType('button').find(b => b.props.accessibilityLabel === place(499).name)!;
 await act(async () => { row.props.onPress(); row.props.onPress(); });
 expect(router.navigate).toHaveBeenCalledExactlyOnceWith({ pathname: '/place/[providerId]', params: { providerId: place(499).providerId } });
 expect(client.getQueryData(placeSelectionOptions(place(499).providerId).queryKey)).toEqual(place(499)); expect(placesService.details).not.toHaveBeenCalled();
});
it('deduplicates rapid searches and shows real loading and empty states', async () => {
 const pending = Promise.withResolvers<Place[]>(); vi.mocked(placesService.nearby).mockReturnValue(pending.promise); await mount();
 await act(async () => { button()!.props.onPress(); button()!.props.onPress(); }); expect(placesService.nearby).toHaveBeenCalledOnce(); expect(button()!.props.disabled).toBe(true);
 expect(output()).toContain(translations.t('common.loading'));
 await act(async () => pending.resolve([])); expect(output()).toContain(translations.t('destinations.nearbyEmpty'));
});
it.each(['RATE_LIMITED', 'UPSTREAM_ERROR', 'UNAUTHORIZED', 'FUTURE_ERROR', null])('localizes %s without exposing diagnostics and retries only explicitly', async code => {
 const failure = code === null ? new Error('Private provider diagnostics') : new EdgeRequestError(code);
 vi.mocked(placesService.nearby).mockRejectedValueOnce(failure); await mount(); await search();
 const key = code === 'RATE_LIMITED' ? 'service.rateLimited' : code === 'UPSTREAM_ERROR' ? 'service.unavailable' : code === 'UNAUTHORIZED' ? 'service.unauthorized' : 'service.failed';
 for (const language of ['en', 'ko', 'ja']) { await act(async () => { await translations.changeLanguage(language); }); expect(output()).toContain(translations.t(key)); expect(output()).not.toContain(failure.message); }
 expect(placesService.nearby).toHaveBeenCalledOnce(); await search(); expect(placesService.nearby).toHaveBeenCalledTimes(2); expect(output()).not.toContain(translations.t(key));
});
it.each([false, true])('never repeats paid work across focus, foreground, reconnect, remount, invalidation or language change after failure=%s', async failed => {
 if (failed) vi.mocked(placesService.nearby).mockRejectedValueOnce(new Error('Private diagnostic'));
 await mount(); await search();
 controls.focused = false; controls.active = false; await act(async () => tree!.update(render()));
 controls.focused = true; controls.active = true; await act(async () => tree!.update(render()));
 await act(async () => { await client.invalidateQueries(); focusManager.setFocused(false); focusManager.setFocused(true); onlineManager.setOnline(false); onlineManager.setOnline(true); });
 await act(async () => tree!.unmount()); await mount(); expect(placesService.nearby).toHaveBeenCalledOnce();
 controls.language = 'ja'; await act(async () => { await translations.changeLanguage('ja'); tree!.update(render()); });
 expect(placesService.nearby).toHaveBeenCalledOnce(); await search(); expect(placesService.nearby).toHaveBeenCalledTimes(2); expect(placesService.nearby).toHaveBeenLastCalledWith({ center: destination.center, radiusMeters: 500, language: 'ja' });
});
it('does not retain authority through result eviction or inactive owners', async () => {
 await mount(); await search(); await act(async () => tree!.unmount()); client.removeQueries({ queryKey: ['destination-nearby'] }); await mount(); expect(placesService.nearby).toHaveBeenCalledOnce();
 controls.focused = false; await act(async () => tree!.update(render())); await search(); expect(placesService.nearby).toHaveBeenCalledOnce();
 controls.focused = true; await act(async () => tree!.update(render())); await search(); expect(placesService.nearby).toHaveBeenCalledTimes(2);
});
it('fails an offline explicit attempt without queueing a paid request for reconnect', async () => {
 onlineManager.setOnline(false); vi.mocked(placesService.nearby).mockRejectedValueOnce(new Error('Offline'));
 await mount(); await search(); expect(placesService.nearby).toHaveBeenCalledOnce();
 await act(async () => onlineManager.setOnline(true)); expect(placesService.nearby).toHaveBeenCalledOnce(); expect(output()).toContain(translations.t('service.failed'));
});
