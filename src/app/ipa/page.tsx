'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { StudentShell } from '@/components/student/StudentShell';
import { IpaSoundboard } from '@/components/ipa/IpaSoundboard';
import { IpaPracticeStudio } from '@/components/ipa/IpaPracticeStudio';
import {
  getAllPhonemes,
  getPhonemeById,
  getStoredIpaProgress,
  getNextRecommendedPhoneme,
} from '@/lib/ipa-client';
import type { IpaPhoneme, UserPhonemeProgress } from '@/types/ipa';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Trophy,
  Flame,
  Award,
  BookOpen,
  Volume2,
  Brain,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';

function IpaMasterclassContent() {
  const searchParams = useSearchParams();
  const soundParam = searchParams.get('sound');
  const stageParam = searchParams.get('stage') || undefined;

  const phonemes = useMemo(() => getAllPhonemes(), []);
  const [userProgress, setUserProgress] = useState<Record<string, UserPhonemeProgress>>({});
  const [selectedPhoneme, setSelectedPhoneme] = useState<IpaPhoneme | null>(() => {
    if (soundParam) {
      return getPhonemeById(soundParam) || null;
    }
    return null;
  });
  const [hasSession, setHasSession] = useState<boolean>(false);

  // Check auth session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session?.user);
    }).catch(() => {
      setHasSession(false);
    });
  }, []);

  // Load progress
  useEffect(() => {
    setUserProgress(getStoredIpaProgress());
  }, []);

  // Open direct sound from URL query if provided (e.g. /ipa?sound=th-voiced)
  useEffect(() => {
    if (soundParam) {
      const found = getPhonemeById(soundParam);
      if (found) {
        setSelectedPhoneme(found);
      }
    }
  }, [soundParam]);

  // Overall Stats
  const stats = useMemo(() => {
    const total = phonemes.length;
    const mastered = Object.values(userProgress).filter((p) => p.masteryPercent >= 80).length;
    const inProgress = Object.values(userProgress).filter(
      (p) => p.masteryPercent > 0 && p.masteryPercent < 80,
    ).length;
    const percent = Math.round((mastered / total) * 100);
    return { total, mastered, inProgress, percent };
  }, [phonemes, userProgress]);

  const nextRecommendedPhoneme = useMemo(() => {
    return getNextRecommendedPhoneme(userProgress);
  }, [userProgress]);

  const handleRefreshProgress = () => {
    setUserProgress(getStoredIpaProgress());
  };

  const mainContent = (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 pb-20 space-y-4 sm:space-y-5">
      {/* Sleek Minimalist Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Link
              href="/journey"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Lộ trình
            </Link>
            <span className="text-xs text-muted-foreground">/</span>
            <span className="text-xs font-semibold text-primary">Phiên Âm IPA</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
            <span>Phiên Âm IPA</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              44 Âm Quốc Tế
            </span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Làm chủ khẩu hình môi - răng - lưỡi với video chuẩn từ Rachel&apos;s English
          </p>
        </div>

        {/* Compact Progress Bar & Quick Action */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/50 border text-xs">
            <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
            <div className="space-y-0.5">
              <div className="flex items-center justify-between gap-3 text-[11px]">
                <span className="text-muted-foreground">Đã nắm:</span>
                <span className="font-bold font-mono text-foreground">
                  {stats.mastered}/{stats.total}
                </span>
              </div>
              <div className="w-24 bg-muted-foreground/20 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${stats.percent}%` }}
                />
              </div>
            </div>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 font-mono ml-1">
              {stats.percent}%
            </span>
          </div>

          <Link href="/journey">
            <Button variant="outline" size="sm" className="rounded-xl text-xs font-semibold h-8">
              Lộ trình
            </Button>
          </Link>
        </div>
      </div>

      {/* Caring Coach Guidance & Recommended Action Card */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-200/60 dark:border-indigo-800/40 bg-gradient-to-r from-indigo-50/70 via-violet-50/40 to-background dark:from-indigo-950/30 dark:via-violet-950/20 dark:to-background p-4 sm:p-4.5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5">
          <div className="flex items-start gap-3 max-w-2xl">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs text-base">
              🎙️
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                  Huấn luyện viên phát âm LingoPro
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                  Ân cần · Từng bước
                </span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                Đừng cố học thuộc cả 44 âm trong một lần nhé! Hãy rèn luyện từng bước theo <strong>4 Chặng khoa học</strong> dưới đây: bắt đầu từ 14 âm người Việt hay nói ngọng nhất, rồi học các cặp âm cùng khẩu hình để nhớ lâu gấp đôi.
              </p>
            </div>
          </div>

          {/* Next Recommended Phoneme One-Touch Action */}
          {nextRecommendedPhoneme && (
            <div className="shrink-0 flex items-center justify-between md:justify-end gap-2.5 pt-2.5 md:pt-0 border-t md:border-t-0 border-border/40">
              <div className="text-right hidden sm:block">
                <div className="text-[10px] text-muted-foreground">Âm đề xuất hôm nay</div>
                <div className="text-xs font-bold text-foreground">
                  /{nextRecommendedPhoneme.symbol}/ · {nextRecommendedPhoneme.anchorWord}
                </div>
              </div>
              <Button
                onClick={() => setSelectedPhoneme(nextRecommendedPhoneme)}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold h-9 px-3.5 shadow-xs flex items-center gap-1.5 group transition-all"
              >
                <span>🎯 Luyện ngay /{nextRecommendedPhoneme.symbol}/</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Soundboard Component */}
      <IpaSoundboard
        phonemes={phonemes}
        userProgress={userProgress}
        onSelectPhoneme={(p) => setSelectedPhoneme(p)}
        initialStageId={stageParam}
      />

      {/* Lean & SEO Rich Accordion FAQ Section */}
      <section className="mt-8 pt-6 border-t border-border/60 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <h2 className="text-sm sm:text-base font-black tracking-tight text-foreground flex items-center gap-2">
              <span>💡 Cẩm Nang & Hỏi Đáp Phát Âm 44 Âm IPA</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Kiến thức ngữ âm cốt lõi giúp người Việt vượt qua các rào cản phát âm phổ biến
            </p>
          </div>
          <span className="text-[11px] text-muted-foreground font-medium self-start sm:self-auto">
            Nhấp vào câu hỏi để xem chi tiết
          </span>
        </div>

        <div className="space-y-2">
          <details className="group rounded-xl border border-border/70 bg-card p-3 sm:p-3.5 text-xs transition-all [&_summary::-webkit-details-marker]:hidden cursor-pointer">
            <summary className="flex items-center justify-between font-bold text-foreground group-hover:text-primary transition-colors select-none">
              <span className="flex items-center gap-2">
                <span className="text-base">📌</span>
                Bảng phiên âm IPA tiếng Anh là gì và vì sao người học cần làm chủ trước tiên?
              </span>
              <span className="text-muted-foreground group-open:rotate-180 transition-transform text-sm shrink-0 ml-2">▾</span>
            </summary>
            <p className="mt-2 text-muted-foreground leading-relaxed pl-6 border-l-2 border-primary/30 ml-2 pt-1">
              Khác với tiếng Việt (chữ viết sao đọc vậy), tiếng Anh có độ lệch rất lớn giữa mặt chữ và phát âm (ví dụ: chữ &quot;a&quot; trong <em>cat</em>, <em>car</em>, <em>about</em>, <em>water</em> phát âm hoàn toàn khác nhau). <strong>Bảng Ký Hiệu Ngữ Âm Quốc Tế (IPA - International Phonetic Alphabet)</strong> gồm đúng 44 âm chuẩn, giúp bạn nhìn vào phiên âm trong từ điển là đọc chính xác 100% bất kỳ từ nào mà không cần đoán mò.
            </p>
          </details>

          <details className="group rounded-xl border border-border/70 bg-card p-3 sm:p-3.5 text-xs transition-all [&_summary::-webkit-details-marker]:hidden cursor-pointer">
            <summary className="flex items-center justify-between font-bold text-foreground group-hover:text-primary transition-colors select-none">
              <span className="flex items-center gap-2">
                <span className="text-base">🔴</span>
                Vì sao người Việt hay nói ngọng tiếng Anh và 14 âm &quot;tử huyệt&quot; gồm những âm nào?
              </span>
              <span className="text-muted-foreground group-open:rotate-180 transition-transform text-sm shrink-0 ml-2">▾</span>
            </summary>
            <p className="mt-2 text-muted-foreground leading-relaxed pl-6 border-l-2 border-amber-500/40 ml-2 pt-1">
              Người Việt gặp khó khăn do thói quen cấu âm tiếng mẹ đẻ: tiếng Việt không có âm xát răng môi, không bật âm đuôi và không có nguyên âm căng/thả lỏng. 14 âm gây hiểu lầm tai hại nhất gồm: âm thè lưỡi thổi gió <strong>/θ/</strong> (<em>think</em>) và thè lưỡi rung cổ <strong>/ð/</strong> (<em>this</em>); nuốt âm đuôi <strong>/s/</strong>, <strong>/z/</strong>, <strong>/t/</strong>, <strong>/k/</strong>; âm chu môi <strong>/ʃ/</strong>, <strong>/ʒ/</strong>, <strong>/tʃ/</strong>, <strong>/dʒ/</strong>; cắn môi dưới <strong>/v/</strong>; và nhầm lẫn cặp nguyên âm <strong>/iː/</strong> (sheep) với <strong>/ɪ/</strong> (ship).
            </p>
          </details>

          <details className="group rounded-xl border border-border/70 bg-card p-3 sm:p-3.5 text-xs transition-all [&_summary::-webkit-details-marker]:hidden cursor-pointer">
            <summary className="flex items-center justify-between font-bold text-foreground group-hover:text-primary transition-colors select-none">
              <span className="flex items-center gap-2">
                <span className="text-base">⚖️</span>
                Bí quyết phân biệt Cặp Nguyên Âm Đối Lập: Dài (Tense) ↔ Ngắn (Lax)
              </span>
              <span className="text-muted-foreground group-open:rotate-180 transition-transform text-sm shrink-0 ml-2">▾</span>
            </summary>
            <p className="mt-2 text-muted-foreground leading-relaxed pl-6 border-l-2 border-blue-500/40 ml-2 pt-1">
              Đừng hiểu lầm &quot;âm dài chỉ đơn thuần là đọc kéo dài thời gian&quot;. Điểm mấu chốt nằm ở <strong>độ căng của cơ mặt</strong>: với âm dài (như /iː/, /uː/, /ɔː/), khóe miệng và lưỡi phải kéo căng (Tense); còn với âm ngắn (như /ɪ/, /ʊ/, /ɒ/), toàn bộ cơ miệng và quai hàm hoàn toàn thả lỏng (Lax) và dứt khoát.
            </p>
          </details>

          <details className="group rounded-xl border border-border/70 bg-card p-3 sm:p-3.5 text-xs transition-all [&_summary::-webkit-details-marker]:hidden cursor-pointer">
            <summary className="flex items-center justify-between font-bold text-foreground group-hover:text-primary transition-colors select-none">
              <span className="flex items-center gap-2">
                <span className="text-base">🗣️</span>
                Quy luật đối xứng của 8 Cặp Phụ Âm (Học 1 được 2): Vô thanh ↔ Hữu thanh
              </span>
              <span className="text-muted-foreground group-open:rotate-180 transition-transform text-sm shrink-0 ml-2">▾</span>
            </summary>
            <p className="mt-2 text-muted-foreground leading-relaxed pl-6 border-l-2 border-emerald-500/40 ml-2 pt-1">
              Tiết kiệm 50% công sức bằng cách nhớ rằng mỗi cặp phụ âm có <strong>cùng một vị trí cơ môi - răng - lưỡi</strong>. Khi đọc âm <strong>Vô thanh</strong> (/p/, /t/, /k/, /f/, /θ/, /s/, /ʃ/, /tʃ/), dây thanh quản không rung, bạn chỉ thổi luồng hơi ra ngoài. Khi chuyển sang âm <strong>Hữu thanh</strong> (/b/, /d/, /g/, /v/, /ð/, /z/, /ʒ/, /dʒ/), giữ nguyên khẩu hình miệng và làm rung cổ họng.
            </p>
          </details>

          <details className="group rounded-xl border border-border/70 bg-card p-3 sm:p-3.5 text-xs transition-all [&_summary::-webkit-details-marker]:hidden cursor-pointer">
            <summary className="flex items-center justify-between font-bold text-foreground group-hover:text-primary transition-colors select-none">
              <span className="flex items-center gap-2">
                <span className="text-base">🎥</span>
                Video thị phạm khẩu hình trên LingoPro có nguồn gốc từ đâu?
              </span>
              <span className="text-muted-foreground group-open:rotate-180 transition-transform text-sm shrink-0 ml-2">▾</span>
            </summary>
            <p className="mt-2 text-muted-foreground leading-relaxed pl-6 border-l-2 border-purple-500/40 ml-2 pt-1">
              100% video khẩu hình được tuyển chọn đồng nhất từ kênh <strong>Rachel&apos;s English</strong> — kênh giảng dạy ngữ âm tiếng Anh - Mỹ uy tín hàng đầu thế giới. LingoPro đã cắt lọc chính xác các mốc giây quay cận cảnh môi, hàm, răng và góc cắt giải phẫu vòm miệng giúp học viên quan sát trực quan nhất.
            </p>
          </details>
        </div>
      </section>

      {/* 5-Stage Practice Studio Modal */}
      {selectedPhoneme && (
        <IpaPracticeStudio
          phoneme={selectedPhoneme}
          onClose={() => setSelectedPhoneme(null)}
          onFinished={handleRefreshProgress}
        />
      )}
    </div>
  );

  if (hasSession) {
    return (
      <StudentShell title="Phiên Âm IPA">
        {mainContent}
      </StudentShell>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Standalone Guest Header */}
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur-md px-4 sm:px-8 h-16 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/student" className="flex items-center gap-2">
            <span className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-md text-white">
              <Brain className="h-4 w-4 sm:h-5 sm:w-5" />
            </span>
            <span className="bg-gradient-to-br from-indigo-500 to-violet-500 bg-clip-text text-lg sm:text-xl font-black tracking-tight text-transparent">
              LingoPro
            </span>
          </Link>
          <span className="text-muted-foreground hidden sm:inline">/</span>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary hidden sm:inline-flex">
            🗣️ Phiên Âm IPA
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Link href="/journey" className="hidden sm:inline-flex">
            <Button variant="ghost" size="sm" className="rounded-xl text-xs font-semibold">
              Lộ trình
            </Button>
          </Link>
          <Link href="/auth">
            <Button variant="outline" size="sm" className="rounded-xl text-xs font-semibold h-8 px-2.5 sm:px-3">
              Đăng nhập
            </Button>
          </Link>
          <Link href="/auth?tab=register">
            <Button size="sm" className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs h-8 px-2.5 sm:px-3">
              Đăng ký
            </Button>
          </Link>
        </div>
      </header>

      {mainContent}
    </div>
  );
}

export default function IpaMasterclassPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-muted-foreground gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span>Đang nạp Bảng âm IPA...</span>
        </div>
      }
    >
      <IpaMasterclassContent />
    </React.Suspense>
  );
}
