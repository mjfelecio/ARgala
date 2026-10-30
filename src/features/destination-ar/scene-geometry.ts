import type { PoseSample, Vector3 } from './types';

export type RingEntry = { id: string; role?: 'overview' | 'history' };
export type Basis = { forward: Vector3; right: Vector3; yaw: number };
export type SpatialTransform = { position: Vector3; rotation: Vector3; scale: number };
export type RingSlot = RingEntry & { angle: number; position: Vector3; rotation: Vector3 };
// Engineering starting values in Viro world units; physical Gate B tunes fit/comfort.
export const ringMetrics = { radius: 2, tileSize: 0.68, panelWidth: 1.25, panelHeight: 1.25, focusDistance: 1.5, tileScale: 0.56, transitionMs: 280 } as const;
const degrees = (value: number) => ((value + 180) % 360 + 360) % 360 - 180;
export const validVector = (v: unknown): v is Vector3 => Array.isArray(v) && v.length === 3 && v.every(Number.isFinite);
export function validPose(pose: PoseSample) { return !!pose && validVector(pose.position) && validVector(pose.forward); }
export function captureBasis(pose: PoseSample): Basis | null {
  if (!validPose(pose)) return null;
  const horizontal = Math.hypot(pose.forward[0], pose.forward[2]);
  if (horizontal < 0.05) return null;
  const x = pose.forward[0] / horizontal; const z = pose.forward[2] / horizontal;
  return { forward: [x, 0, z], right: [-z, 0, x], yaw: degrees(Math.atan2(-x, -z) * 180 / Math.PI) };
}
export function buildRingSlots(entries: readonly RingEntry[], basis: Basis): RingSlot[] {
  if (entries.length > 8 || new Set(entries.map(item => item.id)).size !== entries.length) throw new Error('Invalid ring entries');
  const overview = entries.filter(item => item.role === 'overview');
  const history = entries.filter(item => item.role === 'history');
  if (overview.length > 1 || history.length > 1) throw new Error('Duplicate ring roles');
  const rest = entries.filter(item => !item.role);
  const ordered = [...overview, ...history, ...rest];
  const both = overview.length === 1 && history.length === 1;
  return ordered.map((entry, index) => {
    const angle = both ? index === 0 ? 0 : index === 1 ? 90 : 90 + 270 * (index - 1) / (ordered.length - 1)
      : (history.length && !overview.length ? 90 : 0) + index * 360 / ordered.length;
    const radians = angle * Math.PI / 180;
    const x = Math.cos(radians) * basis.forward[0] + Math.sin(radians) * basis.right[0];
    const z = Math.cos(radians) * basis.forward[2] + Math.sin(radians) * basis.right[2];
    return { ...entry, angle: angle % 360, position: [x * ringMetrics.radius, index === 0 ? 0 : index % 2 ? 0.04 : -0.04, z * ringMetrics.radius], rotation: [0, degrees(basis.yaw - angle), 0] };
  });
}
export function focusTransform(pose: PoseSample): SpatialTransform | null {
  const basis = captureBasis(pose); if (!basis) return null;
  return { position: [pose.position[0] + basis.forward[0] * ringMetrics.focusDistance, pose.position[1], pose.position[2] + basis.forward[2] * ringMetrics.focusDistance], rotation: [0, basis.yaw, 0], scale: 1 };
}
export function slotTransform(slot: RingSlot, origin: Vector3): SpatialTransform {
  return { position: slot.position.map((value, index) => value + origin[index]) as Vector3, rotation: slot.rotation, scale: ringMetrics.tileScale };
}
