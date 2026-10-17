import { expect, it } from 'vitest';
import { resolveSupabaseKey } from './keys.ts';
const reader = (values: Record<string, string>) => (name: string) => values[name];
it('prefers hosted named publishable and secret keys over legacy keys', () => {
  const read = reader({ SUPABASE_PUBLISHABLE_KEYS: '{"default":"new-public"}', SUPABASE_SECRET_KEYS: '{"default":"new-admin"}', SUPABASE_ANON_KEY: 'old-public', SUPABASE_SERVICE_ROLE_KEY: 'old-admin' });
  expect(resolveSupabaseKey(read, 'publishable')).toBe('new-public');
  expect(resolveSupabaseKey(read, 'secret')).toBe('new-admin');
});
it('accepts single new keys for local runtime configuration', () => {
  const read = reader({ SUPABASE_PUBLISHABLE_KEY: 'local-public', SUPABASE_SECRET_KEY: 'local-admin' });
  expect(resolveSupabaseKey(read, 'publishable')).toBe('local-public'); expect(resolveSupabaseKey(read, 'secret')).toBe('local-admin');
});
it('retains compatibility with legacy injected keys', () => {
  const read = reader({ SUPABASE_ANON_KEY: 'old-public', SUPABASE_SERVICE_ROLE_KEY: 'old-admin' });
  expect(resolveSupabaseKey(read, 'publishable')).toBe('old-public'); expect(resolveSupabaseKey(read, 'secret')).toBe('old-admin');
});
it('fails closed for missing or malformed configuration without revealing its values', () => {
  expect(() => resolveSupabaseKey(reader({}), 'secret')).toThrow();
  expect(() => resolveSupabaseKey(reader({ SUPABASE_SECRET_KEYS: 'private-invalid-json' }), 'secret')).toThrow('not configured');
});
