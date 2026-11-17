import { nativeUi, withHeroUI } from '@/test/native-ui';
import * as React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { QueryClient, QueryClientProvider, notifyManager, onlineManager } from '@tanstack/react-query';
import { createInstance, type i18n } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { localizationOptions } from '@/i18n/options';
import { queryClient } from '@/lib/query';
import { placesService, type Place } from '@/features/places/service';
import { createMapSelectionIntent } from '@/features/places/map-selection-intent';
import MapScreen from './map-screen';

const state = vi.hoisted(() => ({ focused: true, active: true, principal: 'guest', params: {} as Record<string, string | undefined>, context: null as React.Context<boolean | undefined> | null, navigationContext: null as React.Context<unknown> | null, animate: vi.fn(), position: null as {latitude:number;longitude:number}|null, language: 'en' as 'en'|'ja'|'ko' }));
vi.mock('expo-router', async () => {
  const { createRequire } = await import('node:module'); const require = createRequire(import.meta.url);
  const focus = require('expo-router/build/react-navigation/core/useIsFocused');
  state.context = focus.IsFocusedContext;
  state.navigationContext = require('expo-router/build/react-navigation/core/NavigationContext').NavigationContext;
  return { useIsFocused: focus.useIsFocused, useLocalSearchParams: () => state.params,
    router: { navigate: vi.fn(), push: vi.fn(), setParams: vi.fn((params: Record<string,string|undefined>) => { state.params = {...state.params,...params}; }) } };
});
vi.mock('expo-constants', () => ({default:{expoConfig:{extra:{mapsConfigured:true}}}}));
vi.mock('react-native-maps', async () => {
  const {createElement,forwardRef,useImperativeHandle}=await import('react');
  return {default:forwardRef((props:Record<string,unknown>,ref)=>{useImperativeHandle(ref,()=>({animateToRegion:state.animate}));return createElement('map',props);}),Marker:'marker',Callout:'callout',PROVIDER_GOOGLE:'google'};
});
vi.mock('@/features/settings/provider',()=>({useSettings:()=>({language:state.language,activationRadiusMeters:100})}));
vi.mock('@/features/location/use-device-location',()=>({useDeviceLocation:()=>({position:state.position,accuracy:state.position?8:null,status:state.position?'ready':'loading',watcherStatus:'pending',watcherSample:null,retry:vi.fn()})}));
vi.mock('@/features/journal/context',()=>({useJournal:()=>({principalId:state.principal,metadata:{},state:{bookmarks:[]},ready:true,save:vi.fn()})}));
vi.mock('@/lib/use-app-active',()=>({useAppActive:()=>state.active}));
vi.mock('@/features/places/service',()=>({placesService:{details:vi.fn(),search:vi.fn(),nearby:vi.fn()}}));
let tree:ReactTestRenderer|undefined;let client:QueryClient;let translations:i18n;
const place:Place={id:'google:sample',provider:'google',providerId:'sample',name:'Fresh details',coordinates:{latitude:11,longitude:124},source:'discovery',attributions:[]};
const navigation={isFocused:()=>state.focused,addListener:()=>()=>{}};
function render(){const NavProvider=state.navigationContext!.Provider;const FocusProvider=state.context!.Provider;return <NavProvider value={navigation}><FocusProvider value={state.focused}><I18nextProvider i18n={translations}><QueryClientProvider client={client}>{withHeroUI(<MapScreen/>)}</QueryClientProvider></I18nextProvider></FocusProvider></NavProvider>;}
function begin(principalId='guest') {const token=createMapSelectionIntent(client,{providerId:'sample',principalId,name:'My saved label',coordinates:place.coordinates,capturedAt:Date.now(),language:'en'});state.params={placeId:'sample',selectionToken:token};return token;}
async function mount(){await act(async()=>{tree=create(render());});}
async function ready(){await act(async()=>tree!.root.findByType('map').props.onMapReady());}
async function press(key:string){const button=tree!.root.findAllByType('button').find(item=>item.props.accessibilityLabel===translations.t(key));expect(button,key).toBeDefined();await act(async()=>button!.props.onPress());}
beforeEach(async()=>{
  Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true,__DEV__:false});Object.assign(state,{focused:true,active:true,principal:'guest',params:{},position:null,language:'en'});state.animate.mockClear();
  client=new QueryClient({defaultOptions:queryClient.getDefaultOptions()});notifyManager.setScheduler(cb=>cb());
  translations=createInstance();await translations.use(initReactI18next).init({...localizationOptions,lng:'en',react:{useSuspense:false}});
  vi.mocked(placesService.search).mockReset();vi.mocked(placesService.nearby).mockReset();vi.mocked(placesService.details).mockReset().mockResolvedValue(place);nativeUi.openURL.mockReset().mockResolvedValue(undefined);
  const original=console.error;vi.spyOn(console,'error').mockImplementation((...args:unknown[])=>{if(!String(args[0]).startsWith('react-test-renderer is deprecated'))original(...args);});
});
afterEach(async()=>{await act(async()=>tree?.unmount());tree=undefined;client.clear();onlineManager.setOnline(true);notifyManager.setScheduler(cb=>setTimeout(cb,0));vi.restoreAllMocks();});
it('uses the installed focus hook and waits for native readiness before spending one saved-open intent',async()=>{
  begin();await mount();expect(placesService.details).not.toHaveBeenCalled();expect(JSON.stringify(tree!.toJSON())).toContain('My saved label');
  await ready();expect(placesService.details).toHaveBeenCalledExactlyOnceWith('sample','en');
  state.focused=false;await act(async()=>tree!.update(render()));state.focused=true;state.active=false;await act(async()=>tree!.update(render()));state.active=true;state.language='ja';await act(async()=>{await translations.changeLanguage('ja');tree!.update(render());await client.invalidateQueries();});
  expect(placesService.details).toHaveBeenCalledTimes(1);
});
it.each(['focused','active'] as const)('retires a delayed saved-open intent on %s loss instead of replaying it on return',async(key)=>{
  begin();await mount();state[key]=false;await act(async()=>tree!.update(render()));await ready();state[key]=true;await act(async()=>tree!.update(render()));
  expect(placesService.details).not.toHaveBeenCalled();
});
it('rejects a handoff for another principal and retires a claimed one on principal replacement',async()=>{
  begin('other');await mount();await ready();expect(placesService.details).not.toHaveBeenCalled();
  await act(async()=>tree!.unmount());begin();await mount();state.principal='account';await act(async()=>tree!.update(render()));await ready();expect(placesService.details).not.toHaveBeenCalled();
});
it('Close retires delayed request authority and late responses cannot restore the selection',async()=>{
  begin();await mount();await press('map.closePlace');await ready();expect(placesService.details).not.toHaveBeenCalled();
  let resolve!:(value:Place)=>void;vi.mocked(placesService.details).mockImplementation(()=>new Promise(done=>{resolve=done;}));
  await act(async()=>tree!.root.findByType('map').props.onPoiClick({nativeEvent:{placeId:'sample',name:'Native seed',coordinate:place.coordinates}}));
  expect(placesService.details).toHaveBeenCalledOnce();await press('map.closePlace');await act(async()=>resolve(place));expect(JSON.stringify(tree!.toJSON())).not.toContain('Fresh details');
});
it('a native tap for the verified Lake Danao listing opens curated media without a details lookup',async()=>{
  await mount();await ready();await act(async()=>tree!.root.findByType('map').props.onPoiClick({nativeEvent:{placeId:'ChIJVREKfDnlBzMRfl4RQPJlsoU',name:'Provider title',coordinate:place.coordinates}}));
  expect(JSON.stringify(tree!.toJSON())).toContain('Lake Danao Natural Park');expect(JSON.stringify(tree!.toJSON())).toContain(translations.t('exploreCleanup.featuredBadge'));expect(placesService.details).not.toHaveBeenCalled();
  await press('map.expand');expect(tree!.root.findAllByType('img')).toHaveLength(7);
});

it('does not recenter a saved handoff a second time when GPS arrives after the user pans',async()=>{
  begin();await mount();await ready();expect(state.animate).toHaveBeenCalledTimes(1);
  await act(async()=>tree!.root.findByType('map').props.onPanDrag());state.position={latitude:12,longitude:125};await act(async()=>tree!.update(render()));
  expect(state.animate).toHaveBeenCalledTimes(1);
});
it('centers an ID-only saved place when explicit details resolve without GPS',async()=>{
  let resolve!:(value:Place)=>void;vi.mocked(placesService.details).mockImplementation(()=>new Promise(done=>{resolve=done;}));
  const selectionToken=createMapSelectionIntent(client,{providerId:'sample',principalId:'guest',language:'en'});state.params={placeId:'sample',selectionToken};
  await mount();await ready();expect(state.animate).not.toHaveBeenCalled();await act(async()=>resolve(place));
  expect(state.animate).toHaveBeenCalledExactlyOnceWith({...place.coordinates,latitudeDelta:0.02,longitudeDelta:0.02},400);
});
it('a user pan retires eventual handoff camera positioning while the explicit lookup can still complete',async()=>{
  let resolve!:(value:Place)=>void;vi.mocked(placesService.details).mockImplementation(()=>new Promise(done=>{resolve=done;}));
  const selectionToken=createMapSelectionIntent(client,{providerId:'sample',principalId:'guest',language:'en'});state.params={placeId:'sample',selectionToken};await mount();await ready();
  await act(async()=>tree!.root.findByType('map').props.onPanDrag());state.position={latitude:12,longitude:125};await act(async()=>tree!.update(render()));await act(async()=>resolve(place));
  expect(state.animate).not.toHaveBeenCalled();expect(JSON.stringify(tree!.toJSON())).toContain('Fresh details');
});
it('does not recreate a retired camera command while URL clearing is delayed',async()=>{
  const {router}=await import('expo-router');vi.mocked(router.setParams).mockImplementation(()=>{});
  let resolve!:(value:Place)=>void;vi.mocked(placesService.details).mockImplementation(()=>new Promise(done=>{resolve=done;}));
  const selectionToken=createMapSelectionIntent(client,{providerId:'sample',principalId:'guest',language:'en'});state.params={placeId:'sample',selectionToken};await mount();await ready();
  await act(async()=>tree!.root.findByType('map').props.onPanDrag());await act(async()=>resolve(place));
  expect(state.animate).not.toHaveBeenCalled();
});
it('retires an unclaimed saved-open command when the map first mounts in the background',async()=>{
  begin();state.active=false;await mount();state.active=true;await act(async()=>tree!.update(render()));await ready();
  expect(placesService.details).not.toHaveBeenCalled();
});

it('fails an explicit offline search now instead of queuing a paid call for reconnect',async()=>{
  onlineManager.setOnline(false);vi.mocked(placesService.search).mockRejectedValue(new Error('Private network diagnostic'));
  await mount();await ready();await act(async()=>tree!.root.findByType('input').props.onChangeText('Museum'));await press('search.submit');
  expect(placesService.search).toHaveBeenCalledTimes(1);expect(JSON.stringify(tree!.toJSON())).not.toContain('Private network diagnostic');
  await act(async()=>{onlineManager.setOnline(true);await client.invalidateQueries();});
  expect(placesService.search).toHaveBeenCalledTimes(1);
});
