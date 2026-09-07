'use client';

import React, { useState, useMemo, useRef } from 'react';
import { Volume2, CheckCircle2, XCircle, Lightbulb, RotateCcw, ArrowRight, MessageSquare, AlertCircle } from 'lucide-react';
import { playWordAudio } from '@/lib/audio';

export interface DialogueBlank {
  id: string;
  answer: string;
  options: string[];
}

export interface DialogueLine {
  speaker: string;
  text: string;
  blanks?: DialogueBlank[];
}

export interface DialogueClozeWidgetProps {
  dialogue: DialogueLine[];
  onComplete: (stats: { score: number; passed: boolean }) => void;
}

// Clean answers for robust matching (ignore punctuation, whitespace, casing)
function normalizeAnswer(text: string): string {
  return text.replace(/[?!.,;:"'()]/g, '').trim().toLowerCase();
}

export const DialogueClozeWidget: React.FC<DialogueClozeWidgetProps> = ({ dialogue, onComplete }) => {
  // Collect all blanks across all lines
  const allBlanks = useMemo(() => {
    const list: DialogueBlank[] = [];
    for (const line of dialogue) {
      if (line.blanks && Array.isArray(line.blanks)) {
        list.push(...line.blanks);
      }
    }
    return list;
  }, [dialogue]);

  // Aggregate word bank options, deduplicating them
  const wordBank = useMemo(() => {
    const optionsSet = new Set<string>();
    for (const b of allBlanks) {
      if (b.options && Array.isArray(b.options)) {
        b.options.forEach((opt) => optionsSet.add(opt.trim()));
      }
      if (b.answer) {
        optionsSet.add(b.answer.trim());
      }
    }
    return Array.from(optionsSet);
  }, [allBlanks]);

  // State
  const [filledBlanks, setFilledBlanks] = useState<Record<string, string>>({});
  const [activeBlankId, setActiveBlankId] = useState<string | null>(allBlanks[0]?.id || null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [validationResults, setValidationResults] = useState<Record<string, boolean>>({});
  const [showIncompleteWarning, setShowIncompleteWarning] = useState(false);
  const [hintLevels, setHintLevels] = useState<Record<string, number>>({});
  const [score, setScore] = useState<number | null>(null);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Handle case where dialogue has 0 blanks (read-only dialogue mode)
  if (allBlanks.length === 0) {
    return (
      <div className="w-full max-w-3xl mx-auto p-4 sm:p-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base sm:text-lg">
            Hội thoại thực tế
          </h3>
        </div>
        <div className="space-y-3 mb-6">
          {dialogue.map((line, idx) => (
            <div key={idx} className="p-3.5 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl flex items-start gap-3">
              <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm shrink-0 min-w-[70px]">
                {line.speaker}:
              </span>
              <p className="text-zinc-800 dark:text-zinc-200 text-sm sm:text-base flex-1">
                {line.text}
              </p>
              <button
                type="button"
                onClick={() => playWordAudio(line.text)}
                className="p-1.5 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg"
                title="Nghe câu này"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onCompleteRef.current({ score: 100, passed: true })}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
        >
          <span>Đã hiểu hội thoại</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Tapping a word chip from the bank
  const handleSelectWord = (word: string) => {
    if (isSubmitted) return;
    setShowIncompleteWarning(false);

    // Determine target blank: active blank, or first unfilled blank
    let targetId = activeBlankId;
    if (!targetId || filledBlanks[targetId]) {
      const firstUnfilled = allBlanks.find((b) => !filledBlanks[b.id]);
      if (firstUnfilled) {
        targetId = firstUnfilled.id;
      } else {
        targetId = allBlanks[0].id;
      }
    }

    setFilledBlanks((prev) => ({
      ...prev,
      [targetId!]: word,
    }));

    // Auto-advance active blank to next unfilled blank
    const nextUnfilled = allBlanks.find((b) => b.id !== targetId && !filledBlanks[b.id]);
    setActiveBlankId(nextUnfilled ? nextUnfilled.id : null);
  };

  // Clicking a blank slot in dialogue
  const handleBlankClick = (blankId: string) => {
    if (isSubmitted) return;
    setShowIncompleteWarning(false);

    // If already filled, click to return word back to bank
    if (filledBlanks[blankId]) {
      setFilledBlanks((prev) => {
        const next = { ...prev };
        delete next[blankId];
        return next;
      });
      setActiveBlankId(blankId);
    } else {
      setActiveBlankId(blankId);
    }
  };

  // Provide progressive hints for active or first unfinished blank
  const handleRequestHint = (blankId: string) => {
    const current = hintLevels[blankId] || 0;
    setHintLevels((prev) => ({
      ...prev,
      [blankId]: Math.min(2, current + 1),
    }));
  };

  // Reset dialogue
  const handleReset = () => {
    setFilledBlanks({});
    setActiveBlankId(allBlanks[0]?.id || null);
    setIsSubmitted(false);
    setValidationResults({});
    setShowIncompleteWarning(false);
    setHintLevels({});
    setScore(null);
  };

  // Check answers
  const handleSubmit = () => {
    // Check if all blanks are filled
    const filledCount = Object.keys(filledBlanks).length;
    if (filledCount < allBlanks.length) {
      setShowIncompleteWarning(true);
      return;
    }

    const results: Record<string, boolean> = {};
    let correctCount = 0;

    for (const blank of allBlanks) {
      const userWord = filledBlanks[blank.id] || '';
      const isCorrect = normalizeAnswer(userWord) === normalizeAnswer(blank.answer);
      results[blank.id] = isCorrect;
      if (isCorrect) correctCount++;
    }

    const finalScore = Math.round((correctCount / allBlanks.length) * 100);
    const passed = finalScore >= 75;

    setValidationResults(results);
    setScore(finalScore);
    setIsSubmitted(true);
    setShowIncompleteWarning(false);

    onCompleteRef.current({ score: finalScore, passed });
  };

  // Render dialogue line text with embedded blanks
  const renderLineContent = (line: DialogueLine, lineIdx: number) => {
    if (!line.blanks || line.blanks.length === 0) {
      return <span>{line.text}</span>;
    }

    // Replace ___ or [id] placeholders with interactive blanks
    const parts = line.text.split(/(___|\[\w+\])/g);
    let blankIndex = 0;

    return (
      <span>
        {parts.map((part, pIdx) => {
          if (part === '___' || /^\[\w+\]$/.test(part)) {
            const blank = line.blanks![blankIndex++];
            if (!blank) return <span key={pIdx}>___</span>;

            const filledWord = filledBlanks[blank.id];
            const isActive = activeBlankId === blank.id;
            const isCorrect = validationResults[blank.id];
            const hintLevel = hintLevels[blank.id] || 0;

            return (
              <span key={blank.id} className="inline-block mx-1.5 align-middle my-0.5">
                <button
                  type="button"
                  onClick={() => handleBlankClick(blank.id)}
                  disabled={isSubmitted}
                  className={`inline-flex items-center justify-center min-w-[90px] h-8 sm:h-9 px-2.5 rounded-lg border text-sm font-semibold transition-all select-none ${
                    isSubmitted
                      ? isCorrect
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-300'
                        : 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-800 dark:text-rose-300'
                      : filledWord
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-800 dark:text-indigo-200'
                      : isActive
                      ? 'bg-amber-50 dark:bg-amber-950/30 border-dashed border-amber-500 ring-2 ring-amber-300/60 dark:ring-amber-800 text-amber-900 dark:text-amber-200'
                      : 'bg-zinc-100 dark:bg-zinc-800/80 border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500 hover:border-zinc-400'
                  }`}
                >
                  {filledWord ? (
                    <span className="flex items-center gap-1.5">
                      {filledWord}
                      {isSubmitted && (
                        isCorrect ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                        )
                      )}
                    </span>
                  ) : (
                    <span className="text-xs font-normal italic text-zinc-400">
                      [ Chỗ trống ]
                    </span>
                  )}
                </button>

                {/* Show correct answer inline if wrong after submit */}
                {isSubmitted && isCorrect === false && (
                  <span className="ml-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded">
                    ({blank.answer})
                  </span>
                )}

                {/* Progressive hint display */}
                {!isSubmitted && hintLevel > 0 && (
                  <span className="ml-1 text-[11px] text-amber-600 dark:text-amber-400 italic">
                    {hintLevel === 1 && `(Gợi ý: ${blank.answer.length} chữ)`}
                    {hintLevel === 2 && `(Bắt đầu bằng '${blank.answer[0]}...')`}
                  </span>
                )}
              </span>
            );
          }
          return <span key={pIdx}>{part}</span>;
        })}
      </span>
    );
  };

  const totalFilled = Object.keys(filledBlanks).length;

  return (
    <div className="w-full max-w-3xl mx-auto p-4 sm:p-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 transition-all">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <MessageSquare className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base sm:text-lg">
              Điền từ vào hội thoại
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Chạm vào chỗ trống, sau đó chọn từ thích hợp từ ngân hàng từ bên dưới.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            title="Làm lại"
            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Incomplete warning toast */}
      {showIncompleteWarning && (
        <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs sm:text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>Vui lòng điền đủ tất cả các chỗ trống ({totalFilled}/{allBlanks.length}) trước khi kiểm tra!</span>
        </div>
      )}

      {/* Result announcement */}
      {isSubmitted && score !== null && (
        <div
          className={`mb-6 p-4 rounded-xl border flex items-center justify-between ${
            score >= 75
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {score >= 75 ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0" />
            )}
            <div>
              <div className="font-bold text-sm sm:text-base">
                {score >= 75 ? 'Xuất sắc! Bạn đã hiểu đúng hội thoại' : 'Cần cố gắng thêm một chút!'}
              </div>
              <div className="text-xs opacity-90">
                Độ chính xác: {score}% ({Object.values(validationResults).filter(Boolean).length}/{allBlanks.length} chỗ đúng)
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white dark:bg-zinc-700 dark:hover:bg-zinc-600 text-xs font-semibold rounded-lg shadow-sm transition"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Dialogue Conversation Container */}
      <div className="space-y-4 mb-6">
        {dialogue.map((line, idx) => {
          const isEven = idx % 2 === 0;
          return (
            <div
              key={idx}
              className={`p-4 rounded-2xl border transition-all ${
                isEven
                  ? 'bg-zinc-50/80 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700/70'
                  : 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                      isEven ? 'bg-indigo-600' : 'bg-emerald-600'
                    }`}
                  >
                    {line.speaker.charAt(0)}
                  </span>
                  <span className="font-semibold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100">
                    {line.speaker}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => playWordAudio(line.text.replace(/___|\[\w+\]/g, ''))}
                  className="p-1 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md transition-colors"
                  title="Nghe câu"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              <div className="text-sm sm:text-base text-zinc-800 dark:text-zinc-200 leading-relaxed">
                {renderLineContent(line, idx)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Word Bank & Action Section */}
      <div className="p-4 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700/80">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Ngân hàng từ vựng (Word Bank)
          </span>

          {activeBlankId && !isSubmitted && (
            <button
              type="button"
              onClick={() => handleRequestHint(activeBlankId)}
              className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 hover:underline"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Gợi ý cho ô đang chọn</span>
            </button>
          )}
        </div>

        {/* Word Chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          {wordBank.map((word, idx) => {
            const isUsed = Object.values(filledBlanks).includes(word);
            return (
              <button
                key={idx}
                type="button"
                disabled={isSubmitted || isUsed}
                onClick={() => handleSelectWord(word)}
                className={`min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-medium border transition-all ${
                  isUsed
                    ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-600 opacity-40 cursor-not-allowed'
                    : 'bg-white dark:bg-zinc-700 border-zinc-300 dark:border-zinc-600 text-zinc-800 dark:text-zinc-100 shadow-sm hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow active:scale-95'
                }`}
              >
                {word}
              </button>
            );
          })}
        </div>

        {/* Submit or Next Button */}
        {!isSubmitted ? (
          <button
            type="button"
            onClick={handleSubmit}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-sm transition flex items-center justify-center gap-2"
          >
            <span>Kiểm tra đáp án</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="text-center text-xs text-zinc-500 dark:text-zinc-400 pt-1">
            Đã nộp kết quả. Bạn có thể bấm Thử lại để luyện tập thêm!
          </div>
        )}
      </div>
    </div>
  );
};

export default DialogueClozeWidget;
