import type { Language } from '../../../supabase/functions/_shared/contracts';
import { destinationSchema, localizedContent, type Destination } from './catalog';

/** Approval-aware metadata only. Never substitute a display center or route entrance. */
export function activationPolicy(destination: Destination | null) {
  const parsed = destinationSchema.safeParse(destination);
  return parsed.success ? parsed.data.ar?.activation ?? null : null;
}
export function approvedArContent(destination: Destination | null, language: Language) {
  const parsed = destinationSchema.safeParse(destination);
  if (!parsed.success) return [];
  return (parsed.data.ar?.tiles ?? []).flatMap(tile => {
    const title = localizedContent(tile.title, language);
    const body = localizedContent(tile.body, language);
    return title && body ? [{ id: tile.id, ...(tile.role ? { role: tile.role } : {}),
      title: title.value, body: body.value, englishFallback: title.englishFallback || body.englishFallback }] : [];
  });
}
