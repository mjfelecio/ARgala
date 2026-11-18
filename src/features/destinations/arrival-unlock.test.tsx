import { withHeroUI } from '@/test/native-ui';
import * as React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { BackHandler } from 'react-native';
import * as Reanimated from 'react-native-reanimated';
import { PortalHost } from 'heroui-native/portal';
import { createInstance } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { localizationOptions } from '@/i18n/options';
import { ArrivalUnlock } from './arrival-unlock';

let tree: ReactTestRenderer | undefined;
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true, __DEV__: false });
  vi.useFakeTimers();
  const original = console.error;
  vi.spyOn(console, 'error').mockImplementation((...args) => {
    if (!String(args[0]).startsWith('react-test-renderer is deprecated')) original(...args);
  });
});
afterEach(async () => { await act(async () => tree?.unmount()); tree = undefined; vi.useRealTimers(); vi.restoreAllMocks(); });

async function setup(language: 'en' | 'ja' | 'ko' = 'en') {
  const i18n = createInstance();
  await i18n.use(initReactI18next).init({ ...localizationOptions, lng: language, react: { useSuspense: false } });
  const claimUnlock = vi.fn().mockReturnValueOnce(true).mockReturnValue(false);
  const onLaunch = vi.fn();
  const view = (eligible: boolean) => <I18nextProvider i18n={i18n}>{withHeroUI(<>
    <ArrivalUnlock eligible={eligible} destinationTitle="Synthetic destination" language={language} claimUnlock={claimUnlock} onLaunch={onLaunch} />
    <PortalHost />
  </>)}</I18nextProvider>;
  const button = (key: string) => tree!.root.findAllByType('button').find(node => node.props.accessibilityLabel === i18n.t(key));
  const find = (testID: string) => tree!.root.findAllByProps({ testID });
  return { view, button, find, claimUnlock, onLaunch, i18n };
}

it('presents medallion, confetti, then Start AR, without launching automatically', async () => {
  vi.spyOn(Reanimated, 'useReducedMotion').mockReturnValue(false);
  const { view, button, find, claimUnlock, onLaunch } = await setup();
  await act(async () => { tree = create(view(false)); });
  expect(claimUnlock).not.toHaveBeenCalled();
  await act(async () => tree!.update(view(true)));
  expect(find('arrival-unlock-medallion')[0]?.props.entering).toBeInstanceOf(Reanimated.Keyframe);
  expect(find('arrival-unlock-confetti')).toHaveLength(0);
  expect(button('arrival.unlockStart')).toBeUndefined();
  await act(async () => { vi.advanceTimersByTime(160); });
  expect(find('arrival-unlock-confetti')).toHaveLength(1);
  expect(button('arrival.unlockStart')).toBeUndefined();
  await act(async () => { vi.advanceTimersByTime(280); });
  expect(find('arrival-unlock-confetti')).toHaveLength(0);
  expect(onLaunch).not.toHaveBeenCalled();
  const start = button('arrival.unlockStart')!.props.onPress;
  await act(async () => { start(); start(); });
  expect(onLaunch).toHaveBeenCalledOnce();
  expect(find('arrival-unlock-medallion')).toHaveLength(0);
});

it.each(['en', 'ja', 'ko'] as const)('reveals localized %s actions immediately with reduced motion and handles Android Back', async language => {
  const back = vi.spyOn(BackHandler, 'addEventListener');
  const { view, button, find, claimUnlock, onLaunch, i18n } = await setup(language);
  await act(async () => { tree = create(view(true)); });
  for (const key of ['arrival.unlockTitle', 'arrival.unlockStart', 'arrival.dismiss']) expect(i18n.t(key)).not.toBe(key);
  expect(button('arrival.unlockStart')).toBeDefined();
  expect(find('arrival-unlock-medallion')[0]?.props.entering).toBeUndefined();
  expect(find('arrival-unlock-confetti')).toHaveLength(0);
  const start = button('arrival.unlockStart')!.props.onPress;
  await act(async () => { expect(back.mock.calls.at(-1)![1]({ type: 'hardwareBackPress', timeStamp: Date.now() })).toBe(true); });
  await act(async () => { start(); tree!.update(view(false)); });
  await act(async () => tree!.update(view(true)));
  expect(button('arrival.unlockStart')).toBeUndefined();
  expect(claimUnlock).toHaveBeenCalledTimes(2);
  expect(onLaunch).not.toHaveBeenCalled();
});

it('retires the Start action when eligibility is lost', async () => {
  const { view, button, onLaunch } = await setup();
  await act(async () => { tree = create(view(true)); });
  const start = button('arrival.unlockStart')!.props.onPress;
  await act(async () => tree!.update(view(false)));
  expect(button('arrival.unlockStart')).toBeUndefined();
  await act(async () => start());
  expect(onLaunch).not.toHaveBeenCalled();
});
