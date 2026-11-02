import { expect, it } from 'vitest';
import { introVariant } from './intro-policy';
it('uses full first visits, quick repeats and direct reduced motion only after native readiness', () => {
  const input = { ready: true, established: false, seen: false, reduced: false };
  expect(introVariant(input)).toBe('full');
  expect(introVariant({ ...input, seen: true })).toBe('return');
  expect(introVariant({ ...input, reduced: true })).toBe('reduced');
  expect(introVariant({ ...input, ready: false })).toBe('none');
  expect(introVariant({ ...input, established: true })).toBe('none');
});
