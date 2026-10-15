/**
 * Verification & Migration apply helper for reading_articles and user_reading_library_progress.
 *
 * Checks if reading_articles and user_reading_library_progress tables exist in Supabase.
 * If DATABASE_URL / SUPABASE_DB_URL is available, attempts to apply the migration.
 * Otherwise, outputs the exact SQL path and instructions.
 *
 * Usage:
 *   npx tsx scripts/apply-reading-library-migration.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const MIGRATION_PATH = path.resolve(
  process.cwd(),
  'supabase/migrations/20261015_reading_library_articles.sql'
);

async function checkTableExists(table: string): Promise<boolean> {
  try {
    const { error } = await supabase.from(table).select('id').limit(1);
    if (!error) return true;
    if (
      error.message.includes('Could not find the table') ||
      error.message.includes('does not exist')
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

async function main() {
  console.log('=== Checking Reading Library Database Schema ===\n');

  const raExists = await checkTableExists('reading_articles');
  const urlpExists = await checkTableExists('user_reading_library_progress');

  console.log(`- public.reading_articles:                 ${raExists ? '✅ EXISTS' : '❌ MISSING'}`);
  console.log(`- public.user_reading_library_progress:   ${urlpExists ? '✅ EXISTS' : '❌ MISSING'}`);

  if (raExists && urlpExists) {
    console.log('\n🎉 Both tables exist in the database! Schema is fully verified.');
    return;
  }

  console.log('\n⚠️ Tables are missing in Supabase schema.');

  const dbUrl =
    process.env.DATABASE_URL ||
    process.env.SUPABASE_DB_URL ||
    process.env.POSTGRES_URL;

  if (dbUrl) {
    console.log('Detected DB connection string. Attempting to apply migration via pg client...');
    try {
      const pg = await import('pg');
      const client = new pg.default.Client({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false },
      });
      await client.connect();
      const sql = fs.readFileSync(MIGRATION_PATH, 'utf8');
      await client.query(sql);
      await client.end();
      console.log('✅ Migration applied successfully via PostgreSQL client!');
      return;
    } catch (e: any) {
      console.warn('Direct connection failed:', e.message);
    }
  }

  const projectRef = (process.env.NEXT_PUBLIC_SUPABASE_URL || '')
    .replace('https://', '')
    .split('.')[0];

  console.log('\n────────────────────────────────────────────────────────────');
  console.log('👉 HƯỚNG DẪN KÍCH HOẠT TRÊN SUPABASE DASHBOARD / CI MIGRATIONS:');
  console.log(`1. Đăng nhập https://supabase.com/dashboard/project/${projectRef || 'jyhdxhqkftirncbstfpe'}`);
  console.log('2. Chọn mục "SQL Editor" ở thanh menu bên trái.');
  console.log('3. Dán toàn bộ nội dung tệp sau và bấm "RUN":');
  console.log(`   ${MIGRATION_PATH}`);
  console.log('────────────────────────────────────────────────────────────\n');
}

main().catch(console.error);
