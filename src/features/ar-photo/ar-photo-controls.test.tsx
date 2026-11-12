import { nativeUi, withHeroUI } from '@/test/native-ui';
import * as Native from 'react-native';
import * as React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { createInstance, type i18n } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { localizationOptions } from '@/i18n/options';
import { ArPhotoControls } from './ar-photo-controls';
import { PHOTO_DEADLINE_MS } from './controller';
import { PhotoFailure, type NativeCapture, type PhotoResource } from './types';
const boundary = vi.hoisted(() => ({ capture: vi.fn() }));
vi.mock('./service', () => ({ createPhotoService: () => ({ capture: boundary.capture }) }));
let tree: ReactTestRenderer | undefined;
let translations: i18n;
let running: boolean; let sessionKey: string; let nativeCapture: NativeCapture | null;
let resource: PhotoResource;
const view = () => <I18nextProvider i18n={translations}>{withHeroUI(<ArPhotoControls running={running} sessionKey={sessionKey} capture={nativeCapture} />)}</I18nextProvider>;
const output = () => JSON.stringify(tree?.toJSON());
const button = (key: string) => tree!.root.findAllByType('button').find(b => b.props.accessibilityLabel === translations.t(key))!;
async function mount() { await act(async () => { tree = create(view()); }); }
async function loadImage() { await act(async () => tree!.root.findByType('img').props.onLoad()); }
async function update() { await act(async () => tree!.update(view())); }
async function press(key: string) { await act(async () => button(key).props.onPress()); }
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true, __DEV__: false });
  running = true; sessionKey = 'principal/admission/destination/frame1'; nativeCapture = vi.fn();
  resource = { uri: 'file:///private/captured.jpg', save: vi.fn(async () => {}), share: vi.fn(async () => {}), dispose: vi.fn() };
  boundary.capture.mockReset().mockResolvedValue(resource);
  translations = createInstance(); await translations.use(initReactI18next).init({ ...localizationOptions, lng: 'en', react: { useSuspense: false } });
  const original = console.error; vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => { if (!String(args[0]).startsWith('react-test-renderer is deprecated')) original(...args); });
});
afterEach(async () => { await act(async () => tree?.unmount()); tree = undefined; vi.useRealTimers(); nativeUi.fontScale = 1; vi.restoreAllMocks(); });
it('mounts only bounded utility controls, without capturing or intercepting the whole native scene', async () => {
  await mount(); expect(boundary.capture).not.toHaveBeenCalled();
  expect(button('arPhoto.capture')).toBeDefined(); expect(tree!.root.findAllByType('modal' as React.ElementType)).toHaveLength(0);
  expect(tree!.root.findByProps({ testID: 'ar-photo-controls' }).props.pointerEvents).toBe('box-none');
});
it('shows an explicit preview with save once, share without a delivery claim, and discard', async () => {
  await mount(); await press('arPhoto.capture');
  expect(tree!.root.findAllByType('modal' as React.ElementType)).toHaveLength(1);
  expect(tree!.root.findByType('img').props.source).toEqual({ uri: resource.uri });
  await loadImage(); await press('arPhoto.save'); expect(resource.save).toHaveBeenCalledOnce(); expect(output()).toContain(translations.t('arPhoto.saved'));
  await press('arPhoto.share'); expect(resource.share).toHaveBeenCalledOnce();
  expect(output()).not.toContain('shared successfully'); await press('arPhoto.discard');
  expect(resource.dispose).toHaveBeenCalledOnce(); expect(tree!.root.findAllByType('modal' as React.ElementType)).toHaveLength(0);
});
it('retires the preview on background and rejects a retained old capture callback after foreground return', async () => {
  await mount(); const oldCapture = button('arPhoto.capture').props.onPress; await press('arPhoto.capture');
  running = false; await update(); expect(resource.dispose).toHaveBeenCalledOnce();
  expect(tree!.root.findAllByType('modal' as React.ElementType)).toHaveLength(0);
  running = true; await update(); await act(async () => oldCapture());
  expect(boundary.capture).toHaveBeenCalledOnce();
});
it('retires ownership when the native frame or principal changes but preserves it for equivalent callback rerenders', async () => {
  await mount(); await press('arPhoto.capture'); nativeCapture = vi.fn(); await update();
  expect(resource.dispose).not.toHaveBeenCalled();
  sessionKey = 'other-principal/admission/destination/frame2'; await update();
  expect(resource.dispose).toHaveBeenCalledOnce(); expect(tree!.root.findAllByType('modal' as React.ElementType)).toHaveLength(0);
});
it('gives Android Back the same temporary discard behavior', async () => {
  await mount(); await press('arPhoto.capture');
  await act(async () => tree!.root.findByType('modal' as React.ElementType).props.onRequestClose());
  expect(resource.dispose).toHaveBeenCalledOnce(); expect(tree!.root.findAllByType('modal' as React.ElementType)).toHaveLength(0);
});
it.each(['en', 'ja', 'ko'] as const)('translates real %s known errors, unknown fallback, save retry and live language changes', async locale => {
  await translations.changeLanguage(locale); await mount();
  const known = ['unavailable', 'busy', 'capture-failed', 'capture-write', 'unsupported', 'timeout'] as const;
  for (const failure of [...known.map(code => new PhotoFailure(code)), new Error('PRIVATE_NATIVE_PATH')]) {
    boundary.capture.mockRejectedValueOnce(failure); await press('arPhoto.capture');
    const key = failure instanceof PhotoFailure ? failure.code : 'capture-failed';
    expect(output()).toContain(translations.t(`arPhoto.errors.${key}`));
    expect(output()).not.toContain('PRIVATE_NATIVE_PATH'); expect(output()).not.toContain('arPhoto.errors.');
  }
  await press('arPhoto.capture'); await loadImage(); vi.mocked(resource.save).mockRejectedValueOnce(new Error('PRIVATE_DATABASE_ERROR'));
  await press('arPhoto.save'); expect(output()).toContain(translations.t('arPhoto.errors.save-failed'));
  const next = locale === 'ja' ? 'ko' : 'ja'; await act(async () => { await translations.changeLanguage(next); });
  expect(output()).toContain(translations.t('arPhoto.errors.save-failed'));
  await press('arPhoto.save'); expect(output()).toContain(translations.t('arPhoto.saved')); expect(output()).not.toContain('PRIVATE_DATABASE_ERROR');
  for (const failure of [new PhotoFailure('share-unavailable'), new Error('PRIVATE_SHARE_ERROR')]) {
    vi.mocked(resource.share).mockRejectedValueOnce(failure); await press('arPhoto.share');
    expect(output()).toContain(translations.t(`arPhoto.errors.${failure instanceof PhotoFailure ? failure.code : 'share-failed'}`));
    expect(output()).not.toContain('PRIVATE_SHARE_ERROR');
  }
});
it('hides capture when no current native navigator is available', async () => {
  nativeCapture = null; await mount(); expect(tree!.root.findAllByType('button')).toHaveLength(0); expect(boundary.capture).not.toHaveBeenCalled();
});
it('shows a localized failed-image state and keeps discard available', async () => {
  await mount(); await press('arPhoto.capture'); await act(async () => tree!.root.findByType('img').props.onError());
  expect(output()).toContain(translations.t('arPhoto.errors.preview-failed'));
  await press('arPhoto.discard'); expect(resource.dispose).toHaveBeenCalledOnce();
});

it.each(['en', 'ja', 'ko'] as const)('keeps capture labeling stable and announces pending processing in %s', async locale => {
  await translations.changeLanguage(locale);
  boundary.capture.mockImplementationOnce(() => new Promise(() => {}));
  await mount(); const layoutClasses = () => button('arPhoto.capture').props.className.replace(' disabled:element-disabled', '');
  const idleClass = layoutClasses();
  await press('arPhoto.capture');
  expect(layoutClasses()).toBe(idleClass);
  expect(button('arPhoto.capture').props.accessibilityState.busy).toBe(true);
  expect(button('arPhoto.capture').findAllByType('text' as React.ElementType).flatMap(node => node.children).join('')).toContain(translations.t('arPhoto.capture'));
  expect(tree!.root.findByProps({ testID: 'ar-photo-processing' }).props.accessibilityLiveRegion).toBe('polite');
  expect(output()).toContain(translations.t('arPhoto.preparing'));
  expect(translations.t('arPhoto.preparing')).not.toBe('arPhoto.preparing');
  expect(tree!.root.findAllByType('modal' as React.ElementType)).toHaveLength(0);
});
it('waits for bitmap success before enabling save/share, keeping discard available', async () => {
  await mount(); await press('arPhoto.capture');
  expect(button('arPhoto.save').props.accessibilityState.disabled).toBe(true);
  expect(button('arPhoto.share').props.accessibilityState.disabled).toBe(true);
  expect(button('arPhoto.discard').props.accessibilityState.disabled).toBe(false);
  expect(output()).toContain(translations.t('arPhoto.loadingPreview'));
  await loadImage();
  expect(button('arPhoto.save').props.accessibilityState.disabled).toBe(false);
  expect(button('arPhoto.share').props.accessibilityState.disabled).toBe(false);
  expect(output()).not.toContain(translations.t('arPhoto.loadingPreview'));
});
it('bounds stalled bitmap loading and rejects a late success after failure', async () => {
  vi.useFakeTimers(); await mount(); await press('arPhoto.capture');
  const oldImage = tree!.root.findByType('img').props;
  await act(async () => { vi.advanceTimersByTime(PHOTO_DEADLINE_MS); });
  expect(output()).toContain(translations.t('arPhoto.errors.preview-failed'));
  expect(button('arPhoto.save').props.accessibilityState.disabled).toBe(true);
  await act(async () => oldImage.onLoad?.());
  expect(button('arPhoto.save').props.accessibilityState.disabled).toBe(true);
  expect(button('arPhoto.discard').props.accessibilityState.disabled).toBe(false);
});
it('retires bitmap callbacks and its deadline when a photo is discarded or the frame changes', async () => {
  vi.useFakeTimers(); await mount(); await press('arPhoto.capture');
  const oldImage = tree!.root.findByType('img').props;
  await press('arPhoto.discard');
  const next = { ...resource, uri: 'file:///private/next.jpg' };
  boundary.capture.mockResolvedValueOnce(next); await press('arPhoto.capture');
  await act(async () => { oldImage.onLoad?.(); oldImage.onError(); });
  expect(output()).not.toContain(translations.t('arPhoto.errors.preview-failed'));
  expect(button('arPhoto.save').props.accessibilityState.disabled).toBe(true);
  await loadImage();
  await act(async () => { vi.advanceTimersByTime(PHOTO_DEADLINE_MS); });
  expect(output()).not.toContain(translations.t('arPhoto.errors.preview-failed'));
  expect(button('arPhoto.save').props.accessibilityState.disabled).toBe(false);
  const currentImage = tree!.root.findByType('img').props;
  sessionKey = 'principal/admission/destination/frame3'; await update();
  await act(async () => { currentImage.onError(); currentImage.onLoad?.(); });
  expect(output()).not.toContain(translations.t('arPhoto.errors.preview-failed'));
  expect(tree!.root.findAllByType('modal' as React.ElementType)).toHaveLength(0);
});
it('keeps save/share operations busy without changing their labels or allowing discard', async () => {
  await mount(); await press('arPhoto.capture'); await loadImage();
  let finish!: () => void;
  vi.mocked(resource.save).mockImplementationOnce(() => new Promise<void>(resolve => { finish = resolve; }));
  await press('arPhoto.save');
  expect(button('arPhoto.save').props.accessibilityState.busy).toBe(true);
  expect(button('arPhoto.discard').props.accessibilityState.disabled).toBe(true);
  expect(output()).toContain(translations.t('arPhoto.saving'));
  await act(async () => finish());
  vi.mocked(resource.share).mockImplementationOnce(() => new Promise<void>(resolve => { finish = resolve; }));
  await press('arPhoto.share');
  expect(button('arPhoto.share').props.accessibilityState.busy).toBe(true);
  expect(output()).toContain(translations.t('arPhoto.sharing'));
  await act(async () => finish());
  expect(output()).toContain(translations.t('arPhoto.saved'));
});
it.each([{height:800, expected:436.16}, {height:360, expected:220}, {height:1600, expected:560}])('uses a contained photo and one scroll owner at viewport $height', async ({height, expected}) => {
  vi.spyOn(Native, 'useWindowDimensions').mockReturnValue({ width:360, height, scale:1, fontScale:1.5 });
  nativeUi.fontScale = 1.5;
  await translations.changeLanguage('ja'); await mount(); await press('arPhoto.capture');
  expect(tree!.root.findByType('img').props.resizeMode).toBe('contain');
  expect(tree!.root.findByProps({ testID: 'ar-photo-canvas' }).props.style.height).toBeCloseTo(expected);
  const modal = tree!.root.findByType('modal' as React.ElementType);
  expect(modal.findAllByType('scroll' as React.ElementType)).toHaveLength(1);
  expect(button('arPhoto.discard')).toBeDefined();
});
