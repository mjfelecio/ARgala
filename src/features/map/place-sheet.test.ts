import { withHeroUI } from '@/test/native-ui';
import * as React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { createInstance, type i18n } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { localizationOptions } from '@/i18n/options';
import { HomePlaceSheet, type HomePlaceSheetProps } from './place-sheet';
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true, __DEV__: false });
let tree: ReactTestRenderer; let translations: i18n;
const place = { id: 'google:one', provider: 'google' as const, providerId: 'one', name: 'A very long returned destination name 日本語 한국어 '.repeat(4), coordinates: { latitude: 10, longitude: 20 }, attributions: [] };
let props: HomePlaceSheetProps;
beforeEach(async () => {
 translations = createInstance(); await translations.use(initReactI18next).init({ ...localizationOptions, lng: 'en', react: { useSuspense: false } });
 props = { state: 'unsearched', selectedPlace: null, hasSelection: false, canRequest: true, resultCount: 0, attributions: React.createElement('aside', {}, 'Provider credit'), onRetrySearch: vi.fn(), onClosePlace: vi.fn(), onDetails: vi.fn(), onWalk: vi.fn(), onMeasuredHeight: vi.fn() };
});
afterEach(async () => { await act(async () => tree?.unmount()); });
async function render() { await act(async () => { tree = create(React.createElement(I18nextProvider, { i18n: translations }, withHeroUI(React.createElement(HomePlaceSheet, props)))); }); }
function content() { return JSON.stringify(tree.toJSON()); }
async function press(key: string) { const button=tree.root.findAllByType('button').find(b=>b.props.accessibilityLabel===translations.t(key)); expect(button).toBeDefined(); await act(async()=>button!.props.onPress()); }
it('satisfies the installed bottom-sheet prop contract and updates layout without losing native offsets', async () => {
 props.containerHeight=720; await render();
 const nativeSheet=tree.root.findByType('dialog');
 expect(nativeSheet.props.containerHeight).toBeUndefined();
 expect(nativeSheet.props.containerOffset).toBeUndefined();
 const layout=nativeSheet.props.containerLayoutState;
 expect(layout.get().height).toBe(720);
 // Native measurement supplies offsets; changing height must preserve them.
 await act(async()=>layout.set({height:720,offset:{top:32,bottom:16,left:0,right:0}}));
 props.containerHeight=480;
 await act(async()=>tree.update(React.createElement(I18nextProvider,{i18n:translations},withHeroUI(React.createElement(HomePlaceSheet,props)))));
 expect(tree.root.findByType('dialog').props.containerLayoutState).toBe(layout);
 expect(layout.get()).toEqual({height:480,offset:{top:32,bottom:16,left:0,right:0}});
});
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
 const measured=tree.root.findByType('dialog');
 await act(async()=>measured.props.onChange(0, measured.props.containerLayoutState.get().height - 234));
 expect(props.onMeasuredHeight).toHaveBeenCalledWith(234);
});
it('shows unavailable route and expired selection without inventing data', async () => {
 props.state='route-failed'; props.hasSelection=true; props.errorKey='service.routeUnavailable'; await render();
 expect(content()).toContain(translations.t('service.routeUnavailable'));
 expect(content()).toContain(translations.t('map.selectionUnavailable'));
 await press('ar.more'); expect(props.onDetails).toHaveBeenCalledOnce();
 expect(content()).not.toContain(translations.t('map.routeSummary',{meters:250,minutes:3}));
});
it('keeps the heading and expansion action scrollable when a short viewport caps the panel at 104 units', async () => {
 props.maxHeight=104; props.hasSelection=true; props.selectedPlace=place; props.state='selected'; await render();
 const scroll=tree.root.findByType('section');
 expect(scroll.findAllByType('button').some(b=>b.props.accessibilityLabel===translations.t('map.expand'))).toBe(true);
 expect(tree.root.findByType('dialog').props.snapPoints).toEqual([104]);
 expect(scroll.findAllByType('text').some(n=>n.props.children===place.name)).toBe(true);
});
it('prioritizes a returned route summary and caution before repeat-request and close actions', async () => {
 props.state='route-ready'; props.hasSelection=true; props.selectedPlace=place;
 props.route={distanceMeters:250,durationSeconds:180,warnings:['Returned warning']}; props.selectionSummary='Activation metadata'; await render();
 const json=content(); const summary=translations.t('map.routeSummary',{meters:250,minutes:3});
 expect(json.indexOf(summary)).toBeGreaterThan(json.indexOf(place.name));
 expect(json.indexOf(summary)).toBeLessThan(json.indexOf('Activation metadata'));
 expect(json.indexOf(summary)).toBeLessThan(json.indexOf(translations.t('map.walk')));
 expect(json.indexOf(translations.t('map.walkingCaution'))).toBeLessThan(json.indexOf(translations.t('map.walk')));
});

it.each(['ko','ja'])('keeps the native drag handle out of TalkBack and exposes localized expansion in %s', async language=>{
 await translations.changeLanguage(language); await render();
 expect(tree.root.findByType('header').props.accessible).toBe(false);
 const expand=tree.root.findAllByType('button').find(b=>b.props.accessibilityLabel===translations.t('map.expand'));
 expect(expand).toBeDefined();
 await press('map.expand');
 expect(tree.root.findAllByType('button').find(b=>b.props.accessibilityLabel===translations.t('map.collapse'))!.props.accessibilityState.expanded).toBe(true);
});
