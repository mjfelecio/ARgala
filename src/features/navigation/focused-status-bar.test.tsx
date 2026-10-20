import '@/test/native-ui';
import * as React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, expect, it, vi } from 'vitest';
import { FocusedStatusBar } from './focused-status-bar';
const state=vi.hoisted(()=>({focused:true}));
vi.mock('expo-router',()=>({useIsFocused:()=>state.focused}));
let tree:ReactTestRenderer;
afterEach(async()=>{await act(async()=>tree?.unmount());state.focused=true;});
it('releases a retained screen status-bar entry on blur and restores it on focus',async()=>{
 Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
 await act(async()=>{tree=create(<FocusedStatusBar style="dark"/>);});
 expect(tree.root.findByType('status-bar' as React.ElementType).props).toMatchObject({style:'dark',hidden:false});
 state.focused=false;await act(async()=>tree.update(<FocusedStatusBar style="dark"/>));expect(tree.toJSON()).toBeNull();
 state.focused=true;await act(async()=>tree.update(<FocusedStatusBar style="light"/>));expect(tree.root.findByType('status-bar' as React.ElementType).props.style).toBe('light');
});
