import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterEach, expect, it } from 'vitest';

const runner = pathToFileURL(resolve('scripts/apply-native-patches.mjs')).href;
const roots: string[] = [];
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'argala-native-patch-'));
  roots.push(root);
  const directory = join(root, 'patches');
  const dependency = join(root, 'node_modules', 'camera');
  mkdirSync(directory); mkdirSync(dependency, { recursive: true });
  writeFileSync(join(dependency, 'package.json'), JSON.stringify({ version: '1.0.0' }));
  writeFileSync(join(dependency, 'preview.kt'), 'mode = PERFORMANCE\n');
  writeFileSync(join(directory, 'manifest.json'), '["camera.json"]');
  writeFileSync(join(directory, 'camera.json'), JSON.stringify({ package: 'camera', version: '1.0.0', files: [
    { path: 'preview.kt', changes: [{ before: 'mode = PERFORMANCE', after: 'mode = COMPATIBLE' }] },
  ] }));
  const run = (check = false) => spawnSync(process.execPath, ['--input-type=module', '-e',
    `import { applyNativePatches } from ${JSON.stringify(runner)}; applyNativePatches(process.argv[1], process.argv[2], process.argv[3] === 'check');`,
    root, directory, check ? 'check' : 'apply'], { encoding: 'utf8' });
  return { root, directory, dependency, run, source: () => readFileSync(join(dependency, 'preview.kt'), 'utf8') };
}
afterEach(() => { roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })); });

it('applies native changes on installation and accepts a second installation unchanged', () => {
  const f = fixture();
  expect(f.run().status).toBe(0);
  expect(f.source()).toBe('mode = COMPATIBLE\n');
  expect(f.run().status).toBe(0);
  expect(f.source()).toBe('mode = COMPATIBLE\n');
  expect(f.run(true).status).toBe(0);
});
it('detects missing patches without changing installed source in check mode', () => {
  const f = fixture();
  expect(f.run(true).stderr).toContain('Native patches are missing');
  expect(f.source()).toBe('mode = PERFORMANCE\n');
});
it('rejects a dependency upgrade instead of silently applying an unreviewed patch', () => {
  const f = fixture();
  writeFileSync(join(f.dependency, 'package.json'), JSON.stringify({ version: '2.0.0' }));
  const result = f.run();
  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain('Native patch requires camera@1.0.0; found 2.0.0');
  expect(f.source()).toBe('mode = PERFORMANCE\n');
});
it('rejects unexpected or ambiguous source without overwriting it', () => {
  const f = fixture();
  for (const source of ['mode = UNKNOWN\n', 'mode = PERFORMANCE\nmode = PERFORMANCE\n']) {
    writeFileSync(join(f.dependency, 'preview.kt'), source);
    expect(f.run().stderr).toContain('Native patch source mismatch');
    expect(f.source()).toBe(source);
  }
});
it('validates every patch before writing any dependency', () => {
  const f = fixture();
  writeFileSync(join(f.directory, 'manifest.json'), '["camera.json", "missing.json"]');
  expect(f.run().status).not.toBe(0);
  expect(f.source()).toBe('mode = PERFORMANCE\n');
});
