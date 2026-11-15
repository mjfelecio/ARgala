import { getSupabase } from '@/lib/supabase';
import { requireOptionalNativeModule } from 'expo-modules-core';

const redirectTo = 'argala://auth-callback';
export class GoogleBrowserUnavailable extends Error {}

// Only a response belonging to the currently open browser is accepted. A cold
// start after Android kills the app requires an explicit new attempt.
export async function signInWithGoogle(isCurrent: () => boolean): Promise<'complete' | 'cancelled'> {
  if (!requireOptionalNativeModule('ExpoWebBrowser')) throw new GoogleBrowserUnavailable();
  const browser = await import('expo-web-browser');
  if (!isCurrent()) return 'cancelled';
  const client = getSupabase();
  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'google', options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error || !data.url) throw error ?? new Error('OAuth URL unavailable');
  if (!isCurrent()) return 'cancelled';
  const result = await browser.openAuthSessionAsync(data.url, redirectTo);
  if (!isCurrent() || result.type === 'cancel' || result.type === 'dismiss') return 'cancelled';
  if (result.type !== 'success') throw new Error('OAuth browser failed');
  const url = new URL(result.url);
  if (url.protocol !== 'argala:' || url.hostname !== 'auth-callback' || url.pathname !== '' && url.pathname !== '/') throw new Error('Invalid OAuth callback');
  const codes = url.searchParams.getAll('code');
  if (codes.length !== 1 || !codes[0] || url.searchParams.has('error')) throw new Error('Invalid OAuth response');
  if (!isCurrent()) return 'cancelled';
  const exchange = await client.auth.exchangeCodeForSession(codes[0]);
  if (exchange.error) throw exchange.error;
  return 'complete';
}
