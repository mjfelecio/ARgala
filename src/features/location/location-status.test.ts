import * as React from 'react';
import { createInstance } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { getCurrentPositionAsync, getForegroundPermissionsAsync, hasServicesEnabledAsync, requestForegroundPermissionsAsync, watchHeadingAsync, watchPositionAsync } from 'expo-location';
import { localizationOptions } from '@/i18n/options';
import { LocationStatus } from './status';
import { useDeviceLocation } from './use-device-location';

const foreground = vi.hoisted(() => ({ active: true, activateDuringSubscribe: false, listeners: new Set<(state: string) => void>() }));
vi.mock('expo-location', () => ({
  Accuracy: { High: 4 },
  getForegroundPermissionsAsync: vi.fn(async () => ({ granted: false, canAskAgain: true, status: 'undetermined' })),
  requestForegroundPermissionsAsync: vi.fn(async () => ({ granted: true, canAskAgain: true })),
  hasServicesEnabledAsync: vi.fn(async () => true),
  getCurrentPositionAsync: vi.fn(),
  watchPositionAsync: vi.fn(async () => ({ remove: vi.fn() })),
  watchHeadingAsync: vi.fn(async () => ({ remove: vi.fn() })),
}));
vi.mock('expo-router', async () => {
  const { useEffect } = await import('react');
  return { useIsFocused: () => true, useFocusEffect: (callback: () => void) => useEffect(callback, [callback]) };
});
vi.mock('react-native', () => ({ Text: 'text', Alert: { alert: vi.fn() }, Linking: { openSettings: vi.fn() }, AppState: {
  get currentState() { return foreground.active ? 'active' : 'background'; },
  addEventListener: (_event: string, listener: (state: string) => void) => {
    if (foreground.activateDuringSubscribe) foreground.active = true;
    foreground.listeners.add(listener);
    return { remove: () => foreground.listeners.delete(listener) };
  },
} }));
vi.mock('@/ui/shared', async () => {
  const { createElement } = await import('react');
  return { Notice: 'output', Action: (props: Record<string, unknown>) => createElement('button', props) };
});
function Probe({ heading = false }: { heading?: boolean }) { return React.createElement(LocationStatus, { location: useDeviceLocation({ heading }) }); }
let tree: ReactTestRenderer | undefined;
const fix: Awaited<ReturnType<typeof getCurrentPositionAsync>> = {
  coords: { latitude: 11.01, longitude: 124.61, accuracy: 8, altitude: null, altitudeAccuracy: null, heading: null, speed: null }, timestamp: 1,
};
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true, __DEV__: false });
  vi.useFakeTimers();
  foreground.active = true; foreground.activateDuringSubscribe = false;
  foreground.listeners.clear();
  vi.mocked(getCurrentPositionAsync).mockReset().mockImplementation(() => new Promise(() => {}));
  vi.mocked(watchPositionAsync).mockClear();
  vi.mocked(watchHeadingAsync).mockClear();
  const original = console.error;
  vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => { if (!String(args[0]).startsWith('react-test-renderer is deprecated')) original(...args); });
});
it('starts GPS without reopening after a foreground subscription race', async () => {
  foreground.active = false; foreground.activateDuringSubscribe = true;
  vi.mocked(getCurrentPositionAsync).mockResolvedValueOnce(fix);
  const i18n = createInstance();
  await i18n.use(initReactI18next).init({ ...localizationOptions, lng: 'en', react: { useSuspense: false } });
  await act(async () => { tree = create(React.createElement(I18nextProvider, { i18n }, React.createElement(Probe))); });
  expect(tree!.root.findByType(LocationStatus).props.location.status).toBe('ready');
  expect(tree!.root.findAllByType('output')).toHaveLength(0);
});
it('shows the developer startup marker with focus and phase without location data', async () => {
  Object.assign(globalThis, { __DEV__: true });
  const trace = vi.spyOn(console, 'info').mockImplementation(() => {});
  const i18n = createInstance();
  await i18n.use(initReactI18next).init({ ...localizationOptions, lng: 'en', react: { useSuspense: false } });
  await act(async () => { tree = create(React.createElement(I18nextProvider, { i18n }, React.createElement(Probe))); });
  const debug = JSON.parse(tree!.root.findByType('text').props.children);
  expect(debug).toEqual({ sensorDebug: 3, active: true, focused: true, phase: 'position', status: 'loading', watcherStatus: 'pending', errorCode: null });
  expect(trace).toHaveBeenCalledWith('[ARgala sensor startup v3]', expect.objectContaining({ active: true, focused: true, phase: 'position' }));
  expect(JSON.stringify(trace.mock.calls)).not.toContain('latitude');
  expect(JSON.stringify(trace.mock.calls)).not.toContain('longitude');
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
  vi.mocked(getCurrentPositionAsync).mockResolvedValue(fix);
  await act(async () => { tree!.root.findByType('button').props.onPress(); });
  expect(tree!.root.findAllByType('output')).toHaveLength(0);
  expect(vi.getTimerCount()).toBe(0);
});
it.each(['permission', 'services'] as const)('times out a stalled %s check and ignores its late completion', async (stage) => {
  const permission = Promise.withResolvers<Awaited<ReturnType<typeof requestForegroundPermissionsAsync>>>();
  const services = Promise.withResolvers<boolean>();
  if (stage === 'permission') vi.mocked(requestForegroundPermissionsAsync).mockReturnValueOnce(permission.promise);
  else vi.mocked(hasServicesEnabledAsync).mockReturnValueOnce(services.promise);
  const i18n = createInstance();
  await i18n.use(initReactI18next).init({ ...localizationOptions, lng: 'en', react: { useSuspense: false } });
  await act(async () => { tree = create(React.createElement(I18nextProvider, { i18n }, React.createElement(Probe))); });
  const watchCount = vi.mocked(watchPositionAsync).mock.calls.length;
  await act(async () => { await vi.advanceTimersByTimeAsync(15000); });
  expect(tree!.root.findByType('output').props.children).toBe('Location timed out. Try outdoors with location services enabled.');
  await act(async () => {
    permission.resolve({ granted: true, canAskAgain: true, status: 'granted', expires: 'never' } as Awaited<ReturnType<typeof requestForegroundPermissionsAsync>>);
    services.resolve(true);
  });
  expect(watchPositionAsync).toHaveBeenCalledTimes(watchCount);
  expect(tree!.root.findByType(LocationStatus).props.location.status).toBe('error');
  vi.mocked(getCurrentPositionAsync).mockResolvedValueOnce(fix);
  await act(async () => { tree!.root.findByType('button').props.onPress(); });
  expect(tree!.root.findAllByType('output')).toHaveLength(0);
  expect(vi.getTimerCount()).toBe(0);
});
it('removes late watcher setup and ignores a late fix after the startup deadline', async () => {
  const watch = Promise.withResolvers<Awaited<ReturnType<typeof watchPositionAsync>>>();
  const oneShot = Promise.withResolvers<typeof fix>();
  const remove = vi.fn();
  vi.mocked(watchPositionAsync).mockReturnValueOnce(watch.promise);
  vi.mocked(getCurrentPositionAsync).mockReturnValueOnce(oneShot.promise);
  const i18n = createInstance();
  await i18n.use(initReactI18next).init({ ...localizationOptions, lng: 'en', react: { useSuspense: false } });
  await act(async () => { tree = create(React.createElement(I18nextProvider, { i18n }, React.createElement(Probe))); });
  await act(async () => { await vi.advanceTimersByTimeAsync(15000); });
  expect(tree!.root.findByType(LocationStatus).props.location.errorCode).toBe('timeout');
  await act(async () => { watch.resolve({ remove }); oneShot.resolve(fix); });
  expect(remove).toHaveBeenCalledOnce();
  expect(tree!.root.findByType(LocationStatus).props.location.position).toBeNull();
  expect(tree!.root.findByType(LocationStatus).props.location.errorCode).toBe('timeout');
  expect(vi.getTimerCount()).toBe(0);
});
it.each(['pending', 'ready'] as const)('invalidates a %s heading when GPS startup expires', async (headingStatus) => {
  const permission = Promise.withResolvers<Awaited<ReturnType<typeof requestForegroundPermissionsAsync>>>();
  if (headingStatus === 'pending') vi.mocked(requestForegroundPermissionsAsync).mockReturnValueOnce(permission.promise);
  const i18n = createInstance();
  await i18n.use(initReactI18next).init({ ...localizationOptions, lng: 'en', react: { useSuspense: false } });
  await act(async () => { tree = create(React.createElement(I18nextProvider, { i18n }, React.createElement(Probe, { heading: true }))); });
  if (headingStatus === 'pending') {
    // Start the 10-second heading watchdog later than the overall GPS deadline.
    await act(async () => { await vi.advanceTimersByTimeAsync(8000); permission.resolve({ granted: true, canAskAgain: true } as Awaited<ReturnType<typeof requestForegroundPermissionsAsync>>); });
  } else {
    await act(async () => { vi.mocked(watchHeadingAsync).mock.calls[0][0]({ trueHeading: 90, magHeading: 90, accuracy: 3 }); });
  }
  expect(tree!.root.findByType(LocationStatus).props.location.headingStatus).toBe(headingStatus);
  await act(async () => { await vi.advanceTimersByTimeAsync(headingStatus === 'pending' ? 7000 : 15000); });
  const location = tree!.root.findByType(LocationStatus).props.location;
  expect(location.errorCode).toBe('timeout');
  expect(location.headingStatus).toBe('unavailable');
  expect(location.heading).toBeNull();
  expect(vi.getTimerCount()).toBe(0);
});
it('keeps a watcher fix usable when the one-shot GPS request never resolves', async () => {
  const i18n = createInstance();
  await i18n.use(initReactI18next).init({ ...localizationOptions, lng: 'en', react: { useSuspense: false } });
  await act(async () => { tree = create(React.createElement(I18nextProvider, { i18n }, React.createElement(Probe))); });
  await act(async () => { vi.mocked(watchPositionAsync).mock.calls[0][1](fix); await vi.advanceTimersByTimeAsync(20000); });
  expect(tree!.root.findByType(LocationStatus).props.location.status).toBe('ready');
  expect(vi.getTimerCount()).toBe(0);
});
it('pauses startup while backgrounded and consumes the pending permission result on return', async () => {
  const permission = Promise.withResolvers<Awaited<ReturnType<typeof requestForegroundPermissionsAsync>>>();
  vi.mocked(requestForegroundPermissionsAsync).mockReturnValueOnce(permission.promise);
  const i18n = createInstance();
  await i18n.use(initReactI18next).init({ ...localizationOptions, lng: 'en', react: { useSuspense: false } });
  await act(async () => { tree = create(React.createElement(I18nextProvider, { i18n }, React.createElement(Probe))); });
  await act(async () => { foreground.active = false; foreground.listeners.forEach((listener) => listener('background')); });
  expect(vi.getTimerCount()).toBe(0);
  await act(async () => { await vi.advanceTimersByTimeAsync(20000); });
  vi.mocked(getCurrentPositionAsync).mockResolvedValueOnce(fix);
  await act(async () => { foreground.active = true; foreground.listeners.forEach((listener) => listener('active')); });
  expect(tree!.root.findByType(LocationStatus).props.location.status).toBe('loading');
  await act(async () => { permission.resolve({ granted: true, canAskAgain: true } as Awaited<ReturnType<typeof requestForegroundPermissionsAsync>>); });
  expect(tree!.root.findByType(LocationStatus).props.location.status).toBe('ready');
  expect(vi.getTimerCount()).toBe(0);
});
const failures = [
  { failure: 'permission-check', code: null, message: 'unavailable' },
  { failure: 'permission', code: null, message: 'unavailable' },
  { failure: 'services', code: null, message: 'unavailable' },
  { failure: 'one-shot', code: null, message: 'unavailable' },
  { failure: 'invalid-fix', code: 'invalid-position', message: 'invalid' },
  { failure: 'watcher-setup', code: 'updates-unavailable', message: 'updates' },
  { failure: 'watcher-callback', code: 'updates-unavailable', message: 'updates' },
  { failure: 'invalid-watcher', code: 'invalid-position', message: 'invalid' },
] as const;
const languages = [
  { language: 'ko', messages: { unavailable: '위치 정보를 사용할 수 없습니다.', invalid: '기기에서 올바르지 않은 위치 정보를 받았습니다. 다시 시도하세요.', updates: '실시간 위치 업데이트를 사용할 수 없습니다. 다시 시도하세요.' } },
  { language: 'ja', messages: { unavailable: '位置情報を利用できません。', invalid: '端末から無効な位置情報を受信しました。再試行してください。', updates: '現在地の更新を利用できません。再試行してください。' } },
] as const;
it.each(failures.flatMap((failure) => languages.map(({ language, messages }) => ({ ...failure, language, expected: messages[failure.message] }))))(
  'translates $failure failures in $language and preserves watcher errors after a late fix', async ({ failure, code, language, expected }) => {
    const oneShot = Promise.withResolvers<typeof fix>();
    vi.mocked(getCurrentPositionAsync).mockReturnValue(oneShot.promise);
    const nativeError = new Error('Native location English');
    const invalidFix = { ...fix, coords: { ...fix.coords, latitude: NaN } };
    if (failure === 'permission-check') vi.mocked(getForegroundPermissionsAsync).mockRejectedValueOnce(nativeError);
    if (failure === 'permission') vi.mocked(requestForegroundPermissionsAsync).mockRejectedValueOnce(nativeError);
    if (failure === 'services') vi.mocked(hasServicesEnabledAsync).mockRejectedValueOnce(nativeError);
    if (failure === 'one-shot') vi.mocked(getCurrentPositionAsync).mockRejectedValueOnce(nativeError);
    if (failure === 'invalid-fix') vi.mocked(getCurrentPositionAsync).mockResolvedValueOnce(invalidFix);
    if (failure === 'watcher-setup') vi.mocked(watchPositionAsync).mockRejectedValueOnce(nativeError);
    const i18n = createInstance();
    await i18n.use(initReactI18next).init({ ...localizationOptions, lng: language, react: { useSuspense: false } });
    await act(async () => { tree = create(React.createElement(I18nextProvider, { i18n }, React.createElement(Probe))); });
    if (failure === 'watcher-callback') await act(async () => { vi.mocked(watchPositionAsync).mock.calls[0][2]!('Native watcher English'); });
    if (failure === 'invalid-watcher') await act(async () => { vi.mocked(watchPositionAsync).mock.calls[0][1](invalidFix); });
    expect(tree!.root.findByType('output').props.children).toBe(expected);
    expect(tree!.root.findByType(LocationStatus).props.location.errorCode).toBe(code);
    if (failure === 'watcher-setup' || failure === 'watcher-callback' || failure === 'invalid-watcher') {
      await act(async () => { oneShot.resolve(fix); });
      expect(tree!.root.findByType(LocationStatus).props.location.position).toEqual({ latitude: 11.01, longitude: 124.61 });
      expect(tree!.root.findByType('output').props.children).toBe(expected);
      expect(tree!.root.findByType(LocationStatus).props.location.errorCode).toBe(code);
    }
  },
);
