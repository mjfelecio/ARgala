import { withHeroUI } from '@/test/native-ui';
import * as React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { createInstance, type i18n } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { localizationOptions } from '@/i18n/options';
import { useArIntroduction } from './use-ar-introduction';
import { ArIntroductionNotice } from './ar-introduction-notice';
const storage = vi.hoisted(() => ({ getItem: vi.fn(), setItem: vi.fn() }));
vi.mock('@react-native-async-storage/async-storage', () => ({ default: storage }));
let tree: ReactTestRenderer | undefined; let current: ReturnType<typeof useArIntroduction>; let translations: i18n;
function Probe() { const introduction = useArIntroduction(); React.useEffect(() => { current = introduction; }); return React.createElement(ArIntroductionNotice, { introduction }); }
const wrapper = () => React.createElement(I18nextProvider, { i18n: translations }, withHeroUI(React.createElement(Probe)));
async function mount() { await act(async () => { tree = create(wrapper()); }); }
const copy = () => JSON.stringify(tree!.toJSON());
async function retry() { await act(async () => tree!.root.findAllByType('button').find(node => node.props.accessibilityLabel === translations.t('common.retry'))!.props.onPress()); }
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true, __DEV__: true }); storage.getItem.mockReset().mockResolvedValue(null); storage.setItem.mockReset().mockResolvedValue(undefined);
  translations = createInstance(); await translations.use(initReactI18next).init({ ...localizationOptions, resources: structuredClone(localizationOptions.resources), lng: 'en', react: { useSuspense: false } });
  const original = console.error; vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => { if (!String(args[0]).startsWith('react-test-renderer is deprecated')) original(...args); });
});
afterEach(async () => { await act(async () => tree?.unmount()); vi.restoreAllMocks(); });
it('uses only a dedicated completion flag and does not write on read', async () => {
  await mount(); expect(current.seen).toBe(false); expect(storage.setItem).not.toHaveBeenCalled();
  await act(async () => current.complete()); expect(current.seen).toBe(true);
  expect(storage.setItem).toHaveBeenCalledExactlyOnceWith('argala.ar-introduction.v1', 'complete');
});
it('recognizes completion and treats unknown values as incomplete without rewriting them', async () => {
  storage.getItem.mockResolvedValue('complete'); await mount(); expect(current.seen).toBe(true);
  await act(async () => tree!.unmount()); storage.getItem.mockResolvedValue('invalid'); await mount(); expect(current.seen).toBe(false); expect(storage.setItem).not.toHaveBeenCalled();
});
it('does not let a late initial read undo explicit completion', async () => {
  const read = Promise.withResolvers<string | null>(); storage.getItem.mockReturnValueOnce(read.promise); await mount();
  await act(async () => current.complete()); await act(async () => read.resolve(null)); expect(current.seen).toBe(true);
});
it('keeps queued completion writes owned across remounts before another read', async () => {
  const write = Promise.withResolvers<void>(); storage.setItem.mockReturnValueOnce(write.promise); await mount();
  await act(async () => { void current.complete(); }); await act(async () => tree!.unmount()); await mount();
  expect(storage.getItem).toHaveBeenCalledOnce(); storage.getItem.mockResolvedValue('complete');
  await act(async () => write.resolve()); expect(current.seen).toBe(true);
});
it.each(['en', 'ja', 'ko'].flatMap(locale => ['load', 'save'].map(operation => [locale, operation])))('shows actual %s %s errors, recovery and language changes without native messages', async (locale, operation) => {
  await translations.changeLanguage(locale);
  if (operation === 'load') storage.getItem.mockRejectedValueOnce(new Error('PRIVATE_STORAGE_MESSAGE'));
  else storage.setItem.mockRejectedValueOnce(new Error('PRIVATE_STORAGE_MESSAGE'));
  await mount(); if (operation === 'save') await act(async () => current.complete());
  expect(copy()).toContain(translations.t(`destinationSession.intro.${operation}-failed`)); expect(copy()).not.toContain('PRIVATE_STORAGE_MESSAGE');
  await act(async () => { await translations.changeLanguage(locale === 'en' ? 'ja' : 'en'); });
  expect(copy()).toContain(translations.t(`destinationSession.intro.${operation}-failed`));
  await retry(); expect(current.error).toBeNull();
});
