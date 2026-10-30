import { withHeroUI } from '@/test/native-ui';
import * as React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { createInstance } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { afterEach, expect, it, vi } from 'vitest';
import { localizationOptions } from '@/i18n/options';
import { HomeMapControls, type HomeMapControlsProps } from './home-map-controls';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true, __DEV__: false });
let tree: ReactTestRenderer;
afterEach(async () => { await act(async () => tree?.unmount()); });

async function setup(language = 'en', overrides: Partial<HomeMapControlsProps> = {}) {
  const translations = createInstance();
  await translations.use(initReactI18next).init({ ...localizationOptions, lng: language, react: { useSuspense: false } });
  const callbacks = { onSearchNearby: vi.fn(), onOpenDestinations: vi.fn(), onQueryChange: vi.fn(), onCategoryChange: vi.fn(), onSearchArea: vi.fn() };
  const props = { ...callbacks, canSearch: true, searching: false, canSearchArea: true, areaRadiusMeters: 1000, query: '', ...overrides };
  const render = (changes: Partial<HomeMapControlsProps> = {}) => React.createElement(I18nextProvider, { i18n: translations }, withHeroUI(React.createElement(HomeMapControls, { ...props, ...changes })));
  await act(async () => { tree = create(render()); });
  return { callbacks, translations, render };
}
const buttons = () => tree.root.findAllByType('button');
const button = (label: string) => buttons().find(node => node.props.accessibilityLabel === label)!;
const input = () => tree.root.findByType('input');
const visibleText = () => tree.root.findAllByType('text').flatMap(node => node.children.filter(child => typeof child === 'string'));

it('dispatches typed search from one icon action or keyboard, while edits remain local', async () => {
  const { callbacks, render } = await setup();
  expect(input().props.accessibilityLabel).toBe('Search places');
  expect(input().props.maxLength).toBe(256);
  expect(input().props.returnKeyType).toBe('search');
  expect(button('Search Nearby')).toBeDefined();
  expect(tree.root.findAllByType('icon' as React.ElementType).some(node => node.props.name === 'compass-outline')).toBe(true);
  await act(async () => input().props.onChangeText('museum'));
  expect(callbacks.onQueryChange).toHaveBeenCalledExactlyOnceWith('museum');
  expect(callbacks.onSearchNearby).not.toHaveBeenCalled();
  await act(async () => tree.update(render({ query: 'museum' })));
  expect(button('Search Nearby')).toBeUndefined();
  expect(button('Search').findAllByType('icon' as React.ElementType).some(node => node.props.name === 'search-outline')).toBe(true);
  await act(async () => button('Search').props.onPress());
  await act(async () => input().props.onSubmitEditing());
  expect(callbacks.onSearchNearby).toHaveBeenCalledTimes(2);
});

it.each([[false, false], [true, true], [false, true]])('guards both submit paths when canSearch=%s and searching=%s', async (canSearch, searching) => {
  const { callbacks, render } = await setup('en', { canSearch, searching });
  expect(button('Search Nearby').props.disabled).toBe(true);
  expect(button('Search Nearby').props.accessibilityState).toMatchObject({ disabled: true, busy: searching });
  await act(async () => { button('Search Nearby').props.onPress(); input().props.onSubmitEditing(); });
  expect(callbacks.onSearchNearby).not.toHaveBeenCalled();
  await act(async () => tree.update(render({ canSearch: true, searching: false })));
  await act(async () => input().props.onSubmitEditing());
  expect(callbacks.onSearchNearby).toHaveBeenCalledOnce();
});

it('keeps Featured pinned before every scrolling category, with independent actions and selected state', async () => {
  const { callbacks, render } = await setup('en', { category: 'restaurants' });
  const rail = tree.root.findByType('scroll' as React.ElementType);
  expect(rail.props.horizontal).toBe(true);
  expect(rail.findAllByType('button').map(node => node.props.accessibilityLabel)).toEqual(['All', 'Attractions', 'Restaurants', 'Hotels', 'Shopping']);
  expect(rail.findAllByType('button')).not.toContain(button('Featured Destinations'));
  expect(visibleText()).toContain('Featured');
  expect(button('Featured Destinations').props.accessibilityState?.selected).toBeUndefined();
  expect(button('Restaurants').props.accessibilityState.selected).toBe(true);
  expect(button('All').props.accessibilityState.selected).toBe(false);
  await act(async () => button('Featured Destinations').props.onPress());
  expect(callbacks.onOpenDestinations).toHaveBeenCalledOnce();
  expect(callbacks.onCategoryChange).not.toHaveBeenCalled();
  for (const label of ['All', 'Attractions', 'Restaurants', 'Hotels', 'Shopping']) await act(async () => button(label).props.onPress());
  expect(callbacks.onCategoryChange.mock.calls).toEqual([['all'], ['attractions'], ['restaurants'], ['hotels'], ['shopping']]);
  await act(async () => tree.update(render({ category: 'hotels' })));
  expect(button('Hotels').props.accessibilityState.selected).toBe(true);
  expect(callbacks.onSearchNearby).not.toHaveBeenCalled();
  expect(buttons().some(node => ['Recenter', 'Settings'].includes(node.props.accessibilityLabel))).toBe(false);
});

it('keeps area search visible with a localized radius hint and preserves availability', async () => {
  const { callbacks, render } = await setup();
  expect(button('Search this area').props.accessibilityHint).toBe('Search this area · within 1000 m');
  expect(visibleText()).toContain('Search this area');
  expect(visibleText()).not.toContain('Search this area · within 1000 m');
  await act(async () => button('Search this area').props.onPress());
  expect(callbacks.onSearchArea).toHaveBeenCalledOnce();
  for (const changes of [{ canSearchArea: false }, { searching: true }]) {
    await act(async () => tree.update(render(changes)));
    expect(button('Search this area').props.disabled).toBe(true);
  }
  await act(async () => tree.update(render({ areaRadiusMeters: undefined })));
  expect(button('Search this area').props.accessibilityHint).toBeUndefined();
  await act(async () => tree.update(render({ onSearchArea: undefined })));
  expect(button('Search this area')).toBeUndefined();
});

it.each([
  ['en', 'Search', 'Featured', 'Featured Destinations', 'Search places', 'Search this area', 'Search this area · within 1000 m'],
  ['ja', '検索', '注目スポット', 'おすすめの目的地', '場所を検索', 'このエリアを検索', 'このエリアを検索 · 1000m以内'],
  ['ko', '검색', '추천 명소', '추천 여행지', '장소 검색', '이 지역 검색', '이 지역 검색 · 1000m 이내'],
])('renders current %s resources and updates visible/accessibility labels on language change without searching', async (language, submit, featured, featuredLabel, queryLabel, area, hint) => {
  const { callbacks, translations } = await setup('en', { query: 'museum' });
  await act(async () => { await translations.changeLanguage(language); });
  expect(button(submit)).toBeDefined();
  expect(button(featuredLabel)).toBeDefined();
  expect(visibleText()).toContain(featured);
  expect(input().props.accessibilityLabel).toBe(queryLabel);
  expect(button(area).props.accessibilityHint).toBe(hint);
  expect(visibleText()).toContain(area);
  expect(callbacks.onSearchNearby).not.toHaveBeenCalled();
});
