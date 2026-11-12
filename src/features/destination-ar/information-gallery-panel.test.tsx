import React, { useState } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { createInstance, type i18n } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { localizationOptions } from '@/i18n/options';
import { InformationPanel } from './information-panel';
import type { ReadingCursor } from './content-layout';
import type { ReadingSize } from './reading-preference';
import type { RingContent } from './ring-content';
import type { ArNativeStyle } from './native-styles';
import type { FocusSelection } from './ring-controller';
vi.mock('./holographic-assets', () => ({ holographicAssets: { glint: 108, frame: 101, reader: 109, overview: 102, history: 103, highlights: 104, 'visitor-notes': 105, facts: 106, chapter: 107 } }));
vi.mock('react-native-reanimated', () => ({ useReducedMotion: () => true }));
vi.mock('@reactvision/react-viro', () => ({ ViroImage: 'image', ViroQuad: 'quad', ViroText: 'text', ViroNode: 'node', ViroAnimations: { registerAnimations: vi.fn() } }));
const approved = (value: string) => ({ value, approvalReference: 'Synthetic test only' });
const media = { id: 'synthetic-photo', source: 1, credit: 'Synthetic credit', rightsReference: 'Synthetic', approvalReference: 'Synthetic', alt: { en: approved('Synthetic photo alt'), ja: approved('合成画像'), ko: approved('합성 사진') }, caption: { en: approved('Synthetic caption '.repeat(10)) } };
const content: RingContent = { id: 'history', approved: { title: { en: approved('Synthetic title') }, body: { en: approved('Complete history text') }, media: [media] } };
const transform = { position: [1, 2, 3] as [number, number, number], rotation: [0, 30, 0] as [number, number, number], scale: 1 };
const selection: FocusSelection = { id: 'history', phase: 'focused', token: 1, origin: [0, 0, 0], from: transform, to: transform };
const style: ArNativeStyle = { text: (fontSize, textAlign = 'center', fontWeight = '400') => ({ fontSize, textAlign, fontWeight, color: '#fff', fontFamily: 'test', textAlignVertical: 'center' }) };
let tree: ReactTestRenderer; let translations: i18n; let saved: ReadingCursor | undefined; let enabled = true; let currentContent = content; const closed = vi.fn();
function Harness() {
  const [cursor, setCursor] = useState(saved); const [size, setSize] = useState<ReadingSize>('standard');
  return <InformationPanel selection={selection} content={currentContent} previous={cursor} reading={{ size, pending: false, error: null, retry: async () => {}, change: delta => setSize(delta > 0 ? 'large' : 'small') }} enabled={enabled} decorations={false} style={style}
    onCursor={(_, value) => { saved = value; setCursor(value); }} onClose={closed} onComplete={() => {}} />;
}
const view = () => <I18nextProvider i18n={translations}><Harness /></I18nextProvider>;
async function mount() { await act(async () => { tree = create(view()); }); }
const action = (id: string) => tree.root.findAllByType('node' as React.ElementType).find(node => node.props.testID === `ring-action-${id}`)!;
async function press(id: string) { await act(async () => action(id).props.onClick?.()); }
const image = () => tree.root.findAllByType('image' as React.ElementType).find(node => node.props.testID === 'ring-gallery-image')!;
const text = (id: string) => tree.root.findAllByType('text' as React.ElementType).find(node => node.props.testID === id)?.props.text as string | undefined;
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }); saved = undefined; enabled = true; currentContent = content; closed.mockClear();
  translations = createInstance(); await translations.use(initReactI18next).init({ ...localizationOptions, resources: structuredClone(localizationOptions.resources), lng: 'en', react: { useSuspense: false } });
  const original = console.error; vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => { if (!String(args[0]).startsWith('react-test-renderer is deprecated')) original(...args); });
});
afterEach(async () => { await act(async () => tree?.unmount()); vi.restoreAllMocks(); });
it('preserves text and transform, reaches bundled photos with completed-click controls, and restores the same image', async () => {
  await mount(); expect(text('ring-body')).toBeUndefined(); expect(image().props).toMatchObject({ source: 1, ignoreEventHandling: true, resizeMode: 'ScaleToFit' });
  await press('next'); expect(saved?.mediaId).toBe(media.id);
  for (const id of ['previous', 'next', 'smaller', 'larger', 'close']) {
    expect(action(id).props.onClick).toBeDefined();
    expect(action(id).findAllByType('quad' as React.ElementType)[0].props).toMatchObject({ highAccuracyEvents: true, ignoreEventHandling: false });
  }
  for (const node of tree.root.findAllByType('text' as React.ElementType)) expect(node.props.ignoreEventHandling).toBe(true);
  expect(tree.root.findAllByType('quad' as React.ElementType).some(node => node.props.materials === 'argalaRingEdge')).toBe(false);
  await press('previous'); await press('larger'); expect(image().props.source).toBe(1);
  await act(async () => { await translations.changeLanguage('ja'); }); expect(image().props.source).toBe(1); expect(text('ring-gallery-caption')).toContain('合成画像');
  enabled = false; await act(async () => tree.update(view())); expect(action('next').props.onClick).toBeUndefined();
  enabled = true; await act(async () => tree.update(view()));
  expect(tree.root.findAllByType('node' as React.ElementType).find(node => node.props.testID === 'ring-focused-panel')!.props).toMatchObject({ position: transform.position, rotation: transform.rotation, scale: [1, 1, 1] });
  await act(async () => tree.unmount()); await mount(); expect(image().props.source).toBe(1);
  for (let index = 0; index < 40 && image(); index++) await press('next');
  expect(image()).toBeUndefined(); expect(text('ring-body')).toBeDefined();
  await press('close'); expect(closed).toHaveBeenCalledOnce();
});
it.each(['en', 'ja', 'ko'])('uses localized %s image errors without raw native messages and retains credits and navigation', async locale => {
  await translations.changeLanguage(locale); await mount(); await press('next');
  await act(async () => image().props.onError({ nativeEvent: { error: 'PRIVATE_NATIVE_ERROR' } }));
  expect(text('ring-gallery-error')).toBe(translations.t('destinationRing.imageFailed'));
  expect(JSON.stringify(tree.toJSON())).not.toContain('PRIVATE_NATIVE_ERROR');
  const captions: string[] = [];
  for (let index = 0; index < 30; index++) {
    captions.push(text('ring-gallery-caption') ?? '');
    if (!action('next').props.onClick) break;
    await press('next');
  }
  expect(captions.join('').replaceAll('\n', '')).toContain('Synthetic credit');
  expect(action('previous').props.onClick).toBeDefined(); expect(action('close').props.onClick).toBeDefined();
});
it('renders ordinary text with no image slot when reviewed media are absent', async () => {
  currentContent = { ...content, approved: { ...content.approved!, media: [] } }; await mount();
  expect(image()).toBeUndefined(); expect(action('next').props.onClick).toBeUndefined(); expect(text('ring-body')).toBeDefined();
});
it('uses the reading box width without a premature right margin at the existing font size', async () => {
  const sentence = 'Visitors discover the stories of this place.';
  currentContent = { ...content, approved: { ...content.approved!, title: { en: approved('Overview') }, body: { en: approved(sentence) }, media: [] } };
  await mount();
  const body = tree.root.findAllByType('text' as React.ElementType).find(node => node.props.testID === 'ring-body')!;
  expect(body.props.text).toContain(sentence);
  expect(body.props.width * body.props.scale[0]).toBeCloseTo(1.08);
  expect(body.props.style.fontSize * body.props.scale[0]).toBe(5);
});
it('lets the native renderer flow ordinary paragraphs across the actual box instead of enforcing JavaScript rows', async () => {
  currentContent = { ...content, approved: { ...content.approved!, title: { en: approved('Overview') }, body: { en: approved('Visitors discover the stories of this place. Meaningful context makes the destination worth exploring. '.repeat(3)) }, media: [] } };
  await mount();
  const body = tree.root.findAllByType('text' as React.ElementType).find(node => node.props.testID === 'ring-body')!;
  expect(body.props.textLineBreakMode).toBe('WordWrap');
  expect(body.props.text.split('\n\n')[1]).not.toContain('\n');
});
it('keeps visible padding below reading controls and separates both action rows from content', async () => {
  currentContent = { ...content, approved: { ...content.approved!, media: [] } }; await mount();
  const surface = tree.root.findAllByType('image' as React.ElementType).find(node => node.props.testID === 'holographic-surface')!;
  const panelBottom = -surface.props.height / 2;
  for (const id of ['smaller', 'larger', 'close']) {
    const node = action(id); const fill = node.findByType('quad' as React.ElementType);
    const bottom = node.props.position[1] - fill.props.height / 2;
    expect(bottom - panelBottom).toBeGreaterThanOrEqual(0.039);
  }
  const previous = action('previous'); const smaller = action('smaller');
  expect(previous.props.position[1] - 0.09 - (smaller.props.position[1] + 0.09)).toBeGreaterThanOrEqual(0.039);
});
it('keeps long full chapter titles readable beyond their bounded cover label', async () => {
  const title = 'Verified long chapter title '.repeat(5);
  currentContent = { ...content, approved: { ...content.approved!, title: { en: approved(title) }, media: [] } };
  await mount(); const pages: string[] = [];
  for (let index = 0; index < 100; index++) {
    pages.push(text('ring-body') ?? '');
    if (!action('next').props.onClick) break;
    await press('next');
  }
  expect(pages.join('').replaceAll('\n', '')).toContain(title);
  expect(pages.join('').replaceAll('\n', '')).toContain('Complete history text');
});
it('preserves a complete body at the existing layout budget independently of its full heading', async () => {
  currentContent = { ...content, approved: { ...content.approved!, title: { en: approved('Complete heading') }, body: { en: approved('z'.repeat(24000)) }, media: [] } };
  await mount(); const pages: string[] = [];
  for (let index = 0; index < 200; index++) {
    pages.push(text('ring-body') ?? '');
    if (!action('next').props.onClick) break;
    await press('next');
  }
  const displayed = pages.join('').replaceAll('\n', '');
  expect(displayed).toContain('Complete heading');
  expect(displayed.match(/z/g)).toHaveLength(24000);
});

it.each((['ja', 'ko'] as const).flatMap(locale => ['alt', 'caption', 'fully-localized', 'no-caption'].map(mode => [locale, mode] as const)))('marks %s English gallery fallback for %s only, using actual resources', async (locale, mode) => {
  const local = (label: string) => ({ en: approved(`Synthetic English ${label}`), ja: approved(`合成${label}`), ko: approved(`합성 ${label}`) });
  const alt = local('alt'); const caption = local('caption');
  if (mode === 'alt') delete (alt as Partial<typeof alt>)[locale];
  if (mode === 'caption') delete (caption as Partial<typeof caption>)[locale];
  const photo = { ...media, alt, caption: mode === 'no-caption' ? undefined : caption };
  currentContent = { ...content, approved: { ...content.approved!, media: [photo] } };
  await translations.changeLanguage(locale); await mount();
  const captions: string[] = [];
  for (let index = 0; index < 30; index++) {
    if (text('ring-gallery-caption')) captions.push(text('ring-gallery-caption')!);
    if (!action('next').props.onClick) break;
    await press('next');
  }
  const displayed = captions.join('').replaceAll('\n', '');
  const notice = translations.t('destinations.englishFallback');
  expect(notice).not.toBe('destinations.englishFallback');
  if (mode === 'alt' || mode === 'caption') {
    expect(displayed).toContain(notice); expect(displayed).toContain(`Synthetic English ${mode}`);
  } else expect(displayed).not.toContain(notice);
  expect(displayed).toContain('Synthetic credit');
  await act(async () => { await translations.changeLanguage('en'); });
  const english: string[] = [];
  for (let index = 0; index < 30; index++) {
    if (text('ring-gallery-caption')) english.push(text('ring-gallery-caption')!);
    if (!action('previous').props.onClick) break;
    await press('previous');
  }
  expect(english.join('').replaceAll('\n', '')).not.toContain(translations.t('destinations.englishFallback'));
});

it('retires queued page and size callbacks when Help disables the current native panel', async () => {
  await mount(); const retainedNext = action('next').props.onClick; const retainedSize = action('larger').props.onClick;
  enabled = false; await act(async () => tree.update(view()));
  await act(async () => { retainedNext(); retainedSize(); });
  expect(saved).toBeUndefined();
  enabled = true; await act(async () => tree.update(view())); await press('next');
  expect(saved?.mediaPage).toBe(1);
});

it('gives photos the chapter-heading space while keeping captions and controls inside the original frame', async () => {
  await mount();
  const photo = image(); const caption = tree.root.findAllByType('text' as React.ElementType).find(node => node.props.testID === 'ring-gallery-caption')!;
  const meta = tree.root.findAllByType('text' as React.ElementType).find(node => node.props.testID === 'ring-chapter-position')!;
  const title = tree.root.findAllByType('text' as React.ElementType).find(node => node.props.testID === 'ring-chapter-title')!;
  expect(title.props.text).toContain('Synthetic title');
  expect(photo.props.position[1] + photo.props.height / 2).toBeLessThan(title.props.position[1] - title.props.height * title.props.scale[1] / 2);
  expect(photo.props.height).toBeGreaterThanOrEqual(0.4);
  expect(photo.props.position[1] + photo.props.height / 2).toBeLessThan(meta.props.position[1] - meta.props.height * meta.props.scale[1] / 2);
  expect(photo.props.position[1] - photo.props.height / 2).toBeGreaterThan(caption.props.position[1] + caption.props.height * caption.props.scale[1] / 2);
  expect(caption.props.position[1] - caption.props.height * caption.props.scale[1] / 2).toBeGreaterThan(action('next').props.position[1] + 0.09);
  expect(tree.root.findAllByType('node' as React.ElementType).find(node => node.props.testID === 'ring-focused-panel')!.props).toMatchObject({ position: transform.position, rotation: transform.rotation, scale: [1, 1, 1] });
});
it.each(['en', 'ja', 'ko'])('shows %s loading, retries explicitly and ignores retired native completion callbacks', async locale => {
  await translations.changeLanguage(locale); await mount(); expect(text('ring-gallery-loading')).toBe(translations.t('common.loading'));
  const first = image(); const retainedFailure = first.props.onLoadEnd;
  await act(async () => first.props.onLoadEnd({ nativeEvent: { success: false } }));
  expect(text('ring-gallery-error')).toBe(translations.t('destinationRing.imageFailed'));
  const retainedRetry = action('image-retry').props.onClick;
  enabled = false; await act(async () => tree.update(view())); await act(async () => retainedRetry());
  expect(image()).toBeUndefined();
  enabled = true; await act(async () => tree.update(view())); await press('image-retry');
  expect(image().props.source).toBe(1); expect(text('ring-gallery-loading')).toBe(translations.t('common.loading'));
  await act(async () => retainedFailure({ nativeEvent: { success: false } }));
  expect(text('ring-gallery-error')).toBeUndefined();
  await act(async () => image().props.onLoadEnd({ nativeEvent: { success: true } }));
  expect(text('ring-gallery-loading')).toBeUndefined(); expect(text('ring-gallery-error')).toBeUndefined();
});
it('retires a failed image when its bundled source changes without poisoning the replacement', async () => {
  await mount(); const old = image(); const oldFinish = old.props.onLoadEnd; await act(async () => old.props.onError({ nativeEvent: { error: 'PRIVATE' } }));
  currentContent = { ...content, approved: { ...content.approved!, media: [{ ...media, source: 2 }] } };
  await act(async () => tree.update(view())); expect(image().props.source).toBe(2);
  await act(async () => oldFinish({ nativeEvent: { success: false } }));
  expect(text('ring-gallery-error')).toBeUndefined();
});

it('keeps one native image while advancing captions and prevents a late success from silently retrying a failed image', async () => {
  await mount(); const first = image(); const nativeSuccess = first.props.onLoadEnd;
  await act(async () => nativeSuccess({ nativeEvent: { success: true } }));
  await press('next'); expect(image()).toBe(first); expect(tree.root.findAllByType('image' as React.ElementType).filter(item => item.props.testID === 'ring-gallery-image')).toHaveLength(1);
  const currentFailure = image().props.onError;
  // A new source gets its own pending attempt; completion order stays fenced.
  currentContent = { ...content, approved: { ...content.approved!, media: [{ ...media, source: 2 }] } };
  await act(async () => tree.update(view()));
  const pending = image().props.onLoadEnd;
  await act(async () => pending({ nativeEvent: { success: false } }));
  await act(async () => pending({ nativeEvent: { success: true } }));
  expect(text('ring-gallery-error')).toBe(translations.t('destinationRing.imageFailed')); expect(image()).toBeUndefined();
  await act(async () => currentFailure()); expect(text('ring-gallery-error')).toBe(translations.t('destinationRing.imageFailed'));
});
it('shows a current native image failure after an earlier successful decode without exposing the native message', async () => {
  await mount(); const current = image(); const failure = current.props.onError;
  await act(async () => current.props.onLoadEnd({ nativeEvent: { success: true } }));
  await act(async () => failure({ nativeEvent: { error: 'PRIVATE_NATIVE_ERROR' } }));
  expect(text('ring-gallery-error')).toBe(translations.t('destinationRing.imageFailed'));
  expect(JSON.stringify(tree.toJSON())).not.toContain('PRIVATE_NATIVE_ERROR');
});
it('accepts the installed Android Viro successful-load event with no success field', async () => {
  await mount();
  // Pinned Android VRTImage.imageDownloadDidFinish emits onLoadEndViro with a
  // null event map after setting the bitmap, despite the JS success:boolean type.
  await act(async () => image().props.onLoadEnd({ nativeEvent: {} }));
  expect(image()).toBeDefined(); expect(text('ring-gallery-loading')).toBeUndefined();
  expect(text('ring-gallery-error')).toBeUndefined(); expect(action('image-retry')).toBeUndefined();
});

it('binds a separate clean reader surface while preserving the shared tile artwork', async () => {
 await mount();
 const surface = tree.root.findAllByType('image' as React.ElementType).find(node => node.props.testID === 'holographic-surface')!;
 expect(surface.props.source).toBe(109); expect(surface.props.ignoreEventHandling).toBe(true);
});
