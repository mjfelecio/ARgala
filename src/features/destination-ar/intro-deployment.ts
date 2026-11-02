import { ringMetrics, slotTransform, type Basis, type RingSlot, type SpatialTransform } from './scene-geometry';
import type { IntroVariant } from './intro-policy';
const smooth = (value: number) => value * value * (3 - 2 * value);
const signedAngle = (angle: number) => angle > 180 ? angle - 360 : angle;
/** All chapters first share a forward-facing spread. Position lanes follow their
 * eventual ring headings; larger catalogs use rows instead of overlapping covers. */
function forwardSpread(slot: RingSlot, basis: Basis, peers: readonly RingSlot[]): SpatialTransform {
  const ordered = [...peers].sort((first, second) => signedAngle(first.angle) - signedAngle(second.angle));
  const index = Math.max(0, ordered.findIndex(item => item.id === slot.id));
  const columns = Math.min(5, Math.max(1, ordered.length));
  const rows = Math.ceil(ordered.length / columns);
  const row = Math.floor(index / columns);
  const rowColumns = Math.min(columns, ordered.length - row * columns);
  const column = index % columns - (rowColumns - 1) / 2;
  const lateral = column * 0.24; const depth = 1.25 + Math.abs(column) * 0.025;
  return { position: [basis.forward[0] * depth + basis.right[0] * lateral, ((rows - 1) / 2 - row) * 0.23, basis.forward[2] * depth + basis.right[2] * lateral], rotation: [0, basis.yaw, 0], scale: 0.14 };
}
/** Relative to the existing ring root. The spread makes the complete cast visible
 * before short staggered outward arcs carry it to the unchanged canonical ring. */
export function deploymentTransform(slot: RingSlot, basis: Basis, progress: number, variant: IntroVariant, peers: readonly RingSlot[] = [slot]): SpatialTransform {
  const p = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 1;
  const final = slotTransform(slot, [0, 0, 0]);
  if (p === 1 || variant !== 'full') return final;
  const spread = forwardSpread(slot, basis, peers);
  if (p < 0.18) {
    const t = smooth(p / 0.18);
    const origin = [basis.forward[0] * 1.2, 0, basis.forward[2] * 1.2];
    return { position: spread.position.map((value, index) => origin[index] + (value - origin[index]) * t) as SpatialTransform['position'], rotation: spread.rotation, scale: 0.055 + (spread.scale - 0.055) * t };
  }
  const ordinal = Math.max(0, peers.findIndex(item => item.id === slot.id));
  const departure = 0.28 + 0.18 * ordinal / Math.max(1, peers.length - 1);
  if (p <= departure) return spread;
  const progressToRing = (p - departure) / (1 - departure); const t = smooth(progressToRing);
  const lateral = spread.position[0] * basis.right[0] + spread.position[2] * basis.right[2];
  const depth = spread.position[0] * basis.forward[0] + spread.position[2] * basis.forward[2];
  const startAngle = Math.atan2(lateral, depth);
  const angle = startAngle + (signedAngle(slot.angle) * Math.PI / 180 - startAngle) * t;
  const startRadius = Math.hypot(lateral, depth); const radius = startRadius + (ringMetrics.radius - startRadius) * t;
  const x = Math.cos(angle) * basis.forward[0] + Math.sin(angle) * basis.right[0];
  const z = Math.cos(angle) * basis.forward[2] + Math.sin(angle) * basis.right[2];
  return { position: [x * radius, spread.position[1] + (slot.position[1] - spread.position[1]) * t + 0.1 * Math.sin(Math.PI * progressToRing), z * radius],
    rotation: [0, basis.yaw - signedAngle(slot.angle) * t, 0], scale: spread.scale + (ringMetrics.tileScale - spread.scale) * t };
}

/** Relative shortest yaw deltas survive native Euler normalization. */
export function deploymentKeyframes(slot: RingSlot, basis: Basis, variant: IntroVariant, peers: readonly RingSlot[] = [slot]) {
  const count = variant === 'full' ? 24 : 1;
  let previousYaw = deploymentTransform(slot, basis, 0, variant, peers).rotation[1];
  return Array.from({ length: count }, (_, index) => {
    const progress = (index + 1) / count;
    const transform = deploymentTransform(slot, basis, progress, variant, peers);
    const yawDelta = ((transform.rotation[1] - previousYaw + 180) % 360 + 360) % 360 - 180;
    previousYaw = transform.rotation[1];
    return { transform, yawDelta, opacity: variant === 'full' ? Math.min(1, progress / 0.18) : 1 };
  });
}
