'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Gift,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Brain,
  Video,
  Loader2,
  ShieldCheck,
  AlertCircle,
  Star,
  Users,
  Compass,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { captureReferralCode } from '@/lib/referral-tracker';

interface ResolveData {
  success: boolean;
  code: string;
  referrerName: string;
  rewardDays: number;
}

export default function InviteLandingPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const router = useRouter();
  const { code: rawCode } = use(params);
  const code = (rawCode || '').trim().toUpperCase();

  const [resolveData, setResolveData] = useState<ResolveData | null>(null);
  const [isInvalidCode, setIsInvalidCode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    // Capture referral code into cookie and storage
    if (code) {
      captureReferralCode();
    }

    async function checkUserAndResolve() {
      try {
        // 1. Check if user is logged in
        const { data: { session } } = await supabase.auth.getSession();
        setCurrentUser(session?.user || null);

        // 2. Resolve referrer info
        const res = await fetch('/api/referral/resolve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });

        const json = await res.json();
        if (json.success) {
          setResolveData(json);
          try {
            confetti({
              particleCount: 50,
              spread: 70,
              origin: { y: 0.6 },
            });
          } catch {
            // ignore
          }
        } else {
          setIsInvalidCode(true);
        }
      } catch (err) {
        console.error(err);
        setIsInvalidCode(true);
      } finally {
        setIsLoading(false);
      }
    }

    void checkUserAndResolve();
  }, [code]);

  const handleClaimAndStart = async () => {
    setIsClaiming(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push(`/auth?ref=${encodeURIComponent(code)}&mode=signup`);
        return;
      }

      // User is logged in, claim referral directly
      const res = await fetch('/api/referral/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ referralCode: code }),
      });

      const json = await res.json().catch(() => ({}));
      if (json.alreadyClaimed) {
        toast.info('Tài khoản của bạn đã áp dụng mã quà tặng trước đó!');
      } else if (json.success) {
        toast.success(json.message || 'Kích hoạt quà tặng 7 ngày Pro VIP thành công!');
      } else if (json.error) {
        toast.error(json.error);
      }

      router.push('/student');
    } catch (err) {
      console.error(err);
      toast.error('Có lỗi xảy ra khi nhận quà, đang chuyển đến trang học...');
      router.push('/student');
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f9fd] via-white to-indigo-50/40 text-slate-900 flex flex-col justify-between dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-white">
      {/* Header */}
      <header className="border-b border-slate-100 dark:border-slate-800 bg-white/75 dark:bg-slate-900/75 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto max-w-5xl flex items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 font-black text-white text-base shadow-xs">
              L
            </span>
            <span className="font-black text-lg tracking-tight text-slate-900 dark:text-white">
              LingoPro
            </span>
          </Link>
          <Link
            href="/auth"
            className="text-xs font-semibold text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
          >
            Đã có tài khoản? Đăng nhập
          </Link>
        </div>
      </header>

      {/* Main Hero Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-10 sm:py-14">
        <div className="w-full max-w-xl text-center space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 border border-indigo-200/80 px-4 py-1.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950/60 dark:border-indigo-800 dark:text-indigo-300 animate-in fade-in slide-in-from-top-3 duration-300">
            <Sparkles className="h-4 w-4 text-amber-500" />
            Quà tặng học tiếng Anh đặc biệt dành riêng cho bạn!
          </div>

          {/* Headline */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
              {isLoading ? (
                <span className="inline-flex items-center gap-2 text-slate-400">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                  Đang chuẩn bị quà tặng...
                </span>
              ) : isInvalidCode ? (
                <>
                  Mã quà tặng đã hết hạn —{' '}
                  <span className="text-indigo-600 dark:text-indigo-400">
                    Nhưng bạn vẫn được học miễn phí!
                  </span>
                </>
              ) : (
                <>
                  <span className="text-indigo-600 dark:text-indigo-400">
                    {resolveData?.referrerName || 'Bạn của bạn'}
                  </span>{' '}
                  gửi tặng bạn{' '}
                  <span className="bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent">
                    {resolveData?.rewardDays || 7} Ngày Pro VIP
                  </span>
                </>
              )}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
              Cùng nhau học từ vựng nhớ sâu với thuật toán FSRS khoa học, trợ lý AI giải thích tức thì và phòng luyện thi TOEIC / VSTEP tại LingoPro.
            </p>
          </div>

          {/* Gift Card Box */}
          <div className="rounded-2xl border border-indigo-100 bg-white p-6 sm:p-7 shadow-xl shadow-indigo-500/5 dark:border-slate-800 dark:bg-slate-900 text-left space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {isInvalidCode ? 'Trạng thái quà tặng' : 'Mã quà tặng kích hoạt'}
              </span>
              <span className="font-mono text-xs font-extrabold text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-md border border-indigo-100 dark:border-indigo-900/60">
                {code || 'LINGOPRO'}
              </span>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-3.5 text-xs sm:text-sm">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600 dark:bg-emerald-950/60 shrink-0">
                  <Gift className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    Trải Nghiệm 7 Ngày Pro VIP Trọn Vẹn
                  </div>
                  <div className="text-slate-500 text-xs mt-0.5 leading-relaxed">
                    Mở khóa không giới hạn kho bài học, từ vựng theo chủ đề và toàn bộ tính năng cao cấp.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600 dark:bg-indigo-950/60 shrink-0">
                  <Brain className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    Trợ Lý AI Phân Tích &amp; Sửa Lỗi Câu
                  </div>
                  <div className="text-slate-500 text-xs mt-0.5 leading-relaxed">
                    Tra từ 1 chạm, phân tích ngữ cảnh tự nhiên và sửa lỗi ngữ pháp chuẩn xác như gia sư riêng.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600 dark:bg-amber-950/60 shrink-0">
                  <Video className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    200+ Video Song Ngữ &amp; Phòng Thi TOEIC / VSTEP
                  </div>
                  <div className="text-slate-500 text-xs mt-0.5 leading-relaxed">
                    Luyện nghe thực tế, thi thử có bấm giờ và chấm điểm chi tiết theo barem chuẩn khảo thí.
                  </div>
                </div>
              </div>
            </div>

            {/* 3 Quick Steps */}
            <div className="rounded-xl bg-slate-50/80 p-3.5 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Cách nhận và kích hoạt quà:
              </div>
              <p className="leading-relaxed pl-5">
                Bấm đăng ký bên dưới ➔ Hoàn thành 1 lượt học hoặc lưu từ vựng ➔ Quà VIP tự động kích hoạt cho cả bạn và bạn bè!
              </p>
            </div>

            {/* CTA Button */}
            <div className="pt-1">
              <Button
                size="lg"
                onClick={handleClaimAndStart}
                disabled={isLoading || isClaiming}
                className="w-full h-12 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/25 transition-transform active:scale-[0.99]"
              >
                {isClaiming ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Gift className="h-4 w-4 mr-2 text-amber-300" />
                )}
                {currentUser
                  ? 'Nhận 7 Ngày VIP & Vào Học Ngay'
                  : 'Tạo Tài Khoản Nhận 7 Ngày VIP Miễn Phí'}
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </div>
          </div>

          {/* Social Proof & Trust */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1 text-amber-500">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            </div>
            <span>Hơn 50,000+ học viên tin chọn LingoPro để chinh phục từ vựng mỗi ngày</span>
          </div>

          {/* Footer note */}
          <p className="text-[11px] text-slate-400">
            Hoàn toàn miễn phí · Không cần nhập thẻ ngân hàng · Hủy bất cứ lúc nào
          </p>
        </div>
      </main>

      {/* Simple footer */}
      <footer className="border-t border-slate-100 dark:border-slate-800 py-4 text-center text-xs text-slate-400">
        © 2026 LingoPro · Nền tảng học tiếng Anh thông minh với AI &amp; FSRS
      </footer>
    </div>
  );
}
