'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Volume2, Snail, Sparkles, Loader2 } from 'lucide-react';
import { playWordAudio, stopWordAudio } from '@/lib/audio';
import { ExamInteractiveText } from '@/components/exam/ExamInteractiveText';
import {
  extractVietnameseSentenceTranslation,
  stripEmbeddedVietnamese,
} from '@/lib/review-modes';

export interface ExampleWithSubProps {
  example: string;
  exampleVi?: string | null;
  /** Học mới: true (sub luôn). Ôn: false (nút Dịch). */
  defaultShowVi?: boolean;
  /** Cho phép chạm vào từng từ để tra từ điển & nghe phát âm (mặc định: true) */
  interactiveWords?: boolean;
  /** Hiển thị nút loa phát âm cả câu ví dụ (mặc định: true) */
  showAudio?: boolean;
  /** Hiển thị nút nghe chậm 0.7x (mặc định: false) */
  showSlowAudio?: boolean;
  /** Tự động gọi AI dịch nếu chưa có bản dịch (mặc định: false) */
  autoTranslateIfMissing?: boolean;
  className?: string;
  enClassName?: string;
  viClassName?: string;
  audioBtnClassName?: string;
  wordClassName?: string;
}

// Session cache cho các câu đã dịch on-demand tránh gọi lặp lại API
const translationCache = new Map<string, string>();

/**
 * Component hiển thị câu ví dụ tiếng Anh + phụ đề tiếng Việt thông minh:
 * - Chạm từng từ trong câu để xem nghĩa, IPA và phát âm từ đơn (Interactive Words).
 * - Nút loa phát âm cả câu ví dụ chuẩn bản ngữ (Audio Speech).
 * - Tự động trích xuất phụ đề tiếng Việt nếu câu chứa sẵn bản dịch, hoặc dịch on-demand bằng AI.
 * - Toggle hiện/ẩn phụ đề linh hoạt theo chế độ Học mới hoặc Ôn tập.
 */
export function ExampleWithSub({
  example,
  exampleVi,
  defaultShowVi = true,
  interactiveWords = true,
  showAudio = true,
  showSlowAudio = false,
  autoTranslateIfMissing = false,
  className = '',
  enClassName = 'text-xs font-medium italic leading-snug sm:text-sm text-slate-700 dark:text-slate-300',
  viClassName = 'mt-1 text-[11px] font-medium leading-snug text-slate-500 sm:text-xs not-italic dark:text-slate-400',
  audioBtnClassName = '',
  wordClassName = '',
}: ExampleWithSubProps) {
  const rawEx = (example || '').trim();

  // Tách câu EN sạch và phát hiện sub VI có sẵn trong chuỗi
  const embeddedVi = extractVietnameseSentenceTranslation(rawEx);
  const cleanEn = stripEmbeddedVietnamese(rawEx)
    .replace(/^["“'”]+|["“'”]+$/g, '')
    .trim();

  const initialVi = (exampleVi || '').trim() || embeddedVi || '';

  const [translatedVi, setTranslatedVi] = useState<string | null>(() => {
    if (!cleanEn) return null;
    return translationCache.get(cleanEn.toLowerCase()) || null;
  });
  const [isTranslating, setIsTranslating] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isPlayingSlow, setIsPlayingSlow] = useState(false);

  const effectiveVi = initialVi || translatedVi || '';
  const [showVi, setShowVi] = useState(defaultShowVi && Boolean(effectiveVi));

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Đồng bộ lại state khi cleanEn hoặc exampleVi thay đổi
  useEffect(() => {
    const key = cleanEn.toLowerCase();
    const cached = key ? translationCache.get(key) || null : null;
    setTranslatedVi(cached);
    setIsTranslating(false);
  }, [cleanEn, exampleVi]);

  // Cập nhật lại trạng thái showVi khi example hoặc initialVi thay đổi
  useEffect(() => {
    if (effectiveVi) {
      setShowVi(defaultShowVi);
    }
  }, [example, defaultShowVi, effectiveVi]);

  // Tự động dịch nếu được bật cấu hình và chưa có bản dịch
  const handleTranslate = useCallback(async () => {
    if (!cleanEn || isTranslating) return;

    const cacheKey = cleanEn.toLowerCase();
    const cached = translationCache.get(cacheKey);
    if (cached) {
      setTranslatedVi(cached);
      setShowVi(true);
      return;
    }

    setIsTranslating(true);
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: cleanEn,
          sourceLang: 'en',
          targetLang: 'vi',
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (data?.success && typeof data?.translatedText === 'string') {
        const text = data.translatedText.trim();
        translationCache.set(cacheKey, text);
        if (isMountedRef.current) {
          setTranslatedVi(text);
          setShowVi(true);
        }
      }
    } catch {
      // Bỏ qua lỗi mạng
    } finally {
      if (isMountedRef.current) {
        setIsTranslating(false);
      }
    }
  }, [cleanEn, isTranslating]);

  useEffect(() => {
    if (autoTranslateIfMissing && defaultShowVi && !effectiveVi && cleanEn && !isTranslating) {
      void handleTranslate();
    }
  }, [autoTranslateIfMissing, defaultShowVi, effectiveVi, cleanEn, isTranslating, handleTranslate]);

  if (!cleanEn) return null;

  // Xử lý phát âm câu
  const handlePlaySentence = async (e: React.MouseEvent, rate = 1.0) => {
    e.stopPropagation();

    if (isPlayingAudio || isPlayingSlow) {
      stopWordAudio();
      setIsPlayingAudio(false);
      setIsPlayingSlow(false);
      return;
    }

    if (rate < 1.0) {
      setIsPlayingSlow(true);
    } else {
      setIsPlayingAudio(true);
    }

    try {
      await playWordAudio(cleanEn, undefined, rate);
    } catch {
      // Bỏ qua lỗi audio
    } finally {
      if (isMountedRef.current) {
        setIsPlayingAudio(false);
        setIsPlayingSlow(false);
      }
    }
  };

  return (
    <div
      className={`group/example relative select-text ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-start gap-1.5 sm:gap-2">
        {/* Nút phát âm âm thanh cả câu ví dụ */}
        {showAudio && (
          <div className="mt-0.5 flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              onClick={(e) => handlePlaySentence(e, 1.0)}
              className={`inline-flex h-6 w-6 items-center justify-center rounded-md border border-slate-200/90 bg-white/90 text-slate-500 shadow-2xs transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 active:scale-95 dark:border-slate-700/80 dark:bg-slate-800/90 dark:text-slate-400 dark:hover:text-indigo-300 ${
                isPlayingAudio
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-600 dark:border-indigo-500 dark:bg-indigo-950/60 dark:text-indigo-300 animate-pulse'
                  : ''
              } ${audioBtnClassName}`}
              title={isPlayingAudio ? 'Dừng phát âm' : 'Nghe cả câu ví dụ (1.0x)'}
              aria-label="Phát âm câu ví dụ"
            >
              <Volume2 className="h-3.5 w-3.5" />
            </button>

            {showSlowAudio && (
              <button
                type="button"
                onClick={(e) => handlePlaySentence(e, 0.7)}
                className={`inline-flex h-6 w-6 items-center justify-center rounded-md border border-slate-200/90 bg-white/90 text-slate-400 shadow-2xs transition-all hover:border-amber-300 hover:bg-amber-50 hover:text-amber-600 active:scale-95 dark:border-slate-700/80 dark:bg-slate-800/90 dark:text-slate-400 dark:hover:text-amber-300 ${
                  isPlayingSlow
                    ? 'border-amber-500 bg-amber-50 text-amber-600 dark:border-amber-500 dark:bg-amber-950/60 dark:text-amber-300 animate-pulse'
                    : ''
                }`}
                title={isPlayingSlow ? 'Dừng đọc chậm' : 'Nghe đọc chậm (0.7x)'}
                aria-label="Đọc chậm câu ví dụ"
              >
                <Snail className="h-3 w-3" />
              </button>
            )}
          </div>
        )}

        <div className="min-w-0 flex-1">
          {/* Câu tiếng Anh có hỗ trợ chạm từ tra nghĩa */}
          <p className={enClassName}>
            <span className="opacity-60 select-none">&ldquo;</span>
            <ExamInteractiveText
              text={cleanEn}
              enabled={interactiveWords}
              as="span"
              wordClassName={wordClassName}
            />
            <span className="opacity-60 select-none">&rdquo;</span>
          </p>

          {/* Phụ đề Tiếng Việt */}
          {effectiveVi && showVi ? (
            <p className={viClassName}>
              {effectiveVi}
            </p>
          ) : isTranslating && defaultShowVi ? (
            <div className="mt-1 flex items-center gap-1.5 opacity-60">
              <span className="inline-block h-2 w-2 animate-ping rounded-full bg-indigo-500" />
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 italic">Đang tải bản dịch...</span>
            </div>
          ) : null}

          {/* Điều khiển Sub: Dịch, Ẩn dịch, Dịch AI */}
          <div className="mt-0.5 flex items-center gap-2">
            {effectiveVi ? (
              !defaultShowVi && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowVi((s) => !s);
                  }}
                  className="text-[10px] font-bold uppercase tracking-wider text-indigo-500/90 hover:text-indigo-600 hover:underline dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  {showVi ? 'Ẩn dịch' : 'Dịch'}
                </button>
              )
            ) : !autoTranslateIfMissing ? (
              <button
                type="button"
                disabled={isTranslating}
                onClick={(e) => {
                  e.stopPropagation();
                  void handleTranslate();
                }}
                className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-indigo-500/90 hover:text-indigo-600 hover:underline disabled:opacity-50 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                {isTranslating ? (
                  <>
                    <Loader2 className="h-2.5 w-2.5 animate-spin" />
                    <span>Đang dịch...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-2.5 w-2.5 text-amber-500" />
                    <span>Dịch câu</span>
                  </>
                )}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
