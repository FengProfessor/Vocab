'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  BookmarkPlus,
  Chrome,
  Monitor,
  Youtube,
  Volume2,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  MousePointerClick,
} from 'lucide-react';

interface SampleWord {
  word: string;
  phonetic: string;
  pos: string;
  meaning: string;
  context: string;
  source: string;
}

const SAMPLE_WORDS: SampleWord[] = [
  {
    word: 'alarm',
    phonetic: '/əˈlɑːrm/',
    pos: 'Danh từ',
    meaning: 'đồng hồ báo thức, chuông báo thức',
    context: 'First of all, every morning my alarm goes off at around six in the morning.',
    source: 'Phụ đề Video YouTube',
  },
  {
    word: 'produce',
    phonetic: '/ˈprɑː.duːs/',
    pos: 'Danh từ',
    meaning: 'nông sản tươi (rau, củ, quả)',
    context: 'Fresh produce is displayed in wooden crates along the sidewalk.',
    source: 'Đề thi ETS 2026',
  },
  {
    word: 'unprecedented',
    phonetic: '/ʌnˈpres.ə.den.t̬ɪd/',
    pos: 'Tính từ (C1)',
    meaning: 'chưa từng có tiền lệ, phi thường',
    context: 'The company achieved an unprecedented growth rate in the third quarter.',
    source: 'Báo chí Quốc tế (BBC/CNN)',
  },
];

export function ReferoCaptureSection() {
  const [selectedWord, setSelectedWord] = useState<SampleWord>(SAMPLE_WORDS[0]);
  const [isSaved, setIsSaved] = useState(true);

  const playAudio = (word: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <section
      id="capture"
      className="relative py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-200 overflow-hidden"
    >
      {/* Background Subtle Illustration Watermark / Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(#2563eb_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="max-w-7xl mx-auto relative z-10 space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sm bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700 uppercase tracking-wider">
            <BookmarkPlus className="w-3.5 h-3.5 text-blue-600" />
            <span>Trụ Cột 02: Bắt Trọn Từ Vựng Mọi Nơi</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            Tra Từ & Lưu Tức Thì Khi Đang Học
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Chấm dứt việc phải dừng video hay thoát bài báo để mở Google Dịch. Chỉ 1 thao tác click hoặc bôi đen,
            cửa sổ từ điển thông minh hiện ra ngay lập tức và lưu thẳng vào kho bộ nhớ cá nhân.
          </p>
        </div>

        {/* ─── 2-COLUMN FEATURE SHOWCASE ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* ════ LEFT COLUMN: 3 USE CASES & LIVE INTERACTIVE LOOKUP ════ */}
          <div className="lg:col-span-6 space-y-6">
            {/* 3 Channels to Capture Vocab */}
            <div className="space-y-3.5">
              {/* Channel 1: YouTube Subtitle */}
              <div className="p-4 rounded-md bg-slate-50 border border-slate-200 hover:border-blue-300 transition space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-7 rounded bg-red-600 text-white flex items-center justify-center shrink-0">
                      <Youtube className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Click Phụ Đề Video YouTube (Song Ngữ Chuẩn)
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Phổ biến nhất
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pl-9">
                  Khi xem 200+ video thực tế hoặc bất kỳ video tiếng Anh nào: gặp từ mới chỉ cần click thẳng vào chữ trên phụ đề.
                  Nghĩa tiếng Việt, phiên âm IPA, câu ví dụ hiện ra ngay — bấm <strong>✓ Đã lưu</strong> là xong.
                </p>
              </div>

              {/* Channel 2: Chrome Extension */}
              <div className="p-4 rounded-md bg-slate-50 border border-slate-200 hover:border-amber-300 transition space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-7 rounded bg-amber-500 text-white flex items-center justify-center shrink-0">
                      <Chrome className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Bôi Đen Đọc Báo Quốc Tế (BBC, CNN, Medium)
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Chrome Extension
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pl-9">
                  Cài tiện ích Chrome 1 lần duy nhất. Đang đọc tin tức tài chính, báo khoa học hay lướt Reddit: bôi đen từ để nghe phát âm bản xứ và bóc tách nghĩa mà không cần chuyển qua lại giữa các tab trình duyệt.
                </p>
              </div>

              {/* Channel 3: Desktop App Shortcut */}
              <div className="p-4 rounded-md bg-slate-50 border border-slate-200 hover:border-purple-300 transition space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-7 rounded bg-purple-600 text-white flex items-center justify-center shrink-0">
                      <Monitor className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Phím Tắt Tra Nhanh Desktop (<kbd className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-300 text-[10px]">Ctrl+Shift+L</kbd>)
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    Windows & macOS
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pl-9">
                  Tra cứu ở bất kỳ phần mềm nào: file PDF, slide PowerPoint, tài liệu Word hay ứng dụng chat. Cửa sổ mini thông minh tự bật lên và đồng bộ kho từ vựng về tài khoản web.
                </p>
              </div>
            </div>

            {/* Interactive Live Mini Demo */}
            <div className="p-4 rounded-md bg-blue-50/60 border border-blue-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                  <MousePointerClick className="w-4 h-4 text-blue-600" />
                  Bấm thử 3 từ mẫu bên dưới để trải nghiệm cửa sổ tra từ:
                </span>
                <span className="text-[11px] font-mono text-blue-700 font-bold">Interactive Demo</span>
              </div>

              {/* Word Chips */}
              <div className="flex flex-wrap gap-2">
                {SAMPLE_WORDS.map((w) => (
                  <button
                    key={w.word}
                    type="button"
                    onClick={() => {
                      setSelectedWord(w);
                      setIsSaved(false);
                      playAudio(w.word);
                    }}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold font-mono transition cursor-pointer border ${
                      selectedWord.word === w.word
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-800 border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {w.word}
                  </button>
                ))}
              </div>

              {/* Live Popover Card Simulation */}
              <div className="p-3.5 rounded-md bg-white border border-blue-300 shadow-xs space-y-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {selectedWord.word}
                    </span>
                    <span className="text-[10px] font-mono text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      Trọng tâm
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      {selectedWord.phonetic}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => playAudio(selectedWord.word)}
                    className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                    title="Phát âm"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1 text-xs">
                  <p className="text-slate-800 font-medium">
                    <span className="text-[10px] uppercase font-mono font-bold text-slate-400 mr-1.5">
                      {selectedWord.pos}:
                    </span>
                    {selectedWord.meaning}
                  </p>
                  <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded border border-slate-100">
                    &ldquo;{selectedWord.context}&rdquo;
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-400 font-mono">
                    Nguồn: {selectedWord.source}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsSaved(!isSaved)}
                    className={`px-3 py-1 rounded text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                      isSaved
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isSaved ? 'Đã lưu vào từ vựng' : 'Lưu vào từ vựng'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ════ RIGHT COLUMN: REAL SCREENSHOT PROOF (POPOVER & EXTENSION VIDEO) ════ */}
          <div className="lg:col-span-6 space-y-4">
            {/* Real Screenshot Card: Subtitle Word Lookup Popover */}
            <div className="rounded-lg border-2 border-slate-300 bg-white shadow-md overflow-hidden space-y-0">
              <div className="bg-slate-900 text-white px-4 py-2.5 text-xs font-bold flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>ẢNH CHỤP THỰC TẾ: CỬA SỔ TRA TỪ TRÊN PHỤ ĐỀ YOUTUBE</span>
                </div>
                <span className="font-mono text-[10px] text-slate-400">
                  LingoPro Video Player
                </span>
              </div>

              {/* Realistic Image Container */}
              <div className="relative w-full aspect-[16/10] bg-slate-100">
                <Image
                  src="/test-artifacts/listening/06-player-word-lookup-popover.png"
                  alt="Ảnh chụp thật cửa sổ popover tra từ trên phụ đề video LingoPro"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover object-top"
                  priority
                />

                {/* Direct High-Impact Callout Overlay */}
                <div className="absolute bottom-3 right-3 bg-slate-950/90 text-white text-xs p-3 rounded-md border border-slate-700 shadow-xl max-w-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Bóc tách ngữ nghĩa tức thì:</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    Click từ <strong>alarm</strong> ➔ Hiện phiên âm <span className="font-mono text-amber-300">/əˈlɑːm/</span>, giải nghĩa và nút <strong>✓ Đã lưu vào từ vựng</strong> mà không ngắt nhịp xem.
                  </p>
                </div>
              </div>
            </div>

            {/* Video Preview Card: Chrome Extension Lookup on Real News Articles */}
            <div className="rounded-lg border border-slate-300 bg-white p-3.5 shadow-xs flex flex-col sm:flex-row items-center gap-4">
              <div className="w-full sm:w-48 aspect-video rounded overflow-hidden border border-slate-300 bg-black shrink-0 relative">
                <video
                  src="/extension-lookup.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-1 left-1 bg-black/80 text-amber-300 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded">
                  Chrome Extension Demo
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Chrome className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Tiện ích Chrome: Bôi đen tra từ trên mọi website</span>
                </h4>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Đọc báo BBC, New York Times, Medium hay tài liệu PDF trên web: bôi đen từ để tra cứu siêu tốc.
                  Tự động đồng bộ về cỗ máy ghi nhớ FSRS để nhắc ôn mỗi ngày.
                </p>
                <div className="flex items-center gap-2 pt-0.5">
                  <Link
                    href="/auth"
                    className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1"
                  >
                    <span>Dùng thử tính năng lưu từ</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
