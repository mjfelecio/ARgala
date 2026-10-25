import * as React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { createInstance, type i18n } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { localizationOptions } from '@/i18n/options';
import { DestinationRingScene, type RingControls } from './destination-ring-scene';
import type { PoseSample } from './types';
const native = vi.hoisted(() => ({ getItem: vi.fn(), setItem: vi.fn(), patches: [] as { id: string; patch: Record<string, unknown> }[], reduced: false }));
vi.mock('@react-native-async-storage/async-storage', () => ({ default: { getItem: native.getItem, setItem: native.setItem } }));
vi.mock('react-native-reanimated', () => ({ useReducedMotion: () => native.reduced }));
vi.mock('uniwind', () => ({ useCSSVariable: () => ['#247A53', '#102724', '#71DCD2', '#FFFFFF', "'PlusJakartaSans'"] }));
vi.mock('@reactvision/react-viro', async () => {
  const R = await import('react');
  return { ViroARScene: 'native-scene', ViroQuad: 'quad', ViroText: 'viro-text', ViroARSceneNavigator: 'navigator',
    ViroNode: R.forwardRef((props: { testID?: string; children?: React.ReactNode }, ref) => {
      R.useImperativeHandle(ref, () => ({ setNativeProps: (patch: Record<string, unknown>) => native.patches.push({ id: props.testID ?? '', patch }) }), [props.testID]);
      return R.createElement('native-node', props, props.children);
    }),
    ViroMaterials: { createMaterials: vi.fn() }, ViroAnimations: { registerAnimations: vi.fn() },
    ViroTrackingStateConstants: { TRACKING_UNAVAILABLE: 1, TRACKING_LIMITED: 2, TRACKING_NORMAL: 3 } };
});
let tree: ReactTestRenderer; let translations: i18n; let controls: RingControls | null = null; const ready = vi.fn(); const commits = vi.fn();
const initial: PoseSample = { position: [0, 2, 0], forward: [0, 0, -1] };
function wrapper() { return React.createElement(I18nextProvider, { i18n: translations }, React.createElement(React.Profiler, { id: 'ring', onRender: commits }, React.createElement(DestinationRingScene, { onReady: ready, onTracking: () => {}, onControls: (value: RingControls | null) => { controls = value; } }))); }
async function mount() { await act(async () => { tree = create(wrapper()); }); }
async function track(state = 3) { await act(async () => tree.root.findByType('native-scene' as React.ElementType).props.onTrackingUpdated(state, 1)); }
async function pose(value = initial, time = Date.now()) { vi.setSystemTime(time); await act(async () => tree.root.findByType('native-scene' as React.ElementType).props.onCameraTransformUpdate(value)); }
function node(id: string) { return tree.root.findAllByType('native-node' as React.ElementType).find(item => item.props.testID === id)!; }
async function press(id: string) { await act(async () => node(id).props.onClick?.()); }
async function finish() { await act(async () => node('ring-focused-panel').props.animation.onFinish()); }
function text(id: string) { return tree.root.findAllByType('viro-text' as React.ElementType).find(item => item.props.testID === id)!.props.text as string; }
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true, __DEV__: true }); vi.useFakeTimers(); vi.setSystemTime(1000);
  vi.stubEnv('EXPO_PUBLIC_VIRO_SPIKE', '1'); vi.spyOn(performance, 'now').mockImplementation(() => Date.now()); native.reduced = false; native.patches.length = 0;
  native.getItem.mockReset().mockResolvedValue(null); native.setItem.mockReset().mockResolvedValue(undefined); ready.mockClear(); commits.mockClear();
  translations = createInstance(); await translations.use(initReactI18next).init({ ...localizationOptions, resources: structuredClone(localizationOptions.resources), lng: 'en', react: { useSuspense: false } });
  const original = console.error; vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => { if (!String(args[0]).startsWith('react-test-renderer is deprecated')) original(...args); });
});
afterEach(async () => { await act(async () => tree?.unmount()); vi.useRealTimers(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });
it('waits for normal horizontal pose, then publishes native translation without React frame renders', async () => {
  await mount(); await pose(); expect(ready).not.toHaveBeenCalled();
  await track(); await pose({ ...initial, forward: [0, 1, 0] }); expect(ready).not.toHaveBeenCalled();
  await pose(); expect(ready).toHaveBeenCalledOnce();
  const count = commits.mock.calls.length;
  for (let i = 1; i <= 40; i++) await pose({ position: [i / 10, 2, 0], forward: [1, 0, 0] }, 1000 + i * 40);
  expect(commits).toHaveBeenCalledTimes(count);
  const last = native.patches.filter(item => item.id === 'ring-root').at(-1)!;
  expect((last.patch.position as number[])[0]).toBeGreaterThan(3.8);
  expect(node('ring-tile-overview').props.rotation).toEqual([0, 0, 0]);
});
it('captures current-view focus once, ignores transition conflicts, closes and recenters without resetting the page', async () => {
  await mount(); await track(); await pose();
  await pose({ position: [4, 2, 3], forward: [1, 0, 0] }, 1100);
  await press('ring-tile-history'); await press('ring-action-next');
  expect(text('ring-page-indicator')).toMatch(/^1 /);
  await finish(); expect(node('ring-focused-panel').props.position).toEqual([5.15, 2, 3]);
  await press('ring-action-next'); expect(text('ring-page-indicator')).toMatch(/^2 /);
  await pose({ position: [6, 2, 3], forward: [0, 0, 1] }, 1200);
  expect(node('ring-focused-panel').props.position).toEqual([5.15, 2, 3]);
  await act(async () => controls!.recenter());
  expect(text('ring-page-indicator')).toMatch(/^2 /);
  expect(node('ring-focused-panel').props.position).toEqual([6, 2, 4.15]);
  await press('ring-action-close'); await finish(); expect(node('ring-focused-panel')).toBeUndefined();
  expect(node('ring-tile-history')).toBeDefined();
});
it('pauses transitions and retains focus/page through same-frame tracking loss after turning', async () => {
  await mount(); await track(); await pose(); await press('ring-tile-overview');
  await track(2);
  expect(native.patches.filter(item => item.id === 'ring-focused-panel').at(-1)!.patch.animation).toMatchObject({ run: false });
  await track(3); await pose({ ...initial, forward: [1, 0, 0] }, 1100); await finish();
  expect(node('ring-focused-panel').props.position).toEqual([0, 2, -1.15]);
  await press('ring-action-next'); const page = text('ring-page-indicator');
  await track(2); await press('ring-action-next');
  await track(3); await pose({ position: [2, 2, 0], forward: [0, 0, 1] }, 1200);
  expect(text('ring-page-indicator')).toBe(page);
  expect(node('ring-focused-panel').props.position).toEqual([0, 2, -1.15]);
});
it.each(['en', 'ja', 'ko'].flatMap(locale => ['load', 'save'].map(operation => [locale, operation])))('uses real %s content and localized %s preference failure/recovery without raw errors', async (locale, operation) => {
  await translations.changeLanguage(locale);
  if (operation === 'save') native.setItem.mockRejectedValueOnce(new Error('PRIVATE_NATIVE_ERROR'));
  else native.getItem.mockRejectedValueOnce(new Error('PRIVATE_NATIVE_ERROR'));
  await mount(); await track(); await pose(); await press('ring-tile-history'); await finish();
  expect(text('ring-sample-label')).toBe(translations.t('destinationRing.sampleLabel'));
  if (operation === 'save') await press('ring-action-larger');
  expect(text('ring-reading-error')).toBe(translations.t(`destinationRing.${operation}-failed`));
  expect(JSON.stringify(tree.toJSON())).not.toContain('PRIVATE_NATIVE_ERROR');
  await act(async () => { await translations.changeLanguage(locale === 'en' ? 'ja' : 'en'); });
  expect(text('ring-reading-error')).toBe(translations.t(`destinationRing.${operation}-failed`));
  await press('ring-action-preference-retry'); expect(tree.root.findAllByType('viro-text' as React.ElementType).some(item => item.props.testID === 'ring-reading-error')).toBe(false);
});

it('keeps selection after recenter cancels an unfinished native transition', async () => {
  await mount(); await track(); await pose(); await press('ring-tile-history');
  const stale = node('ring-focused-panel').props.animation.onFinish;
  await pose({ position: [1, 2, 1], forward: [1, 0, 0] }, 1100);
  await act(async () => controls!.recenter());
  await act(async () => stale());
  expect(node('ring-focused-panel').props.position).toEqual([2.15, 2, 1]);
  expect(text('ring-page-indicator')).toMatch(/^1 /);
});
it('omits empty optional content and redistributes remaining slots without blank tiles', async () => {
  translations.addResource('en', 'translation', 'emptySample', '   ');
  const content = [
    { id: 'overview', role: 'overview' as const, titleKey: 'destinationRing.mock.overview.title', bodyKey: 'destinationRing.mock.overview.body' },
    { id: 'history', role: 'history' as const, titleKey: 'destinationRing.mock.history.title', bodyKey: 'destinationRing.mock.history.body' },
    { id: 'empty', titleKey: 'destinationRing.mock.facts.title', bodyKey: 'emptySample' },
  ];
  await act(async () => { tree = create(React.createElement(I18nextProvider, { i18n: translations }, React.createElement(DestinationRingScene, { onReady: ready, onTracking: () => {}, content }))); });
  await track(); await pose();
  expect(tree.root.findAllByType('native-node' as React.ElementType).filter(item => item.props.testID?.startsWith('ring-tile-'))).toHaveLength(2);
  expect(node('ring-tile-history').props.position[0]).toBeCloseTo(2);
});
it('keeps oversized content recoverable through font reflow instead of throwing in a native control', async () => {
  translations.addResource('en', 'translation', 'destinationRing.mock.history.body', 'x'.repeat(24001));
  await mount(); await track(); await pose(); await press('ring-tile-history'); await finish();
  expect(text('ring-body').replaceAll('\n', '')).toContain('This sample text could not');
  await press('ring-action-larger');
  expect(text('ring-body').replaceAll('\n', '')).toContain('This sample text could not');
});

it.each([false, true])('moves the closing frame with the ring until restore (tracking interruption=%s)', async interrupted => {
  await mount(); await track(); await pose(); await press('ring-tile-overview'); await finish(); await press('ring-action-close');
  if (interrupted) { await track(2); await pose({ position: [0.2, 2, 0], forward: [1, 0, 0] }, 1050); await track(3); }
  await pose({ position: [0.4, 2, 0], forward: [1, 0, 0] }, 1100);
  const ringOutput = native.patches.filter(item => item.id === 'ring-root').at(-1)!;
  const closingOutput = native.patches.filter(item => item.id === 'ring-panel-frame').at(-1);
  expect(closingOutput?.patch.position).toEqual([0.4, 2, 0]);
  expect(ringOutput.patch.position).toEqual([0.4, 2, 0]);
  await finish();
  expect(node('ring-focused-panel')).toBeUndefined();
  expect(node('ring-tile-overview').props.position).toEqual([0, 0, -2]);
});

it('switches closing coordinate frames only after the native child commit', async () => {
  await mount(); await track(); await pose(); await press('ring-tile-overview'); await finish();
  await pose({ position: [4, 2, 0], forward: [0, 0, -1] }, 1100); native.patches.length = 0;
  await act(async () => {
    node('ring-action-close').props.onClick();
    vi.setSystemTime(1200);
    tree.root.findByType('native-scene' as React.ElementType).props.onCameraTransformUpdate({ position: [4.4, 2, 0], forward: [0, 0, -1] });
    expect(native.patches.filter(item => item.id === 'ring-panel-frame')).toHaveLength(0);
  });
  expect(native.patches.filter(item => item.id === 'ring-panel-frame').at(-1)!.patch.position).toEqual([4.4, 2, 0]);
});

it('resets an imperatively translated zero-origin panel frame on recenter', async () => {
  await mount(); await track(); await pose({ position: [0, 0, 0], forward: [0, 0, -1] });
  await press('ring-tile-overview'); await finish(); await press('ring-action-close');
  await pose({ position: [0.4, 0, 0], forward: [0, 0, -1] }, 1100); native.patches.length = 0;
  await act(async () => controls!.recenter());
  expect(native.patches.filter(item => item.id === 'ring-panel-frame').at(-1)?.patch.position).toEqual([0, 0, 0]);
  expect(node('ring-focused-panel').props.position).toEqual([0.4, 0, -1.15]);
});
it('commits recenter origin even when it equals the original declarative ring position', async () => {
  await mount(); await track(); await pose();
  await pose({ position: [0.1, 2, 0], forward: [0, 0, -1] }, 1100);
  await pose(initial, 1140); native.patches.length = 0;
  await act(async () => controls!.recenter());
  expect(native.patches.filter(item => item.id === 'ring-root').at(-1)?.patch.position).toEqual([0, 2, 0]);
});

it('uses readable-resolution glyph textures while preserving world-space text bounds', async () => {
  await mount(); await track(); await pose(); await press('ring-tile-history'); await finish();
  const body = tree.root.findAllByType('viro-text' as React.ElementType).find(item => item.props.testID === 'ring-body')!;
  expect(body.props.style.fontSize).toBeGreaterThanOrEqual(32);
  expect(body.props.width * body.props.scale[0]).toBeCloseTo(1.08);
  expect(body.props.height * body.props.scale[1]).toBeCloseTo(0.44);
  expect(body.props.style.fontSize * body.props.scale[0]).toBe(5);
});
it('gives Close a larger visible surface with separated control rows and preserves interaction gates', async () => {
  await mount(); await track(); await pose(); await press('ring-tile-history'); await finish();
  const close = node('ring-action-close');
  const surface = close.findByType('quad' as React.ElementType);
  expect(surface.props.height).toBeGreaterThanOrEqual(0.18);
  expect(surface.props.width).toBeGreaterThanOrEqual(0.46);
  const previous = node('ring-action-previous');
  expect(previous.props.position[1] - close.props.position[1]).toBeGreaterThan(surface.props.height);
  await track(2); await press('ring-action-close'); expect(node('ring-focused-panel')).toBeDefined();
  await track(); await pose(); await press('ring-action-close'); await finish(); expect(node('ring-focused-panel')).toBeUndefined();
});

it('keeps decorative geometry out of native hit ordering and precisely tests only visible controls', async () => {
  await mount(); await track(); await pose(); await press('ring-tile-history'); await finish();
  for (const quad of tree.root.findAllByType('quad' as React.ElementType)) {
    const action = quad.parent?.props.testID?.startsWith('ring-action-');
    if (action && quad.parent?.props.onClick) {
      expect(quad.props.highAccuracyEvents).toBe(true);
      expect(quad.props.ignoreEventHandling).toBe(false);
    } else expect(quad.props.ignoreEventHandling).toBe(true);
  }
  for (const glyph of tree.root.findAllByType('viro-text' as React.ElementType)) expect(glyph.props.ignoreEventHandling).toBe(true);
  await press('ring-action-close'); await finish();
  const tile = node('ring-tile-history');
  const activeSurface = tile.findAllByType('quad' as React.ElementType).find(quad => quad.props.ignoreEventHandling === false);
  expect(activeSurface?.props.highAccuracyEvents).toBe(true);
});
it.each([['overview', 0], ['history', 45], ['history', -135]] as const)('keeps both control columns usable for %s after yaw %s', async (id, yaw) => {
  await mount(); await track(); await pose(); const radians = yaw * Math.PI / 180;
  await pose({ ...initial, forward: [-Math.sin(radians), 0, -Math.cos(radians)] }, 1100);
  await press(`ring-tile-${id}`); await finish();
  await press('ring-action-next'); expect(text('ring-page-indicator')).toMatch(/^2 /);
  await press('ring-action-previous'); expect(text('ring-page-indicator')).toMatch(/^1 /);
  await press('ring-action-larger'); await press('ring-action-smaller');
  for (const name of ['previous', 'next', 'smaller', 'larger', 'close']) {
    const quad = node(`ring-action-${name}`).findByType('quad' as React.ElementType);
    expect(quad.props.highAccuracyEvents).toBe(true);
  }
  await press('ring-action-close'); await finish(); expect(node('ring-focused-panel')).toBeUndefined();
});

it('draws translucent panel backgrounds before glyphs, including dimmed tiles and the recovery notice', async () => {
  native.getItem.mockRejectedValueOnce(new Error('STORAGE_DIAGNOSTIC'));
  await mount(); await track(); await pose(); await press('ring-tile-history'); await finish();
  for (const panel of [node('ring-tile-overview'), node('ring-focused-panel')]) {
    const layers = panel.children.filter(child => typeof child !== 'string');
    const backgrounds = layers.filter(child => child.type === ('quad' as React.ElementType));
    const glyphs = panel.findAllByType('viro-text' as React.ElementType);
    for (const bg of backgrounds) for (const glyph of glyphs) expect(glyph.props.renderingOrder ?? 0).toBeGreaterThan(bg.props.renderingOrder ?? 0);
  }
  const retry = node('ring-action-preference-retry'); const retryFill = retry.findByType('quad' as React.ElementType);
  const noticeFill = tree.root.findAllByType('quad' as React.ElementType).find(quad => quad.props.height === 0.5)!;
  expect(retryFill.props.renderingOrder).toBeGreaterThan(noticeFill.props.renderingOrder);
  expect(retry.findByType('viro-text' as React.ElementType).props.renderingOrder).toBeGreaterThan(retryFill.props.renderingOrder);
});
