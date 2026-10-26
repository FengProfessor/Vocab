'use client';
import { DictionaryApi } from '@/features/dictionary/api';
import { VocabApi } from '@/features/vocab/api';

import { useState, useRef, useCallback } from 'react';
import {
  ArrowLeftRight,
  Volume2,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Loader2,
  Trash2,
  CornerDownLeft,
  Clipboard,
  Languages,
  Brain,
  Bookmark,
  BookmarkCheck,
  BookOpen,
  ArrowRight,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { speak } from '@/lib/study';
import { isWordSavedLocally, saveWordLocally } from '@/lib/exam-dict-cache';
import { notifyWordSavedOptimistic, notifyWordSaveRollback } from '@/lib/word-summary-cache';
import type { ExtractedPhrase } from '@/types/translation';
import type { SentenceAnalysisData } from '@/types/sentence-analysis';
import { SentenceStructureView } from '@/components/dictionary/SentenceStructureView';
import { PhrasebookView } from '@/components/dictionary/PhrasebookView';

const STORAGE_KEY = 'lingo_sentence_history_v1';
const MAX_HISTORY = 10;
const MAX_CHARS = 3000;

interface TranslationHistoryItem {
  id: string;
  sourceText: string;
  translatedText: string;
  sourceLang: 'en' | 'vi';
  targetLang: 'en' | 'vi';
  timestamp: number;
  fromCache?: boolean;
  extractedPhrases?: ExtractedPhrase[];
}

export interface SentenceTranslatorProps {
  onLookupWord?: (word: string) => void;
}

function getPhraseBadgeStyle(type: string) {
  switch (type) {
    case 'phrasal_verb':
      return { label: 'Cụm động từ', cls: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' };
    case 'idiom':
      return { label: 'Thành ngữ', cls: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' };
    case 'collocation':
      return { label: 'Collocation', cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' };
    case 'grammar_pattern':
      return { label: 'Mẫu câu', cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' };
    default:
      return { label: 'Cụm từ', cls: 'bg-muted text-muted-foreground border-border/60' };
  }
}

export function SentenceTranslator({ onLookupWord }: SentenceTranslatorProps = {}) {
  const [activeTab, setActiveTab] = useState<'translator' | 'phrasebook'>('translator');
  const [sourceLang, setSourceLang] = useState<'en' | 'vi'>('en');
  const [targetLang, setTargetLang] = useState<'en' | 'vi'>('vi');
  const [inputText, setInputText] = useState('');
  const [resultText, setResultText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const [provider, setProvider] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Extracted phrases state
  const [extractedPhrases, setExtractedPhrases] = useState<ExtractedPhrase[]>([]);
  const [savedPhraseMap, setSavedPhraseMap] = useState<Record<string, boolean>>({});

  // SVO breakdown state (Groq LPU)
  const [svoLoading, setSvoLoading] = useState(false);
  const [svoData, setSvoData] = useState<SentenceAnalysisData | null>(null);
  const [showSvo, setShowSvo] = useState(false);

  const [history, setHistory] = useState<TranslationHistoryItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const saveHistory = useCallback(
    (item: Omit<TranslationHistoryItem, 'id' | 'timestamp'>) => {
      setHistory((prev) => {
        const filtered = prev.filter(
          (h) =>
            h.sourceText.trim().toLowerCase() !== item.sourceText.trim().toLowerCase() ||
            h.sourceLang !== item.sourceLang
        );
        const newItem: TranslationHistoryItem = {
          ...item,
          id: Math.random().toString(36).substring(2, 9),
          timestamp: Date.now(),
        };
        const next = [newItem, ...filtered].slice(0, MAX_HISTORY);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // Ignore
        }
        return next;
      });
    },
    []
  );

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
      toast.success('Đã xóa lịch sử dịch');
    } catch {
      // Ignore
    }
  };

  const handleSwap = () => {
    const nextSource = targetLang;
    const nextTarget = sourceLang;
    setSourceLang(nextSource);
    setTargetLang(nextTarget);
    setSvoData(null);
    setShowSvo(false);
    setExtractedPhrases([]);

    if (resultText) {
      setInputText(resultText);
      setResultText(inputText);
    }
  };

  const handleAnalyzeSvo = async () => {
    if (showSvo && svoData) {
      setShowSvo(false);
      return;
    }

    if (svoData) {
      setShowSvo(true);
      return;
    }

    const text = (sourceLang === 'en' ? inputText : resultText).trim();
    if (!text) {
      toast.error('Cần có câu tiếng Anh để bóc tách SVO');
      return;
    }

    setSvoLoading(true);
    try {
      const res = await DictionaryApi.analyzeSentence({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sentence: text }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        if (res.status === 401) {
          toast.error('Vui lòng đăng nhập để sử dụng tính năng bóc tách SVO');
          return;
        }
        if (json.code === 'PRO_REQUIRED') {
          toast.error('Bạn đã dùng hết lượt phân tích câu AI hôm nay');
          return;
        }
        throw new Error(json.error || 'Không thể phân tích SVO');
      }

      const analysis = json.analysis || json.data?.sentenceAnalysis;
      if (analysis && (analysis.kernel || analysis.chunks)) {
        setSvoData(analysis);
        setShowSvo(true);
        toast.success('Bóc tách S-V-O thành công!');
      } else {
        toast.error('Không tìm thấy cấu trúc câu hợp lệ');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi gọi AI phân tích';
      toast.error(msg);
    } finally {
      setSvoLoading(false);
    }
  };

  const handleTranslate = async () => {
    const text = inputText.trim();
    if (!text) {
      toast.error('Vui lòng nhập văn bản cần dịch');
      return;
    }

    if (text.length > MAX_CHARS) {
      toast.error(`Văn bản vượt quá ${MAX_CHARS} ký tự`);
      return;
    }

    setIsLoading(true);
    setResultText('');
    setCopied(false);
    setSvoData(null);
    setShowSvo(false);
    setExtractedPhrases([]);

    try {
      const res = await DictionaryApi.translate({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          sourceLang,
          targetLang,
          extractPhrases: true,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Dịch không thành công');
      }

      const translated = data.translatedText || '';
      setResultText(translated);
      setFromCache(Boolean(data.fromCache));
      setProvider(data.provider || 'libretranslate');

      // Nhận diện cụm từ trọng điểm
      const phrases: ExtractedPhrase[] = Array.isArray(data.extractedPhrases) ? data.extractedPhrases : [];
      setExtractedPhrases(phrases);

      if (phrases.length > 0) {
        const nextMap: Record<string, boolean> = {};
        for (const p of phrases) {
          if (isWordSavedLocally(p.baseForm)) {
            nextMap[p.baseForm] = true;
          }
        }
        setSavedPhraseMap((prev) => ({ ...prev, ...nextMap }));
      }

      if (translated) {
        saveHistory({
          sourceText: text,
          translatedText: translated,
          sourceLang,
          targetLang,
          fromCache: Boolean(data.fromCache),
          extractedPhrases: phrases,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Có lỗi khi kết nối bộ dịch';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePhrase = async (phrase: ExtractedPhrase) => {
    const word = phrase.baseForm.trim();
    if (!word) return;

    if (savedPhraseMap[word]) {
      toast.info(`Cụm từ "${word}" đã có trong sổ từ của bạn`);
      return;
    }

    // Optimistic save
    setSavedPhraseMap((prev) => ({ ...prev, [word]: true }));
    saveWordLocally(word);
    notifyWordSavedOptimistic();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('lingo_word_saved', { detail: { word } }));
    }

    try {
      const res = await VocabApi.saveWords({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word,
          translation: phrase.meaningVi,
          example: phrase.example || '',
        }),
      });
      const json = await res.json().catch(() => ({}));

      if (res.status === 429) {
        toast.error('Quá nhiều yêu cầu, vui lòng thử lại sau');
      } else if (json.error === 'FREE_WORD_LIMIT' || (res.status === 403 && json.error === 'FREE_WORD_LIMIT')) {
        setSavedPhraseMap((prev) => ({ ...prev, [word]: false }));
        notifyWordSaveRollback();
        const { requestUpsell, upsellFromWordLimitError } = await import('@/lib/upsell');
        requestUpsell(upsellFromWordLimitError(json));
        toast.error(json.message ?? 'Đã đủ hạn mức lưu từ tháng này');
      } else if (json.alreadyExists) {
        toast.info(`Cụm từ "${word}" đã được lưu trước đó`);
      } else if (json.success) {
        toast.success(`Đã lưu "${word}" vào sổ ôn tập!`);
      }
    } catch {
      // Giữ optimistic save
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      void handleTranslate();
    }
  };

  const handleCopy = async (text: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Đã sao chép bản dịch');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Không thể sao chép');
    }
  };

  const handlePaste = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText) {
        setInputText(clipText.slice(0, MAX_CHARS));
        toast.success('Đã dán từ clipboard');
      }
    } catch {
      toast.error('Trình duyệt chưa cấp quyền đọc clipboard');
    }
  };

  const handleSpeak = (text: string, lang: 'en' | 'vi') => {
    if (!text) return;
    if (lang === 'vi') {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'vi-VN';
        window.speechSynthesis.speak(u);
      }
    } else {
      speak(text);
    }
  };

  const selectHistoryItem = (item: TranslationHistoryItem) => {
    setSourceLang(item.sourceLang);
    setTargetLang(item.targetLang);
    setInputText(item.sourceText);
    setResultText(item.translatedText);
    setFromCache(Boolean(item.fromCache));
    setExtractedPhrases(item.extractedPhrases || []);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className="w-full space-y-5">
      {/* Tab Switcher: Dịch thông minh vs Kho Mẫu câu giao tiếp */}
      <div className="flex items-center gap-2 border-b border-border/70 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('translator')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'translator'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Languages className="h-4 w-4" />
          <span>Dịch văn bản & Bóc tách cụm từ</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('phrasebook')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'phrasebook'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          <span>Kho Mẫu câu đàm thoại</span>
        </button>
      </div>

      {activeTab === 'phrasebook' ? (
        <PhrasebookView onLookupWord={onLookupWord} />
      ) : (
        <div className="space-y-4">
          {/* Thanh chọn ngôn ngữ (Language bar) */}
          <div className="flex items-center justify-between bg-card p-2 rounded-2xl border border-border/70 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="px-3.5 py-1.5 rounded-xl text-sm font-semibold bg-muted text-foreground flex items-center gap-1.5">
                <span>{sourceLang === 'en' ? '🇬🇧 Tiếng Anh' : '🇻🇳 Tiếng Việt'}</span>
              </div>
            </div>

            {/* Nút hoán đổi */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSwap}
              className="rounded-xl h-9 px-3 gap-1.5 text-xs font-semibold hover:border-primary/50 transition-transform active:scale-95"
              title="Đổi chiều ngôn ngữ"
            >
              <ArrowLeftRight className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="hidden sm:inline">Đổi chiều</span>
            </Button>

            <div className="flex items-center gap-2">
              <div className="px-3.5 py-1.5 rounded-xl text-sm font-semibold bg-primary/10 text-primary flex items-center gap-1.5">
                <span>{targetLang === 'vi' ? '🇻🇳 Tiếng Việt' : '🇬🇧 Tiếng Anh'}</span>
              </div>
            </div>
          </div>

          {/* Khung nhập văn bản nguồn */}
          <div className="relative bg-card rounded-2xl border border-border/80 shadow-sm focus-within:ring-2 focus-within:ring-ring focus-within:border-ring transition-all overflow-hidden">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={MAX_CHARS}
              placeholder={
                sourceLang === 'en'
                  ? 'Nhập câu hoặc đoạn văn tiếng Anh để dịch & bóc tách collocations, idioms...'
                  : 'Nhập câu tiếng Việt cần dịch sang tiếng Anh...'
              }
              className="w-full min-h-[130px] p-4 pb-12 bg-transparent text-foreground placeholder:text-muted-foreground/70 focus:outline-hidden resize-y text-base font-normal leading-relaxed"
            />

            {/* Bottom Actions Bar của Ô nhập */}
            <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/30 bg-card/90 backdrop-blur-xs">
              <div className="flex items-center gap-2">
                {inputText ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setInputText('')}
                      className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="Xóa văn bản"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSpeak(inputText, sourceLang)}
                      className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="Nghe phát âm"
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => void handlePaste()}
                    className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Clipboard className="h-3.5 w-3.5" />
                    <span>Dán nhanh</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span className={inputText.length >= MAX_CHARS ? 'text-rose-500 font-bold' : ''}>
                  {inputText.length} / {MAX_CHARS}
                </span>

                {sourceLang === 'en' && inputText.trim() && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={svoLoading}
                    onClick={() => void handleAnalyzeSvo()}
                    className="h-8 px-3 rounded-xl text-xs gap-1.5 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 shadow-xs"
                    title="Bóc tách cấu trúc câu S-V-O trực tiếp"
                  >
                    {svoLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Brain className="h-3.5 w-3.5 text-indigo-500" />
                    )}
                    <span className="hidden sm:inline">Phân tích SVO</span>
                  </Button>
                )}

                <Button
                  type="button"
                  variant="chunky"
                  size="sm"
                  disabled={isLoading || !inputText.trim()}
                  onClick={() => void handleTranslate()}
                  className="h-8 px-4 rounded-xl text-xs gap-1.5 shadow-sm"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Đang dịch...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Dịch</span>
                      <span className="hidden sm:inline opacity-70 text-[10px]">
                        <CornerDownLeft className="h-3 w-3 inline ml-0.5" />
                      </span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Khung hiển thị SVO trực tiếp */}
          {!resultText && !isLoading && showSvo && svoData && (
            <div className="p-4 rounded-2xl border border-indigo-200/70 dark:border-indigo-900/60 bg-card/80 backdrop-blur-xs shadow-xs animate-in fade-in-50 duration-200">
              <SentenceStructureView data={svoData} onLookupWord={onLookupWord} />
            </div>
          )}

          {/* Khung kết quả dịch (Translation Result) */}
          {(resultText || isLoading) && (
            <div className="relative bg-card rounded-2xl border border-primary/20 shadow-sm p-4 sm:p-5 animate-in fade-in-50 duration-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                    <Languages className="h-3.5 w-3.5" />
                    Bản dịch ({targetLang === 'vi' ? 'Tiếng Việt' : 'Tiếng Anh'})
                  </span>
                  {fromCache && (
                    <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                      ⚡ Cache 0ms
                    </span>
                  )}
                  {provider && !fromCache && (
                    <span className="text-[10px] font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                      {provider === 'libretranslate' ? 'LibreTranslate AI' : 'Smart Engine'}
                    </span>
                  )}
                </div>

                {resultText && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleSpeak(resultText, targetLang)}
                      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="Nghe phát âm bản dịch"
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleCopy(resultText)}
                      className="flex items-center gap-1 p-1.5 px-2.5 rounded-lg hover:bg-muted text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                      title="Sao chép bản dịch"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                          <span className="text-emerald-600 font-semibold">Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Sao chép</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {isLoading ? (
                <div className="flex items-center gap-2 py-4 text-muted-foreground text-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span>Đang dịch và bóc tách cụm từ trọng điểm...</span>
                </div>
              ) : (
                <>
                  <p className="text-base sm:text-lg text-foreground font-medium leading-relaxed select-text">
                    {resultText}
                  </p>

                  {/* Section: Bóc tách Cụm từ & Collocations trọng điểm */}
                  {extractedPhrases.length > 0 && (
                    <div className="p-3.5 sm:p-4 rounded-xl bg-muted/40 border border-border/70 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <BookOpen className="h-3.5 w-3.5 text-primary" />
                          Cụm từ & Collocations cốt lõi trong câu ({extractedPhrases.length})
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          Lưu vào sổ để ôn tập Spaced Repetition
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {extractedPhrases.map((phrase, idx) => {
                          const badge = getPhraseBadgeStyle(phrase.type);
                          const isSaved = Boolean(savedPhraseMap[phrase.baseForm]);

                          return (
                            <div
                              key={idx}
                              className="p-3 rounded-xl bg-card border border-border/70 hover:border-primary/40 transition-all flex flex-col justify-between gap-2"
                            >
                              <div>
                                <div className="flex items-center justify-between gap-1.5 mb-1">
                                  <span
                                    className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-md border ${badge.cls}`}
                                  >
                                    {badge.label}
                                  </span>
                                  {phrase.ipa && (
                                    <span className="text-[11px] font-mono text-muted-foreground truncate">
                                      {phrase.ipa}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-baseline gap-1.5">
                                  <h4
                                    onClick={() => onLookupWord?.(phrase.baseForm)}
                                    className="text-sm font-bold text-foreground hover:text-primary cursor-pointer transition-colors"
                                    title="Bấm để tra cứu từ điển"
                                  >
                                    {phrase.baseForm}
                                  </h4>
                                </div>

                                <p className="text-xs text-foreground/80 font-medium mt-0.5 leading-snug">
                                  {phrase.meaningVi}
                                </p>

                                {phrase.example && (
                                  <p className="text-[11px] text-muted-foreground italic mt-1 line-clamp-1" title={phrase.example}>
                                    Ví dụ: &quot;{phrase.example}&quot;
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
                                <button
                                  type="button"
                                  onClick={() => handleSpeak(phrase.baseForm, 'en')}
                                  className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                  title="Nghe phát âm"
                                >
                                  <Volume2 className="h-3.5 w-3.5" />
                                </button>

                                <div className="flex items-center gap-1.5">
                                  {onLookupWord && (
                                    <button
                                      type="button"
                                      onClick={() => onLookupWord(phrase.baseForm)}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors text-[11px]"
                                      title="Tra cứu từ điển"
                                    >
                                      <span>Tra từ</span>
                                      <ArrowRight className="h-2.5 w-2.5" />
                                    </button>
                                  )}

                                  <Button
                                    type="button"
                                    size="sm"
                                    variant={isSaved ? 'outline' : 'secondary'}
                                    onClick={() => void handleSavePhrase(phrase)}
                                    className={`h-6 px-2 rounded-md text-[11px] gap-1 transition-all ${
                                      isSaved
                                        ? 'border-emerald-300 text-emerald-600 dark:border-emerald-800 dark:text-emerald-400'
                                        : ''
                                    }`}
                                  >
                                    {isSaved ? (
                                      <>
                                        <BookmarkCheck className="h-3 w-3 text-emerald-500" />
                                        <span>Đã lưu</span>
                                      </>
                                    ) : (
                                      <>
                                        <Bookmark className="h-3 w-3" />
                                        <span>Lưu</span>
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Thanh công cụ phụ SVO */}
                  {resultText && (
                    <div className="pt-2 border-t border-border/50">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => void handleAnalyzeSvo()}
                          disabled={svoLoading}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-all active:scale-95 shadow-sm"
                        >
                          {svoLoading ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600 dark:text-indigo-400" />
                              <span>Groq AI đang bóc tách SVO...</span>
                            </>
                          ) : (
                            <>
                              <Brain className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                              <span>{showSvo ? 'Ẩn phân tích S-V-O' : '🧠 Bóc tách ngữ pháp S - V - O'}</span>
                            </>
                          )}
                        </button>
                      </div>

                      {showSvo && svoData && (
                        <div className="mt-4 p-4 rounded-2xl border border-indigo-200/70 dark:border-indigo-900/60 bg-card/80 backdrop-blur-xs shadow-xs animate-in fade-in-50 duration-200">
                          <SentenceStructureView data={svoData} onLookupWord={onLookupWord} />
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Lịch sử dịch gần đây (Recent Translations) */}
          {history.length > 0 && (
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <RotateCcw className="h-3.5 w-3.5" />
                  Đã dịch gần đây
                </span>
                <button
                  type="button"
                  onClick={clearHistory}
                  className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Xóa</span>
                </button>
              </div>

              <div className="space-y-2">
                {history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => selectHistoryItem(item)}
                    className="group flex flex-col p-3 rounded-xl border border-border/50 bg-card/60 hover:bg-muted/50 transition-all cursor-pointer text-left"
                  >
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span className="font-medium text-foreground/80 flex items-center gap-1">
                        {item.sourceLang === 'en' ? '🇬🇧 EN' : '🇻🇳 VI'} ➔{' '}
                        {item.targetLang === 'vi' ? '🇻🇳 VI' : '🇬🇧 EN'}
                      </span>
                      <span className="text-[10px] opacity-60">
                        {new Date(item.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground line-clamp-1">{item.sourceText}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {item.translatedText}
                    </p>
                    {item.extractedPhrases && item.extractedPhrases.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {item.extractedPhrases.slice(0, 3).map((ep, i) => (
                          <span
                            key={i}
                            className="text-[10px] bg-primary/10 text-primary font-medium px-1.5 py-0.5 rounded"
                          >
                            {ep.baseForm}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
