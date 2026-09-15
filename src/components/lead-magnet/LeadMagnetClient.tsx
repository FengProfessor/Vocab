'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Brain,
  Sparkles,
  ArrowRight,
  Headphones,
  BookOpen,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import DiagnosticScorecard from './DiagnosticScorecard';
import EmailOptinCard from './EmailOptinCard';
import KillerMatrixSection from './KillerMatrixSection';
import StatsComparisonTable from './StatsComparisonTable';
import DictionarySection from './DictionarySection';
import EbookReaderModal from './EbookReaderModal';

export default function LeadMagnetClient() {
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const [diagnosticScore, setDiagnosticScore] = useState<number | null>(null);
  const [dimensionScores, setDimensionScores] = useState<Record<number, number>>({});
  const [userEmail, setUserEmail] = useState('');
  const [userFullName, setUserFullName] = useState('');

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-[#070711] text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Sticky Top Navbar */}
      <nav className="sticky top-0 z-40 border-b border-white/10 bg-[#070711]/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-base sm:text-lg">
            <div className="bg-indigo-500/20 p-1.5 rounded-xl border border-indigo-500/30">
              <Brain className="h-5 w-5 text-indigo-400" />
            </div>
            <span className="tracking-tight text-white">LingoPro</span>
            <span className="hidden sm:inline-block text-[11px] px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono">
              Research Edition
            </span>
          </Link>

          {/* Quick Nav Links */}
          <div className="hidden lg:flex items-center gap-6 text-xs sm:text-sm font-medium text-slate-400">
            <button
              type="button"
              onClick={() => scrollToSection('matrix')}
              className="hover:text-white transition cursor-pointer"
            >
              Ma Trận 15 Chiều
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('audit')}
              className="hover:text-white transition cursor-pointer flex items-center gap-1 text-emerald-400 font-semibold"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Test Chẩn Đoán (0-30đ)
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('stats')}
              className="hover:text-white transition cursor-pointer"
            >
              Số Liệu ETS 2026
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('dictionary')}
              className="hover:text-white transition cursor-pointer"
            >
              Từ Điển 150 Từ
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('roadmap')}
              className="hover:text-white transition cursor-pointer"
            >
              Lộ Trình 30 Ngày
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsReaderOpen(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Đọc Online</span>
            </button>

            <button
              type="button"
              onClick={() => scrollToSection('optin-hero')}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-400 to-teal-300 text-slate-950 hover:opacity-95 shadow-lg shadow-emerald-500/20 transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>Nhận Ebook</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 px-4 sm:px-6">
        {/* Glow ambient effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-indigo-600/15 rounded-full blur-3xl" />
          <div className="absolute top-40 right-10 w-[350px] h-[350px] bg-emerald-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Hero Left: Text Pitch */}
            <div className="lg:col-span-7 space-y-6 text-left">
              {/* Publication Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs sm:text-sm font-semibold tracking-wide">
                <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                ẤN PHẨM KHẢO THÍ ĐỘC QUYỀN LINGOPRO 2026
              </div>

              {/* Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15] text-white">
                Bách Khoa Thực Chiến:<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-300">
                  Sát Thủ Bài Nghe TOEIC
                </span>
              </h1>

              {/* Sub-headline */}
              <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl">
                Giải mã định lượng <strong className="text-white">2,000 câu hỏi</strong> từ <strong className="text-emerald-400">20 bộ đề chuẩn khảo thí ETS 2024 &amp; ETS 2026</strong>. Đột phá phản xạ âm học, bẻ gãy 15 chiều không gian bẫy nghe, chinh phục <strong className="text-indigo-300">450+ đến 495 điểm tuyệt đối</strong>.
              </p>

              {/* 4 Quantitative Proof Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <span className="block text-xl sm:text-2xl font-black font-mono text-emerald-400">
                    2,000
                  </span>
                  <span className="text-[11px] text-slate-400">Câu hỏi khảo thí</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <span className="block text-xl sm:text-2xl font-black font-mono text-indigo-400">
                    20 Đề
                  </span>
                  <span className="text-[11px] text-slate-400">ETS 2024 &amp; 2026</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <span className="block text-xl sm:text-2xl font-black font-mono text-amber-400">
                    15 Chiều
                  </span>
                  <span className="text-[11px] text-slate-400">Ma trận bẫy âm học</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <span className="block text-xl sm:text-2xl font-black font-mono text-purple-400">
                    150 Từ
                  </span>
                  <span className="text-[11px] text-slate-400">Từ điển sát thủ</span>
                </div>
              </div>

              {/* Fast Jump Callouts */}
              <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Tự test chẩn đoán 0-30 điểm tức thì
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Tải về máy hoặc đọc online ngay
                </span>
              </div>
            </div>

            {/* Hero Right: Opt-in Form */}
            <div id="optin-hero" className="lg:col-span-5">
              <EmailOptinCard
                onReadOnline={() => setIsReaderOpen(true)}
                diagnosticScore={diagnosticScore}
                dimensionScores={dimensionScores}
                userEmail={userEmail}
                userFullName={userFullName}
                onUserEmailChange={setUserEmail}
                onUserFullNameChange={setUserFullName}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section: The Great Plateau & The Death of Mechanical Hacks */}
      <section className="py-16 px-4 sm:px-6 bg-slate-950/60 border-y border-slate-800/80">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <span className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold uppercase tracking-wider">
              Cú Sốc Phòng Thi Thật
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              &quot;The Great Plateau&quot; — Tại Sao Giải Hàng Chục Đề Vẫn Tụt Điểm Khi Thi Thật?
            </h2>
            <p className="text-xs sm:text-base text-slate-400 leading-relaxed">
              Hơn 85% người học TOEIC tại Việt Nam luyện các bộ đề cũ (ETS 2019-2022) đạt 380 – 420 điểm nghe. Nhưng khi vào phòng thi gặp ngân hàng câu hỏi 2024–2026, điểm nghe rơi tự do xuống 310 – 350.
            </p>
          </div>

          {/* 3 Fatal Bottlenecks */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-xl">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center font-bold">
                1
              </div>
              <h3 className="font-bold text-base sm:text-lg text-white">
                Part 1 Không Còn Đồ Vật Cụ Thể
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Bạn đợi nghe <code className="text-sky-300">desk</code>, <code className="text-sky-300">lamp</code>, <code className="text-sky-300">apple</code>, nhưng ETS phát thanh toàn Thượng danh từ: <code className="text-emerald-300">light fixtures</code>, <code className="text-emerald-300">produce</code>, <code className="text-emerald-300">utensils</code>, <code className="text-emerald-300">apparel</code>.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-xl">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
                2
              </div>
              <h3 className="font-bold text-base sm:text-lg text-white">
                Part 2 Hỏi Một Đằng, Trả Lời Một Nẻo
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Câu hỏi không trả lời trực tiếp <code className="text-amber-300">Yes/No</code> hay nêu mốc giờ cụ thể mà dùng phản xạ thoái thác, phủ định tiền đề hoặc đẩy việc: <em className="text-slate-300">&quot;Clara&apos;s already organizing one&quot;</em>.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-xl">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center font-bold">
                3
              </div>
              <h3 className="font-bold text-base sm:text-lg text-white">
                Part 3 &amp; 4 Bẫy Trùng Từ Lên Tới 79%
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Tốc độ đọc lên tới 160 – 180 từ/phút. Thí sinh vừa nghe thấy một từ khóa giống hệt trong câu hỏi thì mừng rỡ khoanh ngay — ai ngờ đó chính là <strong className="text-rose-400">bẫy mồi nguyên xi</strong> của ETS!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Data Comparison Report */}
      <section id="stats" className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <StatsComparisonTable />
        </div>
      </section>

      {/* Section: 15-Dimension Killer Matrix */}
      <section id="matrix" className="py-16 sm:py-24 px-4 sm:px-6 bg-slate-950/70 border-y border-slate-800">
        <div className="max-w-6xl mx-auto">
          <KillerMatrixSection />
        </div>
      </section>

      {/* Section: Diagnostic Audit Scorecard */}
      <section id="audit" className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <DiagnosticScorecard
            onScoreCalculated={(score, scores) => {
              setDiagnosticScore(score);
              setDimensionScores(scores);
            }}
            onOpenOptin={() => scrollToSection('optin-hero')}
            userEmail={userEmail}
            userFullName={userFullName}
            onUserEmailChange={setUserEmail}
            onUserFullNameChange={setUserFullName}
          />
        </div>
      </section>

      {/* Section: 150-Word Dictionary */}
      <section id="dictionary" className="py-16 sm:py-24 px-4 sm:px-6 bg-slate-950/70 border-y border-slate-800">
        <div className="max-w-6xl mx-auto">
          <DictionarySection />
        </div>
      </section>

      {/* Section: FSRS & Native Shadowing on LingoPro */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
              Công Nghệ Đột Phá Phản Xạ
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Hệ Thống Huấn Luyện Phản Xạ FSRS &amp; Native Shadowing
            </h2>
            <p className="text-xs sm:text-base text-slate-400 leading-relaxed">
              Tại sao học từ vựng bằng mắt khiến bạn &quot;điếc&quot; khi nghe? LingoPro bẻ khóa rào cản chuyển đổi ký tự bằng thuật toán Lặp Lại Ngắt Quãng FSRS áp dụng riêng cho Thính giác.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <span className="font-mono text-xs font-bold text-sky-400 px-2 py-1 rounded bg-sky-500/10 border border-sky-500/20">
                BƯỚC 1
              </span>
              <h3 className="font-bold text-base text-white">
                Subtitle Sync O(log N)
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Đồng bộ phụ đề song ngữ chính xác tới mili-giây với bộ đệm chống trễ 1.2s hysteresis buffer. Bấm vào bất kỳ từ nào để tra ngay popover phát âm IPA.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <span className="font-mono text-xs font-bold text-amber-400 px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20">
                BƯỚC 2
              </span>
              <h3 className="font-bold text-base text-white">
                Cloze Dictation Dưới Áp Lực
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Chế độ chép chính tả điền khuyết dưới áp lực thời gian. LingoPro che các Thượng danh từ và Vi hành động để ép não bộ bắt đúng tín hiệu âm thanh.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <span className="font-mono text-xs font-bold text-purple-400 px-2 py-1 rounded bg-purple-500/10 border border-purple-500/20">
                BƯỚC 3
              </span>
              <h3 className="font-bold text-base text-white">
                Tăng Tốc Độ 1.0x -&gt; 1.2x
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Nhại giọng theo ngữ điệu bản xứ (Shadowing) và tăng tốc độ nghe lên 1.2x. Khi vào phòng thi thật (1.0x), bạn sẽ thấy tốc độ đọc của ETS trở nên cực kỳ chậm rãi!
              </p>
            </div>
          </div>

          <div className="text-center pt-2">
            <Link
              href="/practice/listening"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/20 transition"
            >
              <Headphones className="w-4 h-4" />
              <span>Trải Nghiệm Luyện Nghe FSRS Focus Player Ngay</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Section: 30-Day Roadmap & Degrading-Reward Challenge */}
      <section id="roadmap" className="py-16 sm:py-24 px-4 sm:px-6 bg-slate-950/70 border-t border-slate-800">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              Kỷ Luật Tự Thân
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Đập Tan &quot;Ảo Tưởng Tích Trữ Tài Liệu&quot; &amp; Lộ Trình 30 Ngày
            </h2>
            <p className="text-xs sm:text-base text-slate-400 leading-relaxed">
              Hơn 95% người tải tài liệu PDF trên mạng sẽ không bao giờ mở quá trang thứ 10 sau 14 ngày. Kỹ năng nghe là môn thể thao phản xạ thần kinh cơ bắp — cần kỷ luật và áp lực tài chính tự thân!
            </p>
          </div>

          {/* 4-Week Schedule */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-sky-400 block font-mono">TUẦN 1 (Ngày 1 - 7)</span>
              <h4 className="font-bold text-white text-sm">Bẻ Khóa Part 1 &amp; Part 2</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Quét 120 câu Part 1 trong 20 đề ETS 2024-2026. Khắc cốt ghi tâm &quot;No Human = No Being&quot; và Thượng danh từ. Đạt 6/6 câu Part 1.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-amber-400 block font-mono">TUẦN 2 (Ngày 8 - 14)</span>
              <h4 className="font-bold text-white text-sm">Đập Tan Bẫy Câu Trần Thuật</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Cày sạch 500 câu Part 2 ETS 2024 &amp; 2026. Luyện phản xạ nhận diện câu gián tiếp, ủy quyền (&quot;Clara&apos;s organizing&quot;). Sai dưới 3 câu Part 2.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-purple-400 block font-mono">TUẦN 3 (Ngày 15 - 21)</span>
              <h4 className="font-bold text-white text-sm">Động Cơ Paraphrase 3 Tầng</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Luyện 260 đoạn thoại và độc thoại có câu hỏi hình ảnh. Thực thi Định luật Cột Đối Diện. Bắt trọn ý ngầm và đối thoại 3 người.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-emerald-400 block font-mono">TUẦN 4 (Ngày 22 - 30)</span>
              <h4 className="font-bold text-white text-sm">Thi Thử Áp Lực 45 Phút</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Bấm giờ 45 phút cho 100 câu nghe liên tục không Pause ở tốc độ 1.1x trên LingoPro Exam Engine. Vững vàng cán mốc 450 - 495 điểm!
              </p>
            </div>
          </div>

          {/* Degrading Reward Challenge Banner */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-950 border border-indigo-500/40 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
                <Flame className="w-3.5 h-3.5" />
                Mô hình Kinh tế học Hành vi
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white">
                Thử Thách Kỷ Luật Hoàn Tiền Giảm Dần
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                Cọc cam kết 300,000đ. Mỗi ngày hoàn thành tối thiểu 25 câu hỏi ETS 2026. Học đủ 30 ngày: <strong className="text-emerald-400">HOÀN 100,000đ TIỀN MẶT + TẶNG 6 THÁNG PRO</strong>! Lười 1 ngày: trừ 33,333đ vào quỹ hoàn tiền.
              </p>
            </div>

            <Link
              href="/upgrade"
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-300 text-slate-950 font-black text-sm hover:opacity-95 transition shadow-lg shadow-emerald-500/20 whitespace-nowrap flex-shrink-0"
            >
              Tham Gia Thử Thách
            </Link>
          </div>
        </div>
      </section>

      {/* Footer & FAQ */}
      <footer className="py-12 px-4 sm:px-6 bg-[#040409] border-t border-slate-800/80 text-xs text-slate-400">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div className="flex items-center gap-2 font-bold text-white text-base">
              <Brain className="h-5 w-5 text-indigo-400" />
              <span>LingoPro EdTech Platform</span>
            </div>
            <div className="flex items-center gap-6 text-xs text-slate-400">
              <Link href="/toeic" className="hover:text-white transition">
                Kho 20 Đề ETS 2026
              </Link>
              <Link href="/practice/listening" className="hover:text-white transition">
                Luyện Nghe FSRS
              </Link>
              <Link href="/privacy" className="hover:text-white transition">
                Chính sách bảo mật
              </Link>
              <Link href="/terms" className="hover:text-white transition">
                Điều khoản dịch vụ
              </Link>
            </div>
          </div>

          <div className="text-center sm:text-left space-y-2 text-slate-500 text-[11px] leading-relaxed">
            <p>
              © 2026 LingoPro — Nền tảng Công nghệ Giáo dục Chuẩn Khảo Thí. Toàn bộ dữ liệu 2,000 câu hỏi được đối chiếu độc lập từ bộ đề chuẩn ETS 2024 &amp; ETS 2026.
            </p>
            <p>
              Ấn phẩm mang mã số LP-LM-TOEIC-LISTEN-2026. Bản quyền nội dung thuộc về Ban Nghiên cứu Sư phạm Ứng dụng &amp; Dữ liệu Khảo thí LingoPro.
            </p>
          </div>
        </div>
      </footer>

      {/* Full-screen / Modal Ebook Reader */}
      <EbookReaderModal
        isOpen={isReaderOpen}
        onClose={() => setIsReaderOpen(false)}
      />
    </div>
  );
}
