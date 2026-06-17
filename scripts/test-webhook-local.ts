import * as path from 'path';
import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

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
const webhookSecret = process.env.WEBHOOK_SECRET || 'test_secret';
const payosChecksumKey = process.env.PAYOS_CHECKSUM_KEY || 'test_checksum_key';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase environment variables in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function generatePayOSSignature(data: any, checksumKey: string): string {
  const sortedKeys = Object.keys(data).sort();
  const queryString = sortedKeys
    .map(key => {
      let val = data[key];
      if (val === null || val === undefined) val = '';
      return `${key}=${val}`;
    })
    .join('&');

  return crypto
    .createHmac('sha256', checksumKey)
    .update(queryString)
    .digest('hex');
}

async function runTest() {
  console.log('🧪 Starting Webhook Dual Authentication Test...');

  // Get test user
  const { data: testProfiles, error: testProfilesErr } = await supabase
    .from('profiles')
    .select('id, email, plan, plan_expires_at')
    .limit(1);

  if (testProfilesErr || !testProfiles || testProfiles.length === 0) {
    console.error('❌ No profiles found in database to act as test user.');
    process.exit(1);
  }

  const testUser = testProfiles[0];
  console.log(`` + `✅ Selected Test User: ID = ${testUser.id}, Email = ${testUser.email}`);

  // Create a pending order for testing
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert({
      user_id: testUser.id,
      plan: 'premium',
      amount: 129000,
      payment_method: 'bank_transfer',
      period_months: 1,
      status: 'pending',
    })
    .select('*')
    .single();

  if (orderErr || !order) {
    console.error('❌ Failed to create pending order:', orderErr?.message);
    process.exit(1);
  }

  const orderPrefix = order.id.slice(0, 8);
  console.log(`` + `✅ Pending Order Created: ID = ${order.id}, Prefix = ${orderPrefix}, Amount = ${order.amount} VND`);

  const serverUrl = 'http://localhost:3000/api/billing/webhook';
  console.log(`` + `📡 Connecting to Webhook Endpoint: ${serverUrl}`);

  // -------------------------------------------------------------
  // Test Case 1: Casso Webhook (Token Authorization)
  // -------------------------------------------------------------
  console.log('\n--- Test Case 1: Casso format webhook with Secure-Token header ---');
  
  const cassoPayload = {
    error: 0,
    data: [
      {
        id: 9991,
        tid: 'TX-CASSO-101',
        description: `LINGOPRO ${orderPrefix.toUpperCase()}`,
        amount: 129000,
      }
    ]
  };

  try {
    const res = await fetch(serverUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'secure-token': webhookSecret,
      },
      body: JSON.stringify(cassoPayload),
    });

    const data: any = await res.json();
    console.log(`Response Status: ${res.status}`);
    console.log(`Response Body:`, data);

    if (res.status === 200 && data.success && data.processed === 1) {
      console.log('✅ Test Case 1 PASSED: Casso Webhook auto-confirmed order successfully!');
    } else {
      console.error('❌ Test Case 1 FAILED!');
    }
  } catch (err: any) {
    console.error('❌ Test Case 1 Error:', err.message);
    console.log('💡 Note: Make sure Next.js dev server is running on http://localhost:3000');
  }

  // Verify order status in DB
  let { data: orderAfterCasso } = await supabase.from('orders').select('status').eq('id', order.id).single();
  console.log(`Order status in DB after Casso test: ${orderAfterCasso?.status}`);

  // Reset order to pending for Case 2
  await supabase.from('orders').update({ status: 'pending', paid_at: null }).eq('id', order.id);

  // -------------------------------------------------------------
  // Test Case 2: PayOS Webhook (Signature Verification)
  // -------------------------------------------------------------
  console.log('\n--- Test Case 2: PayOS format webhook with HMAC-SHA256 signature ---');
  
  const payosTxData = {
    orderCode: 8882,
    amount: 129000,
    description: `LINGOPRO ${orderPrefix.toUpperCase()}`,
    reference: 'TX-PAYOS-202',
    code: '00',
    desc: 'success',
  };

  const payosSignature = generatePayOSSignature(payosTxData, payosChecksumKey);
  const payosPayload = {
    success: true,
    message: 'success',
    data: payosTxData,
    signature: payosSignature,
  };

  try {
    const res = await fetch(serverUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: No authorization headers passed here, relying purely on signature!
      },
      body: JSON.stringify(payosPayload),
    });

    const data: any = await res.json();
    console.log(`Response Status: ${res.status}`);
    console.log(`Response Body:`, data);

    if (res.status === 200 && data.success && data.processed === 1) {
      console.log('✅ Test Case 2 PASSED: PayOS Webhook verified signature and auto-confirmed order successfully!');
    } else {
      console.error('❌ Test Case 2 FAILED!');
    }
  } catch (err: any) {
    console.error('❌ Test Case 2 Error:', err.message);
  }

  // Verify order status in DB
  let { data: orderAfterPayOS } = await supabase.from('orders').select('status').eq('id', order.id).single();
  console.log(`Order status in DB after PayOS test: ${orderAfterPayOS?.status}`);

  // -------------------------------------------------------------
  // Test Case 3: Unauthorized Webhook (No token, no signature)
  // -------------------------------------------------------------
  console.log('\n--- Test Case 3: Unauthorized webhook request ---');
  
  try {
    const res = await fetch(serverUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ description: 'some random description', amount: 1000 }),
    });

    console.log(`Response Status: ${res.status}`);
    if (res.status === 401) {
      console.log('✅ Test Case 3 PASSED: Server rejected unauthorized request correctly.');
    } else {
      console.error('❌ Test Case 3 FAILED: Server did not return 401!');
    }
  } catch (err: any) {
    console.error('❌ Test Case 3 Error:', err.message);
  }

  // -------------------------------------------------------------
  // Clean up
  // -------------------------------------------------------------
  console.log('\n🧹 Cleaning up test database records...');
  
  // Restore profile back to free plan if it was upgraded
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

  console.log('\n=============================================');
  console.log('🎉 WEBHOOK DUAL AUTHENTICATION TEST COMPLETED!');
  console.log('=============================================');
}

runTest().catch(err => {
  console.error('❌ Unhandled error in main test execution:', err);
  process.exit(1);
});
