import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: ['dist', 'node_modules', 'eslint.config.*', 'tsup.config.ts', 'vitest.config.ts'],
  },

  js.configs.recommended,

  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  {
    ...importPlugin.flatConfigs.recommended,
    ...importPlugin.flatConfigs.typescript,

    files: ['src/**/*.ts', 'tests/**/*.ts'],

    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },

    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/no-relative-parent-imports': 'error',
    },
  },

  // 5) Disable formatting rules that conflict with Prettier
  eslintConfigPrettier,
];
