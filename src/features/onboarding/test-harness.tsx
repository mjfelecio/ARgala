import { withHeroUI } from '@/test/native-ui';
import * as React from 'react';
import { vi } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query';
import i18n from '@/i18n';
import { SettingsProvider } from '@/features/settings/provider';
import { OnboardingProvider } from './provider';

const runtime = vi.hoisted(() => ({
  values: new Map<string, string>(),
  getItem: vi.fn<(key: string) => Promise<string | null>>(),
  setItem: vi.fn<(key: string, value: string) => Promise<void>>(),
  auth: { session: null as { user: { id: string } } | null, loading: false, error: null as string | null, retry: vi.fn() },
}));
vi.mock('@react-native-async-storage/async-storage', () => ({ default: { getItem: runtime.getItem, setItem: runtime.setItem } }));
vi.mock('@/features/auth/provider', () => ({ useAuth: () => runtime.auth }));
vi.mock('@/i18n', async () => {
  const { createInstance } = await import('i18next');
  const { initReactI18next } = await import('react-i18next');
  const { localizationOptions } = await import('@/i18n/options');
  const i18n = createInstance();
  await i18n.use(initReactI18next).init({ ...localizationOptions, lng: 'en', react: { useSuspense: false } });
  return { default: i18n, deviceLanguage: 'ja' };
});
vi.mock('@/ui/shared', async () => {
  const { createElement } = await import('react');
  return { Screen: 'section', Notice: 'output', Action: (props: Record<string, unknown>) => createElement('button', props) };
});
export function resetRuntime() {
  runtime.values.clear();
  runtime.getItem.mockReset().mockImplementation(async key => runtime.values.get(key) ?? null);
  runtime.setItem.mockReset().mockImplementation(async (key, value) => { runtime.values.set(key, value); });
  Object.assign(runtime.auth, { session: null, loading: false, error: null });
  runtime.auth.retry.mockClear();
}
export function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
export function Harness({ children }: React.PropsWithChildren) {
  const [client] = React.useState(() => new QueryClient({ defaultOptions: queryClient.getDefaultOptions() }));
  React.useEffect(() => () => client.clear(), [client]);
  return <I18nextProvider i18n={i18n}>{withHeroUI(<QueryClientProvider client={client}><SettingsProvider><OnboardingProvider>{children}</OnboardingProvider></SettingsProvider></QueryClientProvider>)}</I18nextProvider>;
}

export { runtime };
