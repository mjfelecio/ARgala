import * as React from 'react';
import { createInstance } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { getCurrentPositionAsync } from 'expo-location';
import { localizationOptions } from '@/i18n/options';
import { LocationStatus } from './status';
import { useDeviceLocation } from './use-device-location';

vi.mock('expo-location', () => ({
  Accuracy: { High: 4 },
  requestForegroundPermissionsAsync: vi.fn(async () => ({ granted: true, canAskAgain: true })),
  hasServicesEnabledAsync: vi.fn(async () => true),
  getCurrentPositionAsync: vi.fn(),
  watchPositionAsync: vi.fn(async () => ({ remove: vi.fn() })),
}));
vi.mock('@/lib/use-app-active', () => ({ useAppActive: () => true }));
vi.mock('expo-router', async () => {
  const { useEffect } = await import('react');
  return { useFocusEffect: (callback: () => void) => useEffect(callback, [callback]) };
});
vi.mock('react-native', () => ({ Alert: { alert: vi.fn() }, Linking: { openSettings: vi.fn() } }));
vi.mock('@/ui/shared', async () => {
  const { createElement } = await import('react');
  return { Notice: 'output', Action: (props: Record<string, unknown>) => createElement('button', props) };
});
function Probe() { return React.createElement(LocationStatus, { location: useDeviceLocation() }); }
let tree: ReactTestRenderer | undefined;
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  vi.useFakeTimers();
  vi.mocked(getCurrentPositionAsync).mockReset().mockImplementation(() => new Promise(() => {}));
  const original = console.error;
  vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => { if (!String(args[0]).startsWith('react-test-renderer is deprecated')) original(...args); });
});
afterEach(async () => {
  await act(async () => tree?.unmount()); tree = undefined;
  vi.clearAllTimers(); vi.useRealTimers(); vi.restoreAllMocks();
});
it.each([
  { language: 'en', message: 'Location timed out. Try outdoors with location services enabled.' },
  { language: 'ko', message: '위치 확인 시간이 초과되었습니다. 위치 서비스를 켜고 야외에서 다시 시도하세요.' },
  { language: 'ja', message: '位置情報の取得がタイムアウトしました。位置情報サービスを有効にして、屋外で再試行してください。' },
])('renders the actual GPS timeout in $language and clears it after a successful retry', async ({ language, message }) => {
  const i18n = createInstance();
  await i18n.use(initReactI18next).init({ ...localizationOptions, lng: language, react: { useSuspense: false } });
  await act(async () => { tree = create(React.createElement(I18nextProvider, { i18n }, React.createElement(Probe))); });
  await act(async () => { await vi.advanceTimersByTimeAsync(15000); });
  expect(tree!.root.findByType('output').props.children).toBe(message);
  vi.mocked(getCurrentPositionAsync).mockResolvedValue({
    coords: { latitude: 11.01, longitude: 124.61, accuracy: 8, altitude: null, altitudeAccuracy: null, heading: null, speed: null }, timestamp: 1,
  });
  await act(async () => { tree!.root.findByType('button').props.onPress(); });
  expect(tree!.root.findAllByType('output')).toHaveLength(0);
  expect(vi.getTimerCount()).toBe(0);
});
