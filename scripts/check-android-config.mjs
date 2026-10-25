import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

// A nonfunctional marker verifies native injection without requiring a secret.
const marker = 'argala-native-config-validation-only';
const result = spawnSync('npx', ['expo', 'config', '--type', 'introspect', '--json'], { encoding: 'utf8', env: { ...process.env, GOOGLE_MAPS_ANDROID_API_KEY: marker } });
assert.equal(result.status, 0, result.stderr);
const config = JSON.parse(result.stdout);
assert.equal(config.sdkVersion, '57.0.0');
assert.deepEqual(config.platforms, ['android']);
assert.equal(config.android.package, 'com.mjfelecio.argala');
const manifest = config._internal.modResults.android.manifest.manifest;
const permissions = new Map(manifest['uses-permission'].map((entry) => [entry.$['android:name'], entry.$]));
for (const name of ['CAMERA', 'ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION']) {
  assert.ok(permissions.has(`android.permission.${name}`), `Missing ${name}`);
  assert.notEqual(permissions.get(`android.permission.${name}`)['tools:node'], 'remove');
}
for (const name of ['RECORD_AUDIO', 'ACCESS_BACKGROUND_LOCATION']) assert.equal(permissions.get(`android.permission.${name}`)?.['tools:node'], 'remove');
const metadata = manifest.application[0]['meta-data'];
assert.ok(metadata.some(entry => entry.$['android:name'] === 'com.google.ar.core' && entry.$['android:value'] === 'optional'), 'AR services must be optional for ordinary map users');
for (const name of ['android.hardware.camera', 'android.hardware.camera.ar']) {
  assert.ok(manifest['uses-feature'].some(entry => entry.$['android:name'] === name && entry.$['android:required'] === 'false'), `${name} must not exclude non-AR devices`);
}
assert.ok(metadata.some((entry) => entry.$['android:name'] === 'com.google.android.geo.API_KEY' && entry.$['android:value'] === marker), 'Maps key must enter native Android metadata');
assert.equal(config.extra.mapsConfigured, true);
const eas = JSON.parse(readFileSync(new URL('../eas.json', import.meta.url), 'utf8'));
assert.equal(eas.build.preview.android.buildType, 'apk');
assert.equal(eas.build.development.developmentClient, true);
assert.equal(eas.build.preview.distribution, 'internal');
console.log('Android configuration passed: SDK 57, Android-only, foreground/camera permissions, audio/background blocked, native Maps injection, EAS APK profiles.');
