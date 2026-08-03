'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { completeRoadmapStep, getLastRoadmapStepError } from '@/lib/roadmap-client';
import Link from 'next/link';
import { StudentShell } from '@/components/student/StudentShell';
import { LazyMarkdown } from '@/components/perf/LazyMarkdown';
import { supabase } from '@/lib/supabase';
import type { GrammarTopic, GrammarLesson, GrammarProgress } from '@/lib/supabase';
import GrammarHighlight, { type WordAnnotation } from '@/components/grammar/GrammarHighlight';
import TenseTimeline from '@/components/grammar/TenseTimeline';
import GoldenLesson from '@/components/grammar/GoldenLesson';
import { GrammarFormula } from '@/components/grammar/GrammarFormula';
import {
  ChevronLeft, ChevronDown, ChevronUp, Loader2, GraduationCap, CheckCircle2, XCircle, Clock, Dumbbell, BookOpen, Volume2, History, FileDown, Sparkles, Split,
} from 'lucide-react';
import { toast } from 'sonner';
import { speak } from '@/lib/study';
import { resolveImageSrc } from '@/lib/media-url';
import {
  buildGrammarLessonPdfHtml,
  downloadGrammarPdfHtml,
  openBlankPdfWindow,
  writePdfHtmlToWindow,
  suggestGrammarPdfFileName,
} from '@/lib/grammar-lesson-pdf';

interface TopicProgressSummary {
  topicId: string;
  title: string;
  titleVi: string | null;
  level: string;
  totalLessons: number;
  /** Có progress (đã đọc/làm) — nguồn tick "đã hoàn thành". */
  learnedLessons: number;
  masteredLessons: number;
  avgMasteryScore: number;
  nextDueDate: string | null;
}

/** 5 Chặng Lộ Trình Ngữ Pháp THPT QG */
const STAGES = [
  {
    id: 1,
    name: 'CHẶNG 1: Thì & Nền Tảng Chia Động Từ',
    sub: 'Buổi 01 – 07 • Nền tảng A0–A1',
    icon: '🌱',
    grad: 'from-emerald-600 via-teal-600 to-cyan-700',
    badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    range: [1, 7],
  },
  {
    id: 2,
    name: 'CHẶNG 2: Cấu Trúc Biến Đổi & Viết Lại Câu',
    sub: 'Buổi 08 – 12 • Cứng cáp A2',
    icon: '⚡',
    grad: 'from-blue-600 via-indigo-600 to-violet-700',
    badgeStyle: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
    range: [8, 12],
  },
  {
    id: 3,
    name: 'CHẶNG 3: Mệnh Đề & Từ Nối Mức Độ Khá',
    sub: 'Buổi 13 – 16 • Thông thạo A2+',
    icon: '🧩',
    grad: 'from-purple-600 via-fuchsia-600 to-pink-700',
    badgeStyle: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
    range: [13, 16],
  },
  {
    id: 4,
    name: 'CHẶNG 4: Vùng Điểm 8+ & Nâng Cao THPT QG',
    sub: 'Buổi 17 – 21 • Chuyên sâu B1+',
    icon: '🎓',
    grad: 'from-amber-600 via-orange-600 to-red-700',
    badgeStyle: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    range: [17, 21],
  },
  {
    id: 5,
    name: 'CHẶNG 5: Tổng Ôn Đề Trộn & Phản Xạ Phòng Thi',
    sub: 'Buổi 22 – 25 • Chinh phục 9+',
    icon: '🏆',
    grad: 'from-rose-600 via-pink-600 to-purple-700',
    badgeStyle: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
    range: [22, 25],
  },
] as const;

function parseTopicTitle(raw: string): { badge: string; displayTitle: string; buoiNum: number } {
  if (!raw) return { badge: 'THPT QG', displayTitle: '', buoiNum: 1 };
  const match = raw.match(/^Buổi\s+(\d+)\s*[:\-\u2013\u2014]\s*(.+)$/i);
  if (match) {
    const num = parseInt(match[1], 10);
    return {
      badge: `BUỔI ${String(num).padStart(2, '0')}`,
      displayTitle: match[2].trim(),
      buoiNum: num,
    };
  }
  return { badge: 'CHUYÊN ĐỀ', displayTitle: raw.trim(), buoiNum: 1 };
}


/** Đọc câu tiếng Anh — voice EN tường minh (tránh giọng Việt). */
function speakEnglish(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    toast.error('Trình duyệt không hỗ trợ đọc giọng nói.');
    return;
  }
  speak(text, 0.9);
}

function ensureMarkdownTableFormat(text: string): string {
  if (!text) return '';
  const lines = text.split('\n');
  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    // Smashed || rows -> split into clean | col1 | col2 |
    if (line.includes('||')) {
      const segs = line.split('||').map((s) => s.trim()).filter(Boolean);
      if (segs.length > 1) {
        line = '| ' + segs.join(' | ') + ' |';
      }
    }

    // If line looks like a table row: starts/ends with | or has >= 2 pipes
    const isPipeLine = line.includes('|') && !line.startsWith('#') && !line.startsWith('```');

    if (isPipeLine) {
      const cells = line.split('|').map((s) => s.trim()).filter(Boolean);
      if (cells.length >= 2) {
        const prevLine = result[result.length - 1] || '';
        const prevIsPipe = prevLine.includes('|') && !prevLine.startsWith('#');

        if (!prevIsPipe) {
          result.push(`| ${cells.join(' | ')} |`);
          const nextLine = lines[i + 1] ? lines[i + 1].trim() : '';
          const nextIsDivider = /^\|?\s*:?-+:?\s*\|/.test(nextLine);
          if (!nextIsDivider) {
            result.push(`| ${cells.map(() => '---').join(' | ')} |`);
          }
          continue;
        }
      }
    }

    result.push(lines[i]);
  }

  return result.join('\n');
}

function formatOcrTheory(text: string): string {
  if (!text) return '';

  const cleanText = ensureMarkdownTableFormat(text);

  // Nếu text đã có định dạng Markdown chuẩn (bảng, tiêu đề, codeblock), trả về trực tiếp không phá vỡ dòng
  if (cleanText.includes('| --- |') || cleanText.includes('|---|') || cleanText.includes('| ---') || cleanText.includes('```formula') || cleanText.includes('## ')) {
    return cleanText;
  }

  // 1. Chuẩn hóa xuống dòng
  const normalized = text.replace(/\r\n/g, '\n');

  // 2. Phân tách dòng và gộp các câu bị bẻ xuống dòng lỗi do OCR
  const lines = normalized.split('\n');
  const resultLines: string[] = [];
  let currentLine = '';

  // Nhận diện các ký tự bắt đầu của danh sách hoặc tiêu đề chính
  const listPattern = /^(?:\*\*|\*)?(?:\d+(?:\.\d+)*[\.\)]\s+|[a-z][\.\)]\s+|\-|•|Ex:|Ví dụ:|Note:|\*\s+)/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Kiểm tra xem dòng hiện tại kết thúc bằng dấu hai chấm (báo hiệu sắp có danh sách/ví dụ)
    const currentEndsWithColon = currentLine && (
      currentLine.endsWith(':') || 
      currentLine.endsWith('** :') || 
      currentLine.endsWith('**:') ||
      currentLine.endsWith('*:')
    );

    // Dòng mới bắt đầu mục lục hoặc tiêu đề chính hoặc danh sách
    const isNewSection = listPattern.test(line) || 
                         line.startsWith('##') || 
                         line.startsWith('###') ||
                         line.startsWith('>') ||
                         currentEndsWithColon;

    if (isNewSection) {
      if (currentLine) {
        resultLines.push(currentLine);
      }
      currentLine = line;
    } else {
      if (currentLine) {
        if (currentLine.endsWith('-')) {
          // Bỏ gạch nối nối từ (ví dụ: con- \n tinue)
          currentLine = currentLine.slice(0, -1) + line;
        } else {
          currentLine += ' ' + line;
        }
      } else {
        currentLine = line;
      }
    }
  }

  if (currentLine) {
    resultLines.push(currentLine);
  }

  // 3. Định dạng markdown cho từng dòng đã gộp và xử lý lỗi ghép cặp bold/italic
  const formatted = resultLines.map(line => {
    let clean = line;

    // Ghép các cụm bold bị ngắt dòng: ví dụ "abstract** **nouns)" -> "abstract nouns)"
    clean = clean.replace(/\*\*\s+\*\*/g, ' ');
    clean = clean.replace(/\*\s+\*/g, ' ');

    // Làm nổi bật các đề mục chính bắt đầu bằng số như "1. ", "2. ", "1.1. "
    if (/^(?:\*\*)?\d+(\.\d+)*\.?\s/i.test(clean)) {
      if (!clean.startsWith('**') && !clean.startsWith('##')) {
        clean = '**' + clean.replace(/^(\d+(\.\d+)*\.?\s+)/, '$1**');
      }
    }

    // Định dạng danh sách con chữ cái "a. ", "b. " thụt dòng
    if (/^(?:\*\*)?[a-z]\.\s/i.test(clean)) {
      if (!clean.startsWith('  -')) {
        clean = '  - ' + clean;
      }
    }

    // Định dạng ví dụ "Ex: " -> bọc blockquote cho bắt mắt
    if (/^(?:\*\*)?Ex:\s*/i.test(clean)) {
      clean = '> **Ví dụ:** ' + clean.replace(/^(?:\*\*)?Ex:\s*/i, '');
    }
    
    return clean;
  }).join('\n\n');

  return formatted;
}

const markdownComponents = {
  h2: ({ node: _node, ...props }: any) => (
    <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2.5 mb-4 mt-6 flex items-center gap-2" {...props} />
  ),
  h3: ({ node: _node, ...props }: any) => (
    <h3 className="text-lg font-extrabold text-slate-700 dark:text-slate-200 mb-3 mt-4" {...props} />
  ),
  blockquote: ({ node: _node, ...props }: any) => (
    <blockquote className="my-4 p-4 bg-amber-50/70 dark:bg-amber-950/40 border-l-4 border-amber-500 rounded-r-2xl text-amber-900 dark:text-amber-200 text-sm leading-relaxed" {...props} />
  ),
  table: ({ node: _node, ...props }: any) => (
    <div className="overflow-x-auto my-6 rounded-2xl border border-slate-200/80 shadow-md bg-white dark:bg-slate-900 dark:border-slate-800">
      <table className="w-full text-left text-sm text-slate-700 dark:text-slate-200 border-collapse" {...props} />
    </div>
  ),
  thead: ({ node: _node, ...props }: any) => <thead className="bg-indigo-50/90 dark:bg-indigo-950/60 text-xs text-indigo-950 dark:text-indigo-200 uppercase font-black tracking-wider border-b border-indigo-100 dark:border-indigo-900" {...props} />,
  th: ({ node: _node, ...props }: any) => <th className="px-4 py-3.5 border-b font-extrabold tracking-wider text-indigo-950 dark:text-indigo-100" {...props} />,
  td: ({ node: _node, ...props }: any) => <td className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300" {...props} />,
  tr: ({ node: _node, ...props }: any) => <tr className="odd:bg-white even:bg-slate-50/60 dark:odd:bg-slate-900 dark:even:bg-slate-800/40 hover:bg-indigo-50/40 dark:hover:bg-indigo-900/30 transition-colors" {...props} />,
  ul: ({ node: _node, ...props }: any) => <ul className="my-4 space-y-2.5 list-disc list-inside text-slate-700 dark:text-slate-200" {...props} />,
  ol: ({ node: _node, ...props }: any) => <ol className="my-4 space-y-2.5 list-decimal list-inside text-slate-700 dark:text-slate-200" {...props} />,
  li: ({ node: _node, ...props }: any) => <li className="leading-relaxed font-medium marker:text-primary marker:font-bold" {...props} />,
  code: ({ node: _node, inline, className: _className, children, ...props }: {
    node?: unknown;
    inline?: boolean;
    className?: string;
    children?: React.ReactNode;
  } & React.HTMLAttributes<HTMLElement>) => {
    const codeText = String(children).replace(/\n$/, '');
    if (!inline && _className === 'language-formula') {
      return <GrammarFormula code={codeText} />;
    }
    const isFormula = (codeText.includes('+') || codeText.includes('→') || codeText.includes('=>')) && codeText.length < 80;
    if (inline) {
      if (isFormula) {
        return (
          <code className="px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-black font-mono text-xs inline-block mx-1.5 shadow-sm" {...props}>
            {codeText}
          </code>
        );
      }
      return (
        <code className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold font-mono text-xs mx-0.5" {...props}>
          {codeText}
        </code>
      );
    }
    return (
      <pre className="p-4 rounded-2xl bg-slate-900 text-slate-200 font-mono text-sm overflow-x-auto shadow-inner my-4 border border-slate-800">
        <code {...props}>{codeText}</code>
      </pre>
    );
  }
};

function cleanAnswer(s: string): string {
  return (s || '')
    .toLowerCase()
    .trim()
    .replace(/[’`]/g, "'")
    .replace(/\s+/g, ' ');
}

function expandContractions(str: string): string[] {
  const base = cleanAnswer(str)
    .replace(/\bdđin't\b/g, "didn't")
    .replace(/\b([a-z]+)\s*\.\.\.\s*([a-z]+)\b/gi, '$1 $2')
    .replace(/[,/]/g, ' ');

  const var1 = base
    .replace(/\bdidn't\b/g, 'did not')
    .replace(/\bdoesn't\b/g, 'does not')
    .replace(/\bdon't\b/g, 'do not')
    .replace(/\bisn't\b/g, 'is not')
    .replace(/\baren't\b/g, 'are not')
    .replace(/\bwasn't\b/g, 'was not')
    .replace(/\bweren't\b/g, 'were not')
    .replace(/\bhaven't\b/g, 'have not')
    .replace(/\bhasn't\b/g, 'has not')
    .replace(/\bwon't\b/g, 'will not')
    .replace(/\bcan't\b/g, 'cannot')
    .replace(/\bshan't\b/g, 'shall not')
    .replace(/\bshouldn't\b/g, 'should not')
    .replace(/\bwouldn't\b/g, 'would not')
    .replace(/\bcouldn't\b/g, 'could not')
    .replace(/\bain't\b/g, 'am not')
    .replace(/\bit's\b/g, 'it is')
    .replace(/\bhe's\b/g, 'he is')
    .replace(/\bshe's\b/g, 'she is')
    .replace(/\bthat's\b/g, 'that is')
    .replace(/\bthere's\b/g, 'there is')
    .replace(/\bwhat's\b/g, 'what is')
    .replace(/\bthey're\b/g, 'they are')
    .replace(/\byou're\b/g, 'you are')
    .replace(/\bwe're\b/g, 'we are')
    .replace(/\bi'm\b/g, 'i am')
    .replace(/\bi've\b/g, 'i have')
    .replace(/\bthey've\b/g, 'they have')
    .replace(/\bwe've\b/g, 'we have')
    .replace(/\byou've\b/g, 'you have')
    .replace(/\bi'll\b/g, 'i will')
    .replace(/\bhe'll\b/g, 'he will')
    .replace(/\bshe'll\b/g, 'she will')
    .replace(/\bthey'll\b/g, 'they will')
    .replace(/\bwe'll\b/g, 'we will')
    .replace(/\byou'll\b/g, 'you will');

  const var2 = base.replace(/['’]/g, '');

  return [base, var1, var2, cleanAnswer(str)];
}

function areAnswersEqual(userAns: string, correctAns: string): boolean {
  if (!userAns || !correctAns) return false;

  const uVariants = expandContractions(userAns);
  const cPossibilities = (correctAns || '')
    .split(/[,/]/)
    .map((s) => s.trim())
    .filter(Boolean);

  for (const pos of cPossibilities) {
    const cVariants = expandContractions(pos);
    for (const u of uVariants) {
      if (cVariants.includes(u)) return true;
      const uStripped = u.replace(/[^a-z0-9]/g, '');
      for (const c of cVariants) {
        if (uStripped === c.replace(/[^a-z0-9]/g, '')) return true;
      }
    }
  }

  return false;
}

function InlineGapQuestion({
  question,
  userAns,
  onChangeAns,
  submitted,
  isCorrect,
  onEnterSubmit,
}: {
  question: string;
  userAns: string;
  onChangeAns: (val: string) => void;
  submitted: boolean;
  isCorrect: boolean;
  onEnterSubmit: () => void;
}) {
  const parts = question.split(/(_{2,}|\[\[.*?\]\])/g);
  const gapCount = parts.filter((p) => /^_{2,}$|^\[\[.*?\]\]$/.test(p)).length;

  const [gaps, setGaps] = useState<string[]>(() => new Array(Math.max(1, gapCount)).fill(''));

  useEffect(() => {
    const count = parts.filter((p) => /^_{2,}$|^\[\[.*?\]\]$/.test(p)).length;
    setGaps(new Array(Math.max(1, count)).fill(''));
  }, [question]);

  const handleGapChange = (idx: number, val: string) => {
    const newGaps = [...gaps];
    newGaps[idx] = val;
    setGaps(newGaps);
    onChangeAns(newGaps.join(' '));
  };

  if (gapCount === 0) {
    return (
      <div className="space-y-3">
        <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
          {question}
        </h4>
        <input
          type="text"
          disabled={submitted}
          value={userAns}
          onChange={(e) => onChangeAns(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !submitted) onEnterSubmit(); }}
          placeholder="Nhập câu trả lời..."
          className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary text-sm font-semibold bg-background"
        />
      </div>
    );
  }

  let gapCounter = 0;

  return (
    <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
      {parts.map((part, i) => {
        if (/^_{2,}$|^\[\[.*?\]\]$/.test(part)) {
          const currentGapIdx = gapCounter++;
          const val = gaps[currentGapIdx] || '';

          let inputStyle = 'border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-primary bg-background text-primary';
          if (submitted) {
            inputStyle = isCorrect
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 font-black ring-2 ring-emerald-200'
              : 'border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-700 font-black ring-2 ring-rose-200';
          }

          return (
            <input
              key={i}
              type="text"
              disabled={submitted}
              value={val}
              onChange={(e) => handleGapChange(currentGapIdx, e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !submitted) onEnterSubmit(); }}
              placeholder={`chỗ trống ${currentGapIdx + 1}`}
              className={`mx-1.5 px-3 py-1.5 border rounded-xl font-extrabold font-mono text-sm inline-block shadow-sm text-center min-w-[110px] max-w-[170px] transition-all ${inputStyle}`}
            />
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </div>
  );
}

function ErrorCorrectionQuestion({
  question,
  userAns,
  onChangeAns,
  submitted,
  isCorrect,
  correctAnswer,
}: {
  question: string;
  userAns: string;
  onChangeAns: (val: string) => void;
  submitted: boolean;
  isCorrect: boolean;
  correctAnswer: string;
}) {
  const parts = question.split(/(\[\[.*?\]\])/g);
  const candidateCount = parts.filter((p) => /^\[\[.*?\]\]$/.test(p)).length;

  if (candidateCount === 0) {
    return (
      <div className="space-y-3">
        <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
          {question}
        </h4>
        <input
          type="text"
          disabled={submitted}
          value={userAns}
          onChange={(e) => onChangeAns(e.target.value)}
          placeholder="Nhập lỗi sai và từ sửa..."
          className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary text-sm font-semibold bg-background"
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
        {parts.map((part, i) => {
          if (/^\[\[.*?\]\]$/.test(part)) {
            const rawWord = part.replace(/^\[\[|\]\]$/g, '').trim();
            const isSelected = cleanAnswer(userAns) === cleanAnswer(rawWord) || userAns.includes(rawWord);

            let btnStyle = 'border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 bg-indigo-50/70 dark:bg-indigo-950/40';
            if (submitted) {
              const isTargetError = cleanAnswer(correctAnswer).includes(cleanAnswer(rawWord)) || cleanAnswer(rawWord).includes(cleanAnswer(correctAnswer.split(' ')[0]));
              if (isTargetError) {
                btnStyle = 'border-emerald-500 bg-emerald-600 text-white font-black ring-2 ring-emerald-300 shadow-md';
              } else if (isSelected && !isCorrect) {
                btnStyle = 'border-rose-500 bg-rose-600 text-white font-black line-through shadow-md';
              } else {
                btnStyle = 'opacity-40 border-slate-200 dark:border-slate-800';
              }
            } else if (isSelected) {
              btnStyle = 'border-primary bg-primary text-white font-extrabold ring-2 ring-primary/30 shadow-md';
            }

            return (
              <button
                key={i}
                type="button"
                disabled={submitted}
                onClick={() => onChangeAns(rawWord)}
                className={`mx-1 px-2.5 py-1 rounded-xl border underline decoration-2 font-extrabold text-sm transition-all ${btnStyle}`}
              >
                {rawWord}
              </button>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </div>
      <p className="text-xs text-muted-foreground italic flex items-center gap-1">
        <span>👉 Click vào từ gạch chân ở trên để chọn vị trí bị lỗi sai!</span>
      </p>
    </div>
  );
}

function InlineLessonQuizPanel({
  exercises,
  panelTitle,
  onClose,
  isSplitView = false,
}: {
  exercises: any[];
  panelTitle?: string;
  onClose?: () => void;
  isSplitView?: boolean;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAns, setUserAns] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);

  if (!exercises || exercises.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground bg-background border rounded-3xl shadow-sm">
        <Dumbbell className="h-10 w-10 mx-auto mb-2 opacity-30 text-primary" />
        <p className="font-bold text-sm">Chưa có bài tập cho phần này.</p>
        <p className="text-xs mt-1">Vui lòng làm bài tập tổng hợp ở cuối bài!</p>
      </div>
    );
  }

  const currentEx = exercises[currentIndex];

  const handleSubmit = () => {
    if (!userAns.trim()) return;
    const correct = areAnswersEqual(userAns, currentEx.correct_answer);
    setIsCorrect(correct);
    setSubmitted(true);
    if (correct) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    setSubmitted(false);
    setUserAns('');
    if (currentIndex < exercises.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  return (
    <div className={`flex flex-col h-full bg-background border rounded-3xl shadow-xl overflow-hidden ${isSplitView ? 'border-primary/30 ring-1 ring-primary/10' : ''}`}>
      {/* Header */}
      <div className="px-5 py-3.5 bg-gradient-to-r from-primary via-indigo-600 to-purple-600 text-white flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0 pr-2">
          <Dumbbell className="h-4 w-4 shrink-0" />
          <span className="font-extrabold text-sm truncate">{panelTitle || 'Luyện Tập Trực Tiếp'}</span>
          <span className="shrink-0 bg-white/20 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
            {currentIndex + 1} / {exercises.length}
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="h-7 w-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xs font-bold transition-colors shrink-0"
            title="Đóng"
          >
            ✕
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5">
        <div
          className="bg-primary h-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / exercises.length) * 100}%` }}
        />
      </div>

      {/* Quiz Content Body */}
      <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-4">
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-md mb-2 inline-block">
            {currentEx.type === 'multiple_choice' ? 'Trắc nghiệm' : currentEx.type === 'error_correction' ? 'Tìm lỗi sai' : 'Điền vào chỗ trống'}
          </span>

          {currentEx.type === 'error_correction' ? (
            <ErrorCorrectionQuestion
              question={currentEx.question}
              userAns={userAns}
              onChangeAns={setUserAns}
              submitted={submitted}
              isCorrect={isCorrect}
              correctAnswer={currentEx.correct_answer}
            />
          ) : currentEx.options && currentEx.options.length > 0 ? (
            <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
              {currentEx.question}
            </h4>
          ) : (
            <InlineGapQuestion
              question={currentEx.question}
              userAns={userAns}
              onChangeAns={setUserAns}
              submitted={submitted}
              isCorrect={isCorrect}
              onEnterSubmit={handleSubmit}
            />
          )}
        </div>

        {/* Options list for Multiple Choice */}
        {currentEx.options && currentEx.options.length > 0 && currentEx.type !== 'error_correction' && (
          <div className="space-y-2.5">
            {currentEx.options.map((opt: string, idx: number) => {
              const cleanOpt = opt.replace(/^[A-D]\.\s*/i, '');
              const isSelected = cleanAnswer(userAns) === cleanAnswer(cleanOpt) || userAns === opt;
              const isRightOpt = areAnswersEqual(cleanOpt, currentEx.correct_answer);

              let optionStyle = 'border-slate-200 dark:border-slate-700 hover:border-primary/50 hover:bg-primary/5';
              if (submitted) {
                if (isRightOpt) {
                  optionStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 font-bold';
                } else if (isSelected && !isCorrect) {
                  optionStyle = 'border-rose-500 bg-rose-50 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200 font-bold';
                } else {
                  optionStyle = 'border-slate-200 dark:border-slate-800 opacity-50';
                }
              } else if (isSelected) {
                optionStyle = 'border-primary bg-primary/10 text-primary font-bold ring-2 ring-primary/20';
              }

              return (
                <button
                  key={idx}
                  disabled={submitted}
                  onClick={() => setUserAns(cleanOpt)}
                  className={`w-full p-3.5 rounded-xl border text-left font-medium text-sm transition-all flex items-center justify-between ${optionStyle}`}
                >
                  <span>{opt}</span>
                  {submitted && isRightOpt && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />}
                  {submitted && isSelected && !isCorrect && <XCircle className="h-4 w-4 text-rose-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        )}

        {/* Feedback & Explanation */}
        {submitted && (
          <div className={`p-4 rounded-2xl border text-sm space-y-1.5 animate-in fade-in slide-in-from-bottom-2 ${
            isCorrect ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200' : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
          }`}>
            <div className="flex items-center gap-2 font-black">
              {isCorrect ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <XCircle className="h-4 w-4 text-rose-600" />}
              <span>{isCorrect ? 'Chính xác! (+10 XP)' : 'Chưa đúng!'}</span>
            </div>
            {!isCorrect && (
              <p className="text-xs font-bold text-rose-700 dark:text-rose-300">
                Đáp án đúng: <span className="font-mono underline">{currentEx.correct_answer}</span>
              </p>
            )}
            {currentEx.explanation && (
              <p className="text-xs leading-relaxed opacity-90 pt-1.5 border-t border-black/10 dark:border-white/10">
                💡 <strong>Giải thích:</strong> {currentEx.explanation}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500">
          Đúng: {score}/{currentIndex + (submitted ? 1 : 0)}
        </span>

        {!submitted ? (
          <button
            disabled={!userAns.trim()}
            onClick={handleSubmit}
            className="px-5 py-2.5 bg-primary text-white font-extrabold text-sm rounded-xl hover:opacity-90 disabled:opacity-40 transition-all shadow-sm"
          >
            Kiểm tra đáp án
          </button>
        ) : currentIndex < exercises.length - 1 ? (
          <button
            onClick={handleNext}
            className="px-5 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-extrabold text-sm rounded-xl hover:opacity-90 transition-all flex items-center gap-1.5"
          >
            Câu tiếp ➔
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-emerald-600">🎉 Đã xong lượt này!</span>
            {onClose && (
              <button
                onClick={onClose}
                className="px-3.5 py-1.5 bg-emerald-600 text-white font-extrabold text-xs rounded-xl hover:bg-emerald-700"
              >
                Đóng
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function formatSectionTitle(rawTitle: string, idx: number): string {
  if (!rawTitle) return 'Tổng quan bài học';

  let cleaned = rawTitle.trim();

  // If generic "Phần 1", "Phần 2"
  if (/^Phần\s+\d+$/i.test(cleaned)) {
    return idx === 0 ? 'Tổng quan & Mục tiêu bài học' : `Khối kiến thức ${idx + 1}`;
  }

  // Remove leading numbers like "1. " or "## 1. "
  const text = cleaned.replace(/^(?:##\s*)?(\d+[\.\)]\s*)?/, '').trim();

  // Keyword mappings to 2-4 word titles
  if (text.includes('Xương câu') || text.includes('S – V – O') || text.includes('S-V-O')) {
    return 'Cấu trúc câu S – V – O';
  }
  if (text.includes('Hòa hợp chủ ngữ') || text.includes('hòa hợp')) {
    return 'Hòa hợp Chủ ngữ – Động từ';
  }
  if (text.includes('phủ định') || text.includes('nghi vấn') || text.includes('hai đường')) {
    return 'Câu Phủ định & Nghi vấn (Be / Do / Does)';
  }
  if (text.includes('chính tả') || text.includes('đuôi -s') || text.includes('-es')) {
    return 'Quy tắc chính tả đuôi -s / -es';
  }

  // Truncate at colon ':', dash '—', or ' là '
  let shortText = text;
  if (shortText.includes(':')) {
    shortText = shortText.split(':')[0].trim();
  } else if (shortText.includes('—')) {
    shortText = shortText.split('—')[0].trim();
  } else if (shortText.includes(' là ')) {
    shortText = shortText.split(' là ')[0].trim();
  }

  if (shortText.length > 40) {
    const words = shortText.split(' ');
    shortText = words.slice(0, 6).join(' ');
  }

  return shortText || text;
}

function CollapsibleTheoryMarkdown({
  content,
  onTriggerPractice,
}: {
  content: string;
  onTriggerPractice?: (secIndex: number, secTitle: string) => void;
}) {
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({ 0: true, 1: true });

  if (!content) return null;

  const parts = content.split(/\n(?=##\s+)/g).map((part, idx) => {
    const lines = part.trim().split('\n');
    let title = `Phần ${idx + 1}`;
    let body = part.trim();
    if (lines[0].startsWith('## ')) {
      title = lines[0].replace(/^##\s+/, '').trim();
      body = lines.slice(1).join('\n').trim();
    }
    return { title, body };
  });

  if (parts.length <= 1 || content.length < 1200) {
    return (
      <div className="prose prose-slate max-w-none bg-background border rounded-3xl p-6 sm:p-8 shadow-sm">
        <LazyMarkdown components={markdownComponents}>{content}</LazyMarkdown>
        {onTriggerPractice && (
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              onClick={() => onTriggerPractice(0, 'Bài tập tổng quan')}
              className="px-4 py-2.5 bg-gradient-to-r from-primary to-indigo-600 text-white font-extrabold text-xs rounded-xl shadow-md hover:opacity-90 transition-all flex items-center gap-1.5"
            >
              <Dumbbell className="h-3.5 w-3.5" /> ⚡ Làm bài tập củng cố ngay
            </button>
          </div>
        )}
      </div>
    );
  }

  const toggleSection = (idx: number) => {
    setExpandedSections((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const expandAll = () => {
    const allState: Record<number, boolean> = {};
    parts.forEach((_, idx) => { allState[idx] = true; });
    setExpandedSections(allState);
  };

  const hasCollapsed = parts.some((_, idx) => !expandedSections[idx]);

  return (
    <div className="space-y-4">
      {parts.map((sec, idx) => {
        const isOpen = !!expandedSections[idx];
        const displayTitle = formatSectionTitle(sec.title, idx);
        return (
          <div
            key={idx}
            className={`bg-background border rounded-2xl shadow-sm overflow-hidden transition-all duration-200 ${
              isOpen ? 'border-primary/30 ring-1 ring-primary/10' : 'hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <button
              onClick={() => toggleSection(idx)}
              className="w-full flex items-center justify-between px-5 py-4 bg-slate-50/80 dark:bg-slate-900/60 hover:bg-slate-100/90 dark:hover:bg-slate-800/90 transition-colors text-left font-bold text-slate-800 dark:text-slate-200"
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <span className="shrink-0 h-7 w-7 rounded-lg bg-primary/10 text-primary text-xs font-black flex items-center justify-center border border-primary/20">
                  {idx + 1}
                </span>
                <span className="text-sm sm:text-base font-extrabold truncate">{displayTitle}</span>
              </div>
              <ChevronDown className={`shrink-0 h-5 w-5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
            </button>

            {isOpen && (
              <div className="p-6 sm:p-8 prose prose-slate max-w-none border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950">
                <LazyMarkdown components={markdownComponents}>{sec.body}</LazyMarkdown>
                {onTriggerPractice && (
                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTriggerPractice(idx, displayTitle);
                      }}
                      className="px-4 py-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-extrabold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <Dumbbell className="h-3.5 w-3.5" /> ⚡ Luyện tập củng cố: {displayTitle}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {hasCollapsed && (
        <button
          onClick={expandAll}
          className="w-full py-3 px-4 border border-dashed border-primary/40 rounded-xl text-primary font-bold text-sm bg-primary/5 hover:bg-primary/10 transition-colors flex items-center justify-center gap-2"
        >
          <ChevronDown className="h-4 w-4" /> Mở rộng toàn bộ bài học
        </button>
      )}
    </div>
  );
}


function GrammarLearnContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roadmapStepId = searchParams.get('roadmapStep');
  const roadmapTopicSlug = searchParams.get('topic');
  const forceReplay = searchParams.get('replay') === '1';
  const [userId, setUserId] = useState<string | null>(null);
  const [topics, setTopics] = useState<GrammarTopic[]>([]);
  const [lessonsByTopic, setLessonsByTopic] = useState<Record<string, GrammarLesson[]>>({});
  const [progressMap, setProgressMap] = useState<Record<string, GrammarProgress>>({});
  const [topicProgress, setTopicProgress] = useState<TopicProgressSummary[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const [activeLesson, setActiveLesson] = useState<GrammarLesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const topicRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [loadingTopic, setLoadingTopic] = useState<string | null>(null);
  const [marking, setMarking] = useState(false);
  const [annotationsCache, setAnnotationsCache] = useState<Record<string, WordAnnotation[]>>({});
  const [loadingAnnotations, setLoadingAnnotations] = useState(false);
  const annotatedLessons = useRef<Set<string>>(new Set());

  // Split View & Quiz Pop-up State
  const [splitView, setSplitView] = useState(false);
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [quizSectionIndex, setQuizSectionIndex] = useState<number | null>(null);
  const [quizSectionTitle, setQuizSectionTitle] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

        // Lấy flat progress (lesson-level)
        const gp = await fetch('/api/grammar/progress', { headers })
          .then((r) => r.json())
          .catch(() => null);
        if (gp?.success) {
          const map: Record<string, GrammarProgress> = {};
          for (const p of gp.data as GrammarProgress[]) map[p.lesson_id] = p;
          setProgressMap(map);
        }

        // Lấy topic-level summary cho sidebar
        const tp = await fetch('/api/grammar/progress?view=topics', { headers })
          .then((r) => r.json())
          .catch(() => null);
        if (tp?.success) {
          setTopicProgress(tp.data as TopicProgressSummary[]);
        }
      }
      const t = await fetch('/api/grammar/topics').then((r) => r.json()).catch(() => null);
      if (t?.success) setTopics(t.data);
      setIsLoading(false);
    };
    init();
  }, []);

  const scrollToTopic = (topicId: string) => {
    setSidebarOpen(false);
    setExpandedTopic(topicId);
    // Load lessons nếu chưa có rồi scroll
    const el = topicRefs.current[topicId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const toggleTopic = async (topicId: string) => {
    if (expandedTopic === topicId) {
      setExpandedTopic(null);
      return;
    }
    setExpandedTopic(topicId);
    if (!lessonsByTopic[topicId]) {
      setLoadingTopic(topicId);
      const res = await fetch(`/api/grammar/lessons?topicId=${topicId}`)
        .then((r) => r.json())
        .catch(() => null);
      if (res?.success) setLessonsByTopic((prev) => ({ ...prev, [topicId]: res.data }));
      setLoadingTopic(null);
    }
  };

  // Mở từ lộ trình (?topic=<slug>): expand topic + TỰ MỞ bài đầu; nếu đã học trong kho → ghi step + về journey
  const openedFromRoadmap = useRef(false);
  useEffect(() => {
    if (isLoading || !roadmapTopicSlug || topics.length === 0 || openedFromRoadmap.current) return;
    const target = topics.find((t) => t.slug === roadmapTopicSlug);
    if (!target) return;
    openedFromRoadmap.current = true;
    void (async () => {
      setExpandedTopic(target.id);
      setLoadingTopic(target.id);
      try {
        const res = await fetch(`/api/grammar/lessons?topicId=${target.id}`)
          .then((r) => r.json())
          .catch(() => null);
        const lessons = (res?.success ? res.data : []) as GrammarLesson[];
        if (lessons.length > 0) {
          setLessonsByTopic((prev) => ({ ...prev, [target.id]: lessons }));
          // Đã học HẾT bài trong topic = tick step lộ trình (trừ replay)
          const allLearned = lessons.length > 0 && lessons.every((l) => !!progressMap[l.id]);
          if (allLearned && roadmapStepId && !forceReplay) {
            const result = await completeRoadmapStep(roadmapStepId);
            if (result) {
              toast.success(`+${result.xpAwarded} XP — chủ đề này bạn đã học trong kho, sang bước kế tiếp nhé!`);
              router.push('/journey');
              return;
            }
          }
          const firstUnlearned = lessons.find((l) => !progressMap[l.id]) ?? lessons[0];
          setActiveLesson({ ...firstUnlearned, topic: target });
        }
      } finally {
        setLoadingTopic(null);
      }
      setTimeout(() => topicRefs.current[target.id]?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, roadmapTopicSlug, topics]);

  /**
   * Đánh dấu đã đọc / ôn lại bài học.
   * Sư phạm: chỉ đọc lý thuyết KHÔNG = đã thuộc.
   * - Bài mới (chưa có progress) → accuracy 0.55 ≈ Hard → FSRS lên lịch ôn lại sớm (1-2 ngày).
   * - Bài đã từng học (đang due/learned) → accuracy 0.8 ≈ Good → khoảng cách review tăng theo FSRS.
   * Để có Good/Easy thực sự, học sinh phải làm bài tập (route /api/grammar/progress nhận accuracy thật từ quiz).
   */
  const markAsLearned = async () => {
    if (!activeLesson || !userId) {
      toast.error('Bạn cần đăng nhập để lưu tiến độ.');
      return;
    }
    setMarking(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const hasPriorProgress = !!progressMap[activeLesson.id];
      const accuracy = hasPriorProgress ? 0.8 : 0.55;
      const res = await fetch('/api/grammar/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ lessonId: activeLesson.id, accuracy }),
      });
      const data = await res.json();
      if (data.success) {
        const row = data.data as GrammarProgress;
        const nextMap = { ...progressMap, [activeLesson.id]: row };
        setProgressMap(nextMap);
        bumpTopicProgress(activeLesson, row);
        // Server đã credit step grammar → lộ trình (kể cả học ngoài journey)
        const credited = typeof data.roadmapCredited === 'number' ? data.roadmapCredited : 0;
        const topicId = activeLesson.topic_id || activeLesson.topic?.id;
        const siblingLessons = topicId ? (lessonsByTopic[topicId] ?? [activeLesson]) : [activeLesson];
        const topicAllLearned =
          siblingLessons.length > 0 && siblingLessons.every((l) => !!nextMap[l.id]);

        if (roadmapStepId && topicAllLearned) {
          // Đủ hết bài trong topic → complete + XP; credit server là backup
          const result = await completeRoadmapStep(roadmapStepId);
          if (result) {
            toast.success(`+${result.xpAwarded} XP · đã ghi chặng lộ trình.`);
            router.push('/journey');
          } else if (credited > 0) {
            toast.success('Đã đồng bộ tiến độ vào lộ trình.');
            router.push('/journey');
          } else {
            toast.error(getLastRoadmapStepError() || 'Chưa ghi được chặng lộ trình — thử lại từ Lộ trình.');
          }
        } else if (credited > 0) {
          toast.success(
            hasPriorProgress
              ? `Đã ôn lại! Lộ trình đã tick ${credited} bước ngữ pháp liên quan.`
              : `Đã học xong chủ đề! Lộ trình đã tick ${credited} bước ngữ pháp liên quan.`,
          );
          if (roadmapStepId) router.push('/journey');
        } else if (roadmapStepId && !topicAllLearned) {
          const left = siblingLessons.filter((l) => !nextMap[l.id]).length;
          toast.success(
            hasPriorProgress
              ? 'Đã ôn lại bài này.'
              : `Đã ghi nhận bài này. Còn ${left} bài trong chủ đề — học hết để hoàn thành chặng lộ trình.`,
          );
        } else {
          toast.success(
            hasPriorProgress
              ? 'Đã ôn lại bài học! Lịch ôn tiếp theo đã cập nhật.'
              : 'Đã ghi nhận bạn đọc xong. Hãy làm bài tập để củng cố!',
          );
        }
      } else {
        toast.error('Lỗi: ' + (data.error || 'không rõ'));
      }
    } finally {
      setMarking(false);
    }
  };

  useEffect(() => {
    if (!activeLesson?.examples?.length) return;
    if (annotatedLessons.current.has(activeLesson.id)) return;
    annotatedLessons.current.add(activeLesson.id);

    const topic = activeLesson.topic?.title;

    // Nạp annotations đã cache từ DB vào local cache ngay lập tức
    const cachedEntries: Record<string, WordAnnotation[]> = {};
    for (const ex of activeLesson.examples) {
      if (ex.en && ex.annotations?.length) {
        cachedEntries[ex.en] = ex.annotations;
      }
    }
    if (Object.keys(cachedEntries).length > 0) {
      setAnnotationsCache((prev) => ({ ...prev, ...cachedEntries }));
    }

    // Chỉ gọi Gemini cho các example chưa có annotations
    const uncachedExamples = activeLesson.examples.filter(
      (ex) => ex.en && !ex.annotations?.length
    );
    if (uncachedExamples.length === 0) return;

    setLoadingAnnotations(true);

    // Route annotate yêu cầu JWT → lấy session trước khi gọi batch
    supabase.auth.getSession().then(({ data: { session } }) =>
      Promise.allSettled(
        uncachedExamples.map((ex) =>
          fetch('/api/grammar/annotate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session?.access_token ?? ''}`,
            },
            body: JSON.stringify({ sentence: ex.en, topic }),
          })
            .then((r) => r.json())
            .then((res) => (res?.success ? { key: ex.en, data: res.data as WordAnnotation[] } : null))
            .catch(() => null)
        )
      )
    ).then((results) => {
      const newEntries: Record<string, WordAnnotation[]> = {};
      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          newEntries[result.value.key] = result.value.data;
        }
      });

      if (Object.keys(newEntries).length > 0) {
        setAnnotationsCache((prev) => ({ ...prev, ...newEntries }));

        // Merge annotations mới vào examples rồi persist lên DB (fire-and-forget)
        const updatedExamples = activeLesson.examples.map((ex) =>
          newEntries[ex.en] ? { ...ex, annotations: newEntries[ex.en] } : ex
        );
        setActiveLesson((prev) => prev ? { ...prev, examples: updatedExamples } : prev);

        void supabase.auth.getSession().then(({ data: { session } }) =>
          fetch('/api/grammar/lessons', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token ?? ''}` },
            body: JSON.stringify({ lessonId: activeLesson.id, examples: updatedExamples }),
          })
        ).catch(() => {
          console.warn('[Grammar] Failed to persist annotations to DB');
        });
      }

      setLoadingAnnotations(false);
    });
  }, [activeLesson?.id]);

  /** new = chưa học; learned = đã học (kể cả đang due); due = đã học + tới lịch ôn. */
  const lessonStatus = (lessonId: string): 'new' | 'learned' | 'due' => {
    const p = progressMap[lessonId];
    if (!p) return 'new';
    return new Date(p.next_review_date).getTime() <= Date.now() ? 'due' : 'learned';
  };

  /** Topic hoàn thành = đã học hết bài (không bắt mastery ≥ 80). */
  const topicDonePct = (tp: TopicProgressSummary | undefined): number => {
    if (!tp || tp.totalLessons <= 0) return 0;
    const learned = typeof tp.learnedLessons === 'number' ? tp.learnedLessons : tp.masteredLessons;
    return Math.round((learned / tp.totalLessons) * 100);
  };

  /** Cập nhật summary topic sau khi ghi progress 1 lesson (tránh phải reload). */
  const bumpTopicProgress = (lesson: GrammarLesson, row: GrammarProgress) => {
    const topicId = lesson.topic_id || lesson.topic?.id;
    if (!topicId) return;
    setTopicProgress((prev) => {
      const existing = prev.find((t) => t.topicId === topicId);
      const hadProgress = !!progressMap[lesson.id];
      const wasMastered = (() => {
        const old = progressMap[lesson.id];
        return !!old && (old.state === 'mastered' || (old.mastery_score ?? 0) >= 80);
      })();
      const nowMastered = row.state === 'mastered' || (row.mastery_score ?? 0) >= 80;
      if (!existing) {
        // Chưa có summary (edge) — để fetch lần sau; không bịa totalLessons
        return prev;
      }
      return prev.map((t) => {
        if (t.topicId !== topicId) return t;
        const learnedLessons = hadProgress
          ? (typeof t.learnedLessons === 'number' ? t.learnedLessons : t.masteredLessons)
          : (typeof t.learnedLessons === 'number' ? t.learnedLessons : t.masteredLessons) + 1;
        let masteredLessons = t.masteredLessons;
        if (!wasMastered && nowMastered) masteredLessons += 1;
        if (wasMastered && !nowMastered) masteredLessons = Math.max(0, masteredLessons - 1);
        return { ...t, learnedLessons, masteredLessons };
      });
    });
  };

  if (isLoading) {
    return (
      <main className="min-h-dvh flex items-center justify-center bg-muted/40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </main>
    );
  }

  if (activeLesson) {
    const status = lessonStatus(activeLesson.id);

    const getExercisesForSection = (secIdx: number, secTitle?: string) => {
      if (!activeLesson?.exercises?.length) return [];
      const exercises = activeLesson.exercises;
      const titleLower = (secTitle || '').toLowerCase();

      // Rule 1: "Chính tả", "đuôi -s", "-es"
      if (titleLower.includes('chính tả') || titleLower.includes('đuôi -s') || titleLower.includes('-es') || titleLower.includes('ngôi 3') || titleLower.includes('ngôi thứ ba')) {
        const matched = exercises.filter((ex: any) => {
          const text = ((ex.question || '') + ' ' + (ex.explanation || '')).toLowerCase();
          return text.includes('đuôi -s') || text.includes('-es') || text.includes('y thành') || text.includes('ngôi ba số ít') || text.includes('ngôi thứ ba') || text.includes('chính tả') || text.includes('chữ cái cuối') || text.includes('r01b');
        });
        if (matched.length > 0) return matched;
      }

      // Rule 2: "Phủ định", "nghi vấn", "do/does", "be và", "trợ động từ"
      if (titleLower.includes('phủ định') || titleLower.includes('nghi vấn') || titleLower.includes('be và') || titleLower.includes('do/does') || titleLower.includes('đường')) {
        const matched = exercises.filter((ex: any) => {
          const text = ((ex.question || '') + ' ' + (ex.explanation || '')).toLowerCase();
          return text.includes("don't") || text.includes("doesn't") || text.includes("do/does") || text.includes("mượn") || text.includes("phủ định") || text.includes("nghi vấn") || text.includes("trợ động từ") || text.includes("đảo be");
        });
        if (matched.length > 0) return matched;
      }

      // Rule 3: "Công thức", "Hòa hợp", "chủ ngữ", "số ít", "số nhiều"
      if (titleLower.includes('công thức') || titleLower.includes('hòa hợp') || titleLower.includes('chủ ngữ') || titleLower.includes('số ít') || titleLower.includes('số nhiều')) {
        const matched = exercises.filter((ex: any) => {
          const text = ((ex.question || '') + ' ' + (ex.explanation || '')).toLowerCase();
          return text.includes('hòa hợp') || text.includes('số ít') || text.includes('số nhiều') || text.includes('chủ ngữ') || text.includes('nối bằng and') || text.includes('danh từ');
        });
        if (matched.length > 0) return matched;
      }

      // Rule 4: "Định nghĩa", "xương câu", "tổng quan", "cấu trúc câu"
      if (titleLower.includes('định nghĩa') || titleLower.includes('xương câu') || titleLower.includes('tổng quan') || titleLower.includes('cấu trúc')) {
        const matched = exercises.filter((ex: any) => {
          const text = ((ex.question || '') + ' ' + (ex.explanation || '')).toLowerCase();
          return text.includes('động từ') || text.includes('s - v - o') || text.includes('chủ ngữ') || text.includes('be');
        });
        if (matched.length > 0) return matched;
      }

      // Fallback: chunk slicing by section index
      const chunkSize = Math.max(3, Math.floor(exercises.length / 5));
      const start = secIdx * chunkSize;
      const sliced = exercises.slice(start, start + chunkSize);
      return sliced.length > 0 ? sliced : exercises.slice(0, 5);
    };

    const currentQuizExercises = quizSectionIndex !== null
      ? getExercisesForSection(quizSectionIndex, quizSectionTitle || undefined)
      : (activeLesson?.exercises || []);

    const triggerSectionPractice = (secIdx: number, secTitle: string) => {
      setQuizSectionIndex(secIdx);
      setQuizSectionTitle(secTitle);
      setQuizModalOpen(true);
    };

    return (
      <main className="min-h-dvh bg-muted/40 font-sans">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b h-14 flex items-center justify-between px-4 sm:px-6">
          <button
            onClick={() => setActiveLesson(null)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-semibold"
          >
            <ChevronLeft className="h-4 w-4" /> Lộ trình
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSplitView((v) => !v)}
              className={`hidden lg:flex items-center gap-1.5 text-xs font-extrabold px-3.5 py-1.5 rounded-full border transition-all ${
                splitView
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title="Bật/Tắt chế độ Vừa đọc Lý thuyết vừa Làm bài tập song song"
            >
              <Split className="h-3.5 w-3.5" />
              <span>{splitView ? 'Màn hình Đọc' : '🖥️ Vừa đọc vừa làm (Split View)'}</span>
            </button>

            <button
              onClick={() => {
                setQuizSectionIndex(null);
                setQuizModalOpen(true);
              }}
              className="flex items-center gap-1.5 text-xs font-extrabold px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm hover:opacity-95 transition-all"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>⚡ Làm bài tập ngay</span>
            </button>
          </div>
        </header>

        <div className={splitView ? 'max-w-7xl mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start' : ''}>
          <article className={splitView ? 'space-y-6' : 'max-w-3xl mx-auto p-4 sm:p-8 space-y-6'}>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
              <span>{activeLesson.topic?.title_vi || activeLesson.topic?.title || 'Ngữ Pháp THPT QG'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">{activeLesson.title}</h1>

            {activeLesson.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={resolveImageSrc(activeLesson.image_url)}
                referrerPolicy="no-referrer"
                alt={activeLesson.title}
                loading="lazy"
                decoding="async"
                className="w-full max-h-64 object-cover rounded-2xl border"
              />
            )}

            {activeLesson.sections ? (
              <GoldenLesson sections={activeLesson.sections} exercises={activeLesson.exercises} />
            ) : (
              <CollapsibleTheoryMarkdown
                content={
                  ensureMarkdownTableFormat(
                    activeLesson.source === 'ai-golden' || activeLesson.source === '25-chuyen-de-v2'
                      ? (activeLesson.theory_vi || activeLesson.theory || '*Chưa có nội dung lý thuyết.*')
                      : formatOcrTheory(activeLesson.theory_vi || activeLesson.theory || '*Chưa có nội dung lý thuyết.*')
                  )
                }
                onTriggerPractice={triggerSectionPractice}
              />
            )}

            {/* Action Bar */}
            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setQuizSectionIndex(null);
                    setQuizModalOpen(true);
                  }}
                  className="flex-1 bg-gradient-to-r from-primary to-indigo-600 text-white font-extrabold py-3.5 px-6 rounded-2xl hover:opacity-95 shadow-md shadow-primary/20 transition-all flex items-center justify-center gap-2 text-base"
                >
                  <Dumbbell className="h-5 w-5" /> Bắt đầu làm bài tập Pop-up ngay
                </button>
                <button
                  onClick={markAsLearned}
                  disabled={marking}
                  className="border-2 border-slate-200 dark:border-slate-700 font-bold py-3.5 px-6 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 text-slate-700 dark:text-slate-200 disabled:opacity-50"
                >
                  {marking ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                  {status === 'new' ? 'Đã đọc xong' : 'Ôn lại xong'}
                </button>
              </div>
            </div>
          </article>

          {/* Split Screen Panel on Desktop */}
          {splitView && (
            <div className="sticky top-20 hidden lg:block h-[calc(100vh-6rem)]">
              <InlineLessonQuizPanel
                exercises={activeLesson.exercises || []}
                isSplitView={true}
              />
            </div>
          )}
        </div>

        {/* Pop-up Quiz Modal */}
        {quizModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-xl max-h-[90vh] h-[650px] animate-in zoom-in-95 duration-200">
              <InlineLessonQuizPanel
                exercises={currentQuizExercises}
                panelTitle={quizSectionTitle ? `Luyện tập: ${quizSectionTitle.split('.')[1] || quizSectionTitle}` : 'Luyện Tập Bài Học'}
                onClose={() => setQuizModalOpen(false)}
              />
            </div>
          </div>
        )}
      </main>
    );
  }

  // ─── Topics roadmap view ───
  const now = Date.now();
  const progressByTopic: Record<string, TopicProgressSummary> = Object.fromEntries(
    topicProgress.map((tp) => [tp.topicId, tp]),
  );

  /** Sidebar: list topics — % theo bài đã học (không bắt mastery ≥ 80) */
  const ProgressSidebar = () => (
    <nav className="space-y-1.5">
      {topicProgress.length === 0 && (
        <p className="text-xs text-muted-foreground px-1">Chưa có dữ liệu tiến độ.</p>
      )}
      {topicProgress.map((tp) => {
        const pct = topicDonePct(tp);
        const learned = typeof tp.learnedLessons === 'number' ? tp.learnedLessons : tp.masteredLessons;
        const isDue = tp.nextDueDate !== null && new Date(tp.nextDueDate).getTime() <= now;
        const barColor =
          pct === 100 ? 'bg-emerald-500' :
          pct > 50    ? 'bg-blue-500' :
          pct > 0     ? 'bg-amber-400' :
                        'bg-slate-200';
        return (
          <button
            key={tp.topicId}
            onClick={() => scrollToTopic(tp.topicId)}
            className="w-full text-left rounded-xl px-3 py-2.5 hover:bg-muted/60 transition-colors group"
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs font-semibold text-slate-700 leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                {tp.titleVi || tp.title}
              </span>
              {isDue && (
                <span className="shrink-0 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-1.5 py-0.5">
                  Due
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${barColor}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="shrink-0 text-[10px] text-muted-foreground tabular-nums">
                {learned}/{tp.totalLessons}
              </span>
            </div>
          </button>
        );
      })}
    </nav>
  );

  return (
    <main className="min-h-dvh bg-muted/40 font-sans">
      <header className="sticky top-header-safe z-30 flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur sm:px-6">
        <Link
          href="/student"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> Dashboard
        </Link>
        <h1 className="flex items-center gap-2 font-bold text-primary text-base">
          <GraduationCap className="h-5 w-5" /> Bài giảng Ngữ pháp
        </h1>
        <div className="flex items-center gap-2">
          {/* Quick link: ôn câu sai */}
          <Link
            href="/grammar?review=1"
            className="hidden sm:flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-full px-3 py-1.5 transition-colors"
            title="Ôn các câu bạn từng làm sai trong 14 ngày qua"
          >
            <History className="h-3.5 w-3.5" /> Ôn câu sai
          </Link>
          {/* Mobile: nút mở sidebar */}
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="md:hidden flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Tiến độ chủ đề"
          >
            Tiến độ {sidebarOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </header>

      <div className="flex gap-6 max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* ─── Desktop Sidebar ─── */}
        <aside className="hidden md:block w-60 shrink-0">
          <div className="sticky top-20 bg-background border rounded-2xl shadow-sm p-4">
            <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">
              Tiến độ chủ đề
            </h2>
            <ProgressSidebar />
          </div>
        </aside>

        {/* ─── Main content ─── */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Mobile collapsible sidebar */}
          {sidebarOpen && (
            <div className="md:hidden bg-background border rounded-2xl shadow-sm p-4">
              <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">
                Tiến độ chủ đề
              </h2>
              <ProgressSidebar />
            </div>
          )}

          {topics.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="font-semibold">Chưa có bài giảng ngữ pháp.</p>
            </div>
          )}

          {STAGES.map((stg) => {
            const stgTopics = topics.filter((t) => {
              const parsed = parseTopicTitle(t.title_vi || t.title);
              return parsed.buoiNum >= stg.range[0] && parsed.buoiNum <= stg.range[1];
            });
            if (stgTopics.length === 0) return null;
            // Tổng tiến độ của chặng
            const stgProg = stgTopics.reduce(
              (acc, t) => {
                const tp = progressByTopic[t.id];
                if (tp) {
                  const learned = typeof tp.learnedLessons === 'number' ? tp.learnedLessons : tp.masteredLessons;
                  acc.done += learned;
                  acc.total += tp.totalLessons;
                }
                return acc;
              },
              { done: 0, total: 0 },
            );
            return (
              <section key={stg.id} className="space-y-3 pt-3 first:pt-0">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2.5">
                    <span className={`h-10 w-10 rounded-2xl bg-gradient-to-br ${stg.grad} text-white flex items-center justify-center text-lg shadow-md shadow-slate-200/50 dark:shadow-none`}>
                      {stg.icon}
                    </span>
                    <div>
                      <h2 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm sm:text-base leading-tight">{stg.name}</h2>
                      <p className="text-[11px] text-muted-foreground font-medium tracking-wide">
                        {stg.sub} · {stgTopics.length} chủ đề
                      </p>
                    </div>
                  </div>
                  {userId && stgProg.total > 0 && (
                    <span className="text-xs font-bold text-slate-500 tabular-nums bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200/60 dark:border-slate-700">
                      {stgProg.done}/{stgProg.total} bài
                    </span>
                  )}
                </div>

                {stgTopics.map((topic) => {
                  const lessons = lessonsByTopic[topic.id] || [];
                  const isOpen = expandedTopic === topic.id;
                  const tp = progressByTopic[topic.id];
                  const pct = topicDonePct(tp);
                  const learnedCount = tp
                    ? (typeof tp.learnedLessons === 'number' ? tp.learnedLessons : tp.masteredLessons)
                    : 0;
                  const isDue = tp?.nextDueDate != null && new Date(tp.nextDueDate).getTime() <= now;
                  const parsed = parseTopicTitle(topic.title_vi || topic.title);

                  return (
                    <div
                      key={topic.id}
                      ref={(el) => { topicRefs.current[topic.id] = el; }}
                      className={`bg-background border rounded-2xl shadow-sm overflow-hidden transition-all duration-200 ${
                        isOpen ? 'ring-2 ring-primary/20 border-primary/40 shadow-md' : 'hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <button
                        onClick={() => toggleTopic(topic.id)}
                        className="w-full flex items-center gap-3.5 px-4 sm:px-5 py-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors text-left"
                      >
                        <span className={`shrink-0 px-2.5 py-1 rounded-xl font-mono text-[11px] font-black border transition-all ${stg.badgeStyle}`}>
                          {parsed.badge}
                        </span>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base leading-snug line-clamp-1">
                              {parsed.displayTitle}
                            </span>
                            {isDue && (
                              <span className="shrink-0 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 animate-pulse">
                                Cần ôn
                              </span>
                            )}
                            {pct === 100 && (
                              <span className="shrink-0 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" /> Hoàn thành
                              </span>
                            )}
                          </div>

                          {userId && tp && tp.totalLessons > 0 && (
                            <div className="flex items-center gap-2.5 mt-2">
                              <div className="flex-1 max-w-[200px] h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-primary'}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-muted-foreground font-semibold tabular-nums">
                                {learnedCount}/{tp.totalLessons} bài
                              </span>
                            </div>
                          )}
                        </div>

                        <ChevronDown
                          className={`shrink-0 h-5 w-5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : ''}`}
                        />
                      </button>


                      {isOpen && (
                        <div className="border-t divide-y">
                          {loadingTopic === topic.id && (
                            <div className="px-5 py-4 flex items-center gap-2 text-sm text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin" /> Đang tải...
                            </div>
                          )}
                          {loadingTopic !== topic.id && lessons.length === 0 && (
                            <div className="px-5 py-4 text-sm text-muted-foreground">Chưa có bài học.</div>
                          )}
                          {lessons.map((lesson, idx) => {
                            const status = lessonStatus(lesson.id);
                            const done = status === 'learned' || status === 'due';
                            return (
                              <button
                                key={lesson.id}
                                onClick={() => setActiveLesson({ ...lesson, topic })}
                                className="w-full flex items-center gap-3 px-4 sm:px-5 py-3 hover:bg-primary/5 transition-colors text-left"
                              >
                                <span
                                  className={`shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${
                                    status === 'learned'
                                      ? 'bg-emerald-500 border-emerald-500 text-white'
                                      : status === 'due'
                                        ? 'bg-amber-500 border-amber-500 text-white'
                                        : 'bg-background border-slate-200 text-slate-500'
                                  }`}
                                >
                                  {done ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                                </span>
                                <span className="flex-1 min-w-0 text-sm font-medium text-slate-700 truncate">{lesson.title}</span>
                                {status === 'due' && (
                                  <span className="shrink-0 text-xs text-amber-600 font-bold flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" /> Cần ôn
                                  </span>
                                )}
                                {status === 'new' && (
                                  <span className="shrink-0 text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Mới</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}

export default function GrammarLearnPage() {
  return (
    <StudentShell title="Grammar" contentClassName="p-0">
      <Suspense fallback={
        <div className="min-h-[calc(100dvh-var(--header-h)-var(--safe-top))] flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-400" />
        </div>
      }>
        <GrammarLearnContent />
      </Suspense>
    </StudentShell>
  );
}
