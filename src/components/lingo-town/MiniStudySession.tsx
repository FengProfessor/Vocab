'use client';

/**
 * Phiên ôn gọn trong game — chỉ UI ôn tập, không load full trang LingoPro.
 * Ưu tiên từ due thật (auth); fallback word demo.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { authFetch } from '@/lib/auth-fetch';
import type { ActivityKind } from '@/lib/lingo-town-activities';
import { GROVE_WORDS } from '@/lib/lingo-town';
import { speak, parseIpa } from '@/lib/study';

export interface StudyWord {
  id: string;
  word: string;
  translation: string;
  ipa?: string;
  example?: string;
  example_vi?: string | null;
}

const DEMO_WORDS: StudyWord[] = GROVE_WORDS.map((w, i) => ({
  id: `demo-${i}`,
  word: w.en,
  translation: w.vi,
}));

// thêm vài từ demo cho quiz
const EXTRA: StudyWord[] = [
  { id: 'd-share', word: 'share', translation: 'chia sẻ' },
  { id: 'd-routine', word: 'routine', translation: 'thói quen' },
  { id: 'd-balance', word: 'balance', translation: 'cân bằng' },
  { id: 'd-pollution', word: 'pollution', translation: 'ô nhiễm' },
  { id: 'd-recycle', word: 'recycle', translation: 'tái chế' },
  { id: 'd-deadline', word: 'deadline', translation: 'hạn chót' },
];

type Props = {
  kind: ActivityKind;
  onProgress?: (n: number) => void;
};

export function MiniStudySession({ kind, onProgress }: Props) {
  const [words, setWords] = useState<StudyWord[]>([...DEMO_WORDS, ...EXTRA]);
  const [source, setSource] = useState<'live' | 'demo'>('demo');
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(0);
  const [input, setInput] = useState('');
  const [verdict, setVerdict] = useState<'ok' | 'bad' | null>(null);
  const [dictQ, setDictQ] = useState('');
  const [dictResult, setDictResult] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await authFetch('/api/words?filter=review');
        const json = await res.json();
        if (cancelled) return;
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const mapped: StudyWord[] = json.data.slice(0, 20).map(
            (w: {
              id?: string;
              word?: string;
              translation?: string;
              ipa?: string;
              example?: string;
              example_vi?: string | null;
            }) => ({
              id: String(w.id ?? w.word),
              word: String(w.word ?? ''),
              translation: String(w.translation ?? ''),
              ipa: w.ipa,
              example: w.example,
              example_vi: w.example_vi,
            })
          ).filter((w: StudyWord) => w.word);
          if (mapped.length > 0) {
            setWords(mapped);
            setSource('live');
          }
        }
      } catch {
        /* demo fallback */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const deck = useMemo(() => words.slice(0, 12), [words]);
  const current = deck[idx % Math.max(1, deck.length)];

  const advance = useCallback(
    (correct: boolean) => {
      if (correct) {
        setDone((d) => {
          const n = d + 1;
          onProgress?.(n);
          return n;
        });
      }
      setFlipped(false);
      setInput('');
      setVerdict(null);
      setIdx((i) => i + 1);
    },
    [onProgress]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-amber-200/50">
        Đang lấy từ ôn…
      </div>
    );
  }

  if (!current) {
    return (
      <div className="py-12 text-center text-sm text-amber-100/60">
        Không có từ để ôn. Thêm từ trong LingoPro hoặc dùng demo.
      </div>
    );
  }

  // —— Dictionary mini ——
  if (kind === 'dictionary' || kind === 'library') {
    return (
      <div className="space-y-3">
        <SourceBadge source={source} done={done} />
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-xl border border-amber-800/50 bg-black/30 px-3 py-2 text-sm text-amber-50"
            placeholder="Gõ từ tiếng Anh…"
            value={dictQ}
            onChange={(e) => setDictQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const w = deck.find(
                  (x) => x.word.toLowerCase() === dictQ.trim().toLowerCase()
                );
                setDictResult(
                  w
                    ? `${w.word} — ${w.translation}${w.ipa ? ` ${parseIpa(w.ipa)}` : ''}`
                    : `“${dictQ}” — mở full từ điển để tra sâu (panel này tra trong deck ôn).`
                );
              }
            }}
          />
          <button
            type="button"
            className="px-3 py-2 rounded-xl bg-amber-400 text-amber-950 text-xs font-bold"
            onClick={() => {
              const w = deck.find(
                (x) => x.word.toLowerCase() === dictQ.trim().toLowerCase()
              );
              setDictResult(
                w
                  ? `${w.word} — ${w.translation}`
                  : 'Không có trong deck. Thử từ đang ôn.'
              );
            }}
          >
            Tra
          </button>
        </div>
        {dictResult && (
          <div className="rounded-xl bg-black/30 border border-amber-800/40 px-3 py-3 text-sm">
            {dictResult}
          </div>
        )}
        <p className="text-[11px] text-amber-100/40">Gợi ý từ trong phiên:</p>
        <div className="flex flex-wrap gap-1.5">
          {deck.slice(0, 8).map((w) => (
            <button
              key={w.id}
              type="button"
              className="text-[11px] px-2 py-1 rounded-lg bg-amber-900/40 border border-amber-800/50"
              onClick={() => {
                setDictQ(w.word);
                setDictResult(`${w.word} — ${w.translation}`);
                setDone((d) => d + 1);
                onProgress?.(done + 1);
              }}
            >
              {w.word}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // —— Writing / type ——
  if (kind === 'writing') {
    return (
      <div className="space-y-4">
        <SourceBadge source={source} done={done} />
        <div className="text-center space-y-1">
          <p className="text-xs text-amber-100/45">Gõ tiếng Anh</p>
          <p className="text-2xl font-semibold text-amber-50">{current.translation}</p>
          {current.ipa && (
            <p className="text-xs text-amber-100/35">{parseIpa(current.ipa)}</p>
          )}
        </div>
        <input
          className="w-full rounded-xl border border-amber-800/50 bg-black/30 px-3 py-3 text-center text-lg text-amber-50"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const ok = input.trim().toLowerCase() === current.word.toLowerCase();
              setVerdict(ok ? 'ok' : 'bad');
              if (ok) setTimeout(() => advance(true), 500);
            }
          }}
          placeholder="type English word…"
          autoFocus
        />
        {verdict === 'ok' && (
          <p className="text-center text-emerald-400 text-sm">✓ Đúng!</p>
        )}
        {verdict === 'bad' && (
          <p className="text-center text-rose-400 text-sm">
            → {current.word}
            <button
              type="button"
              className="ml-2 underline"
              onClick={() => advance(false)}
            >
              Tiếp
            </button>
          </p>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            className="flex-1 py-2 rounded-xl bg-amber-400 text-amber-950 text-sm font-bold"
            onClick={() => {
              const ok = input.trim().toLowerCase() === current.word.toLowerCase();
              setVerdict(ok ? 'ok' : 'bad');
              if (ok) setTimeout(() => advance(true), 400);
            }}
          >
            Kiểm tra
          </button>
          <button
            type="button"
            className="px-3 py-2 rounded-xl border border-amber-800 text-xs"
            onClick={() => speak(current.word)}
          >
            🔊
          </button>
        </div>
      </div>
    );
  }

  // —— Quiz MC ——
  if (kind === 'quiz' || kind === 'pronunciation') {
    const opts = buildOptions(current, deck);
    return (
      <div className="space-y-4">
        <SourceBadge source={source} done={done} />
        <div className="text-center">
          <p className="text-xs text-amber-100/45 mb-1">Chọn nghĩa đúng</p>
          <p className="text-3xl font-bold tracking-wide text-amber-50">{current.word}</p>
          {current.ipa && (
            <p className="text-xs text-amber-100/40 mt-1">{parseIpa(current.ipa)}</p>
          )}
          <button
            type="button"
            className="mt-2 text-xs text-sky-300 underline"
            onClick={() => speak(current.word)}
          >
            Nghe phát âm
          </button>
        </div>
        <div className="grid gap-2">
          {opts.map((o) => (
            <button
              key={o}
              type="button"
              className="text-left px-3 py-2.5 rounded-xl border border-amber-800/50 bg-black/25 hover:border-amber-400/60 hover:bg-amber-500/10 text-sm"
              onClick={() => {
                const ok = o === current.translation;
                if (ok) advance(true);
                else {
                  setVerdict('bad');
                  setTimeout(() => {
                    setVerdict(null);
                    advance(false);
                  }, 700);
                }
              }}
            >
              {o}
            </button>
          ))}
        </div>
        {verdict === 'bad' && (
          <p className="text-center text-xs text-rose-300">Sai — đáp án: {current.translation}</p>
        )}
      </div>
    );
  }

  // —— Grammar / journey / pack-reading / scenario: hướng dẫn + flash ——
  if (
    kind === 'grammar' ||
    kind === 'journey' ||
    kind === 'pack-reading' ||
    kind === 'speaking-scenario' ||
    kind === 'mindmap'
  ) {
    return (
      <div className="space-y-4">
        <SourceBadge source={source} done={done} />
        <p className="text-xs text-amber-100/50 leading-relaxed">
          Panel gọn: ôn từ liên quan. (Grammar/journey full vẫn ở app — ở đây luyện vocab nhanh.)
        </p>
        <FlashBody
          current={current}
          flipped={flipped}
          setFlipped={setFlipped}
          advance={advance}
        />
      </div>
    );
  }

  // —— Default: flashcard / review ——
  return (
    <div className="space-y-4">
      <SourceBadge source={source} done={done} />
      <FlashBody
        current={current}
        flipped={flipped}
        setFlipped={setFlipped}
        advance={advance}
      />
    </div>
  );
}

function FlashBody({
  current,
  flipped,
  setFlipped,
  advance,
}: {
  current: StudyWord;
  flipped: boolean;
  setFlipped: (v: boolean) => void;
  advance: (ok: boolean) => void;
}) {
  return (
    <>
      <button
        type="button"
        onClick={() => setFlipped(!flipped)}
        className="w-full min-h-[160px] rounded-2xl border-2 border-amber-700/50 bg-gradient-to-b from-[#3d2a1a] to-[#1a120c] px-4 py-8 text-center shadow-inner"
      >
        {!flipped ? (
          <>
            <p className="text-[10px] uppercase tracking-widest text-amber-200/40 mb-2">
              English · chạm để lật
            </p>
            <p className="text-3xl font-bold text-amber-50">{current.word}</p>
            {current.ipa && (
              <p className="text-sm text-amber-100/40 mt-2">{parseIpa(current.ipa)}</p>
            )}
          </>
        ) : (
          <>
            <p className="text-[10px] uppercase tracking-widest text-amber-200/40 mb-2">
              Tiếng Việt
            </p>
            <p className="text-2xl font-semibold text-emerald-300">{current.translation}</p>
            {current.example && (
              <div className="mt-3 text-left">
                <p className="text-xs text-amber-100/45 italic leading-relaxed">
                  {current.example}
                </p>
                {current.example_vi && (
                  <p className="mt-1 text-[11px] text-amber-100/35 leading-relaxed">
                    {current.example_vi}
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </button>
      <div className="flex gap-2">
        <button
          type="button"
          className="flex-1 py-2.5 rounded-xl bg-stone-700/80 text-sm"
          onClick={() => advance(false)}
        >
          Chưa nhớ
        </button>
        <button
          type="button"
          className="px-3 py-2.5 rounded-xl border border-amber-800 text-sm"
          onClick={() => speak(current.word)}
        >
          🔊
        </button>
        <button
          type="button"
          className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-emerald-950 font-bold text-sm"
          onClick={() => advance(true)}
        >
          Đã nhớ
        </button>
      </div>
    </>
  );
}

function SourceBadge({ source, done }: { source: 'live' | 'demo'; done: number }) {
  return (
    <div className="flex items-center justify-between text-[10px] font-mono text-amber-100/40">
      <span>
        {source === 'live' ? '🟢 Từ due LingoPro' : '🟡 Deck demo (chưa login / chưa có due)'}
      </span>
      <span>Đúng: {done}</span>
    </div>
  );
}

function buildOptions(current: StudyWord, deck: StudyWord[]): string[] {
  const others = deck
    .filter((w) => w.id !== current.id && w.translation)
    .map((w) => w.translation);
  const pool = [...new Set(others)].sort(() => Math.random() - 0.5).slice(0, 3);
  const opts = [...pool, current.translation];
  return opts.sort(() => Math.random() - 0.5);
}
