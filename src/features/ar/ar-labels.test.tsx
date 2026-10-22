import { nativeUi, withHeroUI } from '@/test/native-ui';
import * as React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
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
it('bounds labels to three measured lanes, retains stable IDs and full accessible CJK names', async () => {
  const select = await mount(130, 700);
  const labels = tree!.root.findAllByType('button');
  expect(labels).toHaveLength(3);
  expect(labels[0].props.accessibilityState.selected).toBe(true);
  const geometry = (label: (typeof labels)[number]) => label.props.style[0];
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

it('interpolates a small north-wrap change on the UI boundary and removes invalid direction immediately', async () => {
  await mount(0, 700, 359);
  const timing = vi.spyOn(Reanimated, 'withTiming');
  const cancel = vi.spyOn(Reanimated, 'cancelAnimation');
  async function heading(degrees: number | null) {
    const props = tree!.root.findByType(ArLabels).props as React.ComponentProps<typeof ArLabels>;
    await act(async () => tree!.update(React.createElement(I18nextProvider, { i18n: translations }, withHeroUI(React.createElement(ArLabels, {
      ...props, labels: layoutLabels(rankPlaces(places, origin, degrees, 100), 320, '4'),
    })))));
  }
  await heading(1);
  expect(timing).toHaveBeenCalled();
  const button = tree!.root.findAllByType('button')[0];
  const styles = Array.isArray(button.props.style) ? button.props.style : [button.props.style];
  const style = Object.assign({}, ...styles.map(style => nativeUi.animatedStyles.get(style)?.() ?? style));
  const target = layoutLabels(rankPlaces(places, origin, 1, 100), 320, '4')[0];
  expect(style.left).toBe(0);
  expect(style.transform).toEqual([{ translateX: target.left }]);
  expect(timing.mock.calls.every(([, config]) => config?.duration !== undefined && config.duration <= 100 && config.reduceMotion === Reanimated.ReduceMotion.System)).toBe(true);
  await heading(null);
  expect(tree!.root.findAllByType('button')).toHaveLength(0);
  expect(cancel).toHaveBeenCalled();
});
it('omits labels when no safe lane fits or heading is unavailable', async () => {
  await mount(130, 160); expect(tree!.root.findAllByType('button')).toHaveLength(0);
  await act(async () => { tree!.unmount(); });
  await mount(130, 700, null); expect(tree!.root.findAllByType('button')).toHaveLength(0);
});

it('snaps lane changes and removes labels on a fast turn without interpolating through other lanes', async () => {
  await mount(0, 700);
  const timing = vi.spyOn(Reanimated, 'withTiming');
  const props = tree!.root.findByType(ArLabels).props as React.ComponentProps<typeof ArLabels>;
  const renderLabels = (heading: number, selectedId: string) => React.createElement(I18nextProvider, { i18n: translations }, withHeroUI(React.createElement(ArLabels, {
    ...props, selectedId, labels: layoutLabels(rankPlaces(places, origin, heading, 100), 320, selectedId),
  })));
  await act(async () => tree!.update(renderLabels(0, '0')));
  expect(timing).not.toHaveBeenCalled();
  expect(tree!.root.findAllByType('button')[0].props.accessibilityState.selected).toBe(true);
  await act(async () => tree!.update(renderLabels(180, '0')));
  expect(tree!.root.findAllByType('button')).toHaveLength(0);
  await act(async () => tree!.update(renderLabels(0, '0')));
  // A reacquired label starts at the new target, with no stale filter state.
  expect(timing).not.toHaveBeenCalled();
  expect(tree!.root.findAllByType('button')).toHaveLength(3);
});
