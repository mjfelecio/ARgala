import { nativeUi, withHeroUI } from '@/test/native-ui';
import * as React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { createInstance, type i18n } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { localizationOptions } from '@/i18n/options';
import { destinationSchema, getDestination, listDestinations, localizedContent, type DestinationMedia } from './catalog';
import { DaytimeGallery } from './daytime-gallery';
import { ScrollView as GestureScrollView } from 'react-native-gesture-handler';
const controls = vi.hoisted(() => ({ language: 'en' as 'en' | 'ko' | 'ja' }));
vi.mock('@/features/settings/provider', () => ({ useSettings: () => ({ language: controls.language }) }));
const photo = destinationSchema.parse({ id: 'D01', provisionalName: 'Synthetic fixture', media: [{ id: 'synthetic', source: 1, credit: 'Synthetic fixture credit', rightsReference: 'Test rights', approvalReference: 'Test approval', alt: { en: { value: 'Synthetic daytime test image', approvalReference: 'Test' } }, caption: { en: { value: 'Synthetic caption', approvalReference: 'Test' } } }] }).media![0];
const second = { ...photo, id: 'second', source: 2, caption: { en: { value: 'Long synthetic caption 日本語 한국어 '.repeat(40), approvalReference: 'Test' } }, alt: { en: { value: 'Second synthetic test image', approvalReference: 'Test' } } };
let tree: ReactTestRenderer | undefined;
let translations: i18n;
function render(media: readonly DestinationMedia[] = []) { return <I18nextProvider i18n={translations}>{withHeroUI(<DaytimeGallery media={media} />)}</I18nextProvider>; }
const visibleText = () => tree!.root.findAllByType('text').map(node => node.props.children).flat();
const button = (key: string) => tree!.root.findAllByType('button').find(node => node.props.accessibilityLabel === translations.t(key))!;
const photoButton = (alt: string) => tree!.root.findAllByType('button').find(node => node.props.accessibilityLabel === alt)!;
const modal = () => tree!.root.findByType('modal' as React.ElementType);
beforeEach(async () => {
 Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true, __DEV__: false }); controls.language = 'en';
 translations = createInstance(); await translations.use(initReactI18next).init({ ...localizationOptions, lng: 'en', react: { useSuspense: false } });
 const original = console.error; vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => { if (!String(args[0]).startsWith('react-test-renderer is deprecated')) original(...args); });
});
afterEach(async () => { await act(async () => tree?.unmount()); tree = undefined; vi.restoreAllMocks(); });
it('uses the gesture-handler scroll owner inside a sheet so Android horizontal drags are not captured by the sheet', async () => {
 await act(async () => { tree = create(<I18nextProvider i18n={translations}>{withHeroUI(<DaytimeGallery media={[photo, second]} variant="sheet" />)}</I18nextProvider>); });
 const strip = tree!.root.findByProps({ testID: 'destination-photo-strip' });
 expect(strip.type).toBe(GestureScrollView);
 expect(strip.props.horizontal).toBe(true);
 expect(strip.findAllByType('img').map(node => node.props.source)).toEqual([photo.source, second.source]);
 await act(async () => photoButton(second.alt.en.value).props.onPress());
 expect(modal().findByProps({testID: `viewer-photo:${second.id}`}).props.source).toBe(second.source);
});
it('shows only photographs in the horizontal strip, with captions and required credits accessible from each photo', async () => {
 await act(async () => { tree = create(render([photo, second])); });
 expect(visibleText()).not.toContain('Synthetic caption');
 expect(visibleText()).not.toContain(photo.credit);
 const entrance = photoButton(photo.alt.en.value);
 expect(entrance.props.accessibilityHint).toContain('Synthetic caption');
 expect(entrance.props.accessibilityHint).toContain(photo.credit);
 expect(entrance.findAllByType('text')).toHaveLength(0);
 expect(tree!.root.findAllByType('img')).toHaveLength(2);
 expect(visibleText()).toContain(translations.t('destinationCleanup.photoCount', { count: 2 }));
});
it('opens all 63 bundled visuals in gallery order and retains the strip owner after Android Back', async () => {
 let count = 0;
 for (const destination of listDestinations()) {
  await act(async () => { if (tree) tree.update(render(destination.media)); else tree = create(render(destination.media)); });
  const strip = tree!.root.findByProps({ testID: 'destination-photo-strip' });
  expect(strip.props.horizontal).toBe(true);
  expect(strip.findAllByType('img').map(node => node.props.source)).toEqual(destination.media!.map(item => item.source));
  const countKey = destination.id === 'D10' ? 'destinations.imageCount' : 'destinationCleanup.photoCount';
  expect(visibleText()).toContain(translations.t(countKey, { count: destination.media!.length }));
  for (const item of destination.media!) {
   await act(async () => photoButton(item.alt.en.value).props.onPress());
   expect(tree!.root.findByProps({ testID: `viewer-photo:${item.id}` }).props.resizeMode).toBe('contain');
   expect(visibleText()).toContain(item.credit);
   const caption = localizedContent(item.caption, 'en');
   if (caption) expect(visibleText()).toContain(caption.value);
   await act(async () => modal().props.onRequestClose());
   expect(tree!.root.findAllByType('modal' as React.ElementType)).toHaveLength(0);
   expect(tree!.root.findByProps({ testID: 'destination-photo-strip' })).toBe(strip);
   count++;
  }
 }
 expect(count).toBe(63);
});
it.each(['en', 'ja', 'ko'] as const)('shows the school record in %s with its full image and explicit source link', async language => {
 controls.language = language;
 await translations.changeLanguage(language);
 const media = getDestination('D10')!.media!;
 const record = media.find(item => item.id === 'D10-stem-congress-2026')!;
 nativeUi.openURL.mockReset().mockResolvedValue(undefined);
 await act(async () => { tree = create(render(media)); });
 expect(visibleText()).toContain(translations.t('destinations.campusGallery'));
 const entrance = photoButton(record.alt[language]!.value);
 expect(entrance.findByType('img').props.resizeMode).toBe('contain');
 expect(nativeUi.openURL).not.toHaveBeenCalled();
 await act(async () => entrance.props.onPress());
 expect(visibleText()).toContain(record.caption![language]!.value);
 expect(button('destinations.nextImage').props.disabled).toBe(true);
 await act(async () => button('destinations.openImageSource').props.onPress());
 expect(nativeUi.openURL).toHaveBeenCalledWith(record.rightsReference);
});
it('pages from the selected photo with previous, next and swipe, keeping long captions above bottom safe-area controls', async () => {
 await act(async () => { tree = create(render([photo, second])); });
 await act(async () => photoButton(second.alt.en.value).props.onPress());
 expect(button('destinationCleanup.nextPhoto').props.disabled).toBe(true);
 expect(tree!.root.findByProps({ testID: 'destination-photo-caption' }).findAllByType('text').find(node => node.props.children === second.caption.en.value)?.props.numberOfLines).toBeUndefined();
 const safeArea = modal().findByType('safe-area' as React.ElementType);
 expect(safeArea.props.edges).toContain('bottom');
 const children = safeArea.findAllByType('view').filter(node => node.props.testID === 'destination-photo-controls');
 expect(children).toHaveLength(1);
 await act(async () => button('destinationCleanup.previousPhoto').props.onPress());
 expect(button('destinationCleanup.previousPhoto').props.disabled).toBe(true);
 expect(visibleText()).toContain('Synthetic caption');
 await act(async () => button('destinationCleanup.nextPhoto').props.onPress());
 expect(visibleText()).toContain(second.caption.en.value);
 await act(async () => tree!.root.findByProps({ testID: 'destination-photo-pages' }).props.onMomentumScrollEnd({ nativeEvent: { contentOffset: { x: 0 } } }));
 expect(visibleText()).toContain('Synthetic caption');
 await act(async () => button('common.close').props.onPress());
 expect(tree!.root.findAllByType('modal' as React.ElementType)).toHaveLength(0);
});
it('translates controls and English fallback during viewing without resetting the selected photo', async () => {
 await act(async () => { tree = create(render([photo, second])); });
 await act(async () => photoButton(second.alt.en.value).props.onPress());
 for (const language of ['ko', 'ja'] as const) {
  controls.language = language;
  await act(async () => { await translations.changeLanguage(language); tree!.update(render([photo, second])); });
  expect(visibleText()).toContain(translations.t('destinations.englishFallback'));
  expect(visibleText()).toContain(second.caption.en.value);
  expect(button('destinationCleanup.previousPhoto')).toBeDefined();
  expect(translations.t('destinationCleanup.previousPhoto')).not.toBe('destinationCleanup.previousPhoto');
 }
});
it('retains captions and credits after an image failure and offers explicit image retry', async () => {
 await act(async () => { tree = create(render([photo])); });
 await act(async () => photoButton(photo.alt.en.value).props.onPress());
 await act(async () => tree!.root.findByProps({ testID: `viewer-photo:${photo.id}` }).props.onError());
 expect(visibleText()).toContain(translations.t('destinations.imageFailed'));
 expect(visibleText()).toContain('Synthetic caption'); expect(visibleText()).toContain(photo.credit);
 await act(async () => button('common.retry').props.onPress());
 expect(tree!.root.findByProps({ testID: `viewer-photo:${photo.id}` })).toBeDefined();
});
it('shows an honest zero-photo state and labels bundled imagery independently of the clock', async () => {
 await act(async () => { tree = create(render()); });
 expect(visibleText()).toContain(translations.t('destinations.previewMissing'));
 expect(visibleText()).toContain(translations.t('destinationCleanup.photoCount', { count: 0 }));
 expect(tree!.root.findAllByType('img')).toHaveLength(0);
 await act(async () => tree!.update(render([photo])));
 expect(visibleText()).toContain(translations.t('destinations.notLive'));
 vi.spyOn(Date, 'now').mockReturnValue(Date.UTC(2026, 9, 20, 16));
 await act(async () => tree!.update(render([photo])));
 expect(visibleText()).toContain(translations.t('destinations.notLive'));
});
it('bounds decoded fullscreen photos to the selected page and its immediate neighbors', async () => {
 const media = Array.from({ length: 8 }, (_, index) => ({ ...photo, id: `window-${index}`, source: index + 10, alt: { en: { value: `Window photo ${index}`, approvalReference: 'Test' } } }));
 await act(async () => { tree = create(render(media)); });
 await act(async () => photoButton('Window photo 7').props.onPress());
 expect(modal().findAllByType('img').map(node => node.props.source)).toEqual([16, 17]);
 await act(async () => button('destinationCleanup.previousPhoto').props.onPress());
 expect(modal().findAllByType('img').map(node => node.props.source)).toEqual([15, 16, 17]);
});
