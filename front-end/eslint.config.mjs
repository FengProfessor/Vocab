// ESLint flat config for the LingoPro Vite + React + TypeScript SPA.
//
// Guardrail rules (see docs/refactor-baseline.md):
//   - no direct `supabase.from(...)` / `supabase.rpc(...)` ('error')
//   - no raw `fetch('/api/...')` / `authFetch('/api/...')` ('error')
//   - no `next` / `next/*` imports ('error')
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

const SUPABASE_QUERY_SELECTOR =
  "CallExpression[callee.type='MemberExpression'][callee.object.name=/^supabase$/i][callee.property.name=/^(from|rpc)$/]";
const SUPABASE_QUERY_MESSAGE =
  'Do not query Supabase directly from the client. Call a .NET endpoint through a domain service instead.';

const lingoproGuardrailPlugin = {
  rules: {
    'no-supabase-query': {
      meta: { type: 'problem', schema: [] },
      create: (context) => ({
        [SUPABASE_QUERY_SELECTOR](node) {
          context.report({ node, message: SUPABASE_QUERY_MESSAGE });
        },
      }),
    },
  },
};

const restrictedSyntax = [
  {
    selector: "CallExpression[callee.name='authFetch']",
    message: 'authFetch has been removed. Use a domain service built on apiClient.',
  },
  {
    selector: "CallExpression[callee.name=/^(fetch|authFetch)$/][arguments.0.type='Literal'][arguments.0.value=/^\\/api\\//]",
    message: "Raw fetch('/api/...') is forbidden. Use a domain service built on apiClient.",
  },
  {
    selector: "CallExpression[callee.name=/^(fetch|authFetch)$/][arguments.0.type='TemplateLiteral'][arguments.0.quasis.0.value.raw=/^\\/api\\//]",
    message: 'Raw fetch(`/api/...`) is forbidden. Use a domain service built on apiClient.',
  },
  {
    selector: "CallExpression[callee.object.name='window'][callee.property.name='fetch'][arguments.0.value=/^\\/api\\//]",
    message: "Raw window.fetch('/api/...') is forbidden. Use a domain service built on apiClient.",
  },
];

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', '.agents/**', 'src/data/**', 'android/**', 'ios/**', 'public/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx,mts,js,jsx,mjs}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      'react-hooks': reactHooks,
      lingopro: lingoproGuardrailPlugin,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Legacy code relies heavily on these; keep them visible without blocking `npm run check`.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          args: 'after-used',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/no-unused-expressions': 'warn',
      'no-empty': 'warn',
      'no-useless-escape': 'warn',
      'no-control-regex': 'warn',
      'prefer-const': 'warn',

      // Direct client Supabase queries are strictly forbidden ('error').
      'lingopro/no-supabase-query': 'error',
      'no-restricted-properties': [
        'error',
        {
          object: 'supabase',
          property: 'from',
          message: SUPABASE_QUERY_MESSAGE,
        },
        {
          object: 'supabase',
          property: 'rpc',
          message: SUPABASE_QUERY_MESSAGE,
        },
      ],

      // Next.js imports are strictly forbidden ('error').
      'no-restricted-imports': [
        'error',
        {
          paths: [{ name: 'next', message: 'Next.js is not used in the Vite SPA. Use react-router-dom / plain React.' }],
          patterns: [
            {
              group: ['next/*'],
              message: 'Next.js is not used in the Vite SPA. Use react-router-dom / plain React.',
            },
          ],
        },
      ],
      // Raw fetch('/api/...') and authFetch(...) are strictly forbidden ('error').
      'no-restricted-syntax': ['error', ...restrictedSyntax],
    },
  },
);
