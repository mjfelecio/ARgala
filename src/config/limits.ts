import { DISCOVERY_LIMITS } from '../../supabase/functions/_shared/contracts';
/** Distances are meters. Discovery and AR activation are independent settings. */
export const DISCOVERY = { radiusMeters: 1000, ...DISCOVERY_LIMITS } as const;
export const ACTIVATION = { defaultMeters: 100, minMeters: 10, maxMeters: 1000 } as const;
export const LOCATION = { distanceIntervalMeters: 5, timeIntervalMs: 3000, timeoutMs: 15000 } as const;
