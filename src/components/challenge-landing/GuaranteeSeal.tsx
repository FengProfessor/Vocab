'use client';

import React from 'react';
import { ShieldCheck, RefreshCw, Award, Lock, Check, Sparkles } from 'lucide-react';

export function GuaranteeSeal() {
  return (
    <section id="guarantee" className="py-20 bg-gradient-to-b from-slate-900 to-slate-950 text-white relative overflow-hidden border-y border-slate-800">
      {/* Background radial highlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="bg-slate-900/90 rounded-[36px] p-8 sm:p-12 lg:p-16 border-2 border-amber-500/30 shadow-2xl relative overflow-hidden">
          {/* Top highlight line */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500" />

          <div className="grid lg:grid-cols-12 gap-10 items-center">
            {/* Left: Official Guarantee Seal */}
            <div className="lg:col-span-4 flex flex-col items-center justify-center text-center">
              <div className="relative group">
                {/* Outer pulsing ring */}
                <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-gradient-to-tr from-amber-500/20 via-orange-500/20 to-yellow-500/20 animate-pulse absolute -inset-2 blur-md" />
                
                {/* Seal Container */}
                <div className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-full bg-gradient-to-br from-amber-600 via-yellow-500 to-orange-600 p-1.5 shadow-2xl flex items-center justify-center">
                  <div className="w-full h-full rounded-full bg-slate-950 border-2 border-dashed border-amber-300/60 flex flex-col items-center justify-center p-4 text-center">
                    <ShieldCheck className="w-10 h-10 sm:w-12 sm:h-12 text-amber-400 mb-1" />
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-amber-300">
                      CAM KẾT 100%
                    </span>
                    <span className="text-sm sm:text-base font-black text-white leading-tight">
                      HOÀN TIỀN
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-amber-200/80 font-semibold mt-0.5">
                      SÒNG PHẲNG • MINH BẠCH
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-amber-300">
                <Lock className="w-3.5 h-3.5" /> Bảo Chứng Bởi LingoPro Education
              </div>
            </div>

            {/* Right: Explanation & 4 Trust Pillars */}
            <div className="lg:col-span-8 space-y-6">
              <div>
                <span className="text-amber-400 font-black text-xs uppercase tracking-widest px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 inline-block mb-3">
                  Chính Sách Hoàn Tiền Rõ Ràng
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight">
                  Bạn Học Đủ Chuỗi – Chúng Tôi Hoàn Lại 100% Tiền Cọc Trong 24H
                </h2>
                <p className="text-slate-300 text-sm sm:text-base mt-3 leading-relaxed">
                  Chúng tôi xây dựng Thử Thách Tiếng Anh 180 Ngày với mục tiêu duy nhất: <strong className="text-white">giúp bạn hình thành thói quen kỷ luật</strong>. Tiền cọc là &quot;khoản bảo chứng động lực&quot; của chính bạn. Khi bạn hoàn thành mục tiêu, tiền thuộc về bạn, kèm theo phần thưởng tài khoản Pro xứng đáng!
                </p>
              </div>

              {/* 4 Pillars */}
              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                    <RefreshCw className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Chuyển Khoản / Ví MoMo 24h</h4>
                    <p className="text-xs text-slate-400 mt-1">Hoàn trả tự động ngay khi kết thúc thử thách sau khi xác nhận số ngày học hợp lệ.</p>
                  </div>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Thưởng Thêm Tài Khoản Pro</h4>
                    <p className="text-xs text-slate-400 mt-1">Tặng 6 tháng đến 1 năm Pro miễn phí trị giá đến 800.000đ khi hoàn thành trọn vẹn.</p>
                  </div>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Đếm Chuỗi Streak Tự Động</h4>
                    <p className="text-xs text-slate-400 mt-1">Hệ thống ghi nhận minh bạch theo thời gian thực, không thể gian lận hay can thiệp thủ công.</p>
                  </div>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Cộng Đồng Hỗ Trợ Kèm Cặp</h4>
                    <p className="text-xs text-slate-400 mt-1">Nhóm Zalo riêng nhắc nhở mỗi tối, giải đáp thắc mắc từ vựng và kinh nghiệm thi TOEIC.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
