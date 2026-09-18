import type { Metadata } from 'next';
import { createServiceClient } from '@/lib/supabase';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code: rawCode } = await params;
  const code = (rawCode || '').trim().toUpperCase();

  let referrerName = 'Bạn của bạn';
  try {
    const fetchReferrerName = async () => {
      const supabase = createServiceClient();
      const { data: link } = await supabase
        .from('referral_links')
        .select('user_id')
        .eq('referral_code', code)
        .maybeSingle();

      if (link?.user_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', link.user_id)
          .maybeSingle();

        if (profile?.full_name?.trim()) {
          return profile.full_name.trim();
        }
      }
      return 'Bạn của bạn';
    };

    // Cap metadata generation to 500ms max so SSR HTML is never delayed
    referrerName = await Promise.race([
      fetchReferrerName(),
      new Promise<string>((resolve) => setTimeout(() => resolve('Bạn của bạn'), 500)),
    ]);
  } catch {
    // fallback
  }

  const title = `${referrerName} gửi tặng bạn 7 Ngày Pro VIP LingoPro 🎁`;
  const description =
    'Cùng học từ vựng nhớ lâu với thuật toán lặp lại ngắt quãng FSRS và trợ lý AI thông minh tại LingoPro. Bấm nhận ngay 7 ngày Pro VIP miễn phí!';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://lingopro.online/invite/${code}`,
      siteName: 'LingoPro',
      locale: 'vi_VN',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default function InviteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
