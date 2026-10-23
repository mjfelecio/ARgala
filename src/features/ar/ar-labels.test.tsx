import { nativeUi, withHeroUI } from '@/test/native-ui';
import * as React from 'react';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { createInstance, type i18n } from 'i18next';
import * as Reanimated from 'react-native-reanimated';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { afterEach, expect, it, vi } from 'vitest';
import { localizationOptions } from '@/i18n/options';
import { layoutLabels, rankPlaces } from './projection';
import { ArLabels } from './ar-labels';

let tree: ReactTestRenderer | undefined;
let translations: i18n;
afterEach(async () => { await act(async () => tree?.unmount()); tree = undefined; vi.restoreAllMocks(); });
const name = '아주 긴 장소 이름 とても長い場所の名前';
const origin = { latitude: 0, longitude: 0 };
const places = Array.from({ length: 5 }, (_, i) => ({ id: `google:${i}`, providerId: `${i}`, provider: 'google' as const,
  name, coordinates: { latitude: 0.0001, longitude: 0 }, attributions: [] }));
async function mount(top: number, bottom: number, heading: number | null = 0) {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true, __DEV__: false });
  translations = createInstance(); await translations.use(initReactI18next).init({ ...localizationOptions, lng: 'en' });
  const select = vi.fn();
  await act(async () => { tree = create(React.createElement(I18nextProvider, { i18n: translations }, withHeroUI(React.createElement(ArLabels, {
    labels: layoutLabels(rankPlaces(places, origin, heading, 100), 320, '4'), selectedId: '4', onSelect: select,
    top, bottom, fontScale: 1.5,
  })))); });
  return select;
}
function visualLeft(button: ReactTestInstance) {
  const styles = Array.isArray(button.props.style) ? button.props.style : [button.props.style];
  const style = Object.assign({}, ...styles.map((item: object) => nativeUi.animatedStyles.get(item)?.() ?? item)) as { left?: number; transform?: { translateX?: number }[] };
  return (style.left ?? 0) + (style.transform?.reduce((sum, transform) => sum + (transform.translateX ?? 0), 0) ?? 0);
}
function targetLabels(labels: React.ComponentProps<typeof ArLabels>['labels'], target: number, maxLeft: number, width = labels[0].width) {
  return labels.map((label, index) => index === 0 ? { ...label, left: target, width, maxLeft } : label) as React.ComponentProps<typeof ArLabels>['labels'];
}
async function updateLabels(labels: React.ComponentProps<typeof ArLabels>['labels'], extra: Partial<React.ComponentProps<typeof ArLabels>> = {}) {
  const props = tree!.root.findByType(ArLabels).props as React.ComponentProps<typeof ArLabels>;
  await act(async () => {
    tree!.update(React.createElement(I18nextProvider, { i18n: translations },
      withHeroUI(React.createElement(ArLabels, { ...props, ...extra, labels }))));
  });
}
it('bounds labels to three measured lanes, retains stable IDs and full accessible CJK names', async () => {
  const select = await mount(130, 700);
  const labels = tree!.root.findAllByType('button');
  expect(labels).toHaveLength(3);
  expect(labels[0].props.accessibilityState.selected).toBe(true);
  const geometry = (label: (typeof labels)[number]) => label.props.style;
  expect(geometry(labels[1]).height).toBeLessThan(geometry(labels[0]).height);
  expect(labels[0].props.accessibilityLabel).toContain(name);
  expect(labels[0].props.accessibilityLabel).toContain('11 m away');
  expect(labels[0].props.className).toContain('bg-brand-strong');
  expect(labels[0].props.className).toContain('border-white');
  expect(labels[1].props.className).toContain('bg-ink/95');
  expect(labels.every(label => geometry(label).height >= 48)).toBe(true);
  for (const label of labels) {
    expect(geometry(label).top).toBeGreaterThanOrEqual(130);
    expect(geometry(label).top + geometry(label).height).toBeLessThanOrEqual(700);
  }
  await act(async () => { labels[0].props.onPress(); }); expect(select).toHaveBeenCalledWith('4');
});

it('holds the reconstructed stationary trace, snaps deliberate movement, and uses no timing animation', async () => {
  await mount(0, 700);
  const timing = vi.spyOn(Reanimated, 'withTiming');
  const props = tree!.root.findByType(ArLabels).props as React.ComponentProps<typeof ArLabels>;
  // Changed viewport geometry starts this label at the closest stop: center.
  await updateLabels(targetLabels(props.labels, 104, 232));
  expect(visualLeft(tree!.root.findAllByType('button')[0])).toBe(120);
  for (const target of [111, 115, 31, 45, 101, 82, 98, 33, 88, 70]) {
    await updateLabels(targetLabels(props.labels, target, 232));
    expect(visualLeft(tree!.root.findAllByType('button')[0])).toBe(120);
  }
  await updateLabels(targetLabels(props.labels, 24, 232));
  expect(visualLeft(tree!.root.findAllByType('button')[0])).toBe(8);
  for (const target of [97, 101, 99, 103]) {
    await updateLabels(targetLabels(props.labels, target, 232));
    expect(visualLeft(tree!.root.findAllByType('button')[0])).toBe(8);
  }
  await updateLabels(targetLabels(props.labels, 104, 232));
  expect(visualLeft(tree!.root.findAllByType('button')[0])).toBe(120);
  await updateLabels(targetLabels(props.labels, 232, 232));
  expect(visualLeft(tree!.root.findAllByType('button')[0])).toBe(232);
  await updateLabels(targetLabels(props.labels, 8, 232));
  expect(visualLeft(tree!.root.findAllByType('button')[0])).toBe(8);
  expect(timing).not.toHaveBeenCalled();
});
it('resets snapped position on lane or geometry changes and when a label is reacquired', async () => {
  await mount(0, 700);
  const props = tree!.root.findByType(ArLabels).props as React.ComponentProps<typeof ArLabels>;
  const labels = targetLabels(props.labels, 134, 144);
  await updateLabels(labels);
  expect(visualLeft(tree!.root.findAllByType('button')[0])).toBe(144);
  const moved = targetLabels(labels, 100, 144);
  await updateLabels(moved);
  expect(visualLeft(tree!.root.findAllByType('button')[0])).toBe(144);
  const laneChanged = [moved[1], moved[0], ...moved.slice(2)];
  await updateLabels(laneChanged);
  expect(visualLeft(tree!.root.findAllByType('button').find(button => button.props.testID === `ar-label-${props.labels[0].place.providerId}`)!)).toBe(76);
  const resized = laneChanged.map((label, index) => index === 1 ? { ...label, left: 80, maxLeft: 120, width: label.width + 4 } : label) as typeof laneChanged;
  await updateLabels(resized);
  expect(visualLeft(tree!.root.findAllByType('button').find(button => button.props.testID === `ar-label-${props.labels[0].place.providerId}`)!)).toBe(64);
  await updateLabels([]);
  await updateLabels(targetLabels(props.labels, 143, 144));
  const reacquired = tree!.root.findAllByType('button').find(button => button.props.testID === `ar-label-${props.labels[0].place.providerId}`)!;
  expect(visualLeft(reacquired)).toBe(144);
});
it('removes invalid direction immediately', async () => {
  await mount(0, 700, 359);
  await updateLabels(layoutLabels(rankPlaces(places, origin, null, 100), 320, '4'));
  expect(tree!.root.findAllByType('button')).toHaveLength(0);
});
it('omits labels when no safe lane fits or heading is unavailable', async () => {
  await mount(130, 160); expect(tree!.root.findAllByType('button')).toHaveLength(0);
  await act(async () => { tree!.unmount(); });
  await mount(130, 700, null); expect(tree!.root.findAllByType('button')).toHaveLength(0);
});

it('removes labels on a fast turn and reacquires them at their new snapped target', async () => {
  await mount(0, 700);
  const props = tree!.root.findByType(ArLabels).props as React.ComponentProps<typeof ArLabels>;
  const renderLabels = (heading: number, selectedId: string) => React.createElement(I18nextProvider, { i18n: translations }, withHeroUI(React.createElement(ArLabels, {
    ...props, selectedId, labels: layoutLabels(rankPlaces(places, origin, heading, 100), 320, selectedId),
  })));
  await act(async () => tree!.update(renderLabels(0, '0')));
  expect(tree!.root.findAllByType('button')[0].props.accessibilityState.selected).toBe(true);
  await act(async () => tree!.update(renderLabels(180, '0')));
  expect(tree!.root.findAllByType('button')).toHaveLength(0);
  await act(async () => tree!.update(renderLabels(0, '0')));
  expect(tree!.root.findAllByType('button')).toHaveLength(3);
});
