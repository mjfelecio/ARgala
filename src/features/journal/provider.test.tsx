import { withHeroUI } from '@/test/native-ui';
import React from 'react';
import { act,create,type ReactTestRenderer } from 'react-test-renderer';
import { afterEach,beforeEach,expect,it,vi } from 'vitest';
import { I18nextProvider , initReactI18next } from 'react-i18next';
import { createInstance } from 'i18next';
import { localizationOptions } from '@/i18n/options';
import { JournalProvider,useJournal } from './provider';
import { SavePlaceAction,JournalFeedback } from './actions';
import { useEarnedStamp } from './use-earned-stamp';
import SavedPlacesScreen from './saved-screen';
import { PassportSummary } from './passport-summary';
import { router } from 'expo-router';
import { getDestination } from '@/features/destinations/catalog';
import type { PreparedArEntry } from '@/features/destination-ar/admission-store';
const runtime=vi.hoisted(()=>({values:new Map<string,string>(), get:vi.fn(),set:vi.fn(),session:null as {user:{id:string}}|null,guest:true}));
vi.mock('@react-native-async-storage/async-storage',()=>({default:{getItem:runtime.get,setItem:runtime.set}}));
vi.mock('@/features/auth/provider',()=>({useAuth:()=>({session:runtime.session})}));
vi.mock('@/features/auth/guest-context',()=>({useGuestAccess:()=>({enabled:runtime.guest})}));
vi.mock('expo-router',()=>({router:{push:vi.fn(),navigate:vi.fn(),back:vi.fn(),canGoBack:()=>true}}));
let tree:ReactTestRenderer; let journal:NonNullable<ReturnType<typeof useJournal>>; let establish:()=>void;
const translations=createInstance();await translations.use(initReactI18next).init({...localizationOptions,lng:'en',react:{useSuspense:false}});
function entry(overrides:Partial<PreparedArEntry>={}):PreparedArEntry{return {destination:getDestination('pilot-aclc')!,kind:'approved',simulated:false,language:'en',authorizeMount:()=>true,identity:{admissionId:'test-entry',destinationId:'pilot-aclc',principalId:'user-a',provenance:'verified'},...overrides};}
let candidate=entry();
let showSaved=false;
function Probe(){const value=useJournal()!;const earn=useEarnedStamp(candidate);React.useEffect(()=>{journal=value;establish=earn;});return <><SavePlaceAction reference={{kind:'google',id:'ChIJ_test'}}/><JournalFeedback/>{showSaved&&<SavedPlacesScreen/>}<PassportSummary/></>;}
const view=()=>withHeroUI(<I18nextProvider i18n={translations}><JournalProvider><Probe/></JournalProvider></I18nextProvider>);
async function mount(){await act(async()=>{tree=create(view());});}
async function press(key:string){const b=tree.root.findAll(x=>x.type==='button'&&x.props.accessibilityLabel===translations.t(key))[0];expect(b).toBeDefined();await act(async()=>{await b.props.onPress();});}
const copy=()=>JSON.stringify(tree.toJSON());
beforeEach(async()=>{Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true,__DEV__:false});runtime.values.clear();runtime.get.mockImplementation(async(k:string)=>runtime.values.get(k)??null);runtime.set.mockImplementation(async(k:string,v:string)=>{runtime.values.set(k,v);});runtime.session=null;runtime.guest=true;candidate=entry();showSaved=false;await translations.changeLanguage('en');});
afterEach(async()=>{await act(async()=>tree?.unmount());vi.restoreAllMocks();});
it.each(['en','ja','ko'])('renders real %s save/remove, failure and retry copy with live language updates',async locale=>{await translations.changeLanguage(locale);await mount();runtime.set.mockRejectedValueOnce(new Error('private raw error'));await press('journal.save');expect(copy()).toContain(translations.t('journal.saveFailed'));expect(copy()).not.toContain('private raw error');await press('journal.save');expect(journal.state.bookmarks).toHaveLength(1);expect(copy()).toContain(translations.t('journal.remove'));await translations.changeLanguage('en');await act(async()=>{});await press('journal.remove');expect(journal.state.bookmarks).toHaveLength(0);});
it('hydrates guest bookmarks, merges into sign-in account and isolates the next account',async()=>{await mount();await press('journal.save');runtime.session={user:{id:'user-a'}};await act(async()=>tree.update(view()));expect(journal.principalId).toBe('user-a');expect(journal.state.bookmarks).toHaveLength(1);runtime.session={user:{id:'user-b'}};await act(async()=>tree.update(view()));expect(journal.state.bookmarks).toHaveLength(0);});
it('does not stamp pending mount and stamps an established verified entry at most once',async()=>{runtime.session={user:{id:'user-a'}};await mount();expect(journal.state.stamps).toHaveLength(0);await act(async()=>{establish();establish();});expect(journal.state.stamps).toHaveLength(1);});
it.each(['simulated','draft','wrong-principal'] as const)('does not award %s session',async kind=>{runtime.session={user:{id:'user-a'}};candidate=entry(kind==='simulated'?{simulated:true}:kind==='draft'?{kind:'draft'}:{identity:{...entry().identity,principalId:'user-b'}});await mount();await act(async()=>establish());expect(journal.state.stamps).toHaveLength(0);});
it('leaves failed initial reads disabled and recovers only with explicit Retry',async()=>{runtime.get.mockRejectedValueOnce(new Error('raw'));await mount();expect(journal.ready).toBe(false);expect(copy()).toContain(translations.t('journal.loadFailed'));await press('common.retry');expect(journal.ready).toBe(true);});

it('reopens a saved Google ID through explicit Details navigation without provider content on disk',async()=>{
 showSaved=true;await mount();await press('journal.save');await press('journal.open');expect(router.push).toHaveBeenCalledWith({pathname:'/place/[providerId]',params:{providerId:'ChIJ_test'}});expect([...runtime.values.values()].join()).not.toMatch(/latitude|description|address|reviews/);
});
it('keeps the pilot outside the nine-destination Passport total',async()=>{
 runtime.values.set('argala.journal.v1:guest',JSON.stringify({version:1,bookmarks:[],stamps:[{destinationId:'D01',visitedAt:100},{destinationId:'pilot-aclc',visitedAt:200}]}));await mount();expect(copy()).toContain(translations.t('journal.passportCount',{count:1,total:9}));expect(copy()).toContain(translations.t('journal.pilotVisited'));
});

it('does not publish a retired account write into the next account',async()=>{
 runtime.session={user:{id:'user-a'}};await mount();const gate=Promise.withResolvers<void>();runtime.set.mockImplementationOnce(async(k:string,v:string)=>{await gate.promise;runtime.values.set(k,v);});
 let saving!:Promise<boolean>;await act(async()=>{saving=journal.save({kind:'google',id:'ChIJ_slow'},true);});
 runtime.session={user:{id:'user-b'}};await act(async()=>tree.update(view()));expect(journal.principalId).toBe('user-b');expect(journal.ready).toBe(false);
 await act(async()=>{gate.resolve();await saving;});expect(journal.principalId).toBe('user-b');expect(journal.state.bookmarks).toHaveLength(0);
});
it('retains failed earned stamps for an explicit established-event retry',async()=>{
 runtime.session={user:{id:'user-a'}};await mount();runtime.set.mockRejectedValueOnce(new Error('raw'));await act(async()=>establish());expect(journal.state.stamps).toHaveLength(0);expect(journal.error).toBe('journal.saveFailed');await act(async()=>establish());expect(journal.state.stamps).toHaveLength(1);
});
