import { ringMetrics, slotTransform, type Basis, type RingSlot, type SpatialTransform } from './scene-geometry';
import type { IntroVariant } from './intro-policy';
/** Relative to the existing translated ring root. Endpoints always come from
 * canonical slots; animation never captures or changes the native world basis.
 */
export function deploymentTransform(slot: RingSlot, basis: Basis, progress: number, variant: IntroVariant): SpatialTransform {
  const p = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 1;
  const final = slotTransform(slot, [0, 0, 0]);
  if (p === 1 || variant !== 'full') return final;
  const eased = 1 - (1 - p) ** 3;
  const angle = (slot.angle * eased + 65 * Math.sin(Math.PI * p)) * Math.PI / 180;
  const radius = 0.4 + (ringMetrics.radius - 0.4) * eased;
  const x = Math.cos(angle) * basis.forward[0] + Math.sin(angle) * basis.right[0];
  const z = Math.cos(angle) * basis.forward[2] + Math.sin(angle) * basis.right[2];
  return { position: [x * radius, slot.position[1] * eased + 0.12 * Math.sin(Math.PI * p), z * radius],
    rotation: [0, basis.yaw - slot.angle * eased, 0], scale: 0.12 + (ringMetrics.tileScale - 0.12) * eased };
}

/** Viro normalizes each completed Euler rotation into 0..360. Relative shortest
 * deltas keep consecutive native keyframes continuous across that boundary.
 */
export function deploymentKeyframes(slot: RingSlot, basis: Basis, variant: IntroVariant) {
  const count = variant === 'full' ? 12 : 1;
  let previousYaw = deploymentTransform(slot, basis, 0, variant).rotation[1];
  return Array.from({ length: count }, (_, index) => {
    const transform = deploymentTransform(slot, basis, (index + 1) / count, variant);
    const yawDelta = ((transform.rotation[1] - previousYaw + 180) % 360 + 360) % 360 - 180;
    previousYaw = transform.rotation[1];
    return { transform, yawDelta };
  });
}
