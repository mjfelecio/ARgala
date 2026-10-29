import { withHeroUI } from '@/test/native-ui';
import React from 'react';
import { AppState } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, expect, it, vi, type Mock } from 'vitest';
import { createInstance } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { QueryClient, QueryClientProvider, focusManager, onlineManager } from '@tanstack/react-query';
import { queryClient } from '@/lib/query';
import { localizationOptions } from '@/i18n/options';
import { ContentRepository, type ContentStorage } from './repository';
import { ContentError, type ContentAccount } from './service';
import type { ContentManifest } from './model';
import { manifest } from './test-fixtures';
import { DestinationContentProvider } from './provider';
import { useDestinationContent, useDestinationLookup } from './context';
import { ContentUpdates } from './updates';
const runtime = vi.hoisted(() => ({ session: { user: { id: 'owner-a' }, access_token: 'token-a' } as { user: { id: string }; access_token: string } | null, listeners: [] as ((state: import('react-native').AppStateStatus) => void)[] }));
vi.mock('@react-native-async-storage/async-storage', () => ({ default: { getItem: vi.fn(async () => null), setItem: vi.fn(async () => {}) } }));
vi.mock('@/features/auth/provider', () => ({ useAuth: () => ({ session: runtime.session }) }));
const translations = createInstance();
await translations.use(initReactI18next).init({ ...localizationOptions, lng: 'en', react: { useSuspense: false } });
let tree: ReactTestRenderer | undefined;
let content: NonNullable<ReturnType<typeof useDestinationContent>>;
let resolved: ReturnType<ReturnType<typeof useDestinationLookup>>;
let client: QueryClient; let repository: ContentRepository;
let storage: { getItem: Mock<ContentStorage['getItem']>; setItem: Mock<ContentStorage['setItem']> };
let service: Mock<(account: ContentAccount, signal: AbortSignal) => Promise<unknown>>; let disk: Map<string, string>;
function Probe() {
  const value = useDestinationContent()!; const destination = useDestinationLookup()('pilot-aclc');
  React.useEffect(() => { content = value; resolved = destination; });
  return <ContentUpdates />;
}
const view = () => withHeroUI(<QueryClientProvider client={client}><I18nextProvider i18n={translations}><DestinationContentProvider repository={repository} service={async (account, signal) => await service(account, signal) as ContentManifest | null}><Probe /></DestinationContentProvider></I18nextProvider></QueryClientProvider>);
async function mount() { await act(async () => { tree = create(view()); }); }
async function update() { await act(async () => tree!.update(view())); }
async function foreground(active: boolean) { Object.assign(AppState, { currentState: active ? 'active' : 'background' }); await act(async () => runtime.listeners.forEach(fn => fn(active ? 'active' : 'background'))); }
const copy = () => JSON.stringify(tree?.toJSON());
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true, __DEV__: false }); Object.assign(AppState, { currentState: 'active' });
  runtime.session = { user: { id: 'owner-a' }, access_token: 'token-a' }; runtime.listeners = [];
  vi.spyOn(AppState, 'addEventListener').mockImplementation((_event, listener) => { runtime.listeners.push(listener); return { remove() { runtime.listeners = runtime.listeners.filter(fn => fn !== listener); } }; });
  disk = new Map(); storage = { getItem: vi.fn(async (key: string) => disk.get(key) ?? null), setItem: vi.fn(async (key: string, value: string) => { disk.set(key, value); }) };
  repository = new ContentRepository(storage, 'https://synthetic.example'); service = vi.fn<(account: ContentAccount, signal: AbortSignal) => Promise<unknown>>(async () => manifest());
  client = new QueryClient({ defaultOptions: queryClient.getDefaultOptions() }); await translations.changeLanguage('en');
});
afterEach(async () => { await act(async () => tree?.unmount()); tree = undefined; client.clear(); vi.restoreAllMocks(); onlineManager.setOnline(true); focusManager.setFocused(undefined); });
it('hydrates local content without network and never fetches on focus, foreground, locale, reconnect or invalidation', async () => {
  await repository.install(manifest(), () => true); await mount(); expect(resolved?.ar?.tiles).toHaveLength(1);
  await foreground(false); await foreground(true);
  await act(async () => { focusManager.setFocused(false); focusManager.setFocused(true); onlineManager.setOnline(false); onlineManager.setOnline(true); await client.invalidateQueries(); await translations.changeLanguage('ja'); });
  await act(async () => tree!.unmount()); tree = undefined; await mount(); expect(service).not.toHaveBeenCalled();
});
it('checks explicitly, persists before publishing, coalesces presses and keeps the captured bearer', async () => {
  let finish!: (value: unknown) => void; service.mockImplementation(() => new Promise(resolve => { finish = resolve; })); await mount();
  let pending!: Promise<void>;
  await act(async () => { pending = content.checkUpdates(); void content.checkUpdates(); });
  expect(service).toHaveBeenCalledOnce(); expect(service.mock.calls[0][0]).toEqual({ principalId: 'owner-a', accessToken: 'token-a' });
  expect(resolved?.ar?.tiles).toEqual([]);
  await act(async () => { finish(manifest()); await pending; });
  expect(resolved?.ar?.tiles).toHaveLength(1); expect(disk.size).toBe(1); expect(copy()).toContain(translations.t('content.current'));
});
it.each(['en', 'ja', 'ko'])('uses actual %s localized unknown failure, cache retention, language change and explicit recovery', async locale => {
  await translations.changeLanguage(locale); await repository.install(manifest(), () => true); await mount();
  service.mockRejectedValueOnce(new Error('PRIVATE server details')); await act(async () => { await content.checkUpdates(); });
  expect(copy()).toContain(translations.t('content.failed')); expect(copy()).not.toContain('PRIVATE'); expect(resolved?.ar?.tiles).toHaveLength(1);
  await act(async () => { await translations.changeLanguage('en'); }); expect(copy()).toContain(translations.t('content.failed'));
  service.mockResolvedValueOnce(manifest(2)); await act(async () => { await content.checkUpdates(); }); expect(content.manifest?.revision).toBe(2); expect(content.error).toBeNull();
});
it.each(['content.authRequired', 'content.timeout', 'content.unavailable', 'content.failed', 'content.saveFailed'] as const)('renders known %s failures through actual resources in every locale', async code => {
  service.mockRejectedValue(new ContentError(code)); await mount(); await act(async () => { await content.checkUpdates(); });
  for (const locale of ['en', 'ja', 'ko']) { await act(async () => { await translations.changeLanguage(locale); }); expect(copy()).toContain(translations.t(code)); expect(copy()).not.toContain(`"${code}"`); }
});
it('keeps bundle/prior data after missing publication, invalid update or storage failure', async () => {
  await mount(); service.mockResolvedValueOnce(null); await act(async () => { await content.checkUpdates(); }); expect(content.manifest).toBeNull();
  service.mockResolvedValueOnce(manifest()); await act(async () => { await content.checkUpdates(); });
  service.mockResolvedValueOnce({ ...manifest(2), approvalStatus: 'draft' }); await act(async () => { await content.checkUpdates(); }); expect(content.manifest?.revision).toBe(1);
  service.mockResolvedValueOnce(manifest(2)); storage.setItem.mockRejectedValueOnce(new Error('disk')); await act(async () => { await content.checkUpdates(); });
  expect(content.manifest?.revision).toBe(1); expect(content.error).toBe('content.saveFailed');
});
it.each(['background', 'principal', 'unmount'])('retires a pending request on %s and rejects late publication', async mode => {
  let finish!: (value: unknown) => void; service.mockImplementation(() => new Promise(resolve => { finish = resolve; })); await mount();
  let pending!: Promise<void>; await act(async () => { pending = content.checkUpdates(); });
  const signal = service.mock.calls[0][1] as AbortSignal;
  if (mode === 'background') await foreground(false);
  else if (mode === 'principal') { runtime.session = { user: { id: 'owner-b' }, access_token: 'token-b' }; await update(); }
  else { await act(async () => tree!.unmount()); tree = undefined; }
  expect(signal.aborted).toBe(true);
  await act(async () => { finish(manifest()); await pending; }); expect(disk.size).toBe(0);
});
it('allows guest offline cache but never calls the authenticated download transport', async () => {
  runtime.session = null; await repository.install(manifest(), () => true); await mount();
  await act(async () => { await content.checkUpdates(); }); expect(service).not.toHaveBeenCalled(); expect(resolved?.ar?.tiles).toHaveLength(1); expect(copy()).toContain(translations.t('content.authRequired'));
});
