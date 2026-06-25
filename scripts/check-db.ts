import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

function loadEnv(): void {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!match || process.env[match[1]]) continue;
    let value = match[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
}

async function check() {
  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing Supabase env vars!');
    return;
  }
  const client = createClient(url, key);
  const { data: lessons, error } = await client
    .from('grammar_lessons')
    .select('id, title, order_index, exercises');

  if (error) {
    console.error('Error fetching lessons:', error.message);
    return;
  }

  console.log(`=== DB Grammar Lessons Check (${lessons.length} lessons found) ===`);
  const sorted = [...lessons].sort((a, b) => a.order_index - b.order_index);
  for (const l of sorted) {
    const count = Array.isArray(l.exercises) ? l.exercises.length : 0;
    console.log(`ID: ${l.id} | Order: ${l.order_index.toString().padEnd(3)} | Title: ${l.title.padEnd(45)} | Exercises Count: ${count}`);
  }
}

check();
