import { nativeUi, withHeroUI } from '@/test/native-ui';
import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { createInstance, type i18n } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { localizationOptions } from '@/i18n/options';
import { JournalContext, type JournalContextValue } from '@/features/journal/context';
import { ProfileSettingsContent } from './profile-settings-content';
import { router } from 'expo-router';

vi.mock('expo-router', () => ({ useIsFocused: () => true, router: { push: vi.fn(), back: vi.fn(), canGoBack: () => true, navigate: vi.fn() } }));
vi.mock('@/features/settings/provider', () => ({ useSettings: () => ({ language: 'en', activationRadiusMeters: 100, storageError: null, save: vi.fn() }) }));
vi.mock('@/features/auth/provider', () => ({ useAuth: () => ({ session: null }) }));
vi.mock('@/features/auth/sign-out-action', () => ({ SignOutAction: () => null }));
vi.mock('@/features/arrival-reminders/provider', () => ({ useArrivalReminders: () => null }));
vi.mock('expo-constants', () => ({ default: { expoConfig: { version: '1.0.0' } } }));

let tree: ReactTestRenderer | undefined;
let translations: i18n;
const journal: JournalContextValue = {
  principalId: 'guest', ready: true, error: null, state: { version: 1, bookmarks: [], stamps: [] },
  sync: { phase: 'local' }, syncNow() {}, retry() {}, save: async () => true, award: async () => true,
};
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true, __DEV__: false });
  nativeUi.fontScale = 1.6;
  translations = createInstance();
  await translations.use(initReactI18next).init({ ...localizationOptions, lng: 'en', react: { useSuspense: false } });
});
afterEach(async () => { await act(async () => tree?.unmount()); tree = undefined; nativeUi.fontScale = 1; vi.unstubAllEnvs(); });

it('offers only the retained ring prototype in the development Profile', async () => {
  Object.assign(globalThis, { __DEV__: true }); vi.stubEnv('EXPO_PUBLIC_VIRO_SPIKE', '1');
  vi.mocked(router.push).mockClear();
  await act(async () => { tree = create(withHeroUI(<I18nextProvider i18n={translations}><JournalContext.Provider value={journal}><ProfileSettingsContent entry="tab" /></JournalContext.Provider></I18nextProvider>)); });
  for (const locale of ['en', 'ja', 'ko']) {
    await act(async () => { await translations.changeLanguage(locale); });
    const labels = tree!.root.findAllByType('button').map(node => node.props.accessibilityLabel);
    expect(labels).not.toContain(translations.t('destinationAr.title'));
    expect(labels).toContain(translations.t('destinationRing.title'));
  }
  await act(async () => tree!.root.findAllByType('button').find(node => node.props.accessibilityLabel === translations.t('destinationRing.title'))!.props.onPress());
  expect(router.push).toHaveBeenCalledExactlyOnceWith('/viro-ring');
});

it.each(['tab', 'stack'] as const)('keeps growing guest content and settings in one scroll owner on %s', async entry => {
  await act(async () => { tree = create(withHeroUI(<I18nextProvider i18n={translations}><JournalContext.Provider value={journal}><ProfileSettingsContent entry={entry} /></JournalContext.Provider></I18nextProvider>)); });
  for (const locale of ['en', 'ja', 'ko']) {
    await act(async () => { await translations.changeLanguage(locale); });
    const scrolls = tree!.root.findAllByType('scroll' as React.ElementType);
    expect(scrolls).toHaveLength(1);
    const scroll = scrolls[0];
    for (const key of ['journal.savedTitle', 'journal.signIn', 'common.save']) {
      expect(scroll.findAllByType('button').some(node => node.props.accessibilityLabel === translations.t(key)), key).toBe(true);
    }
    expect(scroll.findAllByType('text').some(node => node.props.children === translations.t('journal.guestNote'))).toBe(true);
    expect(scroll.findAllByType('text').some(node => node.props.children === translations.t('settings.profileTitle'))).toBe(false);
    expect(scroll.props.keyboardShouldPersistTaps).toBe('handled');
    expect(tree!.root.findAllByType('safe-area' as React.ElementType).at(-1)!.props.edges).toEqual(entry === 'tab' ? ['top', 'left', 'right'] : ['top', 'bottom', 'left', 'right']);
  }
});

it('groups the actual identity and actionable Saved row, keeping decorative icons out of accessibility', async () => {
 await act(async()=>{tree=create(withHeroUI(<I18nextProvider i18n={translations}><JournalContext.Provider value={journal}><ProfileSettingsContent entry="tab" /></JournalContext.Provider></I18nextProvider>));});
 const group=tree!.root.findByProps({testID:'profile-identity-group'});
 expect(group.findAllByType('text').some(node=>node.props.children===translations.t('settings.myAccount'))).toBe(true);
 const saved=group.findAllByType('button').find(node=>node.props.accessibilityLabel===translations.t('journal.savedTitle'))!;
 expect(saved.findAllByType('icon' as React.ElementType).map(node=>node.props.name)).toEqual(['bookmark-outline','chevron-forward']);
 expect(saved.findAllByType('icon' as React.ElementType).every(node=>node.props.accessible===false)).toBe(true);
});
