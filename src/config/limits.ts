/** Distances are meters. Discovery and AR activation are independent settings. */
export const DISCOVERY = { radiusMeters: 1000, maxRadiusMeters: 5000, maxResults: 20 } as const;
export const ACTIVATION = { defaultMeters: 100, minMeters: 10, maxMeters: 1000 } as const;
export const LOCATION = { distanceIntervalMeters: 5, timeIntervalMs: 3000, timeoutMs: 15000 } as const;
