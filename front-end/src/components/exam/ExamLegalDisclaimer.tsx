'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ExternalLink } from 'lucide-react';

interface ExamLegalDisclaimerProps {
  examType?: 'toeic' | 'vstep' | 'general';
  className?: string;
  compact?: boolean;
}

export function ExamLegalDisclaimer({
  examType = 'toeic',
  className = '',
  compact = false,
}: ExamLegalDisclaimerProps) {
  return (
    <footer
      aria-label="Tuyên bố bản quyền và miễn trừ trách nhiệm khảo thí"
      className={`border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/60 transition-colors ${
        compact ? 'py-4 px-3 sm:px-4 text-[11px]' : 'py-6 px-4 sm:px-6 lg:px-8 text-xs'
      } ${className}`}
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono text-slate-500 dark:text-slate-400">
          <div className="flex items-start sm:items-center gap-2 max-w-4xl leading-relaxed">
            <ShieldAlert className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500 mt-0.5 sm:mt-0" />
            <p className="text-justify sm:text-left">
              <strong className="text-slate-700 dark:text-slate-300 font-semibold">
                Tuyên bố sở hữu trí tuệ &amp; Miễn trừ liên kết:
              </strong>{' '}
              {examType === 'toeic' && (
                <>
                  TOEIC® là nhãn hiệu đã đăng ký của Viện Khảo thí Giáo dục Hoa Kỳ (ETS). LingoPro là nền tảng công nghệ giáo dục độc lập phục vụ mục đích tự học và rèn luyện kỹ năng, không liên kết, không được tài trợ hoặc phê duyệt bởi ETS hay IIG Việt Nam.
                </>
              )}
              {examType === 'vstep' && (
                <>
                  VSTEP (Vietnamese Standardized Test of English Proficiency) được xây dựng theo Khung năng lực ngoại ngữ 6 bậc dùng cho Việt Nam của Bộ GD&amp;ĐT. LingoPro cung cấp đề thi mô phỏng phục vụ mục đích tự đánh giá năng lực của học viên.
                </>
              )}
              {examType === 'general' && (
                <>
                  Các bài thi thử và bộ đề trên LingoPro được biên soạn mô phỏng theo định dạng khảo thí chuẩn quốc tế nhằm hỗ trợ học viên tự đánh giá năng lực học tập độc lập.
                </>
              )}{' '}
              Mọi thuật toán khảo thí, động cơ chống trùng lặp, lời giải thích tiếng Việt và phân tích sư phạm thuộc bản quyền của LingoPro © 2026.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 pt-1 sm:pt-0">
            <Link
              href="/terms#exam-disclaimer"
              className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white underline decoration-slate-300 dark:decoration-slate-700 underline-offset-2 transition-colors"
            >
              <span>Điều khoản bản quyền</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
