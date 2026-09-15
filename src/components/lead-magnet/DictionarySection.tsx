'use client';

import React, { useState, useMemo } from 'react';
import {
  DICTIONARY_150,
  DICT_GROUPS,
  type DictItem,
} from '@/data/sat-thu-toeic-listening-data';
import {
  BookOpen,
  Search,
  AlertCircle,
  Volume2,
  ChevronDown,
} from 'lucide-react';

export default function DictionarySection() {
  const [activeGroupIndex, setActiveGroupIndex] = useState<number>(0); // 0 = all
  const [searchQuery, setSearchQuery] = useState('');
  const [displayCount, setDisplayCount] = useState<number>(18);

  const filteredWords = useMemo(() => {
    let list = DICTIONARY_150;
    if (activeGroupIndex > 0) {
      list = list.filter((item) => item.groupIndex === activeGroupIndex);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.word.toLowerCase().includes(q) ||
          item.meaning.toLowerCase().includes(q) ||
          item.collocation.toLowerCase().includes(q) ||
          item.citation.toLowerCase().includes(q) ||
          item.ipa.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeGroupIndex, searchQuery]);

  const visibleItems = useMemo(() => {
    return filteredWords.slice(0, displayCount);
  }, [filteredWords, displayCount]);

  const handleSpeak = (text: string) => {
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 0.9;
        const voices = window.speechSynthesis.getVoices?.() || [];
        const enVoice = voices.find(
          (v) => v.lang.startsWith('en') && (v.name.includes('US') || v.name.includes('Natural'))
        ) || voices.find((v) => v.lang.startsWith('en'));
        if (enVoice) utterance.voice = enVoice;
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
          <BookOpen className="w-3.5 h-3.5" />
          Kho Dữ Liệu Từ Vựng Cốt Lõi
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Từ Điển Sát Thủ 150 Cụm Từ Tần Suất Cao Nhất ETS 2024 &amp; ETS 2026
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Trích xuất trực tiếp từ 2,000 câu hỏi nghe thực tế. Đầy đủ phiên âm IPA, cụm Collocation tự nhiên, dẫn chứng câu hỏi và cảnh báo bẫy thi độc quyền.
        </p>
      </div>

      {/* Controls: Search and Group Selector */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search bar */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setDisplayCount(18);
            }}
            placeholder="Tra từ, nghĩa, IPA, đề thi..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder:text-slate-500 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        {/* Group Selector Dropdown / Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 text-xs">
          <button
            type="button"
            onClick={() => {
              setActiveGroupIndex(0);
              setDisplayCount(18);
            }}
            className={`px-3 py-2 rounded-xl transition whitespace-nowrap font-medium cursor-pointer ${
              activeGroupIndex === 0
                ? 'bg-indigo-500 text-white font-bold shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Tất cả (150 từ)
          </button>
          {DICT_GROUPS.map((grp) => (
            <button
              key={grp.id}
              type="button"
              onClick={() => {
                setActiveGroupIndex(grp.id);
                setDisplayCount(18);
              }}
              className={`px-3 py-2 rounded-xl transition whitespace-nowrap font-medium cursor-pointer ${
                activeGroupIndex === grp.id
                  ? 'bg-indigo-500 text-white font-bold shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Nhóm {grp.id} ({grp.count})
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Word Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleItems.map((item: DictItem) => (
          <div
            key={item.id}
            className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-3 shadow-md"
          >
            {/* Top row */}
            <div className="space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      #{item.id}
                    </span>
                    <h3 className="font-bold text-base text-white hover:text-indigo-300 transition flex items-center gap-1.5">
                      {item.word}
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-indigo-400 block mt-0.5">
                    {item.ipa}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleSpeak(item.word)}
                  title="Phát âm từ này"
                  className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-indigo-600 transition flex-shrink-0 cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Vietnamese Meaning */}
              <p className="text-xs font-semibold text-emerald-300">
                {item.meaning}
              </p>
            </div>

            {/* Collocation */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs">
              <div>
                <span className="text-[10px] uppercase text-slate-500 font-semibold block">
                  Cụm collocation thực tế
                </span>
                <span className="text-slate-300 italic">
                  &quot;{item.collocation}&quot;
                </span>
              </div>

              {/* Trap warning */}
              <div className="p-2.5 rounded-xl bg-slate-950 border border-amber-500/20 text-slate-300 space-y-1 text-[11px]">
                <div className="flex items-center gap-1 text-amber-400 font-semibold">
                  <AlertCircle className="w-3 h-3 text-amber-400 flex-shrink-0" />
                  <span>Cảnh báo bẫy ETS</span>
                </div>
                <p className="leading-snug">{item.trap}</p>
              </div>
            </div>

            {/* Citation badge */}
            <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 truncate max-w-[150px]">
                {item.group}
              </span>
              <span className="font-mono font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20 flex-shrink-0">
                {item.citation}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Show more button */}
      {displayCount < filteredWords.length && (
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => setDisplayCount((prev) => prev + 24)}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold transition inline-flex items-center gap-2 cursor-pointer shadow-md"
          >
            <span>Xem thêm {Math.min(24, filteredWords.length - displayCount)} từ tiếp theo (Tổng: {filteredWords.length} từ)</span>
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
