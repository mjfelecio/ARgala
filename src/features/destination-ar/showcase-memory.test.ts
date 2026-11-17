import { expect, it } from 'vitest';
import { ShowcaseMemory } from './showcase-memory';

it('keeps idempotent demo stamps and introductions only in the current showcase generation', () => {
  const memory = new ShowcaseMemory(); const first = memory.getSnapshot();
  memory.recordEstablished('D01', first.generation); memory.recordEstablished('D01', first.generation);
  memory.completeIntroduction('D01', first.generation);
  memory.recordEstablished('D09', first.generation);
  expect(memory.getSnapshot().stamps).toEqual(['D01', 'D09']);
  expect(memory.getSnapshot().introductions).toEqual(['D01']);
  memory.reset(); const reset = memory.getSnapshot();
  memory.recordEstablished('D02', first.generation); memory.completeIntroduction('D02', first.generation);
  expect(memory.getSnapshot()).toBe(reset);
  expect(reset.stamps).toEqual([]); expect(reset.introductions).toEqual([]);
  expect(new ShowcaseMemory().getSnapshot().stamps).toEqual([]);
});
it('rejects unknown destinations and keeps subscribed snapshots stable without a change', () => {
  const memory = new ShowcaseMemory(); const first = memory.getSnapshot(); const updates: unknown[] = [];
  const unsubscribe = memory.subscribe(() => updates.push(memory.getSnapshot()));
  memory.recordEstablished('pilot-aclc', first.generation); memory.recordEstablished('D10', first.generation);
  expect(memory.getSnapshot()).toBe(first); expect(updates).toEqual([]);
  memory.recordEstablished('D02', first.generation); expect(updates).toHaveLength(1);
  memory.recordEstablished('D02', first.generation); expect(updates).toHaveLength(1);
  unsubscribe(); memory.reset(); expect(updates).toHaveLength(1);
});
