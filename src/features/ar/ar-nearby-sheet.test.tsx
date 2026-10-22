import { nativeUi, withHeroUI } from '@/test/native-ui';
import * as React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { createInstance, type i18n } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useSharedValue } from 'react-native-reanimated';
import { localizationOptions } from '@/i18n/options';
import { ArNearbySheet, type ArNearbySheetProps } from './ar-nearby-sheet';
const place = { id: 'google:a', providerId: 'a', provider: 'google' as const, name: '실제 장소 とても長い名前', address: 'Provider Street',
  coordinates: { latitude: 0, longitude: 0 }, attributions: [] };
let tree: ReactTestRenderer | undefined; let translations: i18n;
let props: Omit<ArNearbySheetProps, 'position'>;
function Harness() { const position = useSharedValue(0); return <ArNearbySheet {...props} position={position} />; }
const render = () => <I18nextProvider i18n={translations}>{withHeroUI(<Harness />)}</I18nextProvider>;
async function update() { await act(async () => { tree!.update(render()); }); }
async function press(key: string) {
  const button = tree!.root.findAllByType('button').find(b => b.props.accessibilityLabel === translations.t(key));
  expect(button).toBeDefined(); await act(async () => { button!.props.onPress(); });
}
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true, __DEV__: false });
  nativeUi.mutableValueWrites.length = 0;
  translations = createInstance(); await translations.use(initReactI18next).init({ ...localizationOptions, lng: 'en' });
  props = { rows: [{ place, distance: 12 }], selected: null, distance: undefined, state: 'results', status: <span>sensor fallback</span>,
    running: true, height: 640, fontScale: 1, selectionRevision: 0, detailsLoaded: false, detailsBusy: false,
    onSelect: vi.fn(), onMore: vi.fn(), onDetails: vi.fn(), onDirections: vi.fn(), onMap: vi.fn(), onOccupation: vi.fn() };
  await act(async () => { tree = create(render()); });
});
afterEach(async () => { await act(async () => tree?.unmount()); tree = undefined; nativeUi.sheetReady = true; });
it('starts compact, supports explicit and gesture expansion, and selects by unchanged provider ID', async () => {
  let sheet = tree!.root.findByType('dialog');
  expect(sheet.props.snapPoints[0]).toBeLessThan(640 * 0.4);
  expect(sheet.props.enableDynamicSizing).toBe(false);
  expect(tree!.root.findByType('header').props.accessible).toBe(false);
  await press('ar.expand');
  const row = tree!.root.findByProps({ testID: 'ar-list-a' }); await act(async () => { row.props.onPress(); });
  expect(props.onSelect).toHaveBeenCalledWith('a');
  props = { ...props, selected: place, distance: 12, selectionRevision: 1 }; await update();
  expect(JSON.stringify(tree!.toJSON())).toContain('Provider Street');
  expect(JSON.stringify(tree!.toJSON())).toContain('12 m away');
  await press('placeDetails.view'); expect(props.onDetails).toHaveBeenCalledOnce();
  await press('ar.directions'); expect(props.onDirections).toHaveBeenCalledOnce();
  await press('ar.more'); expect(props.onMore).toHaveBeenCalledOnce();
  await press('ar.collapse');
  sheet = tree!.root.findByType('dialog'); await act(async () => { sheet.props.onChange(1, 180); });
  expect(tree!.root.findAllByType('button').some(b => b.props.accessibilityLabel === translations.t('ar.collapse'))).toBe(true);
});
it('retains expansion through viewport resize, caps snaps and permits reselecting the same collapsed place', async () => {
  props = { ...props, selected: place, selectionRevision: 1 }; await update(); await press('ar.collapse');
  props = { ...props, selectionRevision: 2 }; await update();
  expect(tree!.root.findAllByType('button').some(b => b.props.accessibilityState?.expanded)).toBe(true);
  props = { ...props, height: 180, fontScale: 1.5 }; await update();
  expect(tree!.root.findByType('dialog').props.snapPoints.every((n: number) => n <= 180)).toBe(true);
  expect(props.onOccupation).toHaveBeenLastCalledWith(180);
});
it('keeps fallback list and unknown-distance copy without inventing missing place fields', async () => {
  props = { ...props, selected: { ...place, address: undefined }, rows: [{ place, distance: undefined }] }; await update();
  expect(JSON.stringify(tree!.toJSON())).toContain(translations.t('ar.distanceUnknown'));
  expect(JSON.stringify(tree!.toJSON())).toContain('sensor fallback');
  expect(JSON.stringify(tree!.toJSON())).not.toMatch(/5 min|rating|Historic Landmark/);
  props = { ...props, detailsLoaded: true }; await update();
  expect(tree!.root.findAllByType('button').some(b => b.props.accessibilityLabel === translations.t('ar.more'))).toBe(false);
});

it('retains a cached selection expansion when viewport measurement precedes native readiness', async () => {
  await act(async () => { tree!.unmount(); });
  nativeUi.sheetReady = false;
  props = { ...props, selected: place, height: 0, selectionRevision: 1 };
  await act(async () => { tree = create(render()); });
  props = { ...props, height: 640 }; await update();
  nativeUi.sheetReady = true; await update();
  expect(tree!.root.findByType('dialog').props.nativeIndex.get()).toBe(1);
  await press('ar.collapse');
  expect(tree!.root.findByType('dialog').props.nativeIndex.get()).toBe(0);
});
it('restores the expanded preference after a one-detent viewport and keeps manual collapse stable', async () => {
  props = { ...props, selected: place, selectionRevision: 1 }; await update();
  props = { ...props, height: 180 }; await update();
  // A native clamping callback reflects available geometry, not user collapse.
  await act(async () => { tree!.root.findByType('dialog').props.onChange(0, 0); });
  props = { ...props, height: 640 }; await update();
  expect(tree!.root.findByType('dialog').props.nativeIndex.get()).toBe(1);
  await press('ar.collapse');
  props = { ...props, height: 180 }; await update();
  props = { ...props, height: 640 }; await update();
  expect(tree!.root.findByType('dialog').props.nativeIndex.get()).toBe(0);
});

it('changes controlled expansion without render-time shared-value writes in the installed SDK hook', async () => {
  await press('ar.expand'); await press('ar.collapse');
  props = { ...props, selected: place, selectionRevision: 1 }; await update();
  props = { ...props, height: 180 }; await update();
  props = { ...props, height: 640 }; await update();
  expect(tree!.root.findByType('dialog').props.nativeIndex.get()).toBe(1);
  expect(nativeUi.mutableValueWrites).toEqual([]);
});

it('keeps automatic selections compact and expands only after an explicit selection revision', async () => {
  props = { ...props, selected: place }; await update();
  expect(tree!.root.findByType('dialog').props.nativeIndex.get()).toBe(0);
  expect(tree!.root.findAllByType('button').some(b => b.props.accessibilityLabel === translations.t('ar.collapse'))).toBe(false);
  props = { ...props, selectionRevision: 1 }; await update();
  expect(tree!.root.findByType('dialog').props.nativeIndex.get()).toBe(1);
  expect(tree!.root.findAllByType('button').some(b => b.props.accessibilityLabel === translations.t('ar.collapse'))).toBe(true);
});

it('leaves animated clipping position to the native sheet when expansion is requested', async () => {
  const sheet=tree!.root.findByType('dialog');const start=sheet.props.animatedPosition.get();
  vi.mocked(props.onOccupation).mockClear();
  await press('ar.expand');
  expect(sheet.props.index).toBe(1);
  expect(sheet.props.animatedPosition.get()).toBe(start);
  expect(props.onOccupation).not.toHaveBeenCalled();
  await act(async()=>sheet.props.onChange(1,640-sheet.props.snapPoints[1]));
  expect(props.onOccupation).toHaveBeenLastCalledWith(sheet.props.snapPoints[1]);
});

it('shows a nearest summary in the compact dock and discloses guidance independently of selection', async () => {
  props = { ...props, guidance: <span>ordinary tracking explanation</span> }; await update();
  expect(JSON.stringify(tree!.toJSON())).toContain(place.name);
  expect(JSON.stringify(tree!.toJSON())).not.toContain('ordinary tracking explanation');
  expect(tree!.root.findAllByType('text').some(n => n.props.children === translations.t('ar.nearby'))).toBe(true);
  expect(tree!.root.findAllByType('text').some(n => n.props.children === translations.t('ar.nearbyCount', { count: 1 }))).toBe(false);
  const expand = tree!.root.findAllByType('button').find(b => b.props.accessibilityLabel === translations.t('ar.expand'))!;
  expect(expand.findByType('icon' as React.ElementType).props.name).toBe('chevron-up-outline');
  await press('ar.expand'); await press('ar.tracking');
  expect(JSON.stringify(tree!.toJSON())).toContain('ordinary tracking explanation');
  expect(props.onMore).not.toHaveBeenCalled(); expect(props.onSelect).not.toHaveBeenCalled();
});
