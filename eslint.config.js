const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  { ignores: ['.expo/**', '.worktrees/**', 'dist/**', 'android/**', 'ios/**', '.superpowers/**', '.code-review-graph/**', '.agents/**', 'supabase/functions/**'] },
]);
