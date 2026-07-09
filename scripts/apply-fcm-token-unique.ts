/**
 * Apply migration 20260709_fcm_token_unique:
 * 1) Dedupe shared tokens (service role)
 * 2) CREATE UNIQUE INDEX nếu có DATABASE_URL / SUPABASE_DB_URL
 *
 *   npx tsx scripts/apply-fcm-token-unique.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

function loadEnvFile(filePath: string): void {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const raw of content.split(/\r?\n/)) {
    const line = raw.replace(/\r$/, '').trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key !== 'FIREBASE_PRIVATE_KEY' && key !== 'DATABASE_URL' && key !== 'SUPABASE_DB_URL') {
      value = value.replace(/\\r\\n$/g, '').replace(/\\n$/g, '').replace(/[\r\n]+$/g, '').trim();
    } else if (key === 'FIREBASE_PRIVATE_KEY' || key.includes('PRIVATE')) {
      value = value.replace(/\\n/g, '\n');
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

const root = path.resolve(__dirname, '..');
loadEnvFile(path.join(root, '.env.local'));
loadEnvFile(path.join(root, '.env.vercel-pull'));

const SQL_INDEX = `
create unique index if not exists fcm_tokens_token_unique
  on public.fcm_tokens (token);
`.trim();

async function dedupe(): Promise<number> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: rows, error } = await supabase
    .from('fcm_tokens')
    .select('id, user_id, token, last_used_at, created_at');

  if (error) throw new Error(`fcm_tokens select: ${error.message}`);

  const byToken = new Map<string, NonNullable<typeof rows>>();
  for (const r of rows ?? []) {
    const list = byToken.get(r.token) ?? [];
    list.push(r);
    byToken.set(r.token, list);
  }

  let deleted = 0;
  for (const [token, list] of byToken) {
    if (!list || list.length < 2) continue;
    list.sort((a, b) => {
      const ta = new Date(a.last_used_at || a.created_at || 0).getTime();
      const tb = new Date(b.last_used_at || b.created_at || 0).getTime();
      return tb - ta;
    });
    const keep = list[0];
    const drop = list.slice(1);
    console.log(
      `[Apply] shared token=${token.slice(0, 14)}… keep=${keep.user_id.slice(0, 8)} drop=${drop.length}`
    );
    for (const d of drop) {
      const { error: delErr } = await supabase.from('fcm_tokens').delete().eq('id', d.id);
      if (delErr) throw new Error(delErr.message);
      deleted += 1;
      await supabase
        .from('profiles')
        .update({ fcm_token: null })
        .eq('id', d.user_id)
        .eq('fcm_token', token);
    }
  }

  // Verify
  const { data: after } = await supabase.from('fcm_tokens').select('token');
  const counts = new Map<string, number>();
  for (const r of after ?? []) {
    counts.set(r.token, (counts.get(r.token) ?? 0) + 1);
  }
  const stillShared = [...counts.entries()].filter(([, n]) => n > 1);
  if (stillShared.length) {
    throw new Error(`Still ${stillShared.length} shared token(s) after dedupe`);
  }

  console.log(`[Apply] dedupe OK — rows=${after?.length ?? 0}, deleted=${deleted}`);
  return deleted;
}

async function tryCreateIndex(): Promise<'ok' | 'skip'> {
  const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || process.env.POSTGRES_URL;
  if (!dbUrl) {
    console.warn('[Apply] No DATABASE_URL — skip CREATE INDEX (cần chạy SQL trên Supabase Dashboard)');
    console.warn('[Apply] SQL:\n' + SQL_INDEX);
    return 'skip';
  }

  // Dynamic import pg nếu có
  let pg: typeof import('pg');
  try {
    pg = await import('pg');
  } catch {
    console.warn('[Apply] package `pg` missing — npm i pg rồi chạy lại, hoặc chạy SQL trên Dashboard');
    console.warn('[Apply] SQL:\n' + SQL_INDEX);
    return 'skip';
  }

  const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(SQL_INDEX);
    console.log('[Apply] CREATE UNIQUE INDEX fcm_tokens_token_unique — OK');
    return 'ok';
  } finally {
    await client.end();
  }
}

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[Apply] Missing Supabase env');
    process.exit(1);
  }

  await dedupe();
  const idx = await tryCreateIndex();
  console.log(`[Apply] DONE index=${idx}`);
  if (idx === 'skip') process.exitCode = 2; // signal: cần chạy SQL tay
}

main().catch((e) => {
  console.error('[Apply] Fatal:', e);
  process.exit(1);
});
