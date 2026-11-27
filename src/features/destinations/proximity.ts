import { ARRIVAL } from '@/config/limits';
import { distanceMeters, isCoordinate, type Coordinate } from '@/features/location/geo';
import type { FeaturedDestinationId } from './catalog';
import type { ActivationPolicy } from './ar-content';
import { geofenceProximity } from './ar-geofences';
export type WatcherSample = Readonly<{ position: Coordinate; accuracy: number | null; timestamp: number }>;
export type ArrivalInput = { running: boolean; watcherStatus: 'pending' | 'ready' | 'error'; sample: WatcherSample | null };
export type ArrivalSnapshot = Readonly<{
  destinationId: FeaturedDestinationId; eligible: boolean; showInvitation: boolean;
  status: 'unavailable' | 'uncertain' | 'distant' | 'approaching' | 'near' | 'checking' | 'eligible';
  milestone: 'approaching' | 'near' | 'arrived' | null;
}>;
type ArrivalDecision = 'no-policy' | 'inactive' | 'watcher-pending' | 'watcher-error' | 'no-fix' |
  'invalid-time' | 'stale-fix' | 'future-fix' | 'invalid-position' | 'accuracy' | 'older-fix' |
  'conflicting-fix' | 'jump' | 'sample-gap' | 'outside' | 'corroborating' | 'eligible';
export type ArrivalEvidence = Readonly<{
  decision: ArrivalDecision; repeated: boolean; contained: boolean | null; boundaryMeters: number | null;
  count: number; spanMs: number; watcherStatus: ArrivalInput['watcherStatus'];
  accuracy: number | null; ageMs: number | null;
}>;
type Run = { first: number; count: number };
export type ArrivalEpisode = { active: boolean; unlockShown: boolean };
/** Bounded foreground evidence only, no sensor history or provider work. */
export class DestinationProximity {
  private highWater = -Infinity;
  private previous: WatcherSample | null = null;
  private inside: Run | null = null;
  private outside: Run | null = null;
  private dismissed = false;
  private seen = new Set<string>();
  private value: ArrivalSnapshot;
  private observation: Pick<ArrivalEvidence, 'decision' | 'repeated' | 'contained' | 'boundaryMeters'> =
    { decision: 'inactive', repeated: false, contained: null, boundaryMeters: null };
  private readonly policy: ActivationPolicy | null;
  constructor(readonly destinationId: FeaturedDestinationId, policy: ActivationPolicy | null,
    private readonly episode: ArrivalEpisode = { active: false, unlockShown: false }, private readonly inspect = false) {
    this.policy = policy && ('geometry' in policy
      ? destinationId !== 'pilot-aclc'
      : destinationId === 'pilot-aclc' && isCoordinate(policy.point) && Number.isFinite(policy.radiusMeters) && policy.radiusMeters > 0)
      ? policy : null;
    this.value = { destinationId, eligible: false, showInvitation: false, status: this.policy ? 'uncertain' : 'unavailable', milestone: null };
  }
  snapshot = () => this.value;
  evidence(input: ArrivalInput, now: number): ArrivalEvidence | null {
    if (!this.inspect) return null;
    const age = now - (input.sample?.timestamp ?? NaN);
    return { ...this.observation, count: this.inside?.count ?? 0,
      spanMs: this.inside && this.previous ? this.previous.timestamp - this.inside.first : 0,
      watcherStatus: input.watcherStatus, accuracy: input.sample?.accuracy ?? null,
      ageMs: Number.isFinite(age) ? age : null };
  }
  claimUnlock() {
    if (!this.value.eligible || this.episode.unlockShown) return false;
    this.episode.unlockShown = true;
    return true;
  }
  dismiss() { this.dismissed = true; this.value = { ...this.value, showInvitation: false }; }
  private uncertain(decision: ArrivalDecision) {
    if (this.inspect) this.observation = { decision, repeated: false, contained: null, boundaryMeters: null };
    this.inside = null; this.outside = null;
    const status = this.policy ? 'uncertain' : 'unavailable';
    if (this.value.status !== status) this.value = { ...this.value, eligible: false, showInvitation: false, status, milestone: null };
    return this.value;
  }
  update(input: ArrivalInput, now: number): ArrivalSnapshot {
    const { sample } = input;
    const p = this.policy;
    if (!p) return this.uncertain('no-policy');
    if (!input.running) return this.uncertain('inactive');
    if (input.watcherStatus !== 'ready') return this.uncertain(input.watcherStatus === 'pending' ? 'watcher-pending' : 'watcher-error');
    if (!sample) return this.uncertain('no-fix');
    if (!Number.isFinite(now) || !Number.isFinite(sample.timestamp)) return this.uncertain('invalid-time');
    if (now - sample.timestamp > ARRIVAL.sampleMaxAgeMs) return this.uncertain('stale-fix');
    if (sample.timestamp - now > ARRIVAL.futureToleranceMs) return this.uncertain('future-fix');
    if (!isCoordinate(sample.position)) return this.uncertain('invalid-position');
    if (sample.accuracy === null || !Number.isFinite(sample.accuracy) || sample.accuracy < 0 ||
        sample.accuracy > ARRIVAL.maxAccuracyMeters) return this.uncertain('accuracy');
    if (sample.timestamp < this.highWater) return this.uncertain('older-fix');
    // A clock/React rerender can expire authority but cannot count a sensor reading twice.
    if (sample.timestamp === this.highWater) {
      const last = this.previous;
      if (!last || last.position.latitude !== sample.position.latitude || last.position.longitude !== sample.position.longitude ||
          last.accuracy !== sample.accuracy) return this.uncertain('conflicting-fix');
      if (this.inspect && !this.observation.repeated) this.observation = { ...this.observation, repeated: true };
      return this.value;
    }
    const previous = this.previous;
    this.highWater = sample.timestamp;
    this.previous = { ...sample, position: { ...sample.position } };
    if (previous && distanceMeters(previous.position, sample.position) > ARRIVAL.jumpAllowanceMeters +
      ARRIVAL.maxSpeedMetersPerSecond * (sample.timestamp - previous.timestamp) / 1000) return this.uncertain('jump');
    // Use the raw reported fix for containment. Accuracy bounds unusable fixes
    // and establishes conservative margins for the approach and exit signals.
    const area = 'geometry' in p ? geofenceProximity(p, sample.position) : null;
    const centerDistance = 'point' in p ? distanceMeters(p.point, sample.position) : 0;
    const radius = 'radiusMeters' in p ? p.radiusMeters : 0;
    const contained = area?.contained ?? (centerDistance <= radius);
    const approachDistance = area ? contained ? 0 : area.boundaryMeters : centerDistance;
    const beyondExit = !contained && (area?.boundaryMeters ?? centerDistance - radius) - sample.accuracy > ARRIVAL.exitMarginMeters;
    const gap = previous !== null && sample.timestamp - previous.timestamp > ARRIVAL.sampleMaxAgeMs;
    if (gap) { this.inside = null; this.outside = null; }
    this.inside = contained ? { first: this.inside?.first ?? sample.timestamp, count: (this.inside?.count ?? 0) + 1 } : null;
    this.outside = beyondExit ? { first: this.outside?.first ?? sample.timestamp, count: (this.outside?.count ?? 0) + 1 } : null;
    const corroborated = (run: Run | null) => !!run && run.count >= ARRIVAL.requiredSamples && sample.timestamp - run.first >= ARRIVAL.corroborationMs;
    if (this.episode.active && corroborated(this.outside)) {
      this.episode.active = false; this.episode.unlockShown = false; this.dismissed = false;
      this.seen.clear(); this.outside = null;
    }
    const eligible = corroborated(this.inside);
    if (this.inspect) this.observation = { decision: eligible ? 'eligible' : contained ? gap ? 'sample-gap' : 'corroborating' : 'outside',
      repeated: false, contained, boundaryMeters: area?.boundaryMeters ?? Math.abs(centerDistance - radius) };
    if (eligible) this.episode.active = true;
    const near = approachDistance + sample.accuracy <= ARRIVAL.nearMeters;
    const approaching = approachDistance + sample.accuracy <= ARRIVAL.approachingMeters;
    const status = eligible ? 'eligible' : contained ? 'checking' : near ? 'near' : approaching ? 'approaching' : 'distant';
    const milestone = eligible ? 'arrived' : near ? 'near' : approaching ? 'approaching' : null;
    const event = milestone && !this.seen.has(milestone) ? milestone : null;
    if (milestone) this.seen.add(milestone);
    return this.value = { destinationId: this.destinationId, eligible, showInvitation: eligible && !this.dismissed, status, milestone: event };
  }
}
