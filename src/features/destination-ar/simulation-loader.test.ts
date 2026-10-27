import { afterEach, expect, it, vi } from 'vitest';
import { simulateArEntry } from './simulation-loader';
afterEach(() => { vi.unstubAllEnvs(); });
it.each([false, true])('does not invoke simulation with release/disabled guards (%s)', development => {
 Object.assign(globalThis, { __DEV__: development }); vi.stubEnv('EXPO_PUBLIC_VIRO_SPIKE', development ? '0' : '1');
 const beginSimulation = vi.fn();
 return simulateArEntry({ beginSimulation }, 'draft', 'en').then(value => { expect(value).toBeNull(); expect(beginSimulation).not.toHaveBeenCalled(); });
});
it('lazily hands an opted-in explicit action to its current source lease', async () => {
 Object.assign(globalThis, { __DEV__: true }); vi.stubEnv('EXPO_PUBLIC_VIRO_SPIKE', '1');
 const beginSimulation = vi.fn(() => 'local-handle');
 expect(await simulateArEntry({ beginSimulation }, 'draft', 'ja')).toBe('local-handle');
 expect(beginSimulation).toHaveBeenCalledWith('draft', 'ja');
});
