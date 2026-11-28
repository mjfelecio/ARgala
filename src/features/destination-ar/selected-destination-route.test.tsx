import * as React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { createInstance } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { withHeroUI } from '@/test/native-ui';
import { localizationOptions } from '@/i18n/options';
import { useDeviceLocation } from '@/features/location/use-device-location';
import { syntheticApprovedDestination, syntheticArrivalPoint, syntheticFeaturedGeofence } from '@/features/destinations/ar-geofence-fixtures';
import { getDestination } from '@/features/destinations/catalog';
import { getBundledArGeofence } from '@/features/destinations/ar-geofences';
import { router } from 'expo-router';
import { AdmissionContext } from './admission-context';
import { ArAdmissionStore } from './admission-store';
import SelectedDestinationArRoute from './selected-destination-route';
import { loadDraftRingContent } from './draft-content-loader';
import { loadExhibitScene } from './exhibit-loader';
import { loadRingScene } from './ring-loader';
import { EXHIBIT_HISTORY_ID, EXHIBIT_GUIDE_IDS, type RingContent } from './ring-content';
const control = vi.hoisted(() => ({ params: {} as Record<string, unknown>, active: true, sample: null as { position: { latitude: number; longitude: number }; timestamp: number; accuracy: number } | null }));
vi.mock('expo-router', () => ({ useLocalSearchParams: () => control.params, useIsFocused: () => true, router: { dismissTo: vi.fn(), navigate: vi.fn() } }));
vi.mock('@/lib/use-app-active', () => ({ useAppActive: () => control.active }));
vi.mock('@/features/settings/provider', () => ({ useSettings: () => ({ language: 'en' }) }));
vi.mock('@/features/location/use-device-location', () => ({ useDeviceLocation: vi.fn(() => ({ phase: 'position', status: 'ready', watcherStatus: 'ready', watcherSample: control.sample, position: control.sample?.position ?? null, accuracy: 5, retry: vi.fn() })) }));
vi.mock('./session-experience', async () => { const R = await import('react'); return { DestinationArSessionExperience: (props: Record<string, unknown>) => R.createElement('ar-experience', props) }; });
vi.mock('./exhibit-loader', () => ({ loadExhibitScene: vi.fn(async () => () => null) }));
vi.mock('./ring-loader', () => ({ loadRingScene: vi.fn(async () => () => null) }));
vi.mock('./draft-content-loader', () => ({ loadDraftRingContent: vi.fn(async () => [{ id: 'overview', role: 'overview', titleKey: 'destinationRing.mock.overview.title', bodyKey: 'destinationRing.mock.overview.body' }]) }));
let store: ArAdmissionStore; let tree: ReactTestRenderer | undefined; let render: () => React.ReactElement;
beforeEach(async () => {
 Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true, __DEV__: true }); vi.stubEnv('EXPO_PUBLIC_VIRO_SPIKE', '1'); vi.spyOn(Date, 'now').mockReturnValue(10000); vi.clearAllMocks();
 control.params = {}; control.sample = null; control.active = true; store = new ArAdmissionStore('owner');
 const translations = createInstance(); await translations.use(initReactI18next).init({ ...localizationOptions, lng: 'en', react: { useSuspense: false } });
 render = () => <React.StrictMode><AdmissionContext.Provider value={store}><I18nextProvider i18n={translations}>{withHeroUI(<SelectedDestinationArRoute />)}</I18nextProvider></AdmissionContext.Provider></React.StrictMode>;
 const original = console.error; vi.spyOn(console, 'error').mockImplementation((...args) => { if (!String(args[0]).startsWith('react-test-renderer is deprecated')) original(...args); });
});
afterEach(async () => { await act(async () => tree?.unmount()); tree = undefined; store.close(); vi.restoreAllMocks(); vi.unstubAllEnvs(); });
function entry() {
 store.select('pilot-aclc'); const lease = store.acquire('pilot-aclc')!;
 for (const time of [10000, 13000, 16000]) { vi.mocked(Date.now).mockReturnValue(time); store.publish(lease, { running: true, watcherStatus: 'ready', sample: { timestamp: time, accuracy: 5, position: getDestination('pilot-aclc')!.center! } }); }
 const entryToken = store.begin(lease, 'pilot-aclc', 'draft', 'en'); store.release(lease);
 control.params = { destinationId: 'pilot-aclc', entryToken }; return entryToken;
}
it.each([{}, { destinationId: 'pilot-aclc', entryToken: 'fake' }, { destinationId: '../pilot-aclc', entryToken: 'fake' }])('does no native/location/draft loading for dead links %j', async params => {
 control.params = params; await act(async () => { tree = create(render()); });
 expect(useDeviceLocation).not.toHaveBeenCalled(); expect(loadDraftRingContent).not.toHaveBeenCalled();
});
it('requires new route-owned readings, stops GPS at establishment, and returns to retained selection', async () => {
 const token = entry(); await act(async () => { tree = create(render()); });
 let scene = tree!.root.findByType('ar-experience' as React.ElementType); expect(scene.props.entryReady).toBe(false); expect(scene.props.freshEligible()).toBe(false);
 for (const time of [19000, 22000, 25000]) {
  vi.mocked(Date.now).mockReturnValue(time); control.sample = { timestamp: time, accuracy: 5, position: getDestination('pilot-aclc')!.center! };
  await act(async () => tree!.update(render()));
 }
 scene = tree!.root.findByType('ar-experience' as React.ElementType); expect(scene.props.entryReady).toBe(true); expect(scene.props.freshEligible()).toBe(true);
 await act(async () => scene.props.onEstablished()); expect(vi.mocked(useDeviceLocation).mock.calls.at(-1)![0]?.enabled).toBe(false);
 await act(async () => { scene.props.onExit(); scene.props.onReturn(); });
 expect(store.take(token, 'pilot-aclc')).toBeNull(); expect(scene.props.freshEligible()).toBe(false);
 expect(router.dismissTo).toHaveBeenCalledWith({ pathname: '/', params: { featuredDestinationId: 'pilot-aclc' } });
});
it('rejects development admission in release even with the public flag and a previously valid handle', async () => {
 entry(); Object.assign(globalThis, { __DEV__: false }); await act(async () => { tree = create(render()); });
 expect(useDeviceLocation).not.toHaveBeenCalled(); expect(loadDraftRingContent).not.toHaveBeenCalled();
});
it('labels simulated entry and never enables a route GPS owner for it', async () => {
 store.select('pilot-aclc'); const lease = store.acquire('pilot-aclc')!;
 store.publish(lease, { running: true, watcherStatus: 'pending', sample: null });
 const entryToken = store.beginSimulation(lease, 'pilot-aclc', 'draft', 'en'); store.release(lease);
 control.params = { destinationId: 'pilot-aclc', entryToken };
 await act(async () => { tree = create(render()); });
 const scene = tree!.root.findByType('ar-experience' as React.ElementType);
 expect(scene.props.entryReady).toBe(true); expect(scene.props.identity.provenance).toBe('development');
 expect(scene.props.developmentNoticeKey).toBe('arrival.simulatedLive');
 expect(vi.mocked(useDeviceLocation).mock.calls.every(call => call[0]?.enabled === false)).toBe(true);
});
it('keeps even legacy approved trial content behind the diagnostic guards', async () => {
 const catalog = await import('@/features/destinations/catalog'); const pilot = catalog.getDestination('pilot-aclc')!;
 const approved = (value: string) => ({ value, approvalReference: 'synthetic test approval' });
 const media = { id: 'synthetic-route-photo', source: 1, credit: 'Synthetic credit', rightsReference: 'test', approvalReference: 'test', alt: { en: approved('Synthetic photo') } };
 const fixture = catalog.destinationSchema.parse({ ...pilot, media: [media, { ...media, id: 'unbound', source: 2 }], ar: { ...pilot.ar, tiles: [{ id: 'overview', role: 'overview', title: { en: approved('Approved title') }, body: { en: approved('Approved body') }, mediaIds: [media.id] }] } });
 store.setContentResolver(id => id === 'pilot-aclc' ? fixture : null);
 Object.assign(globalThis, { __DEV__: false }); store.select('pilot-aclc'); const lease = store.acquire('pilot-aclc')!;
 for (const time of [10000, 13000, 16000]) { vi.mocked(Date.now).mockReturnValue(time); store.publish(lease, { running: true, watcherStatus: 'ready', sample: { timestamp: time, accuracy: 5, position: fixture.center! } }); }
 const entryToken = store.begin(lease, 'pilot-aclc', 'approved', 'en');
 expect(entryToken).toBeNull();
 store.release(lease); control.params = { destinationId: 'pilot-aclc', entryToken };
 await act(async () => { tree = create(render()); });
 expect(tree!.root.findAllByType('ar-experience' as React.ElementType)).toHaveLength(0);
 expect(useDeviceLocation).not.toHaveBeenCalled();
 expect(loadDraftRingContent).not.toHaveBeenCalled();
});

it('keeps the featured exhibit path behind real content and geographic authorization in release', async () => {
 Object.assign(globalThis, { __DEV__: false }); vi.stubEnv('EXPO_PUBLIC_VIRO_SPIKE', '');
 const fixture = syntheticApprovedDestination();
 store = new ArAdmissionStore('owner', id => id === 'D01' ? fixture : null, syntheticFeaturedGeofence);
 store.select('D01'); const lease = store.acquire('D01')!;
 expect(store.begin(lease, 'D01', 'approved', 'en')).toBeNull();
 for (const time of [10000, 13000, 16000]) { vi.mocked(Date.now).mockReturnValue(time); store.publish(lease, { running: true, watcherStatus: 'ready', sample: { timestamp: time, accuracy: 5, position: syntheticArrivalPoint } }); }
 const entryToken = store.begin(lease, 'D01', 'approved', 'en'); expect(entryToken).toBeTypeOf('string'); store.release(lease);
 control.params = { destinationId: 'D01', entryToken };
 await act(async () => { tree = create(render()); });
 let scene = tree!.root.findByType('ar-experience' as React.ElementType);
 expect(scene.props.entryReady).toBe(false); expect(scene.props.freshEligible()).toBe(false);
 const authorized = fixture.media!.slice(0, 2).map(photo => photo.id);
 expect(scene.props.galleryMediaIds).toEqual(authorized);
 expect(scene.props.content[0].approved.media.map((photo: { id: string }) => photo.id)).toEqual(authorized);
 const panels: readonly RingContent[] = scene.props.content;
 expect(panels.map(panel => panel.id)).toEqual(['overview', ...Object.values(EXHIBIT_GUIDE_IDS), EXHIBIT_HISTORY_ID]);
 expect(panels.find(panel => panel.id === EXHIBIT_GUIDE_IDS.arrival)?.approved?.body.en?.value).toContain(fixture.visitorGuide!.en.value.arrival);
 const loader = scene.props.sceneLoader;
 await loader(); expect(loadExhibitScene).toHaveBeenLastCalledWith('D01', authorized); expect(loadRingScene).not.toHaveBeenCalled();
 for (const time of [19000, 22000, 25000]) {
  vi.mocked(Date.now).mockReturnValue(time); control.sample = { timestamp: time, accuracy: 5, position: syntheticArrivalPoint };
  await act(async () => tree!.update(render()));
 }
 scene = tree!.root.findByType('ar-experience' as React.ElementType);
 expect(scene.props.entryReady).toBe(true); expect(scene.props.freshEligible()).toBe(true); expect(scene.props.sceneLoader).toBe(loader);
 expect(scene.props.galleryMediaIds).toEqual(authorized);
});
it('admits the bundled ACLC school exhibit through its polygon and revalidates in the route', async () => {
 Object.assign(globalThis, { __DEV__: false }); vi.stubEnv('EXPO_PUBLIC_VIRO_SPIKE', '');
 const fence = getBundledArGeofence('D10')!;
 expect(fence.geometry.type).toBe('Polygon');
 if (fence.geometry.type !== 'Polygon') return;
 const [longitude, latitude] = fence.geometry.coordinates[0][0];
 const position = { longitude, latitude };
 store.select('D10'); const lease = store.acquire('D10')!;
 expect(store.begin(lease, 'D10', 'approved', 'en')).toBeNull();
 for (const timestamp of [10000, 13000]) {
  vi.mocked(Date.now).mockReturnValue(timestamp);
  store.publish(lease, { running: true, watcherStatus: 'ready', sample: { position, timestamp, accuracy: 5 } });
 }
 const entryToken = store.begin(lease, 'D10', 'approved', 'en');
 expect(entryToken).toBeTypeOf('string');
 store.release(lease);
 control.params = { destinationId: 'D10', entryToken };
 await act(async () => { tree = create(render()); });
 const scene = tree!.root.findByType('ar-experience' as React.ElementType);
 expect(scene.props.identity).toMatchObject({ provenance: 'verified', destinationId: 'D10' });
 expect(scene.props.entryReady).toBe(false);
 const expectedGallery = ['D10-cover', 'D10-courtyard', 'D10-entrance', 'D10-ched-visit', 'D10-proofpass', 'D10-tourism-team', 'D10-leadership-summit', 'D10-school-seal', 'D10-archive-2014', 'D10-stem-congress-2026'];
 expect(scene.props.galleryMediaIds).toEqual(expectedGallery);
 expect(scene.props.content.find((item: RingContent) => item.id === 'overview').approved.media.map((photo: { id: string }) => photo.id)).toEqual(['D10-archive-2014']);
 await scene.props.sceneLoader();
 expect(loadExhibitScene).toHaveBeenCalledWith('D10', expectedGallery);
 expect(loadRingScene).not.toHaveBeenCalled();
 for (const timestamp of [16000, 19000]) {
  vi.mocked(Date.now).mockReturnValue(timestamp);
  control.sample = { position, timestamp, accuracy: 5 };
  await act(async () => tree!.update(render()));
 }
 expect(scene.props.freshEligible()).toBe(true);
});
