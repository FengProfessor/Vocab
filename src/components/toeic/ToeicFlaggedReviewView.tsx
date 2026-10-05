'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  Bookmark,
  Flag,
  XCircle,
  CheckCircle2,
  FileText,
  Volume2,
  Play,
  Pause,
  RotateCcw,
  Edit3,
  Save,
  Search,
  Layers,
  Headphones,
  Eye,
  EyeOff,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  getQuestionsForReview,
  toggleQuestionFlag,
  saveQuestionNote,
  TOEIC_HISTORY_UPDATED_EVENT,
  type ToeicQuestionHistoryRecord,
} from '@/lib/toeic-question-history';

interface QuestionDetails {
  questionId: string;
  part: number;
  question?: string;
  options?: Array<{ key: string; text: string }>;
  correctAnswer?: string;
  explanationVi?: string;
  transcript?: string;
  passage?: string;
  passageTranslationVi?: string;
  audioUrl?: string;
  imageUrl?: string;
}

type FilterStatus = 'all' | 'mistakes' | 'flagged' | 'notes';

interface ToeicFlaggedReviewViewProps {
  onSwitchToPractice?: (part?: number) => void;
}

export function ToeicFlaggedReviewView({ onSwitchToPractice }: ToeicFlaggedReviewViewProps) {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [selectedPart, setSelectedPart] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [records, setRecords] = useState<ToeicQuestionHistoryRecord[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Reload history records from localStorage
  const refreshRecords = () => {
    const list = getQuestionsForReview({
      filter: 'all',
      part: selectedPart === 'all' ? undefined : selectedPart,
    });
    setRecords(list);
    setIsLoaded(true);
  };

  useEffect(() => {
    refreshRecords();

    const handleUpdate = () => {
      refreshRecords();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(TOEIC_HISTORY_UPDATED_EVENT, handleUpdate);
      return () => {
        window.removeEventListener(TOEIC_HISTORY_UPDATED_EVENT, handleUpdate);
      };
    }
  }, [selectedPart]);

  // Status counts for badge tabs
  const counts = useMemo(() => {
    let all = 0;
    let mistakes = 0;
    let flagged = 0;
    let notes = 0;

    for (const r of records) {
      all++;
      if (!r.isCorrect) mistakes++;
      if (r.isFlagged) flagged++;
      if (r.notes && r.notes.trim().length > 0) notes++;
    }

    return { all, mistakes, flagged, notes };
  }, [records]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // Status filter
      if (filterStatus === 'mistakes' && r.isCorrect) return false;
      if (filterStatus === 'flagged' && !r.isFlagged) return false;
      if (filterStatus === 'notes' && (!r.notes || r.notes.trim().length === 0)) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesId = r.questionId.toLowerCase().includes(query);
        const matchesNote = r.notes ? r.notes.toLowerCase().includes(query) : false;
        if (!matchesId && !matchesNote) return false;
      }

      return true;
    });
  }, [records, filterStatus, searchQuery]);

  return (
    <div className="space-y-6">
      {/* ── 1. HEADER & CONTROLS TOOLBAR ── */}
      <div className="rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/80">
                <Bookmark className="h-4 w-4" />
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Chế Độ Ôn Luyện Câu Cần Luyện Lại
              </h2>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Tổng hợp toàn diện các câu bạn đã <span className="font-semibold text-rose-600 dark:text-rose-400">làm sai</span>,{' '}
              <span className="font-semibold text-amber-600 dark:text-amber-400">gắn cờ đánh dấu 🚩</span>, hoặc{' '}
              <span className="font-semibold text-sky-600 dark:text-sky-400">ghi chú cá nhân 📝</span> từ mọi đề thi và phiên luyện tập.
            </p>
          </div>

          {/* Quick Launch Practice CTA */}
          {filteredRecords.length > 0 && (
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={`/toeic/exam/bank?part=${selectedPart === 'all' ? 1 : selectedPart}&limit=${Math.min(20, filteredRecords.length)}&mode=practice&filterMode=mistakes`}
                className="inline-flex items-center gap-1.5 rounded-sm bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 py-1.5 font-mono text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition shadow-xs"
              >
                <Play className="h-3 w-3 fill-current" />
                <span>Luyện {Math.min(20, filteredRecords.length)} câu này</span>
              </Link>
            </div>
          )}
        </div>

        {/* ── Status Filter Pills ── */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-xs font-mono text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer select-none ${
              filterStatus === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold shadow-2xs'
                : 'border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>Tất cả</span>
            <span className="tabular-nums px-1 py-0.2 rounded-2xs text-[10px] bg-black/10 dark:bg-white/20">
              {counts.all}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('mistakes')}
            className={`px-3 py-1.5 rounded-xs font-mono text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer select-none ${
              filterStatus === 'mistakes'
                ? 'bg-rose-700 text-white font-bold shadow-2xs'
                : 'border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40'
            }`}
          >
            <XCircle className="h-3.5 w-3.5 text-rose-500" />
            <span>Làm sai</span>
            <span className="tabular-nums px-1 py-0.2 rounded-2xs text-[10px] bg-rose-200/80 dark:bg-rose-900/60">
              {counts.mistakes}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('flagged')}
            className={`px-3 py-1.5 rounded-xs font-mono text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer select-none ${
              filterStatus === 'flagged'
                ? 'bg-amber-600 text-white font-bold shadow-2xs'
                : 'border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40'
            }`}
          >
            <Flag className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
            <span>Đã gắn cờ</span>
            <span className="tabular-nums px-1 py-0.2 rounded-2xs text-[10px] bg-amber-200/80 dark:bg-amber-900/60">
              {counts.flagged}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('notes')}
            className={`px-3 py-1.5 rounded-xs font-mono text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer select-none ${
              filterStatus === 'notes'
                ? 'bg-sky-700 text-white font-bold shadow-2xs'
                : 'border border-sky-200 dark:border-sky-900/60 bg-sky-50/50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/40'
            }`}
          >
            <Edit3 className="h-3.5 w-3.5 text-sky-500" />
            <span>Có ghi chú</span>
            <span className="tabular-nums px-1 py-0.2 rounded-2xs text-[10px] bg-sky-200/80 dark:bg-sky-900/60">
              {counts.notes}
            </span>
          </button>
        </div>

        {/* ── Part Selector Strip + Search Bar ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
          {/* Part Pills */}
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 mr-1 flex items-center gap-1">
              <Layers className="h-3 w-3" /> Part:
            </span>
            <button
              type="button"
              onClick={() => setSelectedPart('all')}
              className={`px-2 py-0.5 rounded-xs font-mono text-xs transition cursor-pointer ${
                selectedPart === 'all'
                  ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Mọi Part
            </button>
            {[1, 2, 3, 4, 5, 6, 7].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setSelectedPart(p)}
                className={`px-2 py-0.5 rounded-xs font-mono text-xs transition cursor-pointer ${
                  selectedPart === p
                    ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                P{p}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo mã câu hoặc ghi chú..."
              className="w-full pl-8 pr-3 py-1 rounded-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden font-mono"
            />
          </div>
        </div>
      </div>

      {/* ── 2. QUESTIONS LIST / EMPTY STATE ── */}
      {!isLoaded ? (
        <div className="p-8 text-center rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-xs text-slate-500">
          Đang nạp danh sách câu hỏi cần luyện lại...
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="rounded-sm border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 p-8 sm:p-12 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
            <Bookmark className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {records.length === 0
              ? 'Chưa có câu hỏi nào trong danh sách luyện lại'
              : 'Không có câu hỏi nào khớp với bộ lọc hiện tại'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            {records.length === 0
              ? 'Khi bạn làm bài thi hoặc luyện đề, hệ thống sẽ tự động ghi nhớ các câu bạn làm sai, gắn cờ 🚩 hoặc ghi chú cá nhân 📝 để ôn tập tại đây.'
              : 'Hãy thử đổi bộ lọc trạng thái hoặc Part phía trên để tìm kiếm các câu khác.'}
          </p>
          {onSwitchToPractice && (
            <button
              type="button"
              onClick={() => onSwitchToPractice(1)}
              className="mt-2 px-4 py-2 rounded-sm bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-mono text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition cursor-pointer"
            >
              Bắt đầu luyện tập ngay
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500 px-1">
            <span>
              Hiển thị <strong className="text-slate-900 dark:text-white tabular-nums">{filteredRecords.length}</strong> câu hỏi
            </span>
            <span>Sắp xếp: Mới cập nhật nhất</span>
          </div>

          {filteredRecords.map((record) => (
            <ReviewQuestionCard
              key={record.questionId}
              record={record}
              onFlagToggled={refreshRecords}
              onNoteSaved={refreshRecords}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── 3. PER-QUESTION REVIEW CARD COMPONENT ────────────────────────────────────

interface ReviewQuestionCardProps {
  record: ToeicQuestionHistoryRecord;
  onFlagToggled: () => void;
  onNoteSaved: () => void;
}

function ReviewQuestionCard({ record, onFlagToggled, onNoteSaved }: ReviewQuestionCardProps) {
  const [details, setDetails] = useState<QuestionDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [showTranscript, setShowTranscript] = useState<boolean>(false);
  const [noteText, setNoteText] = useState<string>(record.notes || '');
  const [isSavingNote, setIsSavingNote] = useState<boolean>(false);
  const [noteSaveStatus, setNoteSaveStatus] = useState<'idle' | 'saved'>('idle');

  // Audio player state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  // Fetch question pedagogical details on expand
  const fetchDetails = async () => {
    if (details || isLoadingDetails) return;
    setIsLoadingDetails(true);
    try {
      const res = await fetch('/api/toeic/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: record.questionId,
          part: record.part,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setDetails({
            questionId: data.questionId || record.questionId,
            part: data.part || record.part,
            question: data.question,
            options: data.options,
            correctAnswer: data.correctAnswer,
            explanationVi: data.explanationVi,
            transcript: data.transcript,
            passage: data.passage,
            passageTranslationVi: data.passageTranslationVi,
            audioUrl: data.audioUrl,
            imageUrl: data.imageUrl,
          });
        }
      }
    } catch (err) {
      console.warn('[ReviewCard] Failed to fetch details:', err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleToggleExpand = () => {
    const nextState = !isExpanded;
    setIsExpanded(nextState);
    if (nextState && !details) {
      void fetchDetails();
    }
  };

  const handleToggleFlag = () => {
    toggleQuestionFlag(record.questionId, record.part);
    onFlagToggled();
  };

  const handleSaveNote = () => {
    setIsSavingNote(true);
    saveQuestionNote(record.questionId, record.part, noteText.trim());
    setIsSavingNote(false);
    setNoteSaveStatus('saved');
    setTimeout(() => setNoteSaveStatus('idle'), 2500);
    onNoteSaved();
  };

  // Audio controls
  const handleToggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleChangeSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <article className="rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors shadow-2xs">
      {/* ── Card Header ── */}
      <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex flex-wrap items-center gap-2">
          {/* Part Badge */}
          <span className="px-2 py-0.5 rounded-2xs font-mono text-xs font-bold bg-slate-900 text-white dark:bg-white dark:text-slate-900">
            Part {record.part}
          </span>

          {/* Question ID */}
          <span className="font-mono text-xs text-slate-500 tabular-nums">
            #{record.questionId}
          </span>

          {/* Attempt Result Badge */}
          {!record.isCorrect ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-2xs font-mono text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
              <XCircle className="h-3 w-3" />
              <span>Làm sai {record.selectedOption ? `(chọn ${record.selectedOption})` : ''}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-2xs font-mono text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50">
              <CheckCircle2 className="h-3 w-3" />
              <span>Đã làm đúng</span>
            </span>
          )}

          {/* Attempts Count */}
          <span className="font-mono text-[11px] text-slate-500 tabular-nums hidden sm:inline">
            ({record.attemptCount} lần thử)
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Flag Toggle Button */}
          <button
            type="button"
            onClick={handleToggleFlag}
            title={record.isFlagged ? 'Bỏ gắn cờ' : 'Gắn cờ câu này'}
            className={`px-2 py-1 rounded-xs font-mono text-xs flex items-center gap-1 transition cursor-pointer border ${
              record.isFlagged
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800'
                : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Flag className={`h-3.5 w-3.5 ${record.isFlagged ? 'fill-amber-500 text-amber-500' : ''}`} />
            <span className="hidden sm:inline">{record.isFlagged ? 'Đã gắn cờ' : 'Gắn cờ'}</span>
          </button>

          {/* Expand Details Toggle */}
          <button
            type="button"
            onClick={handleToggleExpand}
            className="px-2.5 py-1 rounded-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-1"
          >
            <span>{isExpanded ? 'Thu gọn' : 'Xem chi tiết & Audio'}</span>
            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* ── Expanded Content (Stimulus, Audio, Prompt, Explanation) ── */}
      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-4 border-b border-slate-100 dark:border-slate-800">
          {isLoadingDetails ? (
            <div className="py-6 text-center font-mono text-xs text-slate-500 animate-pulse">
              Đang tải nội dung câu hỏi, audio và lời giải chi tiết...
            </div>
          ) : details ? (
            <>
              {/* ── Audio Player (Part 1-4) ── */}
              {details.audioUrl && (
                <div className="rounded-sm border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
                      <Headphones className="h-3.5 w-3.5 text-sky-600" /> Audio Luyện Nghe:
                    </span>
                    <span className="tabular-nums text-slate-500">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>

                  <audio
                    ref={audioRef}
                    src={details.audioUrl}
                    onTimeUpdate={() => {
                      if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
                    }}
                    onLoadedMetadata={() => {
                      if (audioRef.current) setDuration(audioRef.current.duration || 0);
                    }}
                    onEnded={() => setIsPlaying(false)}
                    className="hidden"
                  />

                  {/* Player Controls Bar */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleToggleAudio}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xs bg-slate-900 text-white dark:bg-white dark:text-slate-900 transition hover:opacity-90 cursor-pointer shadow-xs"
                    >
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
                    </button>

                    {/* Progress Track */}
                    <input
                      type="range"
                      min={0}
                      max={duration || 100}
                      value={currentTime}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setCurrentTime(val);
                        if (audioRef.current) audioRef.current.currentTime = val;
                      }}
                      className="w-full accent-slate-900 dark:accent-white cursor-pointer"
                    />

                    {/* Speed Controls Strip */}
                    <div className="flex items-center rounded-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-0.5 font-mono text-[11px]">
                      {[0.75, 1, 1.25].map((spd) => (
                        <button
                          key={spd}
                          type="button"
                          onClick={() => handleChangeSpeed(spd)}
                          className={`px-1.5 py-0.5 rounded-2xs font-semibold transition cursor-pointer ${
                            playbackSpeed === spd
                              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                          }`}
                        >
                          {spd}x
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Image Stimulus (Part 1 or Graphics) ── */}
              {details.imageUrl && (
                <div className="my-2 max-w-md mx-auto rounded-sm overflow-hidden border border-slate-200 dark:border-slate-800">
                  <img
                    src={details.imageUrl}
                    alt="Question stimulus"
                    className="w-full h-auto object-contain bg-slate-100 dark:bg-slate-950"
                  />
                </div>
              )}

              {/* ── Reading Passage (Part 6-7) ── */}
              {details.passage && (
                <div className="rounded-sm border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-3.5 space-y-2 text-xs leading-relaxed text-slate-800 dark:text-slate-200 font-serif">
                  <div className="font-mono font-bold text-[11px] text-slate-500 uppercase tracking-wider">
                    Đoạn văn đọc hiểu:
                  </div>
                  <div className="whitespace-pre-line">{details.passage}</div>
                </div>
              )}

              {/* ── Transcript Toggle & View ── */}
              {details.transcript && (
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => setShowTranscript(!showTranscript)}
                    className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                  >
                    {showTranscript ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    <span>{showTranscript ? 'Ẩn Transcript bài nghe' : 'Xem Transcript bài nghe'}</span>
                  </button>

                  {showTranscript && (
                    <div className="rounded-sm border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 font-mono text-xs leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-line">
                      {details.transcript}
                    </div>
                  )}
                </div>
              )}

              {/* ── Question Prompt & Options ── */}
              {details.question && (
                <div className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white">
                  {details.question}
                </div>
              )}

              {details.options && details.options.length > 0 && (
                <div className="grid grid-cols-1 gap-1.5">
                  {details.options.map((opt) => {
                    const isCorrect = opt.key === details.correctAnswer;
                    const isUserChoice = opt.key === record.selectedOption;
                    return (
                      <div
                        key={opt.key}
                        className={`flex items-start gap-2.5 p-2 rounded-xs border text-xs leading-snug ${
                          isCorrect
                            ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 font-medium'
                            : isUserChoice
                            ? 'border-rose-300 dark:border-rose-800 bg-rose-50/60 dark:bg-rose-950/40 text-rose-900 dark:text-rose-300 font-medium'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span
                          className={`font-mono font-bold px-1.5 py-0.2 rounded-2xs ${
                            isCorrect
                              ? 'bg-emerald-600 text-white'
                              : isUserChoice
                              ? 'bg-rose-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {opt.key}
                        </span>
                        <span>{opt.text}</span>
                        {isCorrect && (
                          <span className="ml-auto font-mono text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">
                            Đáp án đúng
                          </span>
                        )}
                        {isUserChoice && !isCorrect && (
                          <span className="ml-auto font-mono text-[10px] uppercase font-bold text-rose-700 dark:text-rose-400">
                            Bạn đã chọn
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── Pedagogical Explanation Box ── */}
              {details.explanationVi && (
                <div className="rounded-sm border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 p-3 space-y-1 text-xs text-slate-800 dark:text-slate-200">
                  <div className="font-mono font-bold text-[11px] text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-sky-600" /> Giải thích chi tiết:
                  </div>
                  <div className="leading-relaxed whitespace-pre-line text-slate-700 dark:text-slate-300">
                    {details.explanationVi}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-4 text-center font-mono text-xs text-slate-500">
              Không thể tải nội dung câu hỏi. Vui lòng thử lại.
            </div>
          )}
        </div>
      )}

      {/* ── Card Footer: Personal Note Editor ── */}
      <div className="p-3.5 sm:p-4 bg-slate-50/30 dark:bg-slate-950/20 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <label className="font-mono font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Edit3 className="h-3.5 w-3.5 text-sky-600" />
            <span>Ghi chú cá nhân & mẹo nhớ:</span>
          </label>
          {record.notesUpdatedAt && (
            <span className="font-mono text-[11px] text-slate-400 tabular-nums">
              Cập nhật: {new Date(record.notesUpdatedAt).toLocaleDateString('vi-VN')}
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={2}
            placeholder="Ghi chú điểm ngữ pháp, từ mới hoặc bẫy cần nhớ cho câu này..."
            className="flex-1 p-2 rounded-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden font-mono"
          />

          <button
            type="button"
            onClick={handleSaveNote}
            disabled={isSavingNote}
            className={`self-end sm:self-stretch px-3 py-1.5 rounded-xs font-mono text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0 ${
              noteSaveStatus === 'saved'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100'
            }`}
          >
            <Save className="h-3.5 w-3.5" />
            <span>{noteSaveStatus === 'saved' ? 'Đã lưu!' : 'Lưu ghi chú'}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
