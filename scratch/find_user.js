const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findUser() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .ilike('email', 'taphong2002@gmail.com')
    .maybeSingle();

  if (error || !data) {
    // Try auth.users
    const { data: authData } = await supabase.auth.admin.listUsers();
    const user = authData?.users?.find(u => u.email === 'taphong2002@gmail.com');
    console.log('Auth user:', user?.id, user?.email);
    return user?.id;
  }

  console.log('Profile:', data);
  return data.id;
}

findUser();
