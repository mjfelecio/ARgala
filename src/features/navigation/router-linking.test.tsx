import { createRequire, Module } from 'node:module';
import * as React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

type State = { routes: { name: string; path?: string }[] };
type Navigation = { getRootState: () => { routeNames: string[] }; dispatch: (action: unknown) => void; resetRoot: (state: State) => void };
type Options = { enabled?: boolean; prefixes: string[]; getInitialURL: () => string | null | Promise<string | null>; subscribe: (listener: (url: string) => void) => () => void };
type UseLinking = (ref: React.RefObject<Navigation | null>, options: Options, notify: (path: string | undefined) => void) => { getInitialState: () => PromiseLike<State | undefined> };

const require = createRequire(import.meta.url);
const { useLinking, useThenable } = (() => {
  // Keep the SDK's actual linking, URL parsing and startup thenable hooks.
  // Replace only native modules and the native barrel (which imports RN views).
  const restore: (() => void)[] = [];
  try {
    for (const [id, exports] of [
      ['expo-linking', {}],
      ['react-native', { Linking: {}, Platform: { OS: 'android' } }],
      ['expo-router/build/react-navigation/native', {
        useNavigationIndependentTree: () => false,
        ...require('expo-router/build/react-navigation/core/getStateFromPath'),
        ...require('expo-router/build/react-navigation/core/getActionFromState'),
      }],
    ] as const) {
      const path = require.resolve(id);
      const previous = require.cache[path];
      const replacement = new Module(path);
      replacement.exports = exports; replacement.loaded = true;
      require.cache[path] = replacement;
      restore.push(() => { if (previous) require.cache[path] = previous; else delete require.cache[path]; });
    }
    const path = require.resolve('expo-router/build/fork/useLinking.native');
    const previous = require.cache[path];
    delete require.cache[path];
    restore.push(() => { if (previous) require.cache[path] = previous; else delete require.cache[path]; });
    return {
      useLinking: require('expo-router/build/fork/useLinking.native').useLinking as UseLinking,
      useThenable: require('expo-router/build/fork/useThenable').useThenable as (create: () => PromiseLike<State | undefined>) => [boolean, State | undefined],
    };
  } finally { restore.reverse().forEach((undo) => undo()); }
})();

let tree: ReactTestRenderer | undefined;
let options: Options;
let committed: boolean;
let snapshot: [boolean, State | undefined];
let listener: ((url: string) => void) | undefined;
const notifications = vi.fn<(path: string | undefined, committed: boolean) => void>();
const notify = (path: string | undefined) => notifications(path, committed);
const remove = vi.fn();
const navigation: Navigation = { getRootState: () => ({ routeNames: ['details', 'explore'] }), dispatch: vi.fn(), resetRoot: vi.fn() };
const ref = { current: navigation };

function Probe({ suspend = false }: { suspend?: boolean }) {
  React.useLayoutEffect(() => { committed = true; return () => { committed = false; }; }, []);
  const { getInitialState } = useLinking(ref, options, notify);
  const result = useThenable(getInitialState);
  React.useEffect(() => { snapshot = result; }, [result]);
  if (suspend) throw new Promise(() => {});
  return null;
}

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  committed = false; snapshot = [false, undefined]; listener = undefined;
  notifications.mockClear(); remove.mockClear(); vi.mocked(navigation.dispatch).mockClear(); vi.mocked(navigation.resetRoot).mockClear();
  options = {
    prefixes: ['argala://'], getInitialURL: () => null,
    subscribe: (callback) => { listener = callback; return () => { listener = undefined; remove(); }; },
  };
  const original = console.error;
  vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    if (!String(args[0]).startsWith('react-test-renderer is deprecated')) original(...args);
  });
});
afterEach(async () => { await act(async () => tree?.unmount()); tree = undefined; vi.restoreAllMocks(); });

it('does not update initial-link state from an abandoned suspended startup render', async () => {
  const initial = Promise.withResolvers<string | null>();
  options.getInitialURL = () => initial.promise;
  await act(async () => { tree = create(<React.Suspense fallback={null}><Probe suspend /></React.Suspense>); });
  expect(committed).toBe(false);
  await act(async () => { initial.resolve('argala://details'); });
  expect(notifications).not.toHaveBeenCalled();
});

it('resolves a synchronous cold link without notifying during render', async () => {
  options.getInitialURL = () => 'argala://details';
  await act(async () => { tree = create(<Probe />); });
  expect(snapshot).toMatchObject([true, { routes: [{ name: 'details' }] }]);
  expect(notifications.mock.calls).toEqual([['details', true]]);
});

it('keeps async cold startup pending and notifies once after commit', async () => {
  const initial = Promise.withResolvers<string | null>();
  options.getInitialURL = () => initial.promise;
  await act(async () => { tree = create(<Probe />); });
  expect(snapshot).toEqual([false, undefined]);
  expect(notifications).not.toHaveBeenCalled();
  await act(async () => { initial.resolve('argala://details'); });
  expect(snapshot).toMatchObject([true, { routes: [{ name: 'details' }] }]);
  expect(notifications.mock.calls).toEqual([['details', true]]);
  await act(async () => { tree!.update(<Probe />); });
  expect(notifications).toHaveBeenCalledOnce();
});

it('cancels initial-link notification when unmounted before URL resolution', async () => {
  const initial = Promise.withResolvers<string | null>();
  options.getInitialURL = () => initial.promise;
  await act(async () => { tree = create(<Probe />); });
  await act(async () => { tree!.unmount(); }); tree = undefined;
  await act(async () => { initial.resolve('argala://details'); });
  expect(notifications).not.toHaveBeenCalled();
  expect(remove).toHaveBeenCalledOnce();
  expect(listener).toBeUndefined();
});

it.each([null, ''])('finishes cold startup with URL %j without inventing navigation state', async (url) => {
  options.getInitialURL = () => url;
  await act(async () => { tree = create(<Probe />); });
  expect(snapshot).toEqual([true, undefined]);
  expect(notifications.mock.calls).toEqual(url === null ? [] : [['', true]]);
});

it.each([null, ''])('finishes async cold startup with URL %j', async (url) => {
  const initial = Promise.withResolvers<string | null>();
  options.getInitialURL = () => initial.promise;
  await act(async () => { tree = create(<Probe />); });
  await act(async () => { initial.resolve(url); });
  expect(snapshot).toEqual([true, undefined]);
  expect(notifications.mock.calls).toEqual(url === null ? [] : [['', true]]);
});

it('notifies a synchronous initial link only once under StrictMode effect replay', async () => {
  options.getInitialURL = () => 'argala://details';
  await act(async () => { tree = create(<React.StrictMode><Probe /></React.StrictMode>); });
  expect(notifications.mock.calls).toEqual([['details', true]]);
});

it('retains pending startup notification across StrictMode effect cleanup and replay', async () => {
  const initial = Promise.withResolvers<string | null>();
  options.getInitialURL = () => initial.promise;
  await act(async () => { tree = create(<React.StrictMode><Probe /></React.StrictMode>); });
  await act(async () => { initial.resolve('argala://details'); });
  expect(snapshot).toMatchObject([true, { routes: [{ name: 'details' }] }]);
  expect(notifications.mock.calls).toEqual([['details', true]]);
});

it('does not acquire or notify an initial URL when linking is disabled', async () => {
  const getInitialURL = vi.fn(() => 'argala://details');
  options = { ...options, enabled: false, getInitialURL };
  await act(async () => { tree = create(<Probe />); });
  await act(async () => { listener!('argala://details'); });
  expect(snapshot).toEqual([true, undefined]);
  expect(getInitialURL).not.toHaveBeenCalled();
  expect(notifications).not.toHaveBeenCalled();
  expect(navigation.dispatch).not.toHaveBeenCalled();
});

it('preserves live-link dispatch and subscription cleanup', async () => {
  await act(async () => { tree = create(<Probe />); });
  await act(async () => { listener!('argala://details'); });
  expect(notifications.mock.calls).toEqual([['details', true]]);
  expect(navigation.dispatch).toHaveBeenCalledWith({ type: 'NAVIGATE', payload: { name: 'details', path: 'details', params: {} } });
  await act(async () => { tree!.unmount(); }); tree = undefined;
  expect(remove).toHaveBeenCalledOnce();
});

it('recovers on a fresh mount without delivering an older unmounted startup link', async () => {
  const abandoned = Promise.withResolvers<string | null>();
  options.getInitialURL = () => abandoned.promise;
  await act(async () => { tree = create(<Probe />); });
  await act(async () => { tree!.unmount(); });
  options.getInitialURL = () => 'argala://explore';
  await act(async () => { tree = create(<Probe />); });
  await act(async () => { abandoned.resolve('argala://details'); });
  expect(snapshot).toMatchObject([true, { routes: [{ name: 'explore' }] }]);
  expect(notifications.mock.calls).toEqual([['explore', true]]);
});
