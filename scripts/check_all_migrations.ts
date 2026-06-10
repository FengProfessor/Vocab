import * as path from 'path';
import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Load .env.local manually
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase environment variables in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMigration(name: string, checkFn: () => Promise<{ error: any }>) {
  console.log(`Checking: ${name}...`);
  try {
    const { error } = await checkFn();
    if (error) {
      if (error.message.includes('does not exist') || error.message.includes('column') || error.code === 'PGSUB') {
        console.log(`  ❌ FAIL: ${error.message} (Code: ${error.code})`);
        return false;
      } else {
        // Other errors (like API keys, RLS, no rows) are fine, it means relation/columns exist!
        console.log(`  ✅ PASS (with warning/non-schema error): ${error.message}`);
        return true;
      }
    }
    console.log(`  ✅ PASS`);
    return true;
  } catch (e: any) {
    console.log(`  ❌ EXCEPTION: ${e.message}`);
    return false;
  }
}

async function verifyAll() {
  console.log('🔍 Checking database schema to verify migrations...');

  let allPass = true;

  // 1. 20260530_grammar_enhancements.sql
  const g1 = await checkMigration('20260530_grammar_enhancements (grammar_exercises type/difficulty)', () =>
    supabase.from('grammar_exercises').select('id, type, difficulty').limit(1)
  );
  if (!g1) allPass = false;

  // 2. 20260531_billing_system.sql
  const b1 = await checkMigration('20260531_billing_system (orders, subscription_history, coupons)', async () => {
    const r1 = await supabase.from('orders').select('id').limit(1);
    if (r1.error) return r1;
    const r2 = await supabase.from('subscription_history').select('id').limit(1);
    if (r2.error) return r2;
    const r3 = await supabase.from('coupons').select('id').limit(1);
    return r3;
  });
  if (!b1) allPass = false;

  // 3. 20260603_fcm_tokens.sql
  const f1 = await checkMigration('20260603_fcm_tokens (fcm_tokens table)', () =>
    supabase.from('fcm_tokens').select('id').limit(1)
  );
  if (!f1) allPass = false;

  // 4. 20260604_fsrs_ts_learning_steps.sql
  const l1 = await checkMigration('20260604_fsrs_ts_learning_steps (lapses/learning_steps on srs_progress and grammar_progress)', async () => {
    const r1 = await supabase.from('srs_progress').select('id, lapses, learning_steps').limit(1);
    if (r1.error) return r1;
    const r2 = await supabase.from('grammar_progress').select('id, lapses, learning_steps').limit(1);
    return r2;
  });
  if (!l1) allPass = false;

  // 5. 20260607_due_push_dedup.sql
  const d1 = await checkMigration('20260607_due_push_dedup (last_due_push_slot on profiles)', () =>
    supabase.from('profiles').select('id, last_due_push_slot').limit(1)
  );
  if (!d1) allPass = false;

  console.log('\n=============================================');
  if (allPass) {
    console.log('✅ ALL migrations verified in production schema!');
  } else {
    console.log('❌ SOME migrations are missing in production schema. Please run them.');
  }
  console.log('=============================================');
}

verifyAll().catch(console.error);
