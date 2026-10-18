import * as React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { createInstance, type i18n } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { localizationOptions } from '@/i18n/options';
import { HomePlaceSheet, type HomePlaceSheetProps } from './place-sheet';
vi.mock('react-native', () => ({ Pressable: 'button', Text: 'text', View: 'view', ScrollView: 'scroll', ActivityIndicator: 'progress', StyleSheet: { create: (s: unknown) => s } }));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let tree: ReactTestRenderer; let translations: i18n;
const place = { id: 'google:one', provider: 'google' as const, providerId: 'one', name: 'A very long returned destination name 日本語 한국어 '.repeat(4), coordinates: { latitude: 10, longitude: 20 }, attributions: [] };
let props: HomePlaceSheetProps;
beforeEach(async () => {
 translations = createInstance(); await translations.use(initReactI18next).init({ ...localizationOptions, lng: 'en', react: { useSuspense: false } });
 props = { state: 'unsearched', selectedPlace: null, hasSelection: false, canRequest: true, resultCount: 0, attributions: React.createElement('aside', {}, 'Provider credit'), onRetrySearch: vi.fn(), onClosePlace: vi.fn(), onDetails: vi.fn(), onWalk: vi.fn(), onMeasuredHeight: vi.fn() };
});
afterEach(async () => { await act(async () => tree?.unmount()); });
async function render() { await act(async () => { tree = create(React.createElement(I18nextProvider, { i18n: translations }, React.createElement(HomePlaceSheet, props))); }); }
function content() { return JSON.stringify(tree.toJSON()); }
async function press(key: string) { const button=tree.root.findAllByType('button').find(b=>b.props.accessibilityLabel===translations.t(key)); expect(button).toBeDefined(); await act(async()=>button!.props.onPress()); }
it.each(['unsearched','loading','empty','results'] as const)('renders truthful %s state with visible provider credits', async (state) => {
 props.state=state; props.resultCount=2; await render();
 const keys={unsearched:'map.start',loading:'map.searching',empty:'map.empty',results:'map.results'};
 expect(content()).toContain(translations.t(keys[state], {count:2})); expect(content()).toContain('Provider credit');
});
it('preserves long names, hides absent fields and expands only by an actual action', async () => {
 props.state='selected'; props.selectedPlace=place; props.hasSelection=true; await render();
 expect(content()).toContain(place.name); expect(content()).not.toContain('4.8');
 expect(tree.root.findAllByType('text').find(n=>n.props.children===place.name)!.props.numberOfLines).toBeUndefined();
 await press('map.expand'); expect(content()).toContain(translations.t('map.collapse'));
 await press('map.walk'); expect(props.onWalk).toHaveBeenCalledOnce();
 await press('map.closePlace'); expect(props.onClosePlace).toHaveBeenCalledOnce();
 expect(props.onDetails).not.toHaveBeenCalled();
});
it('keeps route destination, summary and every warning accessible in compact mode', async () => {
 props.state='route-ready'; props.hasSelection=true; props.selectedPlace=place;
 props.route={distanceMeters:250,durationSeconds:180,warnings:['Provider walking warning']}; await render();
 expect(content()).toContain(place.name); expect(content()).toContain(translations.t('map.routeSummary',{meters:250,minutes:3}));
 expect(content()).toContain(translations.t('map.walkingCaution')); expect(content()).toContain('Provider walking warning');
});
it('translates an error key at render time, supports retry and reports measured height', async () => {
 props.state='failed'; props.errorKey='service.rateLimited'; await render();
 expect(content()).toContain(translations.t('service.rateLimited'));
 await act(async()=>{ await translations.changeLanguage('ko'); }); expect(content()).toContain(translations.t('service.rateLimited'));
 await press('common.retry'); expect(props.onRetrySearch).toHaveBeenCalledOnce();
 const measured=tree.root.findAllByType('view').find(n=>n.props.onLayout);
 await act(async()=>measured!.props.onLayout({nativeEvent:{layout:{height:234}}}));
 expect(props.onMeasuredHeight).toHaveBeenCalledWith(234);
});
it('shows unavailable route and expired selection without inventing data', async () => {
 props.state='route-failed'; props.hasSelection=true; props.errorKey='service.routeUnavailable'; await render();
 expect(content()).toContain(translations.t('service.routeUnavailable'));
 expect(content()).toContain(translations.t('map.selectionUnavailable'));
 await press('ar.more'); expect(props.onDetails).toHaveBeenCalledOnce();
 expect(content()).not.toContain(translations.t('map.routeSummary',{meters:250,minutes:3}));
});
