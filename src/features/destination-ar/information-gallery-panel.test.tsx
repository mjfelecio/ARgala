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
const image = () => tree.root.findAllByType('image' as React.ElementType)[0];
const text = (id: string) => tree.root.findAllByType('text' as React.ElementType).find(node => node.props.testID === id)?.props.text as string | undefined;
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }); saved = undefined; enabled = true; currentContent = content; closed.mockClear();
  translations = createInstance(); await translations.use(initReactI18next).init({ ...localizationOptions, resources: structuredClone(localizationOptions.resources), lng: 'en', react: { useSuspense: false } });
  const original = console.error; vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => { if (!String(args[0]).startsWith('react-test-renderer is deprecated')) original(...args); });
});
afterEach(async () => { await act(async () => tree?.unmount()); vi.restoreAllMocks(); });
it('preserves text and transform, reaches bundled photos with completed-click controls, and restores the same image', async () => {
  await mount(); expect(text('ring-body')?.replaceAll('\n', '')).toContain('Complete history text'); expect(image()).toBeUndefined();
  await press('next'); expect(image().props).toMatchObject({ source: 1, ignoreEventHandling: true, resizeMode: 'ScaleToFit' });
  expect(saved?.mediaId).toBe(media.id);
  for (const id of ['previous', 'next', 'smaller', 'larger', 'close']) {
    expect(action(id).props.onClick).toBeDefined();
    expect(action(id).findAllByType('quad' as React.ElementType)[0].props).toMatchObject({ highAccuracyEvents: true, ignoreEventHandling: false });
  }
  for (const node of tree.root.findAllByType('text' as React.ElementType)) expect(node.props.ignoreEventHandling).toBe(true);
  expect(tree.root.findAllByType('quad' as React.ElementType).some(node => node.props.materials === 'argalaRingEdge')).toBe(false);
  await press('larger'); expect(image().props.source).toBe(1);
  await act(async () => { await translations.changeLanguage('ja'); }); expect(image().props.source).toBe(1); expect(text('ring-gallery-caption')).toContain('合成画像');
  enabled = false; await act(async () => tree.update(view())); expect(action('next').props.onClick).toBeUndefined();
  enabled = true; await act(async () => tree.update(view()));
  expect(tree.root.findAllByType('node' as React.ElementType).find(node => node.props.testID === 'ring-focused-panel')!.props).toMatchObject({ position: transform.position, rotation: transform.rotation, scale: [1, 1, 1] });
  await act(async () => tree.unmount()); await mount(); expect(image().props.source).toBe(1);
  await press('previous'); expect(image()).toBeUndefined(); expect(text('ring-body')).toBeDefined();
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
