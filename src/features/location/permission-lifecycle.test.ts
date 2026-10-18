import * as React from 'react';
import { createInstance } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import * as ExpoLocation from 'expo-location';
import { localizationOptions } from '@/i18n/options';
import { requestLocationPermission } from './service';
import { LocationStatus } from './status';
import { useDeviceLocation } from './use-device-location';

const native = vi.hoisted(() => ({
  active: true, listeners: new Set<() => void>(), remove: vi.fn(),
}));
vi.mock('expo-location', () => ({
  Accuracy: { High: 4 }, getForegroundPermissionsAsync: vi.fn(), requestForegroundPermissionsAsync: vi.fn(),
  hasServicesEnabledAsync: vi.fn(async () => true), getCurrentPositionAsync: vi.fn(),
  watchPositionAsync: vi.fn(async () => ({ remove: native.remove })), watchHeadingAsync: vi.fn(),
}));
vi.mock('expo-router', () => ({ useIsFocused: () => true }));
vi.mock('react-native', () => ({ Text: 'text', Alert: { alert: vi.fn() }, Linking: { openSettings: vi.fn() }, AppState: {
  get currentState() { return native.active ? 'active' : 'background'; },
  addEventListener: (_event: string, listener: () => void) => {
    native.listeners.add(listener); return { remove: () => native.listeners.delete(listener) };
  },
} }));
vi.mock('@/ui/shared', async () => {
  const { createElement } = await import('react');
  return { Notice: 'output', Action: (props: Record<string, unknown>) => createElement('button', props) };
});
type Permission = Awaited<ReturnType<typeof ExpoLocation.getForegroundPermissionsAsync>>;
const response = (status: 'granted' | 'denied' | 'undetermined', canAskAgain = true) => ({
  granted: status === 'granted', status, canAskAgain, expires: 'never',
}) as Permission;
const fix: Awaited<ReturnType<typeof ExpoLocation.getCurrentPositionAsync>> = {
  coords: { latitude: 11, longitude: 124, accuracy: 8, altitude: null, altitudeAccuracy: null, heading: null, speed: null }, timestamp: 1,
};
let permission: Permission;
let tree: ReactTestRenderer | undefined;
let pending: PromiseWithResolvers<Permission>;
function Probe() { return React.createElement(LocationStatus, { location: useDeviceLocation() }); }
const location = () => tree!.root.findByType(LocationStatus).props.location as ReturnType<typeof useDeviceLocation>;
function setActive(active: boolean) { native.active = active; native.listeners.forEach((listener) => listener()); }
async function mount() {
  const i18n = createInstance();
  await i18n.use(initReactI18next).init({ ...localizationOptions, lng: 'en', react: { useSuspense: false } });
  await act(async () => { tree = create(React.createElement(I18nextProvider, { i18n }, React.createElement(Probe))); });
}
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true, __DEV__: false });
  vi.useFakeTimers(); native.active = true; native.listeners.clear(); native.remove.mockClear();
  permission = response('granted'); pending = Promise.withResolvers<Permission>();
  vi.mocked(ExpoLocation.getForegroundPermissionsAsync).mockReset().mockImplementation(async () => permission);
  vi.mocked(ExpoLocation.requestForegroundPermissionsAsync).mockReset().mockImplementation(async () => permission);
  vi.mocked(ExpoLocation.getCurrentPositionAsync).mockReset().mockResolvedValue(fix);
  vi.mocked(ExpoLocation.watchPositionAsync).mockClear();
  const original = console.error;
  vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    if (!String(args[0]).startsWith('react-test-renderer is deprecated')) original(...args);
  });
});
afterEach(async () => {
  await act(async () => { tree?.unmount(); pending.resolve(permission); }); tree = undefined;
  vi.clearAllTimers(); vi.useRealTimers(); vi.restoreAllMocks();
});

it('starts GPS with an existing grant without opening an Android permission activity', async () => {
  // Expo's Android request path delegates to Activity.requestPermissions even for an existing grant.
  vi.mocked(ExpoLocation.requestForegroundPermissionsAsync).mockImplementation(() => { setActive(false); return pending.promise; });
  await mount();
  expect(location().status).toBe('ready');
  expect(ExpoLocation.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
});

it('shares a pending permission activity across foreground owner replacements', async () => {
  permission = response('undetermined');
  vi.mocked(ExpoLocation.requestForegroundPermissionsAsync).mockImplementation(() => { setActive(false); return pending.promise; });
  await mount();
  for (let count = 0; count < 3; count++) {
    await act(async () => { setActive(true); });
    if (count < 2) await act(async () => { setActive(false); });
  }
  expect(ExpoLocation.requestForegroundPermissionsAsync).toHaveBeenCalledOnce();
  expect(ExpoLocation.watchPositionAsync).not.toHaveBeenCalled();
  await act(async () => { permission = response('granted'); pending.resolve(permission); });
  expect(location().status).toBe('ready');
  expect(ExpoLocation.watchPositionAsync).toHaveBeenCalledOnce();
});

it('does not reprompt after denial on resume and permits an explicit Retry', async () => {
  permission = response('undetermined');
  vi.mocked(ExpoLocation.requestForegroundPermissionsAsync).mockImplementationOnce(() => { setActive(false); return pending.promise; });
  await mount();
  await act(async () => { permission = response('denied'); pending.resolve(permission); });
  await act(async () => { setActive(true); });
  expect(location().status).toBe('denied');
  expect(ExpoLocation.requestForegroundPermissionsAsync).toHaveBeenCalledOnce();
  vi.mocked(ExpoLocation.requestForegroundPermissionsAsync).mockImplementation(async () => { permission = response('granted'); return permission; });
  await act(async () => { location().retry(); });
  expect(ExpoLocation.requestForegroundPermissionsAsync).toHaveBeenCalledTimes(2);
  expect(location().status).toBe('ready');
});

it('does not reopen the permission activity on resume after an explicitly retried denial', async () => {
  permission = response('denied');
  await mount();
  expect(ExpoLocation.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
  vi.mocked(ExpoLocation.requestForegroundPermissionsAsync).mockImplementation(() => { setActive(false); return pending.promise; });
  await act(async () => { location().retry(); });
  const requestCount = vi.mocked(ExpoLocation.requestForegroundPermissionsAsync).mock.calls.length;
  await act(async () => { pending.resolve(permission); });
  await act(async () => { setActive(true); });
  expect(ExpoLocation.requestForegroundPermissionsAsync).toHaveBeenCalledTimes(requestCount);
  expect(location().status).toBe('denied');
});

it('shows permanent denial with Settings instead of submitting another native request', async () => {
  permission = response('denied', false);
  await mount();
  expect(location().status).toBe('denied');
  expect(location().canAskAgain).toBe(false);
  expect(ExpoLocation.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
  expect(tree!.root.findAllByType('button').some((button) => button.props.title === 'Open device settings')).toBe(true);
});

it('rereads permission after foreground return and stops GPS when a grant is revoked', async () => {
  await mount();
  expect(location().status).toBe('ready');
  await act(async () => { setActive(false); });
  expect(native.remove).toHaveBeenCalledOnce();
  permission = response('denied', false);
  await act(async () => { setActive(true); });
  expect(location().status).toBe('denied');
  expect(ExpoLocation.watchPositionAsync).toHaveBeenCalledOnce();
  expect(ExpoLocation.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
});

it('coalesces permission work across simultaneous consumers without retaining a resolved grant', async () => {
  permission = response('undetermined');
  vi.mocked(ExpoLocation.requestForegroundPermissionsAsync).mockReturnValue(pending.promise);
  const first = requestLocationPermission(); const second = requestLocationPermission();
  await Promise.resolve();
  expect(ExpoLocation.requestForegroundPermissionsAsync).toHaveBeenCalledOnce();
  permission = response('granted'); pending.resolve(permission);
  expect(await first).toEqual(permission); expect(await second).toEqual(permission);
  permission = response('denied', false);
  expect(await requestLocationPermission()).toEqual(permission);
});

it('times out a stalled permission activity without queueing another request on Retry', async () => {
  permission = response('undetermined');
  vi.mocked(ExpoLocation.requestForegroundPermissionsAsync).mockImplementation(() => { setActive(false); return pending.promise; });
  await mount();
  await act(async () => { setActive(true); });
  await act(async () => { await vi.advanceTimersByTimeAsync(15000); });
  expect(location().errorCode).toBe('timeout');
  expect(ExpoLocation.requestForegroundPermissionsAsync).toHaveBeenCalledOnce();
  await act(async () => { location().retry(); });
  expect(ExpoLocation.requestForegroundPermissionsAsync).toHaveBeenCalledOnce();
  await act(async () => { permission = response('granted'); pending.resolve(permission); });
  expect(location().status).toBe('ready');
  expect(ExpoLocation.watchPositionAsync).toHaveBeenCalledOnce();
});

it('localizes a permission read failure and recovers on Retry without retaining its rejected operation', async () => {
  vi.mocked(ExpoLocation.getForegroundPermissionsAsync).mockRejectedValueOnce(new Error('native English details'));
  await mount();
  expect(location().status).toBe('error');
  expect(tree!.root.findByType('output').props.children).toBe('Location is unavailable.');
  await act(async () => { location().retry(); });
  expect(location().status).toBe('ready');
  expect(ExpoLocation.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
});

it('honors Retry while a foreground permission read is still pending after its deadline', async () => {
  await mount();
  await act(async () => { setActive(false); });
  permission = response('denied');
  vi.mocked(ExpoLocation.getForegroundPermissionsAsync).mockReturnValueOnce(pending.promise);
  await act(async () => { setActive(true); });
  await act(async () => { await vi.advanceTimersByTimeAsync(15000); });
  expect(location().errorCode).toBe('timeout');
  vi.mocked(ExpoLocation.requestForegroundPermissionsAsync).mockImplementation(async () => {
    permission = response('granted'); return permission;
  });
  await act(async () => { location().retry(); });
  await act(async () => { pending.resolve(response('denied')); });
  expect(ExpoLocation.requestForegroundPermissionsAsync).toHaveBeenCalledOnce();
  expect(location().status).toBe('ready');
});

it('allows the AR owner to receive stationary GPS updates while preserving the map movement threshold', async () => {
  await mount();
  expect(ExpoLocation.watchPositionAsync).toHaveBeenLastCalledWith(expect.objectContaining({ distanceInterval: 5 }), expect.any(Function), expect.any(Function));
  await act(async () => { tree!.unmount(); });
  function ArProbe() { useDeviceLocation({ heading: true, distanceIntervalMeters: 0 }); return null; }
  await act(async () => { tree = create(React.createElement(ArProbe)); });
  expect(ExpoLocation.watchPositionAsync).toHaveBeenLastCalledWith(expect.objectContaining({ distanceInterval: 0, timeInterval: 3000 }), expect.any(Function), expect.any(Function));
});
