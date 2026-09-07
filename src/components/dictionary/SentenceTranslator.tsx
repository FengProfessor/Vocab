'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { speak } from '@/lib/study';

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
}

export function SentenceTranslator() {
  const [sourceLang, setSourceLang] = useState<'en' | 'vi'>('en');
  const [targetLang, setTargetLang] = useState<'en' | 'vi'>('vi');
  const [inputText, setInputText] = useState('');
  const [resultText, setResultText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const [provider, setProvider] = useState<string>('');
  const [copied, setCopied] = useState(false);
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

    if (resultText) {
      setInputText(resultText);
      setResultText(inputText);
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

    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          sourceLang,
          targetLang,
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

      if (translated) {
        saveHistory({
          sourceText: text,
          translatedText: translated,
          sourceLang,
          targetLang,
          fromCache: Boolean(data.fromCache),
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Có lỗi khi kết nối bộ dịch';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl + Enter or Cmd + Enter to translate
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
      toast.success('Đã sao chép bản dịch vào clipboard');
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
      toast.error('Vui lòng cấp quyền dán hoặc dán thủ công bằng Ctrl+V');
    }
  };

  const handleSpeak = (text: string, lang: 'en' | 'vi') => {
    if (!text.trim()) return;
    if (lang === 'en') {
      speak(text, 1.0, 'en-US');
    } else {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'vi-VN';
        window.speechSynthesis.speak(u);
      }
    }
  };

  const selectHistoryItem = (item: TranslationHistoryItem) => {
    setSourceLang(item.sourceLang);
    setTargetLang(item.targetLang);
    setInputText(item.sourceText);
    setResultText(item.translatedText);
    setFromCache(Boolean(item.fromCache));
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className="w-full space-y-4">
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
        <div className="p-3 pb-1">
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              sourceLang === 'en'
                ? 'Nhập hoặc dán câu, đoạn văn tiếng Anh để dịch (Ctrl + Enter để dịch)...'
                : 'Nhập hoặc dán câu, đoạn văn tiếng Việt để dịch (Ctrl + Enter để dịch)...'
            }
            className="w-full min-h-[120px] max-h-[260px] bg-transparent resize-y text-base text-foreground placeholder:text-muted-foreground/60 focus:outline-none leading-relaxed"
            maxLength={MAX_CHARS}
          />
        </div>

        {/* Action bar dưới ô nhập */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-border/40 bg-muted/20 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            {inputText.trim() ? (
              <>
                <button
                  type="button"
                  onClick={() => setInputText('')}
                  className="px-2 py-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  Xóa
                </button>
                <button
                  type="button"
                  onClick={() => handleSpeak(inputText, sourceLang)}
                  className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  title="Nghe phát âm văn bản gốc"
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

      {/* Khung kết quả dịch (Translation Result) */}
      {(resultText || isLoading) && (
        <div className="relative bg-card rounded-2xl border border-primary/20 shadow-sm p-4 animate-in fade-in-50 duration-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-primary flex items-center gap-1">
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
                  {provider === 'libretranslate' ? 'LibreTranslate AI' : 'Web Engine'}
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
              <span>Đang xử lý bản dịch với LibreTranslate...</span>
            </div>
          ) : (
            <p className="text-base sm:text-lg text-foreground font-medium leading-relaxed select-text">
              {resultText}
            </p>
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
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
