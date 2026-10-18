import * as React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useAppActive } from './use-app-active';

const native = vi.hoisted(() => ({
  state: 'background', activateDuringSubscribe: false,
  listeners: new Set<(state: string) => void>(),
}));
vi.mock('react-native', () => ({ AppState: {
  get currentState() { return native.state; },
  addEventListener: (_event: string, listener: (state: string) => void) => {
    // Native state changed after render, before this listener was installed.
    if (native.activateDuringSubscribe) native.state = 'active';
    native.listeners.add(listener);
    return { remove: () => native.listeners.delete(listener) };
  },
} }));

let tree: ReactTestRenderer | undefined;
function Probe() { return React.createElement('output', null, String(useAppActive())); }
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  native.state = 'background'; native.activateDuringSubscribe = false; native.listeners.clear();
  const original = console.error;
  vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    if (!String(args[0]).startsWith('react-test-renderer is deprecated')) original(...args);
  });
});
afterEach(async () => { await act(async () => tree?.unmount()); tree = undefined; vi.restoreAllMocks(); });

it('reconciles foreground state that changes between render and listener registration', async () => {
  native.activateDuringSubscribe = true;
  await act(async () => { tree = create(React.createElement(Probe)); });
  expect(tree!.root.findByType('output').props.children).toBe('true');
});

it('tracks subsequent foreground changes and removes its listener on unmount', async () => {
  native.state = 'active';
  await act(async () => { tree = create(React.createElement(Probe)); });
  expect(tree!.root.findByType('output').props.children).toBe('true');
  await act(async () => { native.state = 'background'; native.listeners.forEach((listener) => listener(native.state)); });
  expect(tree!.root.findByType('output').props.children).toBe('false');
  await act(async () => { native.state = 'active'; native.listeners.forEach((listener) => listener(native.state)); });
  expect(tree!.root.findByType('output').props.children).toBe('true');
  await act(async () => tree!.unmount()); tree = undefined;
  expect(native.listeners.size).toBe(0);
});
