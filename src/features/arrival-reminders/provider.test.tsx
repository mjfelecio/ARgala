import { withHeroUI } from '@/test/native-ui';
import React from 'react';
import { act,create,type ReactTestRenderer } from 'react-test-renderer';
import { beforeEach,afterEach,expect,it,vi } from 'vitest';
import { I18nextProvider,initReactI18next } from 'react-i18next';
import { createInstance } from 'i18next';
import { localizationOptions } from '@/i18n/options';
import { getDestination,type FeaturedDestinationId } from '@/features/destinations/catalog';
import { ArrivalReminderProvider,useArrivalReminders } from './provider';
import { DestinationReminderAction,ReminderSettings } from './components';
const state=vi.hoisted(()=>({values:new Map<string,string>(),session:null as {user:{id:string}}|null,guest:true,loading:false,active:true,focused:true,navigationKey:undefined as string|undefined,guardReady:false,request:vi.fn(async()=>true),register:vi.fn(async()=>{}),check:vi.fn(async()=>true),listener:null as null|((r:unknown)=>void),last:null as unknown,push:vi.fn(),set:vi.fn(),get:vi.fn()}));
vi.mock('@react-native-async-storage/async-storage',()=>({default:{getItem:state.get,setItem:state.set}}));
vi.mock('@/features/auth/provider',()=>({useAuth:()=>({session:state.session,loading:state.loading})}));
vi.mock('@/features/auth/guest-context',()=>({useGuestAccess:()=>({enabled:state.guest,loading:false})}));
vi.mock('@/lib/use-app-active',()=>({useAppActive:()=>state.active}));
vi.mock('expo-router',()=>({useIsFocused:()=>state.focused,useRootNavigationState:()=>({key:state.navigationKey}),router:{push:state.push}}));
vi.mock('./native',()=>({reminderNative:{available:()=>true,check:state.check,request:state.request,register:state.register,unregister:vi.fn(async()=>{}),cancel:vi.fn(async()=>{})},optionalNotifications:()=>({addNotificationResponseReceivedListener:(listener:(r:unknown)=>void)=>{state.listener=listener;return {remove:()=>{}};},getLastNotificationResponse:()=>state.last})}));
const i18n=createInstance();await i18n.use(initReactI18next).init({...localizationOptions,lng:'en',react:{useSuspense:false}});
let onOpenDestination:((id:FeaturedDestinationId)=>void)|undefined;
let committedRenders=0;let afterCommit:(()=>void)|undefined;
let tree:ReactTestRenderer;let api:NonNullable<ReturnType<typeof useArrivalReminders>>;let mounts=0;
function Probe(){const value=useArrivalReminders()!;React.useEffect(()=>{api=value;});React.useEffect(()=>{mounts++;},[]);return <><DestinationReminderAction destination={getDestination('pilot-aclc')!}/><ReminderSettings/></>;}
const view=()=>withHeroUI(<React.Profiler id="reminder-provider" onRender={()=>{committedRenders++;afterCommit?.();}}><I18nextProvider i18n={i18n}><ArrivalReminderProvider navigationReady={state.guardReady} onOpenDestination={onOpenDestination}><Probe/></ArrivalReminderProvider></I18nextProvider></React.Profiler>);
async function mount(){await act(async()=>{tree=create(view());});}
async function update(){await act(async()=>tree.update(view()));}
async function press(key:string){const button=tree.root.findAll(x=>x.type==='button'&&x.props.accessibilityLabel===i18n.t(key))[0];expect(button).toBeDefined();await act(async()=>{await button.props.onPress();});}
beforeEach(async()=>{Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true,__DEV__:false});state.values.clear();committedRenders=0;afterCommit=undefined;onOpenDestination=undefined;state.session=null;state.guest=true;state.loading=false;state.active=true;state.focused=true;state.navigationKey='root';state.guardReady=true;state.last=null;state.listener=null;state.set.mockReset().mockImplementation(async(key:string,value:string)=>{state.values.set(key,value);});state.get.mockReset().mockImplementation(async(key:string)=>state.values.get(key)??null);state.check.mockReset().mockResolvedValue(true);state.request.mockReset().mockResolvedValue(true);state.register.mockReset().mockResolvedValue(undefined);state.push.mockReset();mounts=0;await i18n.changeLanguage('en');});
afterEach(async()=>{await act(async()=>tree?.unmount());});
it.each(['en','ja','ko'])('uses real %s copy for one-shot opt-in, errors, recovery and live language changes',async locale=>{await i18n.changeLanguage(locale);await mount();expect(JSON.stringify(tree.toJSON())).toContain(i18n.t('reminders.enable'));expect(state.request).not.toHaveBeenCalled();state.request.mockResolvedValueOnce(false);await press('reminders.enable');expect(JSON.stringify(tree.toJSON())).toContain(i18n.t('reminders.permissions'));state.request.mockResolvedValue(true);await press('reminders.enable');expect(api.snapshot.selections).toHaveLength(1);expect(state.register).toHaveBeenCalledOnce();await act(async()=>{await i18n.changeLanguage(locale==='en'?'ja':'en');});expect(JSON.stringify(tree.toJSON())).toContain(i18n.t('reminders.disable'));expect(JSON.stringify(tree.toJSON())).not.toContain('private raw');await press('reminders.disable');expect(api.snapshot.selections).toHaveLength(0);});
it('changes reminder principal without remounting the app subtree or merging guest opt-ins',async()=>{await mount();await press('reminders.enable');state.session={user:{id:'account-a'}};await update();expect(api.snapshot.principalId).toBe('account-a');expect(api.snapshot.selections).toHaveLength(0);expect(mounts).toBe(1);});
it('does not prompt or silently enable on foreground, focus, locale or navigation readiness changes',async()=>{await mount();state.active=false;state.focused=false;await update();state.active=true;state.focused=true;await update();await act(async()=>{await i18n.changeLanguage('ko');});expect(state.request).not.toHaveBeenCalled();expect(state.register).not.toHaveBeenCalled();});
it('keeps a cold tap queued through loading and guard/navigation readiness, then opens bundled details once',async()=>{state.loading=true;state.navigationKey=undefined;state.guardReady=false;state.last={notification:{request:{identifier:'cold-tap',content:{data:{kind:'destination-arrival',destinationId:'pilot-aclc',generation:'cold-generation'}}}}};state.values.set('argala.reminders.v1:guest',JSON.stringify({version:1,selections:[{destinationId:'pilot-aclc',generation:'cold-generation',locale:'en',consented:true,claimed:true}]}));await mount();expect(state.push).not.toHaveBeenCalled();state.loading=false;await update();expect(state.push).not.toHaveBeenCalled();state.navigationKey='root';state.guardReady=true;await update();expect(state.push).toHaveBeenCalledExactlyOnceWith({pathname:'/destinations/[destinationId]',params:{destinationId:'pilot-aclc'}});await act(async()=>state.listener?.(state.last));expect(state.push).toHaveBeenCalledOnce();});
it('shows stable localized storage failure without leaking native or storage messages',async()=>{state.get.mockRejectedValueOnce(new Error('private raw'));await mount();expect(JSON.stringify(tree.toJSON())).toContain(i18n.t('reminders.storageFailed'));expect(JSON.stringify(tree.toJSON())).not.toContain('private raw');await press('common.retry');expect(api.snapshot.ready).toBe(true);});
it('preserves one explicit permission owner across Android Settings background and foreground transitions',async()=>{await mount();const gate=Promise.withResolvers<boolean>();state.request.mockImplementationOnce(()=>gate.promise);let enabling!:Promise<void>;await act(async()=>{enabling=api.enable(getDestination('pilot-aclc')!,'en');});state.active=false;await update();state.active=true;await update();expect(state.request).toHaveBeenCalledOnce();await act(async()=>{gate.resolve(true);await enabling;});expect(api.snapshot.selections).toHaveLength(1);expect(state.register).toHaveBeenCalledOnce();});
it('uses the latest committed selected-featured callback after readiness while retaining tap dedupe',async()=>{state.guardReady=false;const first=vi.fn();const latest=vi.fn();onOpenDestination=first;state.last={notification:{request:{identifier:'map-tap',content:{data:{kind:'destination-arrival',destinationId:'pilot-aclc',generation:'map-generation'}}}}};state.values.set('argala.reminders.v1:guest',JSON.stringify({version:1,selections:[{destinationId:'pilot-aclc',generation:'map-generation',locale:'en',consented:true,claimed:true}]}));await mount();onOpenDestination=latest;await update();state.guardReady=true;await update();expect(first).not.toHaveBeenCalled();expect(latest).toHaveBeenCalledExactlyOnceWith('pilot-aclc');expect(state.push).not.toHaveBeenCalled();await act(async()=>state.listener?.(state.last));expect(latest).toHaveBeenCalledOnce();});
it('bounds renders while tap validation storage is deferred across navigation readiness transitions',async()=>{
 await mount();
 state.values.set('argala.reminders.v1:guest',JSON.stringify({version:1,selections:[{destinationId:'pilot-aclc',generation:'deferred-generation',locale:'en',consented:true,claimed:true}]}));
 const gate=Promise.withResolvers<void>();let deferredReads=0;let escapedRenderLoop=false;
 const open=vi.fn();onOpenDestination=open;await update();
 state.get.mockImplementation(async(key:string)=>{if(key==='argala.reminders.v1:guest'){deferredReads++;await gate.promise;}return state.values.get(key)??null;});
 const response={notification:{request:{identifier:'deferred-tap',content:{data:{kind:'destination-arrival',destinationId:'pilot-aclc',generation:'deferred-generation'}}}}};
 try{
  await act(async()=>state.listener?.(response));expect(deferredReads).toBe(1);
  state.guardReady=false;await update();const beforeReady=committedRenders;
  // Unstick the buggy implementation after a bounded number of commits so RED
  // reports the render loop instead of starving the runner's timers indefinitely.
  afterCommit=()=>{if(committedRenders>beforeReady+8){escapedRenderLoop=true;gate.resolve();}};
  state.guardReady=true;await update();
  expect(escapedRenderLoop).toBe(false);expect(committedRenders-beforeReady).toBeLessThanOrEqual(2);
  expect(deferredReads).toBe(1);expect(open).not.toHaveBeenCalled();
  await act(async()=>{gate.resolve();await gate.promise;});
  expect(open).toHaveBeenCalledExactlyOnceWith('pilot-aclc');
  await act(async()=>state.listener?.(response));expect(open).toHaveBeenCalledOnce();
 }finally{afterCommit=undefined;await act(async()=>{gate.resolve();await gate.promise;});}
});
