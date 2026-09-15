'use client';

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  X,
  Download,
  BookOpen,
  List,
  ChevronRight,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface EbookReaderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function getTextFromChildren(children: React.ReactNode): string {
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  if (Array.isArray(children)) {
    return children.map(getTextFromChildren).join('');
  }
  if (
    React.isValidElement(children) &&
    (children as React.ReactElement<{ children?: React.ReactNode }>).props?.children
  ) {
    return getTextFromChildren(
      (children as React.ReactElement<{ children?: React.ReactNode }>).props.children
    );
  }
  return '';
}

function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export default function EbookReaderModal({ isOpen, onClose }: EbookReaderModalProps) {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [showToc, setShowToc] = useState<boolean>(false);
  const contentContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ignore = false;
    if (isOpen && !content) {
      fetch('/api/lead-magnet/ebook')
        .then((res) => res.json())
        .then((data) => {
          if (!ignore && data.content) {
            setContent(data.content);
          }
        })
        .catch((err) => console.error('Failed to load ebook', err))
        .finally(() => {
          if (!ignore) setLoading(false);
        });
    }
    return () => {
      ignore = true;
    };
  }, [isOpen, content]);

  // Prevent background scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const tocItems = [
    { title: 'Phần I: Cú sốc khảo thí ETS 2024–2026', keyword: 'PHẦN I', slug: 'phan-i-cu-soc-khao-thi-ets-2024-2026-bay-ket-diem-600750' },
    { title: 'Phần II: Ma trận 15 Chiều Sát thủ', keyword: 'PHẦN II', slug: 'phan-ii-ma-tran-15-chieu-khong-gian-sat-thu-the-15-dimension-killer-matrix' },
    { title: 'Khối 1: Part 1 — Tập trận thị giác', keyword: 'KHỐI 1', slug: 'khoi-1-part-1-tap-tran-thi-giac-tu-huyet-mieu-ta-tranh-6-cau-hoi' },
    { title: 'Chiều 1: The Hypernym Engine', keyword: 'CHIỀU 1', slug: 'chieu-1-the-hypernym-abstraction-engine' },
    { title: 'Khối 2: Part 2 — Phản xạ Hỏi - Đáp', keyword: 'KHỐI 2', slug: 'khoi-2-part-2-phan-xa-hoi-dap-vu-khi-tam-ly-khao-thi-25-cau-hoi' },
    { title: 'Chiều 6: Statement Speech Acts', keyword: 'CHIỀU 6', slug: 'chieu-6-the-statement-speech-act-traps' },
    { title: 'Khối 3: Part 3 & 4 — Chuyên sâu', keyword: 'KHỐI 3', slug: 'khoi-3-part-3-part-4-doi-thoai-doc-thoai-chuyen-sau-69-cau-hoi' },
    { title: 'Chiều 11: Paraphrasing Engine', keyword: 'CHIỀU 11', slug: 'chieu-11-the-systematic-paraphrasing-engine' },
    { title: 'Phần III: Từ điển sát thủ 150 cụm từ', keyword: 'PHẦN III', slug: 'phan-iii-tu-dien-sat-thu-150-cum-tu-collocations-tan-suat-cao-nhat-ets-2024-ets-2026' },
    { title: 'Phần IV: Bảng tự chẩn đoán 15 chiều', keyword: 'PHẦN IV', slug: 'phan-iv-bang-tu-danh-gia-do-nhay-thinh-giac-15-chieu' },
    { title: 'Phần V: Huấn luyện FSRS LingoPro', keyword: 'PHẦN V', slug: 'phan-v-he-thong-huan-luyen-phan-xa-fsrs-native-shadowing-tren-lingopro' },
    { title: 'Phần VI: Lộ trình 30 ngày & Kỷ luật', keyword: 'PHẦN VI', slug: 'phan-vi-thu-thach-ky-luat-hoan-tien-giam-dan-lo-trinh-but-pha-30-ngay' },
  ];

  const scrollToSection = (item: { slug: string; keyword: string }) => {
    setShowToc(false);
    // 1. Try direct slug ID
    let element = document.getElementById(item.slug);
    // 2. If not found, search in contentContainer for element containing the keyword
    if (!element && contentContainerRef.current) {
      const headings = contentContainerRef.current.querySelectorAll('h1, h2, h3, h4');
      for (const h of Array.from(headings)) {
        if (h.textContent && h.textContent.toUpperCase().includes(item.keyword)) {
          element = h as HTMLElement;
          break;
        }
      }
    }

    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full bg-slate-950 border border-slate-800 rounded-3xl flex flex-col shadow-2xl overflow-hidden transition-all duration-300 ${
          isFullScreen
            ? 'h-full fixed inset-0 rounded-none border-none'
            : 'max-w-5xl h-[92vh]'
        }`}
      >
        {/* Modal Top Navbar */}
        <div className="h-16 px-4 sm:px-6 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white truncate max-w-[220px] sm:max-w-md">
                Bách Khoa Sát Thủ Bài Nghe TOEIC ETS 2024–2026
              </h3>
              <span className="text-[10px] text-emerald-400 font-mono hidden sm:inline">
                Phiên bản Master Edition (LP-LM-TOEIC-LISTEN-2026)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* TOC toggle */}
            <button
              type="button"
              onClick={() => setShowToc(!showToc)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mục Lục</span>
            </button>

            {/* Download file */}
            <a
              href="/api/lead-magnet/download"
              download
              className="px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 transition flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tải File .MD</span>
            </a>

            {/* Fullscreen toggle */}
            <button
              type="button"
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title={isFullScreen ? 'Thu nhỏ' : 'Toàn màn hình'}
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-rose-500/20 hover:text-rose-400 transition ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body Container */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Slide-out Table of Contents Sidebar */}
          {showToc && (
            <div className="absolute inset-y-0 left-0 w-72 sm:w-80 bg-slate-900/95 border-r border-slate-800 p-4 z-20 overflow-y-auto space-y-1.5 backdrop-blur-xl shadow-2xl animate-in slide-in-from-left duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                  Mục Lục Trực Tiếp
                </span>
                <button
                  type="button"
                  onClick={() => setShowToc(false)}
                  className="p-1 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="divide-y divide-slate-800/60 pt-1">
                {tocItems.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => scrollToSection(item)}
                    className="w-full text-left py-2.5 px-2 rounded-lg text-xs font-medium text-slate-300 hover:text-indigo-300 hover:bg-slate-800/60 transition flex items-center justify-between group cursor-pointer"
                  >
                    <span className="truncate">{item.title}</span>
                    <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-indigo-400 flex-shrink-0 ml-1" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Markdown Content Area */}
          <div
            ref={contentContainerRef}
            className="flex-1 overflow-y-auto px-4 sm:px-10 py-8 text-slate-200 prose prose-invert max-w-none prose-headings:font-bold prose-headings:text-white prose-p:leading-relaxed prose-table:border-collapse prose-th:border prose-th:border-slate-800 prose-td:border prose-td:border-slate-800 prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-800"
          >
            {loading ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-400">Đang tải toàn bộ nội dung Ebook...</p>
              </div>
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children, ...props }) => {
                    const text = getTextFromChildren(children);
                    const id = slugifyHeading(text);
                    return (
                      <h1 id={id} className="text-2xl sm:text-3xl font-extrabold text-white mt-8 mb-4 border-b border-slate-800 pb-3" {...props}>
                        {children}
                      </h1>
                    );
                  },
                  h2: ({ children, ...props }) => {
                    const text = getTextFromChildren(children);
                    const id = slugifyHeading(text);
                    return (
                      <h2 id={id} className="text-xl sm:text-2xl font-bold text-indigo-200 mt-8 mb-3 scroll-mt-6" {...props}>
                        {children}
                      </h2>
                    );
                  },
                  h3: ({ children, ...props }) => {
                    const text = getTextFromChildren(children);
                    const id = slugifyHeading(text);
                    return (
                      <h3 id={id} className="text-lg font-bold text-emerald-300 mt-6 mb-2 scroll-mt-6" {...props}>
                        {children}
                      </h3>
                    );
                  },
                  h4: ({ children, ...props }) => {
                    const text = getTextFromChildren(children);
                    const id = slugifyHeading(text);
                    return (
                      <h4 id={id} className="text-base font-bold text-amber-300 mt-5 mb-2 scroll-mt-6" {...props}>
                        {children}
                      </h4>
                    );
                  },
                  table: ({ children, ...props }) => (
                    <div className="overflow-x-auto my-4">
                      <table className="w-full text-xs text-left border border-slate-800" {...props}>
                        {children}
                      </table>
                    </div>
                  ),
                  th: ({ children, ...props }) => (
                    <th className="bg-slate-900 p-2.5 border border-slate-800 text-slate-300 font-bold" {...props}>
                      {children}
                    </th>
                  ),
                  td: ({ children, ...props }) => (
                    <td className="p-2 border border-slate-800/80 text-slate-300" {...props}>
                      {children}
                    </td>
                  ),
                  code: ({ children, ...props }) => (
                    <code className="bg-slate-900 text-indigo-300 px-1.5 py-0.5 rounded font-mono text-[11px]" {...props}>
                      {children}
                    </code>
                  ),
                }}
              >
                {content}
              </ReactMarkdown>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
