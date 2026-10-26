// ESLint flat config for the LingoPro Vite + React + TypeScript SPA.
//
// Guardrail rules (see docs/refactor-baseline.md):
//   - no direct `supabase.from(...)` / `supabase.rpc(...)` outside src/lib/supabase.ts
//   - no raw `fetch('/api/...')` / `authFetch('/api/...')` (use a domain service on top of apiClient)
//   - no `next` / `next/*` imports (Next.js leftovers resolved through src/shims)
// They are "warn" today so the existing code keeps linting; the follow-up refactor steps will raise
// each one to "error" as soon as the matching legacy usages have been migrated.
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

/** Severity used for the refactor guardrails. TODO: raise to "error" once legacy call sites are migrated. */
const GUARDRAIL = 'warn';

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

const restrictedSyntax = [
  {
    selector: "CallExpression[callee.type='MemberExpression'][callee.object.name=/^supabase$/i][callee.property.name=/^(from|rpc)$/]",
    message: 'Do not query Supabase directly from the client. Call a .NET endpoint through a domain service instead.',
  },
  {
    selector: "CallExpression[callee.name=/^(fetch|authFetch)$/][arguments.0.type='Literal'][arguments.0.value=/^\\/api\\//]",
    message: "Raw fetch('/api/...') is deprecated. Use a domain service built on apiClient.",
  },
  {
    selector: "CallExpression[callee.name=/^(fetch|authFetch)$/][arguments.0.type='TemplateLiteral'][arguments.0.quasis.0.value.raw=/^\\/api\\//]",
    message: 'Raw fetch(`/api/...`) is deprecated. Use a domain service built on apiClient.',
  },
  {
    selector: "CallExpression[callee.object.name='window'][callee.property.name='fetch'][arguments.0.value=/^\\/api\\//]",
    message: "Raw window.fetch('/api/...') is deprecated. Use a domain service built on apiClient.",
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
    plugins: { 'react-hooks': reactHooks, '@next/next': legacyNextPluginStub },
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

      // Refactor guardrails.
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
      'no-restricted-syntax': [GUARDRAIL, ...restrictedSyntax],
    },
  },
  {
    // The Supabase client module itself is the only place allowed to build Supabase queries.
    files: ['src/lib/supabase.ts'],
    rules: {
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
