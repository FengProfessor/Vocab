import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // Xóa từ rác test
  const { error: e1, count: c1 } = await s
    .from('global_dictionary')
    .delete({ count: 'exact' })
    .eq('word', 'asdkjqwzx');
  console.log('[Cleanup] asdkjqwzx deleted:', c1, e1?.message ?? 'ok');
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
