'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Save,
  Copy,
  Download,
  Trash2,
  Sparkles,
  Check,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';

export interface ToeicLessonNotesProps {
  lessonId: string;
  lessonTitle: string;
  className?: string;
}

export function ToeicLessonNotes({
  lessonId,
  lessonTitle,
  className = '',
}: ToeicLessonNotesProps) {
  const storageKey = `lingo_toeic_note_${lessonId}`;
  const [noteContent, setNoteContent] = useState<string>('');
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Hydrate note from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null) {
        setNoteContent(saved);
      } else {
        // Initial clean template
        setNoteContent('');
      }
    } catch {
      // Ignore read error
    }
  }, [storageKey]);

  // Debounced auto-save
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextText = e.target.value;
    setNoteContent(nextText);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, nextText);
        const now = new Date();
        const timeStr = now.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        setLastSavedTime(timeStr);
      } catch {
        // Ignore write error
      }
    }, 600);
  };

  // Quick template insertions
  const insertTemplate = (templateText: string) => {
    const updated = noteContent ? `${noteContent}\n\n${templateText}` : templateText;
    setNoteContent(updated);
    try {
      localStorage.setItem(storageKey, updated);
      const now = new Date();
      setLastSavedTime(
        now.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      toast.success('Đã chèn mẫu ghi chú');
    } catch {
      // Ignore write error
    }
  };

  // Copy to clipboard
  const handleCopy = async () => {
    if (!noteContent) return;
    try {
      await navigator.clipboard.writeText(noteContent);
      setIsCopied(true);
      toast.success('Đã sao chép ghi chú vào clipboard');
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast.error('Không thể sao chép ghi chú');
    }
  };

  // Download as markdown file
  const handleDownload = () => {
    if (!noteContent) return;
    const blob = new Blob([noteContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Ghi-chu-${lessonId}-${lessonTitle.replace(/[^a-zA-Z0-9]/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Đã tải xuống file ghi chú');
  };

  // Clear note
  const handleClear = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ ghi chú của bài học này không?')) {
      setNoteContent('');
      try {
        localStorage.removeItem(storageKey);
        setLastSavedTime(null);
        toast.info('Đã xóa ghi chú');
      } catch {
        // Ignore
      }
    }
  };

  const wordCount = noteContent.trim() ? noteContent.trim().split(/\s+/).length : 0;
  const charCount = noteContent.length;

  return (
    <div
      className={`rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs ${className}`}
    >
      {/* Header bar */}
      <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Sổ Tay Ghi Chú Cá Nhân · {lessonId}
          </span>
          {lastSavedTime && (
            <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Check className="h-3 w-3" />
              Đã lưu {lastSavedTime}
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            disabled={!noteContent}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed font-mono text-xs transition cursor-pointer"
            title="Sao chép toàn bộ ghi chú"
          >
            {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            <span>Sao chép</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={!noteContent}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed font-mono text-xs transition cursor-pointer"
            title="Tải về file .md"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Tải .md</span>
          </button>

          <button
            type="button"
            onClick={handleClear}
            disabled={!noteContent}
            className="p-1 rounded-xs hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            title="Xóa ghi chú"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Quick template chip buttons */}
      <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 flex flex-wrap items-center gap-2">
        <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">
          Chèn nhanh:
        </span>

        <button
          type="button"
          onClick={() => insertTemplate(`### ⚡ Công thức cốt lõi:\n- \n`)}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[11px] transition cursor-pointer"
        >
          <Plus className="h-3 w-3 text-amber-500" />
          <span>+ Công thức</span>
        </button>

        <button
          type="button"
          onClick={() => insertTemplate(`### 📚 Từ vựng / Collocation mới:\n- **Từ vựng**: \n  - Định nghĩa: \n  - Ví dụ: \n`)}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[11px] transition cursor-pointer"
        >
          <Plus className="h-3 w-3 text-blue-500" />
          <span>+ Từ mới</span>
        </button>

        <button
          type="button"
          onClick={() => insertTemplate(`### ⚠️ Bẫy ETS cần chú ý:\n- Bẫy: \n- Cách giải độc: \n`)}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[11px] transition cursor-pointer"
        >
          <Plus className="h-3 w-3 text-rose-500" />
          <span>+ Bẫy đề thi</span>
        </button>
      </div>

      {/* Editor textarea */}
      <div className="p-4">
        <textarea
          value={noteContent}
          onChange={handleContentChange}
          placeholder={`Ghi lại các ghi nhớ cá nhân cho bài học "${lessonTitle}"... (Hệ thống tự động lưu trên trình duyệt của bạn)`}
          rows={12}
          className="w-full rounded-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3 font-mono text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-amber-500 resize-y leading-relaxed"
        />
      </div>

      {/* Footer info */}
      <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between font-mono text-[11px] text-slate-400">
        <span>Định dạng: Markdown plain text</span>
        <span>
          {wordCount} từ · {charCount} ký tự
        </span>
      </div>
    </div>
  );
}
