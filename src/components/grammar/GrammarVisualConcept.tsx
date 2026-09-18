'use client';

import React from 'react';
import { Volume2, AlertCircle, ArrowLeftRight, GitFork, Scale, GitBranch, Target, BookOpen, MapPin, Mic, Compass } from 'lucide-react';
import { speak } from '@/lib/study';
import SvoSentenceDiagram from './SvoSentenceDiagram';
import TenseTimeline from './TenseTimeline';

interface GrammarVisualConceptProps {
  buoiNum: number;
  lessonTitle: string;
}

export default function GrammarVisualConcept({ buoiNum, lessonTitle }: GrammarVisualConceptProps) {
  const playAudio = (text: string) => {
    speak(text, 0.9);
  };

  // Buổi 1: SVO
  if (buoiNum === 1 || lessonTitle.toLowerCase().includes('xương câu') || lessonTitle.toLowerCase().includes('s-v-o')) {
    return <SvoSentenceDiagram />;
  }

  // Buổi 2, 3, 4, 5, 7: Thì động từ
  if ([2, 3, 4, 5, 7].includes(buoiNum) || /thì|hiện tại|quá khứ|tương lai/i.test(lessonTitle)) {
    return <TenseTimeline lessonTitle={lessonTitle} />;
  }

  // Buổi 6: Câu hỏi đuôi (Tag Questions)
  if (buoiNum === 6 || /hỏi đuôi|tag question/i.test(lessonTitle)) {
    return (
      <div className="my-6 space-y-4 animate-in fade-in duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4 text-primary" />
            <h3 className="font-serif font-semibold text-foreground text-lg">Quy tắc đảo dấu câu hỏi đuôi (Tag Questions)</h3>
          </div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground/80">
            Nguyên tắc bù trừ
          </span>
        </div>

        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Mệnh đề chính và phần đuôi luôn có <strong>dấu trái ngược nhau</strong>: Khẳng định ➔ Phủ định, và ngược lại.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-4 bg-muted/20 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-800 dark:text-emerald-300">
                Khẳng định (+) ➔ Phủ định (−)
              </span>
            </div>
            <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-foreground p-2.5 rounded-lg bg-background/60">
              <span>She is a doctor, <strong className="text-rose-600 dark:text-rose-400 underline">isn&apos;t she?</strong></span>
              <button
                type="button"
                onClick={() => playAudio("She is a doctor, isn't she?")}
                className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                title="Nghe phát âm"
              >
                <Volume2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="p-4 bg-muted/20 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded bg-rose-500/15 text-rose-800 dark:text-rose-300">
                Phủ định (−) ➔ Khẳng định (+)
              </span>
            </div>
            <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-foreground p-2.5 rounded-lg bg-background/60">
              <span>They don&apos;t like spicy food, <strong className="text-emerald-600 dark:text-emerald-400 underline">do they?</strong></span>
              <button
                type="button"
                onClick={() => playAudio("They don't like spicy food, do they?")}
                className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                title="Nghe phát âm"
              >
                <Volume2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Lưu ý & trường hợp đặc biệt */}
        <div className="p-3.5 bg-amber-500/[0.04] rounded-xl border-l-2 border-amber-500/60 text-xs space-y-1.5">
          <div className="font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>Trường hợp đặc biệt cần ghi nhớ:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-medium text-foreground">
            <div className="p-2 bg-background/60 rounded-lg">
              <code>I am... ➔ aren&apos;t I?</code>
            </div>
            <div className="p-2 bg-background/60 rounded-lg">
              <code>Let&apos;s... ➔ shall we?</code>
            </div>
            <div className="p-2 bg-background/60 rounded-lg">
              <code>Nobody / No one... ➔ they</code>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Buổi 8: Câu bị động (Passive Voice)
  if (buoiNum === 8 || /bị động|passive/i.test(lessonTitle)) {
    return (
      <div className="my-6 space-y-4 animate-in fade-in duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitFork className="h-4 w-4 text-primary" />
            <h3 className="font-serif font-semibold text-foreground text-lg">Sơ đồ chuyển đổi Chủ động ➔ Bị động (Active to Passive)</h3>
          </div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground/80">
            Công thức: be + V3/ed
          </span>
        </div>

        <div className="p-4 bg-muted/20 rounded-xl space-y-3.5">
          {/* Visual Transformation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-lg bg-background/60">
              <span className="text-[10px] font-semibold uppercase text-sky-700 dark:text-sky-300 bg-sky-500/10 px-2 py-0.5 rounded">
                Chủ Động (Active)
              </span>
              <p className="mt-2 text-sm font-semibold text-foreground flex items-center justify-between">
                <span>
                  <strong className="text-sky-600 dark:text-sky-400">The chef</strong> cooks{' '}
                  <strong className="text-emerald-600 dark:text-emerald-400">the dinner</strong>.
                </span>
                <button
                  type="button"
                  onClick={() => playAudio('The chef cooks the dinner.')}
                  className="p-1 rounded text-muted-foreground hover:text-foreground"
                  title="Nghe"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-background/60">
              <span className="text-[10px] font-semibold uppercase text-indigo-700 dark:text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded">
                Bị Động (Passive)
              </span>
              <p className="mt-2 text-sm font-semibold text-foreground flex items-center justify-between">
                <span>
                  <strong className="text-emerald-600 dark:text-emerald-400">The dinner</strong> is cooked{' '}
                  <strong className="text-sky-600 dark:text-sky-400">by the chef</strong>.
                </span>
                <button
                  type="button"
                  onClick={() => playAudio('The dinner is cooked by the chef.')}
                  className="p-1 rounded text-muted-foreground hover:text-foreground"
                  title="Nghe"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
              </p>
            </div>
          </div>

          {/* Quy tắc chia Be theo thì */}
          <div className="p-3 rounded-lg bg-background/60 text-xs font-mono grid grid-cols-2 sm:grid-cols-4 gap-2 text-foreground">
            <div>HTĐ: <strong className="text-primary">am/is/are + V3</strong></div>
            <div>QKĐ: <strong className="text-primary">was/were + V3</strong></div>
            <div>Tiếp diễn: <strong className="text-primary">be + being + V3</strong></div>
            <div>Hoàn thành: <strong className="text-primary">have/has been + V3</strong></div>
          </div>
        </div>
      </div>
    );
  }

  // Buổi 9: OSASCOMP & Word Form
  if (buoiNum === 9 || /osascomp|tính từ|word form/i.test(lessonTitle)) {
    const osascompItems = [
      { letter: 'O', name: 'Opinion', vi: 'Ý kiến (lovely, beautiful)', color: 'bg-rose-500' },
      { letter: 'S', name: 'Size', vi: 'Kích cỡ (big, small, huge)', color: 'bg-orange-500' },
      { letter: 'A', name: 'Age', vi: 'Tuổi tác (old, young, new)', color: 'bg-amber-500' },
      { letter: 'S', name: 'Shape', vi: 'Hình dáng (round, square)', color: 'bg-emerald-500' },
      { letter: 'C', name: 'Color', vi: 'Màu sắc (red, blue, black)', color: 'bg-teal-500' },
      { letter: 'O', name: 'Origin', vi: 'Nguồn gốc (Vietnamese)', color: 'bg-blue-500' },
      { letter: 'M', name: 'Material', vi: 'Chất liệu (wooden, silk)', color: 'bg-indigo-500' },
      { letter: 'P', name: 'Purpose', vi: 'Mục đích (dining, running)', color: 'bg-purple-500' },
    ];

    return (
      <div className="my-6 space-y-4 animate-in fade-in duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-primary" />
            <h3 className="font-serif font-semibold text-foreground text-lg">Trật tự tính từ đứng trước danh từ (OSASCOMP)</h3>
          </div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground/80">
            Thần chú OSASCOMP
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
          {osascompItems.map((item, idx) => (
            <div
              key={idx}
              className="p-2.5 bg-muted/20 rounded-xl flex flex-col items-center text-center"
            >
              <div className={`h-7 w-7 rounded-lg ${item.color} text-white flex items-center justify-center font-bold text-xs mb-1`}>
                {item.letter}
              </div>
              <span className="text-xs font-semibold text-foreground">{item.name}</span>
              <span className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{item.vi}</span>
            </div>
          ))}
        </div>

        {/* Ví dụ mẫu phát âm */}
        <div className="p-3 bg-muted/20 rounded-xl flex items-center justify-between gap-3 text-xs sm:text-sm">
          <div>
            <span className="font-semibold text-foreground">Ví dụ minh họa: </span>
            <span className="font-mono text-foreground font-medium">
              A <span className="text-rose-600 dark:text-rose-400">lovely</span> <span className="text-orange-600 dark:text-orange-400">small</span>{' '}
              <span className="text-amber-600 dark:text-amber-400">old</span> <span className="text-teal-600 dark:text-teal-400">black</span>{' '}
              <span className="text-indigo-600 dark:text-indigo-400">wooden</span> dining table.
            </span>
          </div>
          <button
            type="button"
            onClick={() => playAudio('A lovely small old black wooden dining table.')}
            className="p-1.5 rounded-lg bg-muted/40 hover:bg-muted text-foreground transition-colors"
            title="Nghe"
          >
            <Volume2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // Buổi 10: So sánh (Comparisons)
  if (buoiNum === 10 || /so sánh|comparison/i.test(lessonTitle)) {
    return (
      <div className="my-6 space-y-4 animate-in fade-in duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-primary" />
            <h3 className="font-serif font-semibold text-foreground text-lg">Các dạng so sánh tính từ & trạng từ (Comparison Scale)</h3>
          </div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground/80">
            Bằng · Hơn · Nhất · Kép
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 bg-muted/20 rounded-xl space-y-1">
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 uppercase">1. So sánh bằng (=)</span>
            <p className="font-mono text-xs font-semibold mt-1 text-foreground">as + Adj/Adv + as</p>
            <p className="text-xs text-muted-foreground mt-1">Tom is as tall as Peter.</p>
          </div>
          <div className="p-3.5 bg-muted/20 rounded-xl space-y-1">
            <span className="text-[11px] font-semibold text-sky-700 dark:text-sky-300 uppercase">2. So sánh hơn (&gt;)</span>
            <p className="font-mono text-xs font-semibold mt-1 text-foreground">Adj-er / more Adj + than</p>
            <p className="text-xs text-muted-foreground mt-1">Faster than / more expensive than.</p>
          </div>
          <div className="p-3.5 bg-muted/20 rounded-xl space-y-1">
            <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 uppercase">3. So sánh kép (Càng...càng)</span>
            <p className="font-mono text-xs font-semibold mt-1 text-foreground">The + comp, the + comp</p>
            <p className="text-xs text-muted-foreground mt-1">The more you learn, the wiser you become.</p>
          </div>
        </div>
      </div>
    );
  }

  // Buổi 11: Câu điều kiện (Conditionals)
  if (buoiNum === 11 || /điều kiện|conditional/i.test(lessonTitle)) {
    return (
      <div className="my-6 space-y-4 animate-in fade-in duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-primary" />
            <h3 className="font-serif font-semibold text-foreground text-lg">Hệ thống câu điều kiện (Conditionals Tree)</h3>
          </div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground/80">
            Loại 1, 2, 3 & Đảo ngữ
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 bg-muted/20 rounded-xl border-l-2 border-emerald-500 space-y-1">
            <h5 className="font-semibold text-xs text-emerald-700 dark:text-emerald-300 uppercase">Loại 1 — Có thật ở hiện tại/tương lai</h5>
            <p className="font-mono text-xs font-semibold mt-1 text-foreground">If + HTĐ, S + will + V-inf</p>
            <p className="text-[11px] text-muted-foreground mt-1">Đảo ngữ: <code>Should + S + V-inf...</code></p>
          </div>
          <div className="p-3.5 bg-muted/20 rounded-xl border-l-2 border-sky-500 space-y-1">
            <h5 className="font-semibold text-xs text-sky-700 dark:text-sky-300 uppercase">Loại 2 — Trái ngược hiện tại</h5>
            <p className="font-mono text-xs font-semibold mt-1 text-foreground">If + QKĐ (were), S + would + V-inf</p>
            <p className="text-[11px] text-muted-foreground mt-1">Đảo ngữ: <code>Were + S + (to V)...</code></p>
          </div>
          <div className="p-3.5 bg-muted/20 rounded-xl border-l-2 border-purple-500 space-y-1">
            <h5 className="font-semibold text-xs text-purple-700 dark:text-purple-300 uppercase">Loại 3 — Trái ngược quá khứ</h5>
            <p className="font-mono text-xs font-semibold mt-1 text-foreground">If + QKHT, S + would have + V3</p>
            <p className="text-[11px] text-muted-foreground mt-1">Đảo ngữ: <code>Had + S + V3/ed...</code></p>
          </div>
        </div>
      </div>
    );
  }

  // Buổi 13: Mệnh đề quan hệ (Relative Clauses)
  if (buoiNum === 13 || /mệnh đề quan hệ|relative/i.test(lessonTitle)) {
    return (
      <div className="my-6 space-y-4 animate-in fade-in duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <h3 className="font-serif font-semibold text-foreground text-lg">Quy tắc chọn đại từ quan hệ (Relative Pronouns)</h3>
          </div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground/80">
            Người vs Vật
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="p-3 bg-muted/20 rounded-xl text-center">
            <span className="font-mono font-bold text-base text-sky-600 dark:text-sky-400">WHO</span>
            <p className="font-semibold mt-1 text-foreground">Người làm Chủ ngữ</p>
            <code className="text-[10px] block mt-1 text-muted-foreground">S(người) + WHO + V</code>
          </div>
          <div className="p-3 bg-muted/20 rounded-xl text-center">
            <span className="font-mono font-bold text-base text-indigo-600 dark:text-indigo-400">WHOM</span>
            <p className="font-semibold mt-1 text-foreground">Người làm Tân ngữ</p>
            <code className="text-[10px] block mt-1 text-muted-foreground">S(người) + WHOM + S + V</code>
          </div>
          <div className="p-3 bg-muted/20 rounded-xl text-center">
            <span className="font-mono font-bold text-base text-emerald-600 dark:text-emerald-400">WHICH</span>
            <p className="font-semibold mt-1 text-foreground">Vật (S hoặc O)</p>
            <code className="text-[10px] block mt-1 text-muted-foreground">S(vật) + WHICH + V / S+V</code>
          </div>
          <div className="p-3 bg-muted/20 rounded-xl text-center">
            <span className="font-mono font-bold text-base text-amber-600 dark:text-amber-400">WHOSE</span>
            <p className="font-semibold mt-1 text-foreground">Sở hữu (N của N)</p>
            <code className="text-[10px] block mt-1 text-muted-foreground">N + WHOSE + N</code>
          </div>
        </div>
      </div>
    );
  }

  // Buổi 17: Mạo từ (Articles A/An/The)
  if (buoiNum === 17 || /mạo từ|article/i.test(lessonTitle)) {
    return (
      <div className="my-6 space-y-4 animate-in fade-in duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <h3 className="font-serif font-semibold text-foreground text-lg">Quy tắc chọn mạo từ: A / An / The / Ø</h3>
          </div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground/80">
            Đếm được & Xác định
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 bg-muted/20 rounded-xl space-y-1">
            <span className="font-bold text-sm text-sky-600 dark:text-sky-400">A / AN</span>
            <p className="font-semibold mt-1 text-foreground">Đếm được số ít, chưa xác định (lần đầu)</p>
            <p className="text-muted-foreground mt-1">Dùng <strong>AN</strong> trước nguyên âm phát âm: <code>u, e, o, a, i</code>.</p>
          </div>
          <div className="p-3.5 bg-muted/20 rounded-xl space-y-1">
            <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">THE</span>
            <p className="font-semibold mt-1 text-foreground">Đã xác định, người nghe đã biết, độc nhất</p>
            <p className="text-muted-foreground mt-1">The sun, the moon, the boy in blue, so sánh nhất.</p>
          </div>
          <div className="p-3.5 bg-muted/20 rounded-xl space-y-1">
            <span className="font-bold text-sm text-rose-600 dark:text-rose-400">Ø (Không mạo từ)</span>
            <p className="font-semibold mt-1 text-foreground">Không đếm được / số nhiều nói chung</p>
            <p className="text-muted-foreground mt-1">Water, dogs, tennis, breakfast, English.</p>
          </div>
        </div>
      </div>
    );
  }

  // Buổi 18: Giới từ In / On / At
  if (buoiNum === 18 || /giới từ|preposition/i.test(lessonTitle)) {
    return (
      <div className="my-6 space-y-4 animate-in fade-in duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <h3 className="font-serif font-semibold text-foreground text-lg">Mô hình giới từ In – On – At (Thời gian & Địa điểm)</h3>
          </div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground/80">
            Phạm vi: Rộng ➔ Hẹp
          </span>
        </div>

        <div className="space-y-2">
          <div className="p-3 rounded-xl bg-sky-500/10 text-xs font-medium text-sky-900 dark:text-sky-200 text-center">
            <span className="font-bold">IN (Rộng nhất)</span> · Năm (in 2026), Tháng (in May), Mùa (in summer), Quốc gia (in Vietnam), Thành phố (in Hanoi)
          </div>
          <div className="p-3 rounded-xl bg-indigo-500/10 text-xs font-medium text-indigo-900 dark:text-indigo-200 text-center mx-3 sm:mx-6">
            <span className="font-bold">ON (Vừa phải)</span> · Thứ (on Monday), Ngày cụ thể (on May 5th), Con đường (on Tran Phu Street)
          </div>
          <div className="p-3 rounded-xl bg-violet-500/10 text-xs font-medium text-violet-900 dark:text-violet-200 text-center mx-6 sm:mx-12">
            <span className="font-bold">AT (Cụ thể nhất)</span> · Giờ giấc (at 7 o&apos;clock), Địa chỉ cụ thể có số nhà (at 123 Main St)
          </div>
        </div>
      </div>
    );
  }

  // Buổi 24: Ngữ âm & Trọng âm (-s/es, -ed)
  if (buoiNum === 24 || /ngữ âm|trọng âm|phonetics|stress/i.test(lessonTitle)) {
    return (
      <div className="my-6 space-y-4 animate-in fade-in duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mic className="h-4 w-4 text-primary" />
            <h3 className="font-serif font-semibold text-foreground text-lg">Quy tắc phát âm đuôi -s/es & -ed</h3>
          </div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground/80">
            Kèm audio phát âm
          </span>
        </div>

        {/* -s/es */}
        <div className="p-4 bg-muted/20 rounded-xl space-y-2.5">
          <div className="flex items-center justify-between">
            <h5 className="font-semibold text-xs text-rose-700 dark:text-rose-300 uppercase">
              1. Đuôi -S / -ES (3 trường hợp):
            </h5>
            <span className="text-[10px] text-muted-foreground font-mono">Mẹo nhớ nhanh</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-background/60 flex items-center justify-between">
              <div>
                <span className="font-mono font-bold text-rose-600 dark:text-rose-400">/s/</span>: p, k, t, f, th
                <p className="text-[10px] text-muted-foreground mt-0.5">&quot;Thời phong kiến phương Tây&quot;</p>
              </div>
              <button type="button" onClick={() => playAudio('books cats stops')} className="p-1 text-muted-foreground hover:text-foreground">
                <Volume2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="p-2.5 rounded-lg bg-background/60 flex items-center justify-between">
              <div>
                <span className="font-mono font-bold text-rose-600 dark:text-rose-400">/ɪz/</span>: s, x, z, ch, sh, ge
                <p className="text-[10px] text-muted-foreground mt-0.5">&quot;Sóng gió chẳng sợ zì&quot;</p>
              </div>
              <button type="button" onClick={() => playAudio('kisses boxes watches')} className="p-1 text-muted-foreground hover:text-foreground">
                <Volume2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="p-2.5 rounded-lg bg-background/60 flex items-center justify-between">
              <div>
                <span className="font-mono font-bold text-rose-600 dark:text-rose-400">/z/</span>: Còn lại
                <p className="text-[10px] text-muted-foreground mt-0.5">Tất cả nguyên âm & phụ âm còn lại</p>
              </div>
              <button type="button" onClick={() => playAudio('plays dogs lives')} className="p-1 text-muted-foreground hover:text-foreground">
                <Volume2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* -ed */}
        <div className="p-4 bg-muted/20 rounded-xl space-y-2.5">
          <div className="flex items-center justify-between">
            <h5 className="font-semibold text-xs text-indigo-700 dark:text-indigo-300 uppercase">
              2. Đuôi -ED (3 trường hợp):
            </h5>
            <span className="text-[10px] text-muted-foreground font-mono">Mẹo nhớ nhanh</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-background/60 flex items-center justify-between">
              <div>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">/ɪd/</span>: Tận cùng t, d
                <p className="text-[10px] text-muted-foreground mt-0.5">&quot;Tiền đô&quot; (wanted, needed)</p>
              </div>
              <button type="button" onClick={() => playAudio('wanted needed')} className="p-1 text-muted-foreground hover:text-foreground">
                <Volume2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="p-2.5 rounded-lg bg-background/60 flex items-center justify-between">
              <div>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">/t/</span>: ch, p, f, s, k, th, sh
                <p className="text-[10px] text-muted-foreground mt-0.5">&quot;Chính phủ phát sách không thèm share&quot;</p>
              </div>
              <button type="button" onClick={() => playAudio('watched stopped laughed')} className="p-1 text-muted-foreground hover:text-foreground">
                <Volume2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="p-2.5 rounded-lg bg-background/60 flex items-center justify-between">
              <div>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">/d/</span>: Còn lại
                <p className="text-[10px] text-muted-foreground mt-0.5">played, cleaned, arrived</p>
              </div>
              <button type="button" onClick={() => playAudio('played cleaned arrived')} className="p-1 text-muted-foreground hover:text-foreground">
                <Volume2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback for general lessons: Strategy & Core Rule Card
  return (
    <div className="my-6 p-4 sm:p-5 rounded-xl bg-muted/20 space-y-2 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Compass className="h-4 w-4 text-primary" />
          <h4 className="font-serif font-semibold text-foreground text-sm sm:text-base">Trọng tâm kiến thức: Buổi {buoiNum} · {lessonTitle}</h4>
        </div>
        <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground/80">
          Ngữ pháp ứng dụng
        </span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Nắm vững bản chất ngữ pháp thông qua bảng tra cứu nhanh ở tab Bảng tra cứu, xem video phân tích và củng cố phản xạ với ngân hàng câu hỏi bài tập.
      </p>
    </div>
  );
}
