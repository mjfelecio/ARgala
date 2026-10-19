import { nativeUi, withHeroUI } from '@/test/native-ui';
import * as React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { QueryClient, QueryClientProvider, notifyManager } from '@tanstack/react-query';
import { createInstance, type i18n } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { queryClient } from '@/lib/query';
import { localizationOptions } from '@/i18n/options';
import { EdgeRequestError } from '@/lib/edge-error';
import { placesService, type Place } from './service';
import { placeSelectionOptions } from './selection';
import PlaceDetailsScreen from './place-details-screen';

const controls = vi.hoisted(() => ({ params: { providerId: 'north' } as Record<string, unknown>, language: 'en' as 'en' | 'ko' | 'ja', focused: true, active: true, back: true }));
vi.mock('expo-router', () => ({ useLocalSearchParams: () => controls.params, useIsFocused: () => controls.focused,
  router: { back: vi.fn(), canGoBack: () => controls.back, navigate: vi.fn(), dismissTo: vi.fn() } }));
vi.mock('@/features/settings/provider', () => ({ useSettings: () => ({ language: controls.language }) }));
vi.mock('@/lib/use-app-active', () => ({ useAppActive: () => controls.active }));
vi.mock('./service', () => ({ placesService: { details: vi.fn(), nearby: vi.fn() } }));
const place: Place = { id: 'google:north', provider: 'google', providerId: 'north', name: 'North place', coordinates: { latitude: 10, longitude: 124 }, attributions: [] };
let tree: ReactTestRenderer | undefined; let client: QueryClient; let translations: i18n;
function render() { return <I18nextProvider i18n={translations}><QueryClientProvider client={client}>{withHeroUI(<PlaceDetailsScreen />)}</QueryClientProvider></I18nextProvider>; }
async function mount() { await act(async () => { tree = create(render()); }); }
function output() { return JSON.stringify(tree!.toJSON()); }
function button(key: string) { return tree!.root.findAllByType('button').find(b => b.props.accessibilityLabel === translations.t(key)); }
async function press(key: string) { const b = button(key); expect(b, key).toBeDefined(); expect(b!.props.disabled).not.toBe(true); await act(async () => { b!.props.onPress(); }); }
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
it('reads the cached selection and never requests details on entry', async () => {
  client.setQueryData(placeSelectionOptions('north').queryKey, place); await mount();
  expect(output()).toContain(place.name); expect(placesService.details).not.toHaveBeenCalled();
});
it.each([undefined, '', '../bad', ['north', 'south'], 'x'.repeat(4097)])('handles invalid or missing provider ID %j without a request', async id => {
  controls.params = { providerId: id }; await mount();
  expect(output()).toContain(translations.t('placeDetails.unavailable')); expect(button('placeDetails.load')).toBeUndefined(); expect(placesService.details).not.toHaveBeenCalled();
});
it('recovers a cold-open selection only after explicit Load Details', async () => {
  await mount(); expect(output()).toContain(translations.t('placeDetails.unavailable')); expect(placesService.details).not.toHaveBeenCalled();
  await press('placeDetails.load'); expect(placesService.details).toHaveBeenCalledExactlyOnceWith('north', 'en');
  expect(output()).toContain(place.name); expect(button('placeDetails.load')).toBeUndefined();
});
it('retains summary on a sanitized failure and recovers explicitly', async () => {
  client.setQueryData(placeSelectionOptions('north').queryKey, place);
  vi.mocked(placesService.details).mockRejectedValueOnce(new EdgeRequestError('RATE_LIMITED'));
  await mount(); await press('placeDetails.load'); expect(output()).toContain(place.name); expect(output()).toContain(translations.t('service.rateLimited'));
  await press('placeDetails.load'); expect(placesService.details).toHaveBeenCalledTimes(2); expect(button('placeDetails.load')).toBeUndefined();
});
it('ignores cached detail for another provider ID', async () => {
  client.setQueryData(['place-details', 'north', 'en'], { ...place, providerId: 'south', name: 'Wrong place' }); await mount();
  expect(output()).not.toContain('Wrong place'); expect(button('placeDetails.load')).toBeDefined();
});
it.each(['en', 'ko', 'ja'] as const)('renders real sparse content, full long text and credits in %s', async language => {
  controls.language = language; await translations.changeLanguage(language);
  const sparse = { ...place, name: 'A long name 日本語 한국어 '.repeat(12), address: 'Real supplied address', attributions: [{ name: 'Real provider credit' }] };
  client.setQueryData(placeSelectionOptions('north').queryKey, sparse); await mount();
  expect(output()).toContain(sparse.name); expect(output()).toContain(sparse.address); expect(output()).toContain('Real provider credit');
  expect(output()).toContain('Google Maps'); expect(output()).toContain(translations.t('placeDetails.coordinates'));
  expect(output()).not.toContain('GPS LOCKED'); expect(output()).not.toContain('UNESCO'); expect(output()).not.toContain('min walk');
  expect(tree!.root.findAllByType('text').find(n => n.props.children === sparse.name)!.props.numberOfLines).toBeUndefined();
});
it('hides missing sections and never invents a distance from an old Map/AR position', async () => {
  client.setQueryData(placeSelectionOptions('north').queryKey, place); await mount();
  expect(output()).not.toContain(translations.t('placeDetails.overview')); expect(output()).not.toContain(translations.t('placeDetails.address'));
  expect(output()).toContain(translations.t('placeDetails.distanceUnavailable')); expect(tree!.root.findAllByProps({ testID: 'place-media-fallback' })).toHaveLength(1);
});
it('renders a genuine description when available', async () => {
  client.setQueryData(['place-details', 'north', 'en'], { ...place, description: 'Provider-supplied overview', address: 'Provider address' }); await mount();
  expect(output()).toContain('Provider-supplied overview'); expect(output()).toContain(translations.t('placeDetails.overview')); expect(button('placeDetails.load')).toBeUndefined();
});
it('keeps summary visible while details are loading, blocks repeated presses, and hides the completed recovery', async () => {
  const pending = Promise.withResolvers<Place>(); vi.mocked(placesService.details).mockReturnValue(pending.promise);
  client.setQueryData(placeSelectionOptions('north').queryKey, place); await mount(); await press('placeDetails.load');
  expect(output()).toContain(place.name); expect(output()).toContain(translations.t('placeDetails.loading')); expect(button('placeDetails.load')!.props.disabled).toBe(true);
  await act(async () => { button('placeDetails.load')!.props.onPress(); }); expect(placesService.details).toHaveBeenCalledTimes(1);
  await act(async () => { pending.resolve(place); }); expect(button('placeDetails.load')).toBeUndefined();
});
it.each(['en', 'ko', 'ja'])('presents an approved image only when explicitly supplied to the %s presentation', async language => {
  await translations.changeLanguage(language);
  const { PlaceDetailsContent } = await import('./place-details-content');
  await act(async () => { tree = create(<I18nextProvider i18n={translations}>{withHeroUI(<PlaceDetailsContent place={place} approvedImage={{ source: { uri: 'https://example.com/synthetic-fixture.png' }, accessibilityLabel: 'Synthetic test illustration', credit: 'Synthetic fixture credit' }} />)}</I18nextProvider>); });
  expect(output()).toContain('Synthetic test illustration'); expect(output()).toContain('Synthetic fixture credit');
  expect(tree!.root.findAllByProps({ testID: 'place-media-fallback' })).toHaveLength(0);
});
it.each(['placeDetails.directions', 'placeDetails.map', 'placeDetails.ar'])('hands off the selection through %s without provider work', async key => {
  const { router } = await import('expo-router');
  client.setQueryData(placeSelectionOptions('north').queryKey, place); await mount();
  expect(output()).toContain(translations.t('placeDetails.directionsHint', { action: translations.t('map.walk') })); await press(key);
  expect(router.dismissTo).toHaveBeenCalledExactlyOnceWith({ pathname: key === 'placeDetails.ar' ? '/ar' : '/', params: { placeId: 'north' } });
  expect(client.getQueryData(placeSelectionOptions('north').queryKey)).toEqual(place); expect(placesService.details).not.toHaveBeenCalled(); expect(placesService.nearby).not.toHaveBeenCalled();
});
it('returns to its originating screen with Back, with a safe direct-entry fallback', async () => {
  const { router } = await import('expo-router'); await mount(); await press('placeDetails.back'); expect(router.back).toHaveBeenCalledOnce();
  controls.back = false; await press('placeDetails.back'); expect(router.navigate).toHaveBeenCalledWith('/'); expect(placesService.details).not.toHaveBeenCalled();
});
it('has no destination actions without a cached place and ignores loading when no longer focused', async () => {
  await mount(); for (const key of ['placeDetails.directions', 'placeDetails.map', 'placeDetails.ar']) expect(button(key)).toBeUndefined();
  controls.focused = false; await act(async () => tree!.update(render())); await act(async () => { button('placeDetails.load')!.props.onPress(); }); expect(placesService.details).not.toHaveBeenCalled();
});
it('prevents duplicate navigation on rapid action presses', async () => {
  const { router } = await import('expo-router'); client.setQueryData(placeSelectionOptions('north').queryKey, place); await mount();
  await act(async () => { button('placeDetails.map')!.props.onPress(); button('placeDetails.map')!.props.onPress(); }); expect(router.dismissTo).toHaveBeenCalledOnce();
});
it('retains full details through refocus, foreground, reconnect, invalidation, locale changes and remount without requests', async () => {
  const { focusManager, onlineManager } = await import('@tanstack/react-query');
  client.setQueryData(placeSelectionOptions('north').queryKey, place); await mount(); await press('placeDetails.load');
  controls.focused = false; controls.active = false; await act(async () => tree!.update(render())); controls.focused = true; controls.active = true; await act(async () => tree!.update(render()));
  await act(async () => { await client.invalidateQueries(); focusManager.setFocused(false); focusManager.setFocused(true); onlineManager.setOnline(false); onlineManager.setOnline(true); });
  await act(async () => { tree!.unmount(); }); await mount(); expect(button('placeDetails.load')).toBeUndefined();
  controls.language = 'ja'; await act(async () => { await translations.changeLanguage('ja'); tree!.update(render()); });
  expect(output()).toContain(place.name); expect(placesService.details).toHaveBeenCalledTimes(1); expect(placesService.nearby).not.toHaveBeenCalled();
});
it.each(['RATE_LIMITED', 'UPSTREAM_ERROR', 'UNAUTHORIZED', 'FUTURE_ERROR', null])('translates %s failures with actual locale resources and recovers without leaking diagnostics', async code => {
  const failure = code === null ? new Error('Private provider diagnostic') : new EdgeRequestError(code);
  vi.mocked(placesService.details).mockRejectedValueOnce(failure); client.setQueryData(placeSelectionOptions('north').queryKey, place);
  await mount(); await press('placeDetails.load');
  const key = code === 'RATE_LIMITED' ? 'service.rateLimited' : code === 'UPSTREAM_ERROR' ? 'service.unavailable' : code === 'UNAUTHORIZED' ? 'service.unauthorized' : 'service.failed';
  for (const language of ['en', 'ko', 'ja']) {
    await act(async () => { await translations.changeLanguage(language); });
    expect(translations.t(key)).not.toBe(key); expect(output()).toContain(translations.t(key)); expect(output()).not.toContain(failure.message); expect(output()).toContain(place.name);
  }
  await press('placeDetails.load'); expect(output()).not.toContain(translations.t(key)); expect(button('placeDetails.load')).toBeUndefined(); expect(placesService.details).toHaveBeenCalledTimes(2);
});
it('does not retry a failed explicit request after remount, invalidation or foreground return', async () => {
  vi.mocked(placesService.details).mockRejectedValueOnce(new Error('Private diagnostic')); await mount(); await press('placeDetails.load');
  controls.active = false; controls.focused = false; await act(async () => tree!.update(render()));
  controls.active = true; controls.focused = true; await act(async () => tree!.update(render()));
  await act(async () => { await client.invalidateQueries(); tree!.unmount(); }); await mount(); expect(placesService.details).toHaveBeenCalledTimes(1);
  await press('placeDetails.load'); expect(output()).toContain(place.name); expect(placesService.details).toHaveBeenCalledTimes(2);
});
it('falls back honestly when an approved presentation image fails', async () => {
  const { PlaceDetailsContent } = await import('./place-details-content');
  await act(async () => { tree = create(<I18nextProvider i18n={translations}>{withHeroUI(<PlaceDetailsContent place={place} approvedImage={{ source: { uri: 'https://example.com/synthetic-fixture.png' }, accessibilityLabel: 'Synthetic image', credit: 'Test credit' }} />)}</I18nextProvider>); });
  await act(async () => { tree!.root.findAllByType('img').find(img => img.props.accessibilityLabel === 'Synthetic image')!.props.onError(); });
  expect(tree!.root.findAllByProps({ testID: 'place-media-fallback' })).toHaveLength(1); expect(output()).toContain(place.name);
});
it('retains real linked third-party credits and translates provider-link failures at the UI boundary', async () => {
  client.setQueryData(placeSelectionOptions('north').queryKey, { ...place, mapsUri: 'https://maps.google.com/?cid=1', attributions: [{ name: 'Actual supplied credit', uri: 'https://example.com/credit' }] });
  await mount(); const credit = tree!.root.findAllByType('text').find(n => n.props.children === 'Actual supplied credit')!;
  expect(credit.props.accessibilityRole).toBe('link'); await act(async () => { credit.props.onPress(); }); expect(nativeUi.openURL).toHaveBeenLastCalledWith('https://example.com/credit');
  await press('map.openGoogle'); expect(nativeUi.openURL).toHaveBeenLastCalledWith('https://maps.google.com/?cid=1');
  nativeUi.openURL.mockRejectedValue(new Error('Raw native diagnostics'));
  for (const language of ['en', 'ko', 'ja']) {
    await act(async () => { await translations.changeLanguage(language); }); await press('map.openGoogle');
    expect(nativeUi.alert).toHaveBeenLastCalledWith(translations.t('map.linkFailed'));
  }
});
it('offers explicit recovery after cached selection and full details have been evicted', async () => {
  client.setQueryData(placeSelectionOptions('north').queryKey, place); await mount(); await press('placeDetails.load');
  await act(async () => { tree!.unmount(); }); client.removeQueries({ queryKey: ['place-selection'] }); client.removeQueries({ queryKey: ['place-details'] }); await mount();
  expect(output()).not.toContain(place.name); expect(output()).toContain(translations.t('placeDetails.unavailable')); expect(placesService.details).toHaveBeenCalledTimes(1);
  await press('placeDetails.load'); expect(output()).toContain(place.name); expect(placesService.details).toHaveBeenCalledTimes(2);
});
