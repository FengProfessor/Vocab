'use client';

import React from 'react';
import { Volume2, Layers } from 'lucide-react';
import { speak } from '@/lib/study';

export default function SvoSentenceDiagram() {
  const speakSentence = (text: string) => {
    speak(text, 0.9);
  };

  return (
    <div className="my-6 space-y-4 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          <h3 className="font-serif font-semibold text-foreground text-lg">Sơ đồ cấu trúc câu cơ bản (S – V – O)</h3>
        </div>
        <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground/80">
          Cấu trúc nền tảng
        </span>
      </div>

      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
        Một câu tiếng Anh chuẩn bắt buộc phải có đủ <strong>Chủ ngữ (S)</strong> và <strong>Động từ (V)</strong> theo đúng thứ tự cố định, không thể tùy ý lược bỏ như tiếng Việt.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* S */}
        <div className="p-4 bg-muted/20 rounded-xl flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="h-7 w-7 rounded-lg bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 font-bold text-sm flex items-center justify-center font-mono">S</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-sky-500/10 text-sky-700 dark:text-sky-300">
                Subject
              </span>
            </div>
            <h4 className="font-semibold text-sm text-foreground">Chủ ngữ (Ai? Cái gì?)</h4>
            <p className="text-xs text-muted-foreground mt-1">Danh từ, đại từ hoặc cụm danh từ thực hiện hành động.</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/40 text-xs font-mono font-medium text-foreground">
            <span>My sister / Lan / They</span>
          </div>
        </div>

        {/* V */}
        <div className="p-4 bg-muted/20 rounded-xl flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="h-7 w-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold text-sm flex items-center justify-center font-mono">V</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-300">
                Verb
              </span>
            </div>
            <h4 className="font-semibold text-sm text-foreground">Động từ (Làm gì? Là gì?)</h4>
            <p className="text-xs text-muted-foreground mt-1">Trọng tâm của câu: động từ to-be (am/is/are) hoặc Động từ thường.</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/40 text-xs font-mono font-medium text-foreground">
            <span>is / works / studies</span>
          </div>
        </div>

        {/* O */}
        <div className="p-4 bg-muted/20 rounded-xl flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="h-7 w-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold text-sm flex items-center justify-center font-mono">O / C</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                Object / Comp
              </span>
            </div>
            <h4 className="font-semibold text-sm text-foreground">Tân ngữ / Bổ ngữ</h4>
            <p className="text-xs text-muted-foreground mt-1">Đối tượng nhận tác động hoặc bổ sung ý nghĩa cho chủ ngữ.</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/40 text-xs font-mono font-medium text-foreground">
            <span>a doctor / English</span>
          </div>
        </div>
      </div>

      {/* Interactive Example */}
      <div className="p-3.5 bg-muted/20 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">Ví dụ minh họa:</span>
          <span className="font-mono text-foreground font-semibold">
            <span className="text-sky-600 dark:text-sky-400 underline decoration-sky-400/60">My sister</span>{' '}
            <span className="text-indigo-600 dark:text-indigo-400 underline decoration-indigo-400/60">is</span>{' '}
            <span className="text-emerald-600 dark:text-emerald-400 underline decoration-emerald-400/60">a student</span>.
          </span>
        </div>
        <button
          type="button"
          onClick={() => speakSentence('My sister is a student.')}
          className="px-3 py-1.5 rounded-lg bg-muted/40 hover:bg-muted text-foreground font-medium text-xs flex items-center gap-1.5 transition-colors shrink-0"
        >
          <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Nghe phát âm</span>
        </button>
      </div>
    </div>
  );
}
