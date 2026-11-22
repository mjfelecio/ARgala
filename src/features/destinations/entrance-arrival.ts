import { ARRIVAL, ENTRANCE_ARRIVAL } from '@/config/limits';
import { distanceMeters, isCoordinate, type Coordinate } from '@/features/location/geo';
import type { Destination, DestinationId } from './catalog';
import type { ArrivalInput, WatcherSample } from './proximity';

type EntranceTarget = Readonly<{ id: DestinationId; point: Coordinate }>;
type EntranceEpisode = { enabled: boolean; notified: boolean };
type EntranceStatus = 'uncertain' | 'distance' | 'checking' | 'reached';

export type EntranceSnapshot = Readonly<{
  owner: symbol;
  destinationId: DestinationId;
  status: EntranceStatus;
  distanceMeters: number | null;
  enabled: boolean;
  showNotice: boolean;
}>;

type EntranceSource = {
  owner: symbol;
  lease: number;
  since: number;
  target: EntranceTarget;
  episode: EntranceEpisode;
  input: ArrivalInput | null;
  last: WatcherSample | null;
  approachSince: number | null;
  exitSince: number | null;
};

export function entranceTarget(destination: Destination | null): EntranceTarget | null {
  if (!destination || destination.id === 'pilot-aclc' || !destination.routeEntranceApprovalReference?.trim() ||
    !isCoordinate(destination.routeEntrance)) return null;
  return { id: destination.id, point: destination.routeEntrance };
}

/** Principal-local notice consent and deduplication. Only the active foreground lease holds a fix. */
export class EntranceArrivalStore {
  private sequence = 0;
  private source: EntranceSource | null = null;
  private readonly episodes = new Map<DestinationId, EntranceEpisode>();
  private value: EntranceSnapshot | null = null;
  private readonly listeners = new Set<() => void>();

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };
  getSnapshot = () => this.value;

  acquire(target: EntranceTarget, now = Date.now(), owner = Symbol()): number {
    const episode = this.episodes.get(target.id) ?? { enabled: false, notified: false };
    this.episodes.set(target.id, episode);
    const lease = ++this.sequence;
    this.source = { owner, lease, since: now, target, episode, input: null, last: null, approachSince: null, exitSince: null };
    this.updateSnapshot(this.source, 'uncertain', null);
    return lease;
  }

  release(lease: number) {
    if (this.source?.lease !== lease) return;
    this.source = null;
    this.emit(null);
  }

  publish(lease: number, input: ArrivalInput, now = Date.now()) {
    if (this.source?.lease !== lease) return;
    this.source.input = input;
    this.tick(lease, now);
  }

  tick(lease: number, now = Date.now()) {
    const source = this.source;
    if (source?.lease !== lease) return;
    const sample = source.input?.sample;
    if (!source.input?.running || source.input.watcherStatus !== 'ready' || !sample ||
        !Number.isFinite(now) || !Number.isFinite(sample.timestamp) || sample.timestamp < source.since ||
        now - sample.timestamp > ARRIVAL.sampleMaxAgeMs || sample.timestamp - now > ARRIVAL.futureToleranceMs ||
        !isCoordinate(sample.position) || sample.accuracy === null || !Number.isFinite(sample.accuracy) ||
        sample.accuracy < 0 || sample.accuracy > ENTRANCE_ARRIVAL.maxAccuracyMeters) {
      this.uncertain(source);
      return;
    }
    const previous = source.last;
    if (previous && sample.timestamp <= previous.timestamp) {
      if (sample.timestamp < previous.timestamp || sample.accuracy !== previous.accuracy ||
          sample.position.latitude !== previous.position.latitude || sample.position.longitude !== previous.position.longitude) this.uncertain(source);
      return;
    }
    source.last = sample;
    if (previous) {
      const elapsed = sample.timestamp - previous.timestamp;
      if (distanceMeters(sample.position, previous.position) > ARRIVAL.jumpAllowanceMeters + ARRIVAL.maxSpeedMetersPerSecond * elapsed / 1000) {
        this.uncertain(source);
        return;
      }
      if (elapsed > ARRIVAL.sampleMaxAgeMs) {
        source.approachSince = null;
        source.exitSince = null;
      }
    }
    const distance = distanceMeters(sample.position, source.target.point);
    const within = distance <= ENTRANCE_ARRIVAL.radiusMeters;
    const beyond = distance - sample.accuracy >= ENTRANCE_ARRIVAL.exitMeters;
    source.approachSince = within ? source.approachSince ?? sample.timestamp : null;
    source.exitSince = beyond ? source.exitSince ?? sample.timestamp : null;
    if (source.exitSince !== null && sample.timestamp - source.exitSince >= ARRIVAL.corroborationMs) source.episode.notified = false;
    const reached = source.approachSince !== null && sample.timestamp - source.approachSince >= ARRIVAL.corroborationMs;
    this.updateSnapshot(source, reached ? 'reached' : within ? 'checking' : 'distance', Math.round(distance));
  }

  setEnabled(lease: number, enabled: boolean, now = Date.now()) {
    const source = this.source;
    if (source?.lease !== lease) return;
    source.episode.enabled = enabled;
    this.tick(lease, now);
    if (this.value) this.updateSnapshot(source, this.value.status, this.value.distanceMeters);
  }

  dismiss(lease: number) {
    if (this.source?.lease === lease && this.value?.showNotice) this.emit({ ...this.value, showNotice: false });
  }

  private uncertain(source: EntranceSource) {
    source.approachSince = null;
    source.exitSince = null;
    this.updateSnapshot(source, 'uncertain', null);
  }

  private updateSnapshot(source: EntranceSource, status: EntranceStatus, meters: number | null) {
    const { enabled, notified } = source.episode;
    const newNotice = status === 'reached' && enabled && !notified;
    const showNotice = status === 'reached' && enabled && (newNotice || this.value?.showNotice === true);
    if (newNotice) source.episode.notified = true;
    const previous = this.value;
    if (previous?.owner === source.owner && previous.status === status && previous.distanceMeters === meters &&
        previous.enabled === enabled && previous.showNotice === showNotice) return;
    this.emit({ owner: source.owner, destinationId: source.target.id, status, distanceMeters: meters, enabled, showNotice });
  }

  private emit(next: EntranceSnapshot | null) {
    this.value = next;
    this.listeners.forEach(listener => listener());
  }
}
