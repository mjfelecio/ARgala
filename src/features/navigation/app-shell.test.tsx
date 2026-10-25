/// <reference types="vite/client" />
import { nativeUi, withHeroUI } from '@/test/native-ui';
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
import { ImmersiveArScreen } from './immersive-ar-screen';
import { ArChrome } from '@/features/ar/ar-chrome';
import ProfileScreen from './profile-screen';
import SettingsScreen from '@/features/settings/settings-screen';

// Exercise this app's navigator configuration with the installed SDK's real
// reducers. Only native navigator rendering is replaced in this Node suite.
const require = createRequire(import.meta.url);
const { TabRouter } = require('expo-router/build/react-navigation/routers/TabRouter');
const { StackRouter } = require('expo-router/build/react-navigation/routers/StackRouter');
const routeFiles = import.meta.glob('../../app/**/*.tsx');
const layoutModules = import.meta.glob('../../app/**/_layout.tsx');
vi.mock('expo-router', async () => {
 const { createElement } = await import('react');
 const screen = (props: Record<string, unknown>) => createElement('route', props);
 return { useIsFocused: () => true, router: { push: vi.fn(), navigate: vi.fn() },
  Stack: Object.assign((props: Record<string, unknown>) => createElement('stack', props), { Screen: screen }),
  Tabs: Object.assign((props: Record<string, unknown>) => createElement('tabs', props), { Screen: screen }),
 };
});
vi.mock('@/features/settings/provider', () => ({ useSettings: () => ({ language: 'en', activationRadiusMeters: 100, storageError: null, save: vi.fn() }) }));
vi.mock('@/features/auth/sign-out-action', () => ({ SignOutAction: () => null }));
vi.mock('@/features/settings/profile-settings-content', () => ({ ProfileSettingsContent: (props: { entry: string }) => React.createElement('settings-content', props) }));
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
afterEach(async () => { await act(async () => tree?.unmount()); tree = undefined; nativeUi.fontScale = 1; vi.restoreAllMocks(); });

it.each(['en', 'ko', 'ja'])('keeps the %s header compact with degree-only heading and an accessible unavailable state', async language => {
 await translations.changeLanguage(language);
 nativeUi.fontScale = 1.6;
 const scan = vi.fn(); const map = vi.fn();
 await mount(React.createElement(ArChrome, { headingDegrees: null, onMap: map, onScan: scan, scanDisabled: false, scanBusy: false }));
 const guidance = tree!.root.findAllByType('text').find(node => node.props.accessibilityLabel === translations.t('ar.compassUnavailable'))!;
 expect(guidance.props.children).toBe('—');
 expect(guidance.props.numberOfLines).toBe(1);
 expect(guidance.parent!.props.className).toContain('w-full');
 const action = tree!.root.findAllByType('button').find(node => node.props.accessibilityLabel === translations.t('ar.scan'))!;
 expect(action.findAllByType('text').some(node => node.props.children === translations.t('ar.scanShort'))).toBe(true);
 expect(scan).not.toHaveBeenCalled();
 await act(async () => action.props.onPress());
 expect(scan).toHaveBeenCalledOnce();
 expect(map).not.toHaveBeenCalled();
 await act(async () => tree!.update(render(React.createElement(ArChrome, { headingDegrees: 138, onMap: map, onScan: scan, scanDisabled: false, scanBusy: false }))));
 expect(tree!.root.findAllByType('text').some(node => node.props.children === '140°')).toBe(true);
});
it.each(['en', 'ko', 'ja'])('calms only the %s degree readout and clears invalid direction immediately', async language => {
 await translations.changeLanguage(language);
 const onMap = vi.fn(); const onScan = vi.fn();
 const header = (headingDegrees: number | null) => React.createElement(ArChrome, { headingDegrees, onMap, onScan, scanDisabled: false, scanBusy: false });
 const shown = () => tree!.root.findAllByType('text').map(node => node.props.children).find(text => typeof text === 'string' && /^\d+°$/.test(text));
 const updateHeading = async (degrees: number | null) => { await act(async () => tree!.update(render(header(degrees)))); };
 await mount(header(233));
 expect(shown()).toBe('230°');
 for (const degrees of [235, 231, 229, 234, 232]) {
  await updateHeading(degrees);
  expect(shown()).toBe('230°');
  expect(tree!.root.findByType(ArChrome).props.headingDegrees).toBe(degrees);
 }
 await updateHeading(239); expect(shown()).toBe('240°');
 await updateHeading(329); expect(shown()).toBe('330°');
 await updateHeading(359); expect(shown()).toBe('0°');
 for (const degrees of [1, 358, 2]) { await updateHeading(degrees); expect(shown()).toBe('0°'); }
 await updateHeading(233); expect(shown()).toBe('230°');
 await updateHeading(null);
 expect(shown()).toBeUndefined();
 expect(tree!.root.findAllByType('text').find(node => node.props.accessibilityLabel === translations.t('ar.compassUnavailable'))!.props.children).toBe('—');
 await updateHeading(236); expect(shown()).toBe('240°');
 expect(onScan).not.toHaveBeenCalled(); expect(onMap).not.toHaveBeenCalled();
});
it.each(['D01', 'D09', 'unknown'])('anchors direct destination %s Back through catalog then Explore with the installed router', async destinationId => {
 const { getRoutes } = require('expo-router/build/getRoutesCore');
 const { getReactNavigationConfig } = require('expo-router/build/getReactNavigationConfig');
 const layouts = Object.fromEntries(await Promise.all(Object.entries(layoutModules).filter(([path]) => path.startsWith('../../app/(app)/')).map(async ([path, load]) => [path, await load()])));
 const files = Object.fromEntries(Object.keys(routeFiles).filter(path => path.startsWith('../../app/(app)/')).map(path => [path.replace('../../app/', './'), layouts[path] ?? { default: () => null }]));
 files['./_layout.tsx'] = { default: () => null };
 const context = Object.assign((key: string) => files[key], { keys: () => Object.keys(files) });
 const routes = getRoutes(context, { platform: 'android', importMode: 'sync', skipGenerated: true, getSystemRoute: () => { throw new Error('Unexpected system route'); } });
 const config = getReactNavigationConfig(routes, true);
 // Keep the installed parser and its validator; replace only the native barrel import.
 const validator = require('expo-router/build/react-navigation/core/validatePathConfig');
 const loader = require('node:module'); const original = loader._load;
 let parser;
 try {
  loader._load = function(this: unknown, id: string, parent: { filename?: string }, ...rest: unknown[]) {
   if (id === '../react-navigation/native' && parent?.filename?.endsWith('/fork/getStateFromPath.js')) return validator;
   return original.call(this, id, parent, ...rest);
  };
  parser = require('expo-router/build/fork/getStateFromPath').getStateFromPath;
 } finally { loader._load = original; }
 const parsed = parser(`/destinations/${destinationId}`, config);
 expect(parsed, JSON.stringify(config)).toBeDefined();
 const app = parsed.routes[0].state;
 const destination = app.routes[app.index];
 expect(destination.state?.routes.map((route: { name: string }) => route.name)).toEqual(['index', '[destinationId]']);
 const childRouter = StackRouter({ initialRouteName: 'index' });
 const childOptions = { routeNames: ['index', '[destinationId]'], routeParamList: {}, routeGetIdList: {} };
 const entered = childRouter.getRehydratedState(destination.state, childOptions);
 const catalog = childRouter.getStateForAction(entered, { type: 'GO_BACK' }, childOptions);
 expect(catalog.routes[catalog.index].name).toBe('index');
 expect(childRouter.getStateForAction(catalog, { type: 'GO_BACK' }, childOptions)).toBeNull();
 const parent = StackRouter({ initialRouteName: '(tabs)' });
 const options = { routeNames: Object.keys(config.screens['(app)'].screens), routeParamList: {}, routeGetIdList: {} };
 const home = parent.getStateForAction(parent.getRehydratedState(app, options), { type: 'GO_BACK' }, options);
 expect(home.routes[home.index].name).toBe('(tabs)');
});
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
 expect(routes[2].props.options.headerShown).toBe(false);
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
 expect(tree!.root.findAllByType('route' as React.ElementType).map(r => r.props.name)).toEqual(['(tabs)', 'place/[providerId]', 'directions', 'destinations', 'settings', 'viro-spike']);
 expect(tree!.root.findAllByType('route' as React.ElementType).find(r => r.props.name === 'settings')!.props.options.headerShown).toBe(false);
 const reducer = StackRouter({ initialRouteName: '(tabs)' });
 const config = { routeNames: ['(tabs)', 'settings'], routeParamList: {}, routeGetIdList: {} };
 const initial = reducer.getInitialState(config);
 const original = { ...initial, routes: [{ ...initial.routes[0], state: { index: 2, routes: [{ name: 'index' }, { name: 'ar' }, { name: 'profile' }] } }] };
 const opened = reducer.getStateForAction(original, { type: 'PUSH', payload: { name: 'settings' } }, config);
 const returned = reducer.getStateForAction(opened, { type: 'GO_BACK' }, config);
 expect(returned.routes[0].state).toEqual(original.routes[0].state);
});
it.each([
 ['en', ['Explore', 'AR View', 'Profile'], 'Back to map', 'Open settings'],
 ['ko', ['탐색', 'AR 보기', '프로필'], '지도로 돌아가기', '설정 열기'],
 ['ja', ['探索', 'ARビュー', 'プロフィール'], '地図に戻る', '設定を開く'],
])('updates navigation and recovery actions from actual %s resources', async (locale, labels, back) => {
 await mount(React.createElement(React.Fragment, null, React.createElement(AppTabs), React.createElement(ImmersiveArScreen), React.createElement(ArChrome, { headingDegrees: null, onMap: () => router.navigate('/'), onScan: () => {}, scanDisabled: true, scanBusy: false })));
 await act(async () => { await translations.changeLanguage(locale); });
 expect(tree!.root.findAllByType('route' as React.ElementType).map(r => r.props.options.title)).toEqual(labels);
 const buttons = tree!.root.findAllByType('button');
 const map = buttons.find(b => b.props.accessibilityLabel === back);
 expect(map).toBeDefined();
 await act(async () => { map!.props.onPress(); });
 expect(router.navigate).toHaveBeenCalledWith('/');
 expect(tree!.root.findAllByType('ar-camera-screen' as React.ElementType)).toHaveLength(1);
});
it.each(['index', 'ar'])('keeps the %s tab context below Details and returns to the existing tab navigator', async origin => {
 await mount(React.createElement(AppLayout));
 const routes = tree!.root.findAllByType('route' as React.ElementType);
 expect(routes.find(r => r.props.name === 'place/[providerId]')!.props.options.headerShown).toBe(false);
 const stack = StackRouter({ initialRouteName: '(tabs)' });
 const config = { routeNames: routes.map(r => r.props.name), routeParamList: {}, routeGetIdList: {} };
 const tabs = TabRouter({ initialRouteName: 'index', backBehavior: 'initialRoute' });
 const tabConfig = { routeNames: ['index', 'ar', 'profile'], routeParamList: {}, routeGetIdList: {} };
 const initialTabs = tabs.getInitialState(tabConfig);
 const sourceTabs = tabs.getStateForAction(initialTabs, { type: 'NAVIGATE', payload: { name: origin } }, tabConfig);
 const base = stack.getInitialState(config);
 const original = { ...base, routes: [{ ...base.routes[0], state: sourceTabs }] };
 const opened = stack.getStateForAction(original, { type: 'PUSH', payload: { name: 'place/[providerId]', params: { providerId: 'north' } } }, config);
 expect(opened.routes[opened.index].params.providerId).toBe('north');
 expect(stack.getStateForAction(opened, { type: 'GO_BACK' }, config).routes[0].state).toEqual(sourceTabs);
 const { findDivergentState, getPayloadFromStateRoute } = require('expo-router/build/global-state/stateUtils');
 for (const name of ['index', 'ar']) {
  const target = { routes: [{ name: '(tabs)', state: { routes: [{ name, params: { placeId: 'north' } }] } }] };
  const { navigationState, actionStateRoute } = findDivergentState(target, opened);
  expect(navigationState.key).toBe(opened.key);
  const payload = getPayloadFromStateRoute(actionStateRoute);
  const returned = stack.getStateForAction(opened, { type: 'POP_TO', payload: { name: payload.screen, params: payload.params } }, config);
  expect(returned.routes).toHaveLength(1); expect(returned.routes[0].key).toBe(original.routes[0].key);
  expect(returned.routes[0].params).toMatchObject({ screen: name, params: { placeId: 'north' } });
 }
});

it('shares settings content between the Profile tab and parent Settings route', async () => {
 await mount(React.createElement(React.Fragment, null, React.createElement(ProfileScreen), React.createElement(SettingsScreen)));
 expect(tree!.root.findAllByType('settings-content' as React.ElementType).map(node => node.props.entry)).toEqual(['tab', 'stack']);
});

it('lets Explore own its floating search bar without a navigator header', async () => {
 await mount(React.createElement(AppTabs));
 const tabs=tree!.root.findByType('tabs' as React.ElementType);
 expect(tabs.props.screenOptions.headerShown).toBe(false);
 expect(tabs.props.screenOptions.header).toBeUndefined();
});
