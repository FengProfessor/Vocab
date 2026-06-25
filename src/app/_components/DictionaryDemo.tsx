'use client';

import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import { Search, Loader2, Volume2, Plus, ArrowRight, CheckCircle2, Lock } from 'lucide-react';
import type { DictionaryData, DictionaryMeaning } from '@/lib/supabase';

/**
 * Demo tra từ SỐNG trên landing — gọi API công khai (không cần login).
 * Tier 1: /api/dictionary/lookup (kho từ điển) → Tier 2: /api/dictionary/external (Wiktionary).
 * Nút "Lưu vào sổ" → đẩy sang /auth (phải đăng ký mới lưu được).
 */

type SourceBadge = 'Kho từ điển' | 'Wiktionary';

interface DemoResult {
  data: DictionaryData;
  source: SourceBadge;
  imageUrl?: string;
  queriedWord: string;
}

// Từ mẫu — đều là từ phổ biến, gần như chắc chắn có trong kho
const SAMPLE_WORDS = ['resilient', 'achieve', 'benefit', 'environment', 'opportunity'];

function speakWord(word: string, lang: 'en-GB' | 'en-US') {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  const u = new SpeechSynthesisUtterance(word);
  u.lang = lang;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

export default function DictionaryDemo() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DemoResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const lookup = useCallback(async (word: string) => {
    const trimmed = word.trim().toLowerCase();
    if (!trimmed) return;
    setLoading(true);
    setResult(null);
    setError(null);

    // Tier 1: kho từ điển nội bộ
    try {
      const res = await fetch(`/api/dictionary/lookup?word=${encodeURIComponent(trimmed)}`, {
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.results?.length > 0) {
          setResult({ data: json, source: 'Kho từ điển', imageUrl: json.image_url, queriedWord: trimmed });
          setLoading(false);
          return;
        }
      }
    } catch {
      /* fall through */
    }

    // Tier 2: Wiktionary (proxy)
    try {
      const res = await fetch(`/api/dictionary/external?word=${encodeURIComponent(trimmed)}`, {
        signal: AbortSignal.timeout(6000),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.results?.length > 0) {
          setResult({ data: json, source: 'Wiktionary', queriedWord: trimmed });
          setLoading(false);
          return;
        }
      }
    } catch {
      /* fall through */
    }

    setError(`Chưa tìm thấy "${trimmed}" ở 2 nguồn miễn phí. Đăng ký để dùng AI tra mọi từ.`);
    setLoading(false);
  }, []);

  // Gom tối đa 4 nghĩa đầu, kèm POS
  const meanings: Array<{ pos: string; meaning: DictionaryMeaning }> = [];
  if (result?.data.results) {
    for (const r of result.data.results) {
      for (const m of r.meanings ?? []) {
        meanings.push({ pos: m.pos ?? 'other', meaning: m });
        if (meanings.length >= 4) break;
      }
      if (meanings.length >= 4) break;
    }
  }
  const pron = result?.data.pronunciations?.[0]?.ipa ?? '';
  const displayWord = result?.queriedWord ?? '';

  return (
    <div className="mx-auto max-w-2xl">
      {/* Search box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          lookup(query);
        }}
        className="relative flex gap-2 rounded-2xl border border-indigo-400/30 bg-white/5 p-2 shadow-2xl shadow-indigo-950/40 ring-1 ring-white/5 backdrop-blur"
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Gõ một từ tiếng Anh… vd: resilient"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className="h-12 flex-1 rounded-xl bg-transparent px-4 text-base text-white placeholder:text-slate-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || query.trim().length === 0}
          className="inline-flex h-12 items-center gap-2 rounded-xl bg-indigo-600 px-5 font-black text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
          <span className="hidden sm:inline">Tra ngay</span>
        </button>
      </form>

      {/* Sample chips */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        <span className="text-xs font-medium text-slate-500">Thử nhanh:</span>
        {SAMPLE_WORDS.map((w) => (
          <button
            key={w}
            type="button"
            onClick={() => {
              setQuery(w);
              lookup(w);
            }}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-slate-300 transition-colors hover:border-indigo-400/40 hover:text-white"
          >
            {w}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="mt-6 flex items-center justify-center gap-3 py-8 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" /> Đang tra…
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
          <p className="text-sm text-slate-400">{error}</p>
          <Link
            href="/auth"
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-black text-white hover:bg-indigo-500"
          >
            Đăng ký miễn phí <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* Result card */}
      {!loading && result && (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 text-left shadow-xl">
          <div className="flex items-start gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-2xl font-black text-white">{displayWord}</h3>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-slate-400">
                  {result.source}
                </span>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                {pron && (
                  <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-sm text-slate-300">/{pron}/</span>
                )}
                <button
                  type="button"
                  onClick={() => speakWord(displayWord, 'en-GB')}
                  className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
                  title="Phát âm UK"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => speakWord(displayWord, 'en-US')}
                  className="flex items-center gap-0.5 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
                  title="Phát âm US"
                >
                  <Volume2 className="h-4 w-4" />
                  <span className="text-[10px] font-bold">US</span>
                </button>
              </div>
            </div>
            {result.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/image-proxy?url=${encodeURIComponent(result.imageUrl)}`}
                alt={displayWord}
                className="h-16 w-16 shrink-0 rounded-xl object-cover"
              />
            )}
          </div>

          {/* Meanings */}
          {meanings.length > 0 && (
            <ul className="mt-4 space-y-2">
              {meanings.map(({ pos, meaning }, i) => (
                <li key={i} className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                  <span className="mr-2 text-[11px] font-bold uppercase italic tracking-wider text-indigo-400">{pos}</span>
                  <span className="text-sm font-semibold text-slate-200">{meaning.definition}</span>
                  {meaning.example && (
                    <p className="mt-1 text-xs italic text-slate-500">&ldquo;{meaning.example}&rdquo;</p>
                  )}
                </li>
              ))}
            </ul>
          )}

          {/* Save CTA — locked behind signup */}
          <div className="mt-4 flex flex-col items-center gap-2 rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-4 text-center sm:flex-row sm:justify-between sm:text-left">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Lock className="h-4 w-4 shrink-0 text-indigo-300" />
              Đăng ký miễn phí để <b className="text-white">lưu từ này vào sổ</b> & ôn theo lịch FSRS.
            </div>
            <Link
              href="/auth"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-black text-white transition-colors hover:bg-indigo-500"
            >
              <Plus className="h-4 w-4" /> Lưu vào sổ
            </Link>
          </div>
        </div>
      )}

      {/* Empty state hint */}
      {!loading && !result && !error && (
        <p className="mt-5 flex items-center justify-center gap-2 text-center text-sm text-slate-500">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          Tra thử ngay — không cần tài khoản. Bấm <b className="text-slate-300">Tra ngay</b> hoặc chọn từ mẫu.
        </p>
      )}
    </div>
  );
}
