'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Gift,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Brain,
  Video,
  Award,
  Loader2,
  Flame,
} from 'lucide-react';
import confetti from 'canvas-confetti';
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
        }
      } catch (err) {
        console.error(err);
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
        router.push(`/auth?ref=${encodeURIComponent(code)}`);
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

      const json = await res.json();
      router.push('/student');
    } catch (err) {
      console.error(err);
      router.push('/student');
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f7f8fc] via-white to-indigo-50/40 text-slate-900 flex flex-col justify-between dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-white">
      {/* Header */}
      <header className="border-b border-slate-100 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto max-w-5xl flex items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 font-black text-white text-base shadow-sm">
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
            Đăng nhập
          </Link>
        </div>
      </header>

      {/* Main Hero Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl text-center space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 border border-indigo-200/80 px-4 py-1.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950/60 dark:border-indigo-800 dark:text-indigo-300 animate-in fade-in slide-in-from-top-3 duration-300">
            <Gift className="h-4 w-4 text-amber-500" />
            Quà Tặng Đặc Quyền Dành Riêng Cho Bạn
          </div>

          {/* Headline */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
              {isLoading ? (
                'Đang chuẩn bị quà tặng...'
              ) : (
                <>
                  <span className="text-indigo-600 dark:text-indigo-400">
                    {resolveData?.referrerName || 'Học viên LingoPro'}
                  </span>{' '}
                  đã gửi tặng bạn{' '}
                  <span className="bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent">
                    {resolveData?.rewardDays || 7} Ngày Pro VIP
                  </span>
                </>
              )}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
              Mở khóa toàn bộ kho tính năng AI cao cấp, thuật toán ghi nhớ FSRS v5 và hệ thống luyện nghe video tương tác trên LingoPro.
            </p>
          </div>

          {/* Gift Card Box */}
          <div className="rounded-2xl border border-indigo-100 bg-white p-6 shadow-xl shadow-indigo-500/5 dark:border-slate-800 dark:bg-slate-900 text-left space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Mã kích hoạt</span>
              <span className="font-mono text-xs font-extrabold text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded">
                {code}
              </span>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex items-start gap-3">
                <div className="rounded-md bg-emerald-50 p-1.5 text-emerald-600 dark:bg-emerald-950/60 shrink-0">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">+7 Ngày Học Pro VIP Không Giới Hạn</div>
                  <div className="text-slate-500 text-xs mt-0.5">Trải nghiệm trọn vẹn toàn bộ tính năng cao cấp nhất.</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-md bg-indigo-50 p-1.5 text-indigo-600 dark:bg-indigo-950/60 shrink-0">
                  <Brain className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">AI Tra Từ & Phân Tích Ngữ Cảnh</div>
                  <div className="text-slate-500 text-xs mt-0.5">Đặt câu song ngữ, phân tích ngữ pháp theo thời gian thực.</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-md bg-amber-50 p-1.5 text-amber-600 dark:bg-amber-950/60 shrink-0">
                  <Video className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">Luyện Nghe 200+ Video Song Ngữ & Thi Thử TOEIC</div>
                  <div className="text-slate-500 text-xs mt-0.5">Khảo thí ETS 990 và VSTEP B1-C1 chuẩn format.</div>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-2">
              <Button
                size="lg"
                onClick={handleClaimAndStart}
                disabled={isLoading || isClaiming}
                className="w-full h-12 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20"
              >
                {isClaiming ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Gift className="h-4 w-4 mr-2 text-amber-300" />
                )}
                {currentUser ? 'Nhận Quà & Bắt Đầu Học Ngay' : 'Đăng Ký Nhận 7 Ngày Pro VIP Miễn Phí'}
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </div>
          </div>

          {/* Footer note */}
          <p className="text-[11px] text-slate-400">
            Không yêu cầu thẻ tín dụng · Hoàn thành mốc 3 ngày học hoặc 30 từ để mở khóa toàn bộ quyền lợi VIP
          </p>
        </div>
      </main>

      {/* Simple footer */}
      <footer className="border-t border-slate-100 dark:border-slate-800 py-4 text-center text-xs text-slate-400">
        © 2026 LingoPro · Nền tảng học tiếng Anh thông minh với AI & FSRS
      </footer>
    </div>
  );
}
