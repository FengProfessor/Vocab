'use client';

/**
 * DiagnosticReportCard
 * Rich diagnostic feedback card presenting comprehensive assessment results:
 * - Overall score % and pass/fail badge (threshold >= 80%)
 * - Multi-dimensional skill breakdown bars: Từ vựng, Ngữ pháp, Phát âm, Đọc hiểu
 * - Granular weak concept list (user answer vs correct answer + explanation)
 * - Direct 1-click remedial deep-links back to review nodes
 * - Action buttons: "Học lại phần yếu", "Làm lại bài kiểm tra", "Tiếp tục lộ trình"
 */
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  type DiagnosticReport,
  type AssessmentSkill,
  type RemedialRecommendation,
  type WeakConcept,
} from '@/lib/roadmap-assessment';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  BookOpen,
  Sparkles,
  GraduationCap,
  Headphones,
  FileText,
  RotateCcw,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Award,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface DiagnosticReportCardProps {
  report: DiagnosticReport;
  onRetry?: () => void;
  onContinue?: () => void;
  onReviewWeakStep?: (stepId: string, url: string) => void;
  className?: string;
  isExitExam?: boolean;
}

const SKILL_CONFIG: Record<
  AssessmentSkill,
  { label: string; icon: React.ElementType; color: string; bg: string; barColor: string }
> = {
  vocab: {
    label: 'Từ vựng',
    icon: Sparkles,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    barColor: 'bg-amber-500',
  },
  grammar: {
    label: 'Ngữ pháp',
    icon: GraduationCap,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    barColor: 'bg-blue-500',
  },
  pronunciation: {
    label: 'Phát âm',
    icon: Headphones,
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    barColor: 'bg-purple-500',
  },
  reading: {
    label: 'Đọc hiểu',
    icon: FileText,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    barColor: 'bg-emerald-500',
  },
};

export function DiagnosticReportCard({
  report,
  onRetry,
  onContinue,
  onReviewWeakStep,
  className = '',
  isExitExam = false,
}: DiagnosticReportCardProps) {
  const router = useRouter();
  const [showAllWeakConcepts, setShowAllWeakConcepts] = useState(false);

  const {
    scorePct,
    passed,
    passThresholdPct,
    totalQuestions,
    correctQuestions,
    skills,
    weakConcepts = [],
    recommendations = [],
    summaryVi,
  } = report;

  // Xử lý 1-click ôn tập phần yếu nhất
  const handleReviewFirstWeak = () => {
    if (recommendations.length > 0) {
      const top = recommendations[0];
      if (onReviewWeakStep) {
        onReviewWeakStep(top.stepId, top.url);
      } else {
        router.push(top.url);
      }
    } else if (weakConcepts.length > 0) {
      const firstUrl = weakConcepts[0].sourceUrl;
      if (firstUrl) router.push(firstUrl);
    }
  };

  const visibleWeakConcepts = showAllWeakConcepts
    ? weakConcepts
    : weakConcepts.slice(0, 3);

  return (
    <div className={`w-full max-w-2xl mx-auto space-y-6 ${className}`}>
      {/* ── CARD HEADER: TỔNG QUAN KẾT QUẢ & HUY HIỆU ── */}
      <div className="p-6 rounded-2xl border bg-card shadow-sm text-center space-y-4">
        <div className="inline-flex items-center justify-center p-3 rounded-full bg-muted/60 mb-1">
          {passed ? (
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 text-3xl">
              🏁
            </div>
          ) : (
            <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 text-3xl">
              💪
            </div>
          )}
        </div>

        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
            {passed ? (
              <span className="bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                {isExitExam ? 'Tốt nghiệp Cấp độ Đạt chuẩn' : 'Vượt Chặng Thành Công'} (≥{passThresholdPct}%)
              </span>
            ) : (
              <span className="bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 px-3 py-1 rounded-full flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Cần Củng Cố Kiến Thức (Cần ≥{passThresholdPct}%)
              </span>
            )}
          </div>

          <h2 className="text-2xl font-extrabold tracking-tight">
            {passed
              ? isExitExam
                ? 'Chúc mừng! Bạn đã hoàn thành bài thi tốt nghiệp'
                : 'Chúc mừng! Bạn đã vượt qua Checkpoint'
              : 'Suýt nữa là đạt rồi! Cố lên nhé'}
          </h2>
          <p className="text-3xl font-black text-primary pt-1">
            {scorePct}%
            <span className="text-sm font-normal text-muted-foreground ml-2">
              ({correctQuestions}/{totalQuestions} câu chính xác)
            </span>
          </p>
        </div>

        <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
          {summaryVi}
        </p>
      </div>

      {/* ── MULTI-DIMENSIONAL SKILL BREAKDOWN BARS ── */}
      <div className="p-6 rounded-2xl border bg-card shadow-sm space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Award className="w-4 h-4 text-primary" /> Phân tích đa chiều kỹ năng
        </h3>

        <div className="grid gap-3 sm:grid-cols-2">
          {(Object.keys(SKILL_CONFIG) as AssessmentSkill[]).map((skillKey) => {
            const skillData = skills[skillKey];
            if (!skillData || skillData.total === 0) return null;
            const config = SKILL_CONFIG[skillKey];
            const Icon = config.icon;

            let statusBadge = {
              text: 'Cần củng cố',
              style: 'bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300',
            };
            if (skillData.status === 'mastered') {
              statusBadge = {
                text: 'Thành thạo',
                style: 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300',
              };
            } else if (skillData.status === 'adequate') {
              statusBadge = {
                text: 'Đạt chuẩn',
                style: 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300',
              };
            }

            return (
              <div
                key={skillKey}
                className={`p-4 rounded-xl border ${config.bg} space-y-2.5`}
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <Icon className={`w-4 h-4 ${config.color}`} />
                    <span>{config.label}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full font-medium text-[11px] ${statusBadge.style}`}
                  >
                    {statusBadge.text}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      Đúng {skillData.correct}/{skillData.total} câu
                    </span>
                    <span className="font-bold text-foreground">{skillData.pct}%</span>
                  </div>
                  <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${config.barColor}`}
                      style={{ width: `${skillData.pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 1-CLICK REMEDIAL RECOMMENDATIONS (GỢI Ý ÔN TẬP TRỌNG TÂM) ── */}
      {recommendations.length > 0 && (
        <div className="p-6 rounded-2xl border bg-card shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" /> Lộ trình khắc phục nhanh (1-Click Review)
            </h3>
            <span className="text-xs text-muted-foreground">
              {recommendations.length} bài học cần củng cố
            </span>
          </div>

          <div className="grid gap-3">
            {recommendations.map((rec, idx) => {
              const skillCfg = SKILL_CONFIG[rec.skill] || SKILL_CONFIG.vocab;
              const Icon = skillCfg.icon;

              return (
                <div
                  key={rec.stepId || idx}
                  className="p-4 rounded-xl border bg-card hover:border-primary/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded font-medium ${skillCfg.bg} ${skillCfg.color}`}>
                        <Icon className="w-3 h-3" />
                        {skillCfg.label}
                      </span>
                      <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                        Sai {rec.errorCount} câu
                      </span>
                    </div>
                    <h4 className="font-semibold text-sm text-foreground">
                      {rec.title}
                    </h4>
                    <p className="text-xs text-muted-foreground">{rec.reason}</p>
                  </div>

                  <Link href={rec.url} className="w-full sm:w-auto shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto gap-1.5 text-xs font-semibold hover:bg-primary hover:text-white"
                    >
                      Ôn tập ngay (~5-10 phút)
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── GRANULAR WEAK CONCEPTS LIST (CHI TIẾT CÂU HỎI LÀM SAI) ── */}
      {weakConcepts.length > 0 && (
        <div className="p-6 rounded-2xl border bg-card shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Chi tiết các câu cần lưu ý ({weakConcepts.length})
            </h3>
          </div>

          <div className="grid gap-3">
            {visibleWeakConcepts.map((item, idx) => {
              const skillCfg = SKILL_CONFIG[item.skill] || SKILL_CONFIG.vocab;
              return (
                <div
                  key={item.conceptRef + idx}
                  className="p-4 rounded-xl border bg-muted/30 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground text-sm">
                      {item.conceptName}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${skillCfg.bg} ${skillCfg.color}`}>
                      {skillCfg.label}
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-2 pt-1">
                    <div className="p-2.5 rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50/60 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200">
                      <span className="font-semibold block text-rose-700 dark:text-rose-400 mb-0.5">
                        Bạn đã chọn:
                      </span>
                      <span className="font-mono">{item.userChoice}</span>
                    </div>

                    <div className="p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200">
                      <span className="font-semibold block text-emerald-700 dark:text-emerald-400 mb-0.5">
                        Đáp án đúng:
                      </span>
                      <span className="font-mono font-semibold">{item.correctAnswer}</span>
                    </div>
                  </div>

                  {item.explanation && (
                    <div className="p-2.5 rounded-lg bg-card border text-muted-foreground leading-relaxed mt-1">
                      <span className="font-semibold text-foreground">Giải thích: </span>
                      {item.explanation}
                    </div>
                  )}

                  {item.sourceUrl && (
                    <div className="pt-1 flex justify-end">
                      <Link
                        href={item.sourceUrl}
                        className="text-primary hover:underline font-semibold inline-flex items-center gap-1 text-xs"
                      >
                        Mở bài học liên quan: {item.sourceStepTitle}
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {weakConcepts.length > 3 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllWeakConcepts((prev) => !prev)}
              className="w-full text-xs gap-1 text-muted-foreground"
            >
              {showAllWeakConcepts ? (
                <>
                  <ChevronUp className="w-4 h-4" /> Thu gọn danh sách
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" /> Xem thêm {weakConcepts.length - 3} câu cần củng cố
                </>
              )}
            </Button>
          )}
        </div>
      )}

      {/* ── ACTION BUTTONS ── */}
      <div className="p-6 rounded-2xl border bg-card shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        {!passed ? (
          <>
            {recommendations.length > 0 && (
              <Button
                type="button"
                variant="default"
                onClick={handleReviewFirstWeak}
                className="w-full sm:w-auto gap-2 bg-amber-600 hover:bg-amber-700 text-white"
              >
                <BookOpen className="w-4 h-4" /> Học lại phần yếu nhất
              </Button>
            )}
            {onRetry && (
              <Button
                type="button"
                variant="outline"
                onClick={onRetry}
                className="w-full sm:w-auto gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Làm lại bài kiểm tra
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              onClick={onContinue || (() => router.push('/journey'))}
              className="w-full sm:w-auto text-muted-foreground"
            >
              Tiếp tục lộ trình
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              variant="default"
              size="lg"
              onClick={onContinue || (() => router.push('/journey'))}
              className="w-full sm:w-auto gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              <CheckCircle2 className="w-5 h-5" /> Tiếp tục lộ trình & Nhận thưởng
            </Button>
            {onRetry && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="w-full sm:w-auto gap-1 text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Thử lại để đạt 100%
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}