/**
 * Apply P0 security/billing migrations to production Postgres.
 *
 * Requires one of:
 *   DATABASE_URL / SUPABASE_DB_URL
 *   SUPABASE_DB_PASSWORD (+ optional SUPABASE_PROJECT_REF, SUPABASE_DB_REGION)
 *
 * Usage:
 *   node scripts/apply-p0-migrations.mjs
 *   node scripts/apply-p0-migrations.mjs --dry-run
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dryRun = process.argv.includes('--dry-run');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const i = line.indexOf('=');
    const k = line.slice(0, i).trim();
    const v = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
    if (!(k in process.env)) process.env[k] = v;
  }
}

loadEnvFile(path.join(root, '.env.local'));
loadEnvFile(path.join(root, '.env'));

function buildConnectionString() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (process.env.SUPABASE_DB_URL) return process.env.SUPABASE_DB_URL;

  const password = process.env.SUPABASE_DB_PASSWORD;
  if (!password) return null;

  const ref =
    process.env.SUPABASE_PROJECT_REF ||
    (process.env.NEXT_PUBLIC_SUPABASE_URL || '')
      .replace('https://', '')
      .split('.')[0];
  // Project LingoPro pooler is aws-1 (not aws-0). Override with SUPABASE_DB_POOLER_HOST.
  const region = process.env.SUPABASE_DB_REGION || 'ap-southeast-1';
  const user = `postgres.${ref}`;
  const host =
    process.env.SUPABASE_DB_POOLER_HOST ||
    `aws-1-${region}.pooler.supabase.com`;
  return `postgresql://${user}:${encodeURIComponent(password)}@${host}:6543/postgres`;
}

const MIGRATIONS = [
  'supabase/migrations/20260710_security_hardening.sql',
  'supabase/migrations/20260710_atomic_paid_order_confirmation.sql',
];

async function main() {
  const cs = buildConnectionString();
  if (!cs) {
    console.error('[ApplyMigrations] Missing DATABASE_URL or SUPABASE_DB_PASSWORD');
    console.error('  Set SUPABASE_DB_PASSWORD from Supabase Dashboard → Project Settings → Database');
    process.exit(2);
  }

  console.log('[ApplyMigrations] dryRun=', dryRun);
  const client = new pg.Client({
    connectionString: cs,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15_000,
  });

  await client.connect();
  console.log('[ApplyMigrations] connected');

  try {
    for (const rel of MIGRATIONS) {
      const full = path.join(root, rel);
      const sql = fs.readFileSync(full, 'utf8');
      console.log(`[ApplyMigrations] >>> ${rel} (${sql.length} bytes)`);
      if (dryRun) continue;
      await client.query('begin');
      try {
        await client.query(sql);
        await client.query('commit');
        console.log(`[ApplyMigrations] OK ${rel}`);
      } catch (err) {
        await client.query('rollback');
        console.error(`[ApplyMigrations] FAIL ${rel}:`, err.message);
        throw err;
      }
    }

    // Post-apply probes
    const probes = [
      `select proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
       where n.nspname='public' and proname in
       ('confirm_paid_order','claim_onboarding_xp','claim_teacher_role','award_xp')
       order by 1`,
    ];
    for (const q of probes) {
      const { rows } = await client.query(q);
      console.log('[ApplyMigrations] functions:', rows.map((r) => r.proname).join(', '));
    }
  } finally {
    await client.end();
  }

  console.log('[ApplyMigrations] done');
}

main().catch((err) => {
  console.error('[ApplyMigrations] fatal:', err.message);
  process.exit(1);
});
