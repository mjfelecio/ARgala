import { withHeroUI } from '@/test/native-ui';
import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { createInstance, type i18n } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { router } from 'expo-router';
import { localizationOptions } from '@/i18n/options';
import { JournalContext, type JournalContextValue } from './context';
import SavedPlacesScreen from './saved-screen';
import { SavePlaceAction } from './actions';
vi.mock('expo-router', () => ({ router: { push: vi.fn(), navigate: vi.fn(), back: vi.fn(), canGoBack: () => true } }));
let tree: ReactTestRenderer | undefined;
let translations: i18n;
let journal: JournalContextValue;
const id = `REVIEW_ONLY_${'x'.repeat(180)}`;
function render() { return withHeroUI(<I18nextProvider i18n={translations}><JournalContext.Provider value={journal}><SavedPlacesScreen /></JournalContext.Provider></I18nextProvider>); }
async function mount() { await act(async () => { tree = create(render()); }); }
const output = () => JSON.stringify(tree!.toJSON());
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true, __DEV__: false });
  vi.clearAllMocks();
  translations = createInstance(); await translations.use(initReactI18next).init({ ...localizationOptions, lng: 'en', react: { useSuspense: false } });
  journal = { principalId: 'guest', ready: true, error: null, state: { version: 1, bookmarks: [{ kind: 'google', id }], stamps: [] }, sync: { phase: 'local' }, syncNow: vi.fn(), retry: vi.fn(), save: vi.fn(async () => true), award: vi.fn(async () => true) };
});
afterEach(async () => { await act(async () => tree?.unmount()); tree = undefined; });
it('passes the complete 1,000-bookmark collection to a bounded virtualized list', async () => {
  journal.state.bookmarks = Array.from({ length: 1000 }, (_, index) => ({ kind: 'google' as const, id: `REVIEW_ONLY_${index}` }));
  await mount();
  const list = tree!.root.findByType('virtualized-list' as React.ElementType);
  expect(list.props.data).toHaveLength(1000);
  expect(list.props.keyExtractor({ kind: 'google', id: 'unchanged' })).toBe('google:unchanged');
  expect(list.props.className).toContain('flex-1');
  expect(tree!.root.findAllByType('scroll' as React.ElementType)).toHaveLength(0);
});
it.each(['en', 'ja', 'ko'])('keeps %s identifiers private and Open explicit without fetching', async locale => {
  const fetch = vi.spyOn(globalThis, 'fetch');
  await translations.changeLanguage(locale); await mount();
  expect(tree!.root.findAllByType('text').some(node => node.props.children === id || node.props.accessibilityLabel === id)).toBe(false);
  expect(output()).toContain(translations.t('journal.googlePlace'));
  const open = tree!.root.findAllByType('button').find(node => node.props.accessibilityLabel === translations.t('journal.open'))!;
  const remove = tree!.root.findAllByType('button').find(node => node.props.accessibilityLabel === translations.t('journal.remove'))!;
  expect(remove.props.className).toContain('ghost');
  await act(async () => open.props.onPress());
  expect(router.push).toHaveBeenCalledWith({ pathname: '/place/[providerId]', params: { providerId: id } });
  await act(async () => { await remove.props.onPress(); });
  expect(journal.save).toHaveBeenCalledExactlyOnceWith({ kind: 'google', id }, false);
  await act(async () => { await translations.changeLanguage(locale === 'en' ? 'ja' : 'en'); });
  expect(output()).toContain(translations.t('journal.openShort'));
  expect(output()).toContain(translations.t('journal.removeShort'));
  expect(fetch).not.toHaveBeenCalled(); fetch.mockRestore();
});
it.each(['en', 'ja', 'ko'])('keeps %s loading, failed read/retry and empty states distinct', async locale => {
  await translations.changeLanguage(locale); journal.ready = false; await mount();
  expect(output()).toContain(translations.t('common.loading'));
  expect(output()).not.toContain(translations.t('journal.savedEmpty'));
  expect(tree!.root.findAllByType('button').some(node => node.props.accessibilityLabel === translations.t('journal.open'))).toBe(false);
  journal = { ...journal, error: 'journal.loadFailed' };
  await act(async () => tree!.update(render()));
  expect(output()).toContain(translations.t('journal.loadFailed'));
  const retry = tree!.root.findAllByType('button').find(node => node.props.accessibilityLabel === translations.t('common.retry'))!;
  await act(async () => retry.props.onPress()); expect(journal.retry).toHaveBeenCalledOnce();
  journal = { ...journal, ready: true, error: null, state: { version: 1, bookmarks: [], stamps: [] } };
  await act(async () => tree!.update(render()));
  expect(output()).toContain(translations.t('journal.savedEmpty'));
  expect(output()).not.toContain(translations.t('journal.loadFailed'));
});

it('renders the real saved count, honest metadata and decorative View/remove icons', async () => {
  journal.state.bookmarks.push({kind: 'featured', id: 'D01'}); await mount();
  for (const locale of ['en', 'ja', 'ko']) {
    await act(async () => { await translations.changeLanguage(locale); });
    expect(output()).toContain(translations.t('journal.savedHeading'));
    expect(output()).toContain(translations.t('journal.savedCount', {count: 2}));
    expect(output()).toContain(translations.t('journal.googleMetadata'));
    const buttons = tree!.root.findAllByType('button');
    for (const [key, icon] of [['journal.open', 'chevron-forward'], ['journal.remove', 'trash-outline']]) {
      const action = buttons.find(node => node.props.accessibilityLabel === translations.t(key))!;
      expect(action.findAllByType('icon' as React.ElementType).some(node => node.props.name === icon && node.props.accessible === false)).toBe(true);
    }
  }
});
it.each(['local', 'pending', 'syncing', 'synced', 'failed'] as const)('presents truthful %s sync status without initiating work', async phase => {
  journal.principalId = 'account'; journal.sync = {phase}; await mount();
  const warning = tree!.root.findAllByProps({testID: 'journal-sync-warning'});
  expect(warning.length).toBe(phase === 'failed' ? 1 : 0);
  if (phase === 'failed') {
    expect(output()).toContain(translations.t('journal.syncAttention'));
    const retry = tree!.root.findAllByType('button').find(node => node.props.accessibilityLabel === translations.t('journal.retrySync'))!;
    expect(retry.props.className).toContain('outline');
    await act(async () => retry.props.onPress()); expect(journal.syncNow).toHaveBeenCalledOnce();
  } else expect(journal.syncNow).not.toHaveBeenCalled();
});
it('keeps a guest quiet even with a retired account failure', async () => {
  journal.sync = {phase:'failed',error:'journal.syncAuth'}; await mount();
  expect(tree!.root.findAllByProps({testID:'journal-sync-warning'})).toHaveLength(0);
  expect(output()).toContain(translations.t('journal.localOnly'));
  expect(output()).not.toContain(translations.t('journal.syncAuth'));
});

it('shows bookmark toggle state, a visible saved check and busy coalescing without confusing row removal', async () => {
  journal.state.bookmarks=[];
  const gate=Promise.withResolvers<boolean>(); vi.mocked(journal.save).mockReturnValueOnce(gate.promise);
  const action=()=>withHeroUI(<I18nextProvider i18n={translations}><JournalContext.Provider value={journal}><SavePlaceAction reference={{kind:'google',id}} /></JournalContext.Provider></I18nextProvider>);
  await act(async()=>{tree=create(action());});
  const save=tree!.root.findAllByType('button').find(node=>node.props.accessibilityLabel===translations.t('journal.save'))!;
  expect(save.findAllByType('icon' as React.ElementType).map(node=>node.props.name)).toContain('bookmark-outline');
  await act(async()=>{void save.props.onPress();void save.props.onPress();});
  expect(save.props.accessibilityState.busy).toBe(true);expect(journal.save).toHaveBeenCalledOnce();
  journal={...journal,state:{...journal.state,bookmarks:[{kind:'google',id}]}};
  await act(async()=>{gate.resolve(true);tree!.update(action());});
  const saved=tree!.root.findAllByType('button').find(node=>node.props.accessibilityLabel===translations.t('journal.remove'))!;
  expect(saved.findAllByType('icon' as React.ElementType).map(node=>node.props.name)).toEqual(['bookmark','checkmark']);
  expect(output()).toContain(translations.t('journal.savedShort'));
  expect(saved.props.accessibilityState.busy).toBe(false);
});

it.each([['en','Google Maps · Open to load details'],['ja','Google Maps · 開いて詳細を読み込めます'],['ko','Google Maps · 열어서 상세 정보 불러오기']])('describes the explicit Details loading step in %s', async (locale,copy) => {
 await translations.changeLanguage(locale);await mount();
 expect(output()).toContain(copy);
});
