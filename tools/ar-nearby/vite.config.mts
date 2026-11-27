import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  resolve: { alias: { '@': fileURLToPath(new URL('../../src', import.meta.url)) } },
  server: { host: '127.0.0.1', fs: { allow: [fileURLToPath(new URL('../..', import.meta.url))] } },
});
