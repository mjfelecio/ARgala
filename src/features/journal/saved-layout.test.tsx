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
it.each(['en', 'ja', 'ko'])('keeps %s long identifiers accessible and Open dominant without fetching', async locale => {
  const fetch = vi.spyOn(globalThis, 'fetch');
  await translations.changeLanguage(locale); await mount();
  const identifier = tree!.root.findAllByType('text').find(node => node.props.children === id)!;
  expect(identifier.props.numberOfLines).toBe(2);
  expect(identifier.props.accessibilityLabel).toBe(id);
  const open = tree!.root.findAllByType('button').find(node => node.props.accessibilityLabel === translations.t('journal.open'))!;
  const remove = tree!.root.findAllByType('button').find(node => node.props.accessibilityLabel === translations.t('journal.remove'))!;
  expect(remove.props.className).toContain('ghost');
  await act(async () => open.props.onPress());
  expect(router.push).toHaveBeenCalledWith({ pathname: '/place/[providerId]', params: { providerId: id } });
  await act(async () => { await remove.props.onPress(); });
  expect(journal.save).toHaveBeenCalledExactlyOnceWith({ kind: 'google', id }, false);
  await act(async () => { await translations.changeLanguage(locale === 'en' ? 'ja' : 'en'); });
  expect(output()).toContain(translations.t('journal.open'));
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
