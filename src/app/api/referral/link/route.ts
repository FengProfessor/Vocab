import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { resolvePublicOrigin } from '@/lib/referral-tracker';

export const dynamic = 'force-dynamic';

function generateRandomCode(length = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createServiceClient();
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch existing link
    const { data: link, error } = await supabase
      .from('referral_links')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error && !error.message?.includes('schema cache')) {
      console.error('[Referral] Error fetching link:', error);
    }

    if (link) {
      const origin = resolvePublicOrigin(req);
      return NextResponse.json({
        success: true,
        referralCode: link.referral_code,
        shareUrl: `${origin}/invite/${link.referral_code}`,
        clicksCount: link.clicks_count || 0,
      });
    }

    return NextResponse.json({
      success: true,
      referralCode: null,
      shareUrl: null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServiceClient();
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Check if link already exists
    const { data: existingLink } = await supabase
      .from('referral_links')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    const origin = resolvePublicOrigin(req);

    if (existingLink) {
      return NextResponse.json({
        success: true,
        referralCode: existingLink.referral_code,
        shareUrl: `${origin}/invite/${existingLink.referral_code}`,
        clicksCount: existingLink.clicks_count || 0,
      });
    }

    // Generate unique code
    let code = '';
    let isUnique = false;
    for (let attempts = 0; attempts < 5; attempts++) {
      code = generateRandomCode(6);
      const { data: dup } = await supabase
        .from('referral_links')
        .select('id')
        .eq('referral_code', code)
        .maybeSingle();
      if (!dup) {
        isUnique = true;
        break;
      }
    }

    if (!isUnique) {
      code = `LP${Math.floor(100000 + Math.random() * 900000)}`;
    }

    const { data: newLink, error: insertError } = await supabase
      .from('referral_links')
      .insert({
        user_id: user.id,
        referral_code: code,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[Referral] Error creating referral link:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      referralCode: newLink.referral_code,
      shareUrl: `${origin}/invite/${newLink.referral_code}`,
      clicksCount: 0,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
