'use client';

/**
 * Trang Bài thi Tốt nghiệp Cấp độ (Capstone Level Exit Exam)
 * Hỗ trợ các cấp: A0, A1, A2, B1, B2, lop-10, lop-11, lop-12.
 * Bộ 25-30 câu hỏi chuẩn hóa toàn diện theo exit-standards-v1.json.
 * Ngưỡng đạt: strictly >= 80%.
 * Trao huy hiệu tốt nghiệp, chứng nhận digital và mở khóa cấp độ tiếp theo.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  GraduationCap,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Award,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { authFetch } from '@/lib/auth-fetch';
import {
  evaluateDiagnostic,
  getDiagnosticStorageKey,
  type DiagnosticReport,
} from '@/lib/roadmap-assessment';
import { getExitStandard } from '@/lib/roadmap-client';
import {
  generateExitExamQuestions,
  GRADUATION_BADGES,
} from '@/components/journey/assessment/LevelExitExamModal';
import { DiagnosticReportCard } from '@/components/journey/assessment/DiagnosticReportCard';

export default function LevelExitExamPage() {
  const { levelId } = useParams<{ levelId: string }>();
  const router = useRouter();

  const exitStd = useMemo(() => getExitStandard(levelId), [levelId]);
  const badgeInfo = GRADUATION_BADGES[levelId] || {
    id: `badge_${levelId?.replace('-', '')}_graduate`,
    name: `Tốt nghiệp ${exitStd?.labelVi || levelId}`,
    icon: '🏆',
    nextLevel: levelId,
    nextLevelLabel: 'Cấp độ tiếp theo',
  };

  const questions = useMemo(() => generateExitExamQuestions(levelId), [levelId]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [finished, setFinished] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [report, setReport] = useState<DiagnosticReport | null>(null);

  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;

  const handleSelectOption = (opt: string) => {
    if (finished || !currentQ) return;
    setAnswers((prev) => ({ ...prev, [currentQ.id]: opt }));
  };

  // Nộp bài thi tốt nghiệp
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const isThpt = levelId.startsWith('lop-');
      const evalReport = evaluateDiagnostic({
        questions,
        answers,
        metadata: {
          stepId: `se-${levelId}-exit`,
          targetId: levelId,
          type: 'exit_exam',
          passThresholdPct: 80,
          track: isThpt ? 'thpt' : 'cefr',
          levelId,
        },
      });

      setReport(evalReport);
      setFinished(true);

      // Lưu kết quả vào /api/roadmap/assessment
      await authFetch('/api/roadmap/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetId: levelId,
          stepId: `se-${levelId}-exit`,
          tier: 'exit_exam',
          track: isThpt ? 'thpt' : 'cefr',
          score: evalReport.scorePct,
          passed: evalReport.passed,
          details: evalReport,
        }),
      });

      // Lưu cache offline vào localStorage
      try {
        const cacheKey = getDiagnosticStorageKey('current', `exit_${levelId}`);
        localStorage.setItem(cacheKey, JSON.stringify(evalReport));
      } catch {
        /* ignore */
      }

      if (evalReport.passed) {
        toast.success(`Chúc mừng! Bạn đạt ${evalReport.scorePct}% và đã tốt nghiệp cấp ${levelId}!`);
      } else {
        toast.error(`Bạn đạt ${evalReport.scorePct}%. Cần đạt ≥ 80% để tốt nghiệp cấp độ.`);
      }
    } catch (err) {
      console.error('[ExitExamPage] Submit error:', err);
      toast.error('Có lỗi khi lưu kết quả bài thi. Vui lòng thử lại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setFinished(false);
    setCurrentIndex(0);
    setAnswers({});
    setReport(null);
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation Header */}
        <div className="flex items-center justify-between">
          <Link href="/journey">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
              <ArrowLeft className="w-4 h-4" /> Về lộ trình
            </Button>
          </Link>
          <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4 text-primary" />
            {exitStd ? exitStd.labelVi : `Cấp độ ${levelId}`}
          </span>
        </div>

        {/* Header Title */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {finished
              ? report?.passed
                ? '🎓 CHỨNG NHẬN TỐT NGHIỆP CẤP ĐỘ'
                : 'Báo cáo Đánh giá Năng lực Tốt nghiệp'
              : `Bài thi Tốt nghiệp: ${exitStd ? exitStd.labelVi : levelId}`}
          </h1>
          <p className="text-sm text-muted-foreground">
            {finished
              ? 'Tổng kết năng lực theo chuẩn Khung năng lực đầu ra'
              : `Bộ câu hỏi đánh giá chuẩn hóa toàn diện (${questions.length} câu) · Ngưỡng tốt nghiệp ≥ 80%`}
          </p>
        </div>

        {/* ── MÀN HÌNH ĐANG LÀM BÀI ── */}
        {!finished && currentQ && (
          <div className="space-y-6">
            {/* Thanh tiến trình */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Câu hỏi <b>{currentIndex + 1}</b> / {questions.length}
                </span>
                <span>
                  Đã làm: <b>{answeredCount}</b>/{questions.length} câu
                </span>
              </div>
              <div className="w-full bg-muted h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{ width: `${(answeredCount / questions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Bảng ma trận các câu hỏi */}
            <div className="flex flex-wrap gap-1.5 p-3 bg-muted/40 rounded-2xl border">
              {questions.map((q, idx) => {
                const isAnswered = answers[q.id] !== undefined;
                const isCurrent = idx === currentIndex;
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-8 h-8 text-xs font-semibold rounded-lg transition-all flex items-center justify-center ${
                      isCurrent
                        ? 'ring-2 ring-primary ring-offset-1 bg-primary text-white shadow-xs'
                        : isAnswered
                        ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300'
                        : 'bg-card border text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Thẻ câu hỏi hiện tại */}
            <div className="p-6 rounded-2xl border bg-card space-y-5 shadow-sm">
              <div className="flex items-center justify-between text-xs">
                <span className="px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-primary/10 text-primary">
                  {currentQ.skill === 'vocab'
                    ? 'Từ vựng'
                    : currentQ.skill === 'grammar'
                    ? 'Ngữ pháp'
                    : currentQ.skill === 'pronunciation'
                    ? 'Phát âm'
                    : 'Đọc hiểu'}
                </span>
                <span className="text-muted-foreground font-medium">
                  {currentQ.conceptName}
                </span>
              </div>

              <h2 className="text-lg font-bold leading-relaxed text-foreground">
                {currentQ.prompt}
              </h2>

              {/* Lựa chọn đáp án */}
              <div className="grid gap-3 pt-1">
                {(currentQ.options ?? []).map((opt) => {
                  const isSelected = answers[currentQ.id] === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleSelectOption(opt)}
                      className={`w-full text-left p-4 rounded-xl border text-sm transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary font-semibold shadow-xs'
                          : 'border-muted hover:border-primary/40 hover:bg-muted/30'
                      }`}
                    >
                      <span>{opt}</span>
                      {isSelected && (
                        <CheckCircle2 className="w-5 h-5 text-primary shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Điều hướng câu hỏi */}
            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((i) => i - 1)}
                className="gap-1 text-xs"
              >
                <ArrowLeft className="w-4 h-4" /> Câu trước
              </Button>

              {currentIndex + 1 < questions.length ? (
                <Button
                  type="button"
                  onClick={() => setCurrentIndex((i) => i + 1)}
                  className="gap-1 text-xs"
                >
                  Câu tiếp theo <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => void handleSubmit()}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  <ShieldCheck className="w-4 h-4" /> Nộp bài thi tốt nghiệp
                </Button>
              )}
            </div>
          </div>
        )}

        {/* ── MÀN HÌNH TỐT NGHIỆP THÀNH CÔNG ── */}
        {finished && report && report.passed && (
          <div className="space-y-6">
            <div className="p-8 rounded-3xl border-2 border-amber-300 dark:border-amber-700 bg-linear-to-b from-amber-50/80 via-card to-amber-50/30 dark:from-amber-950/20 dark:to-card shadow-lg text-center space-y-5">
              <div className="w-20 h-20 rounded-full mx-auto bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-4xl shadow-inner border border-amber-300">
                {badgeInfo.icon}
              </div>

              <div className="space-y-1">
                <span className="text-xs uppercase font-extrabold tracking-widest text-amber-600 dark:text-amber-400">
                  Chứng Nhận Năng Lực Chuẩn Đầu Ra
                </span>
                <h2 className="text-2xl font-black text-foreground">
                  {badgeInfo.name}
                </h2>
                <p className="text-base font-bold text-primary">
                  Điểm số xuất sắc: {report.scorePct}% ({report.correctQuestions}/{report.totalQuestions} câu đúng)
                </p>
              </div>

              {/* Can-Do Standards */}
              {exitStd && exitStd.canDo && exitStd.canDo.length > 0 && (
                <div className="p-5 rounded-2xl bg-card border text-left space-y-2 mt-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Năng lực đã làm chủ (Can-Do Standards):
                  </span>
                  <ul className="grid gap-2 text-xs text-foreground/90">
                    {exitStd.canDo.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* CTA tiến lên cấp độ tiếp theo */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  type="button"
                  size="lg"
                  onClick={() => router.push(`/journey?level=${badgeInfo.nextLevel}`)}
                  className="w-full sm:w-auto gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-md"
                >
                  <Award className="w-4 h-4" /> Tiến lên {badgeInfo.nextLevelLabel}
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Link href="/journey">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Về Lộ trình học
                  </Button>
                </Link>
              </div>
            </div>

            {/* Báo cáo chẩn đoán chi tiết */}
            <DiagnosticReportCard
              report={report}
              isExitExam={true}
              onContinue={() => router.push('/journey')}
            />
          </div>
        )}

        {/* ── MÀN HÌNH CHƯA ĐẠT CHUẨN TỐT NGHIỆP (<80%) ── */}
        {finished && report && !report.passed && (
          <div className="space-y-6">
            <DiagnosticReportCard
              report={report}
              isExitExam={true}
              onRetry={handleRetry}
              onContinue={() => router.push('/journey')}
            />
          </div>
        )}
      </div>
    </div>
  );
}