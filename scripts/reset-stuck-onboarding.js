const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in env.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  console.log(`🚀 Scanning and resetting onboarding state for all users...`);

  try {
    let page = 1;
    const perPage = 100;
    let allUsers = [];

    while (true) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
      if (error) throw error;
      const users = data?.users || [];
      if (users.length === 0) break;
      allUsers = allUsers.concat(users);
      if (users.length < perPage) break;
      page++;
    }

    console.log(`Total users found: ${allUsers.length}`);

    let updatedCount = 0;
    let skippedCount = 0;
    let failCount = 0;

    const now = new Date().toISOString();

    for (const user of allUsers) {
      const meta = user.user_metadata || {};
      const isForced = meta.force_onboarding === true;
      const notCompleted = !meta.lingopro_onboarding_completed;

      if (isForced || notCompleted) {
        console.log(`Resetting onboarding for user: ${user.email || user.id} (force_onboarding: ${isForced}, completed: ${meta.lingopro_onboarding_completed})`);
        
        const newMetadata = {
          ...meta,
          force_onboarding: false,
          lingopro_onboarding_completed: meta.lingopro_onboarding_completed || now,
          lingopro_onboarding_version: 'v6-20260805-mandatory',
        };

        const { error } = await supabase.auth.admin.updateUserById(user.id, {
          user_metadata: newMetadata,
        });

        if (error) {
          console.error(`❌ Failed for ${user.email || user.id}:`, error.message);
          failCount++;
        } else {
          updatedCount++;
        }
      } else {
        skippedCount++;
      }
    }

    console.log(`\n🎉 Done! Reset/Turned off onboarding for: ${updatedCount} users, Skipped (already completed): ${skippedCount}, Failed: ${failCount}`);
  } catch (err) {
    console.error('❌ Error:', err instanceof Error ? err.message : String(err));
  }
}

run();
