import { getAdminEmails, unauthorized, forbidden } from '@/lib/api-security';
import { getWebUser, SessionStoreUnavailableError } from '@/lib/server-auth-session';
import { createServiceClient } from '@/lib/supabase-server';

/** Browser admin identity; never accept request-supplied roles or extension credentials. */
export async function authorizeWebAdmin(req: Request) {
  const { data: { user } } = await getWebUser(req);
  if (!user) return { response: unauthorized() };

  // Xác thực trước khi tạo service client; chỉ đọc role của caller đã xác minh.
  const supabase = createServiceClient();
  const { data: profile, error } = await supabase.from('profiles')
    .select('email, role').eq('id', user.id).maybeSingle();
  if (error) throw new SessionStoreUnavailableError();
  const email = (profile?.email || user.email || '').toLowerCase().trim();
  if (profile?.role !== 'admin' && !getAdminEmails().includes(email)) {
    return { response: forbidden('Admin access required') };
  }
  return { response: null, supabase, user };
}
