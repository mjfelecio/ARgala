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
  const render = (ready: boolean) => <I18nextProvider i18n={i18n}>{withHeroUI(<ArrivalInvitation state={state} contentReady={ready} onLaunch={launch} onDismiss={dismiss} />)}</I18nextProvider>;
  try {
    await act(async () => { tree = create(render(false)); });
    expect(JSON.stringify(tree!.toJSON())).toContain(i18n.t('arrival.contentPending'));
    expect(launch).not.toHaveBeenCalled();
    await act(async () => tree!.update(render(true)));
    const button = (key: string) => tree!.root.findAllByType('button').find(b => b.props.accessibilityLabel === i18n.t(key))!;
    await act(async () => button('arrival.launch').props.onPress()); expect(launch).toHaveBeenCalledOnce();
    await act(async () => button('arrival.dismiss').props.onPress()); expect(dismiss).toHaveBeenCalledOnce();
    expect(i18n.t('arrival.eligible')).not.toBe('arrival.eligible');
  } finally { await act(async () => tree!.unmount()); spy.mockRestore(); }
});
