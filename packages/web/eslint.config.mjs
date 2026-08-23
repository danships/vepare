import nextConfig from 'eslint-config-next/core-web-vitals';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';

const eslintConfig = [
  ...nextConfig,
  eslintPluginUnicorn.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      'unicorn/no-useless-undefined': 'off',
      'unicorn/no-null': 'off',
      quotes: 'off',
      'unicorn/filename-case': [
        'error',
        {
          case: 'kebabCase',
          ignore: [String.raw`^\[`],
        },
      ],
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
  {
    settings: {
      react: {
        version: '19.2.8',
      },
    },
  },
  {
    ignores: ['node_modules/**', '.next/**', 'out/**', 'build/**', 'next-env.d.ts', '**/.next/**', '**/node_modules/**'],
  },
  {
    ignores: ['**/*.js', '**/*.jsx', '**/*.mjs', '**/*.cjs'],
  },
];

export default eslintConfig;
