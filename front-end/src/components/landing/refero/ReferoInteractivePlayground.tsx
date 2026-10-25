'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Volume2,
  Bot,
  Check,
  BookmarkPlus,
  Zap,
} from 'lucide-react';
import type { PlaygroundSampleWord } from './types';

const SAMPLE_WORDS: Record<string, PlaygroundSampleWord> = {
  resilient: {
    word: 'resilient',
    ipa: '/rɪˈzɪl.jənt/',
    pos: 'adjective',
    cefr: 'C1',
    meaning: 'kiên cường, có khả năng phục hồi nhanh sau khó khăn hoặc thất bại',
    exampleEn: 'Local businesses have proven remarkably resilient despite the economic downturn.',
    exampleVi: 'Các doanh nghiệp địa phương đã chứng minh sự kiên cường đáng nể bất chấp suy thoái kinh tế.',
    collocations: ['resilient economy', 'psychologically resilient', 'highly resilient'],
    aiNuance:
      'Khác với "strong" (chỉ sức mạnh vật lý đơn thuần), "resilient" nhấn mạnh vào độ dẻo dai và khả năng bật dậy như lò xo sau nghịch cảnh.',
  },
  ubiquitous: {
    word: 'ubiquitous',
    ipa: '/juːˈbɪk.wə.t̬əs/',
    pos: 'adjective',
    cefr: 'C1',
    meaning: 'phổ biến khắp mọi nơi, đâu đâu cũng thấy',
    exampleEn: 'Coffee shops are ubiquitous in the central business district of Saigon.',
    exampleVi: 'Các quán cà phê xuất hiện nhan nhản ở khắp khu trung tâm tài chính Sài Gòn.',
    collocations: ['ubiquitous presence', 'become ubiquitous', 'almost ubiquitous'],
    aiNuance:
      'Trang trọng hơn "common". Thường dùng trong văn viết học thuật hoặc báo chí để nói về công nghệ, xu hướng lan rộng khắp hành tinh.',
  },
  procrastination: {
    word: 'procrastination',
    ipa: '/prəˌkræs.təˈneɪ.ʃən/',
    pos: 'noun',
    cefr: 'B2',
    meaning: 'sự trì hoãn, thói quen để việc hôm nay đến ngày mai mới làm',
    exampleEn: 'Procrastination is often driven by a subtle fear of failure rather than laziness.',
    exampleVi: 'Sự trì hoãn thường bắt nguồn từ nỗi sợ thất bại ngấm ngầm hơn là do lười biếng.',
    collocations: ['chronic procrastination', 'overcome procrastination', 'habit of procrastination'],
    aiNuance:
      'Trong tâm lý học nhận thức, đây không phải là quản lý thời gian kém mà là cơ chế tự vệ cảm xúc trước áp lực nhiệm vụ khó.',
  },
  meticulous: {
    word: 'meticulous',
    ipa: '/məˈtɪk.jə.ləs/',
    pos: 'adjective',
    cefr: 'C1',
    meaning: 'tỉ mỉ, cẩn thận đến từng chi tiết nhỏ nhất',
    exampleEn: 'The auditor conducted a meticulous examination of the company records.',
    exampleVi: 'Kiểm toán viên đã tiến hành một cuộc kiểm tra tỉ mỉ đối với toàn bộ sổ sách công ty.',
    collocations: ['meticulous attention to detail', 'meticulous research', 'meticulous planning'],
    aiNuance:
      'Cao cấp hơn "careful". Mang sắc thái tích cực về tính chính xác tuyệt đối trong nghiên cứu, phẫu thuật, thiết kế hoặc kiểm toán.',
  },
  serendipity: {
    word: 'serendipity',
    ipa: '/ˌser.ənˈdɪp.ə.t̬i/',
    pos: 'noun',
    cefr: 'C2',
    meaning: 'sự tình cờ may mắn, việc bất ngờ khám phá ra điều tốt đẹp',
    exampleEn: 'Finding this bookstore in a narrow alley was pure serendipity.',
    exampleVi: 'Việc tình cờ tìm thấy hiệu sách này trong con ngõ nhỏ quả là một cơ duyên may mắn kỳ diệu.',
    collocations: ['pure serendipity', 'happy serendipity', 'stroke of serendipity'],
    aiNuance:
      'Một trong những từ đẹp nhất trong tiếng Anh văn chương. Không chỉ là "luck" ngẫu nhiên, mà là sự phát hiện may mắn mở ra hướng đi mới.',
  },
};

export function ReferoInteractivePlayground() {
  const [selectedWordKey, setSelectedWordKey] = useState<string>('resilient');
  const [saved, setSaved] = useState(false);

  const activeWord = SAMPLE_WORDS[selectedWordKey] || SAMPLE_WORDS.resilient;

  const playPronunciation = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSaveToDeck = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <section id="playground" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-3 mb-10 sm:mb-12">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700">
          <Zap className="w-3.5 h-3.5" />
          <span>Trải Nghiệm Trực Tiếp</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
          Tra thử 1 từ — Cảm nhận tốc độ AI 0.1 giây
        </h2>
        <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
          Bấm chọn các từ mẫu bên dưới để xem cách LingoPro bóc tách phiên âm, ngữ cảnh và sắc thái sử dụng thực tế.
        </p>
      </div>

      {/* Word Picker Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
        {Object.keys(SAMPLE_WORDS).map((key) => {
          const isSelected = key === selectedWordKey;
          return (
            <button
              key={key}
              onClick={() => {
                setSelectedWordKey(key);
                setSaved(false);
              }}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 scale-105'
                  : 'bg-white text-slate-700 hover:text-indigo-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              {key}
            </button>
          );
        })}
      </div>

      {/* Live Vocabulary Card Output (Bright Theme) */}
      <div className="relative rounded-3xl sm:rounded-4xl bg-white border border-slate-200/90 p-6 sm:p-10 shadow-xl overflow-hidden">
        <div className="space-y-6">
          {/* Header Row: Word + Audio + CEFR Badge */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div className="flex items-center gap-3 sm:gap-4">
              <h3 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {activeWord.word}
              </h3>
              <button
                onClick={() => playPronunciation(activeWord.word)}
                className="p-2.5 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-transform active:scale-95 cursor-pointer shadow-xs"
                title="Nghe phát âm chuẩn US"
                aria-label="Play pronunciation"
              >
                <Volume2 className="w-5 h-5" />
              </button>
              <span className="text-sm sm:text-base font-mono text-slate-500 font-medium">
                {activeWord.ipa}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-mono text-xs font-bold uppercase border border-slate-200">
                {activeWord.pos}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono text-xs font-black">
                CEFR {activeWord.cefr}
              </span>
            </div>
          </div>

          {/* Vietnamese Meaning */}
          <div>
            <span className="text-xs uppercase font-mono tracking-wider text-slate-400 font-bold block mb-1">
              Định nghĩa tiếng Việt:
            </span>
            <p className="text-lg sm:text-xl font-bold text-slate-900">
              {activeWord.meaning}
            </p>
          </div>

          {/* Real-world Sentence Context */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="text-xs font-mono text-slate-500 uppercase tracking-wider font-semibold">
              Ví dụ thực tế trong đề thi & giao tiếp:
            </div>
            <p className="text-sm sm:text-base text-slate-900 font-semibold leading-relaxed">
              &quot;{activeWord.exampleEn}&quot;
            </p>
            <p className="text-xs sm:text-sm text-slate-600 italic">
              &quot;{activeWord.exampleVi}&quot;
            </p>
          </div>

          {/* Collocations & Gemini AI Deep Nuance */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-2">
            {/* Collocations */}
            <div className="md:col-span-5 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-xs font-mono text-slate-500 uppercase tracking-wider font-bold block">
                Cụm từ hay gặp (Collocations):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {activeWord.collocations.map((col, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-800 text-xs font-semibold shadow-xs"
                  >
                    {col}
                  </span>
                ))}
              </div>
            </div>

            {/* AI Nuance */}
            <div className="md:col-span-7 p-4 rounded-xl bg-violet-50/80 border border-violet-200 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-violet-800">
                <Bot className="w-3.5 h-3.5" />
                <span>Phân tích sắc thái chuyên sâu từ Gemini AI:</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {activeWord.aiNuance}
              </p>
            </div>
          </div>

          {/* Save Action Banner */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Sẵn sàng lưu vào bộ nhớ FSRS cá nhân của bạn</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={handleSaveToDeck}
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-sm ${
                  saved
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {saved ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Đã nạp vào thuật toán ôn tập!</span>
                  </>
                ) : (
                  <>
                    <BookmarkPlus className="w-4 h-4" />
                    <span>Lưu từ này vào FSRS 0đ</span>
                  </>
                )}
              </button>

              <Link
                href="/auth"
                className="w-full sm:w-auto text-center px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition border border-slate-200"
              >
                Tạo tài khoản học trọn bộ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
