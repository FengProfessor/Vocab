'use client';

/**
 * Quiz nhớ nhanh A/B/C/D (không FSRS / không chờ đến hạn).
 * Nạp cả từ mới/giáo viên giao lẫn từ đã ôn, kèm hình ảnh & phát âm.
 * 1) meaning — EN + hình ảnh + âm thanh → chọn nghĩa VI (A/B/C/D)
 * 2) cloze — điền từ vào câu mẫu (A/B/C/D, lộ hình + âm thanh sau khi chọn)
 * 3) mix — xen kẽ cloze + meaning
 */

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronLeft,
  Loader2,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { StudentShell } from '@/components/student/StudentShell';
import { Button } from '@/components/ui/button';
import { authFetch } from '@/lib/auth-fetch';
import { resolveImageSrc } from '@/lib/media-url';
import { parseIpa, speak, stopSpeak } from '@/lib/study';
import { stopWordAudio } from '@/lib/audio';
import { stripEmbeddedVietnamese } from '@/lib/review-modes';
import { ExamInteractiveText } from '@/components/exam/ExamInteractiveText';
import { InteractiveClozeText, useOptionalVocabLookup } from '@/components/vocab';

const CORRECT_LS_KEY = 'verb-drill-correct-v1';
const POOL_CACHE_PREFIX = 'lp:verb-drill-pool:v2:';
const POOL_CACHE_TTL_MS = 2 * 60_000;
const MIN_LEARNED = 4;

type QType = 'meaning' | 'cloze';
type DrillMode = 'mix' | 'meaning_only';
type Phase = 'setup' | 'quiz' | 'done';
/** Bậc đúng quiz: 0=chưa, 1, 2, 3, 4=>3 */
type TierKey = 0 | 1 | 2 | 3 | 4;

function tierOfHits(n: number): TierKey {
  if (n <= 0) return 0;
  if (n === 1) return 1;
  if (n === 2) return 2;
  if (n === 3) return 3;
  return 4;
}

const ALL_TIERS: TierKey[] = [0, 1, 2, 3, 4];
const TIER_CHIP: Record<TierKey, string> = {
  0: 'chưa',
  1: '1',
  2: '2',
  3: '3',
  4: '>3',
};

interface WordEntry {
  id?: string;
  lemma: string;
  vi: string;
  pos: string;
  ipa: string;
  example: string;
  imageUrl?: string;
}

function readPoolCache(scopeKey: string): WordEntry[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(`${POOL_CACHE_PREFIX}${scopeKey}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { ts?: number; items?: WordEntry[] };
    if (!parsed || !Array.isArray(parsed.items)) return null;
    if (typeof parsed.ts === 'number' && Date.now() - parsed.ts > POOL_CACHE_TTL_MS) {
      return null;
    }
    return parsed.items;
  } catch {
    return null;
  }
}

function writePoolCache(scopeKey: string, items: WordEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(
      `${POOL_CACHE_PREFIX}${scopeKey}`,
      JSON.stringify({ ts: Date.now(), items }),
    );
  } catch {
    /* ignore quota errors */
  }
}

interface QuizQ {
  type: QType;
  lemma: string;
  /** Đáp án cần chọn (VI cho meaning, EN lemma surface cho cloze) */
  answer: string;
  pos: string;
  ipa: string;
  imageUrl?: string;
  /** Câu example đã blank (cloze) — chỉ EN, không sub VI */
  stem?: string;
  /** Surface form bị blank trong câu (có thể khác lemma: walks) */
  blankSurface?: string;
  opts: string[];
}

async function playDrillAudio(wordText: string): Promise<void> {
  const clean = wordText.trim();
  if (!clean) return;
  stopSpeak();
  stopWordAudio();
  try {
    const { playWordAudio } = await import('@/lib/audio');
    await playWordAudio(clean, null, 1.0);
  } catch {
    speak(clean, 1.0);
  }
}

type CorrectMap = Record<string, number>;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function loadCorrectMap(): CorrectMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(CORRECT_LS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const out: CorrectMap = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      const n = typeof v === 'number' ? v : Number(v);
      if (k && Number.isFinite(n) && n > 0) out[k.toLowerCase()] = Math.floor(n);
    }
    return out;
  } catch {
    return {};
  }
}

function saveCorrectMap(map: CorrectMap): void {
  try {
    localStorage.setItem(CORRECT_LS_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

function tierLabel(n: number): string {
  if (n <= 0) return '0';
  if (n === 1) return '1';
  if (n === 2) return '2';
  if (n === 3) return '3';
  return '>3';
}

function tierBadgeClass(n: number): string {
  if (n <= 0) return 'bg-slate-100 text-slate-500';
  if (n === 1) return 'bg-amber-100 text-amber-800';
  if (n === 2) return 'bg-sky-100 text-sky-800';
  if (n === 3) return 'bg-violet-100 text-violet-800';
  return 'bg-emerald-100 text-emerald-800';
}

function posLabel(pos: string, lemma?: string): { short: string; vi: string } {
  const p = String(pos || '')
    .trim()
    .toLowerCase()
    .replace(/\.$/, '');
  const map: Record<string, { short: string; vi: string }> = {
    v: { short: 'v.', vi: 'động từ' },
    verb: { short: 'v.', vi: 'động từ' },
    n: { short: 'n.', vi: 'danh từ' },
    noun: { short: 'n.', vi: 'danh từ' },
    adj: { short: 'adj.', vi: 'tính từ' },
    adjective: { short: 'adj.', vi: 'tính từ' },
    adv: { short: 'adv.', vi: 'trạng từ' },
    adverb: { short: 'adv.', vi: 'trạng từ' },
    prep: { short: 'prep.', vi: 'giới từ' },
    conj: { short: 'conj.', vi: 'liên từ' },
    pron: { short: 'pron.', vi: 'đại từ' },
    interj: { short: 'interj.', vi: 'thán từ' },
    num: { short: 'num.', vi: 'số từ' },
    phrase: { short: 'phr.', vi: 'cụm từ' },
    collocation: { short: 'phr.', vi: 'cụm từ' },
    colloc: { short: 'phr.', vi: 'cụm từ' },
    phrasal: { short: 'phr v.', vi: 'cụm động từ' },
    'phrasal verb': { short: 'phr v.', vi: 'cụm động từ' },
    idiom: { short: 'idiom', vi: 'thành ngữ' },
    expression: { short: 'expr.', vi: 'thành ngữ' },
  };
  if (map[p]) return map[p];
  if (!p) {
    if (lemma && lemma.trim().includes(' ')) {
      return { short: 'phr.', vi: 'cụm từ' };
    }
    return { short: '?', vi: 'chưa rõ loại' };
  }
  return { short: `${p}.`, vi: p };
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Blank lemma (hoặc surface gần lemma) trong example.
 * Trả null nếu không tìm thấy — không bịa câu.
 */
function blankInExample(
  example: string,
  lemma: string,
): { stem: string; surface: string } | null {
  // Gỡ "EN. (Bản dịch VI.)" dính trong field example
  const ex = stripEmbeddedVietnamese(example);
  const L = lemma.trim();
  if (!ex || !L || ex.length < 4) return null;

  const phrase = escapeRe(L).replace(/\s+/g, '\\s+');
  // 1) cả cụm / lemma nguyên (word-ish boundary)
  const tries: RegExp[] = [
    new RegExp(`(?<![\\w'])(${phrase})(?![\\w'])`, 'i'),
    new RegExp(`(${phrase})`, 'i'),
  ];

  // 2) dạng đơn giản: lemma + s / ed / ing (động từ thường)
  if (!/\s/.test(L) && L.length >= 2) {
    const base = escapeRe(L);
    tries.push(
      new RegExp(`(?<![\\w'])(${base}(?:s|es|ed|ing|er|est)?)(?![\\w'])`, 'i'),
    );
    // y → ies
    if (L.endsWith('y') && L.length > 2) {
      const stem = escapeRe(L.slice(0, -1));
      tries.push(new RegExp(`(?<![\\w'])(${stem}ies)(?![\\w'])`, 'i'));
    }
  }

  for (const re of tries) {
    const m = ex.match(re);
    if (!m || m.index === undefined || !m[1]) continue;
    const surface = m[1];
    // tránh blank quá dài / cả câu
    if (surface.length > Math.max(L.length + 6, 24)) continue;
    const stem =
      ex.slice(0, m.index) + '______' + ex.slice(m.index + surface.length);
    // blank phải còn chữ 2 bên (hoặc 1 bên nếu đầu/cuối)
    if (stem.replace(/_/g, '').trim().length < 2) continue;
    return { stem, surface };
  }
  return null;
}

function buildOpts(answer: string, pool: string[]): string[] {
  const wrong: string[] = [];
  const seen = new Set<string>([answer.toLowerCase()]);
  for (const v of shuffle(pool)) {
    const key = v.toLowerCase();
    if (seen.has(key) || !v || v === answer) continue;
    seen.add(key);
    wrong.push(v);
    if (wrong.length >= 3) break;
  }
  let i = 0;
  while (wrong.length < 3) {
    wrong.push(`(khác ${++i})`);
  }
  return shuffle([answer, ...wrong]);
}

function DrillWordImage({ imageUrl, alt }: { imageUrl?: string; alt: string }) {
  const [hidden, setHidden] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setHidden(false);
  }, [imageUrl]);

  if (!imageUrl || hidden) return null;

  const src = resolveImageSrc(imageUrl);
  if (!src) return null;

  return (
    <div className="mx-auto mb-3 aspect-[16/10] w-full max-w-[230px] overflow-hidden rounded-2xl border border-slate-100 bg-slate-100/80 shadow-inner">
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        loading="eager"
        decoding="async"
        className="h-full w-full object-cover object-center transition-opacity duration-150"
        onError={() => setHidden(true)}
      />
    </div>
  );
}

function VerbDrillContent() {
  const searchParams = useSearchParams();
  const initialClassroomId = searchParams.get('class');
  const scopeCacheKey = initialClassroomId || 'all';

  const [words, setWords] = useState<WordEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('setup');
  /** Kho theo bậc đúng — mặc định auto chọn các kho có từ để vào chơi 1 chạm */
  const [selectedTiers, setSelectedTiers] = useState<Set<TierKey>>(() => new Set());
  const userTouchedTiersRef = useRef(false);
  const [drillMode, setDrillMode] = useState<DrillMode>('mix');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [wordCount, setWordCount] = useState(15);
  const [queue, setQueue] = useState<QuizQ[]>([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [correctN, setCorrectN] = useState(0);
  const [correctMap, setCorrectMap] = useState<CorrectMap>({});
  const vocabLookup = useOptionalVocabLookup();
  const isLookupOpen = Boolean(vocabLookup?.isOpen);
  const vocabLookupRef = useRef(vocabLookup);
  useEffect(() => {
    vocabLookupRef.current = vocabLookup;
  }, [vocabLookup]);
  const spokenRevealIdxRef = useRef<number | null>(null);

  useEffect(() => {
    setCorrectMap(loadCorrectMap());
  }, []);

  useEffect(() => {
    let cancelled = false;
    const cached = readPoolCache(scopeCacheKey);
    if (cached && cached.length > 0) {
      setWords(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }
    setLoadErr(null);

    (async () => {
      try {
        const qs = new URLSearchParams();
        if (initialClassroomId && initialClassroomId !== '__personal__') {
          qs.set('classroomId', initialClassroomId);
        }
        const endpoint = qs.toString()
          ? `/api/practice/verb-drill-pool?${qs.toString()}`
          : '/api/practice/verb-drill-pool';

        const res = await authFetch(endpoint);
        if (res.status === 401) {
          if (!cancelled) {
            setLoadErr('login');
            setWords([]);
          }
          return;
        }
        const json = (await res.json()) as {
          success?: boolean;
          items?: WordEntry[];
          error?: string;
        };
        if (!json.success || !Array.isArray(json.items)) {
          throw new Error(json.error || 'Không tải được kho từ');
        }
        if (cancelled) return;

        setWords(json.items);
        writePoolCache(scopeCacheKey, json.items);

        // Background IPA fill cho các từ đơn còn thiếu IPA (không chặn setup UI)
        const missingIpaIds = json.items
          .filter((item) => item.id && !item.ipa && /^[a-zA-Z-]{2,32}$/.test(item.lemma))
          .slice(0, 15)
          .map((item) => item.id as string);

        if (missingIpaIds.length > 0) {
          void authFetch('/api/practice/verb-drill-pool', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ wordIds: missingIpaIds }),
          })
            .then((r) => r.json())
            .then((fillJson: { success?: boolean; updated?: Record<string, string> }) => {
              if (cancelled || !fillJson?.success || !fillJson.updated) return;
              const updatedMap = fillJson.updated;
              if (Object.keys(updatedMap).length === 0) return;

              setWords((prev) => {
                const nextWords = prev.map((w) =>
                  w.id && updatedMap[w.id] ? { ...w, ipa: updatedMap[w.id] } : w,
                );
                writePoolCache(scopeCacheKey, nextWords);
                return nextWords;
              });
              setQueue((prev) =>
                prev.map((q) => {
                  const matched = json.items?.find(
                    (it) => it.lemma.toLowerCase() === q.lemma.toLowerCase(),
                  );
                  const newIpa = matched?.id ? updatedMap[matched.id] : undefined;
                  return newIpa ? { ...q, ipa: newIpa } : q;
                }),
              );
            })
            .catch(() => {});
        }
      } catch (e) {
        if (!cancelled && !cached) {
          setLoadErr(e instanceof Error ? e.message : 'Lỗi tải');
          setWords([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialClassroomId, scopeCacheKey]);

  const canMeaning = words.length >= MIN_LEARNED;

  const allMeanings = useMemo(
    () => [...new Set(words.map((w) => w.vi))],
    [words],
  );
  const allLemmas = useMemo(
    () => [...new Set(words.map((w) => w.lemma))],
    [words],
  );

  const tierStats = useMemo(() => {
    const stats: Record<TierKey, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
    for (const w of words) {
      const t = tierOfHits(correctMap[w.lemma.toLowerCase()] ?? 0);
      stats[t] += 1;
    }
    return stats;
  }, [words, correctMap]);

  /** Pool theo kho bậc đã chọn */
  const poolWords = useMemo(() => {
    if (selectedTiers.size === 0) return [];
    return words.filter((w) => {
      const t = tierOfHits(correctMap[w.lemma.toLowerCase()] ?? 0);
      return selectedTiers.has(t);
    });
  }, [words, correctMap, selectedTiers]);

  const canQuiz = poolWords.length >= 1 && words.length >= MIN_LEARNED;

  const toggleTier = (t: TierKey) => {
    userTouchedTiersRef.current = true;
    setSelectedTiers((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  };

  useEffect(() => {
    if (userTouchedTiersRef.current || words.length === 0) return;
    const nonEmpty = new Set<TierKey>();
    for (const t of ALL_TIERS) {
      if (tierStats[t] > 0) nonEmpty.add(t);
    }
    if (nonEmpty.size > 0) {
      setSelectedTiers(nonEmpty);
    }
  }, [words.length, tierStats]);

  const start = useCallback(() => {
    if (!canQuiz || poolWords.length === 0) return;

    // Mix cố định: có example blank được → cloze (~45%), còn lại meaning (hoặc 100% meaning nếu chọn Chỉ nghĩa)
    const pool = shuffle(poolWords);
    const n = Math.min(wordCount, pool.length);
    const pickedWords = pool.slice(0, n);

    const q: QuizQ[] = [];
    for (const w of pickedWords) {
      const blank = drillMode === 'mix' ? blankInExample(w.example, w.lemma) : null;
      const wantCloze = blank != null && Math.random() < 0.45;

      if (wantCloze && blank) {
        const answer = blank.surface;
        const distractorPool = allLemmas.filter(
          (L) =>
            L.toLowerCase() !== w.lemma.toLowerCase() &&
            L.toLowerCase() !== answer.toLowerCase(),
        );
        q.push({
          type: 'cloze',
          lemma: w.lemma,
          answer,
          pos: w.pos,
          ipa: w.ipa,
          imageUrl: w.imageUrl,
          stem: blank.stem,
          blankSurface: blank.surface,
          opts: buildOpts(answer, distractorPool),
        });
      } else {
        q.push({
          type: 'meaning',
          lemma: w.lemma,
          answer: w.vi,
          pos: w.pos,
          ipa: w.ipa,
          imageUrl: w.imageUrl,
          opts: buildOpts(w.vi, allMeanings),
        });
      }
    }

    if (!q.length) return;
    spokenRevealIdxRef.current = null;
    vocabLookupRef.current?.closeLookup();
    setQueue(shuffle(q));
    setIdx(0);
    setPicked(null);
    setRevealed(false);
    setCorrectN(0);
    setPhase('quiz');
  }, [canQuiz, poolWords, wordCount, drillMode, allMeanings, allLemmas]);

  const current = queue[idx] ?? null;
  const currentPos = current ? posLabel(current.pos, current.lemma) : null;
  const currentIpa = current?.ipa ? parseIpa(current.ipa) : '';

  // Preload hình ảnh + audio cho 5 câu kế tiếp để khi bấm next ảnh/tiếng hiện tức thì (0ms)
  useEffect(() => {
    if (phase !== 'quiz' || queue.length === 0) return;
    const upcoming = queue.slice(idx, idx + 6);
    for (const q of upcoming) {
      if (q.imageUrl && typeof window !== 'undefined') {
        const src = resolveImageSrc(q.imageUrl);
        if (src) {
          const img = new window.Image();
          img.referrerPolicy = 'no-referrer';
          img.src = src;
        }
      }
    }
    if (soundEnabled) {
      void import('@/lib/offline/audio-cache')
        .then((m) =>
          m.prefetchAudioWindow(
            upcoming.map((q) => ({ id: q.lemma, word: q.blankSurface || q.lemma })),
            0,
            5,
          ),
        )
        .catch(() => {});
    }
  }, [phase, idx, queue, soundEnabled]);

  // Meaning card: auto nghe phát âm lemma bằng audio chuẩn (cloze chỉ nghe sau khi chọn để không lộ đáp án)
  useEffect(() => {
    if (phase !== 'quiz' || !current || current.type !== 'meaning' || !soundEnabled) {
      return () => {
        stopSpeak();
        stopWordAudio();
      };
    }
    stopSpeak();
    stopWordAudio();
    const t = window.setTimeout(() => {
      void playDrillAudio(current.lemma);
    }, 160);
    return () => {
      window.clearTimeout(t);
      stopSpeak();
      stopWordAudio();
    };
  }, [phase, idx, current?.lemma, current?.type, soundEnabled]);

  const next = useCallback(() => {
    stopSpeak();
    stopWordAudio();
    spokenRevealIdxRef.current = null;
    vocabLookupRef.current?.closeLookup();
    setIdx((i) => {
      if (i + 1 >= queue.length) {
        setPhase('done');
        return i;
      }
      setPicked(null);
      setRevealed(false);
      return i + 1;
    });
  }, [queue.length]);

  const answersMatch = (pickedOpt: string, answer: string) =>
    pickedOpt.trim().toLowerCase() === answer.trim().toLowerCase();

  const onPick = useCallback((o: string) => {
    if (revealed || !current) return;
    setPicked(o);
    setRevealed(true);
    if (answersMatch(o, current.answer)) {
      setCorrectN((n) => n + 1);
      const key = current.lemma.toLowerCase();
      setCorrectMap((prev) => {
        const nextN = (prev[key] ?? 0) + 1;
        const nextMap = { ...prev, [key]: nextN };
        saveCorrectMap(nextMap);
        return nextMap;
      });
    }
  }, [revealed, current]);

  // Phím tắt 1-4 / A-D chọn nhanh và Enter/Space sang câu tiếp
  useEffect(() => {
    if (phase !== 'quiz' || !current) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if ((e.target as HTMLElement | null)?.closest('.exam-lookup-trigger, .exam-lookup-card')) return;
      if (document.querySelector('.exam-lookup-card')) return;

      if (!revealed) {
        const keyMap: Record<string, number> = {
          '1': 0, a: 0, A: 0,
          '2': 1, b: 1, B: 1,
          '3': 2, c: 2, C: 2,
          '4': 3, d: 3, D: 3,
        };
        const optIdx = keyMap[e.key];
        if (optIdx !== undefined && current.opts[optIdx]) {
          e.preventDefault();
          onPick(current.opts[optIdx]);
        }
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [phase, current, revealed, onPick, next]);

  /**
   * Next timing:
   * - cloze (đúng/sai): phát âm từ đúng (nếu bật âm thanh) → rồi next (đúng ~0.4s sau audio, sai ~2.5s)
   * - nghĩa đúng: 1s
   * - nghĩa sai: 3.5s
   */
  useEffect(() => {
    if (phase !== 'quiz' || !revealed || !current || picked == null) return;
    const ok = answersMatch(picked, current.answer);
    let cancelled = false;
    let t: number | undefined;

    if (current.type === 'cloze') {
      const speakWord = (current.blankSurface || current.answer || current.lemma).trim();
      const shouldSpeak = soundEnabled && spokenRevealIdxRef.current !== idx;
      (async () => {
        if (shouldSpeak) {
          spokenRevealIdxRef.current = idx;
          await playDrillAudio(speakWord);
        }
        if (cancelled || isLookupOpen) return;
        const afterAudioMs = ok ? 400 : 2500;
        t = window.setTimeout(() => {
          if (!cancelled) next();
        }, afterAudioMs);
      })();
      return () => {
        cancelled = true;
        if (t !== undefined) window.clearTimeout(t);
      };
    }

    if (isLookupOpen) return;
    const delay = ok ? 1000 : 3500;
    t = window.setTimeout(() => {
      if (!cancelled) next();
    }, delay);
    return () => {
      cancelled = true;
      if (t !== undefined) window.clearTimeout(t);
    };
  }, [phase, revealed, idx, next, picked, current, isLookupOpen, soundEnabled]);

  const pct = useMemo(() => {
    if (!queue.length || phase !== 'done') return 0;
    return Math.round((correctN / queue.length) * 100);
  }, [correctN, queue.length, phase]);

  const sessionTiers = useMemo(() => {
    if (phase !== 'done') return null;
    const buckets: { lemma: string; pos: string; n: number; type: QType }[] = [];
    for (const q of queue) {
      const n = correctMap[q.lemma.toLowerCase()] ?? 0;
      buckets.push({ lemma: q.lemma, pos: q.pos, n, type: q.type });
    }
    buckets.sort((a, b) => a.n - b.n || a.lemma.localeCompare(b.lemma));
    return buckets;
  }, [phase, queue, correctMap]);

  const maxWords = poolWords.length;

  return (
    <StudentShell title="Quiz nhớ nhanh A/B/C/D" contentClassName="p-0" hideMobileNav>
      <div className="mx-auto max-w-md space-y-3 px-3 py-3 pb-24">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Link
              href="/student"
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600"
              aria-label="Quay lại màn hình chính"
            >
              <ChevronLeft className="inline h-3.5 w-3.5" />
            </Link>
            <h1 className="text-base font-black text-slate-900">Quiz nhớ nhanh A·B·C·D</h1>
          </div>

          <button
            type="button"
            onClick={() => {
              const nextSound = !soundEnabled;
              setSoundEnabled(nextSound);
              if (!nextSound) {
                stopSpeak();
                stopWordAudio();
              }
            }}
            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-bold transition ${
              soundEnabled
                ? 'border-violet-200 bg-violet-50 text-violet-700'
                : 'border-slate-200 bg-white text-slate-400'
            }`}
            aria-label={soundEnabled ? 'Tắt âm thanh tự động' : 'Bật âm thanh tự động'}
          >
            {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            <span>{soundEnabled ? 'Âm thanh' : 'Tắt tiếng'}</span>
          </button>
        </div>

        {loading && (
          <div className="flex justify-center py-10 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}

        {!loading && loadErr === 'login' && (
          <section className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center">
            <p className="text-sm font-bold text-amber-950">Đăng nhập để quiz kho từ của bạn</p>
            <p className="text-[12px] text-amber-800/80">
              Lưu từ → học flashcard → mới quiz được.
            </p>
            <Link
              href="/auth"
              className="flex h-10 w-full items-center justify-center rounded-xl bg-violet-600 text-sm font-bold text-white hover:bg-violet-700"
            >
              Đăng nhập
            </Link>
          </section>
        )}

        {!loading && loadErr && loadErr !== 'login' && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-800">{loadErr}</p>
        )}

        {!loading && !loadErr && !canMeaning && (
          <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
              <BookOpen className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-slate-900">Cần tối thiểu {MIN_LEARNED} từ trong kho</p>
            <p className="text-[12px] leading-relaxed text-slate-500">
              Quiz sẽ tự lấy toàn bộ từ cá nhân &amp; từ lớp giáo viên giao để tạo 4 phương án A/B/C/D (không cần chờ đến hạn FSRS).
            </p>
            <div className="rounded-xl bg-slate-50 px-3 py-2 text-left text-[11px] text-slate-600">
              <p>
                · Hiện có: <strong>{words.length}</strong> / cần ≥ {MIN_LEARNED} từ
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Link
                href="/dictionary"
                className="flex h-10 w-full items-center justify-center rounded-xl bg-violet-600 text-sm font-bold text-white hover:bg-violet-700"
              >
                Tra &amp; lưu thêm từ
              </Link>
              <Link
                href="/library"
                className="flex h-10 w-full items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Xem kho từ
              </Link>
            </div>
          </section>
        )}

        {!loading && !loadErr && canMeaning && phase === 'setup' && (
          <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-slate-800">Luyện tập A·B·C·D nhanh</p>
                <p className="text-[12px] text-slate-500">
                  {words.length} từ sẵn sàng (không chờ hạn FSRS)
                </p>
              </div>
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-black text-violet-700">
                Hình + Tiếng
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-slate-100 p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setDrillMode('mix')}
                className={`rounded-lg py-1.5 transition ${
                  drillMode === 'mix'
                    ? 'bg-white text-violet-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Hỗn hợp (Nghĩa + Cloze)
              </button>
              <button
                type="button"
                onClick={() => setDrillMode('meaning_only')}
                className={`rounded-lg py-1.5 transition ${
                  drillMode === 'meaning_only'
                    ? 'bg-white text-violet-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Chỉ chọn nghĩa A·B·C·D
              </button>
            </div>

            <p className="text-[12px] font-semibold text-slate-600">
              Lọc theo lượt trả lời đúng
            </p>

            <div>
              <div className="flex flex-wrap gap-1.5">
                {ALL_TIERS.map((t) => {
                  const on = selectedTiers.has(t);
                  const count = tierStats[t];
                  const empty = count === 0;
                  return (
                    <button
                      key={t}
                      type="button"
                      disabled={empty}
                      onClick={() => toggleTier(t)}
                      className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-black transition ${
                        on
                          ? `${tierBadgeClass(t === 4 ? 4 : t)} border-transparent ring-2 ring-violet-400 ring-offset-1`
                          : empty
                            ? 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300'
                            : 'border-slate-200 bg-white text-slate-500 active:bg-slate-50'
                      }`}
                    >
                      {TIER_CHIP[t]}: {count}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1.5 text-[10px] text-slate-400">
                {selectedTiers.size === 0
                  ? 'Chưa chọn kho'
                  : `Đang chọn ${poolWords.length} từ`}
              </p>
            </div>

            <label className="block text-[12px] font-semibold text-slate-600">
              Số câu mỗi lượt: {Math.min(wordCount, Math.max(maxWords, 1))}
              <input
                type="range"
                min={1}
                max={Math.min(50, Math.max(maxWords, 1))}
                value={Math.min(wordCount, Math.max(maxWords, 1))}
                onChange={(e) => setWordCount(Number(e.target.value))}
                className="mt-2 w-full"
                disabled={maxWords < 1}
              />
            </label>

            <Button
              className="h-11 w-full rounded-xl bg-violet-600 text-sm font-bold hover:bg-violet-700"
              onClick={start}
              disabled={!canQuiz || poolWords.length === 0}
            >
              {selectedTiers.size === 0 ? 'Chọn kho từ trước' : 'Bắt đầu'}
            </Button>
          </section>
        )}

        {phase === 'quiz' && current && (
          <section className="space-y-3">
            <p className="text-center text-[12px] font-semibold text-slate-400">
              {idx + 1} / {queue.length}
              <span className="ml-2 text-emerald-600">· đúng {correctN}</span>
              <span className="ml-2 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-black text-slate-500">
                {current.type === 'cloze' ? 'CLOZE' : 'NGHĨA'}
              </span>
            </p>

            {current.type === 'cloze' ? (
              <div className="rounded-2xl border border-teal-100 bg-teal-50/40 px-4 py-5 text-center">
                <p className="text-[11px] font-bold uppercase tracking-wide text-teal-700/80">
                  Điền vào chỗ trống
                </p>
                {/* Chỉ câu EN có blank — không sub VI / POS VI (lộ nghĩa) */}
                <p className="mt-2.5 text-lg font-bold leading-snug text-slate-900">
                  <InteractiveClozeText
                    text={current.stem ?? ''}
                    enabled
                    as="span"
                    themeVariant="default"
                    blankClassName="inline-block min-w-10 border-b-2 border-teal-400 px-1 text-center font-mono text-sm text-teal-700/70 select-none"
                  />
                </p>
                {/* Sau khi trả lời: lộ hình ảnh minh họa + lemma + IPA + nghĩa từ + nghe lại */}
                {revealed && (
                  <div className="mt-3 flex flex-col items-center justify-center gap-1.5 border-t border-teal-200/60 pt-3">
                    <DrillWordImage
                      key={`cloze-img-${idx}-${current.lemma}`}
                      imageUrl={current.imageUrl}
                      alt={current.lemma}
                    />
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <span className="text-sm font-black text-slate-900">
                        <ExamInteractiveText
                          text={current.blankSurface || current.lemma}
                          enabled={revealed}
                          as="span"
                          inheritClassName
                          themeVariant="default"
                          contextSentence={current.stem}
                        />
                      </span>
                      {currentIpa && (
                        <span className="font-mono text-xs text-slate-500">{currentIpa}</span>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          void playDrillAudio((current.blankSurface || current.lemma).trim())
                        }
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-teal-200 bg-white text-teal-700 shadow-xs active:scale-95"
                        aria-label="Nghe"
                      >
                        <Volume2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {/* Nghĩa Tiếng Việt của từ vựng */}
                    <p className="text-xs font-bold text-teal-900">
                      {words.find((w) => w.lemma.toLowerCase() === current.lemma.toLowerCase())?.vi}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-violet-100 bg-violet-50/50 px-4 py-5 text-center">
                <DrillWordImage
                  key={`meaning-img-${idx}-${current.lemma}`}
                  imageUrl={current.imageUrl}
                  alt={current.lemma}
                />
                <p className="text-3xl font-black tracking-tight text-slate-900">
                  <ExamInteractiveText
                    text={current.lemma}
                    enabled={revealed}
                    as="span"
                    inheritClassName
                    themeVariant="default"
                  />
                </p>
                <div className="mt-2 flex items-center justify-center gap-2">
                  {currentIpa && (
                    <p className="font-mono text-sm text-slate-500">{currentIpa}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => void playDrillAudio(current.lemma)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-violet-200 bg-white text-violet-700 shadow-sm active:scale-95"
                    aria-label="Nghe phát âm"
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>
                </div>
                {currentPos && (
                  <p className="mt-2 text-[12px] font-semibold text-violet-700">
                    <span className="rounded-md bg-violet-100 px-2 py-0.5 font-black">
                      {currentPos.short}
                    </span>
                    <span className="ml-1.5 text-violet-600/80">{currentPos.vi}</span>
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              {current.opts.map((o, i) => {
                const label = String.fromCharCode(65 + i);
                const isAns = answersMatch(o, current.answer);
                const isPick = picked != null && answersMatch(o, picked);
                let cls =
                  'flex w-full items-center gap-2 rounded-xl border px-3 py-3 text-left text-sm font-semibold ';
                if (!revealed) {
                  cls += 'border-slate-200 bg-white active:bg-violet-50';
                } else if (isAns) {
                  cls += 'border-emerald-400 bg-emerald-50 text-emerald-900';
                } else if (isPick) {
                  cls += 'border-red-300 bg-red-50 text-red-800';
                } else {
                  cls += 'border-slate-100 bg-slate-50 text-slate-400';
                }
                return (
                  <div
                    key={`${current.lemma}-${current.type}-${i}-${o}`}
                    role="button"
                    tabIndex={revealed ? -1 : 0}
                    aria-disabled={revealed}
                    onClick={(e) => {
                      if ((e.target as HTMLElement)?.closest?.('.exam-lookup-trigger, .exam-lookup-card')) return;
                      if (!revealed) onPick(o);
                    }}
                    onKeyDown={(e) => {
                      if ((e.target as HTMLElement)?.closest?.('.exam-lookup-trigger, .exam-lookup-card')) return;
                      if (!revealed && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        onPick(o);
                      }
                    }}
                    className={`${cls} ${revealed ? 'cursor-default select-text' : 'cursor-pointer select-none'}`}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[11px] font-black text-slate-600">
                      {label}
                    </span>
                    <span className="min-w-0 flex-1">
                      {revealed && isAns && (
                        <Check className="mr-1 inline h-3.5 w-3.5" />
                      )}
                      {revealed && isPick && !isAns && (
                        <X className="mr-1 inline h-3.5 w-3.5" />
                      )}
                      {current.type === 'cloze' && !o.startsWith('(khác') ? (
                        <ExamInteractiveText
                          text={o}
                          enabled={revealed}
                          as="span"
                          inheritClassName
                          themeVariant="default"
                          contextSentence={current.stem}
                        />
                      ) : (
                        o
                      )}
                    </span>
                  </div>
                );
              })}
            </div>

            {revealed && picked != null && (
              <div className="flex items-center justify-between gap-2 pt-1">
                <p className="text-[11px] font-medium text-slate-400">
                  {idx + 1 >= queue.length
                    ? 'Sắp xem kết quả…'
                    : current.type === 'cloze'
                      ? 'Đang nghe từ đúng…'
                      : answersMatch(picked, current.answer)
                        ? 'Tự sang câu tiếp (1s)…'
                        : 'Tự sang câu tiếp (3.5s)…'}
                </p>
                <Button
                  type="button"
                  size="sm"
                  onClick={next}
                  className="h-8 rounded-lg bg-violet-600 px-3 text-xs font-bold text-white hover:bg-violet-700"
                >
                  <span>{idx + 1 >= queue.length ? 'Xem kết quả' : 'Câu tiếp'}</span>
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </section>
        )}

        {phase === 'done' && (
          <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 text-center">
            <p className="text-2xl font-black text-violet-700">{pct}%</p>
            <p className="text-sm text-slate-600">
              {correctN}/{queue.length} đúng phiên này
            </p>
            {sessionTiers && sessionTiers.length > 0 && (
              <div className="max-h-48 space-y-1 overflow-y-auto text-left">
                <p className="mb-1 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Lượt đúng tích lũy
                </p>
                {sessionTiers.map((row) => {
                  const pl = posLabel(row.pos);
                  return (
                    <div
                      key={`${row.lemma}-${row.type}`}
                      className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 px-2.5 py-1.5 text-[12px]"
                    >
                      <span className="min-w-0 font-semibold text-slate-800">
                        <ExamInteractiveText
                          text={row.lemma}
                          enabled
                          as="span"
                          inheritClassName
                          themeVariant="default"
                        />
                        <span className="ml-1 text-[10px] font-bold text-slate-400">
                          {pl.short}
                        </span>
                        <span className="ml-1 text-[9px] font-bold uppercase text-slate-300">
                          {row.type === 'cloze' ? 'cloze' : 'nghĩa'}
                        </span>
                      </span>
                      <span
                        className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-black ${tierBadgeClass(row.n)}`}
                      >
                        {tierLabel(row.n)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="h-10 flex-1 rounded-xl"
                onClick={() => setPhase('setup')}
              >
                <RotateCcw className="mr-1 h-3.5 w-3.5" />
                Lại
              </Button>
              <Button
                className="h-10 flex-1 rounded-xl bg-violet-600 font-bold hover:bg-violet-700"
                onClick={start}
              >
                Chơi tiếp
              </Button>
            </div>
          </section>
        )}
      </div>
    </StudentShell>
  );
}

export default function VerbDrillPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      }
    >
      <VerbDrillContent />
    </Suspense>
  );
}
