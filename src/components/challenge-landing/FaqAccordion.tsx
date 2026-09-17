'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { challengeFaqs } from '@/data/challenge/faqs';
export { challengeFaqs };
export type { FaqItem } from '@/data/challenge/faqs';


export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-24 bg-white border-t border-slate-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs uppercase tracking-wider mb-3">
            <HelpCircle className="w-4 h-4 text-indigo-600" />
            Giải Đáp Thắc Mắc
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-3">
            Câu Hỏi Thường Gặp Về Thử Thách
          </h2>
          <p className="text-slate-600 text-base">
            Mọi điều bạn cần biết trước khi bước chân lên con thuyền kỷ luật cùng LingoPro.
          </p>
        </div>

        <div className="space-y-4">
          {challengeFaqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="border border-slate-200 rounded-2xl overflow-hidden transition-all duration-200 bg-white shadow-xs hover:border-slate-300"
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full flex items-center justify-between p-5 sm:p-6 text-left font-bold text-slate-900 hover:text-indigo-600 transition-colors"
                  aria-expanded={isOpen}
                >
                  <h3 className="text-base sm:text-lg pr-4 font-bold text-slate-900 leading-snug">
                    {faq.question}
                  </h3>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                      isOpen ? 'bg-indigo-50 text-indigo-600 rotate-180' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 pt-1 text-slate-600 text-sm sm:text-base leading-relaxed border-t border-slate-100 bg-slate-50/50 animate-in fade-in duration-200">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center p-6 rounded-2xl bg-indigo-50/70 border border-indigo-100">
          <p className="text-sm font-medium text-slate-700">
            Bạn vẫn còn câu hỏi khác cần được tư vấn chi tiết hơn?
          </p>
          <a
            href="https://zalo.me"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-black text-indigo-600 hover:underline mt-2"
          >
            Chat trực tiếp qua Zalo Hỗ Trợ 24/7 &rarr;
          </a>
        </div>
      </div>
    </section>
  );
}
