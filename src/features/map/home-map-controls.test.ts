import { withHeroUI } from '@/test/native-ui';
import * as React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { createInstance } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { afterEach, expect, it, vi } from 'vitest';
import { localizationOptions } from '@/i18n/options';
import { HomeMapControls } from './home-map-controls';
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true, __DEV__: false });
let tree: ReactTestRenderer;
afterEach(async () => { await act(async () => tree?.unmount()); });
it('integrates the brand mark with Search and keeps shortcuts free of Recenter and Settings', async () => {
 const translations = createInstance(); await translations.use(initReactI18next).init({ ...localizationOptions, lng: 'en', react: { useSuspense: false } });
 const callbacks = { onSearchNearby: vi.fn(), onOpenDestinations: vi.fn() };
 const render = (canSearch: boolean, searching: boolean) => React.createElement(I18nextProvider, { i18n: translations }, withHeroUI(React.createElement(HomeMapControls, { ...callbacks, canSearch, searching })));
 await act(async () => { tree = create(render(true, false)); });
 const buttons = tree.root.findAllByType('button'); expect(buttons).toHaveLength(2);
 expect(buttons.map(b => b.props.accessibilityLabel)).toEqual(['Search Nearby', 'Featured Destinations']);
 expect(tree.root.findAllByType('icon' as React.ElementType).some(node=>node.props.name==='compass-outline')).toBe(true);
 expect(buttons.some(b=>b.props.accessibilityLabel===translations.t('settings.title'))).toBe(false);
 await act(async () => { buttons.forEach(b => b.props.onPress()); });
 Object.values(callbacks).forEach(callback => expect(callback).toHaveBeenCalledOnce());
 for (const [canSearch, searching] of [[false, false], [true, true]]) {
  await act(async () => tree.update(render(canSearch, searching)));
  expect(tree.root.findAllByType('button').find(b => b.props.accessibilityLabel === 'Search Nearby')!.props.disabled).toBe(true);
 }
});
