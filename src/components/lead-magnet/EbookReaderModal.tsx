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
    { title: 'Trang 1: Bản Đồ Tư Duy 4 Part', keyword: 'BẢN ĐỒ TƯ DUY', slug: 'ban-do-tu-duy-4-phan-thi' },
    { title: 'Trang 2: Báo Cáo Số Liệu ETS 2024 vs 2026', keyword: 'BÁO CÁO DỮ LIỆU', slug: 'bao-cao-du-lieu-dinh-luong-ets-2024-vs-ets-2026' },
    { title: 'Trang 3: Bẫy từ chỉ nhóm đồ vật lớn', keyword: 'TỬ HUYỆT 1', slug: 'part-1-tu-huyet-1-bay-tu-chi-nhom-do-vat-lon-tu-bao-ham' },
    { title: 'Trang 4: Soi vi cử động ngón tay & mắt', keyword: 'TỬ HUYỆT 2', slug: 'part-1-tu-huyet-2-soi-vi-cu-dong-ngon-tay-anh-mat' },
    { title: 'Trang 5: Đang làm (Being) vs Đã xong (Been)', keyword: 'TỬ HUYỆT 3', slug: 'part-1-tu-huyet-3-bay-dang-lam-being-vs-da-xong-been-meo-soi-hau-canh' },
    { title: 'Trang 6: Đã mặc sẵn vs Đang mặc đồ', keyword: 'TỬ HUYỆT 4', slug: 'part-1-tu-huyet-4-bay-da-mac-san-vs-dang-mac-do-tu-da-nghia' },
    { title: 'Trang 7: Đối đáp câu trần thuật công sở', keyword: 'TỬ HUYỆT 5', slug: 'part-2-tu-huyet-5-cach-doi-dap-cau-tran-thuat-noi-cong-so-statements' },
    { title: 'Trang 8: Trả lời vòng vo, thoái thác', keyword: 'TỬ HUYỆT 6', slug: 'part-2-tu-huyet-6-bay-tra-loi-vong-vo-thoai-thac-be-lai-cau-hoi' },
    { title: 'Trang 9: Quy tắc thật Có Yes - Không No', keyword: 'TỬ HUYỆT 7', slug: 'part-2-tu-huyet-7-quy-tac-that-co-la-yes-khong-la-no-bay-tu-nghe-giong-nhau' },
    { title: 'Trang 10: Đổi chữ Paraphrase 3 Tầng', keyword: 'TỬ HUYỆT 8', slug: 'part-3-tu-huyet-8-ky-thuat-doi-chu-dong-nghia-paraphrase-3-tang' },
    { title: 'Trang 11: Gióng cột biểu đồ & Thoại 3 người', keyword: 'TỬ HUYỆT 9', slug: 'part-3-4-tu-huyet-9-meo-giong-cot-tranh-bieu-do-thoai-3-nguoi' },
    { title: 'Trang 12: 15 câu cửa miệng ngầm ý bản xứ', keyword: 'TỬ HUYỆT 10', slug: 'part-3-4-tu-huyet-10-15-cau-cua-mieng-ngam-y-cua-nguoi-ban-xu' },
    { title: 'Trang 13: 4 mẹo nghe nối âm - nuốt âm', keyword: 'TỬ HUYỆT 11', slug: 'ngu-am-tu-huyet-11-4-meo-nghe-thung-noi-am-nuot-am-ngu-dieu-4-nuoc' },
    { title: 'Trang 14: Tự Chẩn Đoán Lỗ Hổng 15 Bẫy', keyword: 'BẢNG TỰ CHẨN ĐOÁN', slug: 'bang-tu-chan-doan-lo-hong-nghe-15-bay-sat-thu' },
    { title: 'Trang 15: Lộ Trình 30 Ngày & Kế Hoạch', keyword: 'LỘ TRÌNH 30 NGÀY', slug: 'lo-trinh-30-ngay-lot-xac-thinh-giac-ke-hoach-hanh-dong' },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full bg-white border border-slate-200 rounded-3xl flex flex-col shadow-2xl overflow-hidden transition-all duration-300 ${
          isFullScreen
            ? 'h-full fixed inset-0 rounded-none border-none'
            : 'max-w-5xl h-[92vh]'
        }`}
      >
        {/* Modal Top Navbar */}
        <div className="h-16 px-4 sm:px-6 border-b border-slate-200 bg-white/95 backdrop-blur-md flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center font-bold">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 truncate max-w-[220px] sm:max-w-md">
                Bách Khoa Sát Thủ Bài Nghe TOEIC ETS 2024–2026
              </h3>
              <span className="text-[10px] text-emerald-600 font-mono hidden sm:inline">
                Phiên bản Master Edition (LP-LM-TOEIC-LISTEN-2026)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* TOC toggle */}
            <button
              type="button"
              onClick={() => setShowToc(!showToc)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 border border-slate-200 transition cursor-pointer"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mục Lục</span>
            </button>

            {/* Download file */}
            <a
              href="/api/lead-magnet/download"
              download
              className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition flex items-center gap-1 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tải File .MD</span>
            </a>

            {/* Fullscreen toggle */}
            <button
              type="button"
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
              title={isFullScreen ? 'Thu nhỏ' : 'Toàn màn hình'}
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body Container */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Slide-out Table of Contents Sidebar */}
          {showToc && (
            <div className="absolute inset-y-0 left-0 w-72 sm:w-80 bg-white/98 border-r border-slate-200 p-4 z-20 overflow-y-auto space-y-1.5 backdrop-blur-xl shadow-2xl animate-in slide-in-from-left duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                  Mục Lục Trực Tiếp
                </span>
                <button
                  type="button"
                  onClick={() => setShowToc(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="divide-y divide-slate-100 pt-1">
                {tocItems.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => scrollToSection(item)}
                    className="w-full text-left py-2.5 px-2 rounded-lg text-xs font-medium text-slate-700 hover:text-indigo-700 hover:bg-indigo-50/60 transition flex items-center justify-between group cursor-pointer"
                  >
                    <span className="truncate">{item.title}</span>
                    <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 flex-shrink-0 ml-1" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Markdown Content Area */}
          <div
            ref={contentContainerRef}
            className="flex-1 overflow-y-auto px-4 sm:px-10 py-8 text-slate-800 prose prose-slate max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-p:leading-relaxed prose-p:text-slate-700 prose-table:border-collapse"
          >
            {loading ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-500">Đang tải toàn bộ nội dung Ebook...</p>
              </div>
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children, ...props }) => {
                    const text = getTextFromChildren(children);
                    const id = slugifyHeading(text);
                    return (
                      <h1 id={id} className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-8 mb-4 border-b border-slate-200 pb-3" {...props}>
                        {children}
                      </h1>
                    );
                  },
                  h2: ({ children, ...props }) => {
                    const text = getTextFromChildren(children);
                    const id = slugifyHeading(text);
                    return (
                      <h2 id={id} className="text-xl sm:text-2xl font-bold text-indigo-700 mt-8 mb-3 scroll-mt-6" {...props}>
                        {children}
                      </h2>
                    );
                  },
                  h3: ({ children, ...props }) => {
                    const text = getTextFromChildren(children);
                    const id = slugifyHeading(text);
                    return (
                      <h3 id={id} className="text-lg font-bold text-emerald-800 mt-6 mb-2 scroll-mt-6" {...props}>
                        {children}
                      </h3>
                    );
                  },
                  h4: ({ children, ...props }) => {
                    const text = getTextFromChildren(children);
                    const id = slugifyHeading(text);
                    return (
                      <h4 id={id} className="text-base font-bold text-amber-800 mt-5 mb-2 scroll-mt-6" {...props}>
                        {children}
                      </h4>
                    );
                  },
                  table: ({ children, ...props }) => (
                    <div className="overflow-x-auto my-4">
                      <table className="w-full text-xs text-left border border-slate-200 shadow-xs" {...props}>
                        {children}
                      </table>
                    </div>
                  ),
                  th: ({ children, ...props }) => (
                    <th className="bg-slate-100 p-2.5 border border-slate-200 text-slate-800 font-bold" {...props}>
                      {children}
                    </th>
                  ),
                  td: ({ children, ...props }) => (
                    <td className="p-2 border border-slate-200 text-slate-700" {...props}>
                      {children}
                    </td>
                  ),
                  code: ({ children, ...props }) => (
                    <code className="bg-slate-100 text-indigo-700 border border-slate-200 px-1.5 py-0.5 rounded font-mono text-[11px]" {...props}>
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
