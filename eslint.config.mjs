import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Cho phép bỏ qua biến/tham số/catch-error có tiền tố `_` (vd `_node` strip khỏi props).
  {
    rules: {
      // Bật dần React Compiler cho code cũ: vẫn hiển thị nhưng chưa chặn CI.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/static-components": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          args: "after-used",
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    ".chrome-bot-profiles/**",
    "tmp/**",
    "next-env.d.ts",
    // Standalone utility scripts (not part of Next.js build)
    "*.js",
    "*.mjs",
    "scripts/**",
    "scratch/**",
  ]),
]);

export default eslintConfig;
