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
  name, coordinates: { latitude: 0.001, longitude: 0 }, attributions: [] }));
async function mount(top: number, bottom: number, heading: number | null = 0, options: {
  selectedId?: string | null; items?: typeof places; fontScale?: number;
} = {}) {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true, __DEV__: false });
  translations = createInstance(); await translations.use(initReactI18next).init({ ...localizationOptions, lng: 'en' });
  const select = vi.fn();
  const inspect = vi.fn();
  await act(async () => { tree = create(React.createElement(I18nextProvider, { i18n: translations }, withHeroUI(React.createElement(ArLabels, {
    labels: layoutLabels(rankPlaces(options.items ?? places, origin, heading, 100), 320, options.selectedId === undefined ? '4' : options.selectedId),
    selectedId: options.selectedId === undefined ? '4' : options.selectedId, onSelect: select, onInspect: inspect,
    top, bottom, fontScale: options.fontScale ?? 1.5,
  })))); });
  return { select, inspect };
}
function button(id: string) { return tree!.root.findAllByType('button').find(item => item.props.testID === `ar-label-${id}`)!; }
function textContent(node: unknown): string {
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(textContent).join(' ');
  if (node && typeof node === 'object' && 'props' in node) return textContent((node as ReactTestInstance).props.children);
  return '';
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
  const { select, inspect } = await mount(130, 850);
  const labels = tree!.root.findAllByType('button');
  expect(labels).toHaveLength(3);
  expect(labels[0].props.accessibilityState.selected).toBe(true);
  const geometry = (label: (typeof labels)[number]) => label.props.style;
  expect(geometry(labels[1]).height).toBeLessThan(geometry(labels[0]).height);
  expect(labels[0].props.accessibilityLabel).toContain(name);
  expect(labels[0].props.accessibilityLabel).toContain('About 111 m away');
  expect(labels[0].props.accessibilityLabel).toContain('Selected');
  expect(labels[0].props.accessibilityLabel).not.toContain('Within range');
  expect(labels[0].props.className).toContain('bg-brand-strong');
  expect(labels[0].props.className).toContain('border-white');
  expect(labels[0].props.className).toContain('shadow-sm');
  expect(labels[0].props.children[0].props.className).toContain('text-sm leading-4');
  expect(labels[0].props.children[1].props.className).toContain('text-xs leading-4');
  expect(labels[1].props.className).toContain('bg-surface');
  expect(labels[1].props.className).toContain('rounded-card');
  expect(labels[1].props.className).toContain('shadow-sm');
  expect(labels[1].props.className).not.toContain('bg-ink');
  expect(labels.every(label => geometry(label).height >= 48)).toBe(true);
  for (const label of labels) {
    expect(geometry(label).top).toBeGreaterThanOrEqual(130);
    expect(geometry(label).top + geometry(label).height).toBeLessThanOrEqual(850);
  }
  await act(async () => { labels[0].props.onPress(); }); expect(inspect).toHaveBeenCalledWith('4');
  await act(async () => { labels[1].props.onPress(); }); expect(select).toHaveBeenCalledWith('0');
});

it('keeps eligible unselected places compact in the new style and expands only the selected metadata', async () => {
  const eligible = [
    { ...places[0], name: 'Café Sample', coordinates: { latitude: 0.0001, longitude: 0 }, address: '12 Main Street', description: 'Ignored when address exists' },
    { ...places[1], name: 'Garden Sample', coordinates: { latitude: 0.0002, longitude: 0 }, description: 'A quiet public garden.' },
    { ...places[2], name: 'Bare Sample', coordinates: { latitude: 0.0003, longitude: 0 }, address: '   ', description: '   ' },
  ];
  const { inspect, select } = await mount(0, 850, 0, { selectedId: null, items: eligible, fontScale: 1 });
  for (const id of ['0','1','2']) {
    const card=button(id);
    expect(card.props.className).toContain('bg-surface');
    expect(card.props.className).toContain('border-brand-primary');
    expect(card.props.className).toContain('rounded-card');
    expect(card.props.className).toContain('shadow-sm');
    expect(card.props.children[0].props.className).toContain('text-foreground');
    expect(card.props.style.height).toBe(24+36);
    expect(textContent(card.props.children)).not.toContain('Within range');
    expect(textContent(card.props.children)).not.toContain('Select place');
    expect(textContent(card.props.children)).not.toContain('12 Main Street');
    expect(textContent(card.props.children)).not.toContain('A quiet public garden.');
  }
  await act(async()=>button('0').props.onPress());expect(select).toHaveBeenCalledWith('0');
  const labels=tree!.root.findByType(ArLabels).props.labels;
  await updateLabels(labels,{selectedId:'0'});
  expect(textContent(button('0').props.children)).toContain('12 Main Street');
  expect(textContent(button('0').props.children)).not.toContain('Ignored when address exists');
  expect(button('0').props.accessibilityLabel).toContain('Selected · within range');
  expect(button('0').props.style.height).toBe(32+112);
  await act(async()=>button('0').props.onPress());expect(inspect).toHaveBeenCalledWith('0');
  await updateLabels(labels,{selectedId:'1'});
  expect(textContent(button('0').props.children)).not.toContain('12 Main Street');
  expect(textContent(button('1').props.children)).toContain('A quiet public garden.');
  await updateLabels(labels,{selectedId:'2'});
  expect(button('2').props.accessibilityLabel).not.toContain('unavailable');
  expect(button('2').props.accessibilityLabel).not.toContain('category');
});

it('renders selected outside-radius places richly with live translated action copy', async () => {
  const { inspect } = await mount(0, 850, 0, { selectedId: '4', fontScale: 1 });
  const selected = button('4');
  expect(selected.props.accessibilityState.selected).toBe(true);
  expect(selected.props.accessibilityLabel).toContain('Selected');
  expect(selected.props.accessibilityLabel).not.toContain('Within range');
  expect(selected.props.accessibilityLabel).toContain('View Details');
  await act(async () => { selected.props.onPress(); });
  expect(inspect).toHaveBeenCalledWith('4');

  await act(async () => { await translations.changeLanguage('ko'); });
  expect(button('4').props.accessibilityLabel).toContain('선택됨');
  expect(button('4').props.accessibilityLabel).toContain('약 111m 거리');
  expect(button('4').props.accessibilityLabel).toContain('상세 정보 보기');
  await act(async () => { await translations.changeLanguage('ja'); });
  expect(button('4').props.accessibilityLabel).toContain('選択中');
  expect(button('4').props.accessibilityLabel).toContain('約111 m先');
  expect(button('4').props.accessibilityLabel).toContain('詳細を見る');
});

it('reserves font-scaled rich safe lanes while clamping cards to narrow bounds and short scenes', async () => {
  await mount(0, 850, 0, { selectedId: '4', fontScale: 1.5 });
  const selected = button('4');
  expect(selected.props.style.height).toBe(32 + 80 * 1.5);
  expect(button('0').props.style.top - selected.props.style.top).toBe(32 + 112 * 1.5 + 8);
  const narrowLabels = layoutLabels(rankPlaces(places, origin, 0, 100), 160, '4');
  await updateLabels(narrowLabels);
  expect(button('4').props.style.width).toBe(144);
  expect(button('4').props.style.left).toBe(8);
  const props = tree!.root.findByType(ArLabels).props as React.ComponentProps<typeof ArLabels>;
  await act(async () => { tree!.update(React.createElement(I18nextProvider, { i18n: translations }, withHeroUI(React.createElement(ArLabels, {
    ...props, top: 0, bottom: 500,
  })))); });
  expect(tree!.root.findAllByType('button')).toHaveLength(2);
});

it('keeps metadata-rich CJK cards disjoint at large text scale', async () => {
  const rich = places.map(place => ({ ...place, coordinates: { latitude: 0.0001, longitude: 0 }, address: '긴 실제 주소 とても長い実際の住所' }));
  await mount(80, 850, 0, { items: rich, fontScale: 2 });
  const cards = tree!.root.findAllByType('button');
  expect(cards).toHaveLength(2);
  for (const [index, card] of cards.entries()) {
    expect(card.props.accessibilityLabel).toContain(name);
    if (card.props.accessibilityState.selected) expect(card.props.accessibilityLabel).toContain(rich[0].address);
    else expect(textContent(card.props.children)).not.toContain(rich[0].address);
    expect(card.props.style.top).toBeGreaterThanOrEqual(80);
    expect(card.props.style.top + card.props.style.height).toBeLessThanOrEqual(850);
    if (index) expect(card.props.style.top).toBeGreaterThanOrEqual(cards[index - 1].props.style.top + cards[index - 1].props.style.height + 8);
  }
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
