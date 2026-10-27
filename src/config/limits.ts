import { DISCOVERY_LIMITS } from '../../supabase/functions/_shared/contracts';
/** Distances are meters. Discovery and AR activation are independent settings. */
export const DISCOVERY = { radiusMeters: 1000, ...DISCOVERY_LIMITS } as const;
/** Curated destination centers, independent from user discovery and local AR activation. */
export const DESTINATIONS = { nearbyRadiusMeters: 500 } as const;
export const ACTIVATION = { defaultMeters: 100, minMeters: 10, maxMeters: 1000 } as const;
export const LOCATION = { distanceIntervalMeters: 5, timeIntervalMs: 3000, timeoutMs: 15000 } as const;
/** Approximate portrait projection, not physical camera calibration. */
export const AR = { horizontalFovDegrees: 60, maxLabels: 3, labelWidth: 168, richLabelWidth: 232, labelGap: 8,
  positionMaxAgeMs: 30000, headingMaxAgeMs: 10000, maxPositionAccuracyMeters: 100,
  nearbyReuseMs: 120000, nearbyReuseDistanceMeters: 100 } as const;
/** Provisional arrival calibration. Field measurements must validate these hypotheses. */
export const ARRIVAL = { sampleMaxAgeMs: 10000, futureToleranceMs: 1000, maxAccuracyMeters: 20,
  requiredSamples: 3, corroborationMs: 6000, exitMarginMeters: 10,
  approachingMeters: 500, nearMeters: 150, maxSpeedMetersPerSecond: 12, jumpAllowanceMeters: 30,
  entryLifetimeMs: 30000 } as const;
