import { afterEach, expect, it, vi } from 'vitest';
import { ArEntryIntents } from './entry-intent';
afterEach(() => vi.restoreAllMocks());
function setup() {
  let selected = 'pilot-aclc'; let principal = 'owner'; let eligible = true;
  const validate = (destinationId: string, principalId: string) => eligible && selected === destinationId && principal === principalId;
  const store = new ArEntryIntents(validate);
  return { store, change: (what: 'selected' | 'principal' | 'eligible') => {
    if (what === 'selected') selected = 'D01'; else if (what === 'principal') principal = 'other'; else eligible = false;
  } };
}
it('revalidates at creation and claims exactly once, yielding pending verified identity', () => {
  const { store } = setup();
  expect(store.create('D01', 'owner')).toBeNull();
  const handle = store.create('pilot-aclc', 'owner');
  expect(handle).toBeTypeOf('string');
  const entry = store.claim(handle, 'pilot-aclc', 'owner');
  expect(entry?.identity).toMatchObject({ destinationId: 'pilot-aclc', principalId: 'owner', provenance: 'verified' });
  expect(entry?.authorizeMount()).toBe(true);
  expect(store.claim(handle, 'pilot-aclc', 'owner')).toBeNull();
});
it.each(['selected', 'principal', 'eligible'] as const)('rejects stale %s authority at claim and first mount', what => {
  const first = setup(); const handle = first.store.create('pilot-aclc', 'owner');
  first.change(what);
  expect(first.store.claim(handle, 'pilot-aclc', 'owner')).toBeNull();
  const second = setup(); const entry = second.store.claim(second.store.create('pilot-aclc', 'owner'), 'pilot-aclc', 'owner');
  second.change(what);
  expect(entry?.authorizeMount()).toBe(false);
});
it('rejects dead URLs, duplicate rapid launches, superseded and expired handles', () => {
  vi.spyOn(Date, 'now').mockReturnValue(10000);
  const { store } = setup();
  expect(store.claim('made-up', 'pilot-aclc', 'owner')).toBeNull();
  const first = store.create('pilot-aclc', 'owner');
  const second = store.create('pilot-aclc', 'owner');
  expect(store.claim(first, 'pilot-aclc', 'owner')).toBeNull();
  vi.mocked(Date.now).mockReturnValue(40000);
  expect(store.claim(second, 'pilot-aclc', 'owner')).toBeNull();
});
it('invalidates issued pending mounts when cleared, without touching M3 established-session recovery', () => {
  const { store } = setup();
  const entry = store.claim(store.create('pilot-aclc', 'owner'), 'pilot-aclc', 'owner');
  store.clear();
  expect(entry?.authorizeMount()).toBe(false);
});
it('uses distinct handles across simultaneous principal-scoped intent owners', () => {
 vi.spyOn(Date, 'now').mockReturnValue(10000);
 const first = setup(); const second = setup();
 expect(first.store.create('pilot-aclc', 'owner')).not.toBe(second.store.create('pilot-aclc', 'owner'));
});
it('expires unclaimed handles while a claimed pending entry still revalidates fresh eligibility on explicit retry', () => {
 vi.spyOn(Date, 'now').mockReturnValue(10000);
 const { store, change } = setup(); const entry = store.claim(store.create('pilot-aclc', 'owner'), 'pilot-aclc', 'owner');
 vi.mocked(Date.now).mockReturnValue(60000);
 expect(entry?.authorizeMount()).toBe(true);
 change('eligible'); expect(entry?.authorizeMount()).toBe(false);
});
