import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(
  fs
    .readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i), l.slice(i + 1).replace(/^["']|["']$/g, '')];
    }),
);

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

for (const name of ['confirm_paid_order', 'claim_onboarding_xp', 'claim_teacher_role']) {
  const args =
    name === 'confirm_paid_order'
      ? { p_order_id: '00000000-0000-0000-0000-000000000000' }
      : {};
  const { error } = await sb.rpc(name, args);
  console.log(`${name}:`, error ? error.message || error.code || error : 'OK/callable');
}

const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});
const a = await anon.rpc('award_xp', {
  p_user_id: '00000000-0000-0000-0000-000000000000',
  p_xp: 1,
});
console.log('anon award_xp:', a.error ? a.error.message : 'STILL CALLABLE (bad)');

const d = await anon.from('global_dictionary').insert({ word: '__sec_probe__', translation: 'x' });
console.log('anon dict insert:', d.error ? d.error.message : 'STILL ALLOWED (bad)');
