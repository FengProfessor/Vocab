const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in env.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Parse arguments
const beforeIndex = process.argv.indexOf('--before');
let beforeDate = null;
if (beforeIndex !== -1 && process.argv[beforeIndex + 1]) {
  beforeDate = new Date(process.argv[beforeIndex + 1]);
  if (isNaN(beforeDate.getTime())) {
    console.error('❌ Invalid date format for --before. Use YYYY-MM-DD or ISO format.');
    process.exit(1);
  }
} else {
  beforeDate = new Date(); // Default to now
}

async function run() {
  console.log(`🚀 Starting force-onboarding script...`);
  console.log(`📅 Target: Accounts registered before ${beforeDate.toISOString()}`);

  try {
    let page = 1;
    const perPage = 100;
    let allUsers = [];

    // 1. Fetch all users
    while (true) {
      console.log(`Fetching users page ${page}...`);
      const { data, error } = await supabase.auth.admin.listUsers({
        page,
        perPage
      });

      if (error) throw error;
      const users = data?.users || [];
      if (users.length === 0) break;
      allUsers = allUsers.concat(users);
      if (users.length < perPage) break;
      page++;
    }

    console.log(`Total users found in database: ${allUsers.length}`);

    // 2. Filter users registered before target date
    const targetUsers = allUsers.filter(u => {
      const createdAt = new Date(u.created_at);
      return createdAt < beforeDate;
    });

    console.log(`Number of users registered before target date: ${targetUsers.length}`);

    if (targetUsers.length === 0) {
      console.log('✅ No users to update.');
      return;
    }

    // 3. Update metadata for target users
    let successCount = 0;
    let failCount = 0;

    for (const user of targetUsers) {
      console.log(`Processing user [${user.email || user.id}] (Created: ${user.created_at})...`);
      
      const newMetadata = {
        ...(user.user_metadata || {}),
        force_onboarding: true,
        lingopro_onboarding_completed: null
      };

      const { error } = await supabase.auth.admin.updateUserById(
        user.id,
        { user_metadata: newMetadata }
      );

      if (error) {
        console.error(`❌ Failed to update user ${user.email || user.id}:`, error.message);
        failCount++;
      } else {
        console.log(`✅ Forced onboarding for ${user.email || user.id}`);
        successCount++;
      }
    }

    console.log(`\n🎉 Completed! Success: ${successCount}, Failed: ${failCount}`);
  } catch (err) {
    console.error('❌ An error occurred:', err instanceof Error ? err.message : String(err));
  }
}

run();
