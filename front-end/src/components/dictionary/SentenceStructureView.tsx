'use client';

import { useState, useMemo } from 'react';
import {
  Volume2,
  BookmarkPlus,
  Check,
  Sparkles,
  Layers,
  HelpCircle,
  GitFork,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { speak } from '@/lib/study';
import { authFetch } from '@/lib/auth-fetch';
import { cn } from '@/lib/utils';
import {
  SentenceAnalysisData,
  SentenceSpan,
  SentenceChunk,
  SecondaryClause,
  SpanRole,
} from '@/types/sentence-analysis';

interface SentenceStructureViewProps {
  data: SentenceAnalysisData;
  onLookupWord?: (word: string) => void;
  className?: string;
}

export function SentenceStructureView({
  data,
  onLookupWord,
  className,
}: SentenceStructureViewProps) {
  const [activeRole, setActiveRole] = useState<string | null>(null);
  const [savedChunks, setSavedChunks] = useState<Set<string>>(new Set());
  const [savingChunk, setSavingChunk] = useState<string | null>(null);

  const mainClause = data.main_clause || (data.kernel ? {
    subject: { text: data.kernel.s, head: data.kernel.s },
    verb: { text: data.kernel.v, head: data.kernel.v },
    object: data.kernel.o ? { text: data.kernel.o, head: data.kernel.o } : undefined,
    translation_vi: data.kernel.translation_vi,
  } : undefined);

  const secondaryClauses = data.secondary_clauses || [];
  const spans = data.spans || [];
  const chunks = data.chunks || [];
  const buildLevels = data.build_levels || [];

  const handleSpeak = (text: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!text.trim()) return;
    speak(text, 1.0, 'en-US');
  };

  const handleLookup = (word?: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!word?.trim()) return;
    const clean = word.trim();
    if (onLookupWord) {
      onLookupWord(clean);
    } else if (typeof window !== 'undefined') {
      window.location.href = `/dictionary?q=${encodeURIComponent(clean)}`;
    }
  };

  const handleSaveWord = async (chunk: SentenceChunk, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const word = chunk.base || chunk.text;
    const translation = chunk.meaning_vi;
    if (!word || !translation || translation === '—') return;

    setSavingChunk(word);
    try {
      const res = await authFetch('/api/words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word, translation }),
      });
      const json = await res.json();
      if (res.ok && (json.success || json.alreadyExists)) {
        setSavedChunks((prev) => new Set(prev).add(word));
        toast.success(`Đã lưu "${word}" vào sổ từ vựng`);
      } else {
        toast.error(json.error || 'Không thể lưu từ');
      }
    } catch {
      toast.error('Lỗi kết nối khi lưu từ');
    } finally {
      setSavingChunk(null);
    }
  };

  // Helper styles for roles
  const getRoleBadge = (role: SpanRole) => {
    switch (role) {
      case 'S':
        return { label: 'S', name: 'Chủ ngữ', color: 'bg-emerald-500 text-white' };
      case 'V':
        return { label: 'V', name: 'Vị ngữ', color: 'bg-sky-500 text-white' };
      case 'O':
        return { label: 'O', name: 'Tân ngữ', color: 'bg-amber-500 text-white' };
      case 'clause':
        return { label: 'Clause', name: 'Mệnh đề phụ', color: 'bg-purple-500 text-white' };
      case 'pp':
        return { label: 'PP', name: 'Cụm giới từ', color: 'bg-teal-500 text-white' };
      case 'adverb':
        return { label: 'Adv', name: 'Trạng từ', color: 'bg-slate-500 text-white' };
      case 'linker':
        return { label: 'Link', name: 'Liên từ', color: 'bg-indigo-500 text-white' };
      default:
        return null;
    }
  };

  const getSpanStyles = (role: SpanRole, isHighlighted: boolean) => {
    switch (role) {
      case 'S':
        return cn(
          'bg-emerald-100/70 text-emerald-950 dark:bg-emerald-950/60 dark:text-emerald-100 border border-emerald-300 dark:border-emerald-700/80 shadow-xs',
          isHighlighted && 'ring-2 ring-emerald-500 ring-offset-1 dark:ring-offset-slate-900 bg-emerald-200/80 dark:bg-emerald-900/80',
        );
      case 'V':
        return cn(
          'bg-sky-100/70 text-sky-950 dark:bg-sky-950/60 dark:text-sky-100 border border-sky-300 dark:border-sky-700/80 shadow-xs',
          isHighlighted && 'ring-2 ring-sky-500 ring-offset-1 dark:ring-offset-slate-900 bg-sky-200/80 dark:bg-sky-900/80',
        );
      case 'O':
        return cn(
          'bg-amber-100/70 text-amber-950 dark:bg-amber-950/60 dark:text-amber-100 border border-amber-300 dark:border-amber-700/80 shadow-xs',
          isHighlighted && 'ring-2 ring-amber-500 ring-offset-1 dark:ring-offset-slate-900 bg-amber-200/80 dark:bg-amber-900/80',
        );
      case 'clause':
        return cn(
          'bg-purple-100/70 text-purple-950 dark:bg-purple-950/60 dark:text-purple-100 border border-purple-300 dark:border-purple-700/80 shadow-xs',
          isHighlighted && 'ring-2 ring-purple-500 ring-offset-1 dark:ring-offset-slate-900 bg-purple-200/80 dark:bg-purple-900/80',
        );
      case 'pp':
        return cn(
          'bg-teal-100/60 text-teal-950 dark:bg-teal-950/50 dark:text-teal-100 border border-teal-200 dark:border-teal-800',
          isHighlighted && 'ring-2 ring-teal-500 ring-offset-1 bg-teal-200/80',
        );
      case 'adverb':
        return cn(
          'bg-slate-100 text-slate-800 dark:bg-slate-800/60 dark:text-slate-200 border border-slate-300 dark:border-slate-700',
          isHighlighted && 'ring-2 ring-slate-400 ring-offset-1',
        );
      case 'linker':
        return cn(
          'bg-indigo-50 text-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800',
          isHighlighted && 'ring-2 ring-indigo-400 ring-offset-1',
        );
      default:
        return 'text-foreground/90';
    }
  };

  return (
    <div className={cn('w-full space-y-5 select-text', className)}>
      {/* 1. Header & Structure Pattern */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Bóc tách cấu trúc câu đa tầng</span>
          </span>
          {data.structure && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border/50">
              {data.structure}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => handleSpeak(data.sentence)}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground p-1 px-2.5 rounded-lg border border-border/60 hover:bg-muted transition-colors"
          title="Nghe toàn bộ câu"
        >
          <Volume2 className="h-3.5 w-3.5 text-primary" />
          <span>Phát âm câu</span>
        </button>
      </div>

      {/* 2. Original Sentence with Visual Highlights */}
      <div className="p-4 rounded-2xl border border-border/80 bg-card shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
          <span className="uppercase tracking-wider text-[11px] font-bold text-muted-foreground">
            Câu gốc (Tô màu ngữ pháp trực quan)
          </span>
          <span className="text-[11px] opacity-70">
            💡 Di chuột hoặc bấm vào thành phần để xem chi tiết
          </span>
        </div>

        {/* Highlighted text spans */}
        <div className="text-base sm:text-lg leading-relaxed text-foreground font-normal tracking-wide p-2 rounded-xl bg-muted/20 border border-border/30">
          {spans.length > 0 ? (
            spans.map((span, idx) => {
              const badge = getRoleBadge(span.role);
              const isHighlighted = activeRole === span.role;
              const isOther = span.role === 'other';

              if (isOther) {
                return (
                  <span key={idx} className="whitespace-pre-wrap text-foreground/80">
                    {span.text}
                  </span>
                );
              }

              return (
                <span
                  key={idx}
                  onMouseEnter={() => setActiveRole(span.role)}
                  onMouseLeave={() => setActiveRole(null)}
                  onClick={() => setActiveRole(activeRole === span.role ? null : span.role)}
                  className={cn(
                    'inline-flex items-baseline gap-1 mx-0.5 px-2 py-0.5 rounded-lg transition-all cursor-pointer select-text',
                    getSpanStyles(span.role, isHighlighted),
                  )}
                  title={`${span.label_vi || span.role}: ${span.text}`}
                >
                  <span className="font-medium leading-normal">{span.text}</span>
                  {badge && (
                    <span
                      className={cn(
                        'text-[9px] font-black px-1.5 py-0.5 rounded-md leading-none select-none shrink-0 tracking-wider',
                        badge.color,
                      )}
                    >
                      {badge.label}
                    </span>
                  )}
                </span>
              );
            })
          ) : (
            <p>{data.sentence}</p>
          )}
        </div>

        {/* Vietnamese Translation of full sentence */}
        {data.translation_vi && (
          <div className="pt-2 border-t border-border/50">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-1">
              Dịch nghĩa tự nhiên
            </p>
            <p className="text-sm sm:text-base font-medium text-foreground leading-relaxed">
              {data.translation_vi}
            </p>
          </div>
        )}
      </div>

      {/* 3. Hierarchical Clauses Breakdown */}
      <div className="grid grid-cols-1 gap-3">
        {/* Main Clause Card */}
        {mainClause && (
          <div
            onMouseEnter={() => setActiveRole('S')}
            onMouseLeave={() => setActiveRole(null)}
            className={cn(
              'p-4 rounded-2xl border transition-all duration-200',
              activeRole === 'S' || activeRole === 'V' || activeRole === 'O'
                ? 'border-indigo-400 dark:border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/30 ring-1 ring-indigo-400'
                : 'border-border/80 bg-card',
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                <span>🏛️ Mệnh đề chính (Main Clause)</span>
              </span>
              {mainClause.translation_vi && (
                <span className="text-xs text-muted-foreground italic line-clamp-1 max-w-[60%]">
                  {mainClause.translation_vi}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Subject */}
              <div
                onClick={(e) => handleLookup(mainClause.subject.head || mainClause.subject.text, e)}
                className="p-3 rounded-xl border border-emerald-300/80 dark:border-emerald-700/60 bg-emerald-50/70 dark:bg-emerald-950/40 cursor-pointer hover:bg-emerald-100/70 dark:hover:bg-emerald-900/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                    <span className="px-1.5 py-0.5 rounded-md bg-emerald-600 text-white">S</span>
                    <span>Chủ ngữ (Subject)</span>
                  </span>
                  {mainClause.subject.head !== mainClause.subject.text && (
                    <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-200/60 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded">
                      Lõi: {mainClause.subject.head}
                    </span>
                  )}
                </div>
                <p className="text-sm font-bold text-emerald-950 dark:text-emerald-100">
                  {mainClause.subject.text}
                </p>
              </div>

              {/* Verb */}
              <div
                onClick={(e) => handleLookup(mainClause.verb.head || mainClause.verb.text, e)}
                className="p-3 rounded-xl border border-sky-300/80 dark:border-sky-700/60 bg-sky-50/70 dark:bg-sky-950/40 cursor-pointer hover:bg-sky-100/70 dark:hover:bg-sky-900/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-sky-800 dark:text-sky-300 flex items-center gap-1">
                    <span className="px-1.5 py-0.5 rounded-md bg-sky-600 text-white">V</span>
                    <span>Vị ngữ / Động từ chính</span>
                  </span>
                  {mainClause.verb.tense && (
                    <span className="text-[10px] font-semibold text-sky-700 dark:text-sky-300 bg-sky-200/60 dark:bg-sky-900/60 px-1.5 py-0.5 rounded">
                      {mainClause.verb.tense}
                    </span>
                  )}
                </div>
                <p className="text-sm font-bold text-sky-950 dark:text-sky-100">
                  {mainClause.verb.text}
                </p>
              </div>

              {/* Object */}
              {mainClause.object && (
                <div
                  onClick={(e) => handleLookup(mainClause.object!.head || mainClause.object!.text, e)}
                  className="p-3 rounded-xl border border-amber-300/80 dark:border-amber-700/60 bg-amber-50/70 dark:bg-amber-950/40 cursor-pointer hover:bg-amber-100/70 dark:hover:bg-amber-900/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1">
                      <span className="px-1.5 py-0.5 rounded-md bg-amber-600 text-white">O</span>
                      <span>Tân ngữ (Object)</span>
                    </span>
                    {mainClause.object.head && mainClause.object.head !== mainClause.object.text && (
                      <span className="text-[10px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-200/60 dark:bg-amber-900/60 px-1.5 py-0.5 rounded">
                        Lõi: {mainClause.object.head}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-amber-950 dark:text-amber-100 leading-snug">
                    {mainClause.object.text}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Secondary Clauses / Participles Cards */}
        {secondaryClauses.length > 0 && (
          <div className="space-y-2">
            {secondaryClauses.map((sc, i) => (
              <div
                key={i}
                onMouseEnter={() => setActiveRole('clause')}
                onMouseLeave={() => setActiveRole(null)}
                className={cn(
                  'p-4 rounded-2xl border transition-all duration-200',
                  activeRole === 'clause'
                    ? 'border-purple-400 dark:border-purple-600 bg-purple-50/30 dark:bg-purple-950/30 ring-1 ring-purple-400'
                    : 'border-purple-200/80 dark:border-purple-900/50 bg-purple-50/20 dark:bg-purple-950/10',
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-purple-600 text-white text-[10px] font-black uppercase tracking-wider">
                      {sc.type === 'participle_result'
                        ? 'Phân từ kết quả'
                        : sc.type === 'relative_clause'
                          ? 'Mệnh đề quan hệ'
                          : sc.type === 'adverbial_clause'
                            ? 'Mệnh đề trạng ngữ'
                            : 'Mệnh đề bổ trợ'}
                    </span>
                    <span>{sc.type_label_vi}</span>
                  </span>
                  {sc.linker && (
                    <span className="text-[10px] font-semibold bg-purple-200/60 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300 px-2 py-0.5 rounded-full">
                      Từ nối / Dấu hiệu: <strong>{sc.linker}</strong>
                    </span>
                  )}
                </div>

                <p className="text-sm font-semibold text-purple-950 dark:text-purple-100 mb-2 leading-relaxed">
                  {sc.text}
                </p>

                {/* Inner Decomposition (Linker, Action, Target) */}
                <div className="flex flex-wrap gap-2 text-xs mb-2">
                  {sc.action && (
                    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-background/80 border border-purple-200/60 dark:border-purple-800/40">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Hành động:</span>
                      <strong className="text-purple-900 dark:text-purple-200">{sc.action}</strong>
                    </div>
                  )}
                  {sc.target && (
                    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-background/80 border border-purple-200/60 dark:border-purple-800/40">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Tác động lên:</span>
                      <strong className="text-purple-900 dark:text-purple-200">{sc.target}</strong>
                    </div>
                  )}
                </div>

                {sc.translation_vi && (
                  <p className="text-xs text-muted-foreground italic border-t border-purple-200/40 dark:border-purple-900/30 pt-1.5">
                    👉 {sc.translation_vi}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Contextual Vocabulary & High-Quality Chunks */}
      {chunks.length > 0 && (
        <div className="p-4 rounded-2xl border border-border/80 bg-card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <span>📚 Từ vựng & Collocations ngữ cảnh</span>
            </span>
            <span className="text-[11px] text-muted-foreground">
              {chunks.length} cụm từ học thuật
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {chunks.map((chunk, i) => {
              const wordKey = chunk.base || chunk.text;
              const isSaved = savedChunks.has(wordKey);
              const isSaving = savingChunk === wordKey;

              return (
                <div
                  key={i}
                  className="group flex flex-col justify-between p-3 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-all text-xs space-y-2"
                >
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          onClick={(e) => handleLookup(chunk.base || chunk.text, e)}
                          className="font-bold text-sm text-foreground hover:text-primary transition-colors cursor-pointer"
                        >
                          {chunk.text || chunk.base}
                        </span>
                        {chunk.pos && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                            {chunk.pos}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleSpeak(chunk.text || chunk.base, e)}
                        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                        title="Nghe phát âm"
                      >
                        <Volume2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {chunk.ipa && (
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {chunk.ipa}
                      </span>
                    )}

                    <p className="text-xs text-foreground/90 font-medium leading-relaxed">
                      {chunk.meaning_vi}
                    </p>
                  </div>

                  {/* Actions: Save to Notebook / Lookup */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px]">
                    {chunk.base && chunk.base.toLowerCase() !== chunk.text.toLowerCase() && (
                      <span className="text-muted-foreground italic">
                        Nguyên mẫu: <strong>{chunk.base}</strong>
                      </span>
                    )}

                    <button
                      type="button"
                      disabled={isSaved || isSaving}
                      onClick={(e) => void handleSaveWord(chunk, e)}
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-all ml-auto',
                        isSaved
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'hover:bg-primary/10 text-muted-foreground hover:text-primary',
                      )}
                      title="Lưu vào sổ từ vựng"
                    >
                      {isSaved ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-500" />
                          <span>Đã lưu</span>
                        </>
                      ) : (
                        <>
                          <BookmarkPlus className="h-3 w-3" />
                          <span>Lưu từ</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Logic Patterns (e.g. less A than B) */}
      {data.logic && (
        <div className="p-3.5 rounded-xl border border-violet-200 dark:border-violet-800/80 bg-violet-50/50 dark:bg-violet-950/20 space-y-1.5 text-xs">
          <p className="font-bold text-violet-800 dark:text-violet-300">
            ⚡ Mô hình Logic: {data.logic.pattern}
          </p>
          <p className="text-sm">
            <span className="font-semibold text-muted-foreground">A:</span> {data.logic.a}
            <span className="mx-2 text-muted-foreground">➔</span>
            <span className="font-semibold text-violet-700 dark:text-violet-300">B:</span> {data.logic.b}
          </p>
          <p className="text-muted-foreground">{data.logic.formula_vi}</p>
        </div>
      )}

      {/* 6. Build Levels (Thang xây dựng câu từng lớp) */}
      {buildLevels.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <Layers className="h-3.5 w-3.5" />
            <span>Xây lại câu theo từng lớp (Building Steps)</span>
          </span>
          <div className="space-y-1.5">
            {buildLevels.map((lvl) => (
              <div
                key={`lvl-${lvl.level}`}
                className="flex items-start gap-2.5 p-2.5 rounded-xl border border-border/50 bg-card text-xs"
              >
                <span className="px-1.5 py-0.5 rounded font-black text-[10px] bg-muted text-muted-foreground shrink-0 mt-0.5">
                  L{lvl.level}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] text-muted-foreground font-semibold block mb-0.5">
                    {lvl.slot_vi}
                  </span>
                  <p className="text-sm font-medium text-foreground leading-snug break-words">
                    {lvl.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. Notes & Grammar Tips */}
      {data.notes && data.notes.length > 0 && (
        <div className="p-3 rounded-xl bg-muted/40 border border-border/50 text-xs text-muted-foreground space-y-1">
          <span className="font-bold uppercase tracking-wider text-[10px] text-muted-foreground block">
            💡 Ghi chú ngữ pháp & phân tích
          </span>
          <ul className="list-disc pl-4 space-y-0.5">
            {data.notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
