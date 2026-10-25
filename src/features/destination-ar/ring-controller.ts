import { buildRingSlots, captureBasis, focusTransform, slotTransform, validPose, ringMetrics, type Basis, type RingEntry, type RingSlot, type SpatialTransform } from './scene-geometry';
import type { PoseSample, TrackingState, Vector3 } from './types';
/** from/to are local to origin; only the closing origin follows translation. */
export type FocusSelection = { id: string; phase: 'opening' | 'focused' | 'closing'; token: number; origin: Vector3; from: SpatialTransform; to: SpatialTransform };

/** Native-coordinate-frame geometry only. This grants no destination admission. */
export class RingController {
  basis: Basis | null = null;
  slots: RingSlot[] = [];
  selection: FocusSelection | null = null;
  private tracking: TrackingState = 'unavailable';
  private latest: PoseSample | null = null;
  private sampledAt = -Infinity;
  private publishedAt = -Infinity;
  private position: Vector3 | null = null;
  private snap = true;
  private serial = 0;
  constructor(private readonly entries: readonly RingEntry[]) {}
  track(state: TrackingState) {
    if (state !== this.tracking) this.latest = null;
    if (state === 'normal' && this.tracking !== 'normal') this.snap = true;
    this.tracking = state;
  }
  pose(sample: PoseSample, now: number): { captured: boolean; position?: Vector3 } {
    if (this.tracking !== 'normal' || !validPose(sample) || !Number.isFinite(now) || now < this.sampledAt) return { captured: false };
    this.latest = { position: [...sample.position], forward: [...sample.forward] }; this.sampledAt = now;
    let captured = false;
    if (!this.basis) {
      this.basis = captureBasis(sample); if (!this.basis) return { captured: false };
      this.slots = buildRingSlots(this.entries, this.basis); captured = true;
    }
    if (!this.snap && now - this.publishedAt < 1000 / 30) return { captured };
    const distance = this.position ? Math.hypot(...sample.position.map((v, i) => v - this.position![i])) : Infinity;
    const alpha = this.snap || distance > 0.25 ? 1 : 1 - Math.exp(-(now - this.publishedAt) / 60);
    if (!this.snap && distance < 0.002) return { captured };
    this.position = sample.position.map((v, i) => this.position ? this.position[i] + alpha * (v - this.position[i]) : v) as Vector3;
    this.publishedAt = now; this.snap = false;
    return { captured, position: [...this.position] };
  }
  get ringPosition(): Vector3 | null { return this.position ? [...this.position] : null; }
  private fresh(now: number) { return this.tracking === 'normal' && this.latest && now >= this.sampledAt && now - this.sampledAt <= 500; }
  select(id: string, now: number): FocusSelection | null {
    if (this.selection || !this.fresh(now) || !this.position) return null;
    const slot = this.slots.find(item => item.id === id); const to = focusTransform(this.latest!);
    if (!slot || !to) return null;
    return this.selection = { id, phase: 'opening', token: ++this.serial, origin: [0, 0, 0], from: slotTransform(slot, this.position), to };
  }
  close(now: number): FocusSelection | null {
    if (this.selection?.phase !== 'focused' || !this.fresh(now) || !this.position) return null;
    const slot = this.slots.find(item => item.id === this.selection!.id)!;
    // Closing joins the translation-following frame. Animate in its local
    // coordinates so movement (including recovery) cannot stale the endpoint.
    const origin: Vector3 = [...this.position];
    const from = { ...this.selection.to, position: this.selection.to.position.map((v, i) => v - origin[i]) as Vector3 };
    const to = { position: slot.position, rotation: slot.rotation, scale: ringMetrics.tileScale };
    return this.selection = { id: slot.id, phase: 'closing', token: ++this.serial, origin, from, to };
  }
  complete(token: number) {
    if (!this.selection || this.selection.token !== token || this.selection.phase === 'focused') return false;
    this.selection = this.selection.phase === 'closing' ? null : { ...this.selection, phase: 'focused' };
    return true;
  }
  recenter(now: number) {
    if (!this.fresh(now)) return false;
    const basis = captureBasis(this.latest!); if (!basis) return false;
    this.basis = basis; this.slots = buildRingSlots(this.entries, basis);
    this.position = [...this.latest!.position]; this.publishedAt = now; this.snap = true;
    ++this.serial;
    if (this.selection) {
      const transform = focusTransform(this.latest!)!;
      this.selection = { ...this.selection, phase: 'focused', token: this.serial, origin: [0, 0, 0], from: transform, to: transform };
    }
    return true;
  }
}
