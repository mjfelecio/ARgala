import { buildRingSlots, ringMetrics, type Basis, type RingEntry, type RingSlot } from './scene-geometry';

/** Faceted chapter exhibit, not a curved text mesh. D01 is the only admitted
 * presentation prototype; each frame captures this layout once like Classic. */
export function buildExhibitSlots(entries: readonly RingEntry[], basis: Basis): RingSlot[] {
  const slots = buildRingSlots(entries, basis);
  if (slots.length > 3) throw new Error('Exhibit prototype supports up to three chapters');
  return slots.map((slot, index) => {
    const angle = [0, 24, -24][index];
    const radians = angle * Math.PI / 180;
    const x = Math.cos(radians) * basis.forward[0] + Math.sin(radians) * basis.right[0];
    const z = Math.cos(radians) * basis.forward[2] + Math.sin(radians) * basis.right[2];
    return { ...slot, angle: (angle + 360) % 360,
      position: [x * ringMetrics.radius, slot.position[1], z * ringMetrics.radius],
      rotation: [0, ((basis.yaw - angle + 540) % 360) - 180, 0] };
  });
}
