const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.resolve(__dirname, '..', '.env.local');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in env.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const TEST_EMAIL = 'onboarding-test@lingopro.vn';
const TEST_PASSWORD = 'password123';

async function setupTestUser() {
  console.log('[TestUser] Setting up test user...');

  // 1. Check if user exists in auth
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('[TestUser] Failed to list users:', listError.message);
    process.exit(1);
  }

  let user = users.find(u => u.email === TEST_EMAIL);

  if (!user) {
    console.log('[TestUser] Test user does not exist. Creating...');
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: 'Học viên thử nghiệm', role: 'student' }
    });

    if (createError) {
      console.error('[TestUser] Failed to create test user:', createError.message);
      process.exit(1);
    }
    user = newUser.user;
    console.log('[TestUser] Test user created successfully:', user.id);
  } else {
    console.log('[TestUser] Test user already exists:', user.id);
  }

  // 2. Reset user's plan in profiles to 'free' and plan_expires_at to null
  console.log('[TestUser] Resetting profile to Free plan...');
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      plan: 'free',
      plan_expires_at: null,
      role: 'student'
    })
    .eq('id', user.id);

  if (profileError) {
    console.error('[TestUser] Failed to reset profile:', profileError.message);
  }

  // 3. Clear any subscription history and orders
  console.log('[TestUser] Deleting past subscription history...');
  const { error: histError } = await supabase
    .from('subscription_history')
    .delete()
    .eq('user_id', user.id);

  if (histError) {
    console.error('[TestUser] Failed to delete subscription history:', histError.message);
  }

  console.log('[TestUser] Deleting past orders...');
  const { error: orderError } = await supabase
    .from('orders')
    .delete()
    .eq('user_id', user.id);

  if (orderError) {
    console.error('[TestUser] Failed to delete orders:', orderError.message);
  }

  console.log('[TestUser] Setup completed successfully!');
}

setupTestUser().catch(err => {
  console.error('[TestUser] Unexpected error:', err);
  process.exit(1);
});
