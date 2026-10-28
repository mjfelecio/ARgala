import { ARRIVAL } from '@/config/limits';
import type { FeaturedDestinationId } from '@/features/destinations/catalog';
import type { SessionIdentity } from './session';
let sequence = 0;
type Validator = (destinationId: FeaturedDestinationId, principalId: string) => boolean;
type Intent = { destinationId: FeaturedDestinationId; principalId: string; createdAt: number; elapsedAt: number };
/** Route-scoped, ephemeral authority. No query-cache/URL value can manufacture entry. */
export class ArEntryIntents {
  private pending = new Map<string, Intent>();
  private epoch = 0;
  constructor(private readonly validate: Validator, private readonly elapsedNow = () => performance.now()) {}
  clear() { this.pending.clear(); this.epoch++; }
  create(destinationId: FeaturedDestinationId, principalId: string): string | null {
    if (!principalId || !this.validate(destinationId, principalId)) return null;
    this.clear();
    const createdAt = Date.now();
    const handle = `${createdAt.toString(36)}-${(++sequence).toString(36)}`;
    this.pending.set(handle, { destinationId, principalId, createdAt, elapsedAt: this.elapsedNow() });
    return handle;
  }
  claim(handle: unknown, destinationId: FeaturedDestinationId, principalId: string) {
    if (typeof handle !== 'string' || handle.length > 128) return null;
    const intent = this.pending.get(handle);
    this.pending.delete(handle);
    if (!intent || intent.destinationId !== destinationId || intent.principalId !== principalId) return null;
    const epoch = this.epoch;
    const age = Date.now() - intent.createdAt; const elapsed = this.elapsedNow() - intent.elapsedAt;
    if (!Number.isFinite(age) || !Number.isFinite(elapsed) || age < 0 || elapsed < 0 || Math.max(age, elapsed) >= ARRIVAL.entryLifetimeMs) return null;
    // Claim consumes the timed navigation handle. Pending startup/retry still
    // requires fresh selected/principal eligibility; it earns no live exemption.
    const authorizeMount = () => epoch === this.epoch && this.validate(destinationId, principalId);
    if (!authorizeMount()) return null;
    const identity: Readonly<SessionIdentity> = Object.freeze({ admissionId: handle, destinationId, principalId, provenance: 'verified' });
    return Object.freeze({ identity, authorizeMount });
  }
}
