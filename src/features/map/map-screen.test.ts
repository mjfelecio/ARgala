import * as React from 'react';
import { QueryClient, QueryClientProvider, notifyManager } from '@tanstack/react-query';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { routeService, type WalkingRoute } from '@/features/directions/service';
import { placesService, type Place } from '@/features/places/service';
import { queryClient } from '@/lib/query';
import MapScreen from './map-screen';

const controls = vi.hoisted(() => ({
  fit: vi.fn(), active: true, focused: true,
  position: { latitude: 38.5, longitude: -120.2 },
}));
vi.mock('expo-constants', () => ({ default: { expoConfig: { extra: { mapsConfigured: true } } } }));
vi.mock('expo-router', () => ({ router: { push: vi.fn() }, useIsFocused: () => controls.focused }));
vi.mock('react-native', () => ({ View: 'view', Text: 'text', ScrollView: 'scroll', StyleSheet: { create: (styles: unknown) => styles } }));
vi.mock('react-native-maps', async () => {
  const { createElement, forwardRef, useImperativeHandle } = await import('react');
  const MapView = forwardRef((props: Record<string, unknown>, ref) => {
    useImperativeHandle(ref, () => ({ fitToCoordinates: controls.fit }));
    return createElement('map', props);
  });
  return { default: MapView, Circle: 'circle', Marker: 'marker', Polyline: 'polyline', PROVIDER_GOOGLE: 'google' };
});
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('@/features/settings/provider', () => ({ useSettings: () => ({ activationRadiusMeters: 100, language: 'en' }) }));
vi.mock('@/features/location/use-device-location', () => ({ useDeviceLocation: () => ({ position: controls.position, accuracy: 8 }) }));
vi.mock('@/features/location/status', () => ({ LocationStatus: () => null }));
vi.mock('@/lib/use-app-active', () => ({ useAppActive: () => controls.active }));
vi.mock('@/features/places/service', () => ({ placesService: { nearby: vi.fn(), details: vi.fn() } }));
vi.mock('@/features/directions/service', () => ({ routeService: { walking: vi.fn() } }));
vi.mock('./attributions', () => ({ ProviderAttributions: () => null, useOpenProviderLink: () => vi.fn() }));
vi.mock('@/ui/shared', async () => {
  const { createElement } = await import('react');
  return { Screen: 'screen', Notice: 'notice', Action: (props: Record<string, unknown>) => createElement('button', props) };
});
const destination: Place = { id: 'google:destination', provider: 'google', providerId: 'destination', name: 'Destination', coordinates: { latitude: 43.252, longitude: -126.453 }, attributions: [] };
const walkingRoute: WalkingRoute = { encodedPolyline: '_p~iF~ps|U_ulLnnqC_mqNvxq`@', distanceMeters: 800000, durationSeconds: 600000, warnings: [] };
const coordinates = [{ latitude: 38.5, longitude: -120.2 }, { latitude: 40.7, longitude: -120.95 }, { latitude: 43.252, longitude: -126.453 }];
let client: QueryClient;
let tree: ReactTestRenderer | undefined;
let request: PromiseWithResolvers<WalkingRoute>;
function renderMap() { return React.createElement(QueryClientProvider, { client }, React.createElement(MapScreen)); }
async function press(title: string) {
  const action = tree!.root.findAllByType('button').find((button) => button.props.title === title);
  expect(action).toBeDefined();
  await act(async () => { action!.props.onPress(); });
}
async function startRoute(laidOut = true) {
  await act(async () => { tree = create(renderMap()); });
  if (laidOut) await act(async () => { tree!.root.findByType('map').props.onLayout({ nativeEvent: { layout: { width: 360, height: 320 } } }); });
  await act(async () => { tree!.root.findByType('map').props.onMapReady(); });
  await press('map.search');
  await act(async () => { tree!.root.findByType('marker').props.onPress(); });
  await press('map.walk');
}
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  controls.fit.mockReset(); controls.active = true; controls.focused = true;
  controls.position = { latitude: 38.5, longitude: -120.2 };
  // Deliver query notifications within act, without depending on timer timing.
  notifyManager.setScheduler((callback) => callback());
  client = new QueryClient({ defaultOptions: queryClient.getDefaultOptions() });
  vi.mocked(placesService.nearby).mockReset().mockResolvedValue([destination]);
  vi.mocked(placesService.details).mockReset().mockResolvedValue(destination);
  request = Promise.withResolvers<WalkingRoute>();
  vi.mocked(routeService.walking).mockReset().mockReturnValue(request.promise);
  const original = console.error;
  vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => { if (!String(args[0]).startsWith('react-test-renderer is deprecated')) original(...args); });
});
afterEach(async () => {
  await act(async () => tree?.unmount()); tree = undefined; client.clear();
  notifyManager.setScheduler((callback) => setTimeout(callback, 0));
  vi.restoreAllMocks();
});
it('fits the loaded walking polyline with padding and keeps the viewport stable on GPS updates', async () => {
  await startRoute();
  expect(controls.fit).not.toHaveBeenCalled();
  expect(routeService.walking).toHaveBeenCalledWith({ origin: { latitude: 38.5, longitude: -120.2 }, destination: destination.coordinates, language: 'en' });
  await act(async () => { request.resolve(walkingRoute); });
  expect(tree!.root.findByType('polyline').props.coordinates).toEqual(coordinates);
  expect(controls.fit).toHaveBeenCalledTimes(1);
  const [fitted, options] = controls.fit.mock.calls[0];
  expect(fitted).toEqual(coordinates);
  expect(options.animated).toBe(true);
  for (const side of ['top', 'right', 'bottom', 'left']) expect(options.edgePadding[side]).toBeGreaterThanOrEqual(32);
  controls.position = { latitude: 38.501, longitude: -120.201 };
  await act(async () => { tree!.update(renderMap()); });
  expect(controls.fit).toHaveBeenCalledTimes(1);
});
it('does not update the viewport when a walking request fails', async () => {
  await startRoute();
  await act(async () => { request.reject(new Error('Route unavailable')); });
  expect(tree!.root.findAllByType('polyline')).toHaveLength(0);
  expect(controls.fit).not.toHaveBeenCalled();
});
it('defers fitting an in-flight result until the map regains focus', async () => {
  await startRoute();
  controls.focused = false;
  await act(async () => { tree!.update(renderMap()); });
  await act(async () => { request.resolve(walkingRoute); });
  expect(controls.fit).not.toHaveBeenCalled();
  controls.focused = true;
  await act(async () => { tree!.update(renderMap()); });
  expect(controls.fit).toHaveBeenCalledWith(coordinates, expect.any(Object));
});
it('waits for a nonzero Android map layout before fitting a loaded route', async () => {
  await startRoute(false);
  await act(async () => { request.resolve(walkingRoute); });
  expect(controls.fit).not.toHaveBeenCalled();
  await act(async () => { tree!.root.findByType('map').props.onLayout({ nativeEvent: { layout: { width: 360, height: 0 } } }); });
  expect(controls.fit).not.toHaveBeenCalled();
  await act(async () => { tree!.root.findByType('map').props.onLayout({ nativeEvent: { layout: { width: 360, height: 320 } } }); });
  expect(controls.fit).toHaveBeenCalledWith(coordinates, expect.any(Object));
});
it.each(['focused', 'active'] as const)('does not repeat paid queries after %s changes or location-driven remounts', async (lifecycle) => {
  await startRoute();
  await act(async () => { request.resolve(walkingRoute); });
  for (let navigation = 0; navigation < 2; navigation++) {
    controls[lifecycle] = false;
    await act(async () => { tree!.update(renderMap()); });
    controls[lifecycle] = true;
    await act(async () => { tree!.update(renderMap()); });
  }
  expect(placesService.nearby).toHaveBeenCalledTimes(1);
  expect(placesService.details).toHaveBeenCalledTimes(1);
  expect(routeService.walking).toHaveBeenCalledTimes(1);
  await act(async () => { tree!.unmount(); });
  // Location restarts can remove the map observer; production immediately discards unused data.
  await new Promise((resolve) => setTimeout(resolve, 0));
  controls.position = { latitude: 38.51, longitude: -120.21 };
  await act(async () => { tree = create(renderMap()); });
  await act(async () => { tree!.root.findByType('map').props.onMapReady(); });
  expect(placesService.nearby).toHaveBeenCalledTimes(1);
  expect(placesService.details).toHaveBeenCalledTimes(1);
  expect(routeService.walking).toHaveBeenCalledTimes(1);
  await press('map.search');
  expect(placesService.nearby).toHaveBeenCalledTimes(2);
  expect(placesService.nearby).toHaveBeenLastCalledWith({ center: { latitude: 38.51, longitude: -120.21 }, radiusMeters: 1000, language: 'en' });
});
it('requests nearby results only on Search, including repeated searches at the same coordinates', async () => {
  await act(async () => { tree = create(renderMap()); });
  await act(async () => { tree!.root.findByType('map').props.onMapReady(); });
  expect(placesService.nearby).not.toHaveBeenCalled();
  await press('map.search');
  expect(tree!.root.findAllByType('marker')).toHaveLength(1);
  await press('map.search');
  expect(placesService.nearby).toHaveBeenCalledTimes(2);
  controls.position = { latitude: 38.52, longitude: -120.22 };
  await act(async () => { tree!.update(renderMap()); });
  expect(placesService.nearby).toHaveBeenCalledTimes(2);
  await press('map.search');
  expect(placesService.nearby).toHaveBeenCalledTimes(3);
  expect(placesService.nearby).toHaveBeenLastCalledWith({ center: { latitude: 38.52, longitude: -120.22 }, radiusMeters: 1000, language: 'en' });
});
it('does not retry a failed nearby request on refocus and allows an explicit Search retry', async () => {
  vi.mocked(placesService.nearby).mockRejectedValueOnce(new Error('Nearby unavailable'));
  await act(async () => { tree = create(renderMap()); });
  await act(async () => { tree!.root.findByType('map').props.onMapReady(); });
  await press('map.search');
  controls.focused = false;
  await act(async () => { tree!.update(renderMap()); });
  controls.focused = true;
  await act(async () => { tree!.update(renderMap()); });
  expect(placesService.nearby).toHaveBeenCalledTimes(1);
  await press('map.search');
  expect(placesService.nearby).toHaveBeenCalledTimes(2);
  expect(tree!.root.findAllByType('marker')).toHaveLength(1);
});
