import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import unicorn from 'eslint-plugin-unicorn';

export default [
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  unicorn.configs.recommended,
  {
    rules: {
      'unicorn/no-null': 'off',
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/filename-case': 'off',
      'unicorn/no-await-expression-member': 'off',
      'unicorn/no-array-callback-reference': 'off',
      'unicorn/prefer-array-some': 'off',
      'unicorn/prefer-includes-over-repeated-comparisons': 'off',
      'unicorn/prefer-top-level-await': 'off',
      'unicorn/no-nested-ternary': 'off',
      'preserve-caught-error': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
  { ignores: ['dist/**', 'node_modules/**'] },
];
