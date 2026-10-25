import * as path from 'path';
import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { createOrder } from '../src/lib/billing';

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

async function runTest() {
  console.log('🧪 Starting Free Coupon Flow End-to-End Integration Test...');

  // 1. Get a test user profile.
  const { data: testProfiles, error: testProfilesErr } = await supabase
    .from('profiles')
    .select('id, email, plan, plan_expires_at')
    .limit(1);

  if (testProfilesErr || !testProfiles || testProfiles.length === 0) {
    console.error('❌ No profiles found in database to act as test user.');
    process.exit(1);
  }

  const testUser = testProfiles[0];
  console.log(`✅ Test User selected: ID = ${testUser.id}, Email = ${testUser.email}, Current Plan = ${testUser.plan}`);

  // Save current plan state for cleanup later
  const originalPlan = testUser.plan;
  const originalExpiresAt = testUser.plan_expires_at;

  const ordersToCleanUp: string[] = [];

  try {
    // -------------------------------------------------------------
    // Test Case 1: NEWBIE2W (100% off Pro, overridden to 14 days)
    // -------------------------------------------------------------
    console.log('\n🎫 --- Test Case 1: NEWBIE2W Coupon (Onboarding 14 days Pro) ---');
    console.log('🛒 Creating order with NEWBIE2W...');

    const newbieResult = await createOrder(supabase, {
      userId: testUser.id,
      plan: 'pro',
      periodMonths: 1,
      paymentMethod: 'manual',
      couponCode: 'NEWBIE2W',
      note: 'Test Case 1: NEWBIE2W',
    });

    const newbieOrder = newbieResult.order;
    ordersToCleanUp.push(newbieOrder.id);

    console.log(`✅ Order Created: ID = ${newbieOrder.id}, Status = ${newbieOrder.status}, Amount = ${newbieOrder.amount} VND`);
    if (newbieOrder.status !== 'paid') {
      throw new Error(`Expected order status to be 'paid' for 100% discount, but got '${newbieOrder.status}'`);
    }

    // Verify user profile plan and plan_expires_at
    const { data: profileAfterNewbie, error: profileErr1 } = await supabase
      .from('profiles')
      .select('plan, plan_expires_at')
      .eq('id', testUser.id)
      .single();

    if (profileErr1 || !profileAfterNewbie) {
      throw new Error(`Failed to fetch updated profile: ${profileErr1?.message}`);
    }

    console.log(`👤 Profile after NEWBIE2W: Plan = ${profileAfterNewbie.plan}, Expires At = ${profileAfterNewbie.plan_expires_at}`);
    if (profileAfterNewbie.plan !== 'pro') {
      throw new Error(`Expected profile plan to be upgraded to 'pro', but got '${profileAfterNewbie.plan}'`);
    }

    // Check expiration date (should be ~14 days from now)
    const expiryDate = new Date(profileAfterNewbie.plan_expires_at);
    const now = new Date();
    const diffDays = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    console.log(`📅 Remaining Days calculated: ${diffDays} days`);
    if (diffDays < 13 || diffDays > 15) {
      throw new Error(`Expected expiration to be ~14 days from now, but got ${diffDays} days`);
    }
    console.log('✅ Expiration is correct (~14 days).');

    // -------------------------------------------------------------
    // Test Case 2: TIKTOK30 (100% off Pro, standard 3 months)
    // -------------------------------------------------------------
    console.log('\n🎫 --- Test Case 2: TIKTOK30 Coupon (TikTok Promo 3 months Pro) ---');
    console.log('🛒 Creating order with TIKTOK30...');

    // Reset user to free/null first to test fresh upgrade
    await supabase
      .from('profiles')
      .update({ plan: 'free', plan_expires_at: null })
      .eq('id', testUser.id);

    const tiktokResult = await createOrder(supabase, {
      userId: testUser.id,
      plan: 'pro',
      periodMonths: 3,
      paymentMethod: 'manual',
      couponCode: 'TIKTOK30',
      note: 'Test Case 2: TIKTOK30',
    });

    const tiktokOrder = tiktokResult.order;
    ordersToCleanUp.push(tiktokOrder.id);

    console.log(`✅ Order Created: ID = ${tiktokOrder.id}, Status = ${tiktokOrder.status}, Amount = ${tiktokOrder.amount} VND`);
    if (tiktokOrder.status !== 'paid') {
      throw new Error(`Expected order status to be 'paid' for 100% discount, but got '${tiktokOrder.status}'`);
    }

    // Verify user profile plan and plan_expires_at
    const { data: profileAfterTiktok, error: profileErr2 } = await supabase
      .from('profiles')
      .select('plan, plan_expires_at')
      .eq('id', testUser.id)
      .single();

    if (profileErr2 || !profileAfterTiktok) {
      throw new Error(`Failed to fetch updated profile: ${profileErr2?.message}`);
    }

    console.log(`👤 Profile after TIKTOK30: Plan = ${profileAfterTiktok.plan}, Expires At = ${profileAfterTiktok.plan_expires_at}`);
    if (profileAfterTiktok.plan !== 'pro') {
      throw new Error(`Expected profile plan to be 'pro', but got '${profileAfterTiktok.plan}'`);
    }

    // Check expiration date (should be ~3 months from now)
    const tiktokExpiry = new Date(profileAfterTiktok.plan_expires_at);
    const expectedTiktokExpiry = new Date();
    expectedTiktokExpiry.setMonth(expectedTiktokExpiry.getMonth() + 3);
    const diffHours = Math.abs((tiktokExpiry.getTime() - expectedTiktokExpiry.getTime()) / (1000 * 60 * 60));
    console.log(`📅 Difference from exactly 3 months in hours: ${diffHours.toFixed(2)}h`);
    if (diffHours > 24) {
      throw new Error(`Expected expiration to be ~3 months from now, but difference is ${diffHours.toFixed(2)} hours`);
    }
    console.log('✅ Expiration is correct (~3 months).');

  } finally {
    // -------------------------------------------------------------
    // Cleanup
    // -------------------------------------------------------------
    console.log('\n🧹 Cleaning up test database records...');
    
    // Restore profile
    await supabase
      .from('profiles')
      .update({
        plan: originalPlan,
        plan_expires_at: originalExpiresAt,
      })
      .eq('id', testUser.id);
    console.log('   -> Profile restored.');

    // Delete subscription history for the created orders
    if (ordersToCleanUp.length > 0) {
      const { error: histDelErr } = await supabase
        .from('subscription_history')
        .delete()
        .in('order_id', ordersToCleanUp);
      if (histDelErr) {
        console.error('⚠️ Failed to clean up subscription history:', histDelErr.message);
      } else {
        console.log('   -> Subscription history entries cleaned up.');
      }

      // Delete orders
      const { error: orderDelErr } = await supabase
        .from('orders')
        .delete()
        .in('id', ordersToCleanUp);
      if (orderDelErr) {
        console.error('⚠️ Failed to clean up orders:', orderDelErr.message);
      } else {
        console.log('   -> Test orders cleaned up.');
      }
    }

    console.log('\n=============================================');
    console.log('🎉 FREE COUPON FLOW INTEGRATION TEST PASSED!');
    console.log('=============================================');
  }
}

runTest().catch(err => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
