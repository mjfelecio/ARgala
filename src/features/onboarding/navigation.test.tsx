import { Harness, resetRuntime, runtime, deferred } from './test-harness';
import * as React from 'react';
import { createRequire } from 'node:module';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import RootNavigation from '@/features/navigation/root-navigation';
import { useOnboarding } from './provider';
import { onboardingStorageKey } from './completion';
import i18n from '@/i18n';
const guest = vi.hoisted(() => ({ enabled: false, loading: false }));
vi.mock('@/features/auth/guest-context', () => ({ useGuestAccess: () => guest }));

// Exercise SDK 57's protected child filtering and stack reducer. Replace native
// module barrels only: route guards and history removal stay in installed code.
vi.mock('expo-router', async () => {
  const { createRequire } = await import('node:module');
  const { createElement } = await import('react');
  const require = createRequire(import.meta.url);
  const loader = require('node:module'); const original = loader._load;
  let filter; let Screen; let Protected;
  const Group = () => null;
  try {
    loader._load = function(this: unknown, id: string, parent: { filename?: string }, ...rest: unknown[]) {
      if (parent?.filename?.endsWith('/layouts/withLayoutContext.js')) {
        if (id === '../native-tabs/NativeTabTrigger') return { isNativeTabTrigger: () => false };
        if (id === '../Route' || id === '../useScreens') return {};
      }
      if (parent?.filename?.endsWith('/views/Screen.js') && id !== 'react') return {};
      if (parent?.filename?.endsWith('/views/Protected.js') && id === '../primitives') return { Group };
      return original.call(this, id, parent, ...rest);
    };
    filter = require('expo-router/build/layouts/withLayoutContext').useFilterScreenChildren;
    Screen = require('expo-router/build/views/Screen').Screen;
    Protected = require('expo-router/build/views/Protected').Protected;
  } finally { loader._load = original; }
  return { Stack: Object.assign((props: React.PropsWithChildren) => {
    const { screens, protectedScreens } = filter(props.children);
    return createElement('navigator', { screens, protectedScreens });
  }, { Screen, Protected }) };
});
const require = createRequire(import.meta.url);
const { StackRouter } = require('expo-router/build/react-navigation/routers/StackRouter');
let tree: ReactTestRenderer | undefined;
let onboarding: ReturnType<typeof useOnboarding>;
function Probe() { const value = useOnboarding(); React.useEffect(() => { onboarding = value; }); return <RootNavigation />; }
async function mount() { await act(async () => { tree = create(<Harness><Probe /></Harness>); }); }
async function rerender() { await act(async () => { tree!.update(<Harness><Probe /></Harness>); }); }
function config() {
  const props = tree!.root.findByType('navigator' as React.ElementType).props;
  return { routeNames: props.screens.map((screen: { name: string }) => screen.name), routeParamList: {}, routeGetIdList: {}, routeKeyChanges: [] };
}
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true, __DEV__: false });
  resetRuntime(); guest.enabled=false; guest.loading=false; await i18n.changeLanguage('en');
  const original = console.error;
  vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => { if (!String(args[0]).startsWith('react-test-renderer is deprecated')) original(...args); });
});
afterEach(async () => { await act(async () => tree?.unmount()); tree = undefined; vi.restoreAllMocks(); });
it('shows only Welcome for new installs and removes its Back history after Continue', async () => {
  await mount();
  expect(config().routeNames).toEqual(['welcome']);
  const stack = StackRouter({});
  const welcome = stack.getInitialState(config());
  await act(async () => { await onboarding.complete('ko'); });
  expect(config().routeNames).toEqual(['sign-in']);
  const signIn = stack.getStateForRouteNamesChange(welcome, config());
  expect(signIn.routes.map((r: { name: string }) => r.name)).toEqual(['sign-in']);
  expect(stack.getStateForAction(signIn, { type: 'GO_BACK' }, config())).toBeNull();
  expect(stack.getStateForAction(signIn, { type: 'NAVIGATE', payload: { name: 'welcome' } }, config())).toBeNull();
});
it.each(['marker', 'legacy'])('sends returning unauthenticated %s users straight to Sign In', async kind => {
  runtime.values.set(kind === 'marker' ? onboardingStorageKey : 'argala.preferences.v1', kind === 'marker' ? 'complete' : '{}');
  await mount(); expect(config().routeNames).toEqual(['sign-in']);
});
it('preserves signed-in access and sign-out goes to Sign In even without an old marker', async () => {
  runtime.auth.session = { user: { id: 'returning' } };
  await mount();
  expect(config().routeNames).toEqual(['(app)']);
  const stack = StackRouter({}); const app = stack.getInitialState(config());
  runtime.auth.session = null; await rerender();
  expect(config().routeNames).toEqual(['sign-in']);
  const signedOut = stack.getStateForRouteNamesChange(app, config());
  expect(signedOut.routes[0].name).toBe('sign-in');
  expect(stack.getStateForAction(signedOut, { type: 'GO_BACK' }, config())).toBeNull();
});
it.each(['new', 'returning'])('rejects private deep links for %s unauthenticated users using the installed parser and reducer', async kind => {
  if (kind === 'returning') runtime.values.set(onboardingStorageKey, 'complete');
  await mount();
  const { getRoutes } = require('expo-router/build/getRoutesCore');
  const { getReactNavigationConfig } = require('expo-router/build/getReactNavigationConfig');
  const files = Object.fromEntries(Object.keys(import.meta.glob('../../app/**/*.tsx')).map(path => [path.replace('../../app/', './'), { default: () => null }]));
  const context = Object.assign((key: string) => files[key], { keys: () => Object.keys(files) });
  const routes = getRoutes(context, { platform: 'android', importMode: 'sync', skipGenerated: true, getSystemRoute: () => { throw new Error('Unexpected system route'); } });
  const routeConfig = getReactNavigationConfig(routes, true);
  const loader = require('node:module'); const original = loader._load;
  let parser;
  try {
    loader._load = function(this: unknown, id: string, parent: { filename?: string }, ...rest: unknown[]) {
      if (id === '../react-navigation/native' && parent?.filename?.endsWith('/fork/getStateFromPath.js')) return require('expo-router/build/react-navigation/core/validatePathConfig');
      return original.call(this, id, parent, ...rest);
    };
    parser = require('expo-router/build/fork/getStateFromPath').getStateFromPath;
  } finally { loader._load = original; }
  for (const path of ['/destinations/D01', '/place/provider-id', '/directions']) {
    const parsed = parser(path, routeConfig);
    expect(parsed.routes[0].name).toBe('(app)');
    const entered = StackRouter({}).getRehydratedState(parsed, config());
    expect(entered.routes.map((r: { name: string }) => r.name)).toEqual([kind === 'new' ? 'welcome' : 'sign-in']);
  }
});
it('waits for both auth and storage without exposing any route', async () => {
  runtime.auth.loading = true; await mount();
  expect(tree!.root.findAllByType('navigator' as React.ElementType)).toHaveLength(0);
  const read = deferred<string | null>();
  runtime.getItem.mockImplementation(async key => key === onboardingStorageKey ? read.promise : null);
  runtime.auth.loading = false; await rerender();
  expect(tree!.root.findAllByType('navigator' as React.ElementType)).toHaveLength(0);
  await act(async () => { read.resolve(null); });
  expect(config().routeNames).toEqual(['welcome']);
});
it.each(['en', 'ko', 'ja'])('localizes storage recovery and keeps auth recovery authoritative in %s', async language => {
  runtime.getItem.mockImplementation(async key => { if (key === onboardingStorageKey) throw new Error('PRIVATE ERROR'); return null; });
  await mount(); await act(async () => { await i18n.changeLanguage(language); });
  expect(tree!.root.findAllByType('navigator' as React.ElementType)).toHaveLength(0);
  expect(JSON.stringify(tree!.toJSON())).toContain(i18n.t('onboarding.loadFailed'));
  expect(JSON.stringify(tree!.toJSON())).not.toContain('PRIVATE ERROR');
  runtime.getItem.mockResolvedValue(null);
  await act(async () => { tree!.root.findByType('button').props.onPress(); });
  expect(config().routeNames).toEqual(['welcome']);
  runtime.auth.error = 'auth.restoreFailed'; await rerender();
  expect(JSON.stringify(tree!.toJSON())).toContain(i18n.t('auth.restoreFailed'));
  await act(async () => { tree!.root.findByType('button').props.onPress(); });
  expect(runtime.auth.retry).toHaveBeenCalledOnce();
});

it('permits explicitly restored guests without inventing a Supabase session and removes sign-in after authentication',async()=>{
 runtime.values.set(onboardingStorageKey,'complete');guest.enabled=true;await mount();expect(config().routeNames).toEqual(['sign-in','(app)']);
 runtime.auth.session={user:{id:'account'}};await rerender();expect(config().routeNames).toEqual(['(app)']);
});
it('waits for guest hydration before resolving unauthenticated deep links',async()=>{
 runtime.values.set(onboardingStorageKey,'complete');guest.loading=true;await mount();expect(tree!.root.findAllByType('navigator' as React.ElementType)).toHaveLength(0);
 guest.loading=false;await rerender();expect(config().routeNames).toEqual(['sign-in']);
});
