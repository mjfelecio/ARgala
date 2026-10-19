import '@/test/native-ui';
import * as React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { QueryClient, QueryClientProvider, notifyManager } from '@tanstack/react-query';
import { beforeEach, afterEach, it, expect, vi } from 'vitest';
import { queryClient } from '@/lib/query';
import { getCurrentCoordinates, requestLocationPermission, subscribeToLocation } from '@/features/location/service';
import { createRoutePreviewIntent } from './route-preview-intent';
import { routeService } from './service';
import { useRoutePreview } from './use-route-preview';
const navigation = vi.hoisted(() => ({ active: true, focused: true, ref: { current: null as object | null }, context: null as React.Context<unknown> | null, focusContext: null as React.Context<boolean | undefined> | null,
  value: { isFocused: () => true, addListener: () => () => {} }, remove: vi.fn() }));
vi.mock('expo-router', async () => {
  // Exercise the installed SDK hooks. Their CJS dependencies need Node's module
  // cache rather than an ESM hook mock; only navigation contexts/ref are fixtures.
  const { createRequire, Module } = await import('node:module');
  const require = createRequire(import.meta.url);
  const core = require('expo-router/build/react-navigation/core/useNavigation');
  const focus = require('expo-router/build/react-navigation/core/useIsFocused');
  navigation.context = require('expo-router/build/react-navigation/core/NavigationContext').NavigationContext;
  navigation.focusContext = focus.IsFocusedContext;
  const restore: (() => void)[] = [];
  try {
    for (const id of ['expo-router/build/useFocusEffect', 'expo-router/build/link/useLoadedNavigation']) {
      const path = require.resolve(id);
      const previous = require.cache[path];
      delete require.cache[path];
      restore.push(() => { if (previous) require.cache[path] = previous; else delete require.cache[path]; });
    }
    for (const [id, exports] of [
      ['expo-router/build/react-navigation/native', core],
      ['expo-router/build/useNavigation', core],
      ['expo-router/build/global-state/router-store', { store: { navigationRef: navigation.ref } }],
    ] as const) {
      const path = require.resolve(id);
      const previous = require.cache[path];
      const replacement = new Module(path);
      replacement.exports = exports; replacement.loaded = true;
      require.cache[path] = replacement;
      restore.push(() => { if (previous) require.cache[path] = previous; else delete require.cache[path]; });
    }
    return { useFocusEffect: require('expo-router/build/useFocusEffect').useFocusEffect, useIsFocused: focus.useIsFocused };
  } finally { restore.reverse().forEach((undo) => undo()); }
});

vi.mock('@/features/location/service', () => ({ requestLocationPermission: vi.fn(async () => ({ granted: true, canAskAgain: true })), isLocationEnabled: vi.fn(async () => true), getCurrentCoordinates: vi.fn(), subscribeToLocation: vi.fn(), subscribeToHeading: vi.fn() }));
vi.mock('@/lib/use-app-active', () => ({ useAppActive: () => navigation.active }));
vi.mock('@/features/settings/provider', () => ({ useSettings: () => ({ language: 'en' }) }));
vi.mock('./service', () => ({ routeService: { walking: vi.fn() } }));
let client: QueryClient; let token: string; let tree: ReactTestRenderer | undefined;
let state: ReturnType<typeof useRoutePreview>;
const permissionGrant: Awaited<ReturnType<typeof requestLocationPermission>> = { granted: true, canAskAgain: true, status: 'granted' as Awaited<ReturnType<typeof requestLocationPermission>>['status'], expires: 'never' };
const place = { id: 'google:north', provider: 'google', providerId: 'north', name: 'North', coordinates: { latitude: 11, longitude: 124 }, attributions: [] };
function Probe() { const value = useRoutePreview(token, true); React.useEffect(() => { state = value; }, [value]); return null; }
function render() { const NavigationProvider = navigation.context!.Provider; const FocusProvider = navigation.focusContext!.Provider;
  return <QueryClientProvider client={client}><NavigationProvider value={navigation.value}><FocusProvider value={navigation.focused}><Probe /></FocusProvider></NavigationProvider></QueryClientProvider>; }

function fix() { return { coords: { latitude: 11.01, longitude: 124.61, accuracy: 8, altitude: null, altitudeAccuracy: null, heading: null, speed: null }, timestamp: Date.now() }; }
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true, __DEV__: false }); vi.useFakeTimers(); vi.clearAllMocks(); navigation.active = true; navigation.focused = true; navigation.ref.current = null;
  client = new QueryClient({ defaultOptions: queryClient.getDefaultOptions() }); token = createRoutePreviewIntent(client, place); notifyManager.setScheduler(cb => cb());
  vi.mocked(getCurrentCoordinates).mockImplementation(async () => fix()); vi.mocked(subscribeToLocation).mockResolvedValue({ remove: navigation.remove });
  vi.mocked(requestLocationPermission).mockResolvedValue(permissionGrant);
  vi.mocked(routeService.walking).mockResolvedValue({ encodedPolyline: '??AA', distanceMeters: 100, durationSeconds: 80, warnings: [] });
  const original = console.error; vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => { if (!String(args[0]).startsWith('react-test-renderer is deprecated')) original(...args); });
});
afterEach(async () => { await act(async () => tree?.unmount()); tree = undefined; client.clear(); vi.clearAllTimers(); vi.useRealTimers(); vi.restoreAllMocks(); notifyManager.setScheduler(cb => setTimeout(cb, 0)); });
it('claims once with installed SDK focus hooks before navigation readiness, waits for watcher sample, and cleans up on blur', async () => {
  await act(async () => { tree = create(render()); }); expect(requestLocationPermission).toHaveBeenCalledOnce(); expect(state.location.status).toBe('ready'); expect(routeService.walking).not.toHaveBeenCalled();
  await act(async () => { vi.mocked(subscribeToLocation).mock.calls[0][0](fix()); }); expect(routeService.walking).toHaveBeenCalledOnce(); expect(state.result?.origin).toEqual({ latitude: 11.01, longitude: 124.61 });
  navigation.focused = false; await act(async () => { tree!.update(render()); }); expect(navigation.remove).toHaveBeenCalledOnce();
  navigation.focused = true; await act(async () => { tree!.update(render()); vi.mocked(subscribeToLocation).mock.calls.at(-1)![0](fix()); }); expect(routeService.walking).toHaveBeenCalledOnce();
});
it('bounds full location startup with pending SDK navigation and permits no paid request after deadline', async () => {
  const permission = Promise.withResolvers<Awaited<ReturnType<typeof requestLocationPermission>>>(); vi.mocked(requestLocationPermission).mockReturnValue(permission.promise);
  await act(async () => { tree = create(render()); }); await act(async () => { await vi.advanceTimersByTimeAsync(15000); });
  expect(state.location.errorCode).toBe('timeout'); expect(routeService.walking).not.toHaveBeenCalled();
  await act(async () => { permission.resolve(permissionGrant); }); expect(subscribeToLocation).not.toHaveBeenCalled(); expect(routeService.walking).not.toHaveBeenCalled();
});
it('waits across a permission activity foreground transition, then spends only once on the new owner’s fix', async () => {
  const permission = Promise.withResolvers<Awaited<ReturnType<typeof requestLocationPermission>>>(); vi.mocked(requestLocationPermission).mockReturnValueOnce(permission.promise);
  await act(async () => { tree = create(render()); }); navigation.active = false; await act(async () => { tree!.update(render()); });
  await act(async () => { permission.resolve(permissionGrant); }); expect(subscribeToLocation).not.toHaveBeenCalled();
  navigation.active = true; await act(async () => { tree!.update(render()); }); expect(requestLocationPermission).toHaveBeenLastCalledWith({ prompt: 'never' });
  await act(async () => { vi.mocked(subscribeToLocation).mock.calls[0][0](fix()); }); expect(routeService.walking).toHaveBeenCalledOnce();
});
