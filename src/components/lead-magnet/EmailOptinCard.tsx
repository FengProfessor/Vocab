'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Mail,
  User,
  PhoneCall,
  Target,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  BookOpen,
  Headphones,
  Download,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface EmailOptinCardProps {
  initialTarget?: string;
  onReadOnline?: () => void;
  className?: string;
  diagnosticScore?: number | null;
  dimensionScores?: Record<number, number>;
  userEmail?: string;
  userFullName?: string;
  onUserEmailChange?: (email: string) => void;
  onUserFullNameChange?: (name: string) => void;
}

export default function EmailOptinCard({
  initialTarget = '800 - 900+ Điểm',
  onReadOnline,
  className = '',
  diagnosticScore = null,
  dimensionScores = {},
  userEmail = '',
  userFullName = '',
  onUserEmailChange,
  onUserFullNameChange,
}: EmailOptinCardProps) {
  const [internalEmail, setInternalEmail] = useState('');
  const [internalFullName, setInternalFullName] = useState('');
  const email = userEmail || internalEmail;
  const fullName = userFullName || internalFullName;

  const [phone, setPhone] = useState('');
  const [currentScore, setCurrentScore] = useState('500 - 650 điểm (Kẹt plateau)');
  const [targetScore, setTargetScore] = useState(initialTarget);
  const [hp, setHp] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [promoCode, setPromoCode] = useState('SATTHUTOEIC');
  const [downloadUrl, setDownloadUrl] = useState('/api/lead-magnet/download');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !email.includes('@')) {
      setErrorMsg('Vui lòng nhập địa chỉ Email hợp lệ để nhận ấn phẩm.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/lead-magnet/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          fullName,
          phone,
          currentScore,
          targetScore,
          diagnosticScore: diagnosticScore ?? null,
          dimensionScores: dimensionScores ?? {},
          hp,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPromoCode(data.promoCode || 'SATTHUTOEIC');
        if (data.downloadUrl) setDownloadUrl(data.downloadUrl);
        setIsSuccess(true);
        try {
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 },
          });
        } catch {}
      } else {
        setErrorMsg(data.error || 'Có lỗi xảy ra khi gửi thông tin. Vui lòng thử lại.');
      }
    } catch {
      // Offline fallback
      setIsSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(promoCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      className={`rounded-3xl border border-indigo-500/30 bg-slate-900/90 backdrop-blur-xl p-5 sm:p-8 shadow-2xl relative overflow-hidden ${className}`}
    >
      {/* Background glow accent */}
      <div className="absolute top-0 right-0 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      {!isSuccess ? (
        <form onSubmit={handleSubmit} className="relative z-10 space-y-4 sm:space-y-5">
          <div className="border-b border-slate-800 pb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Ấn Phẩm Khảo Thí 2026 — Hoàn Toàn Miễn Phí
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Tải Trọn Bộ Ebook Sát Thủ Bài Nghe TOEIC
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Nhận ngay file ấn phẩm (15 chiều không gian + Từ điển 150 cụm từ tần suất cao ETS 2024-2026) cùng mã trải nghiệm VIP Pro trên LingoPro.
            </p>

            {diagnosticScore !== null && diagnosticScore !== undefined && (
              <div className="mt-3 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>
                  Đã liên kết điểm bài test chẩn đoán: <strong className="text-white font-mono">{diagnosticScore}/30 điểm</strong>
                </span>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs sm:text-sm">
              {errorMsg}
            </div>
          )}

          {/* Email input (required) */}
          <div className="space-y-1.5">
            <label className="text-xs sm:text-sm font-semibold text-slate-300 flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-indigo-400" /> Địa chỉ Email của bạn <span className="text-rose-400">*</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => {
                setInternalEmail(e.target.value);
                onUserEmailChange?.(e.target.value);
              }}
              placeholder="example@gmail.com"
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            />
          </div>

          {/* Name and Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-semibold text-slate-300 flex items-center gap-1.5">
                <User className="w-4 h-4 text-indigo-400" /> Họ và tên (hoặc biệt danh)
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => {
                  setInternalFullName(e.target.value);
                  onUserFullNameChange?.(e.target.value);
                }}
                placeholder="Ví dụ: Nguyễn Minh"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-semibold text-slate-300 flex items-center gap-1.5">
                <PhoneCall className="w-4 h-4 text-emerald-400" /> Số điện thoại / Zalo (Tùy chọn)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="09xx... (nhận tài liệu qua Zalo)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {/* Score targets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-semibold text-slate-300">
                Mức điểm hiện tại của bạn
              </label>
              <select
                value={currentScore}
                onChange={(e) => setCurrentScore(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition"
              >
                <option value="Mất gốc hoàn toàn (< 400)">Mất gốc hoàn toàn (&lt; 400)</option>
                <option value="450 - 550 điểm">450 – 550 điểm</option>
                <option value="550 - 650 điểm (Kẹt plateau)">550 – 650 điểm (Kẹt plateau)</option>
                <option value="650 - 750 điểm">650 – 750 điểm</option>
                <option value="Trên 750 điểm">Trên 750 điểm</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-semibold text-slate-300 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-rose-400" /> Mục tiêu điểm Listening
              </label>
              <select
                value={targetScore}
                onChange={(e) => setTargetScore(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition"
              >
                <option value="350 - 400 điểm Listening">350 – 400 điểm Listening</option>
                <option value="400 - 440 điểm Listening">400 – 440 điểm Listening</option>
                <option value="450 - 480 điểm Listening (Top 5%)">450 – 480 điểm (Top 5%)</option>
                <option value="490 - 495 điểm Listening Tuyệt Đối">490 – 495 điểm Tuyệt Đối</option>
              </select>
            </div>
          </div>

          {/* Honeypot field */}
          <div className="hidden" aria-hidden="true" style={{ display: 'none' }}>
            <label htmlFor="lead-magnet-hp">Website</label>
            <input
              id="lead-magnet-hp"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={hp}
              onChange={(e) => setHp(e.target.value)}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-5 rounded-xl font-black text-sm sm:text-base text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 hover:opacity-95 shadow-xl shadow-emerald-500/20 active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Đang xử lý tải tài liệu...</span>
            ) : (
              <>
                <span>NHẬN NGAY EBOOK SÁT THỦ TOEIC (MIỄN PHÍ)</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Không spam. Bản quyền LingoPro &amp; Hội đồng Thẩm định Khảo thí.
          </div>
        </form>
      ) : (
        /* Success Screen */
        <div className="relative z-10 space-y-6 text-center animate-in fade-in zoom-in-95 duration-300 py-2">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400 shadow-inner">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl sm:text-2xl font-black text-white">
              Đăng Ký Thành Công! Chúc Mừng Bạn 🎉
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
              Ấn phẩm <span className="text-emerald-400 font-bold">Bách Khoa Sát Thủ Bài Nghe TOEIC ETS 2024-2026</span> đã sẵn sàng.
            </p>
          </div>

          {/* Action buttons: Download PDF vs Read Online */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto pt-1">
            <a
              href="/api/lead-magnet/download?format=pdf"
              download
              className="py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <Download className="w-4 h-4" />
              <span>TẢI EBOOK (BẢN PDF)</span>
            </a>

            {onReadOnline && (
              <button
                type="button"
                onClick={onReadOnline}
                className="py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-indigo-600 hover:bg-indigo-500 transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>ĐỌC TRỰC TUYẾN NGAY</span>
              </button>
            )}
          </div>

          <div className="text-center">
            <a
              href="/api/lead-magnet/download?format=md"
              download
              className="text-xs text-slate-400 hover:text-slate-200 underline transition"
            >
              Tải bản Markdown thô (.MD) thay vì PDF
            </a>
          </div>

          {/* Promo code box */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/40 max-w-sm mx-auto flex items-center justify-between gap-3 text-left">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                Mã trải nghiệm VIP Pro
              </span>
              <span className="text-lg sm:text-xl font-mono font-black text-emerald-300 tracking-wider">
                {promoCode}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyCode}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold hover:bg-emerald-500/30 transition flex items-center gap-1 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Đã sao chép
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Sao chép
                </>
              )}
            </button>
          </div>

          {/* Direct CTA links to LingoPro practice */}
          <div className="pt-2 border-t border-slate-800 max-w-md mx-auto flex flex-col sm:flex-row gap-2.5">
            <Link
              href="/toeic"
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center justify-center gap-1.5"
            >
              <Headphones className="w-3.5 h-3.5 text-indigo-400" />
              <span>Thi Thử 20 Đề ETS 2026</span>
            </Link>

            <Link
              href="/practice/listening"
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Luyện FSRS Focus Player</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
