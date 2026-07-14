'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/auth-fetch';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Brain, ChevronLeft, Upload, FileText, Camera, Loader2,
  CheckCircle2, XCircle, SkipForward, Trash2, Plus, BookMarked, ArrowRight
} from 'lucide-react';
import { StudentShell } from '@/components/student/StudentShell';
import type { Row } from 'exceljs';

type Tab = 'text' | 'file' | 'ocr' | 'csv';
type WordStatus = 'pending' | 'saving' | 'saved' | 'duplicate' | 'error';

const WORD_STATUS_LABELS: Record<WordStatus, string> = {
  pending: 'chờ nhập',
  saving: 'đang lưu',
  saved: 'đã lưu',
  duplicate: 'đã có',
  error: 'lỗi',
};

interface ImportWord {
  id: string;
  word: string;
  translation?: string;
  status: WordStatus;
  message?: string;
}

interface CsvRow {
  id: string;
  word: string;
  translation: string;
}

const MAX_IMPORT_WORDS = 30;

function limitUniqueWords<T extends { word: string }>(items: T[]): { items: T[]; overflow: number } {
  const seen = new Set<string>();
  const unique = items.filter((item) => {
    const key = item.word.trim().toLocaleLowerCase('vi');
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return {
    items: unique.slice(0, MAX_IMPORT_WORDS),
    overflow: Math.max(0, unique.length - MAX_IMPORT_WORDS),
  };
}

function extractOcrWords(data: unknown): string[] {
  if (!data || typeof data !== 'object' || !('words' in data)) return [];
  const words = (data as { words?: unknown }).words;
  if (!Array.isArray(words)) return [];
  return words
    .filter((word): word is string => typeof word === 'string')
    .map((word) => word.trim())
    .filter((word) => word.length > 0 && word.length < 80);
}

function parseCSV(text: string): Array<{ word: string; translation: string }> {
  return text.trim().split('\n')
    .map(line => line.split(',').map(s => s.trim().replace(/^"|"$/g, '')))
    .filter(cols => cols.length >= 2 && cols[0].length > 0)
    .map(cols => ({ word: cols[0], translation: cols[1] || '' }));
}

export default function ImportPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [classroomId, setClassroomId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('text');

  // Text import
  const [bulkText, setBulkText] = useState('');
  const [wordList, setWordList] = useState<ImportWord[]>([]);
  const [wordOverflow, setWordOverflow] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  // File import
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');

  // CSV import
  const csvFileRef = useRef<HTMLInputElement>(null);
  const [csvFileName, setCsvFileName] = useState('');
  const [csvSkipHeader, setCsvSkipHeader] = useState(true);
  const [csvRows, setCsvRows] = useState<CsvRow[]>([]);
  const [csvOverflow, setCsvOverflow] = useState(0);
  const [csvIsDragging, setCsvIsDragging] = useState(false);
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvProgress, setCsvProgress] = useState(0);

  // OCR
  const imageRef = useRef<HTMLInputElement>(null);
  const [ocrImage, setOcrImage] = useState<string | null>(null);
  const [ocrImageFile, setOcrImageFile] = useState<File | null>(null);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrWords, setOcrWords] = useState<ImportWord[]>([]);
  const [ocrOverflow, setOcrOverflow] = useState(0);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { router.push('/auth'); return; }
      setUserId(session.user.id);

      const res = await authFetch(`/api/words`);
      const data = await res.json();
      if (data.classroomId) setClassroomId(data.classroomId);
    })();
  }, [router]);

  // ── CSV handlers ──
  const processCsvText = (text: string, skipHeader: boolean) => {
    const parsed = parseCSV(text);
    const rows = skipHeader ? parsed.slice(1) : parsed;
    const limited = limitUniqueWords(rows);
    setCsvRows(limited.items.map((r, i) => ({ id: `csv-${i}`, word: r.word, translation: r.translation })));
    setCsvOverflow(limited.overflow);
  };

  const handleCsvFile = (file: File) => {
    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      processCsvText(text, csvSkipHeader);
    };
    reader.readAsText(file);
  };

  const handleCsvFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleCsvFile(file);
  };

  const handleCsvDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setCsvIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleCsvFile(file);
  };

  const removeCsvRow = (id: string) => {
    setCsvRows(prev => prev.filter(r => r.id !== id));
  };

  const importCsvWords = async () => {
    if (!userId || csvRows.length === 0) return;
    const rowsToImport = limitUniqueWords(csvRows).items;
    setCsvImporting(true);
    setCsvProgress(0);

    let done = 0;
    let errors = 0;

    for (const row of rowsToImport) {
      try {
        const res = await authFetch('/api/words', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            word: row.word,
            translation: row.translation,
            classroomId,
            skipAI: true,
          }),
        });
        const data = await res.json();
        if (!data.success && !data.alreadyExists) errors++;
      } catch {
        errors++;
      }
      done++;
      setCsvProgress(Math.round((done / rowsToImport.length) * 100));
    }

    if (done > 0 && classroomId) {
      toast.loading(`Đang chạy AI phân tích ${done} từ...`, { id: 'csv-batch-toast' });
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const refreshRes = await fetch('/api/words/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token ?? ''}` },
          body: JSON.stringify({ classroomId }),
        });
        const refreshData = await refreshRes.json();
        if (refreshData.success) {
          toast.success(`Đã nhập ${done - errors} từ, ${errors} lỗi. AI đã phân tích ${refreshData.refreshed} từ.`, { id: 'csv-batch-toast' });
        } else {
          throw new Error();
        }
      } catch {
        toast.success(`Đã nhập ${done - errors} từ, ${errors} lỗi.`, { id: 'csv-batch-toast' });
      }
    } else {
      toast.success(`Đã nhập ${done - errors} từ, ${errors} lỗi.`);
    }

    setCsvImporting(false);
    setCsvRows([]);
    setCsvOverflow(0);
    setCsvFileName('');
    setCsvProgress(0);
    if (csvFileRef.current) csvFileRef.current.value = '';
  };

  // ── Parse bulk text into words ──
  const parseText = () => {
    if (!bulkText.trim()) return;
    const lines = bulkText.split(/[\n,;]+/).map(l => l.trim()).filter(l => l.length > 0 && l.length < 80);
    const limited = limitUniqueWords(lines.map((word) => ({ word })));
    setWordList(limited.items.map(({ word }, i) => ({ id: String(i), word, status: 'pending' })));
    setWordOverflow(limited.overflow);
  };

  // ── Parse Excel/CSV ──
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    try {
      // Sheet rows: mỗi hàng là mảng cells (string | number | boolean | Date | null)
      type SheetCell = string | number | boolean | Date | null | undefined;
      const rows: SheetCell[][] = [];

      if (/\.csv$/i.test(file.name)) {
        // CSV: parse text thuần (không cần thư viện) — tránh parser nhị phân có lỗ hổng.
        const text = await file.text();
        text
          .split(/\r?\n/)
          .filter((line) => line.trim().length > 0)
          .forEach((line) => rows.push(line.split(',').map((c) => c.trim().replace(/^"(.*)"$/, '$1'))));
      } else {
        // .xlsx: exceljs (load động — chỉ tải khi user upload, khỏi initial bundle).
        const ExcelJS = await import('exceljs');
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.load(await file.arrayBuffer());
        const ws = wb.worksheets[0];
        const cellText = (v: unknown): SheetCell => {
          if (v == null) return '';
          if (typeof v === 'object') {
            const o = v as Record<string, unknown>;
            if (typeof o.text === 'string') return o.text; // hyperlink cell
            if (Array.isArray(o.richText)) return (o.richText as { text?: string }[]).map((t) => t.text ?? '').join('');
            if ('result' in o) return String(o.result ?? ''); // formula cell
            return String(v);
          }
          return v as SheetCell;
        };
        // exceljs row.values là mảng 1-based (index 0 = null) → slice(1) để khớp cột 0-based.
        ws?.eachRow({ includeEmpty: false }, (row: Row) => {
          const vals = Array.isArray(row.values) ? (row.values as unknown[]).slice(1) : [];
          rows.push(vals.map(cellText));
        });
      }

      // Find a column named "word" or use the first column
      const header = rows[0]?.map((h) => String(h ?? '').toLowerCase()) || [];
      const wordColIdx = header.findIndex((h) => h.includes('word') || h.includes('từ')) ?? 0;
      const col = wordColIdx >= 0 ? wordColIdx : 0;

      // Find translation column if present
      const transColIdx = header.findIndex((h) =>
        h.includes('translation') || h.includes('meaning') || h.includes('dịch') || h.includes('nghĩa') || h.includes('definition') || h.includes('vietnamese') || h.includes('tiếng việt')
      );

      const importedList = rows
        .slice(header.length > 0 ? 1 : 0)
        .map((r) => {
          const w = String(r[col] || '').trim();
          const t = transColIdx >= 0 ? String(r[transColIdx] || '').trim() : '';
          return { word: w, translation: t };
        })
        .filter((item) => item.word.length > 0 && item.word.length < 80);

      const limited = limitUniqueWords(importedList);

      setWordList(limited.items.map((item, i) => ({
        id: String(i),
        word: item.word,
        translation: item.translation || undefined,
        status: 'pending'
      })));
      setWordOverflow(limited.overflow);
      toast.success(`Đã đọc ${limited.items.length} từ từ ${file.name}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error('Không thể đọc file: ' + msg);
    }
  };

  // ── OCR from image using Gemini Vision ──
  // Compress image before upload to avoid Vercel 4.5MB payload limit
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200; // Optimal for OCR without losing text
          const MAX_HEIGHT = 1600;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Compress to JPEG 70% quality (reduces size from 5MB to ~300KB)
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Create immediate basic preview
    const objectUrl = URL.createObjectURL(file);
    setOcrImage(objectUrl); 
    setOcrImageFile(file);
  };

  const runOCR = async () => {
    if (!ocrImageFile) return;
    setIsOcrProcessing(true);
    setOcrWords([]);
    setOcrOverflow(0);
    
    try {
      // Compress right before sending
      toast.info('Đang chuẩn bị ảnh...', { id: 'ocr-toast' });
      const compressedDataUrl = await compressImage(ocrImageFile);
      const base64 = compressedDataUrl.split(',')[1];
      const mimeType = 'image/jpeg';

      toast.loading('AI đang quét từ vựng...', { id: 'ocr-toast' });
      
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/import/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token ?? ''}` },
        body: JSON.stringify({ base64, mimeType }),
      });
      
      if (!res.ok) {
         if (res.status === 413) throw new Error('Ảnh vẫn quá lớn. Hãy chụp lại từ xa hơn.');
         try {
           const errData = await res.json();
           throw new Error(errData.error || `Lỗi HTTP ${res.status}`);
         } catch {
           throw new Error(`Máy chủ trả về lỗi (${res.status}).`);
         }
      }

      const data: unknown = await res.json();
      const limited = limitUniqueWords(extractOcrWords(data).map((word) => ({ word })));
      if (limited.items.length > 0) {
        setOcrWords(limited.items.map(({ word }, i) => ({ id: `ocr-${i}`, word, status: 'pending' })));
        setOcrOverflow(limited.overflow);
        toast.success(`Đã tìm thấy ${limited.items.length} từ.`, { id: 'ocr-toast' });
      } else {
        setOcrOverflow(0);
        toast.info('Không tìm thấy từ vựng. Hãy thử ảnh rõ hơn.', { id: 'ocr-toast' });
      }
    } catch (err: unknown) {
      console.error('[OCR] Lỗi quét ảnh:', err);
      const msg = err instanceof Error ? err.message : 'Không thể quét ảnh';
      toast.error(msg, { id: 'ocr-toast' });
    } finally {
      setIsOcrProcessing(false);
    }
  };

  // ── Import words to database ──
  const importWords = async (words: ImportWord[], setWords: React.Dispatch<React.SetStateAction<ImportWord[]>>) => {
    if (!userId || words.length === 0) return;
    setIsImporting(true);
    setImportProgress(0);

    const pending = limitUniqueWords(words.filter(w => w.status === 'pending')).items;
    let done = 0;

    for (const w of pending) {
      setWords(prev => prev.map(p => p.id === w.id ? { ...p, status: 'saving' } : p));

      try {
        const res = await authFetch('/api/words', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            word: w.word,
            translation: w.translation,
            classroomId,
            skipAI: true, // fast insert
          }),
        });
        const data = await res.json();
        const status: WordStatus = data.alreadyExists ? 'duplicate' : (data.success ? 'saved' : 'error');
        setWords(prev => prev.map(p => p.id === w.id ? { ...p, status, message: data.message } : p));
      } catch {
        setWords(prev => prev.map(p => p.id === w.id ? { ...p, status: 'error' } : p));
      }

      done++;
      setImportProgress(Math.round((done / pending.length) * 100));
    }

    if (done > 0 && classroomId) {
      toast.loading(`Đang chạy AI phân tích ${done} từ...`, { id: 'batch-toast' });
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const refreshRes = await fetch('/api/words/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token ?? ''}` },
          body: JSON.stringify({ classroomId }),
        });
        const refreshData = await refreshRes.json();
        if (refreshData.success) {
          toast.success(`Nhập hoàn tất. AI đã phân tích ${refreshData.refreshed} từ.`, { id: 'batch-toast' });
        } else {
          throw new Error('AI phân tích thất bại');
        }
      } catch {
        toast.error(`Đã nhập ${done} từ. AI phân tích thất bại; hãy chọn "Thử lại AI" trong trang học.`, { id: 'batch-toast' });
      }
    } else if (done > 0) {
      toast.success(`Nhập hoàn tất: đã lưu ${done} từ.`);
    }

    setIsImporting(false);
  };

  const removeWord = (id: string, setWords: React.Dispatch<React.SetStateAction<ImportWord[]>>) => {
    setWords(prev => prev.filter(w => w.id !== id));
  };

  const StatusIcon = ({ status }: { status: WordStatus }) => {
    if (status === 'saving') return <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />;
    if (status === 'saved') return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    if (status === 'duplicate') return <SkipForward className="h-4 w-4 text-indigo-400" />;
    if (status === 'error') return <XCircle className="h-4 w-4 text-red-500" />;
    return <div className="w-2 h-2 bg-slate-300 rounded-full mt-1" />;
  };

  const WordListPanel = ({
    words,
    setWords,
    label,
    overflowCount,
    onClear,
  }: {
    words: ImportWord[];
    setWords: React.Dispatch<React.SetStateAction<ImportWord[]>>;
    label: string;
    overflowCount: number;
    onClear: () => void;
  }) => (
    <div className="space-y-3">
      {overflowCount > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          Có {overflowCount} từ vượt giới hạn {MAX_IMPORT_WORDS} từ/lượt. Đã giữ {MAX_IMPORT_WORDS} từ đầu tiên sau khi loại trùng; hãy chia phần còn lại thành lô khác.
        </div>
      )}
      {words.length > 0 && (
        <>
          {isImporting && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground font-medium">
                <span>Đang nhập...</span><span>{importProgress}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 transition-all duration-300 rounded-full" style={{ width: `${importProgress}%` }} />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-muted-foreground">{label}: {words.length}/{MAX_IMPORT_WORDS} từ</span>
            <div className="flex gap-2">
              <button
                onClick={onClear}
                className="text-xs text-red-500 hover:underline"
              >Xóa</button>
              <button
                onClick={() => importWords(words, setWords)}
                disabled={isImporting || words.every(w => w.status !== 'pending')}
                className="flex items-center gap-1.5 bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {isImporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                {isImporting ? 'Đang nhập...' : `Nhập ${words.filter(w => w.status === 'pending').length} từ`}
              </button>
            </div>
          </div>

          <div className="bg-background border rounded-2xl overflow-hidden max-h-80 overflow-y-auto">
            {words.map(w => (
              <div key={w.id} className="flex items-center gap-3 px-4 py-3 border-b last:border-0 hover:bg-muted/30">
                <StatusIcon status={w.status} />
                <span className={`flex-1 text-sm font-medium ${w.status === 'duplicate' ? 'text-muted-foreground line-through' : ''}`}>{w.word}</span>
                <span className="text-[10px] text-muted-foreground">{WORD_STATUS_LABELS[w.status]}</span>
                {w.status === 'pending' && (
                  <button onClick={() => removeWord(w.id, setWords)} className="text-muted-foreground hover:text-red-500 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );

  return (
    <StudentShell title="Nhập danh sách riêng" contentClassName="p-0">
      <div className="min-h-[calc(100dvh-var(--header-h)-var(--safe-top))] bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 font-sans">
      {/* Header */}
      <header className="sticky top-[62px] z-10 flex h-16 items-center gap-4 border-b bg-white/80 px-4 backdrop-blur sm:px-6">
        <Link href="/student">
          <button className="flex items-center gap-2 text-muted-foreground hover:text-indigo-600 font-bold text-sm transition-colors">
            <ChevronLeft className="h-5 w-5" /> Trang học
          </button>
        </Link>
        <div className="flex items-center gap-2 font-black text-slate-800">
          <Brain className="h-6 w-6 text-indigo-600" />
          <span>Nhập từ thủ công</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 sm:p-8 space-y-6">
        {/* Banner dẫn sang Thư viện chuyên đề (đã tách khỏi đây cho dễ tìm) */}
        <Link
          href="/library"
          className="group flex items-center gap-4 rounded-2xl p-4 bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-200/50 hover:brightness-110 transition-all"
        >
          <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <BookMarked className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-sm sm:text-base">Ưu tiên học từ Thư viện theo chủ đề</p>
            <p className="text-xs text-white/80 font-medium">Chọn micro-pack ngắn, đúng mục tiêu và nhập một chạm. Công cụ thủ công chỉ dành cho lô nhỏ.</p>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 group-hover:translate-x-0.5 transition-transform" />
        </Link>

        {/* Tab switcher */}
        <div className="bg-white border rounded-2xl p-1.5 flex gap-1 shadow-sm flex-wrap">
          {([
            { key: 'text', icon: FileText, label: 'Dán văn bản' },
            { key: 'file', icon: Upload, label: 'Excel / CSV' },
            { key: 'csv', icon: FileText, label: 'CSV + Nghĩa' },
            { key: 'ocr', icon: Camera, label: 'Quét ảnh' },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                tab === t.key
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                  : 'text-muted-foreground hover:bg-muted/50'
              }`}
            >
              <t.icon className="h-4 w-4" />
              <span className="hidden md:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── TAB: Paste Text ── */}
        {tab === 'text' && (
          <div className="bg-white border rounded-2xl p-6 space-y-4 shadow-sm">
            <div>
              <h2 className="font-black text-lg">Dán hoặc nhập danh sách từ</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Mỗi dòng một từ, hoặc phân tách bằng dấu phẩy/chấm phẩy. Tối đa {MAX_IMPORT_WORDS} từ duy nhất mỗi lượt.
              </p>
            </div>
            <textarea
              value={bulkText}
              onChange={e => setBulkText(e.target.value)}
              placeholder={"apple\nbanana, cherry\nMỗi dòng một từ..."}
              className="w-full h-48 border rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 font-mono"
            />
            <button
              onClick={parseText}
              disabled={!bulkText.trim()}
              className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              Tách danh sách từ →
            </button>
            <WordListPanel
              words={wordList}
              setWords={setWordList}
              label="Từ sẵn sàng"
              overflowCount={wordOverflow}
              onClear={() => { setWordList([]); setWordOverflow(0); }}
            />
          </div>
        )}

        {/* ── TAB: Excel/CSV ── */}
        {tab === 'file' && (
          <div className="bg-white border rounded-2xl p-6 space-y-4 shadow-sm">
            <div>
              <h2 className="font-black text-lg">Tải lên Excel hoặc CSV</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Dùng cột <code className="bg-muted px-1 rounded text-xs">word</code> hoặc <code className="bg-muted px-1 rounded text-xs">từ</code>; nếu không có, hệ thống dùng cột đầu tiên. Tối đa {MAX_IMPORT_WORDS} từ duy nhất mỗi lượt.
              </p>
            </div>

            <button
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-indigo-200 hover:border-indigo-400 rounded-2xl p-10 flex flex-col items-center gap-3 transition-colors group"
            >
              <div className="w-14 h-14 bg-indigo-50 group-hover:bg-indigo-100 rounded-2xl flex items-center justify-center transition-colors">
                <Upload className="h-7 w-7 text-indigo-500" />
              </div>
              <div className="text-center">
                <p className="font-bold text-sm">{fileName || 'Chọn file để tải lên'}</p>
                <p className="text-xs text-muted-foreground mt-1">Hỗ trợ .xlsx, .csv</p>
              </div>
            </button>
            <input ref={fileRef} type="file" accept=".xlsx,.csv" className="hidden" onChange={handleFileUpload} />
            <WordListPanel
              words={wordList}
              setWords={setWordList}
              label="Từ từ file"
              overflowCount={wordOverflow}
              onClear={() => { setWordList([]); setWordOverflow(0); }}
            />
          </div>
        )}

        {/* ── TAB: CSV với dịch nghĩa ── */}
        {tab === 'csv' && (
          <div className="bg-white border rounded-2xl p-6 space-y-4 shadow-sm">
            <div>
              <h2 className="font-black text-lg">Nhập CSV có dịch nghĩa</h2>
              <p className="text-sm text-muted-foreground mt-1">
                File CSV gồm 2 cột: <code className="bg-muted px-1 rounded text-xs">word,translation</code>. Tối đa {MAX_IMPORT_WORDS} từ duy nhất mỗi lượt.
              </p>
            </div>

            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setCsvIsDragging(true); }}
              onDragLeave={() => setCsvIsDragging(false)}
              onDrop={handleCsvDrop}
              onClick={() => csvFileRef.current?.click()}
              className={`w-full border-2 border-dashed rounded-2xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-colors ${
                csvIsDragging
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-indigo-200 hover:border-indigo-400'
              }`}
            >
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center">
                <Upload className="h-7 w-7 text-indigo-500" />
              </div>
              <div className="text-center">
                <p className="font-bold text-sm">{csvFileName || 'Kéo thả hoặc bấm để chọn file'}</p>
                <p className="text-xs text-muted-foreground mt-1">.csv, .tsv</p>
              </div>
            </div>
            <input
              ref={csvFileRef}
              type="file"
              accept=".csv,.tsv"
              className="hidden"
              onChange={handleCsvFileInput}
            />

            {/* Skip header checkbox */}
            <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
              <input
                type="checkbox"
                checked={csvSkipHeader}
                onChange={(e) => {
                  setCsvSkipHeader(e.target.checked);
                  // Re-parse nếu đã có file
                  if (csvRows.length > 0 && csvFileName) {
                    // Không re-parse ở đây vì không giữ raw text
                    // User cần chọn lại file — hiển thị hint
                  }
                }}
                className="rounded border-slate-300 text-indigo-600"
              />
              <span className="text-sm font-medium text-slate-700">Bỏ qua dòng đầu (header)</span>
            </label>

            {csvOverflow > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                Có {csvOverflow} từ vượt giới hạn {MAX_IMPORT_WORDS} từ/lượt. Đã giữ {MAX_IMPORT_WORDS} từ đầu tiên sau khi loại trùng; hãy chia phần còn lại thành lô khác.
              </div>
            )}

            {/* Preview table */}
            {csvRows.length > 0 && (
              <div className="space-y-3">
                {/* Progress bar khi importing */}
                {csvImporting && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground font-medium">
                      <span>Đang nhập... {Math.round((csvProgress / 100) * csvRows.length)}/{csvRows.length}</span>
                      <span>{csvProgress}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 transition-all duration-300 rounded-full"
                        style={{ width: `${csvProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-muted-foreground">
                    {csvRows.length}/{MAX_IMPORT_WORDS} từ sẵn sàng
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setCsvRows([]); setCsvOverflow(0); setCsvFileName(''); if (csvFileRef.current) csvFileRef.current.value = ''; }}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Xóa tất cả
                    </button>
                    <button
                      onClick={importCsvWords}
                      disabled={csvImporting}
                      className="flex items-center gap-1.5 bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                      {csvImporting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Plus className="h-3.5 w-3.5" />
                      )}
                      {csvImporting ? 'Đang nhập...' : `Nhập ${csvRows.length} từ`}
                    </button>
                  </div>
                </div>

                <div className="bg-background border rounded-2xl overflow-hidden">
                  {/* Table header */}
                  <div className="grid grid-cols-[1fr_1fr_auto] gap-2 px-4 py-2 bg-muted/50 border-b text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    <span>Từ</span>
                    <span>Dịch nghĩa</span>
                    <span className="w-6" />
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {csvRows.map(row => (
                      <div
                        key={row.id}
                        className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center px-4 py-2.5 border-b last:border-0 hover:bg-muted/30"
                      >
                        <span className="text-sm font-semibold truncate">{row.word}</span>
                        <span className="text-sm text-muted-foreground truncate">{row.translation}</span>
                        <button
                          onClick={() => removeCsvRow(row.id)}
                          className="text-muted-foreground hover:text-red-500 transition-colors"
                          aria-label="Xóa dòng"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: OCR ── */}
        {tab === 'ocr' && (
          <div className="bg-white border rounded-2xl p-6 space-y-4 shadow-sm">
            <div>
              <h2 className="font-black text-lg">Quét ảnh bằng AI OCR</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Tải ảnh sách hoặc bài tập để AI tách từ vựng. Tối đa {MAX_IMPORT_WORDS} từ duy nhất mỗi lượt.
              </p>
            </div>

            <button
              onClick={() => imageRef.current?.click()}
              className="w-full border-2 border-dashed border-purple-200 hover:border-purple-400 rounded-2xl overflow-hidden transition-colors"
            >
              {ocrImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={ocrImage} alt="Xem trước ảnh OCR" className="w-full max-h-64 object-contain" />
              ) : (
                <div className="p-10 flex flex-col items-center gap-3 group">
                  <div className="w-14 h-14 bg-purple-50 group-hover:bg-purple-100 rounded-2xl flex items-center justify-center transition-colors">
                    <Camera className="h-7 w-7 text-purple-500" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-sm">Chọn ảnh để tải lên</p>
                    <p className="text-xs text-muted-foreground mt-1">jpg, png, webp — tối đa 10MB</p>
                  </div>
                </div>
              )}
            </button>
            <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

            {ocrImage && (
              <button
                onClick={runOCR}
                disabled={isOcrProcessing}
                className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white font-bold py-3 rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {isOcrProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
                {isOcrProcessing ? 'AI đang quét...' : 'Tách từ bằng AI'}
              </button>
            )}

            <WordListPanel
              words={ocrWords}
              setWords={setOcrWords}
              label="Từ từ ảnh"
              overflowCount={ocrOverflow}
              onClear={() => { setOcrWords([]); setOcrOverflow(0); }}
            />
          </div>
        )}

      </div>
      </div>
    </StudentShell>
  );
}
