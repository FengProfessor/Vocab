import * as path from 'path';
import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { computeBasePrice, applyDiscount, createOrder, confirmOrder } from '../src/lib/billing';

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
  console.log('🧪 Starting Billing Flow End-to-End Integration Test...');

  // 1. Get an admin email/profile and a test user profile.
  let adminEmail = '';
  const adminEmailsEnv = process.env.ADMIN_EMAILS ?? '';
  if (adminEmailsEnv) {
    adminEmail = adminEmailsEnv.split(',')[0].trim().toLowerCase();
  } else {
    adminEmail = 'taphong2002@gmail.com'; // fallback default admin
    console.log(`⚠️ ADMIN_EMAILS not set. Using fallback admin email: "${adminEmail}"`);
  }

  // Fetch admin profile
  let { data: adminProfile, error: adminErr } = await supabase
    .from('profiles')
    .select('id, email')
    .ilike('email', adminEmail)
    .maybeSingle();

  if (adminErr || !adminProfile) {
    // If not found, let's fallback to the first profile in the database to act as the admin
    console.log(`⚠️ Could not find profile for admin "${adminEmail}". Fetching any existing profile to act as admin...`);
    const { data: allProfiles, error: allErr } = await supabase
      .from('profiles')
      .select('id, email')
      .limit(2);
    
    if (allErr || !allProfiles || allProfiles.length < 2) {
      console.error('❌ Cannot run test: need at least 2 profiles in the database. Found:', allProfiles?.length || 0);
      process.exit(1);
    }
    
    adminProfile = allProfiles[0];
    console.log(`✅ Selected profile "${adminProfile.email}" to act as Admin.`);
  } else {
    console.log(`✅ Admin profile found: ID = ${adminProfile.id}, Email = ${adminProfile.email}`);
  }

  // Fetch or create a test user profile. Let's find any user that is NOT the admin.
  const { data: testProfiles, error: testProfilesErr } = await supabase
    .from('profiles')
    .select('id, email, plan, plan_expires_at')
    .neq('id', adminProfile.id)
    .limit(1);

  if (testProfilesErr || !testProfiles || testProfiles.length === 0) {
    console.error('❌ No other profiles found in database to act as test user. Error:', testProfilesErr?.message || 'Empty');
    process.exit(1);
  }


  const testUser = testProfiles[0];
  console.log(`✅ Test User found: ID = ${testUser.id}, Email = ${testUser.email}, Current Plan = ${testUser.plan}`);

  // 2. Setup a test coupon code
  const couponCode = 'BILLINGTEST50';
  console.log(`🎫 Setting up test coupon: "${couponCode}" (50% off Pro)...`);
  
  // Upsert coupon
  const { data: couponData, error: couponUpsertErr } = await supabase
    .from('coupons')
    .upsert({
      code: couponCode,
      discount_pct: 50,
      discount_amount: null,
      max_uses: 5,
      used_count: 0,
      is_active: true,
      applicable_plans: ['pro'],
      valid_from: new Date(Date.now() - 3600 * 1000).toISOString(), // 1 hour ago
      valid_until: new Date(Date.now() + 3600 * 1000 * 24).toISOString(), // 24 hours later
    }, { onConflict: 'code' })
    .select('*')
    .single();

  if (couponUpsertErr) {
    console.error('❌ Failed to create/update test coupon:', couponUpsertErr.message);
    process.exit(1);
  }

  console.log(`✅ Coupon created successfully! ID = ${couponData.id}`);

  // 3. Create a pending order for the test user
  console.log('🛒 Creating order: Plan = pro, Period = 3 months, Coupon = BILLINGTEST50...');
  
  // Compute price manually to verify
  // Pro: 79,000/mo. For 3 months with 10% period discount: 79,000 * 3 * 0.9 = 213,300.
  // After coupon discount (50%): 106,650.
  const manualBasePrice = computeBasePrice('pro', 3);
  const manualAmount = applyDiscount(manualBasePrice, couponData);
  console.log(`   Expected base price: ${manualBasePrice} VND`);
  console.log(`   Expected final price: ${manualAmount} VND`);

  let orderResult;
  try {
    orderResult = await createOrder(supabase, {
      userId: testUser.id,
      plan: 'pro',
      periodMonths: 3,
      paymentMethod: 'bank_transfer',
      couponCode: couponCode,
    });
  } catch (err: any) {
    console.error('❌ Failed to create order via createOrder helper:', err.message);
    process.exit(1);
  }

  const order = orderResult.order;
  console.log(`✅ Order created successfully! ID = ${order.id}, Status = ${order.status}, Amount = ${order.amount} VND`);
  
  if (order.amount !== manualAmount) {
    console.error(`❌ Order amount mismatch! Found ${order.amount}, expected ${manualAmount}`);
    process.exit(1);
  }
  console.log('   -> Order amount is correct.');

  // 4. Confirm the order simulating admin approval
  console.log(`💼 Simulating admin confirmation for order ${order.id}...`);
  
  let confirmResult;
  try {
    confirmResult = await confirmOrder(
      supabase,
      order.id,
      adminProfile.id,
      'REF-123456',
      'Tested via automated integration script'
    );
  } catch (err: any) {
    console.error('❌ Confirm order failed:', err.message);
    process.exit(1);
  }

  console.log(`✅ Order confirmed successfully! Active plan = ${confirmResult.plan}, Expires at = ${confirmResult.expiresAt}`);

  // 5. Verify updates in Supabase
  console.log('🔍 Verifying updates in Database...');

  // Check profile
  const { data: updatedProfile, error: profileFetchErr } = await supabase
    .from('profiles')
    .select('plan, plan_expires_at')
    .eq('id', testUser.id)
    .single();

  if (profileFetchErr) {
    console.error('❌ Failed to fetch updated profile:', profileFetchErr.message);
    process.exit(1);
  }

  if (updatedProfile.plan !== 'pro') {
    console.error(`❌ Profile plan not updated! Found ${updatedProfile.plan}, expected "pro"`);
    process.exit(1);
  }
  console.log('   -> Profile plan is updated to "pro".');

  // Check order status
  const { data: updatedOrder, error: orderFetchErr } = await supabase
    .from('orders')
    .select('status, paid_at, starts_at, expires_at, processed_by')
    .eq('id', order.id)
    .single();

  if (orderFetchErr) {
    console.error('❌ Failed to fetch updated order:', orderFetchErr.message);
    process.exit(1);
  }

  if (updatedOrder.status !== 'paid') {
    console.error(`❌ Order status not updated! Found ${updatedOrder.status}, expected "paid"`);
    process.exit(1);
  }
  console.log('   -> Order status updated to "paid".');

  // Check subscription history
  const { data: historyRow, error: historyFetchErr } = await supabase
    .from('subscription_history')
    .select('*')
    .eq('order_id', order.id)
    .maybeSingle();

  if (historyFetchErr) {
    console.error('❌ Failed to fetch subscription history:', historyFetchErr.message);
    process.exit(1);
  }

  if (!historyRow) {
    console.error('❌ Subscription history row was not created!');
    process.exit(1);
  }
  console.log(`   -> Subscription history logged: Old = ${historyRow.old_plan}, New = ${historyRow.new_plan}`);

  // Check coupon usage count
  const { data: updatedCoupon, error: couponFetchErr } = await supabase
    .from('coupons')
    .select('used_count')
    .eq('code', couponCode)
    .single();

  if (couponFetchErr) {
    console.error('❌ Failed to fetch updated coupon usage:', couponFetchErr.message);
    process.exit(1);
  }

  if (updatedCoupon.used_count !== couponData.used_count + 1) {
    console.error(`❌ Coupon usage not incremented! Found ${updatedCoupon.used_count}, expected ${couponData.used_count + 1}`);
    process.exit(1);
  }
  console.log(`   -> Coupon usage incremented to ${updatedCoupon.used_count}.`);

  // 6. Cleanup test data
  console.log('🧹 Cleaning up test database records...');
  
  // Reset profile back to original plan
  await supabase
    .from('profiles')
    .update({
      plan: testUser.plan,
      plan_expires_at: testUser.plan_expires_at,
    })
    .eq('id', testUser.id);
  console.log('   -> Profile restored.');

  // Delete subscription history
  await supabase
    .from('subscription_history')
    .delete()
    .eq('order_id', order.id);
  console.log('   -> Subscription history entry deleted.');

  // Delete order
  await supabase
    .from('orders')
    .delete()
    .eq('id', order.id);
  console.log('   -> Test order deleted.');

  // Delete coupon
  await supabase
    .from('coupons')
    .delete()
    .eq('code', couponCode);
  console.log('   -> Test coupon deleted.');

  console.log('\n=============================================');
  console.log('🎉 BILLING SYSTEM INTEGRATION TEST PASSED!');
  console.log('=============================================');
}

runTest().catch(err => {
  console.error('❌ Unhandled error in main test execution:', err);
  process.exit(1);
});
