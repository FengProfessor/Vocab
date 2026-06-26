const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables from .env.local
const envPath = path.resolve(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('.env.local file not found at:', envPath);
  process.exit(1);
}

dotenv.config({ path: envPath });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase URL or Service Role Key in environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  console.log('[SeedCoupons] Seeding TikTok coupons...');

  // Create TIKTOK30: 100% off, max 1000 uses, valid until end of year
  const coupons = [
    {
      code: 'TIKTOK30',
      discount_pct: 100,
      discount_amount: null,
      max_uses: 1000,
      valid_from: new Date().toISOString(),
      valid_until: new Date(new Date().getFullYear() + 1, 0, 1).toISOString(), // Jan 1st next year
      applicable_plans: ['pro'],
      is_active: true
    },
    {
      code: 'TIKTOKPRO',
      discount_pct: 100,
      discount_amount: null,
      max_uses: 500,
      valid_from: new Date().toISOString(),
      valid_until: new Date(new Date().getFullYear() + 1, 0, 1).toISOString(),
      applicable_plans: ['pro', 'premium'],
      is_active: true
    },
    {
      code: 'NEWBIE2W',
      discount_pct: 100,
      discount_amount: null,
      max_uses: 10000,
      valid_from: new Date().toISOString(),
      valid_until: new Date(new Date().getFullYear() + 1, 0, 1).toISOString(),
      applicable_plans: ['pro'],
      is_active: true
    }

  ];

  for (const coupon of coupons) {
    console.log(`[SeedCoupons] Upserting coupon: ${coupon.code}...`);
    
    // Check if exists
    const { data: existing, error: checkError } = await supabase
      .from('coupons')
      .select('id')
      .eq('code', coupon.code)
      .maybeSingle();

    if (checkError) {
      console.error(`[SeedCoupons] Error checking coupon ${coupon.code}:`, checkError.message);
      continue;
    }

    if (existing) {
      console.log(`[SeedCoupons] Coupon ${coupon.code} already exists. Updating config without resetting used_count.`);
      const { error: updateError } = await supabase
        .from('coupons')
        .update(coupon)
        .eq('id', existing.id);
        
      if (updateError) {
        console.error(`[SeedCoupons] Error updating coupon ${coupon.code}:`, updateError.message);
      } else {
        console.log(`[SeedCoupons] Coupon ${coupon.code} updated successfully.`);
      }
    } else {
      const { error: insertError } = await supabase
        .from('coupons')
        .insert({ ...coupon, used_count: 0 });

      if (insertError) {
        console.error(`[SeedCoupons] Error inserting coupon ${coupon.code}:`, insertError.message);
      } else {
        console.log(`[SeedCoupons] Coupon ${coupon.code} inserted successfully.`);
      }
    }
  }

  console.log('[SeedCoupons] Seeding finished.');
}

main().catch(err => {
  console.error('[SeedCoupons] Unexpected error:', err);
  process.exit(1);
});
