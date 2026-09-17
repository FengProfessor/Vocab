'use client';

import React from 'react';
import { XCircle, CheckCircle2, Flame, ArrowRight, Zap, Target, TrendingUp, Trophy } from 'lucide-react';

export function BeforeAfterSection() {
  return (
    <section id="before-after" className="py-20 bg-slate-900 text-white relative overflow-hidden border-t border-slate-800">
      {/* Glow effects */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-72 h-72 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-72 h-72 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-amber-400 font-bold text-xs uppercase tracking-widest px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 inline-block mb-3">
            Bứt Phá Thực Tế
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-4 leading-tight">
            Sự Khác Biệt Giữa <span className="text-slate-400 line-through decoration-red-500">Tự Học Bỏ Dở</span> &amp; <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">Kỷ Luật Có Cam Kết</span>
          </h2>
          <p className="text-slate-300 text-base sm:text-lg">
            95% người học tiếng Anh thất bại không phải vì thiếu tài liệu, mà vì thiếu <strong className="text-white">áp lực kỷ luật</strong> và <strong className="text-white">phương pháp lặp lại đúng thời điểm</strong>.
          </p>
        </div>

        {/* 2 Comparison Cards */}
        <div className="grid md:grid-cols-2 gap-8 items-stretch">
          {/* Card BEFORE */}
          <div className="bg-slate-950/70 rounded-3xl p-6 sm:p-8 border border-red-950/60 shadow-xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 to-rose-700" />
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-red-950/80 border border-red-800/40 flex items-center justify-center text-red-400 shadow-inner">
                  <XCircle className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-red-400">Vòng lặp cũ</span>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-200">Trước Khi Tham Gia</h3>
                </div>
              </div>

              <ul className="space-y-4 text-sm sm:text-base text-slate-300">
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <span><strong>Học theo hứng:</strong> Hăng hái 3 ngày đầu rồi lùi lịch, viện cớ bận thi cử, bẵng đi vài tuần lại quay về vạch xuất phát.</span>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <span><strong>Chép từ vựng kín sổ nhưng học vẹt:</strong> Ghi chép hàng trăm từ nhưng không có chu kỳ ôn tập Spaced Repetition, 1 tuần sau quên 80%.</span>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <span><strong>Mất tiền mua khoá học đắt đỏ rồi bỏ xó:</strong> Bỏ tiền triệu mua video bài giảng nhưng thiếu áp lực cam kết, không ai giám sát tiến độ.</span>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <span><strong>Sợ đọc văn bản &amp; đề thi TOEIC:</strong> Nhìn đâu cũng thấy từ mới lạ lẫm, phải dùng Google Dịch từng câu làm mất hẳn sự tự tin.</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-5 border-t border-slate-800/70 text-xs text-slate-500 flex items-center gap-2 italic">
              <span>Hệ quả: Tiêu tốn thời gian, nản lòng và nghi ngờ năng lực bản thân.</span>
            </div>
          </div>

          {/* Card AFTER */}
          <div className="bg-gradient-to-b from-slate-900/90 to-slate-950/90 rounded-3xl p-6 sm:p-8 border-2 border-amber-500/40 shadow-2xl shadow-amber-950/30 flex flex-col justify-between relative overflow-hidden transform md:-translate-y-2">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500" />
            <div className="absolute -top-3 right-6 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-[11px] uppercase tracking-widest px-3 py-1 rounded-full shadow-md flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5" /> Kết quả thực tế
            </div>

            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Bứt phá cùng LingoPro</span>
                  <h3 className="text-xl sm:text-2xl font-black text-white">Sau 90 - 180 Ngày Về Đích</h3>
                </div>
              </div>

              <ul className="space-y-4 text-sm sm:text-base text-slate-200">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Thói quen tự giác 15 phút:</strong> &quot;Mất tiền cọc nếu lười&quot; tạo áp lực tích cực, biến việc học thành phản xạ hàng ngày như đánh răng.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Làm chủ 3.000 từ vựng cốt lõi:</strong> Thuộc làu nghĩa, cách phát âm IPA chuẩn xác và ngữ cảnh nhờ thuật toán lặp lại ngắt quãng khoa học.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Đọc hiểu &gt;80% đề TOEIC &amp; tài liệu:</strong> Dễ dàng xử lý nhanh Part 5, 6, 7 trong đề thi hoặc đọc mail công việc không cần từ điển.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Nhận lại 100% học phí + Tặng Pro:</strong> Hoàn tiền cọc minh bạch, cảm giác chiến thắng bản thân và sở hữu công cụ ôn luyện dài hạn.</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-5 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Zap className="w-4 h-4 fill-amber-300" />
                Chi phí thực tế = 0đ khi bạn kỷ luật!
              </span>
              <a
                href="#pricing"
                className="text-xs font-black text-amber-400 hover:text-white uppercase tracking-wider flex items-center gap-1 group"
              >
                Giữ chỗ ngay <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
