'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  BookMarked,
  Check,
  CheckCircle2,
  CheckSquare,
  Eye,
  FileSpreadsheet,
  FileText,
  Info,
  Loader2,
  Send,
  Square,
  Trash2,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { authFetch } from '@/lib/auth-fetch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  parsePastedVocabText,
  type ParsedTeacherVocabItem,
  type VocabParseFormat,
} from '@/lib/teacher-vocab-import';

interface PresetPackSectionSummary {
  name: string;
  count: number;
}

interface PresetPackMeta {
  id: string;
  grade: string;
  curriculum: string;
  unitNumber: number;
  title: string;
  subtitle: string;
  totalWords: number;
  sections: PresetPackSectionSummary[];
  wordKeys: string[];
}

interface PresetPackDetail extends PresetPackMeta {
  items: ParsedTeacherVocabItem[];
}

interface VocabImportPanelProps {
  classroomId: string;
  mode: 'presets' | 'file' | 'paste';
  existingWordKeys?: string[];
  onImported: () => void;
}

interface PreviewRow extends ParsedTeacherVocabItem {
  selected: boolean;
}

const FORMAT_LABELS: Record<VocabParseFormat, string> = {
  docx_table: 'Bảng Word (.docx)',
  spreadsheet: 'Bảng Excel (.xlsx)',
  csv: 'File CSV',
  tsv: 'Bảng Excel / TSV',
  markdown_table: 'Bảng Markdown',
  vertical_table: 'Bảng sao chép từ Word / ChatGPT / Docs',
  delimited_lines: 'Danh sách phân cách',
  word_list: 'Danh sách từ (chưa có nghĩa)',
};

const MAX_BATCH_PER_REQUEST = 250;

export default function VocabImportPanel({
  classroomId,
  mode,
  existingWordKeys = [],
  onImported,
}: VocabImportPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloadingTpl, setIsDownloadingTpl] = useState<'xlsx' | 'docx' | null>(null);

  // Presets state (chỉ dành cho giáo viên)
  const [presetPacks, setPresetPacks] = useState<PresetPackMeta[] | null>(null);
  const [presetError, setPresetError] = useState('');
  const [assigningPackId, setAssigningPackId] = useState<string | null>(null);
  const [previewingPackId, setPreviewingPackId] = useState<string | null>(null);

  const [pasteText, setPasteText] = useState('');
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [detectedFormat, setDetectedFormat] = useState<VocabParseFormat | null>(null);
  const [sourceFileName, setSourceFileName] = useState<string>('');

  const [updateExisting, setUpdateExisting] = useState(true);
  const [enrichFromCache, setEnrichFromCache] = useState(true);

  useEffect(() => {
    if (mode !== 'presets') return;
    let cancelled = false;
    (async () => {
      try {
        const res = await authFetch(
          `/api/teacher/words/presets?classroomId=${encodeURIComponent(classroomId)}`,
        );
        const json = (await res.json()) as {
          success?: boolean;
          packs?: PresetPackMeta[];
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Không tải được kho gói từ vựng');
        }
        setPresetPacks(json.packs || []);
        setPresetError('');
      } catch (err: unknown) {
        if (!cancelled) {
          setPresetError(err instanceof Error ? err.message : 'Lỗi tải gói từ vựng');
          setPresetPacks([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, classroomId]);

  const existingWordKeySet = useMemo(() => new Set(existingWordKeys), [existingWordKeys]);

  const livePastedPreview = useMemo(() => {
    if (!pasteText.trim()) return null;
    return parsePastedVocabText(pasteText);
  }, [pasteText]);

  const applyParsedResult = (
    items: ParsedTeacherVocabItem[],
    nextWarnings: string[],
    format: VocabParseFormat,
    fileName = '',
  ) => {
    setPreviewRows(items.map((item) => ({ ...item, selected: true })));
    setWarnings(nextWarnings);
    setDetectedFormat(format);
    setSourceFileName(fileName);
  };

  const resetPreview = () => {
    setPreviewRows([]);
    setWarnings([]);
    setDetectedFormat(null);
    setSourceFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const fetchPresetPackDetail = async (packId: string): Promise<PresetPackDetail> => {
    const res = await authFetch(
      `/api/teacher/words/presets?classroomId=${encodeURIComponent(classroomId)}&packId=${encodeURIComponent(packId)}`,
    );
    const json = (await res.json()) as {
      success?: boolean;
      pack?: PresetPackDetail;
      error?: string;
    };
    if (!res.ok || !json.success || !json.pack) {
      throw new Error(json.error || 'Không tải được chi tiết gói từ vựng');
    }
    return json.pack;
  };

  const submitItemsBatch = async (
    itemsToSend: ParsedTeacherVocabItem[],
    useUpdateStrategy: boolean,
    useEnrichFromCache: boolean,
  ): Promise<void> => {
    const payloadItems = itemsToSend.map((r) => ({
      word: r.word.trim(),
      ipa: r.ipa.trim(),
      pos: r.pos.trim(),
      translation: r.translation.trim(),
      familyWords: r.familyWords,
      teacherNote: r.teacherNote.trim(),
      section: r.section.trim(),
      example: r.example.trim(),
      example_vi: r.example_vi.trim(),
      synonyms: r.synonyms,
    }));

    // Chia chunk nếu > 250 từ; đảo thứ tự chunk để giữ đúng created_at DESC của file/gói gốc
    const chunks: typeof payloadItems[] = [];
    for (let i = 0; i < payloadItems.length; i += MAX_BATCH_PER_REQUEST) {
      chunks.push(payloadItems.slice(i, i + MAX_BATCH_PER_REQUEST));
    }
    const orderedChunks = chunks.length > 1 ? [...chunks].reverse() : chunks;

    let totalInserted = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;
    let totalFailed = 0;
    let anyNeedsAiRefresh = false;

    for (const chunk of orderedChunks) {
      const res = await authFetch('/api/teacher/words/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classroomId,
          items: chunk,
          duplicateStrategy: useUpdateStrategy ? 'update' : 'skip',
          enrichMissingFromCache: useEnrichFromCache,
        }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        error?: string;
        inserted?: number;
        updated?: number;
        skipped?: number;
        failed?: number;
        needsAiRefresh?: boolean;
      };

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Không thể gửi danh sách từ vào lớp');
      }

      totalInserted += json.inserted ?? 0;
      totalUpdated += json.updated ?? 0;
      totalSkipped += json.skipped ?? 0;
      totalFailed += json.failed ?? 0;
      if (json.needsAiRefresh) anyNeedsAiRefresh = true;
    }

    if (anyNeedsAiRefresh) {
      try {
        await authFetch('/api/words/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ classroomId }),
        });
      } catch {
        // non-fatal background enrichment
      }
    }

    const parts: string[] = [];
    if (totalInserted > 0) parts.push(`thêm mới ${totalInserted} từ`);
    if (totalUpdated > 0) parts.push(`cập nhật ${totalUpdated} từ`);
    if (totalSkipped > 0) parts.push(`bỏ qua ${totalSkipped} từ trùng`);
    if (totalFailed > 0) parts.push(`${totalFailed} lỗi`);

    toast.success(`Hoàn tất gửi vào lớp: ${parts.join(', ') || '0 từ'}.`);
  };

  const handleDirectAssignPack = async (pack: PresetPackMeta) => {
    setAssigningPackId(pack.id);
    try {
      const detail = await fetchPresetPackDetail(pack.id);
      await submitItemsBatch(detail.items, true, true);
      resetPreview();
      onImported();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Không thể giao gói từ vựng');
    } finally {
      setAssigningPackId(null);
    }
  };

  const handlePreviewPack = async (pack: PresetPackMeta) => {
    setPreviewingPackId(pack.id);
    try {
      const detail = await fetchPresetPackDetail(pack.id);
      applyParsedResult(detail.items, [], 'spreadsheet', detail.title);
      toast.success(`Đã mở ${detail.items.length} từ (${detail.title}) trong bảng xem trước`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Không tải được chi tiết gói');
    } finally {
      setPreviewingPackId(null);
    }
  };

  const handleFileSelected = async (file: File) => {
    setIsParsingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await authFetch('/api/teacher/words/parse-file', {
        method: 'POST',
        body: formData,
      });
      const json = (await res.json()) as {
        success?: boolean;
        error?: string;
        fileName?: string;
        items?: ParsedTeacherVocabItem[];
        warnings?: string[];
        detectedFormat?: VocabParseFormat;
      };

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Không đọc được file từ vựng');
      }

      const items = json.items || [];
      if (items.length === 0) {
        toast.error('Không tìm thấy từ vựng hợp lệ trong file.');
        return;
      }

      applyParsedResult(
        items,
        json.warnings || [],
        json.detectedFormat || 'spreadsheet',
        json.fileName || file.name,
      );
      toast.success(`Đã đọc ${items.length} từ từ "${json.fileName || file.name}"`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi đọc file';
      toast.error(msg);
    } finally {
      setIsParsingFile(false);
    }
  };

  const handleDownloadTemplate = async (format: 'xlsx' | 'docx') => {
    setIsDownloadingTpl(format);
    try {
      const res = await authFetch(`/api/teacher/words/template?format=${format}`);
      if (!res.ok) throw new Error('Không tải được file mẫu');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mau-tu-vung-lingopro.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Không tải được file mẫu');
    } finally {
      setIsDownloadingTpl(null);
    }
  };

  const handleParsePasted = () => {
    if (!livePastedPreview || livePastedPreview.items.length === 0) {
      toast.error('Không phát hiện được từ vựng nào từ nội dung đã dán.');
      return;
    }
    applyParsedResult(
      livePastedPreview.items,
      livePastedPreview.warnings,
      livePastedPreview.detectedFormat,
    );
  };

  const selectedRows = useMemo(() => previewRows.filter((r) => r.selected && r.word.trim()), [previewRows]);

  const sectionSummaries = useMemo(() => {
    const map = new Map<string, { name: string; total: number; selected: number }>();
    for (const r of previewRows) {
      if (!r.section) continue;
      const prev = map.get(r.section) || { name: r.section, total: 0, selected: 0 };
      prev.total += 1;
      if (r.selected) prev.selected += 1;
      map.set(r.section, prev);
    }
    return Array.from(map.values());
  }, [previewRows]);

  const selectedSectionsCount = useMemo(
    () => new Set(selectedRows.map((r) => r.section).filter(Boolean)).size,
    [selectedRows],
  );
  const allSelected = previewRows.length > 0 && previewRows.every((r) => r.selected);

  const toggleAll = () => {
    const next = !allSelected;
    setPreviewRows((prev) => prev.map((r) => ({ ...r, selected: next })));
  };

  const toggleSection = (sectionName: string) => {
    setPreviewRows((prev) => {
      const inSec = prev.filter((r) => r.section === sectionName);
      const allSecSelected = inSec.length > 0 && inSec.every((r) => r.selected);
      const nextVal = !allSecSelected;
      return prev.map((r) => (r.section === sectionName ? { ...r, selected: nextVal } : r));
    });
  };

  const updateRowField = (
    id: string,
    field: 'word' | 'ipa' | 'pos' | 'translation' | 'teacherNote',
    value: string,
  ) => {
    setPreviewRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    );
  };

  const toggleRow = (id: string) => {
    setPreviewRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r)),
    );
  };

  const removeRow = (id: string) => {
    setPreviewRows((prev) => prev.filter((r) => r.id !== id));
  };

  const removeFamilyChip = (rowId: string, wordToRemove: string) => {
    setPreviewRows((prev) =>
      prev.map((r) =>
        r.id === rowId
          ? { ...r, familyWords: r.familyWords.filter((fw) => fw.word !== wordToRemove) }
          : r,
      ),
    );
  };

  const handleCommitBatch = async () => {
    if (selectedRows.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 từ để gửi vào lớp.');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitItemsBatch(selectedRows, updateExisting, enrichFromCache);
      resetPreview();
      if (mode === 'paste') setPasteText('');
      onImported();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gửi từ vựng thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {mode === 'presets' ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <BookMarked className="h-4 w-4 text-primary" />
                Tiếng Anh 11 — Global Success (5 Unit · Chỉ dành cho giáo viên)
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Bấm <strong>Giao ngay</strong> để đưa trọn bộ vào lớp, hoặc <strong>Chọn phần / Xem trước</strong> để chọn lọc từng mục. Họ từ &amp; ghi chú chỉ hiển thị tham khảo cho học sinh.
              </p>
            </div>
          </div>

          {presetError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-xs text-destructive">
              {presetError}
            </div>
          )}

          {presetPacks === null ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-44 w-full rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {presetPacks.map((pack) => {
                const existingCount = pack.wordKeys.filter((k) => existingWordKeySet.has(k)).length;
                const isFullyAssigned = pack.totalWords > 0 && existingCount === pack.totalWords;
                const isBusy = assigningPackId === pack.id || previewingPackId === pack.id;

                return (
                  <div
                    key={pack.id}
                    className="rounded-2xl border bg-muted/15 p-4 flex flex-col justify-between gap-3 hover:border-primary/40 transition-colors"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span className="rounded-lg bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                            Unit {pack.unitNumber}
                          </span>
                          <span className="rounded-lg bg-muted px-2 py-0.5 text-[11px] font-semibold text-foreground">
                            {pack.totalWords} từ
                          </span>
                        </div>

                        {isFullyAssigned ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" />
                            Đủ {existingCount}/{pack.totalWords} từ
                          </span>
                        ) : existingCount > 0 ? (
                          <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
                            Đã có {existingCount}/{pack.totalWords} từ
                          </span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground font-medium">
                            Chưa giao
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className="font-bold text-sm text-foreground">{pack.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{pack.subtitle}</p>
                      </div>

                      <div className="space-y-1 pt-1">
                        {pack.sections.map((sec) => (
                          <div
                            key={sec.name}
                            className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground"
                          >
                            <span className="truncate">{sec.name}</span>
                            <span className="shrink-0 font-mono font-semibold text-foreground/80">
                              {sec.count}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t">
                      <button
                        type="button"
                        onClick={() => void handleDirectAssignPack(pack)}
                        disabled={isBusy || assigningPackId !== null}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
                      >
                        {assigningPackId === pack.id ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Đang giao...
                          </>
                        ) : (
                          <>
                            <Send className="h-3.5 w-3.5" />
                            Giao ngay ({pack.totalWords} từ)
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => void handlePreviewPack(pack)}
                        disabled={isBusy || previewingPackId !== null}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border bg-background px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted/60 transition-colors disabled:opacity-50"
                      >
                        {previewingPackId === pack.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                        Chọn phần / Xem trước
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : mode === 'file' ? (
        <div className="space-y-3">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) void handleFileSelected(file);
            }}
            onClick={() => !isParsingFile && fileInputRef.current?.click()}
            className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 bg-muted/20 hover:border-primary/50 hover:bg-muted/30'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx,.xlsx,.csv,.tsv,.txt"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFileSelected(file);
              }}
            />

            {isParsingFile ? (
              <div className="flex flex-col items-center gap-2 py-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm font-semibold">Đang đọc &amp; phân tích bảng từ vựng...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                  <Upload className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    Kéo thả hoặc bấm để chọn file từ máy tính
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Hỗ trợ Word (<code className="font-mono">.docx</code>), Excel (
                    <code className="font-mono">.xlsx</code>), <code className="font-mono">.csv</code>,{' '}
                    <code className="font-mono">.tsv</code>, <code className="font-mono">.txt</code> (tối đa 10 MB)
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-muted-foreground">
              Chưa có sẵn bảng? Tải nhanh file mẫu đúng chuẩn cột:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void handleDownloadTemplate('xlsx')}
                disabled={isDownloadingTpl !== null}
                className="inline-flex items-center gap-1.5 rounded-xl border bg-background px-3 py-1.5 font-semibold text-foreground hover:bg-muted/60 transition-colors disabled:opacity-50"
              >
                {isDownloadingTpl === 'xlsx' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                )}
                Tải mẫu Excel (.xlsx)
              </button>
              <button
                type="button"
                onClick={() => void handleDownloadTemplate('docx')}
                disabled={isDownloadingTpl !== null}
                className="inline-flex items-center gap-1.5 rounded-xl border bg-background px-3 py-1.5 font-semibold text-foreground hover:bg-muted/60 transition-colors disabled:opacity-50"
              >
                {isDownloadingTpl === 'docx' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FileText className="h-3.5 w-3.5 text-sky-600" />
                )}
                Tải mẫu Word (.docx)
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            rows={7}
            disabled={isSubmitting}
            placeholder={
              'Dán trực tiếp bảng từ vựng từ Word, Excel, Google Docs hoặc ChatGPT vào đây...\n' +
              'Hỗ trợ cả bảng nhiều phần (có cột STT, Từ vựng, IPA, Từ loại, Nghĩa, Family Word / Ghi chú) hoặc danh sách "word - nghĩa".'
            }
            className="w-full rounded-xl border bg-muted/20 p-3.5 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono"
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground">
              {livePastedPreview && livePastedPreview.items.length > 0 ? (
                <span>
                  Phát hiện{' '}
                  <strong className="text-foreground">{livePastedPreview.items.length}</strong> từ
                  {livePastedPreview.sections.length > 0 && (
                    <>
                      {' · '}
                      <strong className="text-foreground">{livePastedPreview.sections.length}</strong>{' '}
                      phần
                    </>
                  )}
                  {' · '}
                  <span className="text-primary font-medium">
                    {FORMAT_LABELS[livePastedPreview.detectedFormat]}
                  </span>
                </span>
              ) : (
                <span>Dán nội dung bảng để hệ thống tự nhận diện cột nghĩa, IPA &amp; họ từ.</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {pasteText.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    setPasteText('');
                    resetPreview();
                  }}
                  className="rounded-xl px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
                >
                  Xóa nội dung
                </button>
              )}
              <button
                type="button"
                onClick={handleParsePasted}
                disabled={!livePastedPreview || livePastedPreview.items.length === 0 || isSubmitting}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                Xem trước &amp; Kiểm tra
                {livePastedPreview && livePastedPreview.items.length > 0
                  ? ` (${livePastedPreview.items.length})`
                  : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW & CONFIRM TABLE */}
      {previewRows.length > 0 && (
        <div className="rounded-2xl border bg-muted/10 p-4 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-bold text-foreground">
                  Xem trước dữ liệu nhập ({selectedRows.length}/{previewRows.length} từ được chọn)
                </h3>
                {selectedSectionsCount > 0 && (
                  <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                    {selectedSectionsCount} phần
                  </span>
                )}
                {detectedFormat && (
                  <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                    {sourceFileName ? `${sourceFileName} · ` : ''}
                    {FORMAT_LABELS[detectedFormat]}
                  </span>
                )}
              </div>
              <p className="flex items-center gap-1.5 text-xs text-sky-700 dark:text-sky-300 font-medium">
                <Info className="h-3.5 w-3.5 shrink-0" />
                Họ từ &amp; ghi chú chỉ hiển thị tham khảo cho học sinh, không ép học thuộc hay kiểm tra.
              </p>
            </div>

            <button
              type="button"
              onClick={resetPreview}
              disabled={isSubmitting}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground px-2.5 py-1 rounded-lg hover:bg-muted"
            >
              Đóng xem trước
            </button>
          </div>

          {warnings.length > 0 && (
            <div className="rounded-xl border border-amber-300 bg-amber-50/80 dark:bg-amber-950/30 px-3.5 py-2.5 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                {warnings.map((w, i) => (
                  <p key={i}>{w}</p>
                ))}
              </div>
            </div>
          )}

          {/* Section toggle pills */}
          {sectionSummaries.length >= 2 && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold text-muted-foreground">Chọn nhanh theo phần:</span>
              {sectionSummaries.map((sec) => {
                const isAllSec = sec.selected === sec.total;
                const isSomeSec = sec.selected > 0 && !isAllSec;
                return (
                  <button
                    key={sec.name}
                    type="button"
                    onClick={() => toggleSection(sec.name)}
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 font-semibold transition-colors max-w-full ${
                      isAllSec
                        ? 'border-primary/40 bg-primary/10 text-primary'
                        : isSomeSec
                          ? 'border-amber-300 bg-amber-50 text-amber-800'
                          : 'bg-background text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span className="truncate max-w-[260px]">{sec.name}</span>
                    <span className="shrink-0 font-mono text-[11px] opacity-80">
                      ({sec.selected}/{sec.total})
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Options */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-xs bg-background border rounded-xl p-3">
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={updateExisting}
                onChange={(e) => setUpdateExisting(e.target.checked)}
                className="h-4 w-4 rounded border-muted-foreground/40 accent-primary"
              />
              <span className="font-medium text-foreground">
                Cập nhật nghĩa/IPA/họ từ nếu từ đã có trong lớp (giữ nguyên tiến độ SRS của học sinh)
              </span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={enrichFromCache}
                onChange={(e) => setEnrichFromCache(e.target.checked)}
                className="h-4 w-4 rounded border-muted-foreground/40 accent-primary"
              />
              <span className="font-medium text-foreground">
                Tự bổ sung câu ví dụ &amp; ảnh từ kho sẵn (giữ nguyên 100% nghĩa, IPA, từ loại giáo viên soạn)
              </span>
            </label>
          </div>

          {/* Table */}
          <div className="max-h-[460px] overflow-auto rounded-xl border bg-background">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur border-b">
                <tr className="text-[11px] font-bold uppercase text-muted-foreground">
                  <th className="p-2.5 w-9 text-center">
                    <button
                      type="button"
                      onClick={toggleAll}
                      title={allSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                      className="inline-flex items-center justify-center text-foreground"
                    >
                      {allSelected ? (
                        <CheckSquare className="h-4 w-4 text-primary" />
                      ) : (
                        <Square className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </th>
                  <th className="p-2.5 min-w-[140px]">Từ vựng</th>
                  <th className="p-2.5 min-w-[130px]">IPA</th>
                  <th className="p-2.5 min-w-[90px]">Từ loại</th>
                  <th className="p-2.5 min-w-[220px]">Nghĩa tiếng Việt</th>
                  <th className="p-2.5 min-w-[240px]">Họ từ tham khảo &amp; Ghi chú</th>
                  <th className="p-2.5 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {previewRows.map((row, idx) => {
                  const prevSection = idx > 0 ? previewRows[idx - 1].section : null;
                  const showSectionHeader = Boolean(row.section) && row.section !== prevSection;
                  return (
                    <FragmentRow
                      key={row.id}
                      row={row}
                      showSectionHeader={showSectionHeader}
                      onToggle={() => toggleRow(row.id)}
                      onRemove={() => removeRow(row.id)}
                      onUpdate={(field, val) => updateRowField(row.id, field, val)}
                      onRemoveFamily={(fwWord) => removeFamilyChip(row.id, fwWord)}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <span className="text-xs text-muted-foreground">
              Sẵn sàng gửi <strong className="text-foreground">{selectedRows.length}</strong> từ
              vào lớp học.
            </span>

            <button
              type="button"
              onClick={() => void handleCommitBatch()}
              disabled={isSubmitting || selectedRows.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang gửi vào lớp...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Gửi {selectedRows.length} từ vào lớp cho học sinh
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FragmentRow({
  row,
  showSectionHeader,
  onToggle,
  onRemove,
  onUpdate,
  onRemoveFamily,
}: {
  row: PreviewRow;
  showSectionHeader: boolean;
  onToggle: () => void;
  onRemove: () => void;
  onUpdate: (field: 'word' | 'ipa' | 'pos' | 'translation' | 'teacherNote', value: string) => void;
  onRemoveFamily: (word: string) => void;
}) {
  return (
    <>
      {showSectionHeader && (
        <tr className="bg-primary/5 border-y border-primary/15">
          <td colSpan={7} className="px-3 py-2 text-xs font-bold text-primary">
            {row.section}
          </td>
        </tr>
      )}
      <tr className={row.selected ? 'hover:bg-muted/20' : 'opacity-45 bg-muted/20'}>
        <td className="p-2 text-center align-top">
          <input
            type="checkbox"
            checked={row.selected}
            onChange={onToggle}
            className="mt-1.5 h-4 w-4 accent-primary cursor-pointer"
          />
        </td>
        <td className="p-2 align-top">
          <input
            type="text"
            value={row.word}
            onChange={(e) => onUpdate('word', e.target.value)}
            className="w-full rounded-lg border border-transparent bg-transparent px-2 py-1 font-bold text-foreground hover:border-border focus:border-primary focus:bg-background focus:outline-none"
          />
        </td>
        <td className="p-2 align-top">
          <input
            type="text"
            value={row.ipa}
            onChange={(e) => onUpdate('ipa', e.target.value)}
            placeholder="/.../"
            className="w-full rounded-lg border border-transparent bg-transparent px-2 py-1 font-mono text-muted-foreground hover:border-border focus:border-primary focus:bg-background focus:outline-none"
          />
        </td>
        <td className="p-2 align-top">
          <input
            type="text"
            value={row.pos}
            onChange={(e) => onUpdate('pos', e.target.value)}
            placeholder="n, v..."
            className="w-full rounded-lg border border-transparent bg-transparent px-2 py-1 font-semibold text-primary hover:border-border focus:border-primary focus:bg-background focus:outline-none"
          />
        </td>
        <td className="p-2 align-top">
          <input
            type="text"
            value={row.translation}
            onChange={(e) => onUpdate('translation', e.target.value)}
            placeholder="Nghĩa tiếng Việt..."
            className="w-full rounded-lg border border-transparent bg-transparent px-2 py-1 font-medium text-foreground hover:border-border focus:border-primary focus:bg-background focus:outline-none"
          />
        </td>
        <td className="p-2 align-top space-y-1.5">
          {row.familyWords.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {row.familyWords.map((fw) => (
                <span
                  key={fw.word}
                  className="inline-flex items-center gap-1 rounded-md border border-sky-200 bg-sky-50 px-1.5 py-0.5 text-[11px] text-sky-800"
                >
                  <strong>{fw.word}</strong>
                  {fw.pos && <span className="italic opacity-80">({fw.pos})</span>}
                  {fw.meaning && <span className="opacity-90">: {fw.meaning}</span>}
                  <button
                    type="button"
                    onClick={() => onRemoveFamily(fw.word)}
                    className="ml-0.5 text-sky-500 hover:text-destructive"
                    title="Gỡ họ từ này"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          <input
            type="text"
            value={row.teacherNote}
            onChange={(e) => onUpdate('teacherNote', e.target.value)}
            placeholder={row.familyWords.length > 0 ? 'Thêm ghi chú...' : 'Ghi chú / Cấu trúc...'}
            className="w-full rounded-lg border border-transparent bg-transparent px-2 py-0.5 text-[11px] text-muted-foreground hover:border-border focus:border-primary focus:bg-background focus:outline-none"
          />
        </td>
        <td className="p-2 text-center align-top">
          <button
            type="button"
            onClick={onRemove}
            title="Xóa dòng khỏi preview"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </td>
      </tr>
    </>
  );
}
