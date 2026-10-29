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

it('selects only local Android AR without enabling cloud providers or recording permissions', () => {
  const config = configure({ config: { name: 'ARgala', slug: 'argala' } } as Parameters<typeof configure>[0]);
  expect(config.plugins).toContainEqual(['@reactvision/react-viro', { android: { xRMode: ['AR'] }, provider: 'none' }]);
  expect(config.android?.blockedPermissions).toContain('android.permission.RECORD_AUDIO');
  expect(config.plugins).toContainEqual(['expo-location', { isAndroidBackgroundLocationEnabled: true, isAndroidForegroundServiceEnabled: false }]);
  expect(config.android?.blockedPermissions).not.toContain('android.permission.ACCESS_BACKGROUND_LOCATION');
  expect(config.android?.blockedPermissions).toContain('android.permission.FOREGROUND_SERVICE_LOCATION');
  expect(config.android?.blockedPermissions).toContain('android.permission.READ_MEDIA_IMAGES');
});
