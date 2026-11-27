const { defineConfig, globalIgnores } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier/flat');

module.exports = defineConfig([
  globalIgnores([
    '.expo/**',
    'android/**',
    'ios/**',
    'dist/**',
    'build/**',
    'coverage/**',
  ]),
  expoConfig,
  prettierConfig,
]);
