import { withHeroUI } from '@/test/native-ui';
import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { createInstance, type i18n } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { router } from 'expo-router';
import { QueryClient, QueryClientProvider, QueryObserver, notifyManager } from '@tanstack/react-query';
import { queryClient } from '@/lib/query';
import { placesService, type Place } from '@/features/places/service';
import { AR } from '@/config/limits';
import { localizationOptions } from '@/i18n/options';
import { JournalContext, type JournalContextValue } from './context';
import SavedPlacesScreen from './saved-screen';
import { destinationName,getDestination } from '@/features/destinations/catalog';
import { SavePlaceAction } from './actions';
import { claimMapSelectionIntent } from '@/features/places/map-selection-intent';
const controls=vi.hoisted(()=>({focused:true,active:true,language:'en' as 'en'|'ja'|'ko',id:'',matchedId:''}));
vi.mock('@/features/destinations/map-selection',async()=>{const actual=await vi.importActual<typeof import('@/features/destinations/map-selection')>('@/features/destinations/map-selection');const {getDestination}=await import('@/features/destinations/catalog');return {...actual,matchedFeaturedDestination:(place:{provider:string;providerId:string})=>place.providerId===controls.matchedId?getDestination('D01'):actual.matchedFeaturedDestination(place)};});
vi.mock('@/features/settings/provider',()=>({useSettings:()=>({language:controls.language})}));
vi.mock('@/lib/use-app-active',()=>({useAppActive:()=>controls.active}));
vi.mock('@/features/places/service',()=>({placesService:{details:vi.fn(),nearby:vi.fn()}}));
vi.mock('expo-router', () => ({useIsFocused:()=>controls.focused,useLocalSearchParams:()=>({providerId:controls.id}), router: { push: vi.fn(), navigate: vi.fn(), back: vi.fn(), canGoBack: () => true } }));
let tree: ReactTestRenderer | undefined;
let translations: i18n;
let journal: JournalContextValue;
let client:QueryClient;
const id = `REVIEW_ONLY_${'x'.repeat(180)}`;
function render(child:React.ReactNode=<SavedPlacesScreen/>) { return withHeroUI(<I18nextProvider i18n={translations}><QueryClientProvider client={client}><JournalContext.Provider value={journal}>{child}</JournalContext.Provider></QueryClientProvider></I18nextProvider>); }
async function mount() { await act(async () => { tree = create(render()); }); }
const output = () => JSON.stringify(tree!.toJSON());
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true, __DEV__: false });
  vi.clearAllMocks();Object.assign(controls,{focused:true,active:true,language:'en',id,matchedId:''});
  client=new QueryClient({defaultOptions:queryClient.getDefaultOptions()});notifyManager.setScheduler(cb=>cb());
  vi.mocked(placesService.details).mockReset().mockResolvedValue(knownPlace);
  translations = createInstance(); await translations.use(initReactI18next).init({ ...localizationOptions, lng: 'en', react: { useSuspense: false } });
  journal = { metadata:{}, principalId: 'guest', ready: true, error: null, state: { version: 1, bookmarks: [{ kind: 'google', id }], stamps: [] }, sync: { phase: 'local' }, syncNow: vi.fn(), retry: vi.fn(), save: vi.fn(async () => true), award: vi.fn(async () => true) };
});
afterEach(async () => { await act(async () => tree?.unmount()); tree = undefined;client.clear();notifyManager.setScheduler(cb=>setTimeout(cb,0));vi.useRealTimers();vi.restoreAllMocks(); });
it('passes the complete 1,000-bookmark collection to a bounded virtualized list', async () => {
  journal.state.bookmarks = Array.from({ length: 1000 }, (_, index) => ({ kind: 'google' as const, id: `REVIEW_ONLY_${index}` }));
  await mount();
  const list = tree!.root.findByType('virtualized-list' as React.ElementType);
  expect(list.props.data).toHaveLength(1000);
  expect(list.props.keyExtractor({ kind: 'google', id: 'unchanged' })).toBe('google:unchanged');
  expect(list.props.className).toContain('flex-1');
  expect(tree!.root.findAllByType('scroll' as React.ElementType)).toHaveLength(0);
});
it.each(['en', 'ja', 'ko'])('keeps %s identifiers private and Open explicit without fetching', async locale => {
  const fetch = vi.spyOn(globalThis, 'fetch');
  await translations.changeLanguage(locale); await mount();
  expect(tree!.root.findAllByType('text').some(node => node.props.children === id || node.props.accessibilityLabel === id)).toBe(false);
  expect(output()).toContain(translations.t('journal.googlePlace'));
  const open = tree!.root.findAllByType('button').find(node => node.props.accessibilityLabel === translations.t('journal.open'))!;
  const remove = tree!.root.findAllByType('button').find(node => node.props.accessibilityLabel === translations.t('journal.remove'))!;
  expect(remove.props.className).toContain('ghost');
  await act(async () => open.props.onPress());
  expect(router.navigate).toHaveBeenCalledWith({pathname:'/',params:{placeId:id,selectionToken:expect.any(String)}});
  const target=vi.mocked(router.navigate).mock.calls.at(-1)![0] as unknown as {params:{selectionToken:string}};expect(claimMapSelectionIntent(client,target.params.selectionToken,'guest')?.providerId).toBe(id);
  await act(async () => { await remove.props.onPress(); });
  expect(journal.save).toHaveBeenCalledExactlyOnceWith({ kind: 'google', id }, false);
  await act(async () => { await translations.changeLanguage(locale === 'en' ? 'ja' : 'en'); });
  expect(output()).toContain(translations.t('journal.openShort'));
  expect(output()).toContain(translations.t('journal.removeShort'));
  expect(fetch).not.toHaveBeenCalled(); fetch.mockRestore();
});
it.each(['en', 'ja', 'ko'])('keeps %s loading, failed read/retry and empty states distinct', async locale => {
  await translations.changeLanguage(locale); journal.ready = false; await mount();
  expect(output()).toContain(translations.t('common.loading'));
  expect(output()).not.toContain(translations.t('journal.savedEmpty'));
  expect(tree!.root.findAllByType('button').some(node => node.props.accessibilityLabel === translations.t('journal.open'))).toBe(false);
  journal = { ...journal, error: 'journal.loadFailed' };
  await act(async () => tree!.update(render()));
  expect(output()).toContain(translations.t('journal.loadFailed'));
  const retry = tree!.root.findAllByType('button').find(node => node.props.accessibilityLabel === translations.t('common.retry'))!;
  await act(async () => retry.props.onPress()); expect(journal.retry).toHaveBeenCalledOnce();
  journal = { ...journal, ready: true, error: null, state: { version: 1, bookmarks: [], stamps: [] } };
  await act(async () => tree!.update(render()));
  expect(output()).toContain(translations.t('journal.savedEmpty'));
  expect(output()).not.toContain(translations.t('journal.loadFailed'));
});

it('renders the real saved count, honest metadata and decorative View/remove icons', async () => {
  journal.state.bookmarks.push({kind: 'featured', id: 'D01'}); await mount();
  for (const locale of ['en', 'ja', 'ko']) {
    await act(async () => { await translations.changeLanguage(locale); });
    expect(output()).toContain(translations.t('journal.savedHeading'));
    expect(output()).toContain(translations.t('journal.savedCount', {count: 2}));
    expect(output()).not.toContain(translations.t('journal.googleMetadata'));
    const buttons = tree!.root.findAllByType('button');
    for (const [key, icon] of [['journal.open', 'chevron-forward'], ['journal.remove', 'trash-outline']]) {
      const action = buttons.find(node => node.props.accessibilityLabel === translations.t(key))!;
      expect(action.findAllByType('icon' as React.ElementType).some(node => node.props.name === icon && node.props.accessible === false)).toBe(true);
    }
  }
});
it.each(['local', 'pending', 'syncing', 'synced', 'failed'] as const)('presents truthful %s sync status without initiating work', async phase => {
  journal.principalId = 'account'; journal.sync = {phase}; await mount();
  const warning = tree!.root.findAllByProps({testID: 'journal-sync-warning'});
  expect(warning.length).toBe(phase === 'failed' ? 1 : 0);
  if (phase === 'failed') {
    expect(output()).toContain(translations.t('journal.syncAttention'));
    const retry = tree!.root.findAllByType('button').find(node => node.props.accessibilityLabel === translations.t('journal.retrySync'))!;
    expect(retry.props.className).toContain('outline');
    await act(async () => retry.props.onPress()); expect(journal.syncNow).toHaveBeenCalledOnce();
  } else expect(journal.syncNow).not.toHaveBeenCalled();
});
it('keeps a guest quiet even with a retired account failure', async () => {
  journal.sync = {phase:'failed',error:'journal.syncAuth'}; await mount();
  expect(tree!.root.findAllByProps({testID:'journal-sync-warning'})).toHaveLength(0);
  expect(output()).toContain(translations.t('journal.localOnly'));
  expect(output()).not.toContain(translations.t('journal.syncAuth'));
});

it('shows bookmark toggle state, a visible saved check and busy coalescing without confusing row removal', async () => {
  journal.state.bookmarks=[];
  const gate=Promise.withResolvers<boolean>(); vi.mocked(journal.save).mockReturnValueOnce(gate.promise);
  const action=()=>withHeroUI(<I18nextProvider i18n={translations}><JournalContext.Provider value={journal}><SavePlaceAction reference={{kind:'featured',id:'D01'}} /></JournalContext.Provider></I18nextProvider>);
  await act(async()=>{tree=create(action());});
  const save=tree!.root.findAllByType('button').find(node=>node.props.accessibilityLabel===translations.t('journal.save'))!;
  expect(save.findAllByType('icon' as React.ElementType).map(node=>node.props.name)).toContain('bookmark-outline');
  await act(async()=>{void save.props.onPress();void save.props.onPress();});
  expect(save.props.accessibilityState.busy).toBe(true);expect(journal.save).toHaveBeenCalledOnce();
  journal={...journal,state:{...journal.state,bookmarks:[{kind:'featured',id:'D01'}]}};
  await act(async()=>{gate.resolve(true);tree!.update(action());});
  const saved=tree!.root.findAllByType('button').find(node=>node.props.accessibilityLabel===translations.t('journal.remove'))!;
  expect(saved.findAllByType('icon' as React.ElementType).map(node=>node.props.name)).toEqual(['bookmark','checkmark']);
  expect(output()).toContain(translations.t('journal.savedShort'));
  expect(saved.props.accessibilityState.busy).toBe(false);
});


const knownPlace:Place={id:'google:cached',provider:'google',providerId:id,name:'Actual saved place name',address:'Actual provider address',coordinates:{latitude:10,longitude:124},attributions:[]};
function openButton(){return tree!.root.findAllByType('button').find(n=>n.props.accessibilityLabel===translations.t('journal.open'))!;}
it('opens through a one-use map intent without starting a provider lookup from Saved Places',async()=>{
 journal.metadata[`google:${id}`]={label:'My lakeside stop',note:'Meet near the gate',pin:{coordinates:{latitude:10,longitude:124},capturedAt:Date.now()-1000}};
 await mount();expect(placesService.details).not.toHaveBeenCalled();
 expect(output()).toContain('My lakeside stop');expect(output()).toContain('Meet near the gate');
 await act(async()=>{openButton().props.onPress();openButton().props.onPress();});
 expect(placesService.details).not.toHaveBeenCalled();expect(router.navigate).toHaveBeenCalledOnce();
 const target=vi.mocked(router.navigate).mock.calls[0][0] as unknown as {params:{selectionToken:string}};
 const claimed=claimMapSelectionIntent(client,target.params.selectionToken,'guest');
 expect(claimed).toMatchObject({providerId:id,principalId:'guest',name:'My lakeside stop',coordinates:{latitude:10,longitude:124},capturedAt:journal.metadata[`google:${id}`].pin!.capturedAt});
 expect(claimMapSelectionIntent(client,target.params.selectionToken,'guest')).toBeNull();
});
it('shows known fresh names and addresses without loading the list and consumes View from the existing response',async()=>{
 client.setQueryData(['place-details',id,'en'],knownPlace);await mount();
 expect(output()).toContain(knownPlace.name);expect(output()).toContain(knownPlace.address);
 expect(output()).not.toContain(translations.t('journal.googleMetadata'));
 await act(async()=>openButton().props.onPress());expect(placesService.details).not.toHaveBeenCalled();
});
it('expires cached display names without renewing their source window or requesting again',async()=>{
 vi.useFakeTimers();const timestamp=Date.now();client.setQueryData(['place-details',id,'en'],knownPlace,{updatedAt:timestamp});await mount();
 expect(output()).toContain(knownPlace.name);
 await act(async()=>{await vi.advanceTimersByTimeAsync(AR.nearbyReuseMs+1);});
 expect(tree!.root.findAllByType('text').some(n=>n.props.children===knownPlace.name)).toBe(false);
 expect(client.getQueryState(['place-details',id,'en'])?.dataUpdatedAt).toBe(timestamp);
 expect(placesService.details).not.toHaveBeenCalled();
});
it('keeps bare links and expired/wrong-language display data free of inherited lookup authority',async()=>{
 client.setQueryData(['place-details',id,'ja'],knownPlace);await mount();
 expect(tree!.root.findAllByType('text').some(n=>n.props.children===knownPlace.name)).toBe(false);
 expect(placesService.details).not.toHaveBeenCalled();
});

it('clears cached row identity with the principal cache and does not turn fresh observation into a lookup',async()=>{
 client.setQueryData(['place-details',id,'en'],knownPlace);await mount();
 expect(output()).toContain(knownPlace.name);
 await act(async()=>{client.clear();tree!.update(render());});
 expect(tree!.root.findAllByType('text').some(n=>n.props.children===knownPlace.name)).toBe(false);
 expect(placesService.details).not.toHaveBeenCalled();
});
it.each(['focused','active'] as const)('cannot start a saved lookup after %s ownership is lost',async owner=>{
 controls[owner]=false;await mount();await act(async()=>openButton().props.onPress());
 expect(placesService.details).not.toHaveBeenCalled();expect(router.push).not.toHaveBeenCalled();
});

it('prefers a fresh Nearby response over an existing expired Details entry without renewing either timestamp',async()=>{
 const old=Date.now()-AR.nearbyReuseMs-1;const fresh=Date.now();
 const observer=new QueryObserver(client,{queryKey:['places',{latitude:10,longitude:124},'en'],enabled:false});
 const stop=observer.subscribe(()=>{});
 client.setQueryData(['place-details',id,'en'],{...knownPlace,name:'Expired name'},{updatedAt:old});
 client.setQueryData(['places',{latitude:10,longitude:124},'en'],[{...knownPlace,source:'discovery'}],{updatedAt:fresh});
 await mount();
 expect(tree!.root.findAllByType('text').some(n=>n.props.children===knownPlace.name)).toBe(true);
 expect(client.getQueryState(['place-details',id,'en'])?.dataUpdatedAt).toBe(old);
 expect(client.getQueryState(['places',{latitude:10,longitude:124},'en'])?.dataUpdatedAt).toBe(fresh);
 await act(async()=>openButton().props.onPress());expect(placesService.details).not.toHaveBeenCalled();stop();
});

it('offers explicit rename for old ID-only entries and never fills the field from transient provider copy',async()=>{
 client.setQueryData(['place-details',id,'en'],knownPlace);await mount();
 const rename=tree!.root.findAllByType('button').find(n=>n.props.accessibilityLabel===translations.t('journalCleanup.rename'))!;expect(rename).toBeDefined();
 await act(async()=>rename.props.onPress());const field=tree!.root.findAllByType('input').find(n=>n.props.accessibilityLabel===translations.t('journalCleanup.label'))!;
 expect(field.props.value).toBe('');await act(async()=>field.props.onChangeText('My own name'));
 await act(async()=>tree!.root.findAllByType('button').find(n=>n.props.accessibilityLabel===translations.t('journalCleanup.confirm'))!.props.onPress());
 expect(journal.save).toHaveBeenCalledWith({kind:'google',id},true,{label:'My own name'});expect(placesService.details).not.toHaveBeenCalled();
});
it('keeps labels after pin expiry and opens an expired bookmark without coordinates',async()=>{
 journal.metadata[`google:${id}`]={label:'Permanent user label',pin:{coordinates:{latitude:10,longitude:124},capturedAt:Date.now()-30*86400000}};await mount();
 expect(output()).toContain('Permanent user label');await act(async()=>openButton().props.onPress());
 const target=vi.mocked(router.navigate).mock.calls[0][0] as unknown as {params:{selectionToken:string}};expect(claimMapSelectionIntent(client,target.params.selectionToken,'guest')?.coordinates).toBeUndefined();
});

it.each([true,false])('renders matched Google aliases once with curated identity (featured stored: %s), without rewriting IDs',async featured=>{
 controls.matchedId=id;if(featured)journal.state.bookmarks.push({kind:'featured',id:'D01'});const before=JSON.stringify(journal.state);
 await mount();expect(tree!.root.findByType('virtualized-list' as React.ElementType).props.data).toHaveLength(1);expect(output()).toContain(destinationName(getDestination('D01')!));expect(JSON.stringify(journal.state)).toBe(before);
 await act(async()=>openButton().props.onPress());expect(router.push).toHaveBeenCalledWith({pathname:'/destinations/[destinationId]',params:{destinationId:'D01'}});expect(placesService.details).not.toHaveBeenCalled();
 const remove=tree!.root.findAllByType('button').find(n=>n.props.accessibilityLabel===translations.t('journal.remove'))!;await act(async()=>remove.props.onPress());
 if(featured)expect(journal.save).toHaveBeenCalledWith({kind:'featured',id:'D01'},false,undefined,[{kind:'google',id}]);else expect(journal.save).toHaveBeenCalledWith({kind:'google',id},false);
});
it.each(['principal','blur','unmount'])('retires a retained saved-open callback after %s replacement',async reason=>{
 await mount();const oldOpen=openButton().props.onPress;
 if(reason==='principal'){journal={...journal,principalId:'next-account'};await act(async()=>tree!.update(render()));}
 else if(reason==='blur'){controls.focused=false;await act(async()=>tree!.update(render()));}
 else await act(async()=>{tree!.unmount();tree=undefined;});
 await act(async()=>oldOpen());expect(router.navigate).not.toHaveBeenCalled();expect(placesService.details).not.toHaveBeenCalled();
});
