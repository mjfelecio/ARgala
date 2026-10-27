import { afterEach, expect, it, vi } from 'vitest';
import { loadDraftRingContent } from './draft-content-loader';
const loaded = vi.hoisted(() => vi.fn());
vi.mock('./development-aclc-research', () => { loaded(); return { developmentResearchRingContent: [{ id: 'overview', titleKey: 'aclcResearch.overview.title', bodyKey: 'aclcResearch.overview.body' }] }; });
afterEach(() => { vi.unstubAllEnvs(); loaded.mockClear(); });
it('does not evaluate ACLC data for a different selected destination', async () => {
 Object.assign(globalThis, { __DEV__: true }); vi.stubEnv('EXPO_PUBLIC_VIRO_SPIKE', '1');
 expect(await loadDraftRingContent('D01')).toBeNull(); expect(loaded).not.toHaveBeenCalled();
});
it('does not evaluate draft data in release despite the public flag', async () => {
 Object.assign(globalThis, { __DEV__: false }); vi.stubEnv('EXPO_PUBLIC_VIRO_SPIKE', '1');
 expect(await loadDraftRingContent('pilot-aclc')).toBeNull(); expect(loaded).not.toHaveBeenCalled();
});
