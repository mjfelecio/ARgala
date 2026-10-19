import { withHeroUI } from '@/test/native-ui';
import * as React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { createInstance } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { afterEach, expect, it, vi } from 'vitest';
import { localizationOptions } from '@/i18n/options';
import { layoutLabels, rankPlaces } from './projection';
import { ArLabels } from './ar-labels';

let tree: ReactTestRenderer | undefined;
afterEach(async () => { await act(async () => tree?.unmount()); tree = undefined; });
const name = '아주 긴 장소 이름 とても長い場所の名前';
const origin = { latitude: 0, longitude: 0 };
const places = Array.from({ length: 5 }, (_, i) => ({ id: `google:${i}`, providerId: `${i}`, provider: 'google' as const,
  name, coordinates: { latitude: 0.0001, longitude: 0 }, attributions: [] }));
async function mount(top: number, bottom: number, heading: number | null = 0) {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true, __DEV__: false });
  const translations = createInstance(); await translations.use(initReactI18next).init({ ...localizationOptions, lng: 'en' });
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
  expect(labels[1].props.style.height).toBeLessThan(labels[0].props.style.height);
  expect(labels[0].props.accessibilityLabel).toContain(name);
  expect(labels[0].props.accessibilityLabel).toContain('11 m away');
  for (const label of labels) {
    expect(label.props.style.top).toBeGreaterThanOrEqual(130);
    expect(label.props.style.top + label.props.style.height).toBeLessThanOrEqual(700);
  }
  await act(async () => { labels[0].props.onPress(); }); expect(select).toHaveBeenCalledWith('4');
});
it('omits labels when no safe lane fits or heading is unavailable', async () => {
  await mount(130, 160); expect(tree!.root.findAllByType('button')).toHaveLength(0);
  await act(async () => { tree!.unmount(); });
  await mount(130, 700, null); expect(tree!.root.findAllByType('button')).toHaveLength(0);
});
