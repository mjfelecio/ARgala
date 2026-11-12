import { withHeroUI } from '@/test/native-ui';
import * as React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { createInstance } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { expect, it, vi } from 'vitest';
import { localizationOptions } from '@/i18n/options';
import { ViroRingRoute } from './dev-entry';
const native = vi.hoisted(() => ({ module: Promise.withResolvers<void>(), principal: 'owner' as string | null }));
vi.mock('@/features/auth/provider', () => ({ useAuth: () => ({ session: native.principal ? { user: { id: native.principal } } : null }) }));
vi.mock('expo-router', () => ({ router: { back: vi.fn(), canGoBack: () => true, navigate: vi.fn(), push: vi.fn() } }));
vi.mock('./destination-ar-session-screen', async () => { await native.module.promise; return { default: () => React.createElement('loaded-session') }; });

it('bounds the outer route import, localizes recovery and retires a late module until explicit Retry', async () => {
  Object.assign(globalThis, { __DEV__: true, IS_REACT_ACT_ENVIRONMENT: true }); vi.stubEnv('EXPO_PUBLIC_VIRO_SPIKE', '1'); vi.useFakeTimers();
  const translations = createInstance(); await translations.use(initReactI18next).init({ ...localizationOptions, resources: structuredClone(localizationOptions.resources), lng: 'en', react: { useSuspense: false } });
  const view = () => React.createElement(I18nextProvider, { i18n: translations }, withHeroUI(React.createElement(ViroRingRoute)));
  let tree: ReactTestRenderer | undefined;
  try {
    await act(async () => { tree = create(view()); });
    await act(async () => { await vi.advanceTimersByTimeAsync(20000); });
    const button = (key: string) => tree!.root.findAllByType('button').find(value => value.props.accessibilityLabel === translations.t(key));
    expect(button('common.retry')).toBeDefined(); expect(button('common.back')).toBeDefined();
    for (const locale of ['en', 'ja', 'ko']) {
      await act(async () => { await translations.changeLanguage(locale); });
      expect(translations.getResource(locale, 'translation', 'destinationRing.previewLoadFailed')).toBeTruthy();
      expect(JSON.stringify(tree!.toJSON())).toContain(translations.t('destinationRing.previewLoadFailed'));
    }
    await act(async () => { native.module.resolve(); await vi.dynamicImportSettled(); });
    expect(tree!.root.findAllByType('loaded-session' as React.ElementType)).toHaveLength(0);
    await act(async () => button('common.retry')!.props.onPress());
    await act(async () => { await vi.dynamicImportSettled(); });
    expect(tree!.root.findAllByType('loaded-session' as React.ElementType)).toHaveLength(1);
    native.principal = null; await act(async () => tree!.update(view()));
    expect(tree!.root.findAllByType('loaded-session' as React.ElementType)).toHaveLength(0);
  } finally { await act(async () => tree?.unmount()); vi.useRealTimers(); vi.unstubAllEnvs(); }
});
