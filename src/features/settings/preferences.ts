import { z } from 'zod';
import { ACTIVATION } from '../../config/limits';
import { languageSchema, type Language } from '../../../supabase/functions/_shared/contracts';
export const activationRadiusSchema = z.number().int().min(ACTIVATION.minMeters).max(ACTIVATION.maxMeters);
export const preferencesSchema = z.object({ activationRadiusMeters: activationRadiusSchema, language: languageSchema }).strict();
export type Preferences = z.infer<typeof preferencesSchema>;
export function resolveLanguage(locale?: string | null): Language {
  const result = languageSchema.safeParse(locale?.split('-')[0]?.toLowerCase());
  return result.success ? result.data : 'en';
}
export function readPreferences(raw: string | null, deviceLocale?: string | null): Preferences {
  const defaults: Preferences = { activationRadiusMeters: ACTIVATION.defaultMeters, language: resolveLanguage(deviceLocale) };
  let decoded: unknown;
  try { decoded = JSON.parse(raw ?? '{}'); } catch { return defaults; }
  const object = z.object({ activationRadiusMeters: z.unknown().optional(), language: z.unknown().optional() }).safeParse(decoded);
  if (!object.success) return defaults;
  const radius = activationRadiusSchema.safeParse(object.data.activationRadiusMeters);
  const language = languageSchema.safeParse(object.data.language);
  return { activationRadiusMeters: radius.success ? radius.data : defaults.activationRadiusMeters, language: language.success ? language.data : defaults.language };
}
