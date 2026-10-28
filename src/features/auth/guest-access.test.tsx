import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { GuestAccessProvider,useGuestAccess } from './guest-access';
const disk=vi.hoisted(()=>({ values:new Map<string,string>(),get:vi.fn(),set:vi.fn(),clear:vi.fn() }));
vi.mock('@react-native-async-storage/async-storage',()=>({default:{getItem:disk.get,setItem:disk.set}}));
vi.mock('@/lib/query',()=>({queryClient:{clear:disk.clear}}));
let current:ReturnType<typeof useGuestAccess>; let tree:ReactTestRenderer;
function Probe(){const value=useGuestAccess();React.useEffect(()=>{current=value;});return null;}
beforeEach(()=>{ Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true}); disk.values.clear();disk.get.mockImplementation(async(k:string)=>disk.values.get(k)??null);disk.set.mockImplementation(async(k:string,v:string)=>{disk.values.set(k,v);});disk.clear.mockClear(); });
afterEach(async()=>{await act(async()=>tree?.unmount());vi.restoreAllMocks();});
async function mount(){await act(async()=>{tree=create(<GuestAccessProvider><Probe/></GuestAccessProvider>);});}
it('keeps guest access explicit and restores it offline only after a durable choice',async()=>{await mount();expect(current.enabled).toBe(false);await act(async()=>{await current.enter();});expect(current.enabled).toBe(true);expect(disk.clear).toHaveBeenCalledOnce();await act(async()=>tree.unmount());await mount();expect(current.enabled).toBe(true);});
it('keeps failed entry disabled with localized-code recovery and explicit retry',async()=>{await mount();disk.set.mockRejectedValueOnce(new Error('private detail'));await act(async()=>{await current.enter();});expect(current.enabled).toBe(false);expect(current.error).toBe('journal.saveFailed');await act(async()=>{await current.enter();});expect(current.enabled).toBe(true);});
it('does not turn a corrupt marker into guest authority',async()=>{disk.values.set('argala.guest.v1','corrupt');await mount();expect(current.enabled).toBe(false);expect(current.loading).toBe(false);});
it('keeps read errors recoverable without promoting guest access',async()=>{disk.get.mockRejectedValueOnce(new Error('raw'));await mount();expect(current.error).toBe('journal.loadFailed');await act(async()=>current.retry());expect(current.error).toBe(null);expect(current.enabled).toBe(false);});
