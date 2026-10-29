import { expect, it } from 'vitest';
import { SchedulingQualityPolicy } from './visual-quality';
it('reduces decorations only after sustained JS scheduling delay', () => {
  const policy = new SchedulingQualityPolicy();
  expect(policy.observe(0)).toBe('standard');
  expect(policy.observe(1400)).toBe('standard'); expect(policy.observe(2800)).toBe('standard');
  expect(policy.observe(4200)).toBe('reduced'); expect(policy.observe(5200)).toBe('reduced');
});
it('ignores isolated delay and resets the baseline after pause or invalid clock data', () => {
  const policy = new SchedulingQualityPolicy();
  for (const now of [0, 1400, 2400, 3800, 4800]) expect(policy.observe(now)).toBe('standard');
  policy.pause(); expect(policy.observe(100000)).toBe('standard'); expect(policy.observe(101400)).toBe('standard');
  expect(policy.observe(NaN)).toBe('standard'); expect(policy.observe(0)).toBe('standard'); expect(policy.observe(-1)).toBe('standard');
});
it('never upgrades the same live frame after reduction, including across pause', () => {
  const policy = new SchedulingQualityPolicy(); for (const now of [0, 1500, 3000, 4500]) policy.observe(now);
  policy.pause(); expect(policy.observe(200000)).toBe('reduced');
});
