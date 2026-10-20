import type { QueryClient } from '@tanstack/react-query';
import { AR } from '@/config/limits';
import type { Coordinate } from '@/features/location/geo';
import type { Place } from '@/features/places/service';
import type { Preferences } from '@/features/settings/preferences';
import type { WalkingRoute } from './service';

export type RoutePreviewResult = { origin: Coordinate; destination: Coordinate; route: WalkingRoute };
export type RoutePreviewIntent = {
  place: Place; language: Preferences['language']; source: 'details' | 'map' | 'ar'; createdAt: number; existing?: RoutePreviewResult;
};
export const routePreviewLifetimeMs = AR.nearbyReuseMs;
const prefix = ['route-preview-intent'] as const;
let sequence = 0;

/** Local navigation handle, never a credential. A new handoff retires an older target. */
export function createRoutePreviewIntent(client: QueryClient, place: Place, existing?: RoutePreviewResult, source: RoutePreviewIntent['source'] = existing ? 'map' : 'details', language: Preferences['language'] = 'en'): string {
  existing ??= completedPreview(client, place, language);
  client.removeQueries({ queryKey: prefix });
  client.setQueryDefaults(prefix, { gcTime: routePreviewLifetimeMs });
  const token = `${Date.now().toString(36)}-${(++sequence).toString(36)}`;
  client.setQueryData<RoutePreviewIntent>([...prefix, token], {
    place, source, language, createdAt: Date.now(), ...(existing ? { existing } : {}),
  });
  return token;
}

/** Synchronous removal makes claims single-use, including rapid duplicate navigation. */
export function claimRoutePreviewIntent(client: QueryClient, token: unknown): RoutePreviewIntent | null {
  if (typeof token !== 'string' || !/^[a-z0-9]+-[a-z0-9]+$/.test(token) || token.length > 128) return null;
  const key = [...prefix, token];
  const intent = client.getQueryData<RoutePreviewIntent>(key);
  client.removeQueries({ queryKey: key, exact: true });
  if (!intent || Date.now() < intent.createdAt || Date.now() - intent.createdAt >= routePreviewLifetimeMs) return null;
  return intent;
}

/** A completed snapshot is display data, never permission to calculate a new route. */
function completedPreview(client: QueryClient, place: Place, language: Preferences['language']): RoutePreviewResult | undefined {
  type Completed = { status: string; language?: Preferences['language']; intent: RoutePreviewIntent; result?: RoutePreviewResult };
  const now = Date.now();
  const sessions = client.getQueriesData<Completed>({ queryKey: ['route-preview-session'] })
    .map(([, value]) => value).filter((value): value is Completed => !!value)
    .sort((a, b) => b.intent.createdAt - a.intent.createdAt);
  return sessions.find(session => session.status === 'success' && session.language === language && session.result &&
    now >= session.intent.createdAt && now - session.intent.createdAt < routePreviewLifetimeMs &&
    session.intent.place.provider === place.provider && session.intent.place.providerId === place.providerId &&
    session.result.destination.latitude === place.coordinates.latitude && session.result.destination.longitude === place.coordinates.longitude)?.result;
}
