'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookOpen, Headphones, CheckCircle2, Download, Sparkles, ArrowRight, Gift, Loader2, Award, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';

interface LeadMagnetSectionProps {
  onSuccessSubmitted?: () => void;
}

export function LeadMagnetSection({ onSuccessSubmitted }: LeadMagnetSectionProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [targetGoal, setTargetGoal] = useState('Luyện thi TOEIC 650+');
  const [hp, setHp] = useState(''); // Honeypot
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [resultData, setResultData] = useState<{
    downloadUrl: string;
    testUrl: string;
    voucherCode: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMsg('Vui lòng nhập địa chỉ Email chính xác để nhận tài liệu.');
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
          challengeInterest: 'Gói nhận tài liệu 0đ',
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

        // Trigger confetti celebration
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {
          // ignore confetti error if canvas-confetti is not loaded
        }

        if (onSuccessSubmitted) {
          onSuccessSubmitted();
        }
      } else {
        setErrorMsg(data.error || 'Có lỗi xảy ra. Vui lòng kiểm tra lại thông tin.');
      }
    } catch {
      setErrorMsg('Không thể kết nối máy chủ. Vui lòng thử lại sau giây lát.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="lead-magnet" className="py-24 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950 text-white relative overflow-hidden">
      {/* Decorative ambient lights */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 font-extrabold text-xs tracking-widest uppercase mb-4 shadow-sm">
            <Gift className="w-4 h-4 text-amber-400" />
            <span>Đặc Quyền Dành Cho Người Tự Học • Trị Giá 299.000đ</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-4 leading-tight">
            Chưa Sẵn Sàng Xuống Cọc?<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400">
              Nhận Ngay Sổ Tay 3000 Từ &amp; Đề Test 0đ
            </span>
          </h2>
          <p className="text-slate-300 text-base sm:text-lg">
            Nhận trọn bộ cẩm nang 3.000 từ vựng chia theo 3 chặng đột phá + bài test đánh giá vốn từ độc quyền của LingoPro để tự đánh giá năng lực ngay hôm nay!
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-10 items-center bg-slate-900/90 rounded-[36px] p-6 sm:p-10 lg:p-12 border border-indigo-500/30 shadow-2xl backdrop-blur-xl">
          {/* Left: Book Mockup & Value Highlights */}
          <div className="lg:col-span-6 space-y-6">
            {/* Visual Book Badge Card */}
            <div className="relative bg-gradient-to-br from-indigo-900/60 to-slate-900/90 p-6 rounded-3xl border border-indigo-400/30 shadow-inner">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-16 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg flex items-center justify-center text-white shrink-0 font-black text-2xl border-2 border-yellow-300/40">
                  <BookOpen className="w-7 h-7" />
                </div>
                <div>
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400">
                    Ebook PDF Chuẩn Oxford &amp; ETS
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                    Sổ Tay 3.000 Từ Vựng Trọng Tâm
                  </h3>
                  <div className="text-xs text-slate-300 font-medium">Bản cập nhật 2026 • Kèm Audio IPA &amp; Ví dụ ngữ cảnh</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-xs font-bold">
                <span className="bg-white/10 text-indigo-200 px-3 py-1 rounded-full border border-white/10">34 Chủ đề thực tế</span>
                <span className="bg-white/10 text-amber-200 px-3 py-1 rounded-full border border-white/10">Audio chuẩn US/UK</span>
                <span className="bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/30">100% Miễn Phí</span>
              </div>
            </div>

            {/* Quick Preview of What's Inside */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-xs">
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-300 mb-2.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Cấu trúc sổ tay 4 phần cô đọng:
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-300">
                <div className="bg-slate-950/60 p-2 rounded-lg border border-white/5">
                  <strong className="text-white block text-[11px]">Chặng 1: Nền tảng</strong>
                  <span className="text-[10px] text-slate-400">1.000 từ cơ bản (A2-B1)</span>
                </div>
                <div className="bg-slate-950/60 p-2 rounded-lg border border-white/5">
                  <strong className="text-white block text-[11px]">Chặng 2: Công sở</strong>
                  <span className="text-[10px] text-slate-400">1.000 từ TOEIC 650+</span>
                </div>
                <div className="bg-slate-950/60 p-2 rounded-lg border border-white/5">
                  <strong className="text-white block text-[11px]">Chặng 3: Bứt phá</strong>
                  <span className="text-[10px] text-slate-400">1.000 từ TOEIC 800+</span>
                </div>
                <div className="bg-slate-950/60 p-2 rounded-lg border border-white/5">
                  <strong className="text-white block text-[11px]">Bản cam kết kỷ luật</strong>
                  <span className="text-[10px] text-slate-400">In ra dán góc bàn học</span>
                </div>
              </div>
            </div>

            {/* Benefit List */}
            <ul className="space-y-3.5 text-sm sm:text-base text-slate-300">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span><strong>3.000 từ vựng tần suất cao nhất:</strong> Bao quát 80% từ vựng xuất hiện trong đề thi TOEIC và giao tiếp hằng ngày.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Headphones className="w-4 h-4" />
                </div>
                <span><strong>File Audio phát âm chuẩn IPA:</strong> Tự tin phát âm chuẩn Tây, không lo nói vấp hoặc phát âm sai trọng âm.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span><strong>Bài Test Đánh Giá Trình Độ (5 Phút):</strong> Biết chính xác số từ vựng bạn đang sở hữu và lộ trình cần học.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Zap className="w-4 h-4" />
                </div>
                <span><strong>Voucher 50.000đ độc quyền:</strong> Sử dụng để khấu trừ trực tiếp khi bạn sẵn sàng đăng ký Thử Thách Cam Kết.</span>
              </li>
            </ul>
          </div>

          {/* Right: High-Converting Opt-in Form or Success State */}
          <div className="lg:col-span-6 bg-slate-950 p-6 sm:p-8 rounded-3xl border border-indigo-500/40 shadow-2xl relative">
            {submitted && resultData ? (
              <div className="text-center py-6 space-y-5 animate-in fade-in zoom-in-95 duration-300">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto">
                  <Award className="w-8 h-8" />
                </div>

                <div>
                  <h3 className="text-2xl font-black text-white">Đăng Ký Thành Công!</h3>
                  <p className="text-slate-300 text-sm mt-1.5 max-w-md mx-auto">
                    Bộ tài liệu đã được cấp phép cho email <strong>{email}</strong>. Bạn có thể tải ngay bây giờ hoặc làm bài test đánh giá trình độ:
                  </p>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl text-left">
                  <div className="text-xs uppercase tracking-wider text-amber-400 font-bold mb-1">
                    Mã ưu đãi học phí dành riêng cho bạn:
                  </div>
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-xl font-black text-yellow-300 tracking-widest">{resultData.voucherCode}</span>
                    <span className="text-xs bg-amber-400 text-slate-950 font-bold px-2.5 py-1 rounded-md">Giảm 50.000đ</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <a
                    href={resultData.downloadUrl}
                    download="So-Tay-3000-Tu-Vung-LingoPro.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-orange-500 hover:to-orange-600 text-white font-black py-3.5 px-4 rounded-xl shadow-lg uppercase text-xs sm:text-sm tracking-wide transition-transform active:scale-95"
                  >
                    <Download className="w-4 h-4" /> Tải Sổ Tay PDF Ngay
                  </a>
                  <a
                    href={resultData.testUrl}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3.5 px-4 rounded-xl border border-slate-700 text-xs sm:text-sm transition-transform active:scale-95"
                  >
                    Làm Bài Test 5 Phút <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="mb-4">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                    Điền thông tin để nhận tài liệu tức thì
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                    Tải Miễn Phí Về Máy Trong 30 Giây
                  </h3>
                </div>

                {/* Honeypot field (hidden from real users) */}
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
                    placeholder="Ví dụ: Nguyễn Văn A"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 rounded-xl h-11"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Địa chỉ Email nhận tài liệu: <span className="text-red-400">*</span>
                  </label>
                  <Input
                    type="email"
                    required
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 rounded-xl h-11"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Số Zalo / Điện thoại (để nhận audio &amp; kết quả test):
                  </label>
                  <Input
                    type="tel"
                    placeholder="0987xxxxxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 rounded-xl h-11"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Mục tiêu hiện tại của bạn:
                  </label>
                  <select
                    value={targetGoal}
                    onChange={(e) => setTargetGoal(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl h-11 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <option value="Luyện thi TOEIC 650+">Luyện thi TOEIC 650+ (Đi làm / Ra trường)</option>
                    <option value="Chuẩn bị thi VSTEP / B1 - B2">Chuẩn bị thi VSTEP / B1 - B2</option>
                    <option value="Xoá mù tiếng Anh, học lại từ đầu">Xoá mù tiếng Anh, học lại từ đầu</option>
                    <option value="Giao tiếp văn phòng & đọc viết email">Giao tiếp văn phòng &amp; đọc viết email</option>
                  </select>
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 text-xs">
                    {errorMsg}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-13 mt-2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-orange-500 hover:to-orange-600 text-white font-black text-sm sm:text-base rounded-2xl shadow-xl shadow-orange-950/50 uppercase tracking-wide transition-transform active:scale-98"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Đang chuẩn bị tài liệu...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5 mr-2" /> Nhận Sổ Tay 3000 Từ &amp; Test Ngay (0đ)
                    </>
                  )}
                </Button>

                <p className="text-[11px] text-slate-400 text-center mt-3">
                  🔒 Cam kết bảo mật 100%. Không spam, không gửi tin rác.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
