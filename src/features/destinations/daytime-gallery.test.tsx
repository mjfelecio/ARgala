import { withHeroUI } from '@/test/native-ui';
import * as React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { createInstance, type i18n } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { localizationOptions } from '@/i18n/options';
import { destinationSchema, type DestinationMedia } from './catalog';
import { DaytimeGallery } from './daytime-gallery';
const controls = vi.hoisted(() => ({ language: 'en' as 'en' | 'ko' | 'ja' }));
vi.mock('@/features/settings/provider', () => ({ useSettings: () => ({ language: controls.language }) }));
const photo = destinationSchema.parse({ id: 'D01', provisionalName: 'Synthetic fixture', media: [{ id: 'synthetic', source: 1, credit: 'Synthetic fixture credit', rightsReference: 'Test rights', approvalReference: 'Test approval', alt: { en: { value: 'Synthetic daytime test image', approvalReference: 'Test' } }, caption: { en: { value: 'Synthetic caption', approvalReference: 'Test' } } }] }).media![0];
let tree: ReactTestRenderer | undefined;
let translations: i18n;
function render(media: readonly DestinationMedia[] = []) { return <I18nextProvider i18n={translations}>{withHeroUI(<DaytimeGallery media={media} />)}</I18nextProvider>; }
const output = () => JSON.stringify(tree!.toJSON());
beforeEach(async () => {
 Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true, __DEV__: false }); controls.language = 'en';
 translations = createInstance(); await translations.use(initReactI18next).init({ ...localizationOptions, lng: 'en', react: { useSuspense: false } });
 const original = console.error; vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => { if (!String(args[0]).startsWith('react-test-renderer is deprecated')) original(...args); });
});
afterEach(async () => { await act(async () => tree?.unmount()); tree = undefined; vi.restoreAllMocks(); });
it('shows an honest zero-photo state and always distinguishes previews from live camera imagery', async () => {
 await act(async () => { tree = create(render()); });
 expect(output()).toContain(translations.t('destinations.previewMissing'));
 expect(output()).toContain(translations.t('destinations.daytime'));
 expect(output()).toContain(translations.t('destinations.notLive'));
 expect(tree!.root.findAllByType('img')).toHaveLength(0);
 expect(output()).toContain(translations.t('destinations.photoCount', { count: 0 }));
});
it('renders only the approved photo count with credits and a fullscreen viewer that closes on Android Back', async () => {
 await act(async () => { tree = create(render([photo])); });
 expect(output()).toContain(photo.credit); expect(output()).toContain('Synthetic caption');
 expect(output()).toContain(translations.t('destinations.photoCount', { count: 1 }));
 const thumbnail = tree!.root.findAllByType('button').find(b => b.props.accessibilityLabel === 'Synthetic daytime test image')!;
 await act(async () => thumbnail.props.onPress()); expect(tree!.root.findAllByType('modal' as React.ElementType)).toHaveLength(1);
 await act(async () => tree!.root.findByType('modal' as React.ElementType).props.onRequestClose()); expect(tree!.root.findAllByType('modal' as React.ElementType)).toHaveLength(0);
 await act(async () => thumbnail.props.onPress());
 await act(async () => tree!.root.findAllByType('button').find(b => b.props.accessibilityLabel === translations.t('common.close'))!.props.onPress());
 expect(tree!.root.findAllByType('modal' as React.ElementType)).toHaveLength(0);
});
it('labels English fallback per photo when the language changes and retains truthful failed-media states', async () => {
 await act(async () => { tree = create(render([photo])); });
 for (const language of ['ko', 'ja'] as const) {
  controls.language = language;
  await act(async () => { await translations.changeLanguage(language); tree!.update(render([photo])); });
  expect(output()).toContain(translations.t('destinations.englishFallback')); expect(output()).toContain('Synthetic caption');
 }
 await act(async () => tree!.root.findAllByType('img')[0].props.onError());
 expect(output()).toContain(translations.t('destinations.imageFailed'));
 expect(output()).not.toContain('Native image error');
});
it('uses the same approved imagery during daytime and nighttime', async () => {
 vi.spyOn(Date, 'now').mockReturnValue(Date.UTC(2026, 9, 20, 4)); await act(async () => { tree = create(render([photo])); }); const day = output();
 vi.mocked(Date.now).mockReturnValue(Date.UTC(2026, 9, 20, 16)); await act(async () => tree!.update(render([photo]))); expect(output()).toEqual(day);
});
it('selects another approved thumbnail without changing the approved count or clipping its full caption', async () => {
 const second = { ...photo, id: 'second', source: 2, caption: { en: { value: 'Long synthetic caption 日本語 한국어 '.repeat(10), approvalReference: 'Test' } }, alt: { en: { value: 'Second synthetic test image', approvalReference: 'Test' } } };
 await act(async () => { tree = create(render([photo, second])); });
 await act(async () => tree!.root.findAllByType('button').find(b => b.props.accessibilityLabel === 'Second synthetic test image')!.props.onPress());
 expect(output()).toContain(second.caption.en.value); expect(output()).toContain(translations.t('destinations.photoCount', { count: 2 }));
 expect(tree!.root.findAllByType('img').filter(img => img.props.source === 2)).toHaveLength(3);
 const caption = tree!.root.findAllByType('text').find(text => text.props.children === second.caption.en.value)!;
 expect(caption.props.numberOfLines).toBeUndefined();
});
