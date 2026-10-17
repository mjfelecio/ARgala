import * as React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { getCurrentCoordinates, subscribeToLocation } from './service';
import { useDeviceLocation } from './use-device-location';

vi.mock('./service', () => ({
  requestLocationPermission: vi.fn(async () => ({ granted: true, canAskAgain: true })),
  isLocationEnabled: vi.fn(async () => true),
  getCurrentCoordinates: vi.fn(), subscribeToLocation: vi.fn(), subscribeToHeading: vi.fn(),
}));
vi.mock('@/lib/use-app-active', () => ({ useAppActive: () => true }));
vi.mock('expo-router', async () => {
  const { useEffect } = await import('react');
  return { useFocusEffect: (callback: () => void) => useEffect(callback, [callback]) };
});
type Position = Awaited<ReturnType<typeof getCurrentCoordinates>>;
const fix: Position = { coords: { latitude: 11.01, longitude: 124.61, accuracy: 8, altitude: null, altitudeAccuracy: null, heading: null, speed: null }, timestamp: 1 };
let current: ReturnType<typeof useDeviceLocation>;
let tree: ReactTestRenderer | undefined;
let oneShot: PromiseWithResolvers<Position>;
let watch: PromiseWithResolvers<{ remove: () => void }>;
function Probe() {
  const location = useDeviceLocation();
  React.useEffect(() => { current = location; }, [location]);
  return null;
}
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  oneShot = Promise.withResolvers<Position>(); watch = Promise.withResolvers<{ remove: () => void }>();
  vi.mocked(getCurrentCoordinates).mockReset().mockReturnValue(oneShot.promise);
  vi.mocked(subscribeToLocation).mockReset().mockReturnValue(watch.promise);
  const original = console.error;
  vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => { if (!String(args[0]).startsWith('react-test-renderer is deprecated')) original(...args); });
});
afterEach(async () => { await act(async () => tree?.unmount()); tree = undefined; vi.restoreAllMocks(); });

it.each(['callback', 'setup rejection'] as const)('keeps a watcher %s failure visible after a later successful one-shot fix', async (failure) => {
  await act(async () => { tree = create(React.createElement(Probe)); });
  await act(async () => {
    if (failure === 'callback') vi.mocked(subscribeToLocation).mock.calls[0][1]('GPS watcher stopped');
    else watch.reject(new Error('GPS watcher stopped'));
  });
  expect(current.status).toBe('error');
  await act(async () => { oneShot.resolve(fix); });
  expect(current.position).toEqual({ latitude: 11.01, longitude: 124.61 });
  expect(current.accuracy).toBe(8);
  expect(current.status).toBe('error');
  expect(current.error).toBe('GPS watcher stopped');
  expect(current.watcherStatus).toBe('error');
});

it('recovers watcher health only when continuous updates actually resume', async () => {
  await act(async () => { tree = create(React.createElement(Probe)); });
  const [receive, fail] = vi.mocked(subscribeToLocation).mock.calls[0];
  await act(async () => { fail('GPS watcher stopped'); oneShot.resolve(fix); });
  // Completing setup alone must not erase an error already delivered by that watcher.
  await act(async () => { watch.resolve({ remove: vi.fn() }); });
  expect(current.status).toBe('error');
  expect(current.watcherStatus).toBe('error');
  await act(async () => { receive(fix); });
  expect(current.status).toBe('ready');
  expect(current.watcherStatus).toBe('ready');
  expect(current.error).toBeNull();
});

it('preserves a watcher failure when the one-shot request also fails', async () => {
  await act(async () => { tree = create(React.createElement(Probe)); });
  await act(async () => { vi.mocked(subscribeToLocation).mock.calls[0][1]('GPS watcher stopped'); });
  await act(async () => { oneShot.reject(new Error('One-shot timed out')); });
  expect(current.error).toBe('GPS watcher stopped');
  expect(current.status).toBe('error');
});
