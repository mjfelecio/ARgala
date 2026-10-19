import { withHeroUI } from '@/test/native-ui';
import * as React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { createRequire } from 'node:module';
import { createInstance, type i18n } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { router } from 'expo-router';
import { localizationOptions } from '@/i18n/options';
import AppLayout from '@/app/(app)/_layout';
import { AppTabs } from './app-tabs';
import { AppHeader } from './app-header';
import { ImmersiveArScreen } from './immersive-ar-screen';
import ProfileScreen from './profile-screen';

// Exercise this app's navigator configuration with the installed SDK's real
// reducers. Only native navigator rendering is replaced in this Node suite.
const require = createRequire(import.meta.url);
const { TabRouter } = require('expo-router/build/react-navigation/routers/TabRouter');
const { StackRouter } = require('expo-router/build/react-navigation/routers/StackRouter');
vi.mock('expo-router', async () => {
 const { createElement } = await import('react');
 const screen = (props: Record<string, unknown>) => createElement('route', props);
 return { router: { push: vi.fn(), navigate: vi.fn() },
  Stack: Object.assign((props: Record<string, unknown>) => createElement('stack', props), { Screen: screen }),
  Tabs: Object.assign((props: Record<string, unknown>) => createElement('tabs', props), { Screen: screen }),
 };
});
vi.mock('@/features/ar/ar-screen', () => ({ default: 'ar-camera-screen' }));
let tree: ReactTestRenderer | undefined;
let translations: i18n;
function render(child: React.ReactNode) { return React.createElement(I18nextProvider, { i18n: translations }, withHeroUI(child)); }
async function mount(child: React.ReactNode) { await act(async () => { tree = create(render(child)); }); }
beforeEach(async () => {
 Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true, __DEV__: false });
 translations = createInstance();
 await translations.use(initReactI18next).init({ ...localizationOptions, lng: 'en', react: { useSuspense: false } });
 vi.mocked(router.push).mockClear(); vi.mocked(router.navigate).mockClear();
 const original = console.error;
 vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => { if (!String(args[0]).startsWith('react-test-renderer is deprecated')) original(...args); });
});
afterEach(async () => { await act(async () => tree?.unmount()); tree = undefined; vi.restoreAllMocks(); });
it('registers exactly Explore, AR View and Profile, with Explore selected and persistent scenes', async () => {
 await mount(React.createElement(AppTabs));
 const tabs = tree!.root.findByType('tabs' as React.ElementType);
 const routes = tree!.root.findAllByType('route' as React.ElementType);
 expect(routes.map(r => r.props.name)).toEqual(['index', 'ar', 'profile']);
 expect(routes.map(r => r.props.options.title)).toEqual(['Explore', 'AR View', 'Profile']);
 expect(tabs.props.screenOptions.popToTopOnBlur).not.toBe(true);
 const reducer = TabRouter(tabs.props);
 const config = { routeNames: routes.map(r => r.props.name), routeParamList: {}, routeGetIdList: {} };
 let state = reducer.getInitialState(config);
 expect(state.routes[state.index].name).toBe('index');
 for (const name of ['profile', 'ar', 'index']) {
  state = reducer.getStateForAction(state, { type: 'NAVIGATE', payload: { name } }, config);
  expect(state.routes[state.index].name).toBe(name);
 }
 expect(routes[0].props.options.tabBarIcon({ focused: true, color: 'green', size: 24 }).props.name).toBe('location');
 expect(routes[0].props.options.tabBarIcon({ focused: false, color: 'gray', size: 24 }).props.name).toBe('location-outline');
 expect(routes[2].props.options.tabBarIcon({ focused: true, color: 'green', size: 24 }).props.name).toBe('person');
 expect(routes[2].props.options.tabBarIcon({ focused: false, color: 'gray', size: 24 }).props.name).toBe('person-outline');
 expect(tabs.props.screenOptions.tabBarStyle.position).not.toBe('absolute');
 expect(tabs.props.screenOptions.tabBarStyle.height).toBe(88); // 64-unit bar + Android's 24-unit bottom inset.
 expect(tabs.props.screenOptions.tabBarActiveTintColor).toBe('#247A53');
 expect(tabs.props.screenOptions.tabBarInactiveTintColor).toBe('#3F4942');
 expect(routes[1].props.options).toMatchObject({ headerShown: false, tabBarStyle: { display: 'none' } });
});
it('returns Android Back from either secondary tab or direct AR entry to Explore', async () => {
 await mount(React.createElement(AppTabs));
 const reducer = TabRouter(tree!.root.findByType('tabs' as React.ElementType).props);
 const config = { routeNames: ['index', 'ar', 'profile'], routeParamList: {}, routeGetIdList: {} };
 for (const name of ['ar', 'profile']) {
  const entered = reducer.getStateForAction(reducer.getInitialState(config), { type: 'NAVIGATE', payload: { name } }, config);
  const returned = reducer.getStateForAction(entered, { type: 'GO_BACK' }, config);
  expect(returned.routes[returned.index].name).toBe('index');
 }
 const linked = reducer.getRehydratedState({ stale: true, index: 1, routes: [{ name: 'index' }, { name: 'ar' }, { name: 'profile' }] }, config);
 expect(reducer.getStateForAction(linked, { type: 'GO_BACK' }, config).index).toBe(0);
 expect(reducer.getStateForAction(reducer.getInitialState(config), { type: 'GO_BACK' }, config)).toBeNull();
});
it('hands an AR selection to the existing Explore route without replacing its route identity', async () => {
 await mount(React.createElement(AppTabs));
 const reducer = TabRouter(tree!.root.findByType('tabs' as React.ElementType).props);
 const config = { routeNames: ['index', 'ar', 'profile'], routeParamList: {}, routeGetIdList: {} };
 const initial = reducer.getInitialState(config);
 const camera = reducer.getStateForAction(initial, { type: 'NAVIGATE', payload: { name: 'ar' } }, config);
 const returned = reducer.getStateForAction(camera, { type: 'NAVIGATE', payload: { name: 'index', params: { placeId: 'north' } } }, config);
 expect(returned.routes[returned.index]).toMatchObject({ key: initial.routes[0].key, name: 'index', params: { placeId: 'north' } });
});
it('keeps Settings outside the tabs and Back restores the originating tab state', async () => {
 await mount(React.createElement(AppLayout));
 expect(tree!.root.findAllByType('route' as React.ElementType).map(r => r.props.name)).toEqual(['(tabs)', 'place/[providerId]', 'settings']);
 const reducer = StackRouter({ initialRouteName: '(tabs)' });
 const config = { routeNames: ['(tabs)', 'settings'], routeParamList: {}, routeGetIdList: {} };
 const initial = reducer.getInitialState(config);
 const original = { ...initial, routes: [{ ...initial.routes[0], state: { index: 2, routes: [{ name: 'index' }, { name: 'ar' }, { name: 'profile' }] } }] };
 const opened = reducer.getStateForAction(original, { type: 'PUSH', payload: { name: 'settings' } }, config);
 const returned = reducer.getStateForAction(opened, { type: 'GO_BACK' }, config);
 expect(returned.routes[0].state).toEqual(original.routes[0].state);
});
it('opens Settings from the branded header and preserves Android top safe area', async () => {
 await mount(React.createElement(AppHeader, { label: 'Explore' }));
 expect(tree!.root.findByType('safe-area' as React.ElementType).props.edges).toEqual(['top', 'left', 'right']);
 expect(JSON.stringify(tree!.toJSON())).toContain('ARgala');
 await act(async () => { tree!.root.findByType('button').props.onPress(); });
 expect(router.push).toHaveBeenCalledWith('/settings');
});
it.each([
 ['en', ['Explore', 'AR View', 'Profile'], 'Back to map', 'Open settings'],
 ['ko', ['탐색', 'AR 보기', '프로필'], '지도로 돌아가기', '설정 열기'],
 ['ja', ['探索', 'ARビュー', 'プロフィール'], '地図に戻る', '設定を開く'],
])('updates navigation and recovery actions from actual %s resources', async (locale, labels, back, settings) => {
 await mount(React.createElement(React.Fragment, null, React.createElement(AppTabs), React.createElement(ProfileScreen), React.createElement(ImmersiveArScreen)));
 await act(async () => { await translations.changeLanguage(locale); });
 expect(tree!.root.findAllByType('route' as React.ElementType).map(r => r.props.options.title)).toEqual(labels);
 const buttons = tree!.root.findAllByType('button');
 const profile = buttons.find(b => b.props.accessibilityLabel === settings);
 const map = buttons.find(b => b.props.accessibilityLabel === back);
 expect(profile).toBeDefined(); expect(map).toBeDefined();
 await act(async () => { profile!.props.onPress(); map!.props.onPress(); });
 expect(router.push).toHaveBeenCalledWith('/settings');
 expect(router.navigate).toHaveBeenCalledWith('/');
 expect(tree!.root.findAllByType('ar-camera-screen' as React.ElementType)).toHaveLength(1);
});
