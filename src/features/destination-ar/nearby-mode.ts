import { AR, ARRIVAL, DISCOVERY } from '@/config/limits';
import { isCoordinate, relativeHeading, type Coordinate } from '@/features/location/geo';
import type { WatcherSample } from '@/features/destinations/proximity';
import type { NearbySearch, Place } from '@/features/places/service';
import { captureBasis } from './scene-geometry';
import type { PoseSample } from './types';
export { layoutNearbyCards, type NearbyCard } from './nearby-card-layout';

export function nearbySearchOrigin(sample: WatcherSample | null, status: string, now: number): Coordinate | null {
  if (status !== 'ready' || !sample || !isCoordinate(sample.position) || !Number.isFinite(now) || !Number.isFinite(sample.timestamp) ||
      sample.timestamp - now > ARRIVAL.futureToleranceMs || now - sample.timestamp > AR.positionMaxAgeMs ||
      sample.accuracy === null || !Number.isFinite(sample.accuracy) || sample.accuracy < 0 || sample.accuracy > AR.maxPositionAccuracyMeters) return null;
  return sample.position;
}

export type NearbyHeadingStatus = 'weak' | 'ready' | 'unavailable' | 'no-reading';

type ScanScope = { location: Coordinate; language: NonNullable<NearbySearch['language']> };
type ScanResult = Readonly<{ id: number; places: Place[]; receivedAt: number; elapsedAt: number; language: ScanScope['language'] }>;
type ScanSnapshot = Readonly<{ result: ScanResult | null; busy: boolean; error: unknown; expired: boolean }>;
const initialScan: ScanSnapshot = { result: null, busy: false, error: null, expired: false };

/** One session's explicit scans. Late completions cannot publish into a retired mode. */
export class NearbyScan {
  private snapshot = initialScan;
  private generation = 0;
  private listeners = new Set<() => void>();
  constructor(private readonly search: (request: NearbySearch) => Promise<Place[]>, private readonly now = Date.now,
    private readonly elapsed = () => performance.now()) {}

  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };

  private publish(next: ScanSnapshot) {
    this.snapshot = next;
    this.listeners.forEach(listener => listener());
  }

  retire(clear = false) {
    this.generation++;
    if (clear) this.publish(initialScan);
    else if (this.snapshot.busy) this.publish({ ...this.snapshot, busy: false });
  }

  remaining(result: ScanResult) {
    const wall = this.now() - result.receivedAt;
    const elapsed = this.elapsed() - result.elapsedAt;
    if (!Number.isFinite(wall) || !Number.isFinite(elapsed) || wall < 0 || elapsed < 0) return 0;
    return Math.max(0, AR.nearbyReuseMs - Math.max(wall, elapsed));
  }

  expire() {
    if (this.snapshot.result && this.remaining(this.snapshot.result) === 0) {
      this.publish({ ...this.snapshot, result: null, expired: true });
    }
  }

  async scan({ location, language }: ScanScope) {
    if (this.snapshot.busy || !isCoordinate(location)) return;
    const id = ++this.generation;
    this.publish({ ...this.snapshot, busy: true, error: null });
    try {
      const places = await this.search({ center: { ...location }, language, radiusMeters: DISCOVERY.radiusMeters });
      if (id !== this.generation) return;
      const distinct = new Map(places.map(place => [place.providerId, place]));
      const result = { id, places: [...distinct.values()].slice(0, DISCOVERY.maxResults), receivedAt: this.now(), elapsedAt: this.elapsed(), language };
      this.publish({ result, busy: false, error: null, expired: false });
    } catch (error) {
      if (id === this.generation) this.publish({ ...this.snapshot, busy: false, error });
    }
  }
}

// Offset from true north to the current Viro frame's horizontal azimuth.
export function matchCameraHeading(pose: PoseSample, trueHeading: number) {
  if (!Number.isFinite(trueHeading) || trueHeading < 0 || trueHeading >= 360) return null;
  const basis = captureBasis(pose);
  return basis ? relativeHeading(-basis.yaw, trueHeading) : null;
}

/** Viro and Android deliver different streams. Establish north only after
 * consistent pairs while the camera is nearly still, then accept small corrections. */
export class CameraNorthAlignment {
  private current: { offset: number; at: number } | null = null;
  private candidate: { offset: number; heading: number; first: number; last: number; count: number } | null = null;

  reset() {
    this.current = null;
    this.candidate = null;
  }

  get(now: number) {
    const current = this.current;
    return current && now >= current.at && now - current.at < 1200 ? current.offset : null;
  }

  observe(offset: number, heading: number, now: number) {
    if (![offset, heading, now].every(Number.isFinite)) return null;
    const stable = this.get(now);
    const correction = stable === null ? null : relativeHeading(offset, stable);
    if (stable !== null && correction !== null && Math.abs(correction) <= 15) {
      const adjusted = relativeHeading(stable + correction * 0.18, 0);
      this.current = { offset: adjusted, at: now };
      return adjusted;
    }
    this.current = null;

    const candidate = this.candidate;
    if (!candidate || now <= candidate.last || now - candidate.last > 400 ||
        Math.abs(relativeHeading(offset, candidate.offset)) > 8 || Math.abs(relativeHeading(heading, candidate.heading)) > 8) {
      this.candidate = { offset, heading, first: now, last: now, count: 1 };
      return null;
    }
    candidate.last = now;
    if (++candidate.count < 3 || now - candidate.first < 150) return null;
    this.candidate = null;
    this.current = { offset, at: now };
    return offset;
  }
}
