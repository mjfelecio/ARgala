import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));

// Validate the complete patch set before changing any dependency. Unsupported
// upgrades must fail installation instead of silently shipping unpatched code.
export function applyNativePatches(root = projectRoot, directory = resolve(projectRoot, 'patches'), check = false) {
  const patches = JSON.parse(readFileSync(resolve(directory, 'manifest.json'), 'utf8'));
  const pending = [];
  for (const patchName of patches) {
    const patch = JSON.parse(readFileSync(resolve(directory, patchName), 'utf8'));
    const packageRoot = resolve(root, 'node_modules', patch.package);
    const installed = JSON.parse(readFileSync(resolve(packageRoot, 'package.json'), 'utf8'));
    if (installed.version !== patch.version) throw new Error(`Native patch requires ${patch.package}@${patch.version}; found ${installed.version}. Review the patch before upgrading.`);
    for (const file of patch.files) {
      const path = resolve(packageRoot, file.path);
      const original = readFileSync(path, 'utf8');
      let updated = original;
      for (const { before, after } of file.changes) {
        if (updated.includes(after) && !updated.includes(before)) continue;
        if (updated.split(before).length !== 2 || updated.includes(after)) {
          throw new Error(`Native patch source mismatch: ${patch.package}/${file.path}. Review the installed source.`);
        }
        updated = updated.replace(before, after);
      }
      if (updated !== original) pending.push({ path, updated });
    }
  }
  if (check && pending.length) throw new Error('Native patches are missing. Run npm run postinstall before building.');
  for (const { path, updated } of pending) writeFileSync(path, updated);
  return pending.length;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const count = applyNativePatches(projectRoot, undefined, process.argv.includes('--check'));
  console.log(`Native patches verified (${count} file${count === 1 ? '' : 's'} updated).`);
}
