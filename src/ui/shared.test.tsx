import * as React from 'react';
import { createInstance } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { localizationOptions } from '@/i18n/options';
import { withHeroUI } from '@/test/native-ui';
import { LocationStatus } from '@/features/location/status';
import type { useDeviceLocation } from '@/features/location/use-device-location';
import { Action, Notice, Screen } from './shared';

let tree: ReactTestRenderer | undefined;
let i18n: Awaited<ReturnType<typeof createI18n>>;
async function createI18n() {
  const instance = createInstance();
  await instance.use(initReactI18next).init({ ...localizationOptions, lng: 'en', react: { useSuspense: false } });
  return instance;
}
function render(children: React.ReactNode) {
  return withHeroUI(<I18nextProvider i18n={i18n}>{children}</I18nextProvider>);
}
function location(status: 'error' | 'disabled' | 'ready', errorCode: unknown = 'timeout', retry = vi.fn()) {
  return { status, errorCode, retry } as unknown as ReturnType<typeof useDeviceLocation>;
}

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true, __DEV__: false });
  i18n = await createI18n();
  const original = console.error;
  vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    if (!String(args[0]).startsWith('react-test-renderer is deprecated')) original(...args);
  });
});
afterEach(async () => {
  await act(async () => tree?.unmount());
  tree = undefined;
  vi.restoreAllMocks();
});

it('uses app tokens and keeps the status message polite and scrollable', async () => {
  await act(async () => {
    tree = create(render(<Screen><Notice busy>Location is unavailable.</Notice></Screen>));
  });
  const safeArea = tree!.root.findByType('safe-area' as React.ElementType);
  expect(safeArea.props.className).toContain('bg-page-mint');
  const scroll = tree!.root.findByType('scroll' as React.ElementType);
  expect(scroll.props.contentContainerClassName).toContain('gap-4');
  expect(scroll.props.keyboardShouldPersistTaps).toBe('handled');
  const text = tree!.root.findAllByType('text').find(node => node.props.children === 'Location is unavailable.');
  expect(text?.props.accessibilityLiveRegion).toBe('polite');
  expect(JSON.stringify(tree!.toJSON())).toContain('surface__root--variant-secondary');
});

it('renders a localized location failure, exposes enabled Retry, and clears it after recovery', async () => {
  const retry = vi.fn();
  await act(async () => {
    tree = create(render(<LocationStatus location={location('error', 'timeout', retry)} />));
  });
  expect(JSON.stringify(tree!.toJSON())).toContain(i18n.t('location.timeout'));
  const retryButton = tree!.root.findAllByType('button').find(node => node.props.accessibilityLabel === i18n.t('location.retry'));
  expect(retryButton).toBeDefined();
  expect(retryButton!.props.disabled ?? retryButton!.props.isDisabled).not.toBe(true);
  await act(async () => retryButton!.props.onPress());
  expect(retry).toHaveBeenCalledOnce();
  await act(async () => tree!.update(render(<LocationStatus location={location('ready')} />)));
  expect(tree!.root.findAllByType('button')).toHaveLength(0);
  expect(JSON.stringify(tree!.toJSON())).not.toContain(i18n.t('location.timeout'));
});

it('uses the generic localized fallback for an unknown location failure', async () => {
  await act(async () => {
    tree = create(render(<LocationStatus location={location('error', 'future-native-error')} />));
  });
  expect(JSON.stringify(tree!.toJSON())).toContain(i18n.t('location.unavailable'));
  expect(JSON.stringify(tree!.toJSON())).not.toContain('future-native-error');
});

it('preserves disabled actions and localized labels in the HeroUI action', async () => {
  const onPress = vi.fn();
  await act(async () => {
    tree = create(render(<Action title={i18n.t('common.retry')} onPress={onPress} disabled />));
  });
  const button = tree!.root.findAllByType('button').find(node => node.props.accessibilityLabel === i18n.t('common.retry'))!;
  expect(button.props.disabled ?? button.props.isDisabled).toBe(true);
  expect(button.props.onPress).toBe(onPress);
});
