'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  CheckCircle2,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  HelpCircle,
} from 'lucide-react';
import {
  DIMENSIONS_15,
  DIAGNOSTIC_TIERS,
  type DimensionItem,
  type DiagnosticTier,
} from '@/data/sat-thu-toeic-listening-data';
import confetti from 'canvas-confetti';

const STORAGE_KEY = 'lingopro_diagnostic_15d_scores';

interface DiagnosticScorecardProps {
  onScoreCalculated?: (score: number, dimensionScores: Record<number, number>) => void;
  onOpenOptin?: () => void;
  userEmail?: string;
  userFullName?: string;
  onUserEmailChange?: (email: string) => void;
  onUserFullNameChange?: (name: string) => void;
}

export default function DiagnosticScorecard({
  onScoreCalculated,
  onOpenOptin: _onOpenOptin,
  userEmail = '',
  userFullName = '',
  onUserEmailChange,
  onUserFullNameChange,
}: DiagnosticScorecardProps) {
  // Store score (0, 1, 2) for each dimension id (1..15)
  // Clean initial state, hydrated from localStorage on client mount
  const [scores, setScores] = useState<Record<number, number>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as Record<number, number>;
        if (typeof parsed === 'object' && parsed !== null) {
          return parsed;
        }
      }
    } catch {}
    return {};
  });

  const [expandedId, setExpandedId] = useState<number | null>(1);
  const [activeTab, setActiveTab] = useState<1 | 2 | 3>(1);

  // Email form state inside diagnostic card
  const [internalEmail, setInternalEmail] = useState('');
  const [internalFullName, setInternalFullName] = useState('');
  const email = userEmail || internalEmail;
  const fullName = userFullName || internalFullName;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Initial score callback notify
  useEffect(() => {
    const sum = Object.values(scores).reduce((acc, curr) => acc + (typeof curr === 'number' ? curr : 0), 0);
    if (sum > 0) {
      onScoreCalculated?.(sum, scores);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist scores whenever they change
  const updateScores = (newScores: Record<number, number>) => {
    setScores(newScores);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newScores));
    } catch {}
    const sum = Object.values(newScores).reduce((acc, curr) => acc + curr, 0);
    onScoreCalculated?.(sum, newScores);
  };

  // Total and breakdown calculations
  const answeredCount = Object.keys(scores).length;
  const totalScore = useMemo(() => {
    return Object.values(scores).reduce((acc, curr) => acc + curr, 0);
  }, [scores]);

  const block1Score = useMemo(() => {
    return [1, 2, 3, 4, 5].reduce((sum, id) => sum + (scores[id] ?? 0), 0);
  }, [scores]);

  const block2Score = useMemo(() => {
    return [6, 7, 8, 9, 10].reduce((sum, id) => sum + (scores[id] ?? 0), 0);
  }, [scores]);

  const block3Score = useMemo(() => {
    return [11, 12, 13, 14, 15].reduce((sum, id) => sum + (scores[id] ?? 0), 0);
  }, [scores]);

  const currentTier: DiagnosticTier = useMemo(() => {
    if (totalScore <= 15) return DIAGNOSTIC_TIERS[0];
    if (totalScore <= 24) return DIAGNOSTIC_TIERS[1];
    return DIAGNOSTIC_TIERS[2];
  }, [totalScore]);

  const handleSelectScore = (dimensionId: number, scoreVal: number) => {
    const next = { ...scores, [dimensionId]: scoreVal };
    updateScores(next);
  };

  const handleQuickPreset = (preset: 'stuck' | 'beginner' | 'master') => {
    let newScores: Record<number, number> = {};
    if (preset === 'beginner') {
      newScores = { 1: 0, 2: 0, 3: 1, 4: 0, 5: 0, 6: 0, 7: 0, 8: 1, 9: 0, 10: 1, 11: 0, 12: 0, 13: 0, 14: 0, 15: 0 };
    } else if (preset === 'stuck') {
      newScores = { 1: 1, 2: 1, 3: 2, 4: 1, 5: 1, 6: 1, 7: 0, 8: 1, 9: 1, 10: 2, 11: 1, 12: 1, 13: 1, 14: 0, 15: 1 };
    } else {
      newScores = { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2, 7: 2, 8: 2, 9: 2, 10: 2, 11: 2, 12: 2, 13: 2, 14: 2, 15: 2 };
    }
    updateScores(newScores);
  };

  const handleReset = () => {
    setScores({});
    setSavedSuccess(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    onScoreCalculated?.(0, {});
  };

  const handleSaveResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMsg('Vui lòng nhập Email hợp lệ để nhận kết quả.');
      return;
    }
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/lead-magnet/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          fullName,
          diagnosticScore: totalScore,
          dimensionScores: scores,
          targetScore: 'Bứt phá 450+ Listening',
          currentScore: answeredCount > 0 ? currentTier.scoreRange : 'Chưa test',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSavedSuccess(true);
        try {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {}
      } else {
        setErrorMsg(data.error || 'Có lỗi xảy ra, vui lòng thử lại.');
      }
    } catch {
      // Fallback
      setSavedSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredDimensions = useMemo(() => {
    return DIMENSIONS_15.filter((d) => d.block === activeTab);
  }, [activeTab]);

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-7 shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Công Cụ Khảo Thí Độc Quyền LingoPro
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Bảng Tự Chẩn Đoán Độ Nhạy Thính Giác 15 Chiều
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Chấm điểm từ 0 – 2 cho từng chiều để đo lường độ trễ phản xạ não bộ và phát hiện chính xác lỗ hổng kẹt điểm.
            </p>
          </div>

          {/* Quick preset pills */}
          <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
            <span className="text-[11px] text-slate-500 mr-1 hidden sm:inline">Thử nhanh:</span>
            <button
              type="button"
              onClick={() => handleQuickPreset('beginner')}
              className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition cursor-pointer"
            >
              Mất gốc (&lt;15đ)
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('stuck')}
              className="px-2.5 py-1 text-[11px] rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition cursor-pointer"
            >
              Kẹt 600-750 (18đ)
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('master')}
              className="px-2.5 py-1 text-[11px] rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition cursor-pointer"
            >
              Master 495 (30đ)
            </button>
            <button
              type="button"
              onClick={handleReset}
              title="Làm lại từ đầu (xóa điểm)"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Score Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          {/* Total */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">Tổng điểm phản xạ</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl sm:text-3xl font-mono font-black text-indigo-400">
                {totalScore}
              </span>
              <span className="text-xs text-slate-500">/ 30</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Đã đánh giá {answeredCount}/15 chiều
            </div>
          </div>

          {/* Block 1 */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">Part 1 (Thị giác)</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl sm:text-2xl font-mono font-bold text-sky-400">{block1Score}</span>
              <span className="text-xs text-slate-500">/ 10</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-sky-400 h-full transition-all duration-300"
                style={{ width: `${(block1Score / 10) * 100}%` }}
              />
            </div>
          </div>

          {/* Block 2 */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">Part 2 (Hỏi - Đáp)</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl sm:text-2xl font-mono font-bold text-amber-400">{block2Score}</span>
              <span className="text-xs text-slate-500">/ 10</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-amber-400 h-full transition-all duration-300"
                style={{ width: `${(block2Score / 10) * 100}%` }}
              />
            </div>
          </div>

          {/* Block 3 */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">Part 3 &amp; 4 (Chuyên sâu)</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl sm:text-2xl font-mono font-bold text-purple-400">{block3Score}</span>
              <span className="text-xs text-slate-500">/ 10</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-purple-400 h-full transition-all duration-300"
                style={{ width: `${(block3Score / 10) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs for Blocks */}
      <div className="flex items-center gap-2 border-b border-slate-800 pt-4 pb-1 overflow-x-auto text-xs sm:text-sm font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab(1)}
          className={`px-4 py-2 rounded-xl transition whitespace-nowrap cursor-pointer ${
            activeTab === 1
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Khối 1: Part 1 (Chiều 1 - 5)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab(2)}
          className={`px-4 py-2 rounded-xl transition whitespace-nowrap cursor-pointer ${
            activeTab === 2
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Khối 2: Part 2 (Chiều 6 - 10)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab(3)}
          className={`px-4 py-2 rounded-xl transition whitespace-nowrap cursor-pointer ${
            activeTab === 3
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Khối 3: Part 3 &amp; 4 (Chiều 11 - 15)
        </button>
      </div>

      {/* Dimensions List */}
      <div className="divide-y divide-slate-800/80 my-4">
        {filteredDimensions.map((dim: DimensionItem) => {
          const currentVal = scores[dim.id];
          const isExpanded = expandedId === dim.id;

          return (
            <div key={dim.id} className="py-4 first:pt-2 last:pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div
                  className="flex-1 cursor-pointer select-none"
                  onClick={() => setExpandedId(isExpanded ? null : dim.id)}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-indigo-400 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                      Chiều {dim.id}
                    </span>
                    <h3 className="font-bold text-sm sm:text-base text-white hover:text-indigo-300 transition">
                      {dim.nameVi}
                    </h3>
                    <span className="text-[11px] text-slate-500 font-mono hidden md:inline">
                      ({dim.codeName})
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                    {dim.auditQuestion.prompt}
                  </p>
                </div>

                {/* Score Option Buttons (0, 1, 2) */}
                <div className="flex items-center gap-1.5 self-start sm:self-center flex-shrink-0">
                  {dim.auditQuestion.options.map((opt) => {
                    const isSelected = currentVal === opt.score;
                    let activeStyles = 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 border-slate-700/60';
                    if (isSelected) {
                      if (opt.score === 0) activeStyles = 'bg-rose-500/20 text-rose-300 border-rose-500 font-bold ring-1 ring-rose-500/40';
                      else if (opt.score === 1) activeStyles = 'bg-amber-500/20 text-amber-300 border-amber-500 font-bold ring-1 ring-amber-500/40';
                      else activeStyles = 'bg-emerald-500/20 text-emerald-300 border-emerald-500 font-bold ring-1 ring-emerald-500/40';
                    }

                    return (
                      <button
                        key={opt.score}
                        type="button"
                        onClick={() => handleSelectScore(dim.id, opt.score)}
                        className={`px-3 py-1.5 rounded-xl border text-xs transition flex items-center gap-1.5 cursor-pointer ${activeStyles}`}
                      >
                        <span className="font-mono font-bold">{opt.score}đ</span>
                        <span className="text-[10px] hidden sm:inline">
                          {opt.score === 0 ? 'Bị bẫy' : opt.score === 1 ? 'Chậm' : 'Phản xạ'}
                        </span>
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : dim.id)}
                    className="p-1 text-slate-500 hover:text-slate-300 transition ml-1 cursor-pointer"
                    aria-label="Xem chi tiết"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Accordion Deep Dive */}
              {isExpanded && (
                <div className="mt-3 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3 text-xs sm:text-sm animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <span className="text-slate-500 font-semibold uppercase tracking-wider block">
                        Bản chất Bẫy ETS
                      </span>
                      <p className="text-slate-300">{dim.trapDetail}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-500 font-semibold uppercase tracking-wider block">
                        Dẫn chứng Thực tế
                      </span>
                      <p className="text-emerald-300 font-mono bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/20">
                        {dim.examProof}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-indigo-300">
                    <span className="font-semibold">⚡ {dim.reflexRule}</span>
                    <span className="text-[11px] text-slate-500 font-mono">{dim.etsShift}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Live Diagnostic Result Card */}
      <div className="mt-6 p-5 sm:p-7 rounded-2xl bg-slate-950 border-2 border-indigo-500/40 shadow-xl space-y-5">
        {answeredCount === 0 ? (
          <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-start gap-3 text-slate-300 text-xs sm:text-sm">
            <HelpCircle className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-white text-sm">Chưa có kết quả chẩn đoán</h4>
              <p className="mt-1 text-slate-400">
                Hãy bấm chọn mức phản xạ (0đ: Bị bẫy / 1đ: Chậm / 2đ: Phản xạ) cho từng chiều ở các tab bên trên, hoặc bấm <strong>&quot;Thử nhanh&quot;</strong> ở góc phải trên để xem kịch bản mẫu.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  Kết Quả Chẩn Đoán Của Bạn
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-3xl sm:text-4xl font-black font-mono text-white">
                    {totalScore} <span className="text-base text-slate-500 font-normal">/ 30 Điểm</span>
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${currentTier.badgeColor}`}>
                    {currentTier.scoreRange}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {answeredCount === 15 ? '✔ Đã hoàn thành 15/15 chiều' : `Đang đánh giá ${answeredCount}/15 chiều (còn ${15 - answeredCount} chiều)`}
                </span>
              </div>

              <div className="text-left sm:text-right">
                <h4 className="text-base sm:text-lg font-bold text-white">{currentTier.title}</h4>
                <span className="text-xs text-slate-400">
                  {totalScore <= 15 ? 'Cần thanh lọc tư duy cơ học' : totalScore <= 24 ? 'Kẹt tại bình nguyên ETS' : 'Làm chủ phản xạ 15 chiều'}
                </span>
              </div>
            </div>

            {/* Diagnostic Explanation */}
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {currentTier.description}
            </p>

            {/* Personalized Recommendations */}
            <div className="space-y-2.5">
              <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Lộ trình khắc phục ưu tiên dành riêng cho bạn:
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                {currentTier.recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-2"
                  >
                    <span className="w-5 h-5 rounded-md bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-mono font-bold flex-shrink-0 text-[11px]">
                      {idx + 1}
                    </span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Opt-in to email full results & Master Ebook */}
        {!savedSuccess ? (
          <form
            onSubmit={handleSaveResult}
            className="pt-4 border-t border-slate-800 space-y-3"
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={fullName}
                onChange={(e) => {
                  setInternalFullName(e.target.value);
                  onUserFullNameChange?.(e.target.value);
                }}
                placeholder="Họ tên của bạn"
                className="w-full sm:w-1/3 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder:text-slate-500 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition"
              />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setInternalEmail(e.target.value);
                  onUserEmailChange?.(e.target.value);
                }}
                placeholder="Nhập Email để nhận Ebook 6 Phần & Báo Cáo Chi Tiết"
                className="w-full sm:w-2/3 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder:text-slate-500 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-300 hover:opacity-95 transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Đang lưu...</span>
                ) : (
                  <>
                    <span>NHẬN BÁO CÁO &amp; EBOOK</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
            {errorMsg && <p className="text-xs text-rose-400">{errorMsg}</p>}
            <p className="text-[11px] text-slate-500 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              LingoPro cam kết bảo mật thông tin. Bạn sẽ nhận được bản PDF/Markdown hoàn chỉnh qua email.
            </p>
          </form>
        ) : (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span>
                Đã lưu kết quả bài test ({totalScore}/30)! Bạn có thể tải ngay Ebook trọn bộ bên dưới.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="/api/lead-magnet/download?format=pdf"
                download
                className="px-4 py-2 rounded-xl bg-emerald-400 text-slate-950 font-bold text-xs hover:bg-emerald-300 transition flex items-center gap-1.5 whitespace-nowrap"
              >
                <span>TẢI EBOOK (BẢN PDF)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
              <a
                href="/api/lead-magnet/download?format=md"
                download
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs hover:bg-slate-800 transition"
                title="Tải bản Markdown thô"
              >
                <span>Bản .MD</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
