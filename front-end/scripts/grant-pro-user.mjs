import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envPath = path.join(root, '.env.local');

for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  const k = m[1].trim();
  let v = m[2].trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  if (!process.env[k]) process.env[k] = v;
}

const email = process.argv[2];
const monthsToAdd = parseInt(process.argv[3] || '1', 10);

if (!email) {
  console.error('Error: Email argument required. Usage: node scripts/grant-pro-user.mjs <email> [months]');
  process.exit(1);
}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

async function grantPro() {
  console.log(`[GrantPro] Looking up profile for: ${email}`);
  const { data: profile, error: profileErr } = await sb
    .from('profiles')
    .select('id, email, full_name, plan, plan_expires_at, role')
    .eq('email', email)
    .maybeSingle();

  if (profileErr || !profile) {
    console.error(`[GrantPro] User not found: ${profileErr?.message || 'Profile does not exist'}`);
    process.exit(1);
  }

  const now = new Date();
  let startsAt = now;
  if (profile.plan_expires_at) {
    const curExp = new Date(profile.plan_expires_at);
    if (curExp > now) {
      startsAt = curExp;
      console.log(`[GrantPro] User already has active plan until: ${curExp.toISOString()}. Stacking +${monthsToAdd} month(s).`);
    }
  }

  const expiresAt = new Date(startsAt);
  expiresAt.setMonth(expiresAt.getMonth() + monthsToAdd);

  console.log(`[GrantPro] Upgrading user: ${profile.full_name || profile.email} (${profile.id})`);
  console.log(`[GrantPro] Current plan: ${profile.plan} (expires: ${profile.plan_expires_at || 'never / null'})`);
  console.log(`[GrantPro] New plan: pro`);
  console.log(`[GrantPro] Starts at: ${startsAt.toISOString()}`);
  console.log(`[GrantPro] Expires at: ${expiresAt.toISOString()}`);

  // 1. Create order
  const orderPayload = {
    user_id: profile.id,
    plan: 'pro',
    amount: 0,
    currency: 'VND',
    payment_method: 'manual',
    status: 'paid',
    order_kind: 'individual',
    seats: 1,
    period_months: monthsToAdd,
    starts_at: startsAt.toISOString(),
    expires_at: expiresAt.toISOString(),
    paid_at: now.toISOString(),
    note: `Admin manual upgrade: +${monthsToAdd} month(s) Pro`,
  };

  const { data: order, error: orderErr } = await sb
    .from('orders')
    .insert(orderPayload)
    .select('id')
    .single();

  if (orderErr) {
    console.warn(`[GrantPro] Warning: Failed to insert order (${orderErr.message}), continuing profile update...`);
  } else {
    console.log(`[GrantPro] Order recorded successfully: ${order.id}`);
  }

  // 2. Update profile
  const { data: updatedProfile, error: updateErr } = await sb
    .from('profiles')
    .update({
      plan: 'pro',
      plan_expires_at: expiresAt.toISOString(),
    })
    .eq('id', profile.id)
    .select('id, email, full_name, plan, plan_expires_at')
    .single();

  if (updateErr) {
    console.error(`[GrantPro] Error updating profile: ${updateErr.message}`);
    process.exit(1);
  }

  // 3. Log to subscription_history
  const histPayload = {
    user_id: profile.id,
    old_plan: profile.plan || 'free',
    new_plan: 'pro',
    reason: 'admin_manual',
    order_id: order?.id || null,
  };

  const { error: histErr } = await sb
    .from('subscription_history')
    .insert(histPayload);

  if (histErr) {
    console.warn(`[GrantPro] Warning: Failed to insert subscription_history (${histErr.message})`);
  } else {
    console.log(`[GrantPro] Subscription history logged.`);
  }

  console.log('\n================ SUCCESS ================');
  console.log(`User: ${updatedProfile.full_name || updatedProfile.email}`);
  console.log(`Email: ${updatedProfile.email}`);
  console.log(`Plan: ${updatedProfile.plan.toUpperCase()}`);
  console.log(`Expires At: ${updatedProfile.plan_expires_at} (${new Date(updatedProfile.plan_expires_at).toLocaleString('vi-VN')})`);
  console.log('=========================================');
}

grantPro().catch((e) => {
  console.error('[GrantPro] Unhandled exception:', e);
  process.exit(1);
});
