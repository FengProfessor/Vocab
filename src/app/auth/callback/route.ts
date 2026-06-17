import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const requestedRole = requestUrl.searchParams.get('role');
  const pilot = requestUrl.searchParams.get('pilot');
  const source = requestUrl.searchParams.get('source');
  
  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // This can be ignored if you have middleware refreshing sessions
            }
          },
        },
      }
    );


    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        if (requestedRole === 'teacher') {
          await createServiceClient().from('profiles').update({ role: 'teacher' }).eq('id', user.id);
        }
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        const role = requestedRole === 'teacher' ? 'teacher' : profile?.role;
        const redirectUrl = new URL(role === 'teacher' ? '/teacher' : '/student', requestUrl.origin);
        if (requestedRole === 'teacher') redirectUrl.searchParams.set('pilot_signup', '1');
        if (pilot) redirectUrl.searchParams.set('pilot', pilot.slice(0, 40));
        if (source) redirectUrl.searchParams.set('source', source.slice(0, 80));
        return NextResponse.redirect(redirectUrl);
      }
    }
  }
  
  return NextResponse.redirect(new URL('/auth', requestUrl.origin));
}
