import { withHeroUI } from '@/test/native-ui';
import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createInstance } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { localizationOptions } from '@/i18n/options';
import { contentManifestSchema, resolveContent } from '@/features/destination-content/model';
import { manifest } from '@/features/destination-content/test-fixtures';
import { getDestination } from '@/features/destinations/catalog';
import type { PreparedArEntry } from './admission-store';
import { ReadOnlyFallback } from './read-only-fallback';
const runtime = vi.hoisted(() => ({ language: 'en' as 'en' | 'ja' | 'ko' }));
vi.mock('@/features/settings/provider', () => ({ useSettings: () => ({ language: runtime.language }) }));
const translations = createInstance(); await translations.use(initReactI18next).init({ ...localizationOptions, lng: 'en', react: { useSuspense: false } });
let tree: ReactTestRenderer | undefined; let entry: PreparedArEntry;
let eligible: boolean; let running: boolean; const established = vi.fn(); const exit = vi.fn(); const authorize = vi.fn();
const view = () => withHeroUI(<I18nextProvider i18n={translations}><ReadOnlyFallback entry={entry} eligible={eligible} running={running} onEstablished={established} onExit={exit} /></I18nextProvider>);
async function mount() { await act(async () => { tree = create(view()); }); }
async function update() { await act(async () => tree!.update(view())); }
const copy = () => JSON.stringify(tree?.toJSON());
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true, __DEV__: false }); runtime.language = 'en'; eligible = running = true;
  authorize.mockReset().mockReturnValue(true); established.mockReset(); exit.mockReset();
  entry = { destination: resolveContent(getDestination('pilot-aclc'), contentManifestSchema.parse(manifest()))!, kind: 'approved', simulated: false, language: 'en', authorizeMount: authorize,
    identity: { admissionId: 'synthetic-reader', destinationId: 'pilot-aclc', principalId: 'owner', provenance: 'verified' } };
  await translations.changeLanguage('en');
});
afterEach(async () => { await act(async () => tree?.unmount()); tree = undefined; });
it('shows only approved captured text after fresh authorization and earns only at first positive visible layout', async () => {
  await mount(); expect(authorize).toHaveBeenCalled(); expect(copy()).toContain('Synthetic test en'); expect(established).not.toHaveBeenCalled();
  const layout = tree!.root.findByProps({ testID: 'eligible-read-only-content' }).props.onLayout;
  await act(async () => layout({ nativeEvent: { layout: { width: 0, height: 200 } } })); expect(established).not.toHaveBeenCalled();
  await act(async () => { layout({ nativeEvent: { layout: { width: 320, height: 300 } } }); layout({ nativeEvent: { layout: { width: 320, height: 300 } } }); });
  expect(established).toHaveBeenCalledOnce();
});
it.each(['draft', 'simulated', 'development', 'identity', 'ineligible', 'background', 'retired'])('hides rich text and never earns for %s', async reason => {
  if (reason === 'draft') entry = { ...entry, kind: 'draft' };
  if (reason === 'simulated') entry = { ...entry, simulated: true };
  if (reason === 'development') entry = { ...entry, identity: { ...entry.identity, provenance: 'development' } };
  if (reason === 'identity') entry = { ...entry, identity: { ...entry.identity, destinationId: 'D01' } };
  if (reason === 'ineligible') eligible = false;
  if (reason === 'background') running = false;
  if (reason === 'retired') authorize.mockReturnValue(false);
  await mount(); expect(copy()).not.toContain('Synthetic test'); expect(established).not.toHaveBeenCalled();
});
it('does not inherit reader admission when a different captured entry replaces the props', async () => {
  await mount(); expect(copy()).toContain('Synthetic test en');
  const frames: string[] = [];
  entry = { ...entry, identity: { ...entry.identity, admissionId: 'replacement' } };
  authorize.mockImplementation(() => { frames.push(copy()); return false; });
  await update(); expect(frames.length).toBeGreaterThan(0); expect(frames.some(frame => frame.includes('Synthetic test'))).toBe(false);
  expect(copy()).not.toContain('Synthetic test'); expect(established).not.toHaveBeenCalled();
});
it('immediately hides on stale/background evidence, rechecks on return and rejects a retained layout callback', async () => {
  await mount(); const layout = tree!.root.findByProps({ testID: 'eligible-read-only-content' }).props.onLayout;
  authorize.mockReturnValue(false); eligible = false; await update(); expect(copy()).not.toContain('Synthetic test');
  await act(async () => layout({ nativeEvent: { layout: { width: 320, height: 300 } } })); expect(established).not.toHaveBeenCalled();
  running = false; eligible = true; await update(); expect(copy()).not.toContain('Synthetic test');
  running = true; authorize.mockReturnValue(true); await update(); expect(copy()).toContain('Synthetic test en');
});
it.each(['eligibility', 'foreground'])('does not flash prior authorization when %s resumes with a retired entry', async reason => {
  await mount(); expect(copy()).toContain('Synthetic test en');
  if (reason === 'eligibility') eligible = false; else running = false;
  await update();
  const frames: string[] = [];
  authorize.mockImplementation(() => { frames.push(copy()); return false; });
  eligible = running = true; await update();
  expect(frames.length).toBeGreaterThan(0);
  expect(frames.some(frame => frame.includes('Synthetic test'))).toBe(false);
  expect(copy()).not.toContain('Synthetic test');
});
it('retires delayed layout callbacks on background even when the source lease is otherwise fresh', async () => {
  await mount(); const layout = tree!.root.findByProps({ testID: 'eligible-read-only-content' }).props.onLayout;
  running = false; await update();
  await act(async () => layout({ nativeEvent: { layout: { width: 320, height: 300 } } }));
  expect(established).not.toHaveBeenCalled();
});
it.each(['en', 'ja', 'ko'] as const)('uses the current %s locale and safe guidance for unknown eligibility', async locale => {
  runtime.language = locale; await translations.changeLanguage(locale); await mount(); expect(copy()).toContain(`Synthetic test ${locale}`);
  eligible = false; await update(); expect(copy()).toContain(translations.t('fallback.verify')); expect(copy()).not.toContain('Synthetic test');
});

it('reveals only bound approved bundled images inside the existing fresh eligible reader gate', async () => {
  const { destinationSchema } = await import('@/features/destinations/catalog');
  const approved = (value: string) => ({ value, approvalReference: 'synthetic test' });
  const media = { id: 'synthetic-reader-photo', source: 1, credit: 'Synthetic reader credit', rightsReference: 'test', approvalReference: 'test', alt: { en: approved('Synthetic reader alt'), ja: approved('合成リーダー画像') }, caption: { en: approved('Synthetic reader caption') } };
  entry = { ...entry, destination: destinationSchema.parse({ ...entry.destination, media: [media, { ...media, id: 'unbound', source: 2 }], ar: { ...entry.destination.ar, tiles: entry.destination.ar!.tiles.map(tile => ({ ...tile, mediaIds: [media.id] })) } }) };
  await mount(); expect(tree!.root.findAllByType('img' as React.ElementType).map(node => node.props.source)).toEqual([1]);
  expect(copy()).toContain('Synthetic reader caption'); expect(copy()).toContain('Synthetic reader credit');
  runtime.language = 'ja'; await translations.changeLanguage('ja'); await update(); expect(copy()).toContain('合成リーダー画像');
  const photo = tree!.root.findByType('img' as React.ElementType);
  await act(async () => photo.props.onError({ nativeEvent: { error: 'PRIVATE_MEDIA_ERROR' } }));
  expect(copy()).toContain(translations.t('destinationRing.imageFailed')); expect(copy()).not.toContain('PRIVATE_MEDIA_ERROR');
  eligible = false; await update(); expect(copy()).not.toContain('Synthetic reader caption'); expect(tree!.root.findAllByType('img' as React.ElementType)).toHaveLength(0);
});
