import { withHeroUI } from '@/test/native-ui';
import React from 'react';
import { act,create,type ReactTestRenderer } from 'react-test-renderer';
import { afterEach,beforeEach,expect,it,vi } from 'vitest';
import { createInstance } from 'i18next';
import { I18nextProvider,initReactI18next } from 'react-i18next';
import { localizationOptions } from '@/i18n/options';
import { GuestAccessProvider,useGuestAccess } from './guest-access';
import SignInScreen from './sign-in-screen';
const boundary=vi.hoisted(()=>({get:vi.fn(),set:vi.fn(),committed:false,navigated:[] as boolean[]}));
vi.mock('@react-native-async-storage/async-storage',()=>({default:{getItem:boundary.get,setItem:boundary.set}}));
vi.mock('@/lib/query',()=>({queryClient:{clear:vi.fn()}}));
vi.mock('@/lib/supabase',()=>({getSupabase:()=>{throw new Error('Guest entry must not call Auth');}}));
vi.mock('expo-router',()=>({router:{replace:()=>boundary.navigated.push(boundary.committed)}}));
const translations=createInstance();await translations.use(initReactI18next).init({...localizationOptions,lng:'en',react:{useSuspense:false}});
let tree:ReactTestRenderer;
function GuardProbe(){const guest=useGuestAccess();React.useLayoutEffect(()=>{boundary.committed=guest.enabled;},[guest.enabled]);return <SignInScreen/>;}
beforeEach(()=>{Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true,__DEV__:false});boundary.get.mockResolvedValue(null);boundary.set.mockResolvedValue(undefined);boundary.committed=false;boundary.navigated=[];});
afterEach(async()=>{await act(async()=>tree?.unmount());});
async function mount(){await act(async()=>{tree=create(withHeroUI(<I18nextProvider i18n={translations}><GuestAccessProvider><GuardProbe/></GuestAccessProvider></I18nextProvider>));});}
async function press(){await act(async()=>{tree.root.findAll(x=>x.type==='button'&&x.props.accessibilityLabel===translations.t('journal.continueGuest'))[0].props.onPress();});}
it('navigates only after guest authority has committed to the route guard',async()=>{await mount();await press();expect(boundary.navigated).toEqual([true]);});
it('does not navigate after failed guest persistence',async()=>{await mount();boundary.set.mockRejectedValueOnce(new Error('private'));await press();expect(boundary.navigated).toEqual([]);expect(JSON.stringify(tree.toJSON())).toContain(translations.t('journal.saveFailed'));});
