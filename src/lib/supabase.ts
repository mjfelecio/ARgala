import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, processLock } from '@supabase/supabase-js';
import { environment } from '@/config/env';

export const supabase = environment.success ? createClient(environment.data.url, environment.data.key, {
  auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false, lock: processLock },
}) : null;

export function getSupabase() {
  if (!supabase) throw new Error('Supabase configuration is missing.');
  return supabase;
}
