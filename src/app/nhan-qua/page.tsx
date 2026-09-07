'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import {
  Gift,
  Sparkles,
  CheckCircle2,
  Copy,
  Check,
  PhoneCall,
  GraduationCap,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  User,
  MapPin,
  Calendar,
  Layers,
} from 'lucide-react';
import { PROVINCES } from '@/lib/provinces';

export default function NhanQuaKhaiGiangPage() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [targetRole, setTargetRole] = useState('Học sinh THPT (Lớp 10, 11, 12)');
  const [province, setProvince] = useState('Hà Nội');
  const [currentLevel, setCurrentLevel] = useState('Mất gốc hoàn toàn, sợ tiếng Anh');
  const [needConsulting, setNeedConsulting] = useState(true);
  const [hp, setHp] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [promoCode, setPromoCode] = useState('KHAIGIANG3M');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim()) {
      setErrorMsg('Vui lòng nhập họ và tên của em.');
      return;
    }
    if (!phone.trim() || phone.trim().length < 9) {
      setErrorMsg('Vui lòng nhập số điện thoại hoặc Zalo hợp lệ để nhận mã.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/campaign/khaigiang', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          phone,
          birthYear,
          targetRole,
          province,
          currentLevel,
          needConsulting,
          hp,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPromoCode(data.code || 'KHAIGIANG3M');
        setIsSuccess(true);
        // Bắn pháo hoa ăn mừng
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
      // Dù lỗi mạng vẫn cho hiển thị mã để không làm gián đoạn học viên
      setPromoCode('KHAIGIANG3M');
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
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 text-slate-100 flex flex-col items-center justify-start p-4 sm:p-6 md:p-10">
      {/* Header Container */}
      <div className="w-full max-w-xl mx-auto space-y-6">
        {/* Banner Khai giảng */}
        <div className="text-center space-y-3 pt-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs sm:text-sm font-semibold tracking-wide animate-pulse">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            MỪNG KHAI GIẢNG 05/09 — QUÀ TẶNG ĐỘC QUYỀN
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-emerald-300">
            Tặng 3 Tháng VIP Pro (0Đ) &amp; Xóa Mất Gốc Tiếng Anh
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            Học thông minh với thuật toán lặp lại ngắt quãng (FSRS). Nạp vững <span className="text-emerald-400 font-bold">2.000 – 3.000 từ vựng</span> và khung ngữ pháp cốt lõi để bứt phá lên 7 – 8 điểm!
          </p>
        </div>

        {/* Card giới thiệu Thầy Phong */}
        <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/40 backdrop-blur-md p-4 sm:p-5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-emerald-500 p-0.5 shadow-lg flex-shrink-0">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                <GraduationCap className="w-7 h-7 text-emerald-400" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-white">Thầy Phong</h3>
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Chuyên Trị Mất Gốc
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-snug">
                Đã đồng hành kéo hàng trăm bạn học sinh mất gốc từ 2 - 3 điểm vươn lên 7.0 – 8.0 điểm thi.
              </p>
              <div className="pt-1.5 flex flex-wrap items-center gap-3 text-xs text-emerald-400 font-medium">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" /> Lớp Lấy Gốc sắp khai giảng
                </span>
                <a
                  href="tel:0949317036"
                  className="flex items-center gap-1 text-slate-300 hover:text-white underline decoration-dotted"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-indigo-400" /> 0949.317.036
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Form Container hoặc Màn hình chúc mừng */}
        {!isSuccess ? (
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl p-5 sm:p-7 shadow-2xl space-y-5"
          >
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Gift className="w-5 h-5 text-emerald-400" />
                Điền thông tin để nhận Mã Kích Hoạt 3 Tháng
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Thầy chỉ tặng mã cho những bạn thật sự nghiêm túc muốn đổi vận tiếng Anh.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs sm:text-sm">
                {errorMsg}
              </div>
            )}

            {/* Họ tên */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-semibold text-slate-300 flex items-center gap-1.5">
                <User className="w-4 h-4 text-indigo-400" /> Họ và tên của em <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ví dụ: Nguyễn Văn Nam"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              />
            </div>

            {/* Số điện thoại / Zalo */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-semibold text-slate-300 flex items-center gap-1.5">
                <PhoneCall className="w-4 h-4 text-emerald-400" /> Số điện thoại / Zalo nhận mã <span className="text-rose-400">*</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Số điện thoại nhận mã kích hoạt"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              />
            </div>

            {/* Năm sinh & Đối tượng */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-semibold text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-indigo-400" /> Năm sinh
                </label>
                <input
                  type="text"
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value)}
                  placeholder="Ví dụ: 2008, 2007, 2004..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-semibold text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-400" /> Em hiện đang là
                </label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                >
                  <option value="Học sinh THCS (Lớp 6 - 9)">Học sinh THCS (Lớp 6 - 9)</option>
                  <option value="Học sinh THPT (Lớp 10, 11, 12)">Học sinh THPT (Lớp 10, 11, 12)</option>
                  <option value="Sinh viên Đại học / Cao đẳng">Sinh viên Đại học / Cao đẳng</option>
                  <option value="Người đã đi làm">Người đã đi làm</option>
                </select>
              </div>
            </div>

            {/* Tỉnh / Thành phố */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-semibold text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-400" /> Tỉnh / Thành phố của em
              </label>
              <select
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              >
                {PROVINCES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500">
                Để Thầy hỗ trợ đúng tài liệu và đề thi trọng tâm của từng khu vực.
              </p>
            </div>

            {/* Trình độ hiện tại */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-semibold text-slate-300">
                Mức độ tiếng Anh hiện tại của em
              </label>
              <div className="space-y-2">
                {[
                  'Mất gốc hoàn toàn, sợ tiếng Anh',
                  'Ngữ pháp yếu, vốn từ vựng ít',
                  'Muốn bứt phá lên 7.0 – 8.0 điểm thi',
                ].map((item) => (
                  <label
                    key={item}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs sm:text-sm cursor-pointer transition ${
                      currentLevel === item
                        ? 'border-indigo-500 bg-indigo-500/10 text-white'
                        : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="currentLevel"
                      checked={currentLevel === item}
                      onChange={() => setCurrentLevel(item)}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>{item}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Nhu cầu tư vấn lớp Thầy Phong */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <label className="text-xs sm:text-sm font-semibold text-white">
                Thầy Phong chuẩn bị khai giảng lớp &quot;Lấy Gốc Tiếng Anh Toàn Diện&quot;. Em có muốn Thầy tư vấn lộ trình không?
              </label>
              <div className="space-y-2">
                <label
                  className={`flex items-center gap-3 p-3 rounded-xl border text-xs sm:text-sm cursor-pointer transition ${
                    needConsulting
                      ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300 font-medium'
                      : 'border-slate-800 bg-slate-950/40 text-slate-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="needConsulting"
                    checked={needConsulting}
                    onChange={() => setNeedConsulting(true)}
                    className="text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>👉 Có, Thầy Phong tư vấn trực tiếp giúp em qua SĐT/Zalo nhé!</span>
                </label>
                <label
                  className={`flex items-center gap-3 p-3 rounded-xl border text-xs sm:text-sm cursor-pointer transition ${
                    !needConsulting
                      ? 'border-indigo-500/60 bg-indigo-500/10 text-indigo-300'
                      : 'border-slate-800 bg-slate-950/40 text-slate-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="needConsulting"
                    checked={!needConsulting}
                    onChange={() => setNeedConsulting(false)}
                    className="text-indigo-500 focus:ring-indigo-500"
                  />
                  <span>Em muốn tự trải nghiệm học trên App trước</span>
                </label>
              </div>
            </div>

            {/* Honeypot field for bot protection */}
            <div className="hidden" aria-hidden="true" style={{ display: 'none' }}>
              <label htmlFor="hp-field">Website</label>
              <input
                id="hp-field"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={hp}
                onChange={(e) => setHp(e.target.value)}
              />
            </div>

            {/* Nút gửi */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm sm:text-base text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 hover:opacity-95 shadow-lg shadow-emerald-500/20 active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Đang tạo mã kích hoạt...</span>
              ) : (
                <>
                  <span>NHẬN MÃ 3 THÁNG VIP PRO (0Đ)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Thông tin của em được bảo mật và chỉ dùng để kích hoạt tài khoản học.
            </div>
          </form>
        ) : (
          /* Màn hình Chúc mừng & Nhận mã */
          <div className="rounded-2xl border border-emerald-500/40 bg-slate-900/90 backdrop-blur-xl p-6 sm:p-8 shadow-2xl space-y-6 text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400 shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Chúc Mừng Em Đã Nhận Quà Thành Công! 🎉
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Mã kích hoạt <span className="text-emerald-400 font-bold">3 Tháng VIP Pro (90 ngày)</span> của em là:
              </p>
            </div>

            {/* Hộp Mã Code */}
            <div className="p-4 rounded-2xl bg-slate-950 border-2 border-dashed border-emerald-500/60 max-w-sm mx-auto flex items-center justify-between gap-3">
              <div className="text-left">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Mã kích hoạt VIP</span>
                <span className="text-xl sm:text-2xl font-black tracking-widest text-emerald-300 font-mono">
                  {promoCode}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-3.5 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 hover:bg-emerald-400 transition"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Đã sao chép!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Sao chép
                  </>
                )}
              </button>
            </div>

            {/* Hướng dẫn 3 bước */}
            <div className="text-left bg-slate-950/60 rounded-xl p-4 border border-slate-800 space-y-2.5 text-xs sm:text-sm text-slate-300">
              <p className="font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" /> 3 Bước bắt đầu học ngay:
              </p>
              <div className="space-y-1.5 pl-1 text-slate-300">
                <p>
                  <strong className="text-emerald-400">Bước 1:</strong> Bấm nút <strong>&quot;Vào Học Trên App Ngay&quot;</strong> bên dưới.
                </p>
                <p>
                  <strong className="text-emerald-400">Bước 2:</strong> Đăng ký hoặc Đăng nhập tài khoản học viên.
                </p>
                <p>
                  <strong className="text-emerald-400">Bước 3:</strong> Vào mục <strong>Nâng cấp</strong>, dán mã <span className="font-mono text-emerald-400 font-bold">{promoCode}</span> để mở khóa 3 tháng VIP Pro.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <Link
                href={`/upgrade?code=${promoCode}`}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-sm sm:text-base text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-300 hover:opacity-95 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition"
              >
                <span>VÀO HỌC TRÊN APP NGAY</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <a
                href="https://zalo.me/0949317036"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl font-semibold text-xs sm:text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center gap-2 transition"
              >
                <PhoneCall className="w-4 h-4 text-indigo-400" />
                <span>Nhắn Zalo Thầy Phong (0949.317.036)</span>
              </a>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-slate-500 pt-4 pb-8 space-y-1">
          <p>© 2026 LingoPro &amp; Thầy Phong — Chuyên Trị Mất Gốc Tiếng Anh.</p>
          <p>Hotline hỗ trợ kỹ thuật và giải đáp: 0949.317.036</p>
        </div>
      </div>
    </div>
  );
}
