import { withHeroUI } from '@/test/native-ui';
import React from 'react';
import { AppState } from 'react-native';
import { act,create,type ReactTestRenderer } from 'react-test-renderer';
import { afterEach,beforeEach,expect,it,vi } from 'vitest';
import { createInstance } from 'i18next';
import { I18nextProvider,initReactI18next } from 'react-i18next';
import { localizationOptions } from '@/i18n/options';
import { JournalProvider,useJournal } from './provider';
import { JournalSyncStatusView } from './sync-status';
import { JournalSyncError,type JournalSyncTransport } from './sync-service';
const runtime=vi.hoisted(()=>({values:new Map<string,string>(),get:vi.fn(),set:vi.fn(),transport:vi.fn(),session:null as {user:{id:string};access_token:string}|null,listeners:[] as ((state:import('react-native').AppStateStatus)=>void)[]}));
vi.mock('@react-native-async-storage/async-storage',()=>({default:{getItem:runtime.get,setItem:runtime.set}}));
vi.mock('@/features/auth/provider',()=>({useAuth:()=>({session:runtime.session})}));
vi.mock('@/features/auth/guest-context',()=>({useGuestAccess:()=>({enabled:true})}));
vi.mock('./sync-service',async()=>{const actual=await vi.importActual<typeof import('./sync-service')>('./sync-service');return {...actual,journalSyncService:(...args:Parameters<JournalSyncTransport>)=>runtime.transport(...args)};});
const translations=createInstance();await translations.use(initReactI18next).init({...localizationOptions,lng:'en',react:{useSuspense:false}});
let tree:ReactTestRenderer;let journal:NonNullable<ReturnType<typeof useJournal>>;
function Probe(){const value=useJournal()!;React.useEffect(()=>{journal=value;});return <JournalSyncStatusView/>;}
const view=()=>withHeroUI(<I18nextProvider i18n={translations}><JournalProvider><Probe/></JournalProvider></I18nextProvider>);
async function mount(){await act(async()=>{tree=create(view());});}
async function update(){await act(async()=>tree.update(view()));}
async function foreground(active:boolean){Object.assign(AppState,{currentState:active?'active':'background'});await act(async()=>{runtime.listeners.forEach(fn=>fn(active?'active':'background'));});}
const copy=()=>JSON.stringify(tree.toJSON());
beforeEach(async()=>{Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true,__DEV__:false});Object.assign(AppState,{currentState:'active'});runtime.values.clear();runtime.get.mockReset().mockImplementation(async(k:string)=>runtime.values.get(k)??null);runtime.set.mockReset().mockImplementation(async(k:string,v:string)=>{runtime.values.set(k,v);});runtime.session=null;runtime.listeners=[];runtime.transport.mockReset().mockImplementation(async r=>({status:'applied',sequence:r.flight.sequence,requestId:r.flight.requestId,revision:r.flight.revision,journal:r.flight.journal}));vi.spyOn(AppState,'addEventListener').mockImplementation((_event,listener)=>{runtime.listeners.push(listener);return {remove:()=>{runtime.listeners=runtime.listeners.filter(fn=>fn!==listener);}};});await translations.changeLanguage('en');});
afterEach(async()=>{await act(async()=>tree?.unmount());vi.useRealTimers();vi.restoreAllMocks();});
it('keeps guest entirely local and syncs merged guest data only under the signed-in token',async()=>{await mount();await act(async()=>{await journal.save({kind:'google',id:'ChIJ_guest'},true);});expect(runtime.transport).not.toHaveBeenCalled();runtime.session={user:{id:'user-a'},access_token:'token-a'};await update();expect(runtime.transport).toHaveBeenCalledOnce();expect(runtime.transport.mock.calls[0][1]).toEqual({principalId:'user-a',accessToken:'token-a'});expect(journal.state.bookmarks).toEqual([{kind:'google',id:'ChIJ_guest'}]);expect(copy()).toContain(translations.t('journal.synced'));});
it.each(['en','ja','ko'])('shows actual %s recovery resources, retains local data, and retries unknown failures',async locale=>{
 await translations.changeLanguage(locale);runtime.session={user:{id:'user-a'},access_token:'token-a'};runtime.transport.mockRejectedValueOnce(new Error('PRIVATE network detail'));await mount();expect(copy()).toContain(translations.t('journal.syncFailed'));expect(copy()).not.toContain('PRIVATE');
 await act(async()=>{await journal.save({kind:'featured',id:'D01'},true);});expect(journal.state.bookmarks).toHaveLength(1);
 await act(async()=>{tree.root.findAll(x=>x.type==='button'&&x.props.accessibilityLabel===translations.t('journal.retrySync'))[0].props.onPress();});expect(journal.state.bookmarks).toHaveLength(1);expect(copy()).toContain(translations.t('journal.synced'));
});
it('does not publish an old account response and captures the refreshed token for explicit retry',async()=>{
 const gate=Promise.withResolvers<void>();runtime.session={user:{id:'user-a'},access_token:'old-a'};runtime.transport.mockImplementationOnce(async r=>{await gate.promise;return {status:'applied',sequence:r.flight.sequence,requestId:r.flight.requestId,revision:0,journal:{version:1,bookmarks:[{kind:'google',id:'ChIJ_private_a'}],stamps:[]}};});await mount();runtime.session={user:{id:'user-b'},access_token:'token-b'};await update();await act(async()=>gate.resolve());expect(journal.principalId).toBe('user-b');expect(journal.state.bookmarks).toHaveLength(0);
 runtime.session={user:{id:'user-b'},access_token:'refreshed-b'};await update();const before=runtime.transport.mock.calls.length;await act(async()=>journal.syncNow());expect(runtime.transport.mock.calls.at(-1)![1].accessToken).toBe('refreshed-b');expect(runtime.transport.mock.calls.length).toBe(before+1);
});
it('defers background changes and uses the actual foreground snapshot to resume',async()=>{
 vi.useFakeTimers();runtime.session={user:{id:'user-a'},access_token:'token-a'};await mount();await foreground(false);const count=runtime.transport.mock.calls.length;await act(async()=>{await journal.save({kind:'google',id:'ChIJ_background'},true);});await act(async()=>{await vi.advanceTimersByTimeAsync(500);});expect(runtime.transport).toHaveBeenCalledTimes(count);
 await foreground(true);expect(runtime.transport.mock.calls.length).toBe(count+1);expect(journal.state.bookmarks).toHaveLength(1);
});
it.each(['journal.syncAuth','journal.syncTimeout','journal.syncUnavailable','journal.syncConflict'] as const)('renders known %s failures and follows language changes',async code=>{
 runtime.session={user:{id:'user-a'},access_token:'token-a'};runtime.transport.mockRejectedValueOnce(new JournalSyncError(code));await mount();expect(copy()).toContain(translations.t(code));await act(async()=>{await translations.changeLanguage('ko');});expect(copy()).toContain(translations.t(code));await act(async()=>{await translations.changeLanguage('ja');});expect(copy()).toContain(translations.t(code));
});
