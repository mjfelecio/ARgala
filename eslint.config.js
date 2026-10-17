const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  { ignores: ['dist/**', 'android/**', 'ios/**', '.superpowers/**', '.code-review-graph/**', 'supabase/functions/**'] },
]);
