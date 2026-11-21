import { withHeroUI } from '@/test/native-ui';
import React from 'react';
import { BackHandler } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { createInstance, type i18n } from 'i18next';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { localizationOptions } from '@/i18n/options';
import { destinationIds, destinationName, getDestination } from '@/features/destinations/catalog';
import ShowcaseScreen from './showcase-screen';
import { ShowcaseEntry } from './showcase-entry';
import { EXHIBIT_HISTORY_ID, EXHIBIT_VISIT_PLAN_ID } from './ring-content';
import { featuredStoryContent } from './featured-story-content';
import type { RingContent } from './ring-content';
const runtime = vi.hoisted(() => ({ principal: 'a' as string | null, guest: false, focused: true, active: true, load: vi.fn(), push: vi.fn() }));
vi.mock('@/features/auth/provider', () => ({ useAuth: () => ({ session: runtime.principal ? { user: { id: runtime.principal } } : null }) }));
vi.mock('@/features/auth/guest-context', () => ({ useGuestAccess: () => ({ enabled: runtime.guest }) }));
vi.mock('@/features/settings/provider', () => ({ useSettings: () => ({ language: 'en' }) }));
vi.mock('@/lib/use-app-active', () => ({ useAppActive: () => runtime.active }));
vi.mock('expo-router', () => ({ useIsFocused: () => runtime.focused, router: { canGoBack: () => true, back: vi.fn(), navigate: vi.fn(), push: runtime.push } }));
vi.mock('./exhibit-loader', () => ({ loadExhibitScene: runtime.load }));
vi.mock('./session-experience', () => ({ DestinationArSessionExperience: (props: Record<string, unknown>) => React.createElement('experience', props) }));
let tree: ReactTestRenderer | undefined; let translations: i18n;
const view = () => <I18nextProvider i18n={translations}>{withHeroUI(<ShowcaseScreen />)}</I18nextProvider>;
async function mount() { await act(async () => { tree = create(view()); }); }
async function press(label: string) { await act(async () => tree!.root.findAllByType('button').find(n => n.props.accessibilityLabel === label)!.props.onPress()); }
const experience = () => tree!.root.findByType('experience' as React.ElementType);
const copy = () => JSON.stringify(tree!.toJSON());
beforeEach(async () => {
  vi.stubGlobal('__DEV__', false); vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true); vi.stubEnv('EXPO_PUBLIC_VIRO_SPIKE', ''); vi.useFakeTimers();
  runtime.principal = 'a'; runtime.guest = false; runtime.active = runtime.focused = true;
  runtime.load.mockReset().mockResolvedValue(() => null); runtime.push.mockReset();
  translations = createInstance(); await translations.use(initReactI18next).init({ ...localizationOptions, lng: 'en', react: { useSuspense: false } });
});
afterEach(async () => { await act(async () => tree?.unmount()); tree = undefined; vi.useRealTimers(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
it.each([false, true])('opens all ten school presentation exhibits for guest=%s without native startup on browse', async guest => {
  runtime.guest = guest; runtime.principal = guest ? null : 'a'; await mount();
  for (const id of destinationIds) expect(copy()).toContain(destinationName(getDestination(id)!));
  expect(runtime.load).not.toHaveBeenCalled();
  for (const id of destinationIds) {
    await press(destinationName(getDestination(id)!));
    expect(runtime.load).toHaveBeenLastCalledWith(id);
    expect(experience().props.identity).toMatchObject({ destinationId: id, principalId: guest ? 'guest' : 'a', provenance: 'showcase' });
    expect(experience().props.galleryMediaIds).toHaveLength(getDestination(id)!.media!.length);
    const content: readonly RingContent[] = experience().props.content;
    const stories = featuredStoryContent(id);
    expect(content.slice(0, stories.length)).toEqual(stories);
    expect(content.find(panel => panel.id === EXHIBIT_VISIT_PLAN_ID)).toBeDefined();
    expect(content.filter(panel => panel.id === EXHIBIT_HISTORY_ID)).toHaveLength(1);
    await act(async () => experience().props.onReturn());
  }
});
it('awards demo stamps only from tracking establishment, resets stale callbacks and isolates the next principal', async () => {
  await mount(); await press(destinationName(getDestination('D01')!)); const retired = experience().props.onEstablished;
  expect(experience().props.preparation.props.stamped).toBe(false);
  await act(async () => { retired(); retired(); });
  await act(async () => experience().props.onReturn()); expect(copy()).toContain(translations.t('arShowcase.passportCount', { count: 1, total: destinationIds.length }));
  await press(translations.t('arShowcase.reset')); await act(async () => retired());
  expect(copy()).toContain(translations.t('arShowcase.passportCount', { count: 0, total: destinationIds.length }));
  runtime.principal = 'b'; await act(async () => tree!.update(view())); await act(async () => retired());
  expect(copy()).toContain(translations.t('arShowcase.passportCount', { count: 0, total: destinationIds.length }));
});
it('retires blur and timed-out imports until explicit recovery, and never renders a late result', async () => {
  const late = Promise.withResolvers<() => null>(); runtime.load.mockReturnValueOnce(late.promise); await mount();
  await press(destinationName(getDestination('D01')!)); runtime.focused = false; await act(async () => tree!.update(view()));
  await act(async () => late.resolve(() => null)); expect(tree!.root.findAllByType('experience' as React.ElementType)).toHaveLength(0);
  runtime.focused = true; runtime.load.mockReturnValueOnce(new Promise(() => {})); await act(async () => tree!.update(view()));
  await act(async () => { await vi.advanceTimersByTimeAsync(20000); }); expect(copy()).toContain(translations.t('arShowcase.loadFailed'));
  await press(translations.t('common.retry')); expect(experience()).toBeDefined();
});
it.each(['en', 'ja', 'ko'])('has finished %s copy and keeps showcase entry available without a flag', async language => {
  await translations.changeLanguage(language); await act(async () => { tree = create(<I18nextProvider i18n={translations}>{withHeroUI(<ShowcaseEntry />)}</I18nextProvider>); });
  await press(translations.t('arShowcase.title')); expect(runtime.push).toHaveBeenCalledWith('/ar-showcase');
  for (const key of ['title', 'intro', 'ready', 'readyHint', 'reset', 'passportTitle', 'loadFailed']) expect(translations.getResource(language, 'translation', `arShowcase.${key}`)).toBeTruthy();
});

it('returns from a selected destination to the picker on Android Back', async () => {
  let back: Parameters<typeof BackHandler.addEventListener>[1] | undefined;
  vi.spyOn(BackHandler, 'addEventListener').mockImplementation((_event, listener) => { back = listener; return { remove: vi.fn() }; });
  await mount(); await press(destinationName(getDestination('D01')!));
  expect(back).toBeTypeOf('function');
  await act(async () => { expect(back!({ type: 'hardwareBackPress', timeStamp: 1 })).toBe(true); });
  expect(tree!.root.findAllByType('experience' as React.ElementType)).toHaveLength(0);
  expect(copy()).toContain(translations.t('arShowcase.choose'));
});
