import { useEffect, useRef } from 'react';
import { router, useIsFocused, useLocalSearchParams } from 'expo-router';
import { useAppActive } from '@/lib/use-app-active';
import { detailsRequestSchema } from '../../../supabase/functions/_shared/contracts';

/** Compatibility only. URLs grant display selection, never a paid-request intent. */
export default function PlaceDetailsScreen() {
  const { providerId } = useLocalSearchParams();
  const focused = useIsFocused(); const active = useAppActive();
  const parsed = detailsRequestSchema.safeParse({ providerId, language: 'en' });
  const id = parsed.success ? parsed.data.providerId : null;
  const redirected = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (!focused || !active || redirected.current === id) return;
    redirected.current = id;
    router.dismissTo(id ? { pathname: '/', params: { placeId: id } } : '/');
  }, [focused, active, id]);
  return null;
}
