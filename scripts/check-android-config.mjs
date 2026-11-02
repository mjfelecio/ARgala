import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { Buffer } from 'node:buffer';
import { fileURLToPath } from 'node:url';
import { getPngInfo } from '@expo/image-utils';

// A nonfunctional marker verifies native injection without requiring a secret.
const marker = 'argala-native-config-validation-only';
const result = spawnSync('npx', ['expo', 'config', '--type', 'introspect', '--json'], { encoding: 'utf8', env: { ...process.env, GOOGLE_MAPS_ANDROID_API_KEY: marker } });
assert.equal(result.status, 0, result.stderr);
const config = JSON.parse(result.stdout);
const staticConfig = JSON.parse(readFileSync(new URL('../app.json', import.meta.url), 'utf8')).expo;
const splash = value => value.plugins.find(plugin => Array.isArray(plugin) && plugin[0] === 'expo-splash-screen')[1];
assert.deepEqual(splash(config), splash(staticConfig), 'Static and dynamic splash configuration must agree');
assert.deepEqual(splash(config), {
  backgroundColor: '#174D38', image: './assets/images/splash-icon.png', imageWidth: 160,
  dark: { backgroundColor: '#174D38', image: './assets/images/splash-icon.png' },
});
assert.equal(config.android.adaptiveIcon.backgroundColor, '#174D38');
assert.deepEqual(config.android.adaptiveIcon, staticConfig.android.adaptiveIcon);
assert.equal(config.icon, staticConfig.icon);
const expectedAssets = [
  [config.icon, 1024], [config.android.adaptiveIcon.foregroundImage, 1024],
  [config.android.adaptiveIcon.backgroundImage, 1024], [config.android.adaptiveIcon.monochromeImage, 1024],
  [splash(config).image, 1024], [config.web.favicon, 32],
];
for (const [asset, size] of expectedAssets) {
  const png = readFileSync(new URL(`../${asset}`, import.meta.url));
  assert.deepEqual(png.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), `${asset} must be PNG`);
  assert.equal(png.readUInt32BE(16), size, `${asset} width`);
  assert.equal(png.readUInt32BE(20), size, `${asset} height`);
}
// Reuse Expo's installed PNG reader: validate actual pixels, including antialiasing.
// Keep all foreground pixels inside the central 66/108 safe circle, so OEM masks
// and launcher motion cannot crop the arch. The themed layer must be white alpha.
for (const asset of [config.android.adaptiveIcon.foregroundImage, config.android.adaptiveIcon.monochromeImage]) {
  const { width, height, data } = await getPngInfo(fileURLToPath(new URL(`../${asset}`, import.meta.url)));
  const radius = width * 33 / 108;
  let visible = 0;
  let transparent = 0;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const offset = (y * width + x) * 4;
    if (!data[offset + 3]) { transparent++; continue; }
    visible++;
    assert.ok(Math.hypot(x - (width - 1) / 2, y - (height - 1) / 2) <= radius, `${asset} exceeds the adaptive icon safe circle`);
    if (asset === config.android.adaptiveIcon.monochromeImage) {
      assert.ok(data[offset] === 255 && data[offset + 1] === 255 && data[offset + 2] === 255, 'Themed icon must be white alpha');
    }
  }
  assert.ok(visible > 0 && transparent > 0, `${asset} needs visible artwork and transparent margins`);
}
assert.equal(config.sdkVersion, '57.0.0');
assert.deepEqual(config.platforms, ['android']);
assert.equal(config.android.package, 'com.mjfelecio.argala');
const manifest = config._internal.modResults.android.manifest.manifest;
const permissions = new Map(manifest['uses-permission'].map((entry) => [entry.$['android:name'], entry.$]));
for (const name of ['CAMERA', 'ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION', 'ACCESS_BACKGROUND_LOCATION', 'POST_NOTIFICATIONS']) {
  assert.ok(permissions.has(`android.permission.${name}`), `Missing ${name}`);
  assert.notEqual(permissions.get(`android.permission.${name}`)['tools:node'], 'remove');
}
for (const name of ['RECORD_AUDIO', 'READ_EXTERNAL_STORAGE', 'READ_MEDIA_IMAGES', 'READ_MEDIA_VIDEO', 'READ_MEDIA_AUDIO', 'READ_MEDIA_VISUAL_USER_SELECTED', 'ACCESS_MEDIA_LOCATION']) assert.equal(permissions.get(`android.permission.${name}`)?.['tools:node'], 'remove');
assert.equal(permissions.get('android.permission.WRITE_EXTERNAL_STORAGE')?.['android:maxSdkVersion'], '29', 'Legacy gallery write must be restricted to the installed media API legacy path');
const foregroundLocation = permissions.get('android.permission.FOREGROUND_SERVICE_LOCATION');
assert.ok(!foregroundLocation || foregroundLocation['tools:node'] === 'remove', 'No continuous foreground location service is requested');
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
console.log('Android configuration passed: SDK 57, Android-only, optional AR, opt-in background reminders, save-only media, native Maps injection, EAS APK profiles.');
