import * as React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { useArAdmission, useAdmissionSource } from './admission-context';
import { DestinationArAdmissionProvider } from './admission-provider';
import type { ArrivalInput } from '@/features/destinations/proximity';
import { getDestination } from '@/features/destinations/catalog';
const controls = vi.hoisted(() => ({ principal: 'owner' }));
vi.mock('@/features/auth/provider', () => ({ useAuth: () => ({ session: { user: { id: controls.principal } } }) }));
let current: { store: ReturnType<typeof useArAdmission>; source: ReturnType<typeof useAdmissionSource> }; let tree: ReactTestRenderer | undefined;
const sample = (timestamp: number): ArrivalInput => ({ running: true, watcherStatus: 'ready', sample: { position: getDestination('pilot-aclc')!.center!, accuracy: 5, timestamp } });
function Probe({ input }: { input: ArrivalInput }) {
 const store = useArAdmission(); const source = useAdmissionSource(store, 'pilot-aclc', input, true);
 React.useEffect(() => { current = { store, source }; }, [store, source]); return null;
}
function render(input: ArrivalInput) { return <React.StrictMode><DestinationArAdmissionProvider><Probe input={input} /></DestinationArAdmissionProvider></React.StrictMode>; }
beforeEach(() => { Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true, __DEV__: true }); controls.principal = 'owner'; vi.stubEnv('EXPO_PUBLIC_VIRO_SPIKE', '1'); vi.spyOn(Date, 'now').mockReturnValue(10000);
 const original = console.error; vi.spyOn(console, 'error').mockImplementation((...args) => { if (!String(args[0]).startsWith('react-test-renderer is deprecated')) original(...args); }); });
afterEach(async () => { await act(async () => tree?.unmount()); tree = undefined; vi.restoreAllMocks(); vi.unstubAllEnvs(); });
async function ready() {
 await act(async () => { tree = create(render({ running: true, watcherStatus: 'pending', sample: null })); });
 for (const time of [10000, 13000, 16000]) await act(async () => { vi.mocked(Date.now).mockReturnValue(time); tree!.update(render(sample(time))); });
}
it('survives strict effect replay and retires captured launch callbacks on foreground loss', async () => {
 await ready(); expect(current.store?.getSnapshot()?.eligible).toBe(true);
 const launch = current.source.begin;
 await act(async () => tree!.update(render({ ...sample(16000), running: false })));
 expect(launch('draft', 'en')).toBeNull();
});
it('replaces principal ownership and invalidates pending first mounts', async () => {
 await ready(); const handle = current.source.begin('draft', 'en'); const entry = current.store!.take(handle, 'pilot-aclc')!;
 expect(entry.authorizeMount()).toBe(true);
 controls.principal = 'different'; await act(async () => tree!.update(render(sample(16000))));
 expect(entry.authorizeMount()).toBe(false); expect(current.source.begin('draft', 'en')).toBeNull();
});
