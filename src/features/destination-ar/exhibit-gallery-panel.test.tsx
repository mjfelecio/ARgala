import React, { useState } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { createInstance, type i18n } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { localizationOptions } from '@/i18n/options';
import { ExhibitGalleryPanel, exhibitGalleryLayout } from './exhibit-gallery-panel';
import { destinationIds } from '@/features/destinations/catalog';
import { danaoStageProfile, getExhibitStageProfile } from './exhibit-stage';
import { readerLayout } from './reader-layout';
import { ringMetrics } from './scene-geometry';
import type { ReadingCursor } from './content-layout';
import type { ReadingSize } from './reading-preference';
import type { ArNativeStyle } from './native-styles';
import type { FocusSelection } from './ring-controller';
vi.mock('./holographic-assets', () => ({ holographicAssets: { glint: 108, frame: 101, reader: 109, toolbar: 110, actionMask: 111 } }));
vi.mock('react-native-reanimated', () => ({ useReducedMotion: () => true }));
vi.mock('@reactvision/react-viro', () => ({ ViroImage: 'image', ViroQuad: 'quad', ViroText: 'text', ViroNode: 'node', ViroAnimations: { registerAnimations: vi.fn() } }));
const transform = { position: [0, 2, -2.25] as [number, number, number], rotation: [0, 0, 0] as [number, number, number], scale: 1 };
const selection: FocusSelection = { id: danaoStageProfile.galleryId, phase: 'focused', token: 1, origin: [0, 0, 0], from: transform, to: transform };
const style: ArNativeStyle = { text: (fontSize, textAlign = 'center', fontWeight = '400') => ({ fontSize, textAlign, fontWeight, color: '#fff', fontFamily: 'test', textAlignVertical: 'center' }) };
let tree: ReactTestRenderer; let translations: i18n; let saved: ReadingCursor | undefined; let enabled = true; let profile = danaoStageProfile;
function Harness() {
  const [cursor, setCursor] = useState(saved); const [size, setSize] = useState<ReadingSize>('standard');
  return <ExhibitGalleryPanel selection={{ ...selection, id: profile.galleryId }} profile={profile} previous={cursor} reading={{ size, pending: false, error: null, retry: async () => {}, change: delta => setSize(delta > 0 ? 'large' : 'small') }} enabled={enabled} decorations={false} style={style} animationPrefix="testExhibit"
    onCursor={value => { saved = value; setCursor(value); }} onClose={() => {}} onComplete={() => {}} />;
}
const view = () => <I18nextProvider i18n={translations}><Harness /></I18nextProvider>;
async function mount() { await act(async () => { tree = create(view()); }); }
const action = (id: string) => tree.root.findAllByType('node' as React.ElementType).find(node => node.props.testID === `ring-action-${id}`)!;
async function press(id: string) { await act(async () => action(id).props.onClick?.()); }
const image = () => tree.root.findAllByType('image' as React.ElementType).find(node => node.props.testID === 'ring-gallery-image')!;
const text = (id: string) => tree.root.findAllByType('text' as React.ElementType).find(node => node.props.testID === id)?.props.text as string | undefined;
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }); saved = undefined; enabled = true; profile = danaoStageProfile;
  translations = createInstance(); await translations.use(initReactI18next).init({ ...localizationOptions, resources: structuredClone(localizationOptions.resources), lng: 'en', react: { useSuspense: false } });
  const original = console.error; vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => { if (!String(args[0]).startsWith('react-test-renderer is deprecated')) original(...args); });
});
afterEach(async () => { await act(async () => tree?.unmount()); vi.restoreAllMocks(); });

it.each(destinationIds.flatMap(id => (['en', 'ja', 'ko'] as const).map(locale => ({ id, locale }))))('browses every $id $locale photo without prose, retaining every caption and credit', async ({ id, locale }) => {
  profile = getExhibitStageProfile(id)!; await translations.changeLanguage(locale); await mount();
  expect(translations.getResource(locale, 'translation', 'presentation.galleryTitle')).toBeTruthy();
  expect(text('exhibit-gallery-heading')).toBe(translations.t('presentation.galleryTitle'));
  const compact = (value: string) => value.replace(/\s/g, '');
  for (let index = 0; index < profile.media.length; index++) {
    const photo = profile.media[index];
    expect(image().props).toMatchObject({ source: photo.source, resizeMode: 'ScaleToFit', ignoreEventHandling: true });
    expect(text('exhibit-photo-position')).toBe(translations.t('presentation.photoPosition', { current: index + 1, total: profile.media.length }));
    expect(text('ring-body')).toBeUndefined();
    const retainedImage = image(); const caption = [text('ring-gallery-caption')!];
    let steps = 0;
    while (action('gallery-caption-next')?.props.onClick) {
      await press('gallery-caption-next'); caption.push(text('ring-gallery-caption')!);
      expect(image()).toBe(retainedImage); expect(steps++).toBeLessThan(100);
    }
    expect(compact(caption.join(''))).toContain(compact(photo.caption![locale]!.value));
    expect(compact(caption.join(''))).toContain(compact(photo.credit));
    expect(action('gallery-photo-previous').props.onClick === undefined).toBe(index === 0);
    if (index < profile.media.length - 1) await press('gallery-photo-next');
  }
  expect(action('gallery-photo-next').props.onClick).toBeUndefined();
  expect(tree.root.findAllByProps({ testID: 'ring-gallery-image' })).toHaveLength(1);
});

it('moves Next directly to the next photograph even when caption pages remain unread', async () => {
  await mount(); expect(action('gallery-caption-next').props.onClick).toBeTypeOf('function');
  await press('gallery-photo-next'); expect(image().props.source).toBe(danaoStageProfile.media[1].source);
  expect(saved?.mediaPage).toBe(0); expect(text('exhibit-photo-position')).toBe('Photo 2 / 7');
  await press('gallery-photo-previous'); expect(image().props.source).toBe(danaoStageProfile.media[0].source);
});

it('preserves photo identity through size and language changes, with full-height metadata controls', async () => {
  await mount(); await press('gallery-photo-next'); await press('gallery-caption-next');
  const source = image().props.source; const offset = saved?.offset;
  await press('larger'); expect(image().props.source).toBe(source); expect(saved?.size).toBe('large');
  expect(saved!.offset).toBeLessThanOrEqual(offset!);
  await act(async () => { await translations.changeLanguage('ja'); }); expect(image().props.source).toBe(source);
  expect(text('exhibit-photo-position')).toBe('写真 2 / 7');
  for (const id of ['gallery-caption-previous', 'gallery-caption-next', 'gallery-photo-previous', 'gallery-photo-next', 'close']) {
    const quad = action(id).findAllByType('quad' as React.ElementType)[0];
    expect(quad.props.height).toBe(0.18); expect(quad.props.highAccuracyEvents).toBe(true);
  }
  expect(exhibitGalleryLayout.image.y - exhibitGalleryLayout.image.height / 2).toBeGreaterThan(exhibitGalleryLayout.caption.y + exhibitGalleryLayout.caption.height / 2);
  expect(exhibitGalleryLayout.caption.y - exhibitGalleryLayout.caption.height / 2).toBeGreaterThan(exhibitGalleryLayout.metadataY + 0.09);
  expect(exhibitGalleryLayout.metadataY - 0.09).toBeGreaterThan(readerLayout.toolbar.y + readerLayout.toolbar.height / 2);
});

it('keeps metadata available through native null completion, failure and explicit Retry', async () => {
  await mount(); const caption = text('ring-gallery-caption');
  const oldSuccess = image().props.onLoadEnd;
  await act(async () => oldSuccess({ nativeEvent: null })); expect(text('ring-gallery-loading')).toBeUndefined();
  await act(async () => image().props.onError({ nativeEvent: { error: 'PRIVATE' } }));
  expect(text('ring-gallery-error')).toBe(translations.t('destinationRing.imageFailed'));
  expect(text('ring-gallery-caption')).toBe(caption);
  await act(async () => oldSuccess({ nativeEvent: null })); expect(image()).toBeUndefined();
  await press('image-retry');
  await act(async () => oldSuccess({ nativeEvent: null })); expect(text('ring-gallery-loading')).toBe(translations.t('common.loading'));
  await act(async () => image().props.onLoadEnd({ nativeEvent: null })); expect(text('ring-gallery-loading')).toBeUndefined();
});

it('retires retained photo and metadata commands when Help disables the gallery', async () => {
  await mount(); const next = action('gallery-photo-next').props.onClick; const captionNext = action('gallery-caption-next').props.onClick;
  enabled = false; await act(async () => tree.update(view()));
  await act(async () => { next(); captionNext(); }); expect(saved).toBeUndefined();
  for (const id of ['gallery-photo-next', 'gallery-caption-next', 'close']) expect(action(id).props.onClick).toBeUndefined();
});

it('keeps gallery navigation within the reader width so Close remains visible on the A53', async () => {
  await mount();
  const halfWidth = (ringMetrics.panelWidth + 0.025) / 2;
  for (const id of ['gallery-photo-previous', 'gallery-photo-next', 'close']) {
    const control = action(id); const quad = control.findAllByType('quad' as React.ElementType)[0];
    expect(Math.abs(control.props.position[0]) + quad.props.width / 2).toBeLessThanOrEqual(halfWidth);
    expect(quad.props.width).toBeGreaterThanOrEqual(0.18);
    expect(quad.props.height).toBe(0.18);
  }
});

it('contains metadata action corners inside the painted reader and retains caption clearance', async () => {
  await mount();
  const frame = tree.root.findAllByType('image' as React.ElementType).find(node => node.props.testID === 'holographic-surface')!;
  const row = tree.root.findAllByType('node' as React.ElementType).find(node => node.props.testID === 'exhibit-caption-toolbar')!;
  for (const id of ['gallery-caption-previous', 'gallery-caption-next']) {
    const control = action(id); const paint = control.findByType('quad' as React.ElementType);
    for (const signX of [-1, 1]) for (const signY of [-1, 1]) {
      const x = Math.abs(control.props.position[0] + signX * paint.props.width / 2) / frame.props.width * 512;
      const y = Math.abs(row.props.position[1] + control.props.position[1] + signY * paint.props.height / 2) / frame.props.height * 512;
      // Authored reader: x/y=5, rx=30, stroke=3 on a 512px square.
      expect(x).toBeLessThanOrEqual(249.5); expect(y).toBeLessThanOrEqual(249.5);
      expect(Math.max(0, x - 221) ** 2 + Math.max(0, y - 221) ** 2).toBeLessThanOrEqual(28.5 ** 2);
    }
    expect(row.props.position[1] + paint.props.height / 2).toBeLessThan(exhibitGalleryLayout.caption.y - exhibitGalleryLayout.caption.height / 2);
  }
});
