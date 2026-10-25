import { createElement, useEffect } from 'react';
import type { PermissionResponse } from 'expo';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cameraPermission, readViroSupport } from './viro-runtime';
import { useViroStartup } from './use-viro-startup';

vi.mock('./viro-runtime', () => ({ cameraPermission: vi.fn(), readViroSupport: vi.fn() }));
let tree: ReactTestRenderer;
let current: ReturnType<typeof useViroStartup>;
let running: boolean; let transitionReady: boolean; let measured: boolean;
let policy: { begin(): boolean; authorizeMount(): boolean; ready(): boolean; interrupt(): void; fail(): void } | undefined;
const granted = { granted: true, canAskAgain: true, status: 'granted' as PermissionResponse['status'], expires: 'never' as const };
function Probe() {
  const startup = useViroStartup({ running, transitionReady, measured, policy });
  useEffect(() => { current = startup; });
  return null;
}
async function update() { await act(async () => tree.update(createElement(Probe))); }
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  vi.useFakeTimers(); policy = undefined; running = true; transitionReady = true; measured = true;
  vi.mocked(cameraPermission).mockReset().mockResolvedValue(granted);
  vi.mocked(readViroSupport).mockReset().mockResolvedValue('supported');
  const original = console.error;
  vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    if (!String(args[0]).startsWith('react-test-renderer is deprecated')) original(...args);
  });
  await act(async () => { tree = create(createElement(Probe)); });
});
afterEach(async () => { await act(async () => tree.unmount()); vi.clearAllTimers(); vi.useRealTimers(); vi.restoreAllMocks(); });

it('does no native checks on mount and waits for explicit Start, layout and transition completion', async () => {
  expect(cameraPermission).not.toHaveBeenCalled(); expect(readViroSupport).not.toHaveBeenCalled();
  transitionReady = false; measured = false; await update();
  await act(async () => current.start());
  expect(current.mountScene).toBe(false);
  measured = true; await update(); expect(current.mountScene).toBe(false);
  transitionReady = true; await update(); expect(current.mountScene).toBe(true);
  expect(cameraPermission).toHaveBeenCalledWith(false, expect.objectContaining({ isCurrent: expect.any(Function) }));
});
it.each(['native-unavailable', 'unsupported', 'checking', 'failed'] as const)('never mounts a scene for %s support', async status => {
  vi.mocked(readViroSupport).mockResolvedValue(status);
  await act(async () => current.start());
  expect(current.mountScene).toBe(false); expect(current.errorCode).not.toBeNull();
});
it('requires an explicit camera action after denial and never prompts automatically', async () => {
  vi.mocked(cameraPermission).mockResolvedValue({ ...granted, granted: false, status: 'denied' as PermissionResponse['status'] });
  await act(async () => current.start());
  expect(current.phase).toBe('permission'); expect(current.mountScene).toBe(false);
  expect(cameraPermission).toHaveBeenCalledWith(false, expect.objectContaining({ isCurrent: expect.any(Function) }));
  vi.mocked(cameraPermission).mockResolvedValue(granted);
  await act(async () => current.start(true));
  expect(cameraPermission).toHaveBeenLastCalledWith(true, expect.objectContaining({ isCurrent: expect.any(Function) })); expect(current.mountScene).toBe(true);
});
it('times out support/startup and rejects a late result from the retired attempt', async () => {
  const support = Promise.withResolvers<'supported'>();
  vi.mocked(readViroSupport).mockReturnValue(support.promise);
  await act(async () => { void current.start(); });
  await act(async () => { await vi.advanceTimersByTimeAsync(20000); });
  expect(current.errorCode).toBe('startup-timeout');
  await act(async () => support.resolve('supported'));
  expect(current.mountScene).toBe(false);
});
it('can explicitly retry a support check that never called back without accepting its old result', async () => {
  const old = Promise.withResolvers<'supported'>();
  vi.mocked(readViroSupport).mockReturnValueOnce(old.promise);
  await act(async () => { void current.start(); });
  await act(async () => { await vi.advanceTimersByTimeAsync(20000); });
  await act(async () => current.start());
  expect(readViroSupport).toHaveBeenCalledTimes(2); expect(current.mountScene).toBe(true);
  await act(async () => old.resolve('supported'));
  expect(current.mountScene).toBe(true);
});
it('does not turn pending startup into a live/restorable session after a system-activity interruption', async () => {
  await act(async () => current.start());
  const readyFromOldScene = current.onReady;
  running = false; await update(); expect(current.mountScene).toBe(false);
  running = true; await update();
  await act(async () => readyFromOldScene());
  expect(current.phase).toBe('interrupted'); expect(current.mountScene).toBe(false);
  expect(readViroSupport).toHaveBeenCalledOnce();
  await act(async () => current.start());
  expect(readViroSupport).toHaveBeenCalledTimes(2); expect(current.mountScene).toBe(true);
});
it('keeps a pending permission operation outside the native view and retires its automatic mount', async () => {
  const permission = Promise.withResolvers<typeof granted>();
  vi.mocked(cameraPermission).mockImplementation((_prompt, owner) => { owner?.onPrompt?.(); return permission.promise; });
  await act(async () => { void current.start(true); });
  running = false; await update(); running = true; await update();
  await act(async () => { void current.start(true); });
  expect(cameraPermission).toHaveBeenCalledOnce();
  await act(async () => permission.resolve(granted));
  expect(current.mountScene).toBe(false); expect(current.phase).toBe('interrupted');
});
it('requires explicit restart after live backgrounding in the M1 prototype and rechecks camera revocation', async () => {
  await act(async () => current.start()); await act(async () => current.onReady());
  expect(current.phase).toBe('live');
  running = false; await update(); running = true; await update();
  expect(current.mountScene).toBe(false);
  vi.mocked(cameraPermission).mockResolvedValue({ ...granted, granted: false, canAskAgain: false, status: 'denied' as PermissionResponse['status'] });
  await act(async () => current.start());
  expect(current.phase).toBe('permission'); expect(current.canAskAgain).toBe(false);
});
it('bounds missing first tracking/pose and ignores callbacks after the deadline', async () => {
  await act(async () => current.start()); const lateReady = current.onReady;
  await act(async () => { await vi.advanceTimersByTimeAsync(20000); });
  await act(async () => lateReady());
  expect(current.errorCode).toBe('startup-timeout'); expect(current.mountScene).toBe(false);
});
it('retires a hung permission read at the deadline and permits an explicit successful retry', async () => {
  const read = Promise.withResolvers<typeof granted>();
  vi.mocked(cameraPermission).mockReturnValueOnce(read.promise);
  await act(async () => { void current.start(); });
  await act(async () => { await vi.advanceTimersByTimeAsync(20000); });
  expect(current.errorCode).toBe('startup-timeout'); expect(current.pending).toBe(false);
  await act(async () => current.start());
  const newAttempt = current.attempt;
  expect(current.mountScene).toBe(true);
  await act(async () => read.resolve(granted));
  expect(current.attempt).toBe(newAttempt); expect(current.mountScene).toBe(true);
});

it('revalidates entry after permission, measurement and delayed transition immediately before mount', async () => {
  const gate = vi.fn(() => true); policy = { begin: () => true, authorizeMount: gate, ready: () => true, interrupt: vi.fn(), fail: vi.fn() };
  transitionReady = false; measured = false; await update(); await act(async () => current.start());
  expect(gate).not.toHaveBeenCalled(); measured = true; await update(); expect(gate).not.toHaveBeenCalled();
  gate.mockReturnValue(false); transitionReady = true; await update();
  expect(gate).toHaveBeenCalledOnce(); expect(current.mountScene).toBe(false); expect(current.errorCode).toBe('entry-ineligible');
});
it('does not promote an expired logical recovery on a late native ready callback', async () => {
  policy = { begin: () => true, authorizeMount: () => true, ready: () => false, interrupt: vi.fn(), fail: vi.fn() }; await update();
  await act(async () => current.start()); expect(current.mountScene).toBe(true);
  await act(async () => current.onReady()); expect(current.mountScene).toBe(false); expect(current.errorCode).toBe('entry-ineligible');
});
