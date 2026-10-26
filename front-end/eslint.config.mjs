// ESLint flat config for the LingoPro Vite + React + TypeScript SPA.
//
// Guardrail rules (see docs/refactor-baseline.md):
//   - no direct `supabase.from(...)` / `supabase.rpc(...)` outside server route handlers ('error')
//   - no raw `fetch('/api/...')` / `authFetch('/api/...')` (use a domain service on top of apiClient)
//   - no `next` / `next/*` imports (Next.js leftovers resolved through src/shims)
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

/** Severity used for remaining refactor guardrails. */
const GUARDRAIL = 'warn';

const SUPABASE_QUERY_SELECTOR =
  "CallExpression[callee.type='MemberExpression'][callee.object.name=/^supabase$/i][callee.property.name=/^(from|rpc)$/]";
const SUPABASE_QUERY_MESSAGE =
  'Do not query Supabase directly from the client. Call a .NET endpoint through a domain service instead.';

/**
 * No-op stand-in for the removed `@next/next` plugin so the legacy
 * `eslint-disable-next-line @next/next/no-img-element` comments still resolve.
 * TODO: delete together with those comments when the Next.js leftovers are cleaned up.
 */
const legacyNextPluginStub = {
  rules: {
    'no-img-element': { meta: { type: 'problem', schema: [] }, create: () => ({}) },
  },
};

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
    ignores: ['dist/**', 'node_modules/**', 'src/.agents/**', 'src/data/**', 'android/**', 'ios/**', 'public/**'],
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
      '@next/next': legacyNextPluginStub,
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

      // Remaining refactor guardrails.
      'no-restricted-imports': [
        GUARDRAIL,
        {
          paths: [{ name: 'next', message: 'Next.js is not used in the Vite SPA. Use react-router-dom / plain React.' }],
          patterns: [
            {
              group: ['next/*'],
              message: 'Next.js is not used in the Vite SPA. Use react-router-dom / plain React instead of the shims.',
            },
          ],
        },
      ],
      // Raw fetch('/api/...') and authFetch(...) are strictly forbidden ('error') outside server routes.
      'no-restricted-syntax': ['error', ...restrictedSyntax],
    },
  },
  {
    // Legacy server-side route handlers and server-only helpers are allowed to query Supabase until ported to .NET.
    files: [
      'src/app/api/**',
      'src/lib/*-server.ts',
      'src/lib/admin-auth.ts',
      'src/lib/api-security.ts',
      'src/lib/daily-reading-generator.ts',
      'src/lib/dict-trie-engine.ts',
      'src/lib/foundation-curriculum/data-access.ts',
      'src/lib/ipa-resolve.ts',
      'src/lib/roadmap-credit.ts',
    ],
    rules: {
      'lingopro/no-supabase-query': 'off',
      'no-restricted-properties': 'off',
      'no-restricted-syntax': 'off',
    },
  },
  {
    // The Next.js compatibility shims necessarily reference the Next.js module names and type namespaces.
    files: ['src/shims/**'],
    rules: {
      'no-restricted-imports': 'off',
      '@typescript-eslint/no-namespace': 'off',
    },
  },
);
