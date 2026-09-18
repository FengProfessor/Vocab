'use client';

import { useState, useEffect, useRef, Suspense, type ComponentProps } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { completeRoadmapStep, getLastRoadmapStepError } from '@/lib/roadmap-client';
import Link from 'next/link';
import { StudentShell } from '@/components/student/StudentShell';
import { LazyMarkdown, ensureMarkdownTableFormat } from '@/components/perf/LazyMarkdown';
import { supabase } from '@/lib/supabase';
import type { GrammarTopic, GrammarLesson, GrammarProgress, GrammarExerciseItem } from '@/lib/supabase';
import GrammarHighlight, { type WordAnnotation } from '@/components/grammar/GrammarHighlight';
import TenseTimeline from '@/components/grammar/TenseTimeline';
import GoldenLesson from '@/components/grammar/GoldenLesson';
import { GrammarFormula } from '@/components/grammar/GrammarFormula';
import SvoSentenceDiagram from '@/components/grammar/SvoSentenceDiagram';
import GrammarVideoPlayer from '@/components/grammar/GrammarVideoPlayer';
import GrammarCheatSheet from '@/components/grammar/GrammarCheatSheet';
import GrammarVisualConcept from '@/components/grammar/GrammarVisualConcept';
import {
  isGrammarAnswerCorrect,
  isOptionMatchingCorrect,
  cleanGrammarAnswer,
} from '@/lib/grammar-exercises';
import {
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Loader2, GraduationCap, CheckCircle2, XCircle, Clock, Dumbbell, BookOpen, Volume2, History, FileDown, Split, Table, PlayCircle, Eye, EyeOff, Monitor, List, Layers, Maximize2, AlertTriangle, FileText, Check, X, Scale, ArrowLeftRight, HelpCircle, Info, Target,
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

function cleanExamTerminology(text: string): string {
  if (!text) return '';
  return text
    .replace(/(?:trong\s+)?(?:kỳ\s+)?(?:thi|đề thi)\s*THPT(?:\s*QG|\s*Quốc Gia)?/gi, '')
    .replace(/THPT(?:\s*QG|\s*Quốc Gia)?/gi, '')
    .replace(/(?:bẫy\s+)?phân hóa\s+điểm\s+9\+/gi, 'trường hợp đặc biệt nâng cao')
    .replace(/vùng\s+điểm\s+8\+/gi, 'nâng cao')
    .replace(/chinh phục\s+9\+/gi, 'làm chủ toàn diện')
    .replace(/phòng thi/gi, 'giao tiếp & thực tế')
    .replace(/chuẩn\s+đề thi/gi, 'chuẩn ngữ pháp')
    .replace(/câu\s+đề thi/gi, 'câu ví dụ')
    .replace(/đề thi/gi, 'bài tập')
    .replace(/bẫy đề/gi, 'lưu ý')
    .replace(/đại bẫy/gi, 'lưu ý quan trọng')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** 5 Chặng Lộ Trình Ngữ Pháp Toàn Diện */
const STAGES = [
  {
    id: 1,
    name: 'CHẶNG 1: Thì & Nền Tảng Chia Động Từ',
    sub: 'Buổi 01 – 07 • Nền tảng A0–A1',
    badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    range: [1, 7],
  },
  {
    id: 2,
    name: 'CHẶNG 2: Cấu Trúc Biến Đổi & Viết Lại Câu',
    sub: 'Buổi 08 – 12 • Cứng cáp A2',
    badgeStyle: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
    range: [8, 12],
  },
  {
    id: 3,
    name: 'CHẶNG 3: Mệnh Đề & Từ Nối Mức Độ Khá',
    sub: 'Buổi 13 – 16 • Thông thạo A2+',
    badgeStyle: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
    range: [13, 16],
  },
  {
    id: 4,
    name: 'CHẶNG 4: Ngữ Pháp Nâng Cao & Cấu Trúc Chuyên Sâu',
    sub: 'Buổi 17 – 21 • Chuyên sâu B1+',
    badgeStyle: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    range: [17, 21],
  },
  {
    id: 5,
    name: 'CHẶNG 5: Tổng Ôn Toàn Diện & Luyện Phản Xạ Ứng Dụng',
    sub: 'Buổi 22 – 25 • Làm chủ toàn diện',
    badgeStyle: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
    range: [22, 25],
  },
] as const;

function parseTopicTitle(raw: string): { badge: string; displayTitle: string; buoiNum: number } {
  if (!raw) return { badge: 'NGỮ PHÁP', displayTitle: '', buoiNum: 1 };
  const match = raw.match(/^Buổi\s+(\d+)\s*[:\-\u2013\u2014]\s*(.+)$/i);
  if (match) {
    const num = parseInt(match[1], 10);
    return {
      badge: `BUỔI ${String(num).padStart(2, '0')}`,
      displayTitle: cleanExamTerminology(match[2].trim()),
      buoiNum: num,
    };
  }
  return { badge: 'CHUYÊN ĐỀ', displayTitle: cleanExamTerminology(raw.trim()), buoiNum: 1 };
}


/** Đọc câu tiếng Anh — voice EN tường minh (tránh giọng Việt). */
function speakEnglish(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    toast.error('Trình duyệt không hỗ trợ đọc giọng nói.');
    return;
  }
  speak(text, 0.9);
}


function formatOcrTheory(text: string): string {
  if (!text) return '';

  const cleanText = ensureMarkdownTableFormat(text);

  // Nếu text đã có định dạng Markdown chuẩn (bảng, tiêu đề, codeblock), trả về trực tiếp không phá vỡ dòng
  if (cleanText.includes('| --- |') || cleanText.includes('|---|') || cleanText.includes('| ---') || cleanText.includes('```formula') || cleanText.includes('## ')) {
    return cleanText;
  }

  // 1. Chuẩn hóa xuống dòng
  const normalized = cleanText.replace(/\r\n/g, '\n');

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

function hasVietnameseDiacritics(s: string): boolean {
  return /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(s);
}

const markdownComponents = {
  h2: ({ node: _node, ...props }: ComponentProps<'h2'> & { node?: unknown }) => (
    <h2 className="text-xl font-bold text-foreground border-b border-border pb-2.5 mb-4 mt-6 flex items-center gap-2 tracking-tight" {...props} />
  ),
  h3: ({ node: _node, ...props }: ComponentProps<'h3'> & { node?: unknown }) => (
    <h3 className="text-lg font-semibold text-foreground mb-3 mt-4 tracking-tight" {...props} />
  ),
  p: ({ node: _node, children, ...props }: ComponentProps<'p'> & { node?: unknown }) => {
    const rawText = Array.isArray(children)
      ? children.map(c => typeof c === 'string' ? c : (c?.props?.children || '')).join(' ')
      : String(children || '');
    const enMatch = rawText.match(/[A-Z][a-zA-Z\s,'’\-]{5,}[.?!]?/);
    const englishSnippet = enMatch && !hasVietnameseDiacritics(enMatch[0]) ? enMatch[0].trim() : '';

    return (
      <p className="my-3 leading-relaxed text-slate-700 dark:text-slate-300 group/p" {...props}>
        <span>{children}</span>
        {englishSnippet && englishSnippet.length > 5 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              speakEnglish(englishSnippet);
            }}
            className="inline-flex items-center ml-2 p-1 text-muted-foreground hover:text-primary transition-colors align-middle rounded-lg hover:bg-muted opacity-60 group-hover/p:opacity-100"
            title="Nghe phát âm tiếng Anh"
          >
            <Volume2 className="h-3.5 w-3.5" />
          </button>
        )}
      </p>
    );
  },
  blockquote: ({ node: _node, children, ...props }: ComponentProps<'blockquote'> & { node?: unknown }) => {
    const text = String(children);
    const isTrap = text.includes('⚠') || text.includes('Bẫy') || text.includes('Lưu ý');
    const isCore = text.includes('💡') || text.includes('cốt lõi');
    
    let borderStyle = 'border-amber-500/50 bg-amber-500/[0.04] text-foreground';
    if (isTrap) {
      borderStyle = 'border-rose-500/50 bg-rose-500/[0.04] text-foreground';
    } else if (isCore) {
      borderStyle = 'border-primary/50 bg-primary/[0.04] text-foreground';
    }

    return (
      <blockquote className={`my-4 p-3.5 sm:p-4 border-l-2 text-sm leading-relaxed ${borderStyle}`} {...props}>
        {children}
      </blockquote>
    );
  },
  table: ({ node: _node, ...props }: ComponentProps<'table'> & { node?: unknown }) => (
    <div className="overflow-x-auto my-6 -mx-4 sm:mx-0 px-4 sm:px-0">
      <table className="w-full text-left text-sm border-collapse border-b border-border/60" {...props} />
    </div>
  ),
  thead: ({ node: _node, ...props }: ComponentProps<'thead'> & { node?: unknown }) => (
    <thead className="border-b border-border/60 text-xs uppercase tracking-wider text-muted-foreground font-semibold" {...props} />
  ),
  th: ({ node: _node, ...props }: ComponentProps<'th'> & { node?: unknown }) => (
    <th className="py-3 px-3.5 font-semibold text-foreground text-xs" {...props} />
  ),
  td: ({ node: _node, ...props }: ComponentProps<'td'> & { node?: unknown }) => (
    <td className="py-3 px-3.5 border-t border-border/30 text-sm text-foreground/90 font-normal" {...props} />
  ),
  tr: ({ node: _node, ...props }: ComponentProps<'tr'> & { node?: unknown }) => (
    <tr className="hover:bg-muted/30 transition-colors" {...props} />
  ),
  ul: ({ node: _node, ...props }: ComponentProps<'ul'> & { node?: unknown }) => <ul className="my-4 space-y-2 list-disc list-inside text-slate-700 dark:text-slate-300" {...props} />,
  ol: ({ node: _node, ...props }: ComponentProps<'ol'> & { node?: unknown }) => <ol className="my-4 space-y-2 list-decimal list-inside text-slate-700 dark:text-slate-300" {...props} />,
  li: ({ node: _node, children, ...props }: ComponentProps<'li'> & { node?: unknown }) => {
    const rawText = Array.isArray(children)
      ? children.map(c => typeof c === 'string' ? c : (c?.props?.children || '')).join(' ')
      : String(children || '');
    const isGood = rawText.includes('✅') || rawText.includes('ĐÚNG');
    const isBad = rawText.includes('❌') || rawText.includes('SAI');
    
    // Check if line contains an English sentence (Latin words)
    const enMatch = rawText.match(/[A-Z][a-zA-Z\s,'’\-]{4,}[.?!]?/);
    const englishSnippet = enMatch ? enMatch[0].replace(/[✅❌]/g, '').trim() : '';

    return (
      <li className={`leading-relaxed font-normal marker:text-primary marker:font-semibold group/li my-1.5 ${
        isGood ? 'text-emerald-800 dark:text-emerald-300 font-medium' : isBad ? 'text-rose-800 dark:text-rose-300 font-medium' : ''
      }`} {...props}>
        <span>{children}</span>
        {englishSnippet && englishSnippet.length > 5 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              speakEnglish(englishSnippet);
            }}
            className="inline-flex items-center ml-2 p-1 text-muted-foreground hover:text-primary transition-colors align-middle rounded-lg hover:bg-muted opacity-60 group-hover/li:opacity-100"
            title="Nghe phát âm tiếng Anh"
          >
            <Volume2 className="h-3.5 w-3.5" />
          </button>
        )}
      </li>
    );
  },
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
          <code className="px-2 py-0.5 rounded-md bg-muted/60 text-foreground font-mono font-medium text-xs inline-block mx-1" {...props}>
            {codeText}
          </code>
        );
      }
      return (
        <code className="px-1.5 py-0.5 rounded bg-muted/50 text-foreground font-mono text-xs mx-0.5 font-medium" {...props}>
          {codeText}
        </code>
      );
    }
    return (
      <pre className="p-4 rounded-xl bg-muted/40 text-foreground font-mono text-xs overflow-x-auto my-4">
        <code {...props}>{codeText}</code>
      </pre>
    );
  }
};

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
        <h4 className="text-base font-semibold text-foreground leading-snug">
          {question}
        </h4>
        <input
          type="text"
          disabled={submitted}
          value={userAns}
          onChange={(e) => onChangeAns(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !submitted) onEnterSubmit(); }}
          placeholder="Nhập câu trả lời..."
          className="w-full px-2 py-2 border-b-2 border-primary/40 focus:border-primary bg-transparent text-sm font-medium focus:outline-none text-foreground"
        />
      </div>
    );
  }

  let gapCounter = 0;

  return (
    <div className="text-base sm:text-lg font-semibold text-foreground leading-relaxed">
      {parts.map((part, i) => {
        if (/^_{2,}$|^\[\[.*?\]\]$/.test(part)) {
          const currentGapIdx = gapCounter++;
          const val = gaps[currentGapIdx] || '';

          let inputStyle = 'border-primary/40 focus:border-primary text-foreground';
          if (submitted) {
            inputStyle = isCorrect
              ? 'border-emerald-500 text-emerald-700 dark:text-emerald-300 bg-emerald-500/[0.05]'
              : 'border-rose-500 text-rose-700 dark:text-rose-300 bg-rose-500/[0.05]';
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
              className={`mx-1 px-1 py-0.5 border-b-2 bg-transparent text-center min-w-[80px] max-w-[140px] focus:outline-none font-semibold text-sm transition-all ${inputStyle}`}
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
        <h4 className="text-base font-semibold text-foreground leading-snug">
          {question}
        </h4>
        <input
          type="text"
          disabled={submitted}
          value={userAns}
          onChange={(e) => onChangeAns(e.target.value)}
          placeholder="Nhập lỗi sai và từ sửa..."
          className="w-full px-2 py-2 border-b-2 border-primary/40 focus:border-primary bg-transparent text-sm font-medium focus:outline-none text-foreground"
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-base sm:text-lg font-semibold text-foreground leading-relaxed">
        {parts.map((part, i) => {
          if (/^\[\[.*?\]\]$/.test(part)) {
            const rawWord = part.replace(/^\[\[|\]\]$/g, '').trim();
            const isSelected = cleanGrammarAnswer(userAns) === cleanGrammarAnswer(rawWord) || userAns.includes(rawWord);

            let btnStyle = 'bg-muted/40 hover:bg-muted text-foreground';
            if (submitted) {
              const isTargetError = cleanGrammarAnswer(correctAnswer).includes(cleanGrammarAnswer(rawWord)) || cleanGrammarAnswer(rawWord).includes(cleanGrammarAnswer(correctAnswer.split(' ')[0]));
              if (isTargetError) {
                btnStyle = 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 font-semibold ring-1 ring-emerald-500/30';
              } else if (isSelected && !isCorrect) {
                btnStyle = 'bg-rose-500/15 text-rose-800 dark:text-rose-300 font-semibold line-through ring-1 ring-rose-500/30';
              } else {
                btnStyle = 'opacity-40';
              }
            } else if (isSelected) {
              btnStyle = 'bg-primary/10 text-primary font-semibold ring-1 ring-primary/30';
            }

            return (
              <button
                key={i}
                type="button"
                disabled={submitted}
                onClick={() => onChangeAns(rawWord)}
                className={`mx-1 px-2.5 py-1 rounded-lg font-semibold text-xs sm:text-sm transition-colors ${btnStyle}`}
              >
                {rawWord}
              </button>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </div>
      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Info className="h-3.5 w-3.5 text-primary shrink-0" />
        <span>Chọn từ gạch chân chứa lỗi ngữ pháp cần sửa</span>
      </p>
    </div>
  );
}

function renderHighlightedQuestion(text: string) {
  if (!text) return null;
  if (text.includes('**')) {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return (
      <>
        {parts.map((part, idx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong
                key={idx}
                className="text-primary font-semibold underline decoration-primary/40 decoration-2 underline-offset-4"
              >
                {part.slice(2, -2)}
              </strong>
            );
          }
          return part;
        })}
      </>
    );
  }
  return text;
}

function InlineLessonQuizPanel({
  exercises,
  panelTitle,
  onClose,
  isSplitView = false,
}: {
  exercises: GrammarExerciseItem[];
  panelTitle?: string;
  onClose?: () => void;
  isSplitView?: boolean;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAns, setUserAns] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);

  // Classroom / Presentation Suite
  const [viewMode, setViewMode] = useState<'slide' | 'worksheet'>('slide');
  const [isProjectorMode, setIsProjectorMode] = useState(false);
  const [showQuestionPicker, setShowQuestionPicker] = useState(false);
  const [answeredHistory, setAnsweredHistory] = useState<Record<number, { correct: boolean; ans: string }>>({});
  const [revealedInWorksheet, setRevealedInWorksheet] = useState<Record<number, boolean>>({});
  const [worksheetShowAll, setWorksheetShowAll] = useState(false);
  const [worksheetFontSize, setWorksheetFontSize] = useState<'normal' | 'large'>('normal');

  const currentEx = exercises?.[currentIndex];
  const exQuestion = (currentEx?.question || currentEx?.q || '')
    .replace(/^Câu\s+\d+[:\.]?\s*/i, '')
    .replace(/^\d+[\.\)]\s*/, '')
    .trim();
  const exCorrectAnswer = String(currentEx?.correct_answer || currentEx?.answer || '').trim();

  const handleSelectQuestion = (idx: number) => {
    if (!exercises || idx < 0 || idx >= exercises.length) return;
    setCurrentIndex(idx);
    setShowQuestionPicker(false);
    const existing = answeredHistory[idx];
    if (existing) {
      setUserAns(existing.ans);
      setIsCorrect(existing.correct);
      setSubmitted(true);
    } else {
      setUserAns('');
      setSubmitted(false);
      setIsCorrect(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      handleSelectQuestion(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (exercises && currentIndex < exercises.length - 1) {
      handleSelectQuestion(currentIndex + 1);
    }
  };

  const handleSubmit = () => {
    if (!userAns.trim() || !currentEx) return;
    const correct = isGrammarAnswerCorrect(userAns, exCorrectAnswer, currentEx.options);
    setIsCorrect(correct);
    setSubmitted(true);
    if (correct && !answeredHistory[currentIndex]) {
      setScore((prev) => prev + 1);
    }
    setAnsweredHistory((prev) => ({
      ...prev,
      [currentIndex]: { correct, ans: userAns },
    }));
  };

  const handleTeacherReveal = () => {
    setUserAns(exCorrectAnswer);
    setIsCorrect(true);
    setSubmitted(true);
    setAnsweredHistory((prev) => ({
      ...prev,
      [currentIndex]: { correct: true, ans: exCorrectAnswer },
    }));
  };

  // Keyboard navigation for presentation clicker / keyboard
  useEffect(() => {
    if (!exercises || exercises.length === 0 || !currentEx) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        handlePrev();
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        if (!submitted) {
          handleTeacherReveal();
        } else {
          setSubmitted(false);
        }
      } else if (e.key === 'Enter') {
        if (!submitted && userAns.trim()) {
          e.preventDefault();
          handleSubmit();
        } else if (submitted && currentIndex < exercises.length - 1) {
          e.preventDefault();
          handleNext();
        }
      } else if (!submitted && currentEx.options && currentEx.options.length > 0 && currentEx.type !== 'error_correction') {
        const key = e.key.toUpperCase();
        let optIdx = -1;
        if (['A', 'B', 'C', 'D'].includes(key)) {
          optIdx = key.charCodeAt(0) - 65;
        } else if (['1', '2', '3', '4'].includes(key)) {
          optIdx = parseInt(key, 10) - 1;
        }
        if (optIdx >= 0 && optIdx < currentEx.options.length) {
          e.preventDefault();
          const cleanOpt = currentEx.options[optIdx].replace(/^[A-D]\.\s*/i, '');
          setUserAns(cleanOpt);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, submitted, exercises, exCorrectAnswer, userAns, currentEx]);

  if (!exercises || exercises.length === 0 || !currentEx) {
    return (
      <div className="p-8 text-center text-muted-foreground bg-card border border-border rounded-xl shadow-xs">
        <Dumbbell className="h-10 w-10 mx-auto mb-2 opacity-30 text-primary" />
        <p className="font-semibold text-sm text-foreground">Chưa có bài tập cho phần này.</p>
        <p className="text-xs mt-1 text-muted-foreground">Vui lòng chọn chuyên đề khác hoặc quay lại lộ trình!</p>
      </div>
    );
  }

  return (
    <div className={`relative flex flex-col h-full bg-background border rounded-2xl shadow-lg overflow-hidden ${isSplitView ? 'border-primary/30 ring-1 ring-primary/10' : ''}`}>
      {/* Header */}
      <div className="px-4 sm:px-5 py-3 bg-card border-b border-border text-foreground flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Dumbbell className="h-4 w-4" />
          </div>
          <span className="font-semibold text-sm truncate">{panelTitle || 'Luyện Tập Trực Tiếp'}</span>

          {/* Jump to Question button */}
          <button
            type="button"
            onClick={() => setShowQuestionPicker((v) => !v)}
            className="flex items-center gap-1.5 bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold px-2.5 py-1 rounded-lg border border-border/60 transition-colors"
            title="Bấm để nhảy nhanh đến câu hỏi bất kỳ"
          >
            <span>{currentIndex + 1}/{exercises.length}</span>
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showQuestionPicker ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Header Action controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Mode switch: Slide vs Worksheet */}
          <div className="flex bg-muted p-0.5 rounded-lg border border-border/50 text-foreground">
            <button
              type="button"
              onClick={() => setViewMode('slide')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
                viewMode === 'slide' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Trình chiếu từng câu (Dạng Slide / Flashcard)"
            >
              <Layers className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Slide</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('worksheet')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
                viewMode === 'worksheet' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Xem danh sách toàn bộ đề bài (Chiếu cả lớp làm không cần in ấn)"
            >
              <List className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Tờ Đề</span>
            </button>
          </div>

          {/* Projector font toggle */}
          {viewMode === 'slide' && (
            <button
              type="button"
              onClick={() => setIsProjectorMode((v) => !v)}
              className={`p-1.5 rounded-lg transition-all border ${
                isProjectorMode
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-400 font-semibold'
                  : 'bg-muted hover:bg-muted/80 border-border/60 text-muted-foreground hover:text-foreground'
              }`}
              title={isProjectorMode ? 'Tắt chế độ chữ lớn máy chiếu' : 'Bật chế độ chữ lớn máy chiếu (Dành cho lớp học)'}
            >
              <Monitor className="h-4 w-4" />
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="h-7 w-7 rounded-lg bg-muted hover:bg-muted/80 border border-border/60 flex items-center justify-center text-muted-foreground hover:text-foreground text-xs font-semibold transition-colors shrink-0"
              title="Đóng"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Question Picker Modal Overlay */}
      {showQuestionPicker && (
        <div className="absolute inset-x-3 sm:inset-x-5 top-14 z-50 max-h-[75%] overflow-y-auto bg-card/95 backdrop-blur-md border border-border rounded-xl shadow-xl p-4 text-card-foreground animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-border text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <List className="h-4 w-4 text-primary" />
              Chọn câu hỏi (1 – {exercises.length})
            </span>
            <button
              onClick={() => setShowQuestionPicker(false)}
              className="px-2.5 py-1 bg-muted hover:bg-muted/80 rounded-md text-muted-foreground hover:text-foreground text-xs font-medium transition-colors"
            >
              Đóng
            </button>
          </div>
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-1.5 sm:gap-2">
            {exercises.map((_, i) => {
              const ans = answeredHistory[i];
              let btnClr = 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80';
              if (i === currentIndex) {
                btnClr = 'bg-primary text-primary-foreground font-bold shadow-xs';
              } else if (ans?.correct) {
                btnClr = 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-semibold';
              } else if (ans && !ans.correct) {
                btnClr = 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 font-semibold';
              }
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectQuestion(i)}
                  className={`h-8 rounded-lg text-xs font-semibold transition-all flex items-center justify-center ${btnClr}`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Progress Bar (Slide mode) */}
      {viewMode === 'slide' && (
        <div className="w-full bg-muted h-1 shrink-0">
          <div
            className="bg-primary h-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / exercises.length) * 100}%` }}
          />
        </div>
      )}

      {/* ─── MODE 1: WORKSHEET VIEW (CHIẾU ĐỀ BÀI CHO CẢ LỚP LÀM KHÔNG CẦN IN) ─── */}
      {viewMode === 'worksheet' ? (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Worksheet Top Bar */}
          <div className="sticky top-0 z-10 bg-card/95 backdrop-blur border border-border p-3 rounded-xl flex flex-wrap items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-md flex items-center gap-1.5 font-semibold">
                <FileText className="h-3.5 w-3.5" />
                Tờ Đề Bài ({exercises.length} câu)
              </span>
              <span className="hidden md:inline text-muted-foreground font-normal">• Trình chiếu trực tiếp cho cả lớp theo dõi và làm bài</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const next = !worksheetShowAll;
                  setWorksheetShowAll(next);
                  const newRev: Record<number, boolean> = {};
                  exercises.forEach((_, idx) => { newRev[idx] = next; });
                  setRevealedInWorksheet(newRev);
                }}
                className="px-3 py-1.5 bg-muted text-foreground hover:bg-muted/80 font-medium text-xs rounded-lg flex items-center gap-1.5 transition-colors border border-border/60"
              >
                {worksheetShowAll ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                <span>{worksheetShowAll ? 'Ẩn tất cả đáp án' : 'Hiện tất cả đáp án'}</span>
              </button>
              <button
                type="button"
                onClick={() => setWorksheetFontSize((s) => s === 'normal' ? 'large' : 'normal')}
                className="px-2.5 py-1.5 bg-muted text-foreground font-medium text-xs rounded-lg hover:bg-muted/80 border border-border/60"
                title="Đổi cỡ chữ hiển thị trên máy chiếu"
              >
                {worksheetFontSize === 'normal' ? 'Cỡ chữ: Lớn (Chiếu)' : 'Cỡ chữ: Chuẩn'}
              </button>
            </div>
          </div>

          {/* List of Questions - Open Editorial Worksheet with Hairline Dividers */}
          <div className="divide-y divide-border/30">
            {exercises.map((ex, idx) => {
              const qText = (ex.question || ex.q || '').replace(/^Câu\s+\d+[:\.]?\s*/i, '').trim();
              const isRev = revealedInWorksheet[idx] || worksheetShowAll;
              const hasOpts = ex.options && ex.options.length > 0;

              return (
                <div key={idx} className="py-5 sm:py-6 space-y-3 first:pt-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <span className="h-6 px-2 rounded-md bg-primary/10 text-primary font-semibold text-xs flex items-center justify-center shrink-0 font-mono">
                        Câu {idx + 1}
                      </span>
                      <p className={`font-semibold text-foreground leading-relaxed ${
                        worksheetFontSize === 'large' ? 'text-lg sm:text-xl' : 'text-sm sm:text-base'
                      }`}>
                        {renderHighlightedQuestion(qText)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => speakEnglish(qText.replace(/\*\*/g, ''))}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shrink-0"
                      title="Nghe phát âm đề bài"
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Options */}
                  {hasOpts && (
                    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 ${worksheetFontSize === 'large' ? 'text-base' : 'text-sm'}`}>
                      {ex.options?.map((opt: string, oIdx: number) => {
                        const cleanOpt = opt.replace(/^[A-D]\.\s*/i, '');
                        const letter = String.fromCharCode(65 + oIdx);
                        const isCorrectOpt = isOptionMatchingCorrect(opt, oIdx, String(ex.correct_answer || ''));
                        let optCls = 'hover:bg-muted/40 text-foreground';
                        if (isRev && isCorrectOpt) {
                          optCls = 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-semibold ring-1 ring-emerald-500/20';
                        }
                        return (
                          <div key={oIdx} className={`py-2 px-3 rounded-lg flex items-center gap-2.5 transition-colors ${optCls}`}>
                            <span className={`h-5 w-5 rounded-md font-semibold text-xs flex items-center justify-center shrink-0 ${
                              isRev && isCorrectOpt ? 'bg-emerald-600 text-white' : 'bg-muted/60 text-muted-foreground'
                            }`}>
                              {letter}
                            </span>
                            <span className="font-medium">{cleanOpt}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Fill in blank answer if no options */}
                  {!hasOpts && isRev && (
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-semibold flex items-center gap-2">
                      <span>Đáp án đúng:</span>
                      <span className="font-mono underline">{ex.correct_answer}</span>
                    </div>
                  )}

                  {/* Toggle Explanation Button */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => setRevealedInWorksheet((prev) => ({ ...prev, [idx]: !prev[idx] }))}
                      className="text-xs font-semibold text-primary hover:underline flex items-center gap-1.5"
                    >
                      {isRev ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      <span>{isRev ? 'Ẩn đáp án & giải thích' : 'Xem đáp án & giải thích'}</span>
                    </button>

                    {isRev && ex.explanation && (
                      <span className="text-[11px] text-muted-foreground font-mono">
                        Lời giải chi tiết
                      </span>
                    )}
                  </div>

                  {/* Explanation Box */}
                  {isRev && ex.explanation && (
                    <div className="p-3.5 rounded-r-xl border-l-2 border-amber-500/50 bg-amber-500/[0.04] text-xs sm:text-sm text-foreground leading-relaxed animate-in fade-in">
                      <strong>Giải thích:</strong> {ex.explanation.replace(/^(?:💡|Giải thích|Lời giải|Note|Lưu ý)[:\s*–—\-]+/i, '').trim()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ─── MODE 2: SLIDE / FLASHCARD VIEW ─── */
        <>
          <div className={`flex-1 overflow-y-auto ${isProjectorMode ? 'p-6 sm:p-8 space-y-6' : 'p-5 sm:p-6 space-y-4'}`}>
            <div className={`space-y-3 pb-2 ${isProjectorMode ? 'p-6 sm:p-8' : 'p-4 sm:p-5'}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono tracking-widest uppercase text-muted-foreground/80 font-semibold">
                  Câu {currentIndex + 1} / {exercises.length} • {currentEx.type === 'multiple_choice' ? 'Trắc nghiệm' : currentEx.type === 'error_correction' ? 'Tìm lỗi sai' : 'Điền vào chỗ trống'}
                </span>
                {isProjectorMode && (
                  <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md flex items-center gap-1.5">
                    <Monitor className="h-3 w-3" /> Chế độ máy chiếu
                  </span>
                )}
              </div>

              {currentEx.type === 'error_correction' ? (
                <ErrorCorrectionQuestion
                  question={exQuestion}
                  userAns={userAns}
                  onChangeAns={setUserAns}
                  submitted={submitted}
                  isCorrect={isCorrect}
                  correctAnswer={exCorrectAnswer}
                />
              ) : currentEx.options && currentEx.options.length > 0 ? (
                <div className="flex items-start justify-between gap-3">
                  <h4 className={`font-semibold text-foreground leading-relaxed ${
                    isProjectorMode ? 'text-xl sm:text-2xl lg:text-3xl' : 'text-base sm:text-lg'
                  }`}>
                    {renderHighlightedQuestion(exQuestion)}
                  </h4>
                  <button
                    type="button"
                    onClick={() => speakEnglish(exQuestion.replace(/\*\*/g, ''))}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                    title="Nghe phát âm đề bài"
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <InlineGapQuestion
                  question={exQuestion}
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
              <div className={`space-y-2 ${isProjectorMode ? 'gap-3' : ''}`}>
                {currentEx.options.map((opt: string, idx: number) => {
                  const cleanOpt = opt.replace(/^[A-D]\.\s*/i, '');
                  const letter = String.fromCharCode(65 + idx);
                  const isSelected =
                    cleanGrammarAnswer(userAns) === cleanGrammarAnswer(cleanOpt) ||
                    userAns === opt ||
                    cleanGrammarAnswer(userAns) === letter.toLowerCase();
                  const isRightOpt = isOptionMatchingCorrect(opt, idx, exCorrectAnswer);

                  let optionStyle = 'bg-muted/30 hover:bg-muted/60 text-foreground';
                  if (submitted) {
                    if (isRightOpt) {
                      optionStyle = 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 font-semibold ring-1 ring-emerald-500/30';
                    } else if (isSelected && !isCorrect) {
                      optionStyle = 'bg-rose-500/15 text-rose-800 dark:text-rose-300 font-semibold ring-1 ring-rose-500/30';
                    } else {
                      optionStyle = 'opacity-40';
                    }
                  } else if (isSelected) {
                    optionStyle = 'bg-primary/10 text-primary font-semibold ring-1 ring-primary/30';
                  }

                  return (
                    <div
                      key={idx}
                      className={`w-full rounded-xl font-medium transition-colors flex items-center justify-between gap-3 ${
                        isProjectorMode ? 'p-4 sm:p-5 text-base sm:text-lg' : 'p-3 text-sm'
                      } ${optionStyle}`}
                    >
                      <button
                        type="button"
                        disabled={submitted}
                        onClick={() => setUserAns(cleanOpt)}
                        className="flex-1 text-left flex items-center gap-3"
                      >
                        <span className={`rounded-md bg-muted text-foreground font-semibold flex items-center justify-center shrink-0 ${
                          isProjectorMode ? 'h-8 w-8 text-sm' : 'h-6 w-6 text-xs font-mono'
                        }`}>
                          {letter}
                        </span>
                        <span className="font-medium">{cleanOpt}</span>
                      </button>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            speakEnglish(cleanOpt);
                          }}
                          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          title="Nghe phát âm"
                        >
                          <Volume2 className="h-3.5 w-3.5" />
                        </button>
                        {submitted && isRightOpt && <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
                        {submitted && isSelected && !isCorrect && <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Feedback & Explanation */}
            {submitted && (
              <div className={`rounded-r-xl border-l-2 text-sm space-y-2 animate-in fade-in slide-in-from-bottom-2 ${
                isProjectorMode ? 'p-5 sm:p-6' : 'p-4'
              } ${
                isCorrect
                  ? 'border-emerald-500 bg-emerald-500/[0.05] text-emerald-900 dark:text-emerald-200'
                  : 'border-rose-500 bg-rose-500/[0.05] text-rose-900 dark:text-rose-200'
              }`}>
                <div className="flex items-center gap-2 font-semibold text-base">
                  {isCorrect ? <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> : <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />}
                  <span>{isCorrect ? 'Chính xác! (+10 XP)' : 'Chưa đúng!'}</span>
                </div>
                {!isCorrect && (
                  <p className="text-xs sm:text-sm font-medium text-rose-700 dark:text-rose-300">
                    Đáp án đúng: <span className="font-mono font-semibold underline">{currentEx.correct_answer}</span>
                  </p>
                )}
                {currentEx.explanation && (
                  <p className="text-xs sm:text-sm leading-relaxed opacity-95 pt-2 border-t border-border/40">
                    <strong>Giải thích:</strong> {currentEx.explanation.replace(/^(?:💡|Giải thích|Lời giải|Note|Lưu ý)[:\s*–—\-]+/i, '').trim()}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="p-3.5 sm:p-4 border-t border-border bg-card/60 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={handlePrev}
                className="px-3 py-1.5 border border-border rounded-lg text-xs font-medium text-foreground hover:bg-muted disabled:opacity-30 transition-colors flex items-center gap-1"
                title="Câu trước đó (Phím mũi tên trái)"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Câu trước</span>
              </button>

              <span className="text-xs font-medium text-muted-foreground">
                Đúng: {score}/{currentIndex + (submitted ? 1 : 0)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {!submitted ? (
                <>
                  <button
                    type="button"
                    onClick={handleTeacherReveal}
                    className="px-3 py-1.5 bg-muted hover:bg-muted/80 text-foreground border border-border font-medium text-xs rounded-lg transition-colors flex items-center gap-1.5"
                    title="Giáo viên bấm để hiện ngay đáp án và giải thích mẫu mà không cần gõ (Phím R)"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Hiện đáp án</span>
                  </button>

                  <button
                    disabled={!userAns.trim()}
                    onClick={handleSubmit}
                    className="px-4 py-2 bg-primary text-primary-foreground font-semibold text-xs sm:text-sm rounded-lg hover:bg-primary/90 disabled:opacity-40 transition-colors shadow-xs"
                  >
                    Kiểm tra đáp án
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="px-3 py-1.5 border border-border text-muted-foreground hover:text-foreground text-xs font-medium rounded-lg hover:bg-muted"
                    title="Ẩn đáp án để học sinh thử lại"
                  >
                    Làm lại
                  </button>

                  {currentIndex < exercises.length - 1 ? (
                    <button
                      onClick={handleNext}
                      className="px-4 py-2 bg-foreground text-background font-semibold text-xs sm:text-sm rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1"
                      title="Câu tiếp theo (Phím mũi tên phải)"
                    >
                      <span>Câu tiếp</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Đã hoàn thành!
                      </span>
                      {onClose && (
                        <button
                          onClick={onClose}
                          className="px-3 py-1.5 bg-primary text-primary-foreground font-medium text-xs rounded-lg hover:bg-primary/90 transition-colors"
                        >
                          Đóng
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function cleanTrapText(raw: string): string {
  let t = raw
    .replace(/^\|.*\|$/, '')
    .replace(/^#+\s*/, '')
    .replace(/[①②③④⑤⑥⑦⑧⑨⑩]/g, '')
    .replace(/(?:^|[^\w\u00C0-\u1EF9])(?:🟡\s*)?(?:THẺ|Thẻ|Ô|Khung)\s+[A-Z0-9](?:\s*[·:–—.-]\s*|\s+(?=\p{Lu})|(?=[)\]}]|$))/giu, '')
    .replace(/^(?:⚠\s*)?(?:Bẫy\s*\d*|Lưu ý bẫy|Bẫy phòng thi|Bẫy đề|Lưu ý|Bẫy kinh điển|Bẫy cực nguy hiểm|Bẫy phát âm|Bẫy Tiền Tố|ĐẠI BẪY|Đại bẫy|Kinh điển)[:\s*–—\-]+/iu, '')
    .replace(/^(?:Phát âm|Cách đọc|Đọc là|Nói|Thầy lưu ý|Giáo viên|Lưu ý phát âm)[:\s*–—\-]+/iu, '')
    .replace(/^[\s*•✦\-–—\d\.\)→✓✗❌✅]+/, '')
    .replace(/\*+/g, '')
    .replace(/`slide[^`]*`/gi, '')
    .replace(/`+/g, '')
    .replace(/cần thuộc lòng/gi, 'trọng tâm')
    .replace(/cần thuộc[:\*]*\s*/iu, '')
    .replace(/^[A-Z0-9\s]+Trap\):?\s*/iu, '')
    .replace(/<\/?(?:s|b|i|span|strong|em)[^>]*>/gi, '')
    .replace(/\s*[-—–]\s*\*(?:SAI|ĐÚNG|Sai|Đúng)\*/g, '')
    .replace(/\s*\((?:SAI|ĐÚNG|Sai|Đúng)\)/g, '')
    .replace(/\s*[-—–]\s*(?:SAI|ĐÚNG)\b/g, '')
    .replace(/[:—–\-]+$/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // Strip duplicate numbering prefix e.g. "1. 1. " or "1. " or "Bẫy 1: Bẫy 1: "
  t = t.replace(/^(?:\d+[\.\)]\s*)+/, '');
  t = t.replace(/^(?:(?:Bẫy|Lưu ý|Kinh điển)\s*\d*[:\s–—\-]*)+/iu, '');

  t = cleanExamTerminology(t);

  if (t.length > 0) {
    t = t.charAt(0).toUpperCase() + t.slice(1);
  }
  return t;
}

function cleanContrastText(raw: string): string {
  const t = raw
    .replace(/^[-*•\s]+/, '')
    .replace(/^(?:✅|❌|✓|✗|ĐÚNG|SAI|Đúng|Sai|Good|Bad)[:—–\-]?\s*/i, '')
    .replace(/\s*[-—–]\s*\*(?:ĐÚNG|SAI|Đúng|Sai|đều đặn[^\*]*|làm tạm[^\*]*|SAI[^\*]*|ĐÚNG[^\*]*)\*$/i, '')
    .replace(/\s*\([^\)]*(?:ĐÚNG|SAI|Đúng|Sai)[^\)]*\)/gi, '')
    .replace(/<\/?(?:s|b|i|span|strong|em)[^>]*>/gi, '')
    .replace(/\*+/g, '')
    .replace(/`+/g, '')
    .replace(/[:—–\-]+$/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return cleanExamTerminology(t);
}

function cleanTheoryBody(body: string): string {
  const lines = body.split(/\r?\n/);
  const cleaned = lines.map(rawLine => {
    let line = rawLine;
    line = line.replace(/^(#{2,4}\s+)(?:🟡\s*)?(?:THẺ|Thẻ|Ô|Khung)\s+[A-Z0-9](?:\s*\([^\)]+\))?\s*[·:–—.-]\s*/iu, '$1');
    line = line.replace(/^(#{2,4}\s+)(?:🟡\s*)?(?:THẺ|Thẻ|Ô|Khung)\s+[A-Z0-9]\b\s*/iu, '$1');
    line = line.replace(/\s*\((?:Ô|Thẻ)\s+[A-Z0-9]\)/giu, '');
    line = line.replace(/(?:^|[^\w\u00C0-\u1EF9])(?:🟡\s*)?(?:THẺ|Thẻ|Ô|Khung)\s+[A-Z0-9]\s*[·:–—.-]\s*/giu, ' ');
    line = line.replace(/①\s*KHUNG\s*/gi, '**Công thức:** ');
    line = line.replace(/②\s*(?:KHI NÀO|NGỮ CẢNH|ĐIỀU KIỆN)\s*/gi, '**Cách dùng:** ');
    line = line.replace(/②\s*LƯU Ý\s*/gi, '**Lưu ý trọng tâm:** ');
    line = line.replace(/③\s*(?:Cặp đối[^\n]*|Cơ chế[^\n]*)/gi, '**Ví dụ đối chiếu:**');
    line = line.replace(/④\s*(?:⚠\s*)?(?:Bẫy đề[^\n]*|Bẫy thi[^\n]*)/gi, '**Lưu ý quan trọng:**');
    line = line.replace(/[①②③④⑤⑥⑦⑧⑨⑩]/g, '•');
    line = line.replace(/>\s*\*\*Giáo viên nhấn mạnh với học sinh:\*\*\s*/gi, '> **Lưu ý trọng tâm:** ');
    line = line.replace(/Bẫy cần thuộc[:\*]*/gi, 'Lưu ý cần nhớ:');
    line = line.replace(/cặp bẫy so sánh cần thuộc[:\*]*/gi, 'Cặp so sánh đối chiếu:');
    line = line.replace(/Bẫy đề thi[:\*]*/gi, 'Lưu ý quan trọng:');
    line = line.replace(/Bẫy đề[:\*]*/gi, 'Lưu ý:');
    line = line.replace(/phòng thi THPT/gi, 'cần nhớ');
    line = line.replace(/cần thuộc lòng/gi, 'trọng tâm');
    line = line.replace(/cần thuộc[:\*]*\s*/gi, 'cần nhớ:');
    line = line.replace(/[-*•]\s*(?:✗|❌|SAI|Sai)\s*[:—–\-]?\s*/g, '- ❌ ');
    line = line.replace(/[-*•]\s*(?:✓|✅|ĐÚNG|Đúng)\s*[:—–\-]?\s*/g, '- ✅ ');
    line = line.replace(/\s*[-—–]\s*\*(?:SAI|ĐÚNG|Sai|Đúng)\*/g, '');
    line = line.replace(/\s*\((?:SAI|ĐÚNG|Sai|Đúng)\)/g, '');
    line = line.replace(/\s*[-—–]\s*(?:SAI|ĐÚNG)\b/g, '');
    line = line.replace(/^(#{2,4}\s+)(\d+)[\.\)]\s+(\d+)[\.\)]\s*/, '$1$2. ');
    line = line.replace(/`slide\s*[\d–-]+`/gi, '');
    line = line.replace(/`slide`/gi, '');
    return cleanExamTerminology(line);
  });
  return cleaned.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function formatSectionTitle(rawTitle: string, idx: number): string {
  if (!rawTitle) {
    return idx === 0 ? 'Tổng quan & Trọng tâm bài học' : `Khối kiến thức ${idx + 1}`;
  }

  let text = rawTitle.trim();

  // 1. Remove markdown heading symbols
  text = text.replace(/^#+\s*/, '');

  // 2. Remove emojis and bullet icons: 🟡, 🟢, 🔵, ✦, ★, etc.
  text = text.replace(/^[🟡🟢🔵🔴⚪⚫✦★⭐•\-\*\s]+/, '');

  // 3. Remove card labels: "THẺ A ·", "Thẻ 1:", "Ô A ·", "Ô 1 -", "Khung 1:"
  text = text.replace(/^(?:🟡\s*)?(?:THẺ|Thẻ|Ô|Khung)\s+[A-Z0-9](?:\s*[·:–—.-]\s*|\s+)/iu, '');

  // 4. Remove generic prefix "Phần X: "
  text = text.replace(/^Phần\s+\d+[:\.\s–—\-]+/i, '');

  // 5. Shorten overly long headings
  if (text.length > 50) {
    const parts = text.split(/[:—–\-\(\)]/);
    if (parts[0] && parts[0].trim().length >= 8) {
      text = parts[0].trim();
    }
  }

  text = cleanExamTerminology(text);

  return text || (idx === 0 ? 'Tổng quan & Trọng tâm bài học' : `Khối kiến thức ${idx + 1}`);
}

function CollapsibleTheoryMarkdown({
  content,
  onTriggerPractice,
}: {
  content: string;
  onTriggerPractice?: (secIndex: number, secTitle: string) => void;
}) {
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({});

  if (!content) return null;

  const parts = content
    .split(/\n(?=#{1,3}\s+)/g)
    .map((part, idx) => {
      const lines = part.trim().split('\n');
      let title = idx === 0 ? 'Tổng quan & Trọng tâm bài học' : `Khối kiến thức ${idx + 1}`;
      let body = part.trim();
      if (/^#{1,3}\s+/.test(lines[0])) {
        title = lines[0].replace(/^#{1,3}\s+/, '').trim();
        body = lines.slice(1).join('\n').trim();
      }
      return { title, body: cleanTheoryBody(body) };
    })
    .filter((p) => p.body.length > 10 || p.title.length > 5);

  if (parts.length <= 1 || content.length < 1200) {
    return (
      <div className="prose prose-slate max-w-none py-4 sm:py-6">
        <LazyMarkdown components={markdownComponents}>{cleanTheoryBody(content)}</LazyMarkdown>
        {onTriggerPractice && (
          <div className="mt-6 pt-4 border-t border-border/30 flex justify-end">
            <button
              onClick={() => onTriggerPractice(0, 'Bài tập tổng quan')}
              className="px-4 py-2 bg-primary text-primary-foreground font-semibold text-xs rounded-lg shadow-xs hover:bg-primary/90 transition-colors flex items-center gap-1.5"
            >
              <Dumbbell className="h-3.5 w-3.5" /> Làm bài tập củng cố ngay
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

  const collapseAll = () => {
    setExpandedSections({});
  };

  const hasCollapsed = parts.some((_, idx) => !expandedSections[idx]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1 text-xs text-muted-foreground font-medium">
        <span>Giáo trình {parts.length} khối kiến thức trọng tâm</span>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={expandAll}
            className="text-primary hover:underline font-semibold"
          >
            Mở tất cả
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={collapseAll}
            className="hover:text-foreground transition-colors font-semibold"
          >
            Thu gọn tất cả
          </button>
        </div>
      </div>
      <div className="divide-y divide-border/30">
        {parts.map((sec, idx) => {
          const isOpen = !!expandedSections[idx];
          const displayTitle = formatSectionTitle(sec.title, idx);
          return (
            <div key={idx} className="py-2">
              <button
                onClick={() => toggleSection(idx)}
                className="w-full flex items-center justify-between py-3.5 px-2 hover:text-primary transition-colors text-left font-semibold text-foreground"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <span className="shrink-0 h-6 w-6 rounded-md bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center font-mono">
                    {idx + 1}
                  </span>
                  <span className="text-sm sm:text-base font-semibold truncate">{displayTitle}</span>
                </div>
                <ChevronDown className={`shrink-0 h-4 w-4 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
              </button>

              {isOpen && (
                <div className="py-4 px-2 prose prose-slate max-w-none">
                  <LazyMarkdown components={markdownComponents}>{sec.body}</LazyMarkdown>
                  {onTriggerPractice && (
                    <div className="mt-6 pt-4 border-t border-border/30 flex justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTriggerPractice(idx, displayTitle);
                        }}
                        className="px-3.5 py-1.5 bg-primary/10 hover:bg-primary/15 text-primary font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <Dumbbell className="h-3.5 w-3.5" /> Luyện tập củng cố: {displayTitle}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {hasCollapsed && (
        <button
          onClick={expandAll}
          className="w-full py-2.5 px-4 text-muted-foreground hover:text-foreground font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2"
        >
          <ChevronDown className="h-4 w-4 text-muted-foreground" /> Mở rộng toàn bộ bài học
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
  const [activeTab, setActiveTab] = useState<'summary' | 'theory' | 'cheatsheet' | 'video' | 'exercises'>('summary');

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
      let lessons = (res?.success ? res.data : []) as GrammarLesson[];

      if (lessons.length === 0) {
        const topicObj = topics.find((t) => t.id === topicId);
        if (topicObj?.order_index) {
          const fallbackRes = await fetch(`/api/grammar/lessons?orderIndex=${topicObj.order_index}`)
            .then((r) => r.json())
            .catch(() => null);
          if (fallbackRes?.success && fallbackRes.data.length > 0) {
            lessons = fallbackRes.data;
          }
        }
      }

      setLessonsByTopic((prev) => ({ ...prev, [topicId]: lessons }));
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
        const matched = exercises.filter((ex: GrammarExerciseItem) => {
          const text = ((ex.question || '') + ' ' + (ex.explanation || '')).toLowerCase();
          return text.includes('đuôi -s') || text.includes('-es') || text.includes('y thành') || text.includes('ngôi ba số ít') || text.includes('ngôi thứ ba') || text.includes('chính tả') || text.includes('chữ cái cuối') || text.includes('r01b');
        });
        if (matched.length > 0) return matched;
      }

      // Rule 2: "Phủ định", "nghi vấn", "do/does", "be và", "trợ động từ"
      if (titleLower.includes('phủ định') || titleLower.includes('nghi vấn') || titleLower.includes('be và') || titleLower.includes('do/does') || titleLower.includes('đường')) {
        const matched = exercises.filter((ex: GrammarExerciseItem) => {
          const text = ((ex.question || '') + ' ' + (ex.explanation || '')).toLowerCase();
          return text.includes("don't") || text.includes("doesn't") || text.includes("do/does") || text.includes("mượn") || text.includes("phủ định") || text.includes("nghi vấn") || text.includes("trợ động từ") || text.includes("đảo be");
        });
        if (matched.length > 0) return matched;
      }

      // Rule 3: "Công thức", "Hòa hợp", "chủ ngữ", "số ít", "số nhiều"
      if (titleLower.includes('công thức') || titleLower.includes('hòa hợp') || titleLower.includes('chủ ngữ') || titleLower.includes('số ít') || titleLower.includes('số nhiều')) {
        const matched = exercises.filter((ex: GrammarExerciseItem) => {
          const text = ((ex.question || '') + ' ' + (ex.explanation || '')).toLowerCase();
          return text.includes('hòa hợp') || text.includes('số ít') || text.includes('số nhiều') || text.includes('chủ ngữ') || text.includes('nối bằng and') || text.includes('danh từ');
        });
        if (matched.length > 0) return matched;
      }

      // Rule 4: "Định nghĩa", "xương câu", "tổng quan", "cấu trúc câu"
      if (titleLower.includes('định nghĩa') || titleLower.includes('xương câu') || titleLower.includes('tổng quan') || titleLower.includes('cấu trúc')) {
        const matched = exercises.filter((ex: GrammarExerciseItem) => {
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
      <main className="min-h-dvh bg-background font-sans">
        <header className="static sm:sticky sm:top-header-safe z-20 bg-background/90 backdrop-blur border-b border-border/40 h-14 flex items-center justify-between px-4 sm:px-6">
          <button
            onClick={() => setActiveLesson(null)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-semibold"
          >
            <ChevronLeft className="h-4 w-4" /> Lộ trình
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSplitView((v) => !v)}
              className={`hidden lg:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                splitView
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/60 text-muted-foreground hover:text-foreground'
              }`}
              title="Bật/Tắt chế độ Vừa đọc Lý thuyết vừa Làm bài tập song song"
            >
              <Split className="h-3.5 w-3.5" />
              <span>{splitView ? 'Màn hình đọc' : 'Vừa đọc vừa làm (Split view)'}</span>
            </button>

            <button
              onClick={() => {
                setQuizSectionIndex(null);
                setQuizModalOpen(true);
              }}
              className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors"
            >
              <Dumbbell className="h-3.5 w-3.5" />
              <span>Làm bài tập ngay</span>
            </button>
          </div>
        </header>

        <div className={splitView ? 'max-w-7xl mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start' : ''}>
          <article className={splitView ? 'space-y-8 min-w-0' : 'max-w-3xl mx-auto p-4 sm:p-8 space-y-8'}>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono tracking-widest text-muted-foreground/70 uppercase">
                {cleanExamTerminology(activeLesson.topic?.title_vi || activeLesson.topic?.title || 'Ngữ Pháp Ứng Dụng')}
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl tracking-tight text-foreground font-semibold leading-tight">
              {cleanExamTerminology(activeLesson.title)}
            </h1>

            {/* Banner Khung câu hỏi cốt lõi & Mục tiêu */}
            {(activeLesson.sections?.bigQuestion || activeLesson.sections?.outcome) && (
              <div className="py-3 px-4 rounded-r-xl border-l-2 border-primary/40 bg-primary/[0.03] space-y-2">
                {activeLesson.sections?.bigQuestion && (
                  <div className="flex items-start gap-2.5 text-sm text-foreground">
                    <span className="h-5 w-5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <HelpCircle className="h-3.5 w-3.5" />
                    </span>
                    <span><strong>Câu hỏi cốt lõi:</strong> {cleanExamTerminology(activeLesson.sections.bigQuestion)}</span>
                  </div>
                )}
                {activeLesson.sections?.outcome && (
                  <div className="flex items-start gap-2.5 text-xs text-muted-foreground">
                    <span className="h-5 w-5 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Target className="h-3.5 w-3.5" />
                    </span>
                    <span><strong>Mục tiêu:</strong> {cleanExamTerminology(activeLesson.sections.outcome)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Tabbed Navigation Bar */}
            <div className="flex items-center gap-1.5 border-b border-border/40 pb-3 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('summary')}
                className={`px-3.5 py-1.5 rounded-lg font-medium text-xs sm:text-sm flex items-center gap-2 transition-colors shrink-0 ${
                  activeTab === 'summary'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <BookOpen className="h-4 w-4" />
                <span>Trọng tâm & Sơ đồ</span>
              </button>

              {(activeLesson.sections?.cheatSheetHtml || activeLesson.sections?.wordbanks?.length) && (
                <button
                  type="button"
                  onClick={() => setActiveTab('cheatsheet')}
                  className={`px-3.5 py-1.5 rounded-lg font-medium text-xs sm:text-sm flex items-center gap-2 transition-colors shrink-0 ${
                    activeTab === 'cheatsheet'
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <Table className="h-4 w-4" />
                  <span>Bảng tra cứu</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveTab('theory')}
                className={`px-3.5 py-1.5 rounded-lg font-medium text-xs sm:text-sm flex items-center gap-2 transition-colors shrink-0 ${
                  activeTab === 'theory'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <FileText className="h-4 w-4" />
                <span>Lý thuyết chi tiết</span>
              </button>

              {(activeLesson.sections?.videoUrl || activeLesson.source_url) && (
                <button
                  type="button"
                  onClick={() => setActiveTab('video')}
                  className={`px-3.5 py-1.5 rounded-lg font-medium text-xs sm:text-sm flex items-center gap-2 transition-colors shrink-0 ${
                    activeTab === 'video'
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <PlayCircle className="h-4 w-4" />
                  <span>Video bài giảng</span>
                </button>
              )}

              {activeLesson.exercises && activeLesson.exercises.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('exercises')}
                  className={`px-3.5 py-1.5 rounded-lg font-medium text-xs sm:text-sm flex items-center gap-2 transition-colors shrink-0 ${
                    activeTab === 'exercises'
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <Dumbbell className="h-4 w-4" />
                  <span>Bài tập ({activeLesson.exercises.length})</span>
                </button>
              )}
            </div>

            {/* Tab 1: Trọng tâm & Sơ đồ (Dễ nhìn - Visual First) */}
            {activeTab === 'summary' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Interactive Visual Infographic & Diagram with Audio Pronunciation */}
                <GrammarVisualConcept
                  buoiNum={parseTopicTitle(activeLesson.topic?.title || activeLesson.title).buoiNum || activeLesson.order_index || 1}
                  lessonTitle={activeLesson.title}
                />

                {/* Traps & Exam Warnings */}
                {activeLesson.sections?.traps && activeLesson.sections.traps.length > 0 && (() => {
                  const cleanedTraps = activeLesson.sections.traps
                    .map((t: string) => cleanTrapText(t))
                    .filter((t: string) => {
                      if (t.length <= 12 || t.endsWith(':')) return false;
                      const low = t.toLowerCase();
                      if (low.startsWith('cơ chế') || low.includes('khối kiến thức') || low.endsWith('& bẫy đề') || low.endsWith('& bẫy đề thi')) return false;
                      if (low.startsWith('phát âm') || low.startsWith('cách đọc') || low.startsWith('nói:')) return false;
                      return true;
                    });
                  if (cleanedTraps.length === 0) return null;

                  return (
                    <div className="p-4 sm:p-5 rounded-r-xl border-l-2 border-amber-500/60 bg-amber-500/[0.04] space-y-3">
                      <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-semibold text-sm sm:text-base">
                        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>Lưu Ý & Lỗi Sai Thường Gặp Cần Tránh</span>
                      </div>
                      <ul className="space-y-2 text-xs sm:text-sm text-foreground">
                        {cleanedTraps.slice(0, 5).map((t: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2.5 py-1 text-foreground leading-relaxed">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                            <span className="leading-relaxed">{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })()}

                {/* Contrast Pairs (Đúng vs Sai) */}
                {activeLesson.sections?.contrastPairs && activeLesson.sections.contrastPairs.length > 0 && (
                  <div className="space-y-3 py-2">
                    <div className="flex items-center gap-2 text-foreground font-semibold text-sm sm:text-base">
                      <ArrowLeftRight className="h-4 w-4 text-primary shrink-0" />
                      <span>Cặp Ví Dụ Đối Chiếu (Đúng vs Chưa chuẩn)</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {activeLesson.sections.contrastPairs.slice(0, 4).map((p, idx) => (
                        <div key={idx} className="p-3 bg-muted/30 rounded-xl space-y-2 text-xs sm:text-sm">
                          <div className="flex items-start gap-2 text-emerald-800 dark:text-emerald-300 font-medium">
                            <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span className="flex-1">{cleanContrastText(p.good || '')}</span>
                          </div>
                          <div className="flex items-start gap-2 text-rose-800 dark:text-rose-300 font-normal">
                            <X className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                            <span className="flex-1">{cleanContrastText(p.bad || '')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Action Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setQuizSectionIndex(null);
                      setQuizModalOpen(true);
                    }}
                    className="col-span-1 sm:col-span-2 py-3 px-5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Dumbbell className="h-4 w-4" /> Bắt đầu làm bài tập ({activeLesson.exercises?.length || 0} câu)
                  </button>

                  {activeLesson.sections?.cheatSheetHtml && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('cheatsheet')}
                      className="py-3 px-5 rounded-xl border border-border bg-card hover:bg-accent text-foreground font-medium text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Table className="h-4 w-4 text-primary" /> Bảng tra nhanh
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: Lý thuyết chi tiết */}
            {activeTab === 'theory' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {activeLesson.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={resolveImageSrc(activeLesson.image_url)}
                    referrerPolicy="no-referrer"
                    alt={activeLesson.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full max-h-64 object-cover rounded-2xl"
                  />
                )}

                {activeLesson.sections && activeLesson.sections.definition ? (
                  <GoldenLesson sections={activeLesson.sections} exercises={activeLesson.exercises} />
                ) : (
                  <CollapsibleTheoryMarkdown
                    content={
                      activeLesson.source === 'ai-golden' || activeLesson.source === '25-chuyen-de-v2' || activeLesson.source === '25-buoi-master'
                        ? (activeLesson.theory_vi || activeLesson.theory || '*Chưa có nội dung lý thuyết.*')
                        : formatOcrTheory(activeLesson.theory_vi || activeLesson.theory || '*Chưa có nội dung lý thuyết.*')
                    }
                    onTriggerPractice={triggerSectionPractice}
                  />
                )}
              </div>
            )}

            {/* Tab 2: Bảng tra cứu */}
            {activeTab === 'cheatsheet' && (
              <div className="animate-in fade-in duration-200">
                <GrammarCheatSheet
                  cheatSheetHtml={activeLesson.sections?.cheatSheetHtml}
                  lessonTitle={activeLesson.title}
                />
              </div>
            )}

            {/* Tab 3: Video bài giảng */}
            {activeTab === 'video' && (
              <div className="animate-in fade-in duration-200">
                <GrammarVideoPlayer
                  videoUrl={activeLesson.sections?.videoUrl || activeLesson.source_url || ''}
                  title={activeLesson.title}
                  topicTitle={activeLesson.topic?.title_vi || activeLesson.topic?.title}
                />
              </div>
            )}

            {/* Tab 4: Bài tập thực chiến */}
            {activeTab === 'exercises' && (
              <div className="animate-in fade-in duration-200 py-4 sm:py-6">
                <InlineLessonQuizPanel
                  exercises={activeLesson.exercises || []}
                  panelTitle={`Luyện tập: ${activeLesson.title}`}
                />
              </div>
            )}

            {/* Action Bar */}
            <div className="space-y-3 pt-4 border-t border-border/40">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setQuizSectionIndex(null);
                    setQuizModalOpen(true);
                  }}
                  className="flex-1 bg-primary text-primary-foreground font-semibold py-3 px-5 rounded-xl hover:bg-primary/90 shadow-xs transition-colors flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer"
                >
                  <Dumbbell className="h-4 w-4" /> Bắt đầu làm bài tập
                </button>
                <button
                  onClick={markAsLearned}
                  disabled={marking}
                  className="font-medium py-3 px-5 rounded-xl bg-muted/50 hover:bg-muted text-foreground transition-colors flex items-center justify-center gap-2 text-sm sm:text-base disabled:opacity-50 cursor-pointer"
                >
                  {marking ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
                  <span>{status === 'new' ? 'Đã đọc xong' : 'Ôn lại xong'}</span>
                </button>
              </div>
            </div>
          </article>

          {/* Split Screen Panel on Desktop */}
          {splitView && (
            <div className="sticky top-20 hidden lg:block h-[calc(100vh-6rem)] min-w-0">
              <InlineLessonQuizPanel
                exercises={activeLesson.exercises || []}
                isSplitView={true}
              />
            </div>
          )}
        </div>

        {/* Pop-up Quiz Modal */}
        {quizModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-4xl max-h-[94vh] h-[760px] animate-in zoom-in-95 duration-200">
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
          pct > 50    ? 'bg-primary' :
          pct > 0     ? 'bg-amber-500' :
                        'bg-muted';
        return (
          <button
            key={tp.topicId}
            onClick={() => scrollToTopic(tp.topicId)}
            className="w-full text-left rounded-lg px-3 py-2 hover:bg-muted/60 transition-colors group"
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-xs font-medium text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                {tp.titleVi || tp.title}
              </span>
              {isDue && (
                <span className="shrink-0 text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-500/15 border border-amber-500/30 rounded-full px-1.5 py-0.5">
                  Due
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${barColor}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="shrink-0 text-[10px] text-muted-foreground tabular-nums font-mono">
                {learned}/{tp.totalLessons}
              </span>
            </div>
          </button>
        );
      })}
    </nav>
  );

  return (
    <main className="min-h-dvh bg-background font-sans">
      <header className="static sm:sticky sm:top-header-safe z-30 flex h-14 items-center justify-between border-b border-border/40 bg-background/80 px-4 backdrop-blur sm:px-6">
        <Link
          href="/student"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> Dashboard
        </Link>
        <h1 className="flex items-center gap-2 font-semibold text-foreground text-base">
          <GraduationCap className="h-5 w-5 text-primary" /> Bài giảng Ngữ pháp
        </h1>
        <div className="flex items-center gap-2">
          {/* Quick link: ôn câu sai */}
          <Link
            href="/grammar?review=1"
            className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg px-3 py-1.5 transition-colors"
            title="Ôn các câu bạn từng làm sai trong 14 ngày qua"
          >
            <History className="h-3.5 w-3.5" /> Ôn câu sai
          </Link>
          {/* Mobile/Tablet: nút mở sidebar */}
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="lg:hidden flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Tiến độ chủ đề"
          >
            Tiến độ {sidebarOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </header>

      <div className="flex gap-6 max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* ─── Desktop Sidebar (Hidden on Tablet <1024px to prevent dual-sidebar collision) ─── */}
        <aside className="hidden lg:block w-60 shrink-0">
          <div className="sticky top-20 p-2 space-y-3">
            <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground/80 mb-2">
              Tiến độ chủ đề
            </h2>
            <ProgressSidebar />
          </div>
        </aside>

        {/* ─── Main content ─── */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Mobile & Tablet collapsible sidebar */}
          {sidebarOpen && (
            <div className="lg:hidden bg-muted/20 rounded-xl p-4 mb-4">
              <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground/80 mb-3">
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
                  <div className="flex items-center gap-3">
                    <span className="h-8 w-8 rounded-lg bg-muted border border-border text-foreground flex items-center justify-center text-xs font-bold tabular-nums shrink-0">
                      0{stg.id}
                    </span>
                    <div>
                      <h2 className="font-semibold text-foreground text-sm sm:text-base leading-tight">{stg.name}</h2>
                      <p className="text-xs text-muted-foreground font-normal">
                        {stg.sub} · {stgTopics.length} chủ đề
                      </p>
                    </div>
                  </div>
                  {userId && stgProg.total > 0 && (
                    <span className="text-xs font-medium text-muted-foreground tabular-nums bg-muted px-2.5 py-1 rounded-md border border-border">
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
                      className={`rounded-xl overflow-hidden transition-all duration-200 ${
                        isOpen ? 'bg-muted/30 ring-1 ring-primary/20' : 'bg-muted/15 hover:bg-muted/25'
                      }`}
                    >
                      <button
                        onClick={() => toggleTopic(topic.id)}
                        className="w-full flex items-center gap-3.5 px-4 sm:px-5 py-3.5 transition-colors text-left"
                      >
                        <span className={`shrink-0 px-2.5 py-1 rounded-lg font-mono text-[11px] font-semibold border-0 transition-all ${stg.badgeStyle}`}>
                          {parsed.badge}
                        </span>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground text-sm sm:text-base leading-snug line-clamp-1">
                              {parsed.displayTitle}
                            </span>
                            {isDue && (
                              <span className="shrink-0 text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-500/15 border-0 rounded-full px-2 py-0.5">
                                Cần ôn
                              </span>
                            )}
                            {pct === 100 && (
                              <span className="shrink-0 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/15 border-0 rounded-full px-2 py-0.5 flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" /> Hoàn thành
                              </span>
                            )}
                          </div>

                          {userId && tp && tp.totalLessons > 0 && (
                            <div className="flex items-center gap-2.5 mt-1.5">
                              <div className="flex-1 max-w-[200px] h-1.5 rounded-full bg-muted overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? 'bg-emerald-500' : 'bg-primary'}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-muted-foreground font-medium tabular-nums font-mono">
                                {learnedCount}/{tp.totalLessons} bài
                              </span>
                            </div>
                          )}
                        </div>

                        <ChevronDown
                          className={`shrink-0 h-4 w-4 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : ''}`}
                        />
                      </button>

                      {isOpen && (
                        <div className="border-t border-border/30 divide-y divide-border/30">
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
                                className="w-full flex items-center gap-3 px-4 sm:px-5 py-3 hover:bg-muted/40 transition-colors text-left"
                              >
                                <span
                                  className={`shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold border transition-colors ${
                                    status === 'learned'
                                      ? 'bg-emerald-500 border-emerald-500 text-white'
                                      : status === 'due'
                                        ? 'bg-amber-500 border-amber-500 text-white'
                                        : 'bg-background border-border text-muted-foreground'
                                  }`}
                                >
                                  {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : idx + 1}
                                </span>
                                <span className="flex-1 min-w-0 text-sm font-medium text-foreground truncate">{lesson.title}</span>
                                {status === 'due' && (
                                  <span className="shrink-0 text-xs text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" /> Cần ôn
                                  </span>
                                )}
                                {status === 'new' && (
                                  <span className="shrink-0 text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Mới</span>
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
    <StudentShell title="Grammar" contentClassName="p-0" requireAuth={false}>
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
