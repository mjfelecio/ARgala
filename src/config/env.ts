import { z } from 'zod';

const environmentSchema = z.object({
  url: z.url().refine((value) => new URL(value).protocol === 'https:', 'Use an HTTPS Supabase project URL'),
  key: z.string().regex(/^sb_publishable_[A-Za-z0-9_-]+$/, 'Use the public Supabase publishable key'),
});

export function validateEnvironment(input: unknown) {
  return environmentSchema.safeParse(input);
}

// Expo substitutes only direct EXPO_PUBLIC_* property reads in client bundles.
export const environment = validateEnvironment({
  url: process.env.EXPO_PUBLIC_SUPABASE_URL,
  key: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
});
