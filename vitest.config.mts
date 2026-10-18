import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: { server: { deps: { inline: ['heroui-native'] } }, include: ['src/**/*.test.{ts,tsx}', 'supabase/functions/_shared/**/*.test.ts'], environment: 'node' },
});
