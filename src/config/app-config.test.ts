import { afterEach, expect, it, vi } from 'vitest';
import configure from '../../app.config';

afterEach(() => vi.unstubAllEnvs());
it('retains the linked EAS project from app.json for non-interactive Android builds', () => {
  vi.stubEnv('EAS_PROJECT_ID', undefined);
  expect(configure({ projectRoot: '/project', staticConfigPath: '/project/app.json', packageJsonPath: '/project/package.json', config: { name: 'ARgala', slug: 'argala', extra: { eas: { projectId: 'existing-project' } } } } as Parameters<typeof configure>[0]).extra?.eas.projectId).toBe('existing-project');
});
it('allows the explicit EAS project environment override', () => {
  vi.stubEnv('EAS_PROJECT_ID', 'override-project');
  expect(configure({ projectRoot: '/project', staticConfigPath: '/project/app.json', packageJsonPath: '/project/package.json', config: { name: 'ARgala', slug: 'argala', extra: { eas: { projectId: 'existing-project' } } } } as Parameters<typeof configure>[0]).extra?.eas.projectId).toBe('override-project');
});
