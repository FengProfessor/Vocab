'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  Clock,
  Flag,
  ChevronLeft,
  ChevronRight,
  Send,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Headphones,
  BookOpen,
  PenTool,
  Mic,
  RotateCcw,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Layers,
  ArrowLeft,
  ShieldCheck,
  Check,
  Sparkles,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import {
  VstepExam,
  VstepSection,
  VstepTask,
  VstepQuestion,
  VstepScoreResult,
  VstepSkillType
} from '@/lib/vstep-types';
import { getCefrDescription } from '@/lib/vstep-scoring';
import {
  batchRecordVstepAnswers,
  recordVstepExamAttempt,
  getAnsweredVstepQuestionIds,
  getIncorrectVstepQuestionIds,
} from '@/lib/vstep-history';

function VstepExamPageInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const examId = params.examId as string;
  const filterMode = searchParams.get('filter') || 'unseen';

  // State nạp đề
  const [exam, setExam] = useState<VstepExam | null>(null);
  const [sessionToken, setSessionToken] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // State phòng thi
  const [activeSectionIdx, setActiveSectionIdx] = useState<number>(0);
  const [activeTaskIdx, setActiveTaskIdx] = useState<number>(0);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [writingAnswers, setWritingAnswers] = useState<Record<string, string>>({});
  const [flaggedQuestionIds, setFlaggedQuestionIds] = useState<Set<string>>(new Set());
  const [paletteOpen, setPaletteOpen] = useState<boolean>(false);

  // Đồng hồ đếm ngược
  const [timeLeft, setTimeLeft] = useState<number>(172 * 60);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitModalOpen, setSubmitModalOpen] = useState<boolean>(false);

  // Màn hình kết quả
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [scoreResult, setScoreResult] = useState<VstepScoreResult | null>(null);
  const [reviewExam, setReviewExam] = useState<VstepExam | null>(null);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'mistakes'>('all');

  // Audio Player State cho Listening
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Nạp dữ liệu đề thi
  useEffect(() => {
    async function fetchExam() {
      try {
        setLoading(true);
        const answeredIds = Array.from(getAnsweredVstepQuestionIds());
        const mistakeIds = Array.from(getIncorrectVstepQuestionIds());

        const res = await fetch('/api/vstep/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            testId: examId,
            filterMode,
            excludedIds: answeredIds,
            mistakeIds,
          }),
        });
        const data = await res.json();

        if (!data.success || !data.exam) {
          setError(data.error || 'Không tìm thấy đề thi.');
          return;
        }

        setExam(data.exam);
        setSessionToken(data.sessionToken || '');
        setTimeLeft(data.exam.duration * 60);

        // Khôi phục câu trả lời từ localStorage nếu làm dang dở
        const savedDraft = localStorage.getItem(`vstep_draft_${examId}`);
        if (savedDraft) {
          try {
            const parsed = JSON.parse(savedDraft);
            if (parsed.answers) setUserAnswers(parsed.answers);
            if (parsed.writing) setWritingAnswers(parsed.writing);
            if (parsed.flags) setFlaggedQuestionIds(new Set(parsed.flags));
          } catch {
            // ignore
          }
        }
      } catch (err) {
        console.error('Lỗi khi tải đề thi:', err);
        setError('Không thể kết nối máy chủ để tải đề thi.');
      } finally {
        setLoading(false);
      }
    }

    if (examId) fetchExam();
  }, [examId, filterMode]);

  // Tự động lưu tiến độ vào localStorage
  useEffect(() => {
    if (!exam || isCompleted) return;
    const draft = {
      answers: userAnswers,
      writing: writingAnswers,
      flags: Array.from(flaggedQuestionIds),
      updatedAt: Date.now(),
    };
    localStorage.setItem(`vstep_draft_${examId}`, JSON.stringify(draft));
  }, [userAnswers, writingAnswers, flaggedQuestionIds, exam, examId, isCompleted]);

  // Đếm ngược thời gian
  useEffect(() => {
    if (loading || isCompleted || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, isCompleted, timeLeft]);

  // Format thời gian MM:SS hoặc HH:MM:SS
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Section & Task hiện tại
  const currentExam = isCompleted && reviewExam ? reviewExam : exam;
  const currentSection: VstepSection | undefined = currentExam?.sections[activeSectionIdx];
  const currentTask: VstepTask | undefined = currentSection?.tasks[activeTaskIdx];
  const currentQuestions: VstepQuestion[] = currentTask?.questions || [];
  const currentQuestion: VstepQuestion | undefined = currentQuestions[activeQuestionIdx];

  // Danh sách toàn bộ câu hỏi để hiển thị Question Palette
  const allFlattenedQuestions = useMemo(() => {
    if (!currentExam) return [];
    const list: Array<{
      q: VstepQuestion;
      sectionIdx: number;
      taskIdx: number;
      qIdx: number;
      globalNumber: number;
      sectionType: VstepSkillType;
      partLabel: string;
    }> = [];

    let count = 1;
    currentExam.sections.forEach((sec, sIdx) => {
      sec.tasks.forEach((tsk, tIdx) => {
        if (tsk.questions) {
          tsk.questions.forEach((q, qIdx) => {
            list.push({
              q,
              sectionIdx: sIdx,
              taskIdx: tIdx,
              qIdx,
              globalNumber: count++,
              sectionType: sec.type,
              partLabel: `${sec.label} - ${tsk.id?.toUpperCase() || `P${tIdx + 1}`}`,
            });
          });
        }
      });
    });

    return list;
  }, [currentExam]);

  // Chọn đáp án
  const handleSelectOption = (questionId: string, optionIdx: number) => {
    if (isCompleted) return;
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionIdx,
    }));
  };

  // Gắn cờ Flag
  const handleToggleFlag = (questionId: string) => {
    setFlaggedQuestionIds((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  };

  // Nhảy tới câu hỏi bất kỳ
  const jumpToQuestion = (sIdx: number, tIdx: number, qIdx: number) => {
    setActiveSectionIdx(sIdx);
    setActiveTaskIdx(tIdx);
    setActiveQuestionIdx(qIdx);
    setPaletteOpen(false);
  };

  // Xử lý nộp bài
  const handleAutoSubmit = () => {
    toast.warning('Đã hết thời gian làm bài! Hệ thống đang tự động nộp bài...');
    submitExam();
  };

  const submitExam = async () => {
    if (isSubmitting || !exam) return;
    setIsSubmitting(true);
    setSubmitModalOpen(false);

    try {
      const res = await fetch('/api/vstep/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId: examId,
          examMode: 'full_simulation',
          answers: userAnswers,
          questionIds: allFlattenedQuestions.map((item) => item.q.id),
          writingSubmissions: writingAnswers,
          sessionToken,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        toast.error(data.error || 'Có lỗi khi nộp bài.');
        setIsSubmitting(false);
        return;
      }

      setScoreResult(data.scoreResult);
      setReviewExam(data.reviewExam);
      setIsCompleted(true);

      // Cập nhật lịch sử câu hỏi vào localStorage
      const historyItems: Array<{
        questionId: string;
        skill: VstepSkillType;
        part: string;
        isCorrect: boolean;
        selectedOption?: number;
        examId?: string;
      }> = [];

      for (const section of data.reviewExam.sections) {
        for (const task of section.tasks) {
          if (task.questions) {
            for (const q of task.questions) {
              const uAns = userAnswers[q.id];
              historyItems.push({
                questionId: q.id,
                skill: section.type,
                part: task.id || 'part1',
                isCorrect: uAns === q.answer,
                selectedOption: uAns,
                examId,
              });
            }
          }
        }
      }

      batchRecordVstepAnswers(historyItems);

      // Ghi nhận lịch sử đề thi vào localStorage
      const lCorrect = data.scoreResult.listeningCorrect || 0;
      const rCorrect = data.scoreResult.readingCorrect || 0;
      const lTotal =
        data.scoreResult.listeningTotal ||
        (exam.sections.find((s: VstepSection) => s.type === 'listening')?.tasks.reduce((a: number, t: VstepTask) => a + (t.questions?.length || 0), 0) || 0);
      const rTotal =
        data.scoreResult.readingTotal ||
        (exam.sections.find((s: VstepSection) => s.type === 'reading')?.tasks.reduce((a: number, t: VstepTask) => a + (t.questions?.length || 0), 0) || 0);
      const totalQuestionsCount = Math.max(1, lTotal + rTotal);
      const totalCorrect = lCorrect + rCorrect;
      const accuracyRate = Math.round((totalCorrect / totalQuestionsCount) * 100);

      recordVstepExamAttempt({
        examId,
        examTitle: exam.title,
        category:
          (exam as any).category ||
          (exam.sections.length > 1 ? 'full_mock' : (exam.sections[0]?.type as any) || 'listening'),
        completedAt: new Date().toISOString(),
        durationSeconds: (exam.duration || 172) * 60 - Math.max(0, timeLeft),
        overallScore: data.scoreResult.overallScore,
        cefrLevel: data.scoreResult.cefrLevel,
        accuracyRate,
        totalQuestionsAnswered: Object.keys(userAnswers).length,
        totalQuestionsCorrect: totalCorrect,
        listeningScore: data.scoreResult.listeningScore,
        readingScore: data.scoreResult.readingScore,
        writingScore: data.scoreResult.writingScore,
        speakingScore: data.scoreResult.speakingScore,
        listeningCorrect: data.scoreResult.listeningCorrect,
        readingCorrect: data.scoreResult.readingCorrect,
        targetLevel: (exam as any).targetLevel || 'B2',
      });

      localStorage.removeItem(`vstep_draft_${examId}`);
      toast.success('Nộp bài thành công! Bảng điểm VSTEP đã sẵn sàng.');
    } catch (err) {
      console.error('Lỗi nộp bài:', err);
      toast.error('Không thể kết nối máy chủ để nộp bài.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono text-slate-500">Đang khởi tạo phòng thi máy tính VSTEP...</p>
        </div>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 text-center space-y-4 shadow-sm">
          <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Không Thể Tải Đề Thi</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">{error}</p>
          <Link
            href="/vstep"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded text-xs font-medium bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Quay Lại Danh Mục
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 select-none">
      {/* ── HEADER PHÒNG THI STICKY TECHNICAL MINIMALIST ── */}
      <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 flex items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/vstep"
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
            title="Thoát phòng thi"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 font-semibold">
                VSTEP TEST
              </span>
              {filterMode === 'unseen' && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 rounded font-medium">
                  <ShieldCheck className="w-3 h-3" /> Chế độ: Chưa từng làm
                </span>
              )}
              {filterMode === 'mistakes' && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 px-1.5 py-0.5 rounded font-medium">
                  <RotateCcw className="w-3 h-3" /> Chế độ: Luyện câu sai
                </span>
              )}
              {filterMode === 'all_random' && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded font-medium">
                  <Layers className="w-3 h-3" /> Chế độ: Ngẫu nhiên
                </span>
              )}
              <h1 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-md">
                {exam.title}
              </h1>
            </div>
          </div>
        </div>

        {/* Section Navigation Pills */}
        <div className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-md text-xs font-medium">
          {currentExam?.sections.map((sec, idx) => (
            <button
              key={sec.type}
              type="button"
              onClick={() => {
                setActiveSectionIdx(idx);
                setActiveTaskIdx(0);
                setActiveQuestionIdx(0);
              }}
              className={`px-3 py-1 rounded transition-colors ${
                activeSectionIdx === idx
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 font-bold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {sec.label}
            </button>
          ))}
        </div>

        {/* Đồng hồ + Điều khiển Question Palette + Nộp bài */}
        <div className="flex items-center gap-2">
          {!isCompleted && (
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-mono font-bold tabular-nums ${
                timeLeft < 300
                  ? 'bg-rose-50 border-rose-300 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 animate-pulse'
                  : 'bg-slate-100 border-slate-200 text-slate-800 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          )}

          {/* Nút bật Palette */}
          <button
            type="button"
            onClick={() => setPaletteOpen(!paletteOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-mono font-medium text-slate-700 dark:text-slate-300"
          >
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Câu hỏi:</span>
            <span className="font-bold text-blue-600">{Object.keys(userAnswers).length}/{allFlattenedQuestions.length}</span>
          </button>

          {!isCompleted ? (
            <button
              type="button"
              onClick={() => setSubmitModalOpen(true)}
              className="px-3.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nộp Bài</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => router.push('/vstep')}
              className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5"
            >
              Hoàn Thành
            </button>
          )}
        </div>
      </header>

      {/* ── MÀN HÌNH BÁO CÁO KẾT QUẢ KHI NỘP BÀI ── */}
      {isCompleted && scoreResult && (
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm">
          <div className="max-w-5xl mx-auto space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[11px] font-mono uppercase text-slate-400">Kết quả khảo thí chính thức</span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  Chứng Nhận Năng Lực VSTEP B1-B2-C1
                </h2>
              </div>

              {/* CEFR Level Box */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-2xl sm:text-3xl font-mono font-black text-blue-600">
                    {scoreResult.overallScore.toFixed(1)} <span className="text-xs text-slate-400">/ 10</span>
                  </div>
                  <div className="text-xs font-bold text-slate-500 uppercase">Điểm quy đổi MOET</div>
                </div>

                <div className={`px-4 py-2 rounded-lg border text-center font-mono font-bold ${getCefrDescription(scoreResult.cefrLevel).colorClass}`}>
                  <div className="text-lg leading-none">{scoreResult.cefrLevel}</div>
                  <div className="text-[10px] uppercase mt-0.5">Xếp Bậc</div>
                </div>
              </div>
            </div>

            {/* Sub-skill scores */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block text-[10px] uppercase">Nghe (Listening)</span>
                <span className="text-base font-bold text-slate-800 dark:text-slate-200">
                  {scoreResult.listeningScore?.toFixed(1) ?? 'N/A'}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  {scoreResult.listeningCorrect} / {scoreResult.listeningTotal} câu
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block text-[10px] uppercase">Đọc (Reading)</span>
                <span className="text-base font-bold text-slate-800 dark:text-slate-200">
                  {scoreResult.readingScore?.toFixed(1) ?? 'N/A'}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  {scoreResult.readingCorrect} / {scoreResult.readingTotal} câu
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block text-[10px] uppercase">Viết (Writing)</span>
                <span className="text-base font-bold text-slate-800 dark:text-slate-200">
                  {Object.keys(writingAnswers).length > 0 ? 'Đã ghi nhận' : 'Chưa làm'}
                </span>
                <span className="text-[11px] text-slate-400 block">Task 1 & Task 2</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block text-[10px] uppercase">Đánh giá chung</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block truncate">
                  {getCefrDescription(scoreResult.cefrLevel).badgeVi}
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold">Đã lưu lịch sử</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── BỐ CỤC CHÍNH SPLIT-PANE 2 CỘT TỐI ƯU ── */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* ── CỘT TRÁI: STIMULUS (TÀI LIỆU BÀI ĐỌC / AUDIO / ĐỀ BÀI) ── */}
        <div className="w-full md:w-1/2 border-r border-slate-200 dark:border-slate-800 p-4 sm:p-6 overflow-y-auto bg-white dark:bg-slate-900 max-h-[45vh] md:max-h-[calc(100vh-60px)]">
          {currentSection && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="text-xs font-mono font-bold uppercase text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                  {currentSection.type === 'listening' && <Headphones className="w-4 h-4" />}
                  {currentSection.type === 'reading' && <BookOpen className="w-4 h-4" />}
                  {currentSection.type === 'writing' && <PenTool className="w-4 h-4" />}
                  {currentSection.type === 'speaking' && <Mic className="w-4 h-4" />}
                  {currentSection.label} — {currentTask?.id?.toUpperCase() || `Phần ${activeTaskIdx + 1}`}
                </span>

                {currentSection.tasks.length > 1 && (
                  <div className="flex items-center gap-1">
                    {currentSection.tasks.map((_, tIdx) => (
                      <button
                        key={tIdx}
                        type="button"
                        onClick={() => {
                          setActiveTaskIdx(tIdx);
                          setActiveQuestionIdx(0);
                        }}
                        className={`px-2 py-0.5 text-xs font-mono rounded ${
                          activeTaskIdx === tIdx
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        P{tIdx + 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Instructions */}
              {currentTask?.instructions && (
                <div
                  className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded text-xs text-slate-600 dark:text-slate-300 italic border border-slate-200 dark:border-slate-700"
                  dangerouslySetInnerHTML={{ __html: currentTask.instructions }}
                />
              )}

              {/* LISTENING: Audio Player CDN */}
              {currentSection.type === 'listening' && currentTask?.media?.audio && (
                <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-slate-700 dark:text-slate-200">Trình Phát Audio Khảo Thí</span>
                    <span className="text-slate-500">Tốc độ: {playbackSpeed}x</span>
                  </div>

                  <audio
                    ref={audioRef}
                    src={currentTask.media.audio}
                    onTimeUpdate={() => {
                      if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
                    }}
                    onLoadedMetadata={() => {
                      if (audioRef.current) setAudioDuration(audioRef.current.duration);
                    }}
                    onEnded={() => setIsPlaying(false)}
                    preload="auto"
                  />

                  {/* Audio Controls */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (!audioRef.current) return;
                        if (isPlaying) {
                          audioRef.current.pause();
                          setIsPlaying(false);
                        } else {
                          audioRef.current.play();
                          setIsPlaying(true);
                        }
                      }}
                      className="p-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
                    >
                      {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                    </button>

                    <input
                      type="range"
                      min={0}
                      max={audioDuration || 100}
                      value={currentTime}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setCurrentTime(val);
                        if (audioRef.current) audioRef.current.currentTime = val;
                      }}
                      className="flex-1 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer"
                    />

                    <div className="text-[11px] font-mono text-slate-500">
                      {formatTime(Math.floor(currentTime))} / {formatTime(Math.floor(audioDuration))}
                    </div>
                  </div>

                  {/* Tapescript khi xem lại bài */}
                  {isCompleted && currentTask.tapescript && (
                    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                        📜 Tapescript Bài Nghe:
                      </span>
                      <div
                        className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 p-3 rounded border border-slate-200 dark:border-slate-700"
                        dangerouslySetInnerHTML={{ __html: currentTask.tapescript }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* READING: Passage Text */}
              {currentSection.type === 'reading' && currentTask?.passage && (
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1">
                    {currentTask.passage.title}
                  </h3>
                  <div
                    className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 space-y-3 font-serif"
                    dangerouslySetInnerHTML={{ __html: currentTask.passage.text }}
                  />
                </div>
              )}

              {/* WRITING: Task Prompt */}
              {currentSection.type === 'writing' && currentTask && (
                <div className="space-y-4">
                  {currentTask.title && (
                    <div
                      className="text-sm font-semibold text-slate-800 dark:text-slate-200"
                      dangerouslySetInnerHTML={{ __html: currentTask.title }}
                    />
                  )}
                  {currentTask.content && (
                    <div
                      className="p-4 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: currentTask.content }}
                    />
                  )}
                  {currentTask.description && (
                    <p className="text-xs text-slate-500 italic">
                      {currentTask.description}
                    </p>
                  )}
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded border border-blue-200 dark:border-blue-800 text-xs font-mono text-blue-800 dark:text-blue-300">
                    Yêu cầu: Viết tối thiểu <strong>{currentTask.minWords || 120} từ</strong> trong khoảng <strong>{currentTask.id === 'part1' ? '20' : '40'} phút</strong>.
                  </div>
                </div>
              )}

              {/* SPEAKING: Prompt */}
              {currentSection.type === 'speaking' && currentTask && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Chủ đề Nói: {currentTask.type?.toUpperCase()}
                  </h3>
                  {currentTask.questions && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-600 uppercase">Câu hỏi gợi ý:</span>
                      <ul className="list-disc pl-5 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                        {currentTask.questions.map((qText, idx) => (
                          <li key={idx}>
                            {typeof qText === 'string' ? qText : (qText as any).question}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {currentTask.suggestion && (
                    <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                      <span className="text-xs font-bold text-slate-700 block mb-1">Gợi ý trả lời:</span>
                      <div
                        className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: currentTask.suggestion }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── CỘT PHẢI: CÂU HỎI TRẮC NGHIỆM HOẶC KHUNG SOẠN THẢO VIẾT ── */}
        <div className="w-full md:w-1/2 p-4 sm:p-6 overflow-y-auto max-h-[55vh] md:max-h-[calc(100vh-60px)] flex flex-col justify-between">
          {currentSection?.type === 'writing' ? (
            /* Khung Soạn Thảo Cho Phần Thi Viết */
            <div className="flex flex-col h-full space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  Bài Viết Của Bạn — {currentTask?.id?.toUpperCase()}
                </span>
                {(() => {
                  const essay = writingAnswers[currentTask?.id || 'part1'] || '';
                  const words = essay.trim() ? essay.trim().split(/\s+/).length : 0;
                  const minReq = currentTask?.minWords || 120;
                  const isMet = words >= minReq;
                  return (
                    <span className={`font-semibold ${isMet ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {words} / {minReq} từ {isMet && '✓ Đủ độ dài'}
                    </span>
                  );
                })()}
              </div>

              <textarea
                value={writingAnswers[currentTask?.id || 'part1'] || ''}
                onChange={(e) => {
                  if (isCompleted) return;
                  const val = e.target.value;
                  setWritingAnswers((prev) => ({
                    ...prev,
                    [currentTask?.id || 'part1']: val,
                  }));
                }}
                disabled={isCompleted}
                placeholder="Bắt đầu gõ bài luận hoặc thư của bạn tại đây bằng tiếng Anh..."
                className="flex-1 w-full p-4 text-sm font-serif leading-relaxed bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[320px]"
              />
            </div>
          ) : currentQuestion ? (
            /* Giao Diện Câu Hỏi Trắc Nghiệm (Listening / Reading) */
            <div className="space-y-4">
              {/* Question Header */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                    Câu {activeQuestionIdx + 1} / {currentQuestions.length}
                  </span>
                  {flaggedQuestionIds.has(currentQuestion.id) && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-600 font-semibold">
                      <Flag className="w-3 h-3 fill-current" /> Đã gắn cờ
                    </span>
                  )}
                </div>

                {!isCompleted && (
                  <button
                    type="button"
                    onClick={() => handleToggleFlag(currentQuestion.id)}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border transition-colors ${
                      flaggedQuestionIds.has(currentQuestion.id)
                        ? 'border-amber-400 text-amber-700 bg-amber-50 dark:bg-amber-950 dark:text-amber-300'
                        : 'border-slate-200 text-slate-500 hover:text-slate-800 dark:border-slate-700'
                    }`}
                  >
                    <Flag className={`w-3.5 h-3.5 ${flaggedQuestionIds.has(currentQuestion.id) ? 'fill-current' : ''}`} />
                    <span>Gắn cờ</span>
                  </button>
                )}
              </div>

              {/* Question Text */}
              <div
                className="text-sm font-semibold text-slate-900 dark:text-white leading-snug"
                dangerouslySetInnerHTML={{ __html: currentQuestion.question }}
              />

              {/* Options A, B, C, D */}
              <div className="space-y-2.5 pt-2">
                {currentQuestion.options.map((optText, optIdx) => {
                  const isSelected = userAnswers[currentQuestion.id] === optIdx;
                  const isCorrect = isCompleted && currentQuestion.answer === optIdx;
                  const isWrong = isCompleted && isSelected && !isCorrect;

                  let cardStyle = 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900';
                  if (isSelected && !isCompleted) {
                    cardStyle = 'border-blue-600 dark:border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 ring-1 ring-blue-600';
                  } else if (isCorrect) {
                    cardStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-500 font-bold';
                  } else if (isWrong) {
                    cardStyle = 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 ring-1 ring-rose-500 line-through';
                  }

                  const optLetter = String.fromCharCode(65 + optIdx);

                  return (
                    <div
                      key={optIdx}
                      onClick={() => handleSelectOption(currentQuestion.id, optIdx)}
                      className={`p-3 rounded-lg border flex items-start gap-3 transition-all ${
                        isCompleted ? 'cursor-default' : 'cursor-pointer'
                      } ${cardStyle}`}
                    >
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5 ${
                        isSelected && !isCompleted
                          ? 'bg-blue-600 text-white'
                          : isCorrect
                          ? 'bg-emerald-600 text-white'
                          : isWrong
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        {optLetter}
                      </span>
                      <span className="text-xs sm:text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: optText }} />
                    </div>
                  );
                })}
              </div>

              {/* Lời giải chi tiết khi hoàn thành bài thi */}
              {isCompleted && currentQuestion.explanationVi && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg text-xs leading-relaxed text-blue-900 dark:text-blue-200 space-y-1">
                  <span className="font-bold flex items-center gap-1 text-blue-800 dark:text-blue-300">
                    <Info className="w-3.5 h-3.5" /> Giải thích chi tiết:
                  </span>
                  <div dangerouslySetInnerHTML={{ __html: currentQuestion.explanationVi }} />
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs font-mono">
              Chưa có câu hỏi nào trong phần này.
            </div>
          )}

          {/* Navigation Buttons: Previous / Next */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-6 flex items-center justify-between">
            <button
              type="button"
              disabled={activeQuestionIdx === 0 && activeTaskIdx === 0}
              onClick={() => {
                if (activeQuestionIdx > 0) {
                  setActiveQuestionIdx(activeQuestionIdx - 1);
                } else if (activeTaskIdx > 0) {
                  const prevTask = currentSection?.tasks[activeTaskIdx - 1];
                  setActiveTaskIdx(activeTaskIdx - 1);
                  setActiveQuestionIdx((prevTask?.questions?.length || 1) - 1);
                }
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Câu Trước
            </button>

            <button
              type="button"
              disabled={activeQuestionIdx === currentQuestions.length - 1 && activeTaskIdx === (currentSection?.tasks.length || 1) - 1}
              onClick={() => {
                if (activeQuestionIdx < currentQuestions.length - 1) {
                  setActiveQuestionIdx(activeQuestionIdx + 1);
                } else if (activeTaskIdx < (currentSection?.tasks.length || 1) - 1) {
                  setActiveTaskIdx(activeTaskIdx + 1);
                  setActiveQuestionIdx(0);
                }
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-medium hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none"
            >
              Câu Kế Tiếp <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── QUESTION PALETTE MATRIX DRAWER / MODAL ── */}
      {paletteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg max-w-2xl w-full max-h-[85vh] flex flex-col shadow-xl">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  Bảng Điều Hướng Câu Hỏi Toàn Diện
                </h3>
                <p className="text-xs text-slate-500">Nhấp vào số câu để chuyển ngay lập tức.</p>
              </div>
              <button
                type="button"
                onClick={() => setPaletteOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            {/* Trạng thái màu ghi chú */}
            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 flex flex-wrap gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded border border-slate-300 bg-white" /> Chưa làm
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-slate-800 text-white" /> Đã trả lời
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded border-2 border-blue-600 bg-white" /> Đang xem
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded border border-amber-400 bg-amber-50" /> Gắn cờ (Flag)
              </span>
            </div>

            {/* Grid câu hỏi */}
            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              {currentExam?.sections.map((sec, sIdx) => {
                const sectionQuestions = allFlattenedQuestions.filter((item) => item.sectionIdx === sIdx);
                if (sectionQuestions.length === 0) return null;

                return (
                  <div key={sec.type} className="space-y-2">
                    <span className="text-xs font-mono font-bold uppercase text-slate-500 block">
                      {sec.label} ({sectionQuestions.length} câu)
                    </span>
                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                      {sectionQuestions.map((item) => {
                        const isCurrent =
                          activeSectionIdx === item.sectionIdx &&
                          activeTaskIdx === item.taskIdx &&
                          activeQuestionIdx === item.qIdx;
                        const isAnswered = typeof userAnswers[item.q.id] === 'number';
                        const isFlagged = flaggedQuestionIds.has(item.q.id);

                        let btnClass = 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
                        if (isCurrent) {
                          btnClass = 'ring-2 ring-blue-600 font-bold bg-white text-blue-700';
                        } else if (isFlagged) {
                          btnClass = 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-400 font-semibold';
                        } else if (isAnswered) {
                          btnClass = 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 font-semibold';
                        }

                        return (
                          <button
                            key={item.q.id}
                            type="button"
                            onClick={() => jumpToQuestion(item.sectionIdx, item.taskIdx, item.qIdx)}
                            className={`h-9 rounded border text-xs font-mono flex items-center justify-center transition-all ${btnClass}`}
                          >
                            {item.globalNumber}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 border-t border-slate-100 dark:border-slate-800 text-right">
              <button
                type="button"
                onClick={() => setPaletteOpen(false)}
                className="px-4 py-1.5 rounded text-xs font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900"
              >
                Đóng Bảng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL XÁC NHẬN NỘP BÀI (SUBMIT CONFIRMATION) ── */}
      {submitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Xác Nhận Nộp Bài Khảo Thí VSTEP
            </h3>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded">
                <span className="text-slate-500">Tổng số câu trắc nghiệm:</span>
                <span className="font-bold text-slate-900 dark:text-white">{allFlattenedQuestions.length} câu</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded text-emerald-700 dark:text-emerald-300">
                <span>Số câu đã trả lời:</span>
                <span className="font-bold">{Object.keys(userAnswers).length} câu</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-rose-50 dark:bg-rose-950/40 rounded text-rose-700 dark:text-rose-300">
                <span>Số câu chưa làm:</span>
                <span className="font-bold">{allFlattenedQuestions.length - Object.keys(userAnswers).length} câu</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-amber-50 dark:bg-amber-950/40 rounded text-amber-700 dark:text-amber-300">
                <span>Số câu đang gắn cờ (Flag):</span>
                <span className="font-bold">{flaggedQuestionIds.size} câu</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Bạn có chắc chắn muốn nộp bài? Sau khi nộp, hệ thống sẽ chấm điểm và hiển thị kết quả quy đổi CEFR B1/B2/C1.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSubmitModalOpen(false)}
                className="px-3.5 py-1.5 rounded text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
              >
                Tiếp Tục Làm Bài
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={submitExam}
                className="px-4 py-1.5 rounded text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5"
              >
                {isSubmitting ? 'Đang Chấm...' : 'Xác Nhận Nộp'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VstepExamPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-mono text-slate-500">Đang khởi tạo phòng thi máy tính VSTEP...</p>
          </div>
        </div>
      }
    >
      <VstepExamPageInner />
    </React.Suspense>
  );
}
