import { ARRIVAL } from '@/config/limits';
import { distanceMeters, isCoordinate, type Coordinate } from '@/features/location/geo';
import type { FeaturedDestinationId } from './catalog';
import type { activationPolicy } from './ar-content';
export type WatcherSample = Readonly<{ position: Coordinate; accuracy: number | null; timestamp: number }>;
export type ArrivalInput = { running: boolean; watcherStatus: 'pending' | 'ready' | 'error'; sample: WatcherSample | null };
export type ArrivalSnapshot = Readonly<{
  destinationId: FeaturedDestinationId; eligible: boolean; showInvitation: boolean;
  status: 'unavailable' | 'uncertain' | 'distant' | 'approaching' | 'near' | 'checking' | 'eligible';
  milestone: 'approaching' | 'near' | 'arrived' | null;
}>;
type Run = { first: number; count: number };
/** Bounded foreground evidence only, no sensor history or provider work. */
export class DestinationProximity {
  private highWater = -Infinity;
  private previous: WatcherSample | null = null;
  private inside: Run | null = null;
  private outside: Run | null = null;
  private dismissed = false;
  private arrivedEpisode = false;
  private seen = new Set<string>();
  private value: ArrivalSnapshot;
  constructor(readonly destinationId: FeaturedDestinationId, private readonly policy: ReturnType<typeof activationPolicy>) {
    this.value = { destinationId, eligible: false, showInvitation: false, status: policy ? 'uncertain' : 'unavailable', milestone: null };
  }
  snapshot = () => this.value;
  dismiss() { this.dismissed = true; this.value = { ...this.value, showInvitation: false }; }
  private uncertain() {
    this.inside = null; this.outside = null;
    return this.value = { ...this.value, eligible: false, showInvitation: false, status: this.policy ? 'uncertain' : 'unavailable', milestone: null };
  }
  update(input: ArrivalInput, now: number): ArrivalSnapshot {
    const { sample } = input;
    const p = this.policy;
    if (!p || !isCoordinate(p.point) || !Number.isFinite(p.radiusMeters) || p.radiusMeters <= 0 || !input.running || input.watcherStatus !== 'ready' || !sample ||
      !Number.isFinite(now) || !Number.isFinite(sample.timestamp) || now - sample.timestamp > ARRIVAL.sampleMaxAgeMs ||
      sample.timestamp - now > ARRIVAL.futureToleranceMs || !isCoordinate(sample.position) || sample.accuracy === null ||
      !Number.isFinite(sample.accuracy) || sample.accuracy < 0 || sample.accuracy > ARRIVAL.maxAccuracyMeters) return this.uncertain();
    if (sample.timestamp < this.highWater) return this.uncertain();
    // A clock/React rerender can expire authority but cannot count a sensor reading twice.
    if (sample.timestamp === this.highWater) {
      const last = this.previous;
      return last && last.position.latitude === sample.position.latitude && last.position.longitude === sample.position.longitude && last.accuracy === sample.accuracy ? this.value : this.uncertain();
    }
    const previous = this.previous;
    this.highWater = sample.timestamp;
    this.previous = { ...sample, position: { ...sample.position } };
    if (previous && distanceMeters(previous.position, sample.position) > ARRIVAL.jumpAllowanceMeters +
      ARRIVAL.maxSpeedMetersPerSecond * (sample.timestamp - previous.timestamp) / 1000) return this.uncertain();
    const distance = distanceMeters(p.point, sample.position);
    const contained = distance + sample.accuracy <= p.radiusMeters;
    if (previous && sample.timestamp - previous.timestamp > ARRIVAL.sampleMaxAgeMs) { this.inside = null; this.outside = null; }
    this.inside = contained ? { first: this.inside?.first ?? sample.timestamp, count: (this.inside?.count ?? 0) + 1 } : null;
    const beyondExit = distance - sample.accuracy > p.radiusMeters + ARRIVAL.exitMarginMeters;
    this.outside = beyondExit ? { first: this.outside?.first ?? sample.timestamp, count: (this.outside?.count ?? 0) + 1 } : null;
    const corroborated = (run: Run | null) => !!run && run.count >= ARRIVAL.requiredSamples && sample.timestamp - run.first >= ARRIVAL.corroborationMs;
    if (this.arrivedEpisode && corroborated(this.outside)) { this.arrivedEpisode = false; this.dismissed = false; this.seen.clear(); this.outside = null; }
    const eligible = corroborated(this.inside);
    if (eligible) this.arrivedEpisode = true;
    const status = eligible ? 'eligible' : contained ? 'checking' : distance + sample.accuracy <= ARRIVAL.nearMeters ? 'near' : distance + sample.accuracy <= ARRIVAL.approachingMeters ? 'approaching' : 'distant';
    const milestone = eligible ? 'arrived' : distance + sample.accuracy <= ARRIVAL.nearMeters ? 'near' : distance + sample.accuracy <= ARRIVAL.approachingMeters ? 'approaching' : null;
    const event = milestone && !this.seen.has(milestone) ? milestone : null;
    if (milestone) this.seen.add(milestone);
    return this.value = { destinationId: this.destinationId, eligible, showInvitation: eligible && !this.dismissed, status, milestone: event };
  }
}
