import { z } from 'zod';
import { ApiError } from './errors.ts';
/** Prefer hosted named keys; keep local/single-key and legacy setups working. */
export function resolveSupabaseKey(read: (name: string) => string | undefined, kind: 'publishable' | 'secret'): string {
  const names = kind === 'publishable' ? ['SUPABASE_PUBLISHABLE_KEYS', 'SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_ANON_KEY'] : ['SUPABASE_SECRET_KEYS', 'SUPABASE_SECRET_KEY', 'SUPABASE_SERVICE_ROLE_KEY'];
  const fail = () => new ApiError('SERVICE_NOT_CONFIGURED', 503, 'The service is not configured.');
  const dictionary = read(names[0]);
  if (dictionary) {
    let value: unknown;
    try { value = JSON.parse(dictionary); } catch { throw fail(); }
    const parsed = z.record(z.string(), z.string().min(1)).safeParse(value);
    if (!parsed.success) throw fail();
    if (parsed.data.default) return parsed.data.default;
  }
  const key = read(names[1]) || read(names[2]);
  if (!key) throw fail();
  return key;
}
