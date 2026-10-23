import { normalizeHeading, relativeHeading } from '@/features/location/geo';

const stopDegrees = 10;
const holdThresholdDegrees = 8;

/** Display-only stops; raw heading still drives projection and sensor validity. */
export function headingReadout(previous: number | null, raw: number | null): number | null {
  if (raw === null || !Number.isFinite(raw) || raw < 0 || raw > 360) return null;

  const heading = normalizeHeading(raw);
  if (previous !== null && Number.isFinite(previous) && previous >= 0 && previous <= 360 && previous % stopDegrees === 0) {
    const prior = normalizeHeading(previous);
    if (Math.abs(relativeHeading(heading, prior)) <= holdThresholdDegrees) return prior;
  }

  return (Math.round(heading / stopDegrees) * stopDegrees) % 360;
}
