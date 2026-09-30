import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const source = fs.readFileSync('next.config.ts', 'utf8');
const output = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const original = process.env.NODE_ENV;
try {
  for (const mode of ['development', 'production', 'test']) {
    process.env.NODE_ENV = mode;
    const { default: config } = await import(`data:text/javascript;base64,${Buffer.from(`${output}\n// ${mode}`).toString('base64')}`);
    const headers = await config.headers();
    const csp = headers.find((entry) => entry.source === '/((?!firebase-messaging-sw).*)')
      .headers.find((header) => header.key === 'Content-Security-Policy').value;
    assert.equal(csp.includes("'unsafe-eval'"), mode === 'development');
    for (const required of ["object-src 'none'", "base-uri 'self'", "form-action 'self'", 'https://www.gstatic.com', 'https://*.supabase.co', 'https://us.i.posthog.com', 'https://www.youtube.com', 'https://storage.googleapis.com']) {
      assert(csp.includes(required), `${mode}: missing ${required}`);
    }
    for (const path of ['/firebase-messaging-sw', '/firebase-messaging-sw.js']) {
      const swCsp = headers.find((entry) => entry.source === path)
        .headers.find((header) => header.key === 'Content-Security-Policy').value;
      assert(swCsp.includes("script-src 'self' https://www.gstatic.com"));
      assert(!swCsp.includes('unsafe-'));
    }
  }
  console.log('[CSP] development/production policy and FCM exceptions PASS');
} finally {
  if (original === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = original;
}
