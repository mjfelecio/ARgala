import type { QueryClient } from '@tanstack/react-query';
import type { Language } from '../../../supabase/functions/_shared/contracts';
import { detailsRequestSchema } from '../../../supabase/functions/_shared/contracts';
import { isCoordinate, type Coordinate } from '@/features/location/geo';
import type { Place } from './service';

/** Partial display data: never marked as a complete discovery response. */
export type PlaceSelectionSeed = { providerId: string; name?: string; coordinates?: Coordinate; capturedAt?: number };
export type MapSelectionInput = PlaceSelectionSeed & { principalId: string; language?: Language; updatedAt?: number; place?: Place };
export type MapSelectionIntent = MapSelectionInput & { createdAt: number };
const prefix = ['map-selection-intent'] as const;
const lifetime = 30_000;
let sequence = 0;
export function createMapSelectionIntent(client: QueryClient, input: MapSelectionInput): string {
  detailsRequestSchema.parse({ providerId: input.providerId, language: input.language ?? 'en' });
  if (input.coordinates && !isCoordinate(input.coordinates)) throw new Error('map.invalidSelection');
  client.removeQueries({ queryKey: prefix });
  client.setQueryDefaults(prefix, { gcTime: lifetime });
  const token = `${Date.now().toString(36)}-${(++sequence).toString(36)}`;
  client.setQueryData([...prefix, token], { ...input, createdAt: Date.now() });
  return token;
}
export function claimMapSelectionIntent(client: QueryClient, token: unknown, principalId: string): MapSelectionIntent | null {
  if (typeof token !== 'string' || !/^[a-z0-9]+-[a-z0-9]+$/.test(token) || token.length > 128) return null;
  const key = [...prefix, token];
  const value = client.getQueryData<MapSelectionIntent>(key);
  client.removeQueries({ queryKey: key, exact: true });
  if (!value || value.principalId !== principalId || Date.now() < value.createdAt || Date.now() - value.createdAt >= lifetime) return null;
  return value;
}
