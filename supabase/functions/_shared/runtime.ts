import { resolveSupabaseKey } from './keys.ts';
import { createClient } from '@supabase/supabase-js';
import { ApiError } from './errors.ts';
import type { Access } from './endpoint.ts';
function required(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new ApiError('SERVICE_NOT_CONFIGURED', 503, 'The service is not configured.');
  return value;
}
const timedFetch: typeof fetch = (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(10000) });
export const access: Access = {
  async authenticate(token) {
    const client = createClient(required('SUPABASE_URL'), resolveSupabaseKey((name) => Deno.env.get(name), 'publishable'), { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: timedFetch } });
    const { data, error } = await client.auth.getUser(token);
    return error ? null : data.user?.id ?? null;
  },
  async consume(userId) {
    const admin = createClient(required('SUPABASE_URL'), resolveSupabaseKey((name) => Deno.env.get(name), 'secret'), { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: timedFetch } });
    const { data, error } = await admin.rpc('consume_google_request', { p_user_id: userId });
    if (error) throw new ApiError('LIMITER_UNAVAILABLE', 503, 'The request limiter is unavailable.');
    return data === true;
  },
};
export const placesDependencies = () => ({ key: required('GOOGLE_PLACES_API_KEY'), fetcher: fetch });
export const routesDependencies = () => ({ key: required('GOOGLE_ROUTES_API_KEY'), fetcher: fetch });
