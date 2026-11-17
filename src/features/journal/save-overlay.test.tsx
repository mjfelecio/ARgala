import {withHeroUI} from '@/test/native-ui';
import React from 'react';
import {BackHandler} from 'react-native';
import {create,act,type ReactTestRenderer} from 'react-test-renderer';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {createInstance,type i18n} from 'i18next';
import {I18nextProvider,initReactI18next} from 'react-i18next';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {PortalHost} from 'heroui-native/portal';
import {Dialog} from 'heroui-native/dialog';
import {localizationOptions} from '@/i18n/options';
import {queryClient} from '@/lib/query';
import {setPlaceSelection} from '@/features/places/selection';
import {placesService,type Place} from '@/features/places/service';
import MapScreen from '@/features/map/map-screen';
import {JournalContext,type JournalContextValue} from './context';
const controls=vi.hoisted(()=>({focused:true,active:true,position:{latitude:10,longitude:124},back:[] as (()=>boolean)[]}));
vi.mock('expo-router',()=>({useIsFocused:()=>controls.focused,useLocalSearchParams:()=>({placeId:'overlay-place'}),router:{setParams:vi.fn(),navigate:vi.fn(),push:vi.fn()}}));
vi.mock('expo-constants',()=>({default:{expoConfig:{extra:{mapsConfigured:true}}}}));
vi.mock('@/features/settings/provider',()=>({useSettings:()=>({language:'en',activationRadiusMeters:100})}));
vi.mock('@/lib/use-app-active',()=>({useAppActive:()=>controls.active}));
vi.mock('@/features/location/use-device-location',()=>({useDeviceLocation:()=>({position:controls.position,accuracy:8,status:'ready',watcherStatus:'ready',watcherSample:null,retry:vi.fn()})}));
vi.mock('@/features/places/service',()=>({placesService:{search:vi.fn(),nearby:vi.fn(),details:vi.fn()}}));
vi.mock('react-native-maps',()=>({default:'map',Marker:'marker',Circle:'circle',Callout:'callout',PROVIDER_GOOGLE:'google'}));
const place:Place={id:'google:overlay-place',provider:'google',providerId:'overlay-place',source:'discovery',name:'Transient provider title',coordinates:{latitude:10,longitude:124},attributions:[]};
let tree:ReactTestRenderer|undefined;let translations:i18n;let client:QueryClient;let journal:JournalContextValue;
function render(){return withHeroUI(<I18nextProvider i18n={translations}><QueryClientProvider client={client}><JournalContext.Provider value={journal}><MapScreen/><PortalHost/></JournalContext.Provider></QueryClientProvider></I18nextProvider>);}
const output=()=>JSON.stringify(tree!.toJSON());
const button=(key:string)=>tree!.root.findAllByType('button').find(n=>n.props.accessibilityLabel===translations.t(key))!;
const field=(key='label')=>tree!.root.findAllByType('input').find(n=>n.props.accessibilityLabel===translations.t(`journalCleanup.${key}`))!;
async function press(key:string){await act(async()=>button(key).props.onPress());}
async function mount(){await act(async()=>{tree=create(render());});await act(async()=>tree!.root.findByType('map').props.onMapReady());}
beforeEach(async()=>{
 Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true,__DEV__:false});Object.assign(controls,{focused:true,active:true,position:{latitude:10,longitude:124},back:[]});
 translations=createInstance();await translations.use(initReactI18next).init({...localizationOptions,lng:'en',react:{useSuspense:false}});
 client=new QueryClient({defaultOptions:queryClient.getDefaultOptions()});setPlaceSelection(client,place,'en',Date.now());
 journal={principalId:'guest',ready:true,error:null,metadata:{},state:{version:1,bookmarks:[],stamps:[]},sync:{phase:'local'},syncNow:vi.fn(),retry:vi.fn(),save:vi.fn(async()=>true),award:vi.fn(async()=>true)};
 vi.spyOn(BackHandler,'addEventListener').mockImplementation((_event,callback)=>{const handler=callback as ()=>boolean;controls.back.push(handler);return {remove:()=>{controls.back=controls.back.filter(item=>item!==handler);}};});
});
afterEach(async()=>{await act(async()=>tree?.unmount());tree=undefined;client.clear();vi.restoreAllMocks();});
it.each(['en','ja','ko'])('opens a full-width keyboard-aware %s save form outside the compact map actions',async locale=>{
 await translations.changeLanguage(locale);await mount();const sheet=tree!.root.findByType('dialog');const points=sheet.props.snapPoints;
 await press('journal.save');
 const content=tree!.root.findByType(Dialog.Content);expect(content).toBeDefined();expect(content.props.isSwipeable).toBe(false);
 expect(sheet.findAllByType('input')).toHaveLength(0);expect(sheet.props.snapPoints).toEqual(points);
 const keyboard=content.findByType('keyboard-avoiding' as React.ElementType);expect(keyboard.props.behavior).toBe('height');
 const safe=content.findByType('safe-area' as React.ElementType);expect(safe.props.edges).toEqual(['top','bottom','left','right']);
 const scroll=content.findAllByType('scroll' as React.ElementType);expect(scroll).toHaveLength(1);expect(scroll[0].props.keyboardShouldPersistTaps).toBe('handled');
 expect(field().props.value).toBe('');expect(field('note').props.value).toBe('');expect(output()).toContain(translations.t('journalCleanup.labelGuidance'));
 expect(translations.exists('journalCleanup.cancel',{lng:locale,fallbackLng:false})).toBe(true);
 expect(button('journalCleanup.cancel')).toBeDefined();
 expect(placesService.details).not.toHaveBeenCalled();expect(journal.save).not.toHaveBeenCalled();
});
it.each(['en','ja','ko'])('retains a failed %s draft and synchronously blocks repeated saves, backdrop, Back and Cancel while pending',async locale=>{
 await translations.changeLanguage(locale);await mount();await press('journal.save');
 await act(async()=>{field().props.onChangeText('My own meeting place');field('note').props.onChangeText('My own note');});
 const pending=Promise.withResolvers<boolean>();vi.mocked(journal.save).mockReturnValueOnce(pending.promise).mockResolvedValueOnce(true);
 const submit=button('journalCleanup.confirm').props.onPress;const cancel=button('journalCleanup.cancel').props.onPress;
 const backdrop=tree!.root.findByType(Dialog.Overlay).findByType('button').props.onPress;
 const back=controls.back.at(-1)!;
 await act(async()=>{void submit();void submit();cancel();backdrop({});back();});
 expect(journal.save).toHaveBeenCalledOnce();expect(tree!.root.findAllByType(Dialog.Content)).toHaveLength(1);expect(button('journalCleanup.cancel').props.disabled).toBe(true);
 await act(async()=>pending.resolve(false));
 expect(field().props.value).toBe('My own meeting place');expect(field('note').props.value).toBe('My own note');expect(output()).toContain(translations.t('journal.saveFailed'));
 await press('journalCleanup.confirm');expect(journal.save).toHaveBeenCalledTimes(2);expect(tree!.root.findAllByType(Dialog.Content)).toHaveLength(0);
});
it.each(['blur','background','principal','unmount','dismiss'] as const)('retires old submit, cancel and backdrop callbacks after %s',async reason=>{
 await mount();await press('journal.save');await act(async()=>field().props.onChangeText('Old draft'));
 const submit=button('journalCleanup.confirm').props.onPress;const cancel=button('journalCleanup.cancel').props.onPress;
 const backdrop=tree!.root.findByType(Dialog.Overlay).findByType('button').props.onPress;const back=controls.back.at(-1)!;
 if(reason==='dismiss'){await press('journalCleanup.cancel');await press('journal.save');}
 else if(reason==='unmount'){await act(async()=>{tree!.unmount();tree=undefined;});}
 else{
  if(reason==='principal')journal={...journal,principalId:'next-account'};else if(reason==='blur')controls.focused=false;else controls.active=false;
  await act(async()=>tree!.update(render()));
  if(reason==='blur')controls.focused=true;if(reason==='background')controls.active=true;
  await act(async()=>tree!.update(render()));await press('journal.save');
 }
 await act(async()=>{await submit();cancel();backdrop({});back();});expect(journal.save).not.toHaveBeenCalled();
 if(reason!=='unmount'){expect(tree!.root.findAllByType(Dialog.Content)).toHaveLength(1);expect(field().props.value).toBe('');}
});
it('allows an accepted durable save to finish after focus retirement without closing the next form',async()=>{
 await mount();await press('journal.save');await act(async()=>field().props.onChangeText('Accepted old form'));
 const pending=Promise.withResolvers<boolean>();vi.mocked(journal.save).mockReturnValueOnce(pending.promise);
 await act(async()=>{void button('journalCleanup.confirm').props.onPress();});
 controls.focused=false;await act(async()=>tree!.update(render()));controls.focused=true;await act(async()=>tree!.update(render()));
 await act(async()=>pending.resolve(true));await press('journal.save');
 expect(tree!.root.findAllByType(Dialog.Content)).toHaveLength(1);expect(field().props.value).toBe('');expect(journal.save).toHaveBeenCalledOnce();
});
it('releases a direct removal busy state when its durable write finishes across a focus interruption',async()=>{
 journal={...journal,state:{version:1,bookmarks:[{kind:'google',id:place.providerId}],stamps:[]}};await mount();const pending=Promise.withResolvers<boolean>();vi.mocked(journal.save).mockReturnValueOnce(pending.promise);
 await act(async()=>{void button('journal.remove').props.onPress();});
 controls.focused=false;await act(async()=>tree!.update(render()));controls.focused=true;await act(async()=>tree!.update(render()));
 await act(async()=>pending.resolve(true));expect(button('journal.remove').props.disabled).toBe(false);
});
