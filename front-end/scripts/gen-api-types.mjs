#!/usr/bin/env node
/**
 * Generates or updates `src/types/api/schema.d.ts` from the .NET 10 Swagger OpenAPI JSON endpoint
 * (`http://localhost:5000/swagger/v1/swagger.json`) or a local `swagger.json` file.
 *
 * Usage:
 *   npm run gen:api
 *   SWAGGER_URL=http://localhost:5000/swagger/v1/swagger.json npm run gen:api
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const outputPath = path.join(rootDir, 'src', 'types', 'api', 'schema.d.ts');
const swaggerUrl = process.env.SWAGGER_URL || 'http://localhost:5000/swagger/v1/swagger.json';
const localSwaggerFile = process.env.SWAGGER_FILE || path.join(rootDir, 'swagger.json');

async function main() {
  let source = null;

  if (fs.existsSync(localSwaggerFile)) {
    source = localSwaggerFile;
  } else {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(swaggerUrl, { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        source = swaggerUrl;
      }
    } catch {
      // .NET server is not running locally; preserve checked-in schema.d.ts
    }
  }

  if (!source) {
    console.log(
      `[gen:api] Swagger endpoint (${swaggerUrl}) is offline and no local swagger.json was found. Keeping checked-in ${path.relative(rootDir, outputPath)}.`,
    );
    return;
  }

  console.log(`[gen:api] Generating OpenAPI TypeScript types from ${source}...`);
  execSync(`npx openapi-typescript "${source}" -o "${outputPath}"`, {
    cwd: rootDir,
    stdio: 'inherit',
  });
}

main().catch((err) => {
  console.error('[gen:api] Failed:', err);
  process.exit(1);
});
