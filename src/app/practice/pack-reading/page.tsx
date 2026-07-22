'use client';

/**
 * Luyện đọc gói từ: nhập từ → chọn CHỦ ĐỀ (bắt buộc) → bấm Gen AI mới sinh đoạn.
 * URL: /practice/pack-reading
 */

import { Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Check,
  ChevronLeft,
  Loader2,
  Sparkles,
  X,
} from 'lucide-react';
import { StudentShell } from '@/components/student/StudentShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  PACK_THEMES,
  type PackTheme,
} from '@/lib/pack-themes';
import {
  PACK_READING_LEVELS,
  DEFAULT_PACK_READING_LEVEL_ID,
  type PackReadingLevel,
} from '@/lib/pack-levels';
import {
  PACK_PASSAGE_MAX_WORDS,
  PACK_PASSAGE_MIN_WORDS,
} from '@/lib/pack-passage';

interface DemoWord {
  word: string;
  translation?: string;
  pos?: string;
}

interface DemoPack {
  id: string;
  title: string;
  level: string;
  wordCount: number;
  words: DemoWord[];
}

interface PassageQuestion {
  q: string;
  options: string[];
  answer: string;
  explain: string;
}

interface PassageData {
  title: string;
  passage: string;
  passagePlain: string;
  level: string;
  themeId?: string;
  themeLabelVi?: string;
  readingLevelId?: string;
  readingLevelLabelVi?: string;
  wordCount: number;
  usedWords: string[];
  missingWords: string[];
  coverage: number;
  questions: PassageQuestion[];
  cloze: {
    text: string;
    blanks: { id: number; answer: string; options: string[] }[];
  };
  meta: { attempts: number; providerNote: string };
}

type Step = 1 | 2 | 3;
type ResultTab = 'passage' | 'cloze';

function highlightPassage(md: string): ReactNode[] {
  const parts = md.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    const m = part.match(/^\*\*([^*]+)\*\*$/);
    if (m) {
      return (
        <mark
          key={i}
          className="rounded bg-amber-200/90 px-0.5 font-semibold text-amber-950 dark:bg-amber-500/30 dark:text-amber-100"
        >
          {m[1]}
        </mark>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function renderClozeText(
  text: string,
  blanks: { id: number; answer: string; options: string[] }[],
  answers: Record<number, string>,
  onPick: (id: number, value: string) => void,
  revealed: boolean,
): ReactNode[] {
  const nodes: ReactNode[] = [];
  const re = /\{\{(\d+)\}\}/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(<span key={key++}>{text.slice(last, match.index)}</span>);
    }
    const id = Number(match[1]);
    const blank = blanks.find((b) => b.id === id) ?? blanks[id];
    const selected = answers[id] ?? '';
    const correct = blank?.answer?.toLowerCase() === selected.toLowerCase();
    nodes.push(
      <span key={key++} className="mx-0.5 my-1 inline-flex flex-col align-middle">
        <select
          className={`min-w-[7rem] rounded border px-2 py-1 text-sm ${
            revealed
              ? correct
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-red-400 bg-red-50'
              : 'border-border bg-background'
          }`}
          value={selected}
          onChange={(e) => onPick(id, e.target.value)}
          disabled={revealed}
        >
          <option value="">— chọn —</option>
          {(blank?.options ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </span>,
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) {
    nodes.push(<span key={key++}>{text.slice(last)}</span>);
  }
  return nodes;
}

function PackReadingInner() {
  const [step, setStep] = useState<Step>(1);
  const [packs, setPacks] = useState<DemoPack[]>([]);
  const [packId, setPackId] = useState('');
  const [customText, setCustomText] = useState('');
  const [themeId, setThemeId] = useState<string | null>(null);
  const [readingLevelId, setReadingLevelId] = useState<string>(DEFAULT_PACK_READING_LEVEL_ID);

  const [passage, setPassage] = useState<PassageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [resultTab, setResultTab] = useState<ResultTab>('passage');
  const [qAnswers, setQAnswers] = useState<Record<number, string>>({});
  const [qRevealed, setQRevealed] = useState(false);
  const [clozeAnswers, setClozeAnswers] = useState<Record<number, string>>({});
  const [clozeRevealed, setClozeRevealed] = useState(false);

  useEffect(() => {
    fetch('/api/practice/pack-passage')
      .then((r) => r.json())
      .then((j: { success?: boolean; packs?: DemoPack[] }) => {
        if (j.success && Array.isArray(j.packs)) {
          setPacks(j.packs);
          if (j.packs[0]) setPackId(j.packs[0].id);
        }
      })
      .catch(() => {
        /* ignore */
      });
  }, []);

  const activePack = useMemo(
    () => packs.find((p) => p.id === packId) ?? null,
    [packs, packId],
  );

  const parsedCustom = useMemo(() => {
    return customText
      .split(/[\n,;]+/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && l.length < 80)
      .map((line) => {
        const parts = line.split(/\s*[|–—]\s+/).map((s) => s.trim());
        return { word: parts[0], translation: parts[1] };
      })
      .filter((w) => w.word);
  }, [customText]);

  const wordCount = customText.trim()
    ? parsedCustom.length
    : activePack?.words.length ?? 0;

  const wordsOk =
    wordCount >= PACK_PASSAGE_MIN_WORDS && wordCount <= PACK_PASSAGE_MAX_WORDS;

  const selectedTheme: PackTheme | null = useMemo(
    () => PACK_THEMES.find((t) => t.id === themeId) ?? null,
    [themeId],
  );

  const selectedLevel: PackReadingLevel | null = useMemo(
    () => PACK_READING_LEVELS.find((l) => l.id === readingLevelId) ?? null,
    [readingLevelId],
  );

  const canGoTheme = wordsOk;
  const canGen = wordsOk && !!themeId && !!readingLevelId && !loading;

  const genPassage = useCallback(async () => {
    if (!themeId) {
      setError('Chọn chủ đề trước khi Gen AI.');
      return;
    }
    if (!readingLevelId) {
      setError('Chọn cấp độ bài đọc trước khi Gen AI.');
      return;
    }
    setLoading(true);
    setError(null);
    setPassage(null);
    setQAnswers({});
    setQRevealed(false);
    setClozeAnswers({});
    setClozeRevealed(false);
    setResultTab('passage');
    try {
      const body = customText.trim()
        ? {
            themeId,
            readingLevelId,
            text: customText,
            title: selectedTheme?.labelEn ?? 'Custom pack',
          }
        : {
            themeId,
            readingLevelId,
            packId: packId || undefined,
            words: activePack?.words,
            title: activePack?.title,
          };
      const res = await fetch('/api/practice/pack-passage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as {
        success?: boolean;
        error?: string;
        data?: PassageData;
      };
      if (!json.success || !json.data) throw new Error(json.error || 'Gen failed');
      setPassage(json.data);
      setStep(3);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [themeId, readingLevelId, customText, selectedTheme, activePack, packId]);

  const qScore = useMemo(() => {
    if (!passage || !qRevealed) return null;
    let ok = 0;
    passage.questions.forEach((q, i) => {
      if ((qAnswers[i] || '').trim() === q.answer.trim()) ok++;
    });
    return { ok, total: passage.questions.length };
  }, [passage, qAnswers, qRevealed]);

  const clozeScore = useMemo(() => {
    if (!passage || !clozeRevealed) return null;
    let ok = 0;
    passage.cloze.blanks.forEach((b) => {
      if ((clozeAnswers[b.id] || '').toLowerCase() === b.answer.toLowerCase()) ok++;
    });
    return { ok, total: passage.cloze.blanks.length };
  }, [passage, clozeAnswers, clozeRevealed]);

  return (
    <StudentShell title="Luyện đọc gói từ">
      <div className="mx-auto max-w-2xl space-y-4 px-3 py-4 pb-24 sm:px-4">
        <div className="flex items-center gap-2">
          <Link
            href="/student"
            className="flex h-9 w-9 items-center justify-center rounded-xl border bg-white text-slate-600 shadow-sm"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-black text-slate-900">Luyện đọc gói từ</h1>
            <p className="text-[11px] font-semibold text-slate-500">
              Nhập từ → chọn chủ đề → bấm Gen AI (không pre-gen)
            </p>
          </div>
          <BookOpen className="h-6 w-6 text-teal-600" />
        </div>

        {/* Steps indicator */}
        <div className="flex gap-1">
          {([1, 2, 3] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                if (s === 1) setStep(1);
                if (s === 2 && canGoTheme) setStep(2);
                if (s === 3 && passage) setStep(3);
              }}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                step >= s ? 'bg-teal-500' : 'bg-slate-200'
              }`}
              aria-label={`Bước ${s}`}
            />
          ))}
        </div>
        <p className="text-center text-[11px] font-bold text-slate-500">
          {step === 1 && 'B1 · Nhập / chọn từ'}
          {step === 2 && 'B2 · Chủ đề + cấp độ đọc'}
          {step === 3 && 'B3 · Đọc & trả lời'}
        </p>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ── Step 1: words ── */}
        {step === 1 && (
          <Card className="border-teal-100 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">1. Danh sách từ</CardTitle>
              <p className="text-xs text-muted-foreground">
                {PACK_PASSAGE_MIN_WORDS}–{PACK_PASSAGE_MAX_WORDS} từ · mỗi dòng{' '}
                <code className="text-[10px]">word | nghĩa</code> hoặc chọn pack mẫu
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {packs.length > 0 && (
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Pack mẫu
                  </label>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium"
                    value={packId}
                    onChange={(e) => {
                      setPackId(e.target.value);
                      setCustomText('');
                      setPassage(null);
                    }}
                  >
                    {packs.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({p.wordCount} từ · {p.level})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Hoặc dán list riêng
                </label>
                <textarea
                  className="min-h-[120px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-relaxed"
                  placeholder={'recycle | tái chế\npollution | ô nhiễm\nforest | rừng\n...'}
                  value={customText}
                  onChange={(e) => {
                    setCustomText(e.target.value);
                    setPassage(null);
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-xs font-semibold">
                <span
                  className={
                    wordsOk ? 'text-emerald-600' : 'text-amber-600'
                  }
                >
                  {wordCount} từ
                  {!wordsOk &&
                    ` · cần ${PACK_PASSAGE_MIN_WORDS}–${PACK_PASSAGE_MAX_WORDS}`}
                </span>
                {customText.trim() ? (
                  <button
                    type="button"
                    className="text-slate-400 underline"
                    onClick={() => setCustomText('')}
                  >
                    Dùng pack mẫu
                  </button>
                ) : null}
              </div>

              {!customText.trim() && activePack && (
                <div className="flex flex-wrap gap-1.5">
                  {activePack.words.slice(0, 20).map((w) => (
                    <Badge key={w.word} variant="outline" className="text-[10px]">
                      {w.word}
                      {w.translation ? ` · ${w.translation}` : ''}
                    </Badge>
                  ))}
                  {activePack.words.length > 20 && (
                    <Badge variant="secondary" className="text-[10px]">
                      +{activePack.words.length - 20}
                    </Badge>
                  )}
                </div>
              )}

              <Button
                className="h-12 w-full rounded-xl bg-teal-600 font-black hover:bg-teal-700"
                disabled={!canGoTheme}
                onClick={() => {
                  setError(null);
                  setStep(2);
                }}
              >
                Tiếp · Chọn chủ đề
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ── Step 2: theme ── */}
        {step === 2 && (
          <Card className="border-teal-100 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">2. Chủ đề & cấp độ đọc</CardTitle>
              <p className="text-xs text-muted-foreground">
                Chọn <strong>1 chủ đề</strong> bao trùm mọi từ, rồi chọn{' '}
                <strong>cấp độ</strong> (dễ/ngắn → khó/dài). Chỉ Gen khi bấm nút.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs font-semibold text-slate-600">
                {wordCount} từ
                {selectedTheme && (
                  <>
                    {' '}
                    · {selectedTheme.emoji} {selectedTheme.labelVi}
                  </>
                )}
                {selectedLevel && (
                  <>
                    {' '}
                    · {selectedLevel.emoji} {selectedLevel.labelVi} ({selectedLevel.cefr})
                  </>
                )}
              </p>

              <div>
                <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-slate-500">
                  Chủ đề
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {PACK_THEMES.map((t) => {
                    const on = themeId === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setThemeId(t.id);
                          setPassage(null);
                        }}
                        className={`rounded-2xl border px-2.5 py-3 text-left transition-all ${
                          on
                            ? 'border-teal-500 bg-teal-50 shadow-md ring-2 ring-teal-200'
                            : 'border-slate-200 bg-white hover:border-teal-200 hover:bg-teal-50/40'
                        }`}
                      >
                        <span className="text-lg">{t.emoji}</span>
                        <p className="mt-1 text-xs font-black leading-snug text-slate-800">
                          {t.labelVi}
                        </p>
                        <p className="mt-0.5 text-[10px] font-medium text-slate-400">
                          {t.labelEn}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-slate-500">
                  Cấp độ bài đọc
                </p>
                <div className="grid gap-2">
                  {PACK_READING_LEVELS.map((lv) => {
                    const on = readingLevelId === lv.id;
                    return (
                      <button
                        key={lv.id}
                        type="button"
                        onClick={() => {
                          setReadingLevelId(lv.id);
                          setPassage(null);
                        }}
                        className={`rounded-2xl border px-3 py-2.5 text-left transition-all ${
                          on
                            ? 'border-indigo-500 bg-indigo-50 shadow-md ring-2 ring-indigo-200'
                            : 'border-slate-200 bg-white hover:border-indigo-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">{lv.emoji}</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-black text-slate-800">
                              {lv.labelVi}{' '}
                              <span className="font-bold text-indigo-600">{lv.cefr}</span>
                            </p>
                            <p className="text-[11px] font-medium text-slate-500">
                              {lv.minWords}–{lv.maxWords} từ · {lv.questionCount} câu hỏi ·{' '}
                              {lv.hintVi}
                            </p>
                          </div>
                          {on && (
                            <Check className="h-4 w-4 shrink-0 text-indigo-600" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="h-12 flex-1 rounded-xl font-bold"
                  onClick={() => setStep(1)}
                >
                  Quay lại
                </Button>
                <Button
                  className="h-12 flex-[1.4] rounded-xl bg-teal-600 font-black hover:bg-teal-700"
                  disabled={!canGen}
                  onClick={() => void genPassage()}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang Gen AI…
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Gen AI đoạn đọc
                    </>
                  )}
                </Button>
              </div>
              <p className="text-center text-[10px] font-medium text-slate-400">
                Chỉ tốn quota khi bấm Gen · cấp độ cao = đoạn dài/khó hơn
              </p>
            </CardContent>
          </Card>
        )}

        {/* ── Step 3: result ── */}
        {step === 3 && passage && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-teal-600">{passage.themeLabelVi || selectedTheme?.labelVi}</Badge>
              <Badge className="bg-indigo-600">
                {passage.readingLevelLabelVi || selectedLevel?.labelVi} · {passage.level}
              </Badge>
              <Badge variant="outline">{passage.wordCount} words</Badge>
              <Badge
                variant={passage.coverage >= 0.75 ? 'default' : 'destructive'}
              >
                coverage {Math.round(passage.coverage * 100)}%
              </Badge>
            </div>

            <div className="flex gap-2">
              {(
                [
                  ['passage', 'Đọc + hỏi'],
                  ['cloze', 'Điền từ'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setResultTab(id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-black ${
                    resultTab === id
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {resultTab === 'passage' && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{passage.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-[15px] leading-relaxed text-slate-800">
                    {highlightPassage(passage.passage)}
                  </p>
                  {passage.missingWords.length > 0 && (
                    <p className="text-[11px] text-amber-700">
                      Thiếu trong đoạn: {passage.missingWords.join(', ')}
                    </p>
                  )}

                  <div className="space-y-3 border-t pt-3">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                      Câu hỏi
                    </p>
                    {passage.questions.map((q, i) => (
                      <div key={i} className="rounded-xl border bg-slate-50/80 p-3">
                        <p className="text-sm font-semibold text-slate-800">
                          {i + 1}. {q.q}
                        </p>
                        <div className="mt-2 grid gap-1.5">
                          {q.options.map((opt) => {
                            const sel = qAnswers[i] === opt;
                            const show = qRevealed;
                            const correct = opt === q.answer;
                            return (
                              <button
                                key={opt}
                                type="button"
                                disabled={qRevealed}
                                onClick={() =>
                                  setQAnswers((prev) => ({ ...prev, [i]: opt }))
                                }
                                className={`rounded-lg border px-3 py-2 text-left text-sm ${
                                  show && correct
                                    ? 'border-emerald-400 bg-emerald-50'
                                    : show && sel && !correct
                                      ? 'border-red-300 bg-red-50'
                                      : sel
                                        ? 'border-teal-400 bg-teal-50'
                                        : 'border-slate-200 bg-white'
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                        {qRevealed && q.explain && (
                          <p className="mt-2 text-xs text-slate-500">{q.explain}</p>
                        )}
                      </div>
                    ))}
                    <div className="flex gap-2">
                      {!qRevealed ? (
                        <Button
                          className="flex-1 rounded-xl font-bold"
                          onClick={() => setQRevealed(true)}
                        >
                          Chấm điểm
                        </Button>
                      ) : (
                        <p className="flex flex-1 items-center gap-2 text-sm font-bold text-teal-700">
                          <Check className="h-4 w-4" />
                          {qScore?.ok}/{qScore?.total} đúng
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {resultTab === 'cloze' && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Điền từ vào đoạn</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-[15px] leading-relaxed">
                    {renderClozeText(
                      passage.cloze.text,
                      passage.cloze.blanks,
                      clozeAnswers,
                      (id, value) =>
                        setClozeAnswers((prev) => ({ ...prev, [id]: value })),
                      clozeRevealed,
                    )}
                  </p>
                  {!clozeRevealed ? (
                    <Button
                      className="w-full rounded-xl font-bold"
                      onClick={() => setClozeRevealed(true)}
                    >
                      Chấm cloze
                    </Button>
                  ) : (
                    <p className="text-sm font-bold text-teal-700">
                      {clozeScore?.ok}/{clozeScore?.total} chỗ đúng
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 rounded-xl font-bold"
                onClick={() => {
                  setStep(2);
                  setPassage(null);
                }}
              >
                Đổi theme / Gen lại
              </Button>
              <Button
                variant="outline"
                className="flex-1 rounded-xl font-bold"
                onClick={() => {
                  setStep(1);
                  setPassage(null);
                  setThemeId(null);
                }}
              >
                <X className="mr-1 h-4 w-4" />
                Gói khác
              </Button>
            </div>
          </div>
        )}

        {loading && step === 2 && (
          <div className="flex items-center justify-center gap-2 py-8 text-sm font-semibold text-teal-700">
            <Loader2 className="h-5 w-5 animate-spin" />
            AI đang viết đoạn theo chủ đề…
          </div>
        )}
      </div>
    </StudentShell>
  );
}

export default function PackReadingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang tải…
        </div>
      }
    >
      <PackReadingInner />
    </Suspense>
  );
}
