import { z } from 'zod';
import { errorSchema } from '../../supabase/functions/_shared/contracts';
import { getSupabase } from './supabase';
export async function invokeEdge<T>(name: string, body: unknown, schema: z.ZodType<T>): Promise<T> {
  const { data, error } = await getSupabase().functions.invoke(name, { body: body as Record<string, unknown> });
  if (error) {
    if (error.context instanceof Response) {
      const parsed = errorSchema.safeParse(await error.context.json().catch(() => null));
      if (parsed.success) throw new Error(parsed.data.error.message);
    }
    throw new Error('The service is unavailable. Check your connection and try again.');
  }
  const parsed = z.object({ data: schema }).safeParse(data);
  if (!parsed.success) throw new Error('The service returned an invalid response.');
  return parsed.data.data;
}
