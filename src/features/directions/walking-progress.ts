import { lineString } from '@turf/helpers';
import { length } from '@turf/length';
import { nearestPointOnLine } from '@turf/nearest-point-on-line';
import { lineSliceAlong } from '@turf/line-slice-along';
import { distanceMeters, isCoordinate, type Coordinate } from '@/features/location/geo';

/** Walking progress thresholds are deliberately stricter than preview acquisition. */
export const WALKING = { maxAccuracyMeters: 25, maxAgeMs: 10000, maxSpeedMetersPerSecond: 3,
  maxAlongStepMeters: 75, arrivalMeters: 15, arrivalMaxAccuracyMeters: 10 } as const;
const units = { units: 'meters' } as const;
type Line = ReturnType<typeof lineString>;
type Segment = { line: Line; start: Coordinate; meters: number; offset: number };
export type WalkingRouteGeometry = { coordinates: Coordinate[]; destination: Coordinate; line: Line; segments: Segment[]; totalMeters: number };
export type WalkingSample = { position: Coordinate | null; accuracy: number | null; timestamp: number | null; watcherTimestamp: number | null; ready: boolean };
type Fix = { position: Coordinate; accuracy: number; timestamp: number };
export type WalkingProgress = {
  status: 'navigating' | 'uncertain' | 'off-route' | 'arrived';
  progressMeters: number; matchedMeters: number | null; matchedAt: number | null; lastFix: Fix | null;
  lastSampleTime: number | null; pendingAdvance: number | null; acquisitionCount: number; offRouteCount: number; arrivalCount: number;
};

export function prepareWalkingRoute(coordinates: Coordinate[], destination: Coordinate | undefined): WalkingRouteGeometry | null {
  if (coordinates.length < 2 || !destination || !isCoordinate(destination) || !coordinates.every(isCoordinate)) return null;
  const copy = coordinates.map(coordinate => ({ ...coordinate }));
  const line = lineString(copy.map(({ longitude, latitude }) => [longitude, latitude]));
  const totalMeters = length(line, units);
  if (!Number.isFinite(totalMeters) || totalMeters < 1) return null;
  let offset = 0;
  const segments: Segment[] = [];
  for (let index = 1; index < copy.length; index++) {
    const start = copy[index - 1]; const end = copy[index]; const meters = distanceMeters(start, end);
    if (meters > .001) segments.push({ line: lineString([[start.longitude, start.latitude], [end.longitude, end.latitude]]), start, meters, offset });
    offset += meters;
  }
  return { coordinates: copy, destination: { ...destination }, line, segments, totalMeters };
}
export function createWalkingProgress(): WalkingProgress {
  return { status: 'uncertain', progressMeters: 0, matchedMeters: null, matchedAt: null, lastFix: null, lastSampleTime: null, pendingAdvance: null, acquisitionCount: 0, offRouteCount: 0, arrivalCount: 0 };
}
export function interruptWalkingProgress(previous: WalkingProgress): WalkingProgress {
  if (previous.status === 'arrived') return previous;
  if (previous.status === 'uncertain' && !previous.lastFix && previous.acquisitionCount === 0 && previous.offRouteCount === 0 && previous.arrivalCount === 0 && previous.pendingAdvance === null) return previous;
  return { ...previous, status: 'uncertain', lastFix: null, pendingAdvance: null, acquisitionCount: 0, offRouteCount: 0, arrivalCount: 0 };
}
export function usableWalkingSample(sample: WalkingSample, now: number): boolean {
  const { accuracy, timestamp, watcherTimestamp } = sample;
  return sample.ready && isCoordinate(sample.position) && accuracy !== null && Number.isFinite(accuracy) && accuracy >= 0 && accuracy <= WALKING.maxAccuracyMeters &&
    timestamp !== null && watcherTimestamp === timestamp && Number.isFinite(timestamp) && timestamp <= now + 1000 && now - timestamp <= WALKING.maxAgeMs;
}

/** No native APIs, query state or display-smoothed coordinates are used here. */
export function advanceWalkingProgress(route: WalkingRouteGeometry, previous: WalkingProgress, sample: WalkingSample, now: number): WalkingProgress {
  if (previous.status === 'arrived') return previous;
  if (!usableWalkingSample(sample, now)) return interruptWalkingProgress(previous);
  const timestamp = sample.timestamp!;
  if (previous.lastSampleTime !== null && timestamp <= previous.lastSampleTime) return previous;
  // Corroboration requires time-separated native samples, not a burst or a render clock.
  if (previous.lastSampleTime !== null && timestamp - previous.lastSampleTime < 1000) return previous;
  const fix: Fix = { position: { ...sample.position! }, accuracy: sample.accuracy!, timestamp };
  const next = { ...previous, lastSampleTime: timestamp };
  if (previous.lastFix) {
    const elapsed = (timestamp - previous.lastFix.timestamp) / 1000;
    const allowed = elapsed * WALKING.maxSpeedMetersPerSecond + Math.max(6, previous.lastFix.accuracy + fix.accuracy);
    if (distanceMeters(previous.lastFix.position, fix.position) > allowed) {
      return { ...next, status: 'uncertain', pendingAdvance: null, acquisitionCount: 0, arrivalCount: 0, offRouteCount: 0 };
    }
  }
  const corridor = Math.max(20, fix.accuracy * 1.5);
  const candidates: { along: number; distance: number }[] = [];
  for (const segment of route.segments) {
    // Triangle inequality cheaply skips distant segments before Turf projection.
    if (distanceMeters(segment.start, fix.position) > segment.meters + corridor + 10) continue;
    const projected = nearestPointOnLine(segment.line, [fix.position.longitude, fix.position.latitude], units);
    candidates.push({ along: segment.offset + projected.properties.totalDistance, distance: projected.properties.pointDistance });
  }
  candidates.sort((a, b) => a.distance - b.distance);
  const best = candidates[0];
  if (!best || best.distance > corridor) {
    const offRouteCount = previous.offRouteCount + 1;
    return { ...next, lastFix: fix, status: offRouteCount >= 3 ? 'off-route' : 'uncertain', offRouteCount, pendingAdvance: null, acquisitionCount: 0, arrivalCount: 0 };
  }
  const ambiguous = candidates.some(candidate => Math.abs(candidate.along - best.along) > 35 && candidate.distance <= best.distance + Math.max(3, fix.accuracy / 2));
  const arcBudget = previous.matchedAt === null ? WALKING.maxAlongStepMeters : Math.min(WALKING.maxAlongStepMeters,
    (timestamp - previous.matchedAt) / 1000 * WALKING.maxSpeedMetersPerSecond + Math.max(6, (previous.lastFix?.accuracy ?? fix.accuracy) + fix.accuracy));
  const excessiveArcStep = previous.matchedMeters !== null && Math.abs(best.along - previous.matchedMeters) > arcBudget;
  if (ambiguous || excessiveArcStep) return { ...next, status: 'uncertain', pendingAdvance: null, acquisitionCount: 0, offRouteCount: 0, arrivalCount: 0 };
  // Accuracy permits uncertainty; it is not evidence that a sudden forward jump is real.
  // Keep the trusted anchor until a second compatible reading corroborates a fast jump.
  const uncorroboratedBudget = previous.matchedAt === null ? Infinity : (timestamp - previous.matchedAt) / 1000 * WALKING.maxSpeedMetersPerSecond + 6;
  const suspiciousAdvance = previous.matchedMeters !== null && best.along - previous.matchedMeters > uncorroboratedBudget;
  const corroboratedAdvance = previous.pendingAdvance !== null && Math.abs(best.along - previous.pendingAdvance) <= Math.max(6, fix.accuracy / 2);
  if (suspiciousAdvance && !corroboratedAdvance) return { ...next, status: 'uncertain', pendingAdvance: best.along, offRouteCount: 0, arrivalCount: 0 };
  const acquisitionCount = previous.acquisitionCount + 1;
  const acquired = acquisitionCount >= 2;
  const deadband = Math.max(6, fix.accuracy);
  const progressMeters = acquired && best.along - previous.progressMeters >= deadband ? Math.min(route.totalMeters, best.along) : previous.progressMeters;
  const nearDestination = acquired && fix.accuracy <= WALKING.arrivalMaxAccuracyMeters && distanceMeters(fix.position, route.destination) <= WALKING.arrivalMeters && route.totalMeters - best.along <= WALKING.arrivalMeters;
  const arrivalCount = nearDestination ? previous.arrivalCount + 1 : 0;
  return { ...next, lastFix: fix, matchedMeters: best.along, matchedAt: timestamp, pendingAdvance: null, acquisitionCount, offRouteCount: 0, arrivalCount,
    progressMeters, status: arrivalCount >= 2 ? 'arrived' : acquired ? 'navigating' : 'uncertain' };
}
export function remainingWalkingCoordinates(route: WalkingRouteGeometry, progress: Pick<WalkingProgress, 'status' | 'progressMeters'>): Coordinate[] {
  if (progress.status === 'arrived') return [];
  if (progress.progressMeters <= 0) return route.coordinates;
  return lineSliceAlong(route.line, Math.min(progress.progressMeters, route.totalMeters - .001), route.totalMeters, units).geometry.coordinates.map(([longitude, latitude]) => ({ longitude, latitude }));
}
