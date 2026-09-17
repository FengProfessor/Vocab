'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Gift, Download, BookOpen, CheckCircle2, ArrowRight, Loader2, Sparkles, Award } from 'lucide-react';
import confetti from 'canvas-confetti';

interface LeadMagnetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LeadMagnetModal({ isOpen, onClose }: LeadMagnetModalProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [targetGoal, setTargetGoal] = useState('Luyện thi TOEIC 650+');
  const [hp, setHp] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [resultData, setResultData] = useState<{
    downloadUrl: string;
    testUrl: string;
    voucherCode: string;
  } | null>(null);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMsg('Vui lòng nhập địa chỉ Email chính xác.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/challenge/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          targetGoal,
          challengeInterest: 'Modal quà tặng 0đ',
          hp,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitted(true);
        setResultData({
          downloadUrl: data.downloadUrl || '/resources/So-Tay-3000-Tu-Vung-LingoPro.pdf',
          testUrl: data.testUrl || '/toeic/exam',
          voucherCode: data.voucherCode || 'CHALLENGE50K',
        });

        try {
          confetti({
            particleCount: 70,
            spread: 60,
            origin: { y: 0.5 },
          });
        } catch {
          // ignore
        }
      } else {
        setErrorMsg(data.error || 'Có lỗi xảy ra. Vui lòng kiểm tra lại.');
      }
    } catch {
      setErrorMsg('Lỗi kết nối. Vui lòng thử lại sau giây lát.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-slate-900 border border-amber-500/40 rounded-[32px] p-6 sm:p-8 shadow-2xl text-white overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Top gradient stripe */}
        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
          aria-label="Đóng popup"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted && resultData ? (
          <div className="text-center py-4 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto">
              <Award className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-2xl font-black text-white">Quà Tặng Đã Sẵn Sàng!</h3>
              <p className="text-slate-300 text-sm mt-1">
                Chúc mừng bạn! Link tải sổ tay đã được gửi đến <strong>{email}</strong>.
              </p>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl text-left">
              <div className="text-xs uppercase tracking-wider text-amber-400 font-bold mb-1">
                Mã giảm 50.000đ khi đăng ký Thử Thách:
              </div>
              <div className="flex items-center justify-between font-mono">
                <span className="text-xl font-black text-yellow-300 tracking-widest">{resultData.voucherCode}</span>
                <span className="text-xs bg-amber-400 text-slate-950 font-bold px-2 py-0.5 rounded">Ưu đãi</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a
                href={resultData.downloadUrl}
                download="So-Tay-3000-Tu-Vung-LingoPro.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-orange-500 hover:to-orange-600 text-white font-black py-3 px-4 rounded-xl shadow-lg uppercase text-xs tracking-wide"
              >
                <Download className="w-4 h-4" /> Tải Sổ Tay PDF
              </a>
              <a
                href={resultData.testUrl}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-4 rounded-xl border border-slate-700 text-xs"
              >
                Làm Test 5 Phút <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white text-xs"
            >
              Đóng cửa sổ
            </Button>
          </div>
        ) : (
          <div>
            {/* Header badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 font-extrabold text-[11px] uppercase tracking-wider mb-3">
              <Gift className="w-3.5 h-3.5 text-amber-400" />
              Quà Tặng 0đ Độc Quyền
            </div>

            <h3 className="text-2xl font-black text-white leading-tight mb-2">
              Nhận Ngay Sổ Tay 3000 Từ + Đề Test Miễn Phí!
            </h3>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-5">
              Đừng rời đi tay không! Hãy để lại thông tin để tải trọn bộ cẩm nang từ vựng phân loại theo 34 chủ đề bám sát đề thi ETS trị giá 299.000đ.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <input
                type="text"
                name="hp"
                value={hp}
                onChange={(e) => setHp(e.target.value)}
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
              />

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Họ và tên của bạn:
                </label>
                <Input
                  type="text"
                  required
                  placeholder="Ví dụ: Hoàng Thuỳ Linh"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-500 rounded-xl h-10 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email nhận tài liệu: <span className="text-red-400">*</span>
                </label>
                <Input
                  type="email"
                  required
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-500 rounded-xl h-10 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Số Zalo / SĐT (nhận link bài test &amp; audio):
                </label>
                <Input
                  type="tel"
                  placeholder="0912xxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-500 rounded-xl h-10 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Mục tiêu của bạn:
                </label>
                <select
                  value={targetGoal}
                  onChange={(e) => setTargetGoal(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl h-10 px-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="Luyện thi TOEIC 650+">Luyện thi TOEIC 650+ (Đi làm / Ra trường)</option>
                  <option value="Chuẩn bị thi VSTEP / B1 - B2">Chuẩn bị thi VSTEP / B1 - B2</option>
                  <option value="Xoá mù tiếng Anh, học lại từ đầu">Xoá mù tiếng Anh, học lại từ đầu</option>
                  <option value="Giao tiếp văn phòng & đọc viết email">Giao tiếp văn phòng &amp; đọc viết email</option>
                </select>
              </div>

              {errorMsg && (
                <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 text-xs">
                  {errorMsg}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white font-black text-sm rounded-xl uppercase tracking-wider shadow-lg shadow-orange-950/50 transition-transform active:scale-98 mt-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang chuẩn bị file...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-1.5" /> Nhận Tài Liệu Ngay (0đ)
                  </>
                )}
              </Button>
            </form>

            <div className="mt-4 pt-3 border-t border-slate-800 text-center">
              <span className="text-[11px] text-slate-400">
                ⚡ Tự động gửi link tải PDF + Audio phát âm ngay khi bấm đăng ký.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
