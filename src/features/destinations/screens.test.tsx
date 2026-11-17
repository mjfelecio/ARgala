import { JournalContext, type JournalContextValue } from '@/features/journal/context';
import { emptyJournal } from '@/features/journal/model';
import { withHeroUI, nativeUi } from '@/test/native-ui';
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
import { destinationName, listDestinations } from './catalog';
import DestinationsScreen from './destinations-screen';
import DestinationScreen from './destination-screen';
import { DestinationContentContext } from '@/features/destination-content/context';

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
it.each(['en', 'ja', 'ko'] as const)('shows complete %s visitor guidance and the supplied cover without starting paid work', async language => {
  controls.language = language; await translations.changeLanguage(language); await mount();
  const destination = listDestinations()[0];
  const guide = destination.visitorGuide![language].value;
  expect(output()).toContain(destinationName(destination, language));
  expect(output()).toContain(destination.copy![language]!.overview!.value);
  expect(output()).toContain(guide.arrival);
  expect(output()).toContain(guide.bestTime);
  for (const item of [...guide.activities, ...guide.preparation, ...guide.safety]) expect(output()).toContain(item);
  expect(output()).not.toContain(translations.t('destinations.contentPending'));
  expect(tree!.root.findAllByType('img')[0].props.source).toBe(destination.media![0].source);
  expect(placesService.nearby).not.toHaveBeenCalled(); expect(placesService.details).not.toHaveBeenCalled();
});
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true, __DEV__: false });
  Object.assign(controls, { params: { destinationId: 'D01' }, language: 'en', focused: true, active: true, back: true });
  vi.clearAllMocks(); nativeUi.openURL.mockResolvedValue(undefined); notifyManager.setScheduler(cb => cb());
  client = new QueryClient({ defaultOptions: queryClient.getDefaultOptions() });
  translations = createInstance(); await translations.use(initReactI18next).init({ ...localizationOptions, lng: 'en', react: { useSuspense: false } });
  const original = console.error; vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => { if (!String(args[0]).startsWith('react-test-renderer is deprecated')) original(...args); });
});
afterEach(async () => { await act(async () => tree?.unmount()); tree = undefined; client.clear(); notifyManager.setScheduler(cb => setTimeout(cb, 0)); vi.restoreAllMocks(); });
it('lists all nine presentation destinations with working stable-ID map navigation and no sensors or provider work', async () => {
  await mount(<DestinationsScreen />);
  for (const destination of listDestinations()) {
    expect(output()).toContain(destination.provisionalName);
    const card = tree!.root.findAllByType('button').find(b => b.props.accessibilityLabel === destination.provisionalName)!;
    await act(async () => card.props.onPress());
    expect(router.navigate).toHaveBeenLastCalledWith({ pathname: '/', params: { featuredDestinationId: destination.id } });
  }
  expect(placesService.nearby).not.toHaveBeenCalled(); expect(placesService.details).not.toHaveBeenCalled();
});
it.each(listDestinations())('opens $id directly with complete visitor content without paid requests', async destination => {
  controls.params = { destinationId: destination.id }; await mount();
  expect(output()).toContain(destination.provisionalName);
  for (const key of ['destinations.contentPending', 'destinations.centerMissing', 'destinations.entranceMissing']) expect(output()).not.toContain(translations.t(key));
  expect(button('placeDetails.directions')?.props.disabled).not.toBe(true);
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
it('uses history for Back and translates visitor sections with actual resources on locale changes', async () => {
  await mount(); await act(async () => button('placeDetails.back')!.props.onPress()); expect(router.back).toHaveBeenCalledOnce();
  for (const language of ['en', 'ko', 'ja'] as const) {
    controls.language = language;
    await act(async () => { await translations.changeLanguage(language); tree!.update(render()); });
    for (const key of ['destinations.title', 'destinations.visitorGuide.arrival', 'destinations.visitorGuide.safety']) {
      expect(translations.t(key)).not.toBe(key); expect(output()).toContain(translations.t(key));
    }
  }
  expect(placesService.nearby).not.toHaveBeenCalled();
});
it('shows a supplied summary without exposing AR chapter bodies', async () => {
 const catalog = await import('./catalog');
 const fixture = catalog.destinationSchema.parse({ id: 'D01', provisionalName: 'Synthetic fixture', copy: { en: { overview: { value: 'Approved test overview', approvalReference: 'Test' } } } });
 vi.spyOn(catalog, 'getDestination').mockReturnValue(fixture);
 await mount();
 for (const language of ['en', 'ja', 'ko'] as const) {
   controls.language = language; await act(async () => { await translations.changeLanguage(language); tree!.update(render()); });
   expect(output()).toContain('Approved test overview'); expect(output()).not.toContain('featuredResearch.stories');
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
it.each(['en', 'ja', 'ko'])('puts %s destination choices before optional content maintenance', async locale => {
  await translations.changeLanguage(locale);
  await mount(<DestinationContentContext.Provider value={{ manifest: null, ready: true, checking: false, canCheck: true, authenticated: true, message: 'content.bundled', error: null, checkUpdates: vi.fn() }}><DestinationsScreen /></DestinationContentContext.Provider>);
  const copy = tree!.root.findAllByType('text').map(node => node.props.children);
  const updates = copy.indexOf(translations.t('content.title'));
  const destination = copy.indexOf('ACLC College of Ormoc');
  expect(destination).toBeGreaterThan(-1);
  expect(updates).toBeGreaterThan(destination);
  const action = tree!.root.findAllByType('button').find(node => node.props.accessibilityLabel === 'ACLC College of Ormoc')!;
  expect(action.props.className).toContain('rounded-card');
  expect(action.props.className).toContain('bg-surface');
  const name = action.findAllByType('text').find(node => node.props.children === 'ACLC College of Ormoc')!;
  expect(name.props.className).toContain('text-card');
  expect(action.findAllByType('text').map(node => node.props.children).flat()).not.toContain(translations.t('destinations.provisional'));
  expect(placesService.nearby).not.toHaveBeenCalled();
  expect(placesService.details).not.toHaveBeenCalled();
});
it('shows the supplied summary but keeps full AR chapters out of prearrival 2D details', async () => {
 const catalog = await import('./catalog');
 const fixture = catalog.destinationSchema.parse({ id: 'D01', provisionalName: 'Synthetic featured', copy: { en: { overview: { value: 'Private approved overview', approvalReference: 'test' }, highlights: { value: ['Private approved highlight'], approvalReference: 'test' } } } });
 vi.spyOn(catalog, 'getDestination').mockReturnValue(fixture);
 await mount();
 expect(output()).toContain('Private approved overview'); expect(output()).not.toContain('Private approved highlight');
});

it.each(['en', 'ja', 'ko'])('renders the %s catalog count from the preserved nine-destination total', async language => {
  await translations.changeLanguage(language); await mount(<DestinationsScreen />);
  const heading = translations.t('destinations.exploreCount', { count: 9 });
  expect(heading).not.toBe('destinations.exploreCount');
  expect(output()).toContain(heading);
  expect(placesService.details).not.toHaveBeenCalled();
  expect(placesService.nearby).not.toHaveBeenCalled();
});

it('keeps supplied content in the single page scroll owner and preserves directions', async () => {
 await mount();
 const info = tree!.root.findByProps({ testID: 'destination-information' });
 expect(info.findAllByType('text').map(node => node.props.children)).toContain(translations.t('destinations.visitorGuide.arrival'));
 expect(button('placeDetails.directions')!.findAllByType('icon' as React.ElementType).map(node => node.props.name)).toContain('navigate-outline');
 expect(placesService.nearby).not.toHaveBeenCalled(); expect(placesService.details).not.toHaveBeenCalled();
});

it('reports installed approved story availability without granting prearrival story access or changing bundled navigation', async () => {
 const {contentManifestSchema}=await import('@/features/destination-content/model');
 const {manifest}=await import('@/features/destination-content/test-fixtures');
 controls.params={destinationId:'pilot-aclc'};
 const state={manifest:contentManifestSchema.parse(manifest()),ready:true,checking:false,canCheck:true,authenticated:true,message:'content.cached' as const,error:null,checkUpdates:vi.fn()};
 await mount(<DestinationContentContext.Provider value={state}><DestinationScreen/></DestinationContentContext.Provider>);
 for(const locale of ['en','ja','ko']) {
  controls.language=locale as 'en'|'ja'|'ko';
  await act(async()=>{await translations.changeLanguage(locale);tree!.update(render(<DestinationContentContext.Provider value={state}><DestinationScreen/></DestinationContentContext.Provider>));});
  expect(output()).toContain(translations.t('destinations.storiesOnSite'));
  expect(output()).not.toContain(translations.t('destinations.storiesPending'));
  expect(output()).not.toContain('Synthetic test');
 }
 expect(button('placeDetails.directions')!.props.disabled).not.toBe(true);
 expect(placesService.nearby).not.toHaveBeenCalled();expect(placesService.details).not.toHaveBeenCalled();
});

it('removes provisional and research-status presentation from completed catalog entries', async()=>{
 await mount(<DestinationsScreen/>);
 expect(tree!.root.findAllByType('text').some(node => node.props.children === translations.t('destinations.provisional'))).toBe(false);
 await act(async()=>tree!.update(render(<DestinationScreen/>)));
 expect(tree!.root.findAllByType('text').some(node => node.props.children === translations.t('destinations.provisional'))).toBe(false);
 expect(output()).not.toContain(translations.t('destinations.contentPending'));
});

it('makes Maps the full-width primary action while preserving secondary Directions and all visitor guidance', async () => {
 await mount();
 const maps = button('destinationCleanup.openMaps');
 expect(maps).toBeDefined();
 expect(maps!.props.className).toContain('w-full');
 expect(button('placeDetails.directions')!.props.className).toContain('button__root--variant-secondary');
 await act(async () => maps!.props.onPress());
 expect(nativeUi.openURL).toHaveBeenCalledWith(expect.stringContaining('https://www.google.com/maps/'));
 expect(placesService.details).not.toHaveBeenCalled(); expect(placesService.nearby).not.toHaveBeenCalled();
});
it('opens listing photography separately from the sibling title map action, with no nested buttons', async () => {
 await mount(<DestinationsScreen />);
 const destination = listDestinations()[0];
 const name = destinationName(destination, 'en');
 const photo = tree!.root.findAllByType('button').find(node => node.props.accessibilityLabel === translations.t('destinationCleanup.viewPhoto', { name }));
 expect(photo).toBeDefined();
 expect(photo!.findAllByType('button')).toHaveLength(1);
 await act(async () => photo!.props.onPress());
 expect(router.navigate).not.toHaveBeenCalled();
 const modal = tree!.root.findByType('modal' as React.ElementType);
 expect(modal.findByProps({ testID: `viewer-photo:${destination.media![0].id}` }).props.resizeMode).toBe('contain');
 await act(async () => modal.props.onRequestClose());
 const title = tree!.root.findAllByType('button').find(node => node.props.accessibilityLabel === name)!;
 expect(title.findAllByType('button')).toHaveLength(1);
 await act(async () => title.props.onPress());
 expect(router.navigate).toHaveBeenCalledWith({ pathname: '/', params: { featuredDestinationId: 'D01' } });
 expect(placesService.details).not.toHaveBeenCalled(); expect(placesService.nearby).not.toHaveBeenCalled();
});
it('gives every guide activity, preparation and safety item a noninteractive prefix while retaining paragraphs', async () => {
 await mount();
 const guide = listDestinations()[0].visitorGuide!.en.value;
 for (const [section, icon] of [['activities', 'ellipse'], ['preparation', 'square-outline'], ['safety', 'warning-outline']] as const) {
  for (const item of guide[section]) {
   const text = tree!.root.findAllByType('text').find(node => node.props.children === item)!;
   expect(text.parent!.findAllByType('icon' as React.ElementType).map(node => node.props.name)).toContain(icon);
   expect(text.parent!.props.accessibilityRole).not.toBe('checkbox');
  }
 }
 const arrival = tree!.root.findAllByType('text').find(node => node.props.children === guide.arrival)!;
 expect(arrival.parent!.findAllByType('icon' as React.ElementType)).toHaveLength(0);
});

it('recognizes and removes a legacy Google alias on the featured destination page',async()=>{
 const alias={kind:'google' as const,id:'ChIJVREKfDnlBzMRfl4RQPJlsoU'};
 const save=vi.fn(async()=>true);
 const journal:JournalContextValue={state:{...emptyJournal(),bookmarks:[alias]},metadata:{},ready:true,error:null,principalId:'guest',sync:{phase:'local'},save,award:async()=>false,syncNow:()=>{},retry:()=>{}};
 await mount(<JournalContext.Provider value={journal}><DestinationScreen/></JournalContext.Provider>);
 const remove=button('journal.remove');expect(remove).toBeDefined();await act(async()=>remove!.props.onPress());
 expect(save).toHaveBeenCalledExactlyOnceWith({kind:'featured',id:'D01'},false,undefined,[alias]);
});
