import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, appendFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const tests = join(root, 'patches/viro-touch/tests');
const wrapper = join(tests, process.platform === 'win32' ? 'gradlew.bat' : 'gradlew');
function gradle(directory, args, expectedFailure) {
  const windows = process.platform === 'win32';
  const result = spawnSync(windows ? 'cmd.exe' : wrapper, [...(windows ? ['/d', '/s', '/c', wrapper] : []), '-p', directory, '--console=plain', '--max-workers=2', ...args], {
    encoding: 'utf8', timeout: 300_000, maxBuffer: 8 * 1024 * 1024,
  });
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  if (expectedFailure) {
    assert.notEqual(result.status, 0, 'unreviewed binary/version must fail');
    assert.ok(output.includes(expectedFailure), output);
  } else {
    if (result.status !== 0) throw new Error(output, { cause: result.error });
    console.log(output.trim());
  }
}

// Java/Robolectric only: this never assembles, installs or starts an APK.
gradle(tests, ['test']);
const fixture = mkdtempSync(join(tmpdir(), 'argala-viro-guard-'));
try {
  const packageDirectory = join(fixture, 'node_modules/@reactvision/react-viro');
  const renderer = join(packageDirectory, 'android/viro_renderer');
  const patches = join(fixture, 'patches');
  mkdirSync(renderer, { recursive: true });
  mkdirSync(join(patches, 'viro-touch'), { recursive: true });
  const installedRenderer = join(root, 'node_modules/@reactvision/react-viro/android/viro_renderer');
  copyFileSync(join(installedRenderer, 'build.gradle'), join(renderer, 'build.gradle'));
  copyFileSync(join(installedRenderer, 'viro_renderer-release.aar'), join(renderer, 'viro_renderer-release.aar'));
  copyFileSync(join(root, 'patches/viro-touch/renderer.gradle'), join(patches, 'viro-touch/renderer.gradle'));
  const metadataPath = join(patches, 'react-viro+3.0.3.json');
  const metadata = readFileSync(join(root, 'patches/react-viro+3.0.3.json'), 'utf8');
  writeFileSync(metadataPath, metadata);
  writeFileSync(join(packageDirectory, 'package.json'), '{"version":"3.0.3"}');
  writeFileSync(join(fixture, 'settings.gradle'), "rootProject.name = 'viro-guard-fixture'\ninclude ':viro_renderer'\nproject(':viro_renderer').projectDir = file('node_modules/@reactvision/react-viro/android/viro_renderer')\n");
  const extraction = ['--configuration-cache', ':viro_renderer:extractArgalaViroRenderer'];
  gradle(fixture, extraction); // No Android SDK needed, including cached extraction.
  writeFileSync(metadataPath, JSON.stringify({ ...JSON.parse(metadata), listenerClassSha256: '0'.repeat(64) }));
  gradle(fixture, extraction, 'listener class mismatch');
  writeFileSync(metadataPath, metadata);
  gradle(fixture, extraction);
  writeFileSync(join(packageDirectory, 'package.json'), '{"version":"3.0.4"}');
  gradle(fixture, extraction, 'requires 3.0.3');
  writeFileSync(join(packageDirectory, 'package.json'), '{"version":"3.0.3"}');
  gradle(fixture, extraction);
  appendFileSync(join(renderer, 'viro_renderer-release.aar'), 'unreviewed');
  gradle(fixture, extraction, 'renderer archive mismatch');
  console.log('Viro guards passed: version, AAR checksum and original listener checksum.');
} finally {
  rmSync(fixture, { recursive: true, force: true });
}
