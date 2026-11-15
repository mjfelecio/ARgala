import { beforeEach, expect, it, vi } from 'vitest';
import { signInWithGoogle } from './google-sign-in';

const boundary = vi.hoisted(() => ({ oauth: vi.fn(), exchange: vi.fn(), browser: vi.fn() }));
vi.mock('@/lib/supabase', () => ({ getSupabase: () => ({ auth: { signInWithOAuth: boundary.oauth, exchangeCodeForSession: boundary.exchange } }) }));
vi.mock('expo-web-browser', () => ({ openAuthSessionAsync: boundary.browser }));
vi.mock('expo-modules-core', () => ({ requireOptionalNativeModule: () => ({}) }));
beforeEach(() => {
  boundary.oauth.mockReset().mockResolvedValue({ data: { url: 'https://example.com/oauth' }, error: null });
  boundary.browser.mockReset().mockResolvedValue({ type: 'success', url: 'argala://auth-callback?code=valid' });
  boundary.exchange.mockReset().mockResolvedValue({ error: null });
});
it('opens Google in the system browser and exchanges one callback code', async () => {
  await expect(signInWithGoogle(() => true)).resolves.toBe('complete');
  expect(boundary.oauth).toHaveBeenCalledWith({ provider: 'google', options: { redirectTo: 'argala://auth-callback', skipBrowserRedirect: true } });
  expect(boundary.exchange).toHaveBeenCalledExactlyOnceWith('valid');
});
it.each(['https://evil.example/?code=valid', 'argala://other?code=valid', 'argala://auth-callback?code=a&code=b', 'argala://auth-callback?error=denied'])('rejects invalid callback %s', async url => {
  boundary.browser.mockResolvedValue({ type: 'success', url });
  await expect(signInWithGoogle(() => true)).rejects.toThrow();
  expect(boundary.exchange).not.toHaveBeenCalled();
});
it('does not exchange when the browser is cancelled or the owner is retired', async () => {
  boundary.browser.mockResolvedValueOnce({ type: 'cancel' });
  await expect(signInWithGoogle(() => true)).resolves.toBe('cancelled');
  boundary.browser.mockImplementationOnce(async () => { active = false; return { type: 'success', url: 'argala://auth-callback?code=valid' }; });
  let active = true;
  await expect(signInWithGoogle(() => active)).resolves.toBe('cancelled');
  expect(boundary.exchange).not.toHaveBeenCalled();
});
