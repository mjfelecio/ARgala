import { useEffect, useState } from 'react';
import type { BookmarkMetadataMap } from '@/features/journal/bookmark-metadata';
import { BOOKMARK_PIN_MAX_AGE_MS } from '@/features/journal/bookmark-metadata';

/** Independent display expiry even if a durable cleanup fails. Values grant no request authority. */
export function useBookmarkPinClock(metadata: BookmarkMetadataMap | undefined, active: boolean) {
  const [now, setNow] = useState(Date.now);
  // Stable scalar dependencies also handle contexts that publish equivalent objects.
  const captures = Object.values(metadata ?? {}).flatMap(item => item.pin ? [item.pin.capturedAt] : []).sort((a,b) => a-b).join(',');
  useEffect(() => {
    let current = true;
    void Promise.resolve().then(() => { if (current) setNow(Date.now()); });
    return () => { current = false; };
  }, [captures, active]);
  useEffect(() => {
    if (!active || !captures) return;
    const current = Date.now();
    const deadlines = captures.split(',').map(Number).map(value => value + BOOKMARK_PIN_MAX_AGE_MS).filter(value => value > current);
    if (!deadlines.length) return;
    const timer = setTimeout(() => setNow(Date.now()), Math.min(2147483647, Math.min(...deadlines) - current + 1));
    return () => clearTimeout(timer);
  }, [captures, active, now]);
  return now;
}
