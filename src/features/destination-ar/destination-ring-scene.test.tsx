import * as React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { createInstance, type i18n } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { localizationOptions } from '@/i18n/options';
import { DestinationRingScene, type RingControls } from './destination-ring-scene';
import { danaoStagePresentation, getExhibitStagePresentation, getExhibitSceneHost } from './exhibit-ring-scene';
import { withExhibitVisitorContent } from './exhibit-visitor-content';
import { EXHIBIT_GUIDE_IDS } from './ring-content';
import { defaultArView, requestView } from './ar-view-mode';
import { featuredStoryContent } from './featured-story-content';
import { RingController } from './ring-controller';
import { ViroAnimations, ViroMaterials } from '@reactvision/react-viro';
import type { PoseSample } from './types';
import { useReadingSize } from './use-reading-size';
import { exhibitGalleryEntries } from './photo-islands';
import { destinationSchema, getDestination } from '@/features/destinations/catalog';
import { approvedArContent } from '@/features/destinations/ar-content';
vi.mock('./camera-heading', () => ({ cameraHeadingModule: () => null, updateHeadingLocation: vi.fn() }));
vi.mock('./development-ring-content', () => { throw new Error('Public scene engines must not evaluate diagnostic samples'); });
const native = vi.hoisted(() => ({ getItem: vi.fn(), setItem: vi.fn(), patches: [] as { id: string; patch: Record<string, unknown> }[], reduced: false }));
vi.mock('./holographic-assets', () => ({ holographicAssets: { glint: 108, frame: 101, reader: 109, toolbar: 110, actionMask: 111, overview: 102, history: 103, highlights: 104, 'visitor-notes': 105, facts: 106, chapter: 107 } }));
vi.mock('@react-native-async-storage/async-storage', () => ({ default: { getItem: native.getItem, setItem: native.setItem } }));
vi.mock('react-native-reanimated', () => ({ useReducedMotion: () => native.reduced }));
vi.mock('./intro-emblem-asset', () => ({ introEmblemAsset: 1 }));
vi.mock('uniwind', () => ({ useCSSVariable: () => ['#247A53', '#102724', '#71DCD2', '#FFFFFF', "'PlusJakartaSans'"] }));
vi.mock('@reactvision/react-viro', async () => {
  const R = await import('react');
  return { ViroARScene: 'native-scene', ViroImage: 'viro-image', ViroQuad: 'quad', ViroPolyline: 'polyline', ViroText: 'viro-text', ViroARSceneNavigator: 'navigator',
    ViroNode: R.forwardRef((props: { testID?: string; children?: React.ReactNode }, ref) => {
      R.useImperativeHandle(ref, () => ({ setNativeProps: (patch: Record<string, unknown>) => native.patches.push({ id: props.testID ?? '', patch }) }), [props.testID]);
      return R.createElement('native-node', props, props.children);
    }),
    ViroMaterials: { createMaterials: vi.fn() }, ViroAnimations: { registerAnimations: vi.fn() },
    ViroTrackingStateConstants: { TRACKING_UNAVAILABLE: 1, TRACKING_LIMITED: 2, TRACKING_NORMAL: 3 } };
});
let sceneOptions: Partial<React.ComponentProps<typeof DestinationRingScene>> = {};
let tree: ReactTestRenderer; let translations: i18n; let controls: RingControls | null = null; const ready = vi.fn(); const commits = vi.fn();
const diagnosticFixture = [
 { id: 'overview', role: 'overview' as const, titleKey: 'destinationRing.mock.overview.title', bodyKey: 'destinationRing.mock.overview.body' },
 { id: 'history', role: 'history' as const, titleKey: 'destinationRing.mock.history.title', bodyKey: 'destinationRing.mock.history.body' },
 { id: 'highlights', titleKey: 'destinationRing.mock.highlights.title', bodyKey: 'destinationRing.mock.highlights.body' },
 { id: 'visitor-notes', titleKey: 'destinationRing.mock.notes.title', bodyKey: 'destinationRing.mock.notes.body' },
 { id: 'facts', titleKey: 'destinationRing.mock.facts.title', bodyKey: 'destinationRing.mock.facts.body' },
];
const initial: PoseSample = { position: [0, 2, 0], forward: [0, 0, -1] };
function wrapper() { return React.createElement(I18nextProvider, { i18n: translations }, React.createElement(React.Profiler, { id: 'ring', onRender: commits }, React.createElement(DestinationRingScene, { content: diagnosticFixture, onReady: ready, onTracking: () => {}, onControls: (value: RingControls | null) => { controls = value; }, ...sceneOptions }))); }
async function mount() { await act(async () => { tree = create(wrapper()); }); }
async function track(state = 3) { await act(async () => tree.root.findByType('native-scene' as React.ElementType).props.onTrackingUpdated(state, 1)); }
async function pose(value = initial, time = Date.now()) { vi.setSystemTime(time); await act(async () => tree.root.findByType('native-scene' as React.ElementType).props.onCameraTransformUpdate(value)); }
function node(id: string) { return tree.root.findAllByType('native-node' as React.ElementType).find(item => item.props.testID === id)!; }
async function press(id: string) { await act(async () => node(id)?.props.onClick?.()); }
async function finish() { await act(async () => node('ring-focused-panel').props.animation.onFinish()); }
function text(id: string) { return tree.root.findAllByType('viro-text' as React.ElementType).find(item => item.props.testID === id)!.props.text as string; }
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true, __DEV__: true }); vi.useFakeTimers(); vi.setSystemTime(1000);
  vi.stubEnv('EXPO_PUBLIC_VIRO_SPIKE', '1'); vi.spyOn(performance, 'now').mockImplementation(() => Date.now()); native.reduced = false; native.patches.length = 0; sceneOptions = {};
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
it('counts only completed chapter focus, never collapse intent or stale completions', async () => {
  const progress = vi.fn(); sceneOptions = { onProgress: progress };
  await mount(); await track(); await pose();
  await press('ring-tile-history');
  expect(progress.mock.lastCall?.[0].openedIds).toEqual([]);
  await finish(); expect(progress.mock.lastCall?.[0].openedIds).toEqual(['history']);
  const retainedFinish = node('ring-focused-panel').props.animation.onFinish;
  await press('ring-tile-overview'); await finish();
  expect(progress.mock.lastCall?.[0].openedIds).toEqual(['history']);
  expect(text('ring-opened-history')).toBe(translations.t('destinationStories.opened'));
  await act(async () => retainedFinish());
  expect(progress.mock.lastCall?.[0].openedIds).toEqual(['history']);
  await pose(initial, 1100); await press('ring-tile-overview'); await finish();
  expect(progress.mock.lastCall?.[0].openedIds).toEqual(['history', 'overview']);
});
it('records an accepted opening when explicit Recenter settles its focus transition', async () => {
  const progress = vi.fn(); sceneOptions = { onProgress: progress };
  await mount(); await track(); await pose(); await press('ring-tile-history');
  await act(async () => controls!.recenter());
  expect(progress.mock.lastCall?.[0].openedIds).toEqual(['history']);
});
it('reduces only decoration under sustained scheduling delay while retaining focused content, controls and frame', async () => {
  await mount(); await track(); await pose(); await press('ring-tile-history'); await finish(); await press('ring-action-next');
  const panel = node('ring-focused-panel'); const position = panel.props.position; const rotation = panel.props.rotation;
  const page = text('ring-page-indicator'); const body = text('ring-body');
  const quads = tree.root.findAllByType('quad' as React.ElementType).length;
  let clock = Date.now(); vi.mocked(performance.now).mockImplementation(() => clock);
  for (let index = 0; index < 3; index++) { clock += 1400; await act(async () => { await vi.advanceTimersByTimeAsync(1000); }); }
  expect(tree.root.findAllByType('quad' as React.ElementType).length).toBeLessThan(quads);
  expect(node('ring-focused-panel').props.position).toEqual(position); expect(node('ring-focused-panel').props.rotation).toEqual(rotation);
  expect(text('ring-page-indicator')).toBe(page); expect(text('ring-body')).toBe(body);
  for (const action of ['previous', 'next', 'smaller', 'larger', 'close']) expect(node(`ring-action-${action}`)).toBeDefined();
  expect(ready).toHaveBeenCalledOnce();
});
it('captures current-view focus once, ignores transition conflicts, closes and recenters without resetting the page', async () => {
  await mount(); await track(); await pose();
  await pose({ position: [4, 2, 3], forward: [1, 0, 0] }, 1100);
  await press('ring-tile-history'); await press('ring-action-next');
  expect(node('ring-reader-toolbar')).toBeUndefined();
  await finish(); expect(node('ring-focused-panel').props.position).toEqual([6.25, 2, 3]);
  await press('ring-action-next'); expect(text('ring-page-indicator')).toMatch(/^2 /);
  await pose({ position: [6, 2, 3], forward: [0, 0, 1] }, 1200);
  expect(node('ring-focused-panel').props.position).toEqual([6.25, 2, 3]);
  await act(async () => controls!.recenter());
  expect(text('ring-page-indicator')).toMatch(/^2 /);
  expect(node('ring-focused-panel').props.position).toEqual([6, 2, 5.25]);
  await press('ring-action-close'); await finish(); expect(node('ring-focused-panel')).toBeUndefined();
  expect(node('ring-tile-history')).toBeDefined();
});
it('closes the original focus from another tile without opening that tile and retains reading state', async () => {
  await mount(); await track(); await pose();
  const ringPosition = node('ring-root').props.position;
  const tilePosition = node('ring-tile-overview').props.position;
  await press('ring-tile-history'); await finish(); await press('ring-action-next');
  const page = text('ring-page-indicator'); const body = text('ring-body');
  const other = node('ring-tile-overview');
  expect(other.props.onClick).toBeTypeOf('function');
  const surface = other.findAllByType('viro-image' as React.ElementType).find(image => image.props.ignoreEventHandling === false)!;
  expect(surface.props.highAccuracyEvents).toBe(true);
  expect(other.findAllByType('quad' as React.ElementType).filter(quad => quad.props.onClick)).toHaveLength(0);
  expect(node('ring-root').props.opacity).toBe(0.4);
  await press('ring-tile-overview');
  expect(node('ring-tile-history')).toBeUndefined();
  expect(node('ring-focused-panel').props.animation.name).toBe('argalaRingClose');
  expect(node('ring-tile-overview').props.onClick).toBeUndefined();
  await finish();
  expect(node('ring-focused-panel')).toBeUndefined();
  expect(node('ring-root').props.opacity).toBe(1);
  expect(node('ring-root').props.position).toEqual(ringPosition);
  expect(node('ring-tile-overview').props.position).toEqual(tilePosition);
  expect(node('ring-tile-history')).toBeDefined();
  await press('ring-tile-history'); await finish();
  expect(text('ring-page-indicator')).toBe(page); expect(text('ring-body')).toBe(body);
});
it('uses current controller selection for queued tile clicks and rejects opening and closing conflicts', async () => {
  await mount(); await track(); await pose();
  const queuedOtherClick = node('ring-tile-overview').props.onClick;
  const queuedSameClick = node('ring-tile-history').props.onClick;
  await press('ring-tile-history');
  const opening = node('ring-focused-panel').props.animation;
  expect(node('ring-tile-overview').props.onClick).toBeUndefined();
  await act(async () => queuedOtherClick());
  expect(node('ring-focused-panel').props.animation.name).toBe(opening.name);
  await finish();
  await act(async () => queuedSameClick());
  expect(node('ring-focused-panel').props.animation.name).toBe('argalaRingFocus');
  await act(async () => { queuedOtherClick(); queuedOtherClick(); });
  const closing = node('ring-focused-panel').props.animation;
  expect(closing.name).toBe('argalaRingClose');
  expect(node('ring-tile-history')).toBeUndefined();
  expect(node('ring-tile-overview').props.onClick).toBeUndefined();
  await finish(); expect(node('ring-focused-panel')).toBeUndefined();
  expect(node('ring-tile-history')).toBeDefined();
});
it.each([1, 2])('rejects other-tile dismissal through lost tracking %s and until a fresh recovery pose', async state => {
  await mount(); await track(); await pose(); await press('ring-tile-history'); await finish();
  const queuedOtherClick = node('ring-tile-overview').props.onClick;
  expect(queuedOtherClick).toBeTypeOf('function');
  await track(state);
  expect(node('ring-tile-overview').props.onClick).toBeUndefined();
  await act(async () => queuedOtherClick?.());
  expect(node('ring-focused-panel').props.animation.name).toBe('argalaRingFocus');
  await track(); await act(async () => queuedOtherClick?.());
  expect(node('ring-focused-panel').props.animation.name).toBe('argalaRingFocus');
  await pose(initial, 1100); await press('ring-tile-overview');
  expect(node('ring-focused-panel').props.animation.name).toBe('argalaRingClose');
});
it.each(['ring-tile-overview', 'ring-action-close'])('rejects retained %s callbacks while background or reveal interaction is disabled', async id => {
  await mount(); await track(); await pose(); await press('ring-tile-history'); await finish();
  const retained = node(id).props.onClick;
  expect(retained).toBeTypeOf('function');
  sceneOptions = { interactive: false };
  await act(async () => tree.update(wrapper()));
  expect(node('ring-tile-overview').props.onClick).toBeUndefined();
  expect(node('ring-action-close').props.onClick).toBeUndefined();
  await act(async () => retained());
  expect(node('ring-focused-panel').props.animation.name).toBe('argalaRingFocus');
  sceneOptions = { interactive: true };
  await act(async () => tree.update(wrapper()));
  await act(async () => retained());
  expect(node('ring-focused-panel').props.animation.name).toBe('argalaRingClose');
});
it('rejects a retained tile opening callback while interaction is disabled', async () => {
  await mount(); await track(); await pose();
  const retained = node('ring-tile-history').props.onClick;
  sceneOptions = { interactive: false };
  await act(async () => tree.update(wrapper()));
  await act(async () => retained());
  expect(node('ring-focused-panel')).toBeUndefined();
  sceneOptions = { interactive: true };
  await act(async () => tree.update(wrapper()));
  await act(async () => retained());
  expect(node('ring-focused-panel')).toBeDefined();
});
it.each(['open', 'dismiss', 'close'])('retires retained %s callbacks on unmount', async action => {
  const select = vi.spyOn(RingController.prototype, 'select');
  await mount(); await track(); await pose();
  const open = node('ring-tile-history').props.onClick;
  await press('ring-tile-history'); await finish();
  const controller = select.mock.contexts[0] as RingController;
  const original = controller.selection;
  const retained = action === 'open' ? open : node(action === 'dismiss' ? 'ring-tile-overview' : 'ring-action-close').props.onClick;
  if (action === 'open') { await press('ring-action-close'); await finish(); }
  await act(async () => tree.unmount());
  await act(async () => retained());
  expect(controller.selection).toBe(action === 'open' ? null : original);
});
it('pauses transitions and retains focus/page through same-frame tracking loss after turning', async () => {
  await mount(); await track(); await pose(); await press('ring-tile-overview');
  await track(2);
  expect(node('ring-focused-panel').props.animation).toMatchObject({ run: false });
  await track(3); await pose({ ...initial, forward: [1, 0, 0] }, 1100); await finish();
  expect(node('ring-focused-panel').props.position).toEqual([0, 2, -2.25]);
  await press('ring-action-next'); const page = text('ring-page-indicator');
  await track(2); await press('ring-action-next');
  await track(3); await pose({ position: [2, 2, 0], forward: [0, 0, 1] }, 1200);
  expect(text('ring-page-indicator')).toBe(page);
  expect(node('ring-focused-panel').props.position).toEqual([0, 2, -2.25]);
});

it.each(['tracking', 'help'])('retains closing completion across a %s fence until safe reconciliation', async fence => {
  await mount(); await track(); await pose(); await press('ring-tile-history'); await finish();
  await press('ring-action-close'); const completedClose = node('ring-focused-panel').props.animation.onFinish;
  if (fence === 'tracking') await track(2);
  else { sceneOptions = { interactive: false }; await act(async () => tree.update(wrapper())); }
  await act(async () => completedClose());
  expect(node('ring-focused-panel')).toBeDefined();
  if (fence === 'tracking') { await track(3); expect(node('ring-focused-panel')).toBeDefined(); await pose(initial, 1100); }
  else { sceneOptions = { interactive: true }; await act(async () => tree.update(wrapper())); }
  expect(node('ring-focused-panel')).toBeUndefined();
  expect(node('ring-tile-history')).toBeDefined();
});

it('records accepted Close as collapsed restoration intent before its native animation finishes', async () => {
  const progress = vi.fn(); sceneOptions = { onProgress: progress };
  await mount(); await track(); await pose(); await press('ring-tile-history'); await finish();
  await act(async () => {
    node('ring-action-close').props.onClick();
    // AppState can retire the scene before React commits selection state.
    expect(progress.mock.lastCall?.[0].selectedId).toBeNull();
  });
  expect(progress.mock.lastCall?.[0].selectedId).toBeNull();
  expect(node('ring-focused-panel')).toBeDefined();
});

it('keeps one declarative animation owner through unrelated rerenders and tracking pause/resume', async () => {
  await mount(); await track(); await pose(); await press('ring-tile-history');
  const animation = node('ring-focused-panel').props.animation;
  expect(animation.run).toBe(true);
  sceneOptions = { firstVisit: true }; await act(async () => tree.update(wrapper()));
  expect(node('ring-focused-panel').props.animation).toBe(animation);
  await track(2); expect(node('ring-focused-panel').props.animation.run).toBe(false);
  await track(3); expect(node('ring-focused-panel').props.animation.run).toBe(true);
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
  expect(node('ring-focused-panel').props.position).toEqual([3.25, 2, 1]);
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
  expect(text('ring-body').replaceAll('\n', '')).toContain('This chapter could not');
  await press('ring-action-larger');
  expect(text('ring-body').replaceAll('\n', '')).toContain('This chapter could not');
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
  expect(node('ring-focused-panel').props.position).toEqual([0.4, 0, -2.25]);
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
  expect(body.props.height * body.props.scale[1]).toBeGreaterThanOrEqual(0.8);
  expect(body.props.style.fontSize * body.props.scale[0]).toBe(5);
});
it('keeps Close large in the floating row and preserves interaction gates', async () => {
  await mount(); await track(); await pose(); await press('ring-tile-history'); await finish();
  const close = node('ring-action-close');
  const surface = close.findByType('quad' as React.ElementType);
  const { width, height } = surface.props;
  expect(height).toBeGreaterThanOrEqual(0.18);
  expect(width).toBeGreaterThanOrEqual(0.46);
  const next = node('ring-action-next');
  expect(close.props.position[0] - width / 2).toBeGreaterThan(next.props.position[0] + 0.17);
  await track(2); await press('ring-action-close'); expect(node('ring-focused-panel')).toBeDefined();
  await track(); await pose(); await press('ring-action-close'); await finish(); expect(node('ring-focused-panel')).toBeUndefined();
});

it('keeps decorative geometry out of native hit ordering and precisely tests only visible controls', async () => {
  await mount(); await track(); await pose(); await press('ring-tile-history'); await finish();
  for (const quad of tree.root.findAllByType('quad' as React.ElementType)) {
    const owner = quad.parent?.props;
    const interactiveSurface = owner?.onClick && (owner.testID?.startsWith('ring-action-') || owner.testID?.startsWith('ring-tile-'));
    if (interactiveSurface && quad.props.highAccuracyEvents) {
      expect(quad.props.highAccuracyEvents).toBe(true);
      expect(quad.props.ignoreEventHandling).toBe(false);
    } else expect(quad.props.ignoreEventHandling).toBe(true);
  }
  for (const glyph of tree.root.findAllByType('viro-text' as React.ElementType)) expect(glyph.props.ignoreEventHandling).toBe(true);
  await press('ring-action-close'); await finish();
  const tile = node('ring-tile-history');
  const activeSurface = tile.findAllByType('viro-image' as React.ElementType).find(image => image.props.ignoreEventHandling === false);
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

it('restores only logical selection/page after a fresh frame and keeps its new pose through same-frame tracking loss', async () => {
  const progress = vi.fn();
  sceneOptions = { initialProgress: { selectedId: 'history', cursors: { history: { page: 2, offset: 400, locale: 'en', size: 'standard' } } }, onProgress: progress };
  await mount(); expect(node('ring-focused-panel')).toBeUndefined(); await track();
  await pose({ position: [8, 4, -2], forward: [1, 0, 0] });
  expect(node('ring-focused-panel').props.position).toEqual([10.25, 4, -2]); expect(text('ring-page-indicator')).toBe('3 / 3');
  await track(2); await track(3); await pose({ position: [10, 4, -2], forward: [0, 0, 1] }, 1100);
  expect(node('ring-focused-panel').props.position).toEqual([10.25, 4, -2]); expect(text('ring-page-indicator')).toBe('3 / 3');
  await press('ring-action-close'); await finish(); expect(progress.mock.lastCall?.[0].selectedId).toBeNull();
  expect(JSON.stringify(progress.mock.calls)).not.toContain('position');
});
it('reveals Overview first and blocks native interaction until the reveal allows it', async () => {
  sceneOptions = { visibleTileCount: 1, interactive: false }; await mount(); await track(); await pose();
  expect(node('ring-tile-overview')).toBeDefined(); expect(node('ring-tile-history')).toBeUndefined();
  await press('ring-tile-overview'); expect(node('ring-focused-panel')).toBeUndefined();
  sceneOptions = { visibleTileCount: 4, interactive: true }; await act(async () => tree.update(wrapper()));
  await press('ring-tile-history'); expect(node('ring-focused-panel')).toBeDefined();
});
it('keeps the actual reading controller and unsaved size/error above a remounting native scene', async () => {
  native.setItem.mockRejectedValueOnce(new Error('PRIVATE_WRITE_ERROR'));
  let ownedReading: ReturnType<typeof useReadingSize>;
  function Owner({ visible }: { visible: boolean }) {
    const reading = useReadingSize(); React.useEffect(() => { ownedReading = reading; });
    return visible ? React.createElement(DestinationRingScene, { content: diagnosticFixture, reading, onReady: ready, onTracking: () => {}, onControls: (value: RingControls | null) => { controls = value; } }) : null;
  }
  const owned = (visible: boolean) => React.createElement(I18nextProvider, { i18n: translations }, React.createElement(Owner, { visible }));
  await act(async () => { tree = create(owned(true)); }); await track(); await pose(); await press('ring-tile-history'); await finish();
  await act(async () => controls!.changeReadingSize!(1)); expect(ownedReading!.error).toBe('save-failed');
  await act(async () => tree.update(owned(false))); await act(async () => tree.update(owned(true)));
  await track(); await pose(); await press('ring-tile-history'); await finish();
  expect(ownedReading!.error).toBe('save-failed'); expect(native.getItem).toHaveBeenCalledOnce();
  const body = tree.root.findAllByType('viro-text' as React.ElementType).find(item => item.props.testID === 'ring-body')!;
  expect(body.props.style.fontSize * body.props.scale[0]).toBe(6);
});
it('renders approved catalog copy through the actual native panel and follows the app locale', async () => {
 const approved = (value: string) => ({ value, approvalReference: 'synthetic test approval' });
 sceneOptions = { content: [{ id: 'overview', role: 'overview', approved: { title: { en: approved('Approved title'), ja: approved('承認済み見出し') }, body: { en: approved('Approved native body'), ja: approved('承認済みの本文') } } }] };
 await mount(); await track(); await pose(); await press('ring-tile-overview'); await finish();
 const copy = () => tree.root.findAllByType('viro-text' as React.ElementType).map(value => value.props.text).join('\n');
 expect(copy()).toContain('Approved native body'); expect(copy()).not.toContain(translations.t('destinationRing.sampleLabel'));
 await act(async () => { await translations.changeLanguage('ja'); });
 expect(copy()).toContain('承認済みの本文'); expect(copy()).toContain('承認済み見出し');
});
it('keeps the reading body below the chapter heading without overlapping the native text boxes', async () => {
  await mount(); await track(); await pose(); await press('ring-tile-overview'); await finish();
  const panel = node('ring-focused-panel');
  const heading = panel.findAllByType('viro-text' as React.ElementType)[0];
  const body = panel.findAllByType('viro-text' as React.ElementType).find(item => item.props.testID === 'ring-body')!;
  const headingBottom = heading.props.position[1] - heading.props.height * heading.props.scale[1] / 2;
  const bodyTop = body.props.position[1] + body.props.height * body.props.scale[1] / 2;
  expect(bodyTop).toBeLessThanOrEqual(headingBottom);
});

it('gives every cover an intentional chapter emblem and a holographic frame while retaining one held-click owner', async () => {
  await mount(); await track(); await pose();
  const cover = node('ring-tile-overview');
  expect(cover.findAllByProps({ testID: 'chapter-emblem-overview' })).toHaveLength(1);
  expect(cover.findAllByType('native-node' as React.ElementType).filter(item => item.props.testID === 'holographic-frame')).toHaveLength(1);
  const target = cover.findAllByType('viro-image' as React.ElementType).filter(item => item.props.ignoreEventHandling === false);
  expect(target).toHaveLength(1); expect(target[0].props.highAccuracyEvents).toBe(true);
  expect(target[0].props.testID).toBe('holographic-surface'); expect(target[0].props.opacity ?? 1).toBe(1);
  expect(cover.props.onClick).toBeTypeOf('function');
  await press('ring-tile-overview'); await finish();
  const focusedSurfaces = node('ring-focused-panel').findAllByType('viro-image' as React.ElementType).filter(item => item.props.testID === 'holographic-surface');
  expect(focusedSurfaces.filter(item => item.props.source === 109)).toHaveLength(1);
  expect(focusedSurfaces.filter(item => item.props.source === 110)).toHaveLength(1);
});

it('animates a page change inside the stationary focused frame and settles immediately for reduced motion', async () => {
  await mount(); await track(); await pose(); await press('ring-tile-history'); await finish();
  const frame = node('ring-focused-panel'); const position = frame.props.position;
  expect(node('ring-page-content')).toBeDefined();
  native.patches.length = 0; await press('ring-action-next');
  expect(native.patches.some(item => item.id === 'ring-page-content' && (item.patch.animation as { run?: boolean } | undefined)?.run)).toBe(true);
  expect(node('ring-focused-panel')).toBe(frame); expect(frame.props.position).toEqual(position);
  native.reduced = true; native.patches.length = 0; await press('ring-action-previous');
  expect(native.patches.filter(item => item.id === 'ring-page-content').at(-1)?.patch).toMatchObject({ opacity: 1, position: [0, 0, 0], animation: { run: false } });
});

it('keeps the same reading page still when Help or tracking ownership returns', async () => {
  await mount(); await track(); await pose(); await press('ring-tile-history'); await finish();
  native.patches.length = 0;
  sceneOptions = { interactive: false }; await act(async () => tree.update(wrapper()));
  sceneOptions = { interactive: true }; await act(async () => tree.update(wrapper()));
  await track(2); await track(3);
  expect(native.patches.filter(item => item.id === 'ring-page-content').some(item => (item.patch.animation as { run?: boolean } | undefined)?.run)).toBe(false);
  expect(node('ring-page-content').props.position).toEqual([0, 0, 0]);
});

it('acknowledges accepted focus once and keeps the decorative glint silent on Help/tracking return', async () => {
  await mount(); await track(); await pose(); await press('ring-tile-history'); await finish();
  const glint = node('ring-focus-glint'); expect(glint).toBeDefined(); expect(glint.props.ignoreEventHandling).toBe(true);
  expect(native.patches.some(item => item.id === 'ring-focus-glint' && (item.patch.animation as { run?: boolean } | undefined)?.run)).toBe(true);
  native.patches.length = 0; sceneOptions = { interactive: false }; await act(async () => tree.update(wrapper()));
  sceneOptions = { interactive: true }; await act(async () => tree.update(wrapper())); await track(2); await track(3);
  expect(native.patches.filter(item => item.id === 'ring-focus-glint').some(item => (item.patch.animation as { run?: boolean } | undefined)?.run)).toBe(false);
});

it.each(['ja', 'ko'])('passes an explicit CJK fallback for every %s native cover, body and control without changing text', async locale => {
  await translations.changeLanguage(locale); await mount(); await track(); await pose();
  const cover = node('ring-tile-history');
  const heading = cover.findAllByType('viro-text' as React.ElementType).find(item => item.props.text === translations.t('destinationRing.mock.history.title'))!;
  expect(heading).toBeDefined();
  expect(heading.props.style.fontFamily).toBe('PlusJakartaSans, NotoSansCJK');
  await press('ring-tile-history'); await finish();
  const glyphs = tree.root.findAllByType('viro-text' as React.ElementType);
  for (const glyph of glyphs) expect(glyph.props.style.fontFamily).toBe('PlusJakartaSans, NotoSansCJK');
  expect(text('ring-body')).toContain(translations.t('destinationRing.mock.history.title'));
  expect(text('ring-page-indicator')).toBeDefined();
});

it.each([1, 3, 4, 12])('restores original tile geometry through repeated focus/close with %s chapters', async count => {
  sceneOptions = { content: Array.from({ length: count }, (_, index) => ({ id: `test-${index}`, ...(index === 0 ? { role: 'overview' as const } : {}), titleKey: 'destinationRing.mock.overview.title', bodyKey: 'destinationRing.mock.overview.body' })) };
  await mount(); await track(); await pose();
  const id = `test-${count - 1}`; const original = node(`ring-tile-${id}`).props.position;
  for (let cycle = 0; cycle < 3; cycle++) {
    await pose(initial, 1000 + cycle * 100);
    await press(`ring-tile-${id}`); await finish(); await press('ring-action-close');
    expect(node('ring-reader-toolbar')).toBeUndefined(); await finish();
    expect(node(`ring-tile-${id}`).props.position).toEqual(original);
  }
});

it('settles an already accepted Close when its callback is delayed without a tracking-epoch change', async () => {
  await mount(); await track(); await pose(); await press('ring-tile-history'); await finish(); await press('ring-action-close');
  vi.setSystemTime(2200); await finish();
  expect(node('ring-focused-panel')).toBeUndefined();
});

it('uses supported painted rounded quads for native button hits', async () => {
 await mount(); await track(); await pose(); await press('ring-tile-history'); await finish();
 const surface = node('ring-action-close').findByType('quad' as React.ElementType);
 expect(surface.props).toMatchObject({highAccuracyEvents:true,ignoreEventHandling:false,materials:'argalaRingRoundedAction'});
 expect(surface.props.width).toBe(0.46);
 expect(surface.props.height).toBe(0.18);
});

it('keeps Exhibit animation completion and native frame state independent from a later diagnostic session', async () => {
  sceneOptions = { content: featuredStoryContent('D01'), presentation: danaoStagePresentation };
  await mount(); await track(); await pose();
  expect(node('exhibit-photo-island-scenery')).toBeDefined();
  expect(exhibitGalleryEntries(danaoStagePresentation.stage!.profile)).toHaveLength(7);
  await press('ring-tile-overview');
  const retainedFinish = node('ring-focused-panel').props.animation.onFinish;
  expect(node('ring-focused-panel').props.animation.name).toBe('argalaExhibitDanaoRingFocus');
  await finish();
  expect(node('ring-focused-panel').props.position).toEqual([0, 2, -2.25]);
  const image = tree.root.findByProps({ testID: 'ring-gallery-image' });
  await act(async () => image.props.onLoadEnd({ nativeEvent: null }));
  expect(native.patches.some(item => (item.patch.animation as { name?: string; run?: boolean } | undefined)?.name === 'argalaExhibitDanaoPhotoPageReveal' && (item.patch.animation as { run: boolean }).run)).toBe(false);
  let clock = Date.now(); vi.mocked(performance.now).mockImplementation(() => clock);
  for (let index = 0; index < 3; index++) { clock += 1400; await act(async () => { await vi.advanceTimersByTimeAsync(1000); }); }
  expect(tree.root.findByProps({ testID: 'ring-gallery-image' })).toBe(image);
  expect(node('ring-focused-panel').props.position).toEqual([0, 2, -2.25]);
  await act(async () => tree.unmount());
  vi.mocked(performance.now).mockImplementation(() => Date.now());
  sceneOptions = { content: featuredStoryContent('D01') };
  await mount(); await track(); await pose(); await press('ring-tile-chapter-2');
  expect(node('ring-focused-panel').props.animation.name).toBe('argalaRingFocus');
  expect(node('ring-focused-panel').props.animation.run).toBe(true);
  await act(async () => retainedFinish());
  expect(node('ring-focused-panel').props.animation.run).toBe(true);
  expect(node('ring-reader-toolbar')).toBeUndefined();
  await finish(); expect(node('ring-reader-toolbar')).toBeDefined();
});


it('settles Exhibit photos directly under reduced motion while preserving all controls', async () => {
  native.reduced = true; sceneOptions = { content: featuredStoryContent('D01'), presentation: danaoStagePresentation };
  await mount(); await track(); await pose(); await press('ring-tile-overview'); await finish();
  const image = tree.root.findByProps({ testID: 'ring-gallery-image' });
  await act(async () => image.props.onLoadEnd({ nativeEvent: null }));
  expect(native.patches.some(item => {
    const animation = item.patch.animation as { name?: string; run?: boolean } | undefined;
    return animation?.name === 'argalaExhibitDanaoPhotoPageReveal' && animation.run;
  })).toBe(false);
  expect(node('ring-reader-toolbar')).toBeDefined();
  expect(node('ring-action-close')).toBeDefined();
  expect(node('ring-action-next')).toBeDefined();
});

it('keeps decorative rules out of Exhibit cover titles and reader content', async () => {
  sceneOptions = { content: featuredStoryContent('D01'), presentation: danaoStagePresentation };
  await mount(); await track(); await pose();
  expect(tree.root.findAllByProps({ testID: 'holographic-rule' })).toHaveLength(0);
  await press('ring-tile-overview'); await finish();
  expect(tree.root.findAllByProps({ testID: 'holographic-rule' })).toHaveLength(0);
  expect(node('ring-reader-toolbar')).toBeDefined();
});

it('isolates the Exhibit reader throughout opening, focus and Close, retiring hidden chapter clicks', async () => {
  sceneOptions = { content: featuredStoryContent('D01'), presentation: danaoStagePresentation };
  await mount(); await track(); await pose();
  const retiredSelection = node('ring-tile-chapter-2').props.onClick;
  await press('ring-tile-overview');
  for (const id of ['overview', 'chapter-2', 'chapter-3']) expect(node(`ring-tile-${id}`)).toBeUndefined();
  await finish();
  expect(node('ring-focused-panel').props.position).toEqual([0, 2, -2.25]);
  await act(async () => retiredSelection());
  expect(node('ring-focused-panel').props.animation.name).toBe('argalaExhibitDanaoRingFocus');
  expect(node('ring-focused-panel').props.animation.run).toBe(false);
  await press('ring-action-close');
  for (const id of ['overview', 'chapter-2', 'chapter-3']) expect(node(`ring-tile-${id}`)).toBeUndefined();
  await finish();
  expect(node('ring-focused-panel')).toBeUndefined();
  for (const id of ['overview', 'chapter-2', 'chapter-3']) expect(node(`ring-tile-${id}`)).toBeDefined();
  await act(async () => retiredSelection());
  expect(node('ring-focused-panel')).toBeUndefined();
});

it('retains gallery progress after Close but opens the visible welcome photograph on a new tap', async () => {
  const progress = vi.fn(); sceneOptions = { content: featuredStoryContent('D01'), presentation: danaoStagePresentation, onProgress: progress };
  await mount(); await track(); await pose();
  expect(node('exhibit-gallery-entry')).toBeDefined();
  expect(tree.root.findByProps({ testID: 'exhibit-gallery-cover' }).props).toMatchObject({ resizeMode: 'ScaleToFit', imageClipMode: 'ClipToBounds' });
  expect(tree.root.findAllByType('polyline' as React.ElementType).length).toBeGreaterThan(0);
  const retiredEntry = node('exhibit-gallery-entry').props.onClick;
  await press('exhibit-gallery-entry');
  expect(node('exhibit-gallery-entry')).toBeUndefined();
  expect(node('ring-tile-chapter-2')).toBeUndefined();
  expect(tree.root.findAllByType('polyline' as React.ElementType)).toHaveLength(0);
  await finish();
  expect(node('ring-focused-panel').props.position).toEqual([0, 2, -2.25]);
  expect(text('exhibit-photo-position')).toBe(translations.t('presentation.photoPosition', { current: 1, total: 7 }));
  expect(progress.mock.lastCall?.[0]).toMatchObject({ selectedId: null, openedIds: [], exhibitGallery: { focused: true } });
  await press('ring-action-gallery-photo-next');
  expect(text('exhibit-photo-position')).toBe(translations.t('presentation.photoPosition', { current: 2, total: 7 }));
  expect(node('ring-body')).toBeUndefined();
  expect(progress.mock.lastCall?.[0].openedIds).toEqual([]);
  await press('ring-action-close');
  expect(progress.mock.lastCall?.[0].exhibitGallery.focused).toBe(false);
  expect(node('exhibit-gallery-entry')).toBeUndefined();
  await finish();
  expect(progress.mock.lastCall?.[0].exhibitGallery.cursor.mediaId).toBe(danaoStagePresentation.stage!.profile.media[1].id);
  await act(async () => retiredEntry());
  expect(node('ring-focused-panel')).toBeUndefined();
  await press('exhibit-gallery-entry'); await finish();
  expect(tree.root.findByProps({ testID: 'ring-gallery-image' }).props.source).toBe(danaoStagePresentation.stage!.profile.media[0].source);
});

it('retains gallery completion through Help and tracking loss and restores only after a current pose', async () => {
  sceneOptions = { content: featuredStoryContent('D01'), presentation: danaoStagePresentation };
  await mount(); await track(); await pose(); await press('exhibit-gallery-entry');
  const done = node('ring-focused-panel')?.props.animation.onFinish;
  expect(done).toBeTypeOf('function');
  sceneOptions = { ...sceneOptions, interactive: false }; await act(async () => tree.update(wrapper()));
  await act(async () => done());
  expect(node('ring-action-gallery-photo-next')).toBeUndefined();
  await track(2); await track();
  sceneOptions = { ...sceneOptions, interactive: true }; await act(async () => tree.update(wrapper()));
  expect(node('ring-action-gallery-photo-next')).toBeUndefined();
  await pose(initial, 1100);
  expect(node('ring-action-gallery-photo-next')).toBeDefined();
  await press('ring-action-gallery-photo-next');
  const restore = { selectedId: null, cursors: {}, openedIds: [], exhibitGallery: { focused: true,
    cursor: { page: 0, offset: 0, locale: 'en', size: 'standard' as const, mediaId: 'D01-ext-11', mediaPage: 0 } } };
  await act(async () => tree.unmount()); sceneOptions = { content: featuredStoryContent('D01'), presentation: danaoStagePresentation, initialProgress: restore };
  await mount(); await track(); await pose();
  expect(text('exhibit-photo-position')).toBe(translations.t('presentation.photoPosition', { current: 2, total: 7 }));
  expect(node('exhibit-gallery-entry')).toBeUndefined();
});

it('keeps Danao scenery noninteractive and retires it for Help and reduced motion', async () => {
  sceneOptions = { content: featuredStoryContent('D01'), presentation: danaoStagePresentation };
  await mount(); await track(); await pose();
  const decoration = tree.root.findAllByType('polyline' as React.ElementType);
  expect(decoration.length).toBeGreaterThan(0); expect(decoration.length).toBeLessThanOrEqual(64);
  for (const node of decoration) expect(node.props.ignoreEventHandling).toBe(true);
  const entry = node('exhibit-gallery-entry');
  expect(entry.findAllByType('viro-image' as React.ElementType).some(image => image.props.highAccuracyEvents && !image.props.ignoreEventHandling)).toBe(true);
  sceneOptions = { ...sceneOptions, interactive: false }; await act(async () => tree.update(wrapper()));
  expect(tree.root.findAllByType('polyline' as React.ElementType)).toHaveLength(0);
  await act(async () => tree.unmount()); native.reduced = true;
  sceneOptions = { content: featuredStoryContent('D01'), presentation: danaoStagePresentation };
  await mount(); await track(); await pose();
  expect(node('exhibit-gallery-entry')).toBeDefined();
  expect(tree.root.findAllByType('polyline' as React.ElementType)).toHaveLength(0);
});

it('keeps the stage chapter denominator at three and never counts the gallery as an opening', async () => {
  const progress = vi.fn(); sceneOptions = { content: featuredStoryContent('D01'), presentation: danaoStagePresentation, onProgress: progress };
  await mount(); await track(); await pose(); await press('exhibit-gallery-entry');
  await act(async () => controls!.recenter());
  expect(progress.mock.lastCall?.[0].openedIds).toEqual([]);
  await press('ring-action-close'); await finish();
  await press('ring-tile-overview'); await finish();
  expect(text('ring-chapter-position')).toBe(translations.t('destinationStories.chapter', { current: 1, total: 3 }));
  expect(text('ring-sample-label')).toBe(translations.t('destinationStories.openedCount', { count: 1, total: 3 }));
  expect(progress.mock.lastCall?.[0].openedIds).toEqual(['overview']);
  expect(progress.mock.lastCall?.[0].exhibitGallery.focused).toBe(false);
});

it('rejects a queued gallery page command after Close is accepted but before React commits', async () => {
  const progress = vi.fn(); sceneOptions = { content: featuredStoryContent('D01'), presentation: danaoStagePresentation, onProgress: progress };
  await mount(); await track(); await pose(); await press('exhibit-gallery-entry'); await finish();
  const next = node('ring-action-gallery-photo-next').props.onClick;
  const close = node('ring-action-close').props.onClick;
  await act(async () => { close(); next(); });
  expect(progress.mock.lastCall?.[0].exhibitGallery).toMatchObject({ focused: false, cursor: { mediaId: 'D01-preview' } });
  await finish(); await press('exhibit-gallery-entry'); await finish();
  expect(text('exhibit-photo-position')).toBe('Photo 1 / 7');
});

it('also fences queued diagnostic page commands after accepted Close', async () => {
  const progress = vi.fn(); sceneOptions = { onProgress: progress };
  await mount(); await track(); await pose(); await press('ring-tile-history'); await finish();
  const next = node('ring-action-next').props.onClick; const close = node('ring-action-close').props.onClick;
  await act(async () => { close(); next(); });
  expect(progress.mock.lastCall?.[0].cursors.history).toBeUndefined();
  await finish(); await press('ring-tile-history'); await finish();
  expect(text('ring-page-indicator')).toMatch(/^1 /);
});

it('keeps stage ornament quiet when Help is opened during the introduction', async () => {
  sceneOptions = { content: featuredStoryContent('D01'), presentation: danaoStagePresentation, deployment: 'return', interactive: false, effectsEnabled: false };
  await mount(); await track(); await pose();
  expect(node('exhibit-gallery-entry')).toBeDefined();
  expect(tree.root.findAllByType('polyline' as React.ElementType)).toHaveLength(0);
});

it('does not let a retired Danao gallery completion affect a new diagnostic frame', async () => {
  sceneOptions = { content: featuredStoryContent('D01'), presentation: danaoStagePresentation };
  await mount(); await track(); await pose(); await press('exhibit-gallery-entry');
  const done = node('ring-focused-panel').props.animation.onFinish;
  await act(async () => tree.unmount());
  sceneOptions = { content: featuredStoryContent('D01') }; await mount(); await track(); await pose(); await press('ring-tile-chapter-2');
  await act(async () => done());
  expect(node('ring-focused-panel').props.animation.name).toBe('argalaRingFocus');
  expect(node('ring-focused-panel').props.animation.run).toBe(true);
  expect(node('exhibit-gallery-entry')).toBeUndefined();
  await finish(); expect(node('ring-reader-toolbar')).toBeDefined();
});

it.each(['gallery', 'story'])('keeps Danao %s slides stationary after native bitmap installation and rapid paging', async kind => {
  sceneOptions = { content: featuredStoryContent('D01'), presentation: danaoStagePresentation };
  await mount(); await track(); await pose();
  await press(kind === 'gallery' ? 'exhibit-gallery-entry' : 'ring-tile-overview'); await finish();
  expect(node('ring-focus-glint')).toBeUndefined();
  const frame = node('ring-focused-panel'); const transform = frame.props.position;
  const borders = tree.root.findAllByType('viro-image' as React.ElementType).filter(image => image.props.testID === 'holographic-surface');
  const materialRegistrations = vi.mocked(ViroMaterials.createMaterials).mock.calls.length;
  native.patches.length = 0;
  for (let index = 0; index < 4; index++) {
    const photo = tree.root.findAllByType('viro-image' as React.ElementType).find(image => image.props.testID === 'ring-gallery-image');
    if (photo) await act(async () => photo.props.onLoadEnd({ nativeEvent: null }));
    await press(kind === 'gallery' ? 'ring-action-gallery-photo-next' : 'ring-action-next');
  }
  const pageAnimations = native.patches.filter(item => {
    const animation = item.patch.animation as { name?: string; run?: boolean } | undefined;
    return animation?.run && animation.name?.includes('PageReveal');
  });
  expect(pageAnimations).toEqual([]);
  expect(native.patches.some(item => (item.patch.position as number[] | undefined)?.[0] === 0.018)).toBe(false);
  expect(node('ring-focused-panel')).toBe(frame); expect(frame.props.position).toEqual(transform);
  expect(tree.root.findAllByType('viro-image' as React.ElementType).filter(image => image.props.testID === 'holographic-surface')).toEqual(borders);
  expect(vi.mocked(ViroMaterials.createMaterials).mock.calls.length).toBe(materialRegistrations);
});

it.each(['D01', 'D02', 'D03', 'D04', 'D05', 'D06', 'D07', 'D08', 'D09'] as const)('runs %s gallery and every chapter in its own stable native stage', async id => {
  const { getExhibitStagePresentation } = await import('./exhibit-ring-scene');
  const presentation = getExhibitStagePresentation(id)!; const profile = presentation.stage!.profile;
  const progress = vi.fn(); const content = featuredStoryContent(id);
  sceneOptions = { content, presentation, onProgress: progress };
  await mount(); await track(); await pose();
  expect(node(id === 'D01' ? 'exhibit-danao-scenery' : `exhibit-${profile.theme}-scenery`)).toBeDefined();
  await press('exhibit-gallery-entry'); await finish();
  expect(progress.mock.lastCall?.[0].openedIds).toEqual([]);
  expect(node(id === 'D01' ? 'exhibit-danao-scenery' : `exhibit-${profile.theme}-scenery`)).toBeUndefined();
  for (let index = 0; index < profile.media.length; index++) {
    const image = tree.root.findByProps({ testID: 'ring-gallery-image' });
    expect(image.props.source).toBe(profile.media[index].source);
    await act(async () => image.props.onLoadEnd({ nativeEvent: null }));
    expect(text('exhibit-photo-position')).toBe(`Photo ${index + 1} / ${profile.media.length}`);
    if (index < profile.media.length - 1) await press('ring-action-gallery-photo-next');
  }
  const retiredNext = node('ring-action-gallery-photo-previous').props.onClick;
  await press('ring-action-close'); await finish();
  expect(progress.mock.lastCall?.[0].exhibitGallery.focused).toBe(false);
  for (let index = 0; index < content.length; index++) {
    await pose(); await press(`ring-tile-${content[index].id}`); await finish();
    expect(node('ring-focus-glint')).toBeUndefined();
    expect(node('exhibit-gallery-entry')).toBeUndefined();
    expect(text('ring-chapter-position')).toBe(`Chapter ${index + 1} / ${content.length}`);
    expect(node('ring-focused-panel').props.position).toEqual([0, 2, -2.25]);
    await press('ring-action-next');
    await press('ring-action-close'); await finish();
  }
  await act(async () => retiredNext?.());
  expect(progress.mock.lastCall?.[0].openedIds).toEqual(content.map(chapter => chapter.id));
  await press('exhibit-gallery-entry'); await finish();
  expect(text('exhibit-photo-position')).toBe(`Photo ${profile.photoIslands ? 1 : profile.media.length} / ${profile.media.length}`);
  expect(native.patches.some(item => (item.patch.animation as { run?: boolean; name?: string } | undefined)?.run && (item.patch.animation as { name: string }).name.includes('PageReveal'))).toBe(false);
});

it('opens each Danao photo island at its exact image while retaining only gallery progress', async () => {
  const profile = danaoStagePresentation.stage!.profile;
  const entrances = exhibitGalleryEntries(profile).slice(1);
  expect(entrances).toHaveLength(6);
  const progress = vi.fn(); sceneOptions = { content: featuredStoryContent('D01'), presentation: danaoStagePresentation, onProgress: progress };
  await mount(); await track(); await pose();
  expect(tree.root.findAllByType('viro-image' as React.ElementType).filter(image => String(image.props.testID).startsWith('exhibit-island-cover-'))).toHaveLength(6);
  for (const entry of entrances) {
    await press(`exhibit-island-entry-${entry.mediaId}`);
    expect(node('exhibit-gallery-entry')).toBeUndefined();
    expect(node('exhibit-photo-island-scenery')).toBeUndefined();
    await finish();
    expect(tree.root.findByProps({ testID: 'ring-gallery-image' }).props.source).toBe(profile.media.find(photo => photo.id === entry.mediaId)!.source);
    expect(progress.mock.lastCall?.[0]).toMatchObject({ selectedId: null, openedIds: [], exhibitGallery: { focused: true, cursor: { mediaId: entry.mediaId } } });
    expect(node('ring-focus-glint')).toBeUndefined();
    await press('ring-action-close');
    expect(progress.mock.lastCall?.[0]).toMatchObject({ selectedId: null, openedIds: [], exhibitGallery: { focused: false } });
    expect(node(`exhibit-island-entry-${entry.mediaId}`)).toBeUndefined();
    await finish(); expect(node(`exhibit-island-entry-${entry.mediaId}`)).toBeDefined();
  }
  await press('exhibit-gallery-entry'); await finish();
  expect(progress.mock.lastCall?.[0].exhibitGallery.cursor.mediaId).toBe(profile.media[0].id);
});

it('fences queued photo-island taps, retains cursor through Help, and restores a gallery after a new frame', async () => {
  const profile = danaoStagePresentation.stage!.profile; const entry = exhibitGalleryEntries(profile)[3];
  expect(entry.mediaId).toBeDefined();
  const progress = vi.fn(); sceneOptions = { content: featuredStoryContent('D01'), presentation: danaoStagePresentation, onProgress: progress };
  await mount(); await track(); await pose();
  const tap = node(`exhibit-island-entry-${entry.mediaId}`).props.onClick;
  sceneOptions = { ...sceneOptions, interactive: false }; await act(async () => tree.update(wrapper()));
  await act(async () => tap()); expect(node('ring-focused-panel')).toBeUndefined();
  sceneOptions = { ...sceneOptions, interactive: true }; await act(async () => tree.update(wrapper()));
  const other = node(`exhibit-island-entry-${exhibitGalleryEntries(profile)[1].mediaId}`).props.onClick;
  await press(`exhibit-island-entry-${entry.mediaId}`); const done = node('ring-focused-panel').props.animation.onFinish;
  await act(async () => other()); expect(progress.mock.lastCall?.[0].exhibitGallery.cursor.mediaId).toBe(entry.mediaId);
  sceneOptions = { ...sceneOptions, interactive: false }; await act(async () => tree.update(wrapper()));
  await track(2); await act(async () => done()); await track();
  sceneOptions = { ...sceneOptions, interactive: true }; await act(async () => tree.update(wrapper()));
  expect(node('ring-action-gallery-photo-next')).toBeUndefined(); await pose(initial, 1100);
  await press('ring-action-gallery-photo-next');
  const saved = progress.mock.lastCall![0]; expect(saved.selectedId).toBeNull(); expect(saved.openedIds).toEqual([]);
  await act(async () => tree.unmount()); await act(async () => { tap(); other(); done(); });
  sceneOptions = { content: featuredStoryContent('D01'), presentation: danaoStagePresentation, onProgress: progress, initialProgress: saved };
  await mount(); await track(); await pose(initial, 1200);
  expect(tree.root.findByProps({ testID: 'ring-gallery-image' }).props.source).toBe(profile.media.find(photo => photo.id === saved.exhibitGallery.cursor.mediaId)!.source);
  expect(node('exhibit-gallery-entry')).toBeUndefined();
  await press('ring-action-close'); await finish();
  expect(node('exhibit-photo-island-scenery')).toBeDefined();
});

it('recenters a photo-island focus without counting it as a story or replaying page motion', async () => {
  const profile = danaoStagePresentation.stage!.profile; const entry = exhibitGalleryEntries(profile)[2];
  expect(entry.mediaId).toBeDefined();
  const progress = vi.fn(); sceneOptions = { content: featuredStoryContent('D01'), presentation: danaoStagePresentation, onProgress: progress };
  await mount(); await track(); await pose(); await press(`exhibit-island-entry-${entry.mediaId}`);
  await pose({ ...initial, forward: [1, 0, 0] }); await act(async () => controls!.recenter());
  expect(progress.mock.lastCall?.[0].openedIds).toEqual([]);
  expect(node('ring-focused-panel').props.position).toEqual([2.25, 2, 0]);
  await press('ring-action-close'); await finish();
  await press('ring-tile-chapter-3'); await finish();
  expect(text('ring-chapter-position')).toBe('Chapter 3 / 3');
  expect(progress.mock.lastCall?.[0].openedIds).toEqual(['chapter-3']);
});

it.each(['en', 'ja', 'ko'])('shows %s photo context only after opening and keeps native image hits explicit', async locale => {
  await translations.changeLanguage(locale);
  sceneOptions = { content: featuredStoryContent('D01'), presentation: danaoStagePresentation };
  await mount(); await track(); await pose();
  expect(translations.getResource(locale, 'translation', 'presentation.galleryOpen')).toBeTruthy();
  expect(tree.root.findAllByProps({ testID: 'exhibit-islands-hint' })).toHaveLength(0);
  const covers = tree.root.findAllByType('viro-image' as React.ElementType).filter(image => String(image.props.testID).startsWith('exhibit-island-cover-'));
  expect(covers).toHaveLength(6);
  for (const cover of covers) expect(cover.props).toMatchObject({ highAccuracyEvents: true, ignoreEventHandling: false, resizeMode: 'ScaleToFit', position: [0, 0, 0.007] });
  const entrances = exhibitGalleryEntries(danaoStagePresentation.stage!.profile);
  for (const entry of entrances) {
    const cover = node(entry.id === danaoStagePresentation.stage!.profile.galleryId ? 'exhibit-gallery-entry' : `exhibit-island-entry-${entry.mediaId}`);
    expect(cover.findAllByType('viro-text' as React.ElementType)).toHaveLength(0);
  }
  for (const line of tree.root.findAllByType('polyline' as React.ElementType)) expect(line.props.ignoreEventHandling).toBe(true);
  sceneOptions = { ...sceneOptions, interactive: false }; await act(async () => tree.update(wrapper()));
  for (const cover of covers) expect(cover.props.ignoreEventHandling).toBe(true);
  sceneOptions = { ...sceneOptions, interactive: true }; await act(async () => tree.update(wrapper()));
  await press(`exhibit-island-entry-${entrances[1].mediaId}`); await finish();
  expect(text('exhibit-photo-position')).toBe(translations.t('presentation.photoPosition', { current: 2, total: 7 }));
  expect(text('ring-gallery-caption').trim().length).toBeGreaterThan(0);
});

it('offers only the accepted Photo Islands composition for every featured destination', () => {
  for (const id of ['D01','D02','D03','D04','D05','D06','D07','D08','D09']) expect(getExhibitStagePresentation(id)!.stage!.profile.photoIslands).toBeDefined();
  expect(getExhibitStagePresentation('pilot-aclc')).toBeNull();
});

it.each(['D01','D02','D03','D04','D05','D06','D07','D08','D09'] as const)('opens every %s standalone photograph at its own context without chapter progress', async id => {
  const { getExhibitStagePresentation } = await import('./exhibit-ring-scene');
  const presentation = getExhibitStagePresentation(id)!; const profile = presentation.stage!.profile;
  expect(profile.photoIslands).toBeDefined();
  const progress = vi.fn(); sceneOptions = { content: featuredStoryContent(id), presentation, onProgress: progress };
  await mount(); await track(); await pose();
  const entrances = exhibitGalleryEntries(profile);
  expect(entrances).toHaveLength(profile.media.length);
  expect(node(id === 'D01' ? 'exhibit-danao-scenery' : `exhibit-${profile.theme}-scenery`)).toBeDefined();
  for (const [index, entry] of entrances.entries()) {
    const targetId = entry.id === profile.galleryId ? 'exhibit-gallery-entry' : `exhibit-island-entry-${entry.mediaId}`;
    expect(node(targetId).findAllByType('viro-text' as React.ElementType)).toHaveLength(0);
    const image = node(targetId).findAllByType('viro-image' as React.ElementType).find(item => item.props.testID !== 'holographic-surface')!;
    expect(image.props.source).toBe(profile.media[index].source); expect(image.props.highAccuracyEvents).toBe(true);
    await press(targetId); await finish();
    expect(tree.root.findByProps({ testID: 'ring-gallery-image' }).props.source).toBe(profile.media[index].source);
    expect(text('exhibit-photo-position')).toBe(`Photo ${index + 1} / ${profile.media.length}`);
    expect(progress.mock.lastCall?.[0]).toMatchObject({ selectedId: null, openedIds: [], exhibitGallery: { focused: true, cursor: { mediaId: profile.media[index].id } } });
    expect(node('exhibit-photo-island-scenery')).toBeUndefined(); expect(node('ring-focus-glint')).toBeUndefined();
    await press('ring-action-close'); await finish();
  }
});


it.each([[], ['unknown'], [danaoStagePresentation.stage!.profile.media[1].id], danaoStagePresentation.stage!.profile.media.slice(1, 3).map(photo => photo.id)].map(allowed => ({ allowed })))('does not expose unauthorized photos or gallery progress for $allowed', async ({ allowed }) => {
 const presentation = getExhibitStagePresentation('D01', allowed)!;
 const allowedMedia = danaoStagePresentation.stage!.profile.media.filter(photo => allowed.includes(photo.id));
 const progress = vi.fn();
 sceneOptions = { content: [{ id: featuredStoryContent('D01')[0].id, role: featuredStoryContent('D01')[0].role, approved: { ...featuredStoryContent('D01')[0].approved!, media: [] } }], presentation, onProgress: progress };
 await mount(); await track(); await pose();
 const photoNodes = tree.root.findAllByType('viro-image' as React.ElementType).filter(item => item.props.testID === 'exhibit-gallery-cover' || String(item.props.testID).startsWith('exhibit-island-cover-'));
 expect(photoNodes.map(item => item.props.source)).toEqual(allowedMedia.map(photo => photo.source));
 if (!allowedMedia.length) {
  expect(presentation.stage).toBeUndefined(); expect(node('exhibit-gallery-entry')).toBeUndefined();
  expect(progress.mock.lastCall?.[0].exhibitGallery).toBeUndefined();
  await press('ring-tile-overview'); await finish();
  expect(node('ring-focused-panel').props.position).toEqual([0, 2, -2.25]);
  expect(tree.root.findAllByProps({ testID: 'ring-gallery-image' })).toHaveLength(0);
 } else {
  expect(presentation.stage!.profile.media).toEqual(allowedMedia);
  await press('exhibit-gallery-entry'); await finish();
  expect(tree.root.findByProps({ testID: 'ring-gallery-image' }).props.source).toBe(allowedMedia[0].source);
  expect(text('exhibit-photo-position')).toBe(`Photo 1 / ${allowedMedia.length}`);
  expect(progress.mock.lastCall?.[0].exhibitGallery.cursor.mediaId).toBe(allowedMedia[0].id);
 }
});


it('binds immutable authorized scene hosts without replacing the full showcase configuration', () => {
 const complete = getExhibitSceneHost('D01')!;
 expect(getExhibitSceneHost('D01')).toBe(complete);
 const allowed = [danaoStagePresentation.stage!.profile.media[1].id];
 const limited = getExhibitSceneHost('D01', allowed)!;
 allowed.push(danaoStagePresentation.stage!.profile.media[2].id);
 const limitedElement = limited({ content: [], onReady() {}, onTracking() {} }) as React.ReactElement<{ presentation: typeof danaoStagePresentation }>;
 expect(limitedElement.props.presentation.stage!.profile.media.map(photo => photo.id)).toEqual([allowed[0]]);
 const empty = getExhibitSceneHost('D01', [])!;
 const emptyElement = empty({ content: [], onReady() {}, onTracking() {} }) as React.ReactElement<{ presentation: typeof danaoStagePresentation }>;
 expect(emptyElement.props.presentation.stage).toBeUndefined();
 expect(getExhibitSceneHost('D01')).toBe(complete);
 expect(danaoStagePresentation.stage!.profile.media).toHaveLength(7);
 expect(getExhibitSceneHost('pilot-aclc')).toBeNull();
});


it.each([4, 12].flatMap(count => [false, true].map(gallery => ({ count, gallery }))))('renders and focuses $count verified chapters with gallery=$gallery', async ({ count, gallery }) => {
 const translated = { en: { value: 'Synthetic approved chapter', approvalReference: 'Test' }, ja: { value: 'Synthetic approved chapter', approvalReference: 'Test' }, ko: { value: 'Synthetic approved chapter', approvalReference: 'Test' } };
 const media = getDestination('D01')!.media!.slice(0, 2).map(photo => ({ ...photo, alt: translated, caption: translated, offlineRightsReference: 'Test offline permission' }));
 const fixture = destinationSchema.parse({ ...getDestination('pilot-aclc'), id: 'D01', media, ar: {
  schemaVersion: 1, contentVersion: 'test-overflow', storyApproval: { contentVersion: 'test-overflow', approvalReference: 'Test editorial assessment', reviewer: 'Test', reviewedAt: '2026-11-18', primaryChapterIds: ['verified-0'] },
  tiles: Array.from({ length: count }, (_, index) => ({ id: `verified-${index}`, ...(index === 0 ? { role: 'overview' } : {}), title: translated, body: translated, ...(index === 0 ? { mediaIds: media.map(photo => photo.id) } : {}) })),
 } });
 const approved = new Set(approvedArContent(fixture, 'en').map(chapter => chapter.id));
 expect(approved.size).toBe(count);
 const content = fixture.ar!.tiles.filter(chapter => approved.has(chapter.id)).map(chapter => ({ id: chapter.id, role: chapter.role, approved: { title: chapter.title, body: chapter.body, media: (chapter.mediaIds ?? []).flatMap(id => media.find(photo => photo.id === id) ?? []) } }));
 sceneOptions = { content, presentation: getExhibitStagePresentation('D01', gallery ? media.map(photo => photo.id) : [])! };
 await mount(); await track(); await pose();
 const tiles = content.map(chapter => node(`ring-tile-${chapter.id}`));
 expect(tiles.every(Boolean)).toBe(true);
 expect(tiles.every(tile => tile.props.position.every(Number.isFinite))).toBe(true);
 expect(new Set(tiles.map(tile => JSON.stringify(tile.props.position))).size).toBe(count);
 await press(`ring-tile-verified-${count - 1}`); await finish();
 expect(node('ring-focused-panel').props.position).toEqual([0, 2, -2.25]);
 await press('ring-action-close'); await finish();
 expect(node(`ring-tile-verified-${count - 1}`)).toBeDefined();
});

it.each([false, true])('keeps story-only guide reading and frame ownership with reduced motion=%s', async reduced => {
  native.reduced = reduced;
  const progress = vi.fn();
  const content = withExhibitVisitorContent(getDestination('D01')!, featuredStoryContent('D01'));
  const safety = `ring-guide-${EXHIBIT_GUIDE_IDS.safety}`;
  sceneOptions = { content, presentation: getExhibitStagePresentation('D01', [])!, onProgress: progress,
    viewMode: defaultArView, onViewComplete: vi.fn() };

  await mount(); await track(); await pose();
  const guidePositions = () => Object.values(EXHIBIT_GUIDE_IDS).map(id => node(`ring-guide-${id}`).props.position);
  const initialPositions = guidePositions();
  const surface = node(safety).findByType('viro-image' as React.ElementType);
  expect(surface.props).toMatchObject({ highAccuracyEvents: true, ignoreEventHandling: false });
  const safetyLabel = () => node(safety).findAllByType('viro-text' as React.ElementType)[0];
  expect(safetyLabel().props).toMatchObject({ text: 'Safety', ignoreEventHandling: true });
  const font = safetyLabel().props.style.fontSize;
  expect(controls?.readerAvailable).toBe(true);
  const resize = controls!.changeReadingSize!;
  await act(async () => resize(1));
  expect(safetyLabel().props.style.fontSize).toBeGreaterThan(font);
  await act(async () => resize(-1));
  expect(safetyLabel().props.style.fontSize).toBe(font);
  const retiredTap = node(safety).props.onClick;

  sceneOptions = { ...sceneOptions, viewMode: requestView(defaultArView, 'nearby', true) };
  await act(async () => tree.update(wrapper()));
  expect(node('ar-view-details').props.visible).toBe(false);
  expect(controls?.readerAvailable).toBe(false);
  await act(async () => { retiredTap(); resize(1); });
  expect(node('ring-focused-panel')).toBeUndefined();
  expect(safetyLabel().props.style.fontSize).toBe(font);
  sceneOptions = { ...sceneOptions, viewMode: defaultArView };
  await act(async () => tree.update(wrapper()));
  expect(guidePositions()).toEqual(initialPositions);

  await press(safety);
  if (reduced) expect(ViroAnimations.registerAnimations).toHaveBeenCalledWith({
    argalaExhibitDanaoRingFocus: expect.objectContaining({ duration: 0 }),
  });
  await finish();
  expect(node('ring-focused-panel').props.position).toEqual([0, 2, -2.25]);
  expect(node(safety)).toBeUndefined();
  expect(progress.mock.lastCall?.[0].openedIds).toEqual([]);
  await act(async () => controls!.changeReadingSize!(1));
  await press('ring-action-next');
  const page = text('ring-page-indicator');
  expect(page).toMatch(/^2 /);
  await act(async () => controls!.recenter());
  expect(text('ring-page-indicator')).toBe(page);
  await press('ring-action-close');
  await finish();
  expect(guidePositions()).toEqual(initialPositions);
  await press(safety);
  await finish();
  expect(text('ring-page-indicator')).toBe(page);

  const saved = progress.mock.lastCall![0];
  await act(async () => tree.unmount());
  native.getItem.mockResolvedValue(native.setItem.mock.lastCall?.[1]);
  sceneOptions = { ...sceneOptions, initialProgress: saved };
  await mount(); await track(); await pose();
  await finish();
  expect(text('ring-page-indicator')).toBe(page);
  expect(progress.mock.lastCall?.[0].openedIds).toEqual([]);
  expect(progress.mock.lastCall?.[0].exhibitGallery).toBeUndefined();
});
