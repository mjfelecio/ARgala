import * as React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { createInstance } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { expect, it, vi } from 'vitest';
import { withHeroUI } from '@/test/native-ui';
import { localizationOptions } from '@/i18n/options';
import { ArrivalInvitation } from './arrival-invitation';
import type { ArrivalSnapshot } from './proximity';
const state: ArrivalSnapshot = { destinationId: 'pilot-aclc', status: 'eligible', eligible: true, showInvitation: true, milestone: 'arrived' };
it.each(['en', 'ko', 'ja'])('localizes arrival, missing content and launch/dismiss in %s without automatic launch', async language => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true, __DEV__: false });
  const original = console.error; const spy = vi.spyOn(console, 'error').mockImplementation((...args) => { if (!String(args[0]).startsWith('react-test-renderer is deprecated')) original(...args); });
  const i18n = createInstance(); await i18n.use(initReactI18next).init({ ...localizationOptions, lng: language, react: { useSuspense: false } });
  const launch = vi.fn(); const dismiss = vi.fn(); let tree: ReactTestRenderer;
  const render = (ready: boolean) => <I18nextProvider i18n={i18n}>{withHeroUI(<ArrivalInvitation state={state} destinationTitle="Synthetic destination" chapterCount={5} contentReady={ready} onLaunch={launch} onDismiss={dismiss} />)}</I18nextProvider>;
  try {
    await act(async () => { tree = create(render(false)); });
    expect(JSON.stringify(tree!.toJSON())).toContain(i18n.t('arrival.contentPending'));
    expect(launch).not.toHaveBeenCalled();
    await act(async () => tree!.update(render(true)));
    expect(JSON.stringify(tree!.toJSON())).not.toContain('Synthetic destination');
    expect(JSON.stringify(tree!.toJSON())).toContain(i18n.t('destinationCleanup.arReady'));
    expect(tree!.root.findByProps({ testID: 'arrival-invitation' }).props.className).not.toContain('bg-mint');
    expect(tree!.root.findByProps({ testID: 'arrival-status-medallion' })).toBeDefined();
    expect(JSON.stringify(tree!.toJSON())).toContain(i18n.t('destinationStories.available', { count: 5 }));
    const button = (key: string) => tree!.root.findAllByType('button').find(b => b.props.accessibilityLabel === i18n.t(key))!;
    await act(async () => button('arrival.launch').props.onPress()); expect(launch).toHaveBeenCalledOnce();
    await act(async () => button('arrival.dismiss').props.onPress()); expect(dismiss).toHaveBeenCalledOnce();
    expect(i18n.t('arrival.eligible')).not.toBe('arrival.eligible');
  } finally { await act(async () => tree!.unmount()); spy.mockRestore(); }
});
it('keeps every live arrival state localized without exposing entry until an invitation is offered', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true, __DEV__: false });
  const translations = createInstance(); await translations.use(initReactI18next).init({ ...localizationOptions, lng: 'en', react: { useSuspense: false } });
  const launch = vi.fn(); let tree: ReactTestRenderer | undefined;
  const render = (snapshot: ArrivalSnapshot | null) => <I18nextProvider i18n={translations}>{withHeroUI(<ArrivalInvitation state={snapshot} contentReady onLaunch={launch} onDismiss={() => {}} />)}</I18nextProvider>;
  try {
    await act(async () => { tree = create(render(null)); });
    expect(tree!.root.findAllByProps({testID:'arrival-invitation'})).toHaveLength(0);
    for (const language of ['en', 'ja', 'ko']) {
      await act(async () => { await translations.changeLanguage(language); });
      for (const status of ['unavailable', 'uncertain', 'distant', 'approaching', 'near', 'checking', 'eligible'] as const) {
        await act(async () => tree!.update(render({ ...state, status, showInvitation: false, eligible: status === 'eligible' })));
        const copy = tree!.root.findAllByType('text').map(node => node.props.children);
        expect(copy).toContain(translations.t(`arrival.${status}`));
        expect(translations.t(`arrival.${status}`)).not.toBe(`arrival.${status}`);
        expect(tree!.root.findAllByType('button')).toHaveLength(0);
      }
    }
    expect(launch).not.toHaveBeenCalled();
  } finally { await act(async () => tree?.unmount()); }
});
it.each(['en', 'ja', 'ko'])('labels %s development entry explicitly and keeps the eligibility and callback guards', async language => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true, __DEV__: false });
  const translations = createInstance(); await translations.use(initReactI18next).init({ ...localizationOptions, lng: language, react: { useSuspense: false } });
  const launch = vi.fn(); let tree: ReactTestRenderer | undefined;
  const render = (eligible: boolean, callback: (() => void) | undefined = launch) => <I18nextProvider i18n={translations}>{withHeroUI(<ArrivalInvitation state={{ ...state, eligible }} contentReady={false} draft onLaunch={callback} onDismiss={() => {}} />)}</I18nextProvider>;
  try {
    await act(async () => { tree = create(render(true)); });
    expect(JSON.stringify(tree!.toJSON())).toContain(translations.t('destinationCleanup.arPreview'));
    expect(JSON.stringify(tree!.toJSON())).toContain(translations.t('destinationCleanup.arPreviewHint'));
    const launchButton = () => tree!.root.findAllByType('button').find(node => node.props.accessibilityLabel === translations.t('destinationCleanup.launchPreview'))!;
    expect(launch).not.toHaveBeenCalled();
    await act(async () => tree!.update(render(false)));
    expect(launchButton().props.disabled).toBe(true);
    await act(async () => tree!.update(render(true)));
    await act(async () => launchButton().props.onPress());
    expect(launch).toHaveBeenCalledOnce();
    await act(async () => tree!.update(<I18nextProvider i18n={translations}>{withHeroUI(<ArrivalInvitation state={state} contentReady onDismiss={() => {}} />)}</I18nextProvider>));
    expect(tree!.root.findAllByType('button').some(node => node.props.accessibilityLabel === translations.t('arrival.launch'))).toBe(false);
  } finally { await act(async () => tree?.unmount()); }
});
