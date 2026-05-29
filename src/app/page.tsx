'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  Brain,
  Repeat2,
  Trophy,
  ArrowRight,
  Zap,
  BookOpen,
  Chrome,
  Loader2,
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  // Auto-redirect nếu đã đăng nhập
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/student');
      } else {
        setChecking(false);
      }
    });
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      {/* ── NAVBAR ── */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-black text-xl text-white">
            <Brain className="h-6 w-6 text-indigo-400" />
            LingoPro
          </Link>
          <Link
            href="/auth"
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-sm transition-colors"
          >
            Đăng nhập
          </Link>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden pt-24 pb-32 px-4 sm:px-6 text-center">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px]" />
        </div>

        <div className="relative max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-sm font-semibold">
            <Zap className="h-3.5 w-3.5" /> FSRS v5 + Gemini AI
          </div>

          <h1 className="text-4xl sm:text-6xl font-black leading-tight tracking-tight">
            Học từ vựng tiếng Anh{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              thông minh hơn
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 font-medium max-w-xl mx-auto leading-relaxed">
            AI + Spaced Repetition giúp bạn nhớ lâu hơn 5x. Dành cho học sinh và gia sư tiếng Anh.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              href="/auth"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 font-black text-base border-b-4 border-indigo-800 hover:brightness-110 active:translate-y-0.5 active:border-b-0 transition-all shadow-lg shadow-indigo-900/40"
            >
              Bắt đầu miễn phí <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 font-bold text-base transition-colors"
            >
              Xem tính năng
            </a>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black text-center mb-4">
            Tại sao LingoPro?
          </h2>
          <p className="text-center text-slate-400 font-medium mb-16 max-w-lg mx-auto">
            Kết hợp khoa học não bộ và công nghệ AI để tối ưu quá trình ghi nhớ.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/[0.07] transition-colors">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center mb-5">
                <Brain className="h-6 w-6 text-indigo-400" />
              </div>
              <h3 className="text-lg font-black mb-2">AI tự động làm giàu từ vựng</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Gemini AI tự động cung cấp nghĩa, phiên âm IPA, ví dụ và hình ảnh minh hoạ cho mỗi từ bạn lưu.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/[0.07] transition-colors">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-5">
                <Repeat2 className="h-6 w-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-black mb-2">FSRS v5 — nhắc đúng lúc bạn sắp quên</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Thuật toán Spaced Repetition thế hệ mới nhất. Mỗi từ được lên lịch cá nhân hoá theo tốc độ học của bạn.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/[0.07] transition-colors">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center mb-5">
                <Trophy className="h-6 w-6 text-amber-400" />
              </div>
              <h3 className="text-lg font-black mb-2">Gamification — XP, streak, leaderboard</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Kiếm điểm XP, duy trì chuỗi ngày học, mở khoá thành tích và cạnh tranh với bạn bè trong lớp.
              </p>
            </div>
          </div>

          {/* Extra features row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex gap-4 items-start hover:bg-white/[0.07] transition-colors">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                <BookOpen className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-black mb-1">Ngữ pháp có hệ thống</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  67 bài ngữ pháp với bài tập tự động từ AI. SRS nhắc ôn đúng trước khi bạn quên.
                </p>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex gap-4 items-start hover:bg-white/[0.07] transition-colors">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center shrink-0">
                <Chrome className="h-5 w-5 text-sky-400" />
              </div>
              <div>
                <h3 className="font-black mb-1">Chrome Extension</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Tra từ và lưu ngay khi duyệt web. Từ điển 3-tier với fallback AI, không cần rời trang.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-20 px-4 sm:px-6 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          {[
            { value: '67', label: 'Bài ngữ pháp', sub: 'từ A1 đến B2' },
            { value: 'FSRS v5', label: 'Thuật toán SRS', sub: 'state-of-the-art' },
            { value: 'Chrome Ext', label: 'Extension', sub: 'tra từ & lưu ngay' },
          ].map((s) => (
            <div key={s.value} className="space-y-1">
              <div className="text-3xl sm:text-4xl font-black text-indigo-400">{s.value}</div>
              <div className="font-bold text-white">{s.label}</div>
              <div className="text-slate-500 text-sm">{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BOTTOM ── */}
      <section className="py-28 px-4 sm:px-6 text-center">
        <div className="max-w-xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black leading-tight">
            Sẵn sàng học{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              thông minh hơn?
            </span>
          </h2>
          <p className="text-slate-400 font-medium">
            Miễn phí. Không cần thẻ tín dụng. Bắt đầu trong 30 giây.
          </p>
          <Link
            href="/auth"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 font-black text-base border-b-4 border-indigo-800 hover:brightness-110 active:translate-y-0.5 active:border-b-0 transition-all shadow-lg shadow-indigo-900/40"
          >
            Đăng ký ngay <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2 font-bold text-slate-400">
            <Brain className="h-4 w-4 text-indigo-400" /> LingoPro
          </div>
          <span>© 2026 LingoPro. Học thông minh, nhớ lâu hơn.</span>
        </div>
      </footer>
    </div>
  );
}
