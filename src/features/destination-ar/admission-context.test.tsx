import * as React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { useArAdmission, useAdmissionSource } from './admission-context';
import { DestinationArAdmissionProvider } from './admission-provider';
import type { ArrivalInput } from '@/features/destinations/proximity';
import { getDestination, type FeaturedDestinationId } from '@/features/destinations/catalog';
import { DestinationContentContext } from '@/features/destination-content/context';
import { contentManifestSchema } from '@/features/destination-content/model';
import { manifest } from '@/features/destination-content/test-fixtures';
const controls = vi.hoisted(() => ({ principal: 'owner' }));
vi.mock('@/features/auth/provider', () => ({ useAuth: () => ({ session: { user: { id: controls.principal } } }) }));
let current: { store: ReturnType<typeof useArAdmission>; source: ReturnType<typeof useAdmissionSource> }; let tree: ReactTestRenderer | undefined;
const sample = (timestamp: number): ArrivalInput => ({ running: true, watcherStatus: 'ready', sample: { position: getDestination('pilot-aclc')!.center!, accuracy: 5, timestamp } });
function Probe({ input, id = 'pilot-aclc', onCommit }: { input: ArrivalInput; id?: FeaturedDestinationId; onCommit?(): void }) {
 const store = useArAdmission(); const source = useAdmissionSource(store, id, input, true);
 React.useLayoutEffect(() => { onCommit?.(); }, [onCommit]);
 React.useEffect(() => { current = { store, source }; }, [store, source]); return null;
}
function render(input: ArrivalInput, props: { id?: FeaturedDestinationId; onCommit?(): void } = {}) { return <React.StrictMode><DestinationArAdmissionProvider><Probe input={input} {...props} /></DestinationArAdmissionProvider></React.StrictMode>; }
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
it('reads committed content updates without replacing the admission owner or changing an issued entry', async () => {
 function view(revision: number, input: ArrivalInput) {
  return <DestinationContentContext.Provider value={{ manifest: contentManifestSchema.parse(manifest(revision)), ready: true, checking: false, canCheck: true, authenticated: true, message: 'content.cached', error: null, checkUpdates: async () => {} }}>{render(input)}</DestinationContentContext.Provider>;
 }
 await act(async () => { tree = create(view(1, { running: true, watcherStatus: 'pending', sample: null })); });
 for (const time of [10000, 13000, 16000]) await act(async () => { vi.mocked(Date.now).mockReturnValue(time); tree!.update(view(1, sample(time))); });
 const original = current.store!; const token = current.source.begin('approved', 'en'); const entry = original.take(token, 'pilot-aclc')!;
 expect(entry.destination.ar?.contentVersion).toBe('test-1');
 await act(async () => tree!.update(view(2, sample(16000))));
 expect(current.store).toBe(original); expect(entry.authorizeMount()).toBe(true); expect(entry.destination.ar?.contentVersion).toBe('test-1');
 const next = current.source.begin('approved', 'en'); expect(original.take(next, 'pilot-aclc')!.destination.ar?.contentVersion).toBe('test-2');
});

it.each(['begin', 'beginSimulation'] as const)('retires captured %s callbacks across foreground loss and reacquisition', async method => {
 await ready(); const launch = current.source[method];
 await act(async () => tree!.update(render({ ...sample(16000), running: false })));
 for (const time of [19000, 22000, 25000]) await act(async () => {
  vi.mocked(Date.now).mockReturnValue(time); tree!.update(render(sample(time)));
 });
 expect(launch('draft', 'en')).toBeNull();
 expect(current.source[method]('draft', 'en')).not.toBeNull();
});

it.each(['begin', 'beginSimulation'] as const)('rejects captured %s during commit before passive foreground cleanup', async method => {
 await ready(); const launch = current.source[method]; const results: (string | null)[] = [];
 await act(async () => tree!.update(render({ ...sample(16000), running: false }, {
  onCommit: () => { results.push(launch('draft', 'en')); },
 })));
 expect(results).toEqual([null]);
});
it.each(['begin', 'beginSimulation'] as const)('rejects captured %s during commit before passive selection cleanup', async method => {
 await ready(); const launch = current.source[method]; const results: (string | null)[] = [];
 await act(async () => tree!.update(render(sample(16000), {
  id: 'D01', onCommit: () => { results.push(launch('draft', 'en')); },
 })));
 expect(results).toEqual([null]);
});
it.each(['begin', 'beginSimulation'] as const)('preserves captured %s across an equivalent committed rerender', async method => {
 await ready(); const launch = current.source[method]; const results: (string | null)[] = [];
 await act(async () => tree!.update(render(sample(16000), {
  onCommit: () => { results.push(launch('draft', 'en')); },
 })));
 expect(results).toHaveLength(1); expect(results[0]).not.toBeNull();
 expect(current.source[method]).toBe(launch);
});
