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

type Tab = 'text' | 'file' | 'ocr' | 'csv';
type WordStatus = 'pending' | 'saving' | 'saved' | 'duplicate' | 'error';

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
  const [csvIsDragging, setCsvIsDragging] = useState(false);
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvProgress, setCsvProgress] = useState(0);

  // OCR
  const imageRef = useRef<HTMLInputElement>(null);
  const [ocrImage, setOcrImage] = useState<string | null>(null);
  const [ocrImageFile, setOcrImageFile] = useState<File | null>(null);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrWords, setOcrWords] = useState<ImportWord[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { router.push('/auth'); return; }
      setUserId(session.user.id);

      const res = await authFetch(`/api/words`);
      const data = await res.json();
      if (data.classroomId) setClassroomId(data.classroomId);
    })();
  }, []);

  // ── CSV handlers ──
  const processCsvText = (text: string, skipHeader: boolean) => {
    const parsed = parseCSV(text);
    const rows = skipHeader ? parsed.slice(1) : parsed;
    setCsvRows(rows.map((r, i) => ({ id: `csv-${i}`, word: r.word, translation: r.translation })));
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
    setCsvImporting(true);
    setCsvProgress(0);

    let done = 0;
    let errors = 0;

    for (const row of csvRows) {
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
      setCsvProgress(Math.round((done / csvRows.length) * 100));
    }

    if (done > 0 && classroomId) {
      toast.loading(`Chạy AI phân tích ${done} từ...`, { id: 'csv-batch-toast' });
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const refreshRes = await fetch('/api/words/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token ?? ''}` },
          body: JSON.stringify({ classroomId }),
        });
        const refreshData = await refreshRes.json();
        if (refreshData.success) {
          toast.success(`Đã import ${done - errors} từ, ${errors} lỗi. AI đã phân tích ${refreshData.refreshed} từ.`, { id: 'csv-batch-toast' });
        } else {
          throw new Error();
        }
      } catch {
        toast.success(`Đã import ${done - errors} từ, ${errors} lỗi.`, { id: 'csv-batch-toast' });
      }
    } else {
      toast.success(`Đã import ${done - errors} từ, ${errors} lỗi.`);
    }

    setCsvImporting(false);
    setCsvRows([]);
    setCsvFileName('');
    setCsvProgress(0);
    if (csvFileRef.current) csvFileRef.current.value = '';
  };

  // ── Parse bulk text into words ──
  const parseText = () => {
    if (!bulkText.trim()) return;
    const lines = bulkText.split(/[\n,;]+/).map(l => l.trim()).filter(l => l.length > 0 && l.length < 80);
    const unique = [...new Set(lines.map(l => l.toLowerCase()))];
    setWordList(unique.map((w, i) => ({ id: String(i), word: w, status: 'pending' })));
  };

  // ── Parse Excel/CSV ──
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    try {
      const XLSX = await import('xlsx');
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer);
      const ws = wb.Sheets[wb.SheetNames[0]];
      // Sheet rows: mỗi hàng là mảng cells (string | number | boolean | Date | null)
      type SheetCell = string | number | boolean | Date | null | undefined;
      const rows = XLSX.utils.sheet_to_json<SheetCell[]>(ws, { header: 1 });

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

      // Unique by word
      const seen = new Set<string>();
      const unique: typeof importedList = [];
      for (const item of importedList) {
        const key = item.word.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(item);
        }
      }

      setWordList(unique.map((item, i) => ({
        id: String(i),
        word: item.word,
        translation: item.translation || undefined,
        status: 'pending'
      })));
      toast.success(`Found ${unique.length} words in ${file.name}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error('Failed to read file: ' + msg);
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
    
    try {
      // Compress right before sending
      toast.info('Preparing image...', { id: 'ocr-toast' });
      const compressedDataUrl = await compressImage(ocrImageFile);
      const base64 = compressedDataUrl.split(',')[1];
      const mimeType = 'image/jpeg';

      toast.loading('AI is scanning for vocabulary...', { id: 'ocr-toast' });
      
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/import/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token ?? ''}` },
        body: JSON.stringify({ base64, mimeType }),
      });
      
      if (!res.ok) {
         if (res.status === 413) throw new Error('Image is still too large. Try taking a photo from further away.');
         try {
           const errData = await res.json();
           throw new Error(errData.error || `HTTP Error ${res.status}`);
         } catch(e) {
           throw new Error(`Server returned an error (${res.status}).`);
         }
      }

      const data = await res.json();
      if (data.words && data.words.length > 0) {
        setOcrWords(data.words.map((w: string, i: number) => ({ id: `ocr-${i}`, word: w, status: 'pending' })));
        toast.success(`Found ${data.words.length} words!`, { id: 'ocr-toast' });
      } else {
        toast.info('No vocabulary found. Try a clearer image.', { id: 'ocr-toast' });
      }
    } catch (err: unknown) {
      console.error('OCR Error:', err);
      const msg = err instanceof Error ? err.message : 'Failed to scan image';
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

    const pending = words.filter(w => w.status === 'pending');
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
      toast.loading(`Running AI batch analysis for ${done} words...`, { id: 'batch-toast' });
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const refreshRes = await fetch('/api/words/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token ?? ''}` },
          body: JSON.stringify({ classroomId }),
        });
        const refreshData = await refreshRes.json();
        if (refreshData.success) {
          toast.success(`Import complete! AI analyzed ${refreshData.refreshed} words.`, { id: 'batch-toast' });
        } else {
          throw new Error('AI analysis failed');
        }
      } catch (err) {
        toast.error(`Imported ${done} words. AI analysis failed, please click "Retry AI" in Dashboard.`, { id: 'batch-toast' });
      }
    } else if (done > 0) {
      toast.success(`Import complete! ${done} words saved.`);
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
  }: {
    words: ImportWord[];
    setWords: React.Dispatch<React.SetStateAction<ImportWord[]>>;
    label: string;
  }) => (
    <div className="space-y-3">
      {words.length > 0 && (
        <>
          {isImporting && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground font-medium">
                <span>Importing...</span><span>{importProgress}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 transition-all duration-300 rounded-full" style={{ width: `${importProgress}%` }} />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-muted-foreground">{words.length} words ready</span>
            <div className="flex gap-2">
              <button
                onClick={() => setWords([])}
                className="text-xs text-red-500 hover:underline"
              >Clear</button>
              <button
                onClick={() => importWords(words, setWords)}
                disabled={isImporting || words.every(w => w.status !== 'pending')}
                className="flex items-center gap-1.5 bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {isImporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                {isImporting ? 'Importing...' : `Import ${words.filter(w => w.status === 'pending').length}`}
              </button>
            </div>
          </div>

          <div className="bg-background border rounded-2xl overflow-hidden max-h-80 overflow-y-auto">
            {words.map(w => (
              <div key={w.id} className="flex items-center gap-3 px-4 py-3 border-b last:border-0 hover:bg-muted/30">
                <StatusIcon status={w.status} />
                <span className={`flex-1 text-sm font-medium ${w.status === 'duplicate' ? 'text-muted-foreground line-through' : ''}`}>{w.word}</span>
                <span className="text-[10px] text-muted-foreground capitalize">{w.status}</span>
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
    <div className="min-h-dvh bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b px-4 sm:px-6 h-16 flex items-center gap-4">
        <Link href="/student">
          <button className="flex items-center gap-2 text-muted-foreground hover:text-indigo-600 font-bold text-sm transition-colors">
            <ChevronLeft className="h-5 w-5" /> Dashboard
          </button>
        </Link>
        <div className="flex items-center gap-2 font-black text-slate-800">
          <Brain className="h-6 w-6 text-indigo-600" />
          <span>Import Words</span>
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
            <p className="font-black text-sm sm:text-base">Thư viện từ vựng theo chuyên đề</p>
            <p className="text-xs text-white/80 font-medium">Từ vựng SGK, chủ điểm, phrasal verbs, thành ngữ — gom sẵn, nhập 1 chạm.</p>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 group-hover:translate-x-0.5 transition-transform" />
        </Link>

        {/* Tab switcher */}
        <div className="bg-white border rounded-2xl p-1.5 flex gap-1 shadow-sm flex-wrap">
          {([
            { key: 'text', icon: FileText, label: 'Paste Text' },
            { key: 'file', icon: Upload, label: 'Excel / CSV' },
            { key: 'csv', icon: FileText, label: 'CSV + Nghĩa' },
            { key: 'ocr', icon: Camera, label: 'Scan Image' },
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
              <h2 className="font-black text-lg">Paste or type words</h2>
              <p className="text-sm text-muted-foreground mt-1">
                One word per line, or separate with commas. You can also paste a whole paragraph — AI will extract the words.
              </p>
            </div>
            <textarea
              value={bulkText}
              onChange={e => setBulkText(e.target.value)}
              placeholder={"apple\nbanana, cherry\nOr paste any paragraph here..."}
              className="w-full h-48 border rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 font-mono"
            />
            <button
              onClick={parseText}
              disabled={!bulkText.trim()}
              className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              Parse Words →
            </button>
            <WordListPanel words={wordList} setWords={setWordList} label="Words to import" />
          </div>
        )}

        {/* ── TAB: Excel/CSV ── */}
        {tab === 'file' && (
          <div className="bg-white border rounded-2xl p-6 space-y-4 shadow-sm">
            <div>
              <h2 className="font-black text-lg">Upload Excel or CSV</h2>
              <p className="text-sm text-muted-foreground mt-1">
                File should have a column named <code className="bg-muted px-1 rounded text-xs">word</code> or <code className="bg-muted px-1 rounded text-xs">từ</code>. If not found, the first column is used.
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
                <p className="font-bold text-sm">{fileName || 'Click to upload file'}</p>
                <p className="text-xs text-muted-foreground mt-1">.xlsx, .xls, .csv supported</p>
              </div>
            </button>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileUpload} />
            <WordListPanel words={wordList} setWords={setWordList} label="Words from file" />
          </div>
        )}

        {/* ── TAB: CSV với dịch nghĩa ── */}
        {tab === 'csv' && (
          <div className="bg-white border rounded-2xl p-6 space-y-4 shadow-sm">
            <div>
              <h2 className="font-black text-lg">Import CSV có dịch nghĩa</h2>
              <p className="text-sm text-muted-foreground mt-1">
                File CSV 2 cột: <code className="bg-muted px-1 rounded text-xs">word,translation</code>. Mỗi dòng một từ.
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
                <p className="font-bold text-sm">{csvFileName || 'Kéo thả hoặc click để chọn file'}</p>
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

            {/* Preview table */}
            {csvRows.length > 0 && (
              <div className="space-y-3">
                {/* Progress bar khi importing */}
                {csvImporting && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground font-medium">
                      <span>Đang import... {Math.round((csvProgress / 100) * csvRows.length)}/{csvRows.length}</span>
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
                    {csvRows.length > 50
                      ? `Hiển thị 50/${csvRows.length} từ`
                      : `${csvRows.length} từ sẵn sàng`}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setCsvRows([]); setCsvFileName(''); if (csvFileRef.current) csvFileRef.current.value = ''; }}
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
                      {csvImporting ? 'Đang import...' : `Import ${csvRows.length} từ`}
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
                    {csvRows.slice(0, 50).map(row => (
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
              <h2 className="font-black text-lg">📸 Scan Image (AI OCR)</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Upload a photo of a textbook, worksheet, or any document. AI will extract all vocabulary words — including underlined or highlighted ones.
              </p>
            </div>

            <button
              onClick={() => imageRef.current?.click()}
              className="w-full border-2 border-dashed border-purple-200 hover:border-purple-400 rounded-2xl overflow-hidden transition-colors"
            >
              {ocrImage ? (
                <img src={ocrImage} alt="Preview" className="w-full max-h-64 object-contain" />
              ) : (
                <div className="p-10 flex flex-col items-center gap-3 group">
                  <div className="w-14 h-14 bg-purple-50 group-hover:bg-purple-100 rounded-2xl flex items-center justify-center transition-colors">
                    <Camera className="h-7 w-7 text-purple-500" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-sm">Click to upload photo</p>
                    <p className="text-xs text-muted-foreground mt-1">jpg, png, webp — max 10MB</p>
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
                {isOcrProcessing ? 'AI is scanning...' : 'Extract Words with AI'}
              </button>
            )}

            <WordListPanel words={ocrWords} setWords={setOcrWords} label="Words from image" />
          </div>
        )}

      </div>
    </div>
  );
}
