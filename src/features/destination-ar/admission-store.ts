import { ARRIVAL } from '@/config/limits';
import { activationPolicy, approvedArContent } from '@/features/destinations/ar-content';
import { destinationSchema, getDestination, type Destination, type FeaturedDestinationId } from '@/features/destinations/catalog';
import { DestinationProximity, type ArrivalInput, type ArrivalSnapshot } from '@/features/destinations/proximity';
import type { Language } from '../../../supabase/functions/_shared/contracts';
import { ArEntryIntents } from './entry-intent';
import { isViroSpikeEnabled } from './dev-guard';
import type { SessionIdentity } from './session';
export type PreparedArEntry = Readonly<{ identity: SessionIdentity; destination: Destination; kind: 'approved' | 'draft'; simulated: boolean; language: Language; authorizeMount(): boolean }>;
type Transfer = { entry: PreparedArEntry; createdAt: number; elapsedAt: number };
const inactive: ArrivalInput = { running: false, watcherStatus: 'pending', sample: null };

/** One principal and selected destination; never a persisted unlock or a native/GPS owner. */
export class ArAdmissionStore {
  private selected: FeaturedDestinationId | null = null;
  private model: DestinationProximity | null = null;
  private input: ArrivalInput = inactive;
  private lease = 0;
  private retainEpoch = 0;
  private closed = false;
  private arrival: ArrivalSnapshot | null = null;
  private listeners = new Set<() => void>();
  private transfers = new Map<string, Transfer>();
  private issued: string | null = null;
  private intents: ArEntryIntents;
  private simulatedIntents: ArEntryIntents;
  private simulationActive = false;
  constructor(readonly principalId: string) {
    this.intents = new ArEntryIntents((id, principal) => !this.closed && principal === this.principalId && id === this.selected && this.tick()?.eligible === true);
    this.simulatedIntents = new ArEntryIntents((id, principal) => !this.closed && this.simulationActive && isViroSpikeEnabled() && principal === this.principalId && id === this.selected);
  }
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => this.listeners.delete(listener); };
  getSnapshot = () => this.arrival;
  currentLease = () => this.lease;
  selectedId = () => this.selected;
  private emit() {
    const next = this.model?.snapshot() ?? null;
    if (next === this.arrival) return;
    this.arrival = next; this.listeners.forEach(listener => listener());
  }
  /** Strict effect replay cancels only the provisional root disposal. Source leases retire immediately. */
  retain() {
    const epoch = ++this.retainEpoch;
    return () => { void Promise.resolve().then(() => { if (epoch === this.retainEpoch) this.close(); }); };
  }
  select(id: FeaturedDestinationId | null) {
    if (this.closed || this.selected === id) return;
    this.endEntry(); this.lease++; this.input = inactive; this.selected = id;
    this.model = id ? new DestinationProximity(id, activationPolicy(getDestination(id))) : null;
    this.emit();
  }
  acquire(id: FeaturedDestinationId): number | null {
    if (this.closed || this.selected !== id) return null;
    this.lease++; this.input = inactive; this.tick(); return this.lease;
  }
  publish(lease: number, input: ArrivalInput) {
    if (this.closed || lease !== this.lease) return;
    this.input = input; this.tick();
  }
  release(lease: number) {
    if (lease !== this.lease) return;
    this.lease++; this.input = inactive; this.tick();
  }
  tick() {
    if (this.closed) return null;
    this.model?.update(this.input, Date.now()); this.emit(); return this.arrival;
  }
  begin(lease: number, id: FeaturedDestinationId, kind: 'approved' | 'draft', language: Language): string | null {
    return this.issue(lease, id, kind, language, false);
  }
  beginSimulation(lease: number, id: FeaturedDestinationId, kind: 'approved' | 'draft', language: Language): string | null {
    if (!isViroSpikeEnabled()) return null;
    return this.issue(lease, id, kind, language, true);
  }
  private issue(lease: number, id: FeaturedDestinationId, kind: 'approved' | 'draft', language: Language, simulated: boolean): string | null {
    if (this.closed || lease !== this.lease || id !== this.selected || !this.input.running) return null;
    if (kind === 'draft' && !isViroSpikeEnabled()) return null;
    const destination = getDestination(id);
    if (!destination || kind === 'approved' && !approvedArContent(destination, language).length) return null;
    this.endEntry(); this.simulationActive = simulated;
    const intents = simulated ? this.simulatedIntents : this.intents;
    const handle = intents.create(id, this.principalId);
    if (!handle) return null;
    const claimed = intents.claim(handle, id, this.principalId);
    if (!claimed) return null;
    const identity: SessionIdentity = { ...claimed.identity, provenance: kind === 'draft' || simulated ? 'development' : 'verified' };
    const entry = Object.freeze({ identity: Object.freeze(identity), destination: destinationSchema.parse(destination), kind, simulated, language,
      authorizeMount: () => (kind !== 'draft' && !simulated || isViroSpikeEnabled()) && claimed.authorizeMount() });
    this.transfers.clear(); this.issued = handle;
    this.transfers.set(handle, { entry, createdAt: Date.now(), elapsedAt: performance.now() });
    return handle;
  }
  /** Geographic claim happened in the foreground launch action. Consume its route transfer once. */
  take(handle: unknown, id: FeaturedDestinationId): PreparedArEntry | null {
    if (this.closed || typeof handle !== 'string') return null;
    const transfer = this.transfers.get(handle); this.transfers.delete(handle);
    if (!transfer || transfer.entry.identity.destinationId !== id || this.selected !== id || this.issued !== handle) return null;
    const wall = Date.now() - transfer.createdAt; const elapsed = performance.now() - transfer.elapsedAt;
    if (!Number.isFinite(wall) || !Number.isFinite(elapsed) || wall < 0 || elapsed < 0 || Math.max(wall, elapsed) >= ARRIVAL.entryLifetimeMs) return null;
    if (transfer.entry.identity.provenance === 'development' && !isViroSpikeEnabled()) return null;
    return transfer.entry;
  }
  endEntry(id?: string) {
    if (id && this.issued !== id) return;
    this.intents.clear(); this.simulatedIntents.clear(); this.simulationActive = false; this.transfers.clear(); this.issued = null;
  }
  close() {
    this.endEntry(); this.closed = true; this.lease++; this.input = inactive; this.selected = null; this.model = null; this.emit();
  }
}
