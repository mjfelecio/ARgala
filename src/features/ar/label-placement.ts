// Display stops only: geographic decisions and FOV checks use raw sensor data.
// Three broad positions avoid chasing indoor heading noise. The buffer keeps a
// badge at its current stop until its target moves most of the way to the next.
const holdFraction = 0.85;

export function snapLabelLeft(previous: number | null, target: number, minLeft: number, maxLeft: number): number {
  const range = maxLeft - minLeft;
  if (range <= 0) return minLeft;
  const step = range / 2;
  const bounded = Math.max(minLeft, Math.min(maxLeft, target));
  const threshold = step * holdFraction;
  if (previous !== null && previous >= minLeft && previous <= maxLeft && Math.abs(bounded - previous) <= threshold) return previous;
  return Math.max(minLeft, Math.min(maxLeft, minLeft + Math.round((bounded - minLeft) / step) * step));
}
