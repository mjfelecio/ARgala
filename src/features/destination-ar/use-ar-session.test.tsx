import { createElement, useEffect } from 'react';
import type { PermissionResponse } from 'expo';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cameraPermission, readViroSupport } from './viro-runtime';
import { useArSession } from './use-ar-session';
vi.mock('./viro-runtime', () => ({ cameraPermission: vi.fn(), readViroSupport: vi.fn() }));
const identity = { admissionId: 'development-entry', destinationId: 'development-aclc', principalId: 'owner', provenance: 'development' as const };
const granted = { granted: true, canAskAgain: true, status: 'granted' as PermissionResponse['status'], expires: 'never' as const };
let running: boolean; let transitionReady: boolean; let measured: boolean; let eligible: boolean;
let reveal = false;
let tree: ReactTestRenderer; let current: ReturnType<typeof useArSession>; const gate = vi.fn();
function Probe() {
  const result = useArSession({ identity, tileIds: ['overview', 'history'], running, transitionReady, measured, freshEligible: gate, reveal });
  useEffect(() => { current = result; }); return null;
}
async function update() { await act(async () => tree.update(createElement(Probe))); }
async function start() { await act(async () => current.startup.start()); }
async function ready() { await act(async () => current.startup.onReady()); }
async function background() { running = false; await update(); }
async function foreground() { running = true; await update(); }
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }); vi.useFakeTimers(); vi.setSystemTime(1000);
  running = transitionReady = measured = eligible = true; reveal = false; gate.mockReset().mockImplementation(() => eligible);
  vi.mocked(readViroSupport).mockReset().mockResolvedValue('supported'); vi.mocked(cameraPermission).mockReset().mockResolvedValue(granted);
  const original = console.error; vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => { if (!String(args[0]).startsWith('react-test-renderer is deprecated')) original(...args); });
  await act(async () => { tree = create(createElement(Probe)); });
});
afterEach(async () => { await act(async () => tree.unmount()); vi.clearAllTimers(); vi.useRealTimers(); vi.restoreAllMocks(); });
it('keeps startup pending until a fresh mount gate and tracking-ready', async () => {
  expect(readViroSupport).not.toHaveBeenCalled(); transitionReady = false; await update(); await start();
  expect(current.session.established).toBe(false); expect(gate).not.toHaveBeenCalled();
  eligible = false; transitionReady = true; await update();
  expect(current.startup.mountScene).toBe(false); expect(current.startup.errorCode).toBe('entry-ineligible');
});
it('automatically recovers only an already-live session after transition readiness with passive permission checks', async () => {
  await start(); await ready(); const staleReady = current.startup.onReady;
  await background(); expect(current.startup.mountScene).toBe(false); expect(current.session.phase).toBe('suspended');
  eligible = false; transitionReady = false; await foreground(); expect(readViroSupport).toHaveBeenCalledOnce();
  transitionReady = true; await update(); expect(readViroSupport).toHaveBeenCalledTimes(2); expect(current.startup.mountScene).toBe(true);
  expect(vi.mocked(cameraPermission).mock.calls.map(call => call[0])).toEqual([false, false]); expect(gate).toHaveBeenCalledOnce();
  await act(async () => staleReady()); expect(current.session.phase).toBe('initializing');
  await ready(); expect(current.session.phase).toBe('exploring');
});
it('never restores an interrupted first startup without an explicit retry and fresh eligibility', async () => {
  await start(); await background(); eligible = false; await foreground();
  expect(current.session.established).toBe(false); expect(readViroSupport).toHaveBeenCalledOnce(); expect(current.startup.mountScene).toBe(false);
  await start(); expect(gate).toHaveBeenCalledTimes(2); expect(current.startup.errorCode).toBe('entry-ineligible');
});
it('does not auto-loop a native installation interruption during live recovery', async () => {
  await start(); await ready(); await background(); await foreground(); expect(current.startup.mountScene).toBe(true);
  await background(); await foreground(); expect(current.startup.mountScene).toBe(false); expect(readViroSupport).toHaveBeenCalledTimes(2);
  await start(); expect(readViroSupport).toHaveBeenCalledTimes(3); expect(gate).toHaveBeenCalledOnce();
});
it('rechecks grants on live resume and blocks revocation without automatic prompting', async () => {
  await start(); await ready(); await background();
  vi.mocked(cameraPermission).mockResolvedValue({ ...granted, granted: false, canAskAgain: false, status: 'denied' as PermissionResponse['status'] });
  await foreground(); expect(current.startup.phase).toBe('permission'); expect(current.startup.mountScene).toBe(false);
  expect(vi.mocked(cameraPermission).mock.calls.every(call => !call[0])).toBe(true);
});
it.each([299000, 300000])('handles foreground after suspension elapsed %s without renewing the grace', async elapsed => {
  await start(); await ready(); await background(); vi.setSystemTime(1000 + elapsed); eligible = false; await foreground();
  expect(current.startup.mountScene).toBe(elapsed < 300000);
  if (elapsed === 300000) { expect(current.session.phase).toBe('expired'); await start(); expect(current.startup.errorCode).toBe('entry-ineligible'); }
});
it('revalidates grace again if passive permission work finishes after its deadline', async () => {
  await start(); await ready(); await background(); vi.setSystemTime(300000);
  const permission = Promise.withResolvers<typeof granted>(); vi.mocked(cameraPermission).mockReturnValueOnce(permission.promise);
  await foreground(); vi.setSystemTime(301000); await act(async () => permission.resolve(granted));
  expect(current.startup.mountScene).toBe(false); expect(current.session.established).toBe(false);
});
it('retires a permission activity and requires explicit retry after it settles', async () => {
  const permission = Promise.withResolvers<typeof granted>();
  vi.mocked(cameraPermission).mockImplementationOnce((_prompt, owner) => { owner?.onPrompt?.(); return permission.promise; });
  await act(async () => { void current.startup.start(true); }); await background(); await foreground();
  expect(current.startup.pending).toBe(true); await act(async () => permission.resolve(granted));
  expect(current.startup.mountScene).toBe(false); expect(readViroSupport).toHaveBeenCalledOnce();
});
it('keeps logical progress through native unmount but invalidates explicit exit and old callbacks', async () => {
  await start(); await ready(); const oldTracking = current.onTracking;
  await act(async () => current.onProgress({ selectedId: 'history', cursors: { history: { page: 2, offset: 20, locale: 'en', size: 'large' } } }));
  await background(); await foreground(); expect(current.session.progress.selectedId).toBe('history');
  await ready(); await act(async () => oldTracking('limited')); expect(current.session.phase).toBe('exploring');
  await act(async () => current.close()); expect(current.startup.mountScene).toBe(false); expect(current.session.phase).toBe('closed');
});

it('stages a tracking-ready reveal, pauses on tracking loss, supports Skip and keeps recovery quick', async () => {
  reveal = true; await update(); await start();
  await act(async () => { await vi.advanceTimersByTimeAsync(1200); }); expect(current.session.phase).toBe('initializing');
  await ready(); expect(current.session.phase).toBe('reveal'); expect(current.session.revealedCount).toBe(1);
  await act(async () => { await vi.advanceTimersByTimeAsync(1200); }); expect(current.session.revealedCount).toBe(2);
  await act(async () => current.onTracking('limited')); await act(async () => { await vi.advanceTimersByTimeAsync(2000); }); expect(current.session.revealedCount).toBe(2);
  await act(async () => current.onTracking('normal')); await act(async () => current.finishReveal()); expect(current.session.phase).toBe('exploring');
  await background(); await foreground(); await ready(); expect(current.session.phase).toBe('exploring');
});
it('finishes a first-use reveal in approximately 2.4 seconds of valid tracking', async () => {
  reveal = true; await update(); await start(); await ready();
  await act(async () => { await vi.advanceTimersByTimeAsync(2399); }); expect(current.session.phase).toBe('reveal');
  await act(async () => { await vi.advanceTimersByTimeAsync(1); }); expect(current.session.phase).toBe('exploring');
});

it('expires on the original elapsed deadline after a partial wall-clock rollback', async () => {
  let elapsed = 1000; vi.spyOn(performance, 'now').mockImplementation(() => elapsed);
  await start(); await ready(); await background();
  await act(async () => { elapsed = 241000; await vi.advanceTimersByTimeAsync(240000); vi.setSystemTime(61000); elapsed = 301000; await vi.advanceTimersByTimeAsync(60000); });
  expect(current.session.phase).toBe('expired'); eligible = false; await foreground(); expect(current.startup.mountScene).toBe(false); expect(readViroSupport).toHaveBeenCalledOnce();
});
