import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';

// Node has no Metro asset registry. Resolve real bundled files to stable numeric
// handles at the native boundary; content tests independently verify their bytes.
const nativeRequire = createRequire(import.meta.url);
for (const extension of ['.jpg', '.webp', '.png']) {
  nativeRequire.extensions[extension] = (module, filename) => {
    module.exports = createHash('sha256').update(filename).digest().readUInt32BE(0) || 1;
  };
}
