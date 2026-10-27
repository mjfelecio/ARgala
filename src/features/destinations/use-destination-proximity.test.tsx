import * as React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { destinationSchema, type Destination } from './catalog';
import { useDestinationProximity } from './use-destination-proximity';
import type { ArrivalInput } from './proximity';
const destination = destinationSchema.parse({ id: 'pilot-aclc', provisionalName: 'Test', ar: {
  schemaVersion: 1, contentVersion: 'test', tiles: [], activation: { point: { latitude: 0, longitude: 0 },
    radiusMeters: 50, pointApprovalReference: 'synthetic', radiusApprovalReference: 'synthetic' },
} });
const sample = (timestamp: number): ArrivalInput => ({ running: true, watcherStatus: 'ready', sample: { timestamp, accuracy: 5, position: { latitude: 0, longitude: 0 } } });
let current: ReturnType<typeof useDestinationProximity>; let tree: ReactTestRenderer | undefined;
function Probe({ selected = destination, input }: { selected?: Destination | null; input: ArrivalInput }) { const value = useDestinationProximity(selected, input); React.useEffect(() => { current = value; }, [value]); return null; }
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }); vi.useFakeTimers(); vi.setSystemTime(10000);
  const original = console.error;
  vi.spyOn(console, 'error').mockImplementation((...args) => { if (!String(args[0]).startsWith('react-test-renderer is deprecated')) original(...args); });
});
afterEach(async () => { await act(async () => tree?.unmount()); tree = undefined; vi.useRealTimers(); vi.restoreAllMocks(); });
async function ready() {
  await act(async () => { tree = create(<Probe input={sample(10000)} />); });
  for (const time of [13000, 16000]) await act(async () => { vi.setSystemTime(time); tree!.update(<Probe input={sample(time)} />); });
  expect(current.canEnter()).toBe(true);
}
it('expires admission without another watcher event and preserves dismissal through rerenders', async () => {
  await ready();
  await act(async () => { current.dismiss(); });
  expect(current.state?.showInvitation).toBe(false);
  await act(async () => { vi.advanceTimersByTime(11000); });
  expect(current.state?.eligible).toBe(false); expect(current.canEnter()).toBe(false);
});
it('fails closed on background, watcher errors and selected destination changes', async () => {
  await ready();
  await act(async () => { tree!.update(<Probe input={{ ...sample(16000), running: false }} />); });
  expect(current.canEnter()).toBe(false);
  await act(async () => { tree!.update(<Probe selected={null} input={sample(16000)} />); });
  expect(current.state).toBeNull(); expect(current.canEnter()).toBe(false);
});
it('retires a captured validation callback when its foreground owner unmounts', async () => {
  await ready(); const validate = current.canEnter;
  await act(async () => tree!.unmount()); tree = undefined;
  expect(validate()).toBe(false);
});
