import { assertCronAuthorized } from '@/lib/api-security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Auth-only cron probe. It must remain free of business and data access. */
export async function GET(req: Request): Promise<Response> {
  const denied = assertCronAuthorized(req);
  if (denied) return denied;

  return new Response(null, {
    status: 204,
    headers: { 'Cache-Control': 'no-store' },
  });
}
