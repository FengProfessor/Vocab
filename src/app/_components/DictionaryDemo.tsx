'use client';

import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import { Search, Loader2, Volume2, Plus, ArrowRight, CheckCircle2, Lock } from 'lucide-react';
import type { DictionaryData, DictionaryMeaning } from '@/lib/supabase';

/**
 * Demo tra từ SỐNG trên landing — gọi API công khai (không cần login).
 * Tier 1: /api/dictionary/lookup (kho từ điển) → Tier 2: /api/dictionary/external (Wiktionary).
 * Nút "Lưu vào sổ" → đẩy sang /auth (phải đăng ký mới lưu được).
 *
 * Palette: nền sáng landing (#f6efe6 / white) — chữ đậm, không dùng text-white trên input.
 */

type SourceBadge = 'Kho từ điển' | 'Wiktionary';

interface DemoResult {
  data: DictionaryData;
  source: SourceBadge;
  imageUrl?: string;
  queriedWord: string;
}

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
      {/* Search box — chữ đậm trên nền trắng */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          lookup(query);
        }}
        className="relative flex gap-2 rounded-2xl border border-[#d7c7b6] bg-white p-2 shadow-[0_12px_32px_rgba(95,69,52,0.08)] ring-1 ring-[#eadfd0]"
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Gõ một từ tiếng Anh… vd: resilient"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className="h-12 flex-1 rounded-xl bg-transparent px-4 text-base font-semibold text-[#241710] placeholder:font-normal placeholder:text-[#9a8578] focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || query.trim().length === 0}
          className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#b5502f] px-5 font-black text-white transition-colors hover:bg-[#a04428] disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
          <span className="hidden sm:inline">Tra ngay</span>
        </button>
      </form>

      {/* Sample chips */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        <span className="text-xs font-medium text-[#7b6558]">Thử nhanh:</span>
        {SAMPLE_WORDS.map((w) => (
          <button
            key={w}
            type="button"
            onClick={() => {
              setQuery(w);
              lookup(w);
            }}
            className="rounded-full border border-[#d7c7b6] bg-[#fffaf5] px-3 py-1 text-xs font-bold text-[#4f3f35] transition-colors hover:border-[#b5502f]/40 hover:bg-[#f2dfd4] hover:text-[#241710]"
          >
            {w}
          </button>
        ))}
      </div>

      {loading && (
        <div className="mt-6 flex items-center justify-center gap-3 py-8 text-[#7b6558]">
          <Loader2 className="h-5 w-5 animate-spin" /> Đang tra…
        </div>
      )}

      {!loading && error && (
        <div className="mt-6 rounded-2xl border border-[#d7c7b6] bg-[#fffaf5] p-5 text-center">
          <p className="text-sm text-[#5e4b40]">{error}</p>
          <Link
            href="/auth"
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#b5502f] px-5 py-2.5 text-sm font-black text-white hover:bg-[#a04428]"
          >
            Đăng ký miễn phí <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {!loading && result && (
        <div className="mt-6 rounded-2xl border border-[#d7c7b6] bg-white p-5 text-left shadow-[0_12px_36px_rgba(95,69,52,0.08)]">
          <div className="flex items-start gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-2xl font-black text-[#241710]">{displayWord}</h3>
                <span className="rounded-full bg-[#f2dfd4] px-2 py-0.5 text-[11px] font-semibold text-[#9f4d2f]">
                  {result.source}
                </span>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                {pron && (
                  <span className="rounded-full bg-[#f6efe6] px-2 py-0.5 font-mono text-sm text-[#5e4b40]">
                    /{pron}/
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => speakWord(displayWord, 'en-GB')}
                  className="rounded-full p-1.5 text-[#7b6558] transition-colors hover:bg-[#f2dfd4] hover:text-[#241710]"
                  title="Phát âm UK"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => speakWord(displayWord, 'en-US')}
                  className="flex items-center gap-0.5 rounded-full p-1.5 text-[#7b6558] transition-colors hover:bg-[#f2dfd4] hover:text-[#241710]"
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

          {meanings.length > 0 && (
            <ul className="mt-4 space-y-2">
              {meanings.map(({ pos, meaning }, i) => (
                <li key={i} className="rounded-xl border border-[#eadfd0] bg-[#fffaf5] p-3">
                  <span className="mr-2 text-[11px] font-bold uppercase italic tracking-wider text-[#b5502f]">
                    {pos}
                  </span>
                  <span className="text-sm font-semibold text-[#241710]">{meaning.definition}</span>
                  {meaning.example && (
                    <p className="mt-1 text-xs italic text-[#7b6558]">&ldquo;{meaning.example}&rdquo;</p>
                  )}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 flex flex-col items-center gap-2 rounded-xl border border-[#b5502f]/20 bg-[#f2dfd4]/50 p-4 text-center sm:flex-row sm:justify-between sm:text-left">
            <div className="flex items-center gap-2 text-sm text-[#5e4b40]">
              <Lock className="h-4 w-4 shrink-0 text-[#b5502f]" />
              Đăng ký miễn phí để <b className="text-[#241710]">lưu từ này vào sổ</b> & ôn theo lịch FSRS.
            </div>
            <Link
              href="/auth"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#b5502f] px-5 py-2.5 text-sm font-black text-white transition-colors hover:bg-[#a04428]"
            >
              <Plus className="h-4 w-4" /> Lưu vào sổ
            </Link>
          </div>
        </div>
      )}

      {!loading && !result && !error && (
        <p className="mt-5 flex items-center justify-center gap-2 text-center text-sm text-[#7b6558]">
          <CheckCircle2 className="h-4 w-4 text-[#2d7f5e]" />
          Tra thử ngay — không cần tài khoản. Bấm <b className="text-[#241710]">Tra ngay</b> hoặc chọn từ mẫu.
        </p>
      )}
    </div>
  );
}
