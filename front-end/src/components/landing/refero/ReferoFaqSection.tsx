'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { FAQ_DATA } from './faq-data';

export function ReferoFaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2.5 mb-10 max-w-xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700 uppercase tracking-wider">
          <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
          <span>Giải Đáp Thắc Mắc</span>
        </div>
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
          Câu Hỏi Thường Gặp
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Mọi điều bạn cần biết trước khi bắt đầu học tập cùng LingoPro.
        </p>
      </div>

      {/* Accordion List (Bright Theme) */}
      <div className="space-y-3.5">
        {FAQ_DATA.map((item, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="rounded-md bg-white border border-slate-300 overflow-hidden transition-all shadow-xs"
            >
              <button
                onClick={() => toggle(idx)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
                aria-expanded={isOpen}
              >
                <span className="text-sm sm:text-base font-bold text-slate-900">
                  {item.q}
                </span>
                <div
                  className={`p-1.5 rounded bg-slate-100 text-slate-600 shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-white bg-blue-600' : ''
                  }`}
                >
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>

              {isOpen && (
                <div className="px-5 pb-5 sm:px-6 sm:pb-6 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4 animate-in fade-in duration-200 font-normal">
                  {item.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
