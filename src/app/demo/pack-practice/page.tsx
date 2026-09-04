'use client';

/**
 * DEMO local — đoạn văn ôn pack + mindmap.
 * URL: /demo/pack-practice
 * Product: /practice/pack-reading (wizard: từ → chủ đề → Gen AI).
 */

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, BookOpen, Network, ImageIcon, RotateCcw, Check, X } from 'lucide-react';

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

interface MindMapData {
  theme: string;
  description?: string;
  markdown: string;
  unused?: string[];
}

type Tab = 'passage' | 'cloze' | 'mindmap';

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
  revealed: boolean
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
      <span key={key++} className="inline-flex flex-col align-middle mx-0.5 my-1">
        <select
          className={`rounded border px-2 py-1 text-sm min-w-[7rem] ${
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
      </span>
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) {
    nodes.push(<span key={key++}>{text.slice(last)}</span>);
  }
  return nodes;
}

export default function PackPracticeDemoPage() {
  const [packs, setPacks] = useState<DemoPack[]>([]);
  const [packId, setPackId] = useState<string>('');
  const [customText, setCustomText] = useState('');
  const [tab, setTab] = useState<Tab>('passage');

  const [passage, setPassage] = useState<PassageData | null>(null);
  const [passageLoading, setPassageLoading] = useState(false);
  const [passageError, setPassageError] = useState<string | null>(null);

  const [qAnswers, setQAnswers] = useState<Record<number, string>>({});
  const [qRevealed, setQRevealed] = useState(false);

  const [clozeAnswers, setClozeAnswers] = useState<Record<number, string>>({});
  const [clozeRevealed, setClozeRevealed] = useState(false);

  const [mindmap, setMindmap] = useState<MindMapData | null>(null);
  const [mindmapLoading, setMindmapLoading] = useState(false);
  const [mindmapError, setMindmapError] = useState<string | null>(null);

  const [nlmUrl, setNlmUrl] = useState<string | null>(null);
  const [nlmLoading, setNlmLoading] = useState(false);
  const [nlmError, setNlmError] = useState<string | null>(null);
  const [nlmMeta, setNlmMeta] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/demo/pack-passage')
      .then((r) => r.json())
      .then((j) => {
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
    [packs, packId]
  );

  const wordPayload = useMemo(() => {
    if (customText.trim()) {
      return {
        text: customText,
        title: activePack?.title ?? 'Custom pack',
        level: activePack?.level ?? 'A2',
      };
    }
    return {
      packId: packId || undefined,
      words: activePack?.words,
      title: activePack?.title,
      level: activePack?.level,
    };
  }, [customText, packId, activePack]);

  const mindmapWords = useMemo(() => {
    if (customText.trim()) {
      return customText
        .split(/[\n,;]+/)
        .map((l) => l.trim())
        .filter(Boolean)
        .map((line) => {
          const parts = line.split(/\s*[|–—]\s+/).map((s) => s.trim());
          return { word: parts[0], translation: parts[1] };
        });
    }
    return (activePack?.words ?? []).map((w) => ({
      word: w.word,
      translation: w.translation,
      pos: w.pos,
    }));
  }, [customText, activePack]);

  const genPassage = useCallback(async () => {
    setPassageLoading(true);
    setPassageError(null);
    setPassage(null);
    setQAnswers({});
    setQRevealed(false);
    setClozeAnswers({});
    setClozeRevealed(false);
    setTab('passage');
    try {
      // Demo mặc định theme môi trường — product bắt user chọn tại /practice/pack-reading
      const res = await fetch('/api/practice/pack-passage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...wordPayload,
          themeId: 'environment',
          readingLevelId: 'elementary',
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Gen failed');
      setPassage(json.data as PassageData);
    } catch (e) {
      setPassageError(e instanceof Error ? e.message : String(e));
    } finally {
      setPassageLoading(false);
    }
  }, [wordPayload]);

  const genMindmap = useCallback(async () => {
    setMindmapLoading(true);
    setMindmapError(null);
    setMindmap(null);
    setTab('mindmap');
    try {
      if (mindmapWords.length < 5) {
        throw new Error('Cần ≥5 từ cho mindmap');
      }
      // mindmap API yêu cầu ≥5, khuyến nghị nhiều — demo pack 12 từ OK
      const res = await fetch('/api/mindmap/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          words: mindmapWords,
          title: activePack?.title ?? 'Demo unit',
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Mindmap failed');
      setMindmap(json.data as MindMapData);
    } catch (e) {
      setMindmapError(e instanceof Error ? e.message : String(e));
    } finally {
      setMindmapLoading(false);
    }
  }, [mindmapWords, activePack]);

  const genNlm = useCallback(async () => {
    setNlmLoading(true);
    setNlmError(null);
    setNlmUrl(null);
    setNlmMeta(null);
    setTab('mindmap');
    try {
      // NLM infographic target ~35–45 từ; demo pack 12 từ → pad bằng lặp sense gần (hoặc báo lỗi API)
      // Gửi list hiện có; API prepareInfographicWords sẽ validate min
      const words = [...mindmapWords];
      if (words.length < 35) {
        // pad nhẹ để demo: nhân bản biến thể không trùng word key — API dedupe → có thể fail min
        // tốt hơn: ghép 3 pack demo
        const extra = packs.flatMap((p) =>
          p.words.map((w) => ({ word: w.word, translation: w.translation, pos: w.pos }))
        );
        const seen = new Set(words.map((w) => w.word.toLowerCase()));
        for (const w of extra) {
          if (!seen.has(w.word.toLowerCase())) {
            words.push(w);
            seen.add(w.word.toLowerCase());
          }
          if (words.length >= 40) break;
        }
      }
      if (words.length < 20) {
        throw new Error(
          `NLM infographic cần ~35–45 từ (hiện ${words.length}). Chọn pack + dán thêm list, hoặc dùng mindmap JSON.`
        );
      }

      const res = await fetch('/api/mindmap/nlm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          words,
          title: activePack?.title ?? 'Demo vocab infographic',
          orientation: 'landscape',
          detail: 'detailed',
          language: 'vi',
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'NLM failed');
      const url =
        (json.data?.publicUrl as string) ||
        (json.data?.imageUrl as string) ||
        (json.data?.image_url as string) ||
        null;
      setNlmUrl(url);
      setNlmMeta(
        [
          json.data?.notebookUrl ? `notebook: ${json.data.notebookUrl}` : null,
          json.data?.artifactId ? `artifact: ${json.data.artifactId}` : null,
          `words: ${words.length}`,
        ]
          .filter(Boolean)
          .join(' · ')
      );
      if (!url) {
        setNlmError(
          'NLM xong nhưng chưa tải được PNG local. Check nlm login / download script. Meta: ' +
            JSON.stringify(json.data).slice(0, 200)
        );
      }
    } catch (e) {
      setNlmError(e instanceof Error ? e.message : String(e));
    } finally {
      setNlmLoading(false);
    }
  }, [mindmapWords, activePack, packs]);

  const qScore = useMemo(() => {
    if (!passage || !qRevealed) return null;
    let ok = 0;
    passage.questions.forEach((q, i) => {
      if ((qAnswers[i] || '').trim() === q.answer.trim()) ok += 1;
    });
    return { ok, total: passage.questions.length };
  }, [passage, qAnswers, qRevealed]);

  const clozeScore = useMemo(() => {
    if (!passage || !clozeRevealed) return null;
    let ok = 0;
    passage.cloze.blanks.forEach((b) => {
      if ((clozeAnswers[b.id] || '').toLowerCase() === b.answer.toLowerCase()) ok += 1;
    });
    return { ok, total: passage.cloze.blanks.length };
  }, [passage, clozeAnswers, clozeRevealed]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge variant="outline" className="mb-2">
              DEMO · không deploy
            </Badge>
            <h1 className="text-2xl font-bold tracking-tight">Pack practice demo</h1>
            <p className="text-sm text-muted-foreground mt-1">
              (1) Đoạn văn ôn từ pack · (2) Mindmap JSON · (3) Ảnh NLM infographic (chậm, cần{' '}
              <code className="text-xs">nlm login</code>)
            </p>
          </div>
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
          >
            ← Home
          </Link>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Chọn pack / dán từ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {packs.map((p) => (
                <Button
                  key={p.id}
                  size="sm"
                  variant={packId === p.id && !customText.trim() ? 'default' : 'outline'}
                  onClick={() => {
                    setPackId(p.id);
                    setCustomText('');
                  }}
                >
                  {p.title}
                  <span className="ml-1 opacity-70">({p.wordCount})</span>
                </Button>
              ))}
            </div>

            {activePack && !customText.trim() && (
              <div className="flex flex-wrap gap-1.5">
                {activePack.words.map((w) => (
                  <Badge key={w.word} variant="secondary" className="font-normal">
                    {w.word}
                    {w.translation ? (
                      <span className="ml-1 text-muted-foreground">· {w.translation}</span>
                    ) : null}
                  </Badge>
                ))}
              </div>
            )}

            <div>
              <label className="text-xs text-muted-foreground">
                Hoặc dán list (mỗi dòng: <code>word | nghĩa</code>)
              </label>
              <textarea
                className="mt-1 w-full min-h-[88px] rounded-md border bg-background px-3 py-2 text-sm"
                placeholder={'chore | việc vặt\nresponsibility | trách nhiệm\n...'}
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={genPassage} disabled={passageLoading || nlmLoading || mindmapLoading}>
                {passageLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <BookOpen className="mr-2 h-4 w-4" />
                )}
                Sinh đoạn văn + quiz
              </Button>
              <Button
                variant="secondary"
                onClick={genMindmap}
                disabled={mindmapLoading || passageLoading || nlmLoading}
              >
                {mindmapLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Network className="mr-2 h-4 w-4" />
                )}
                Mindmap JSON
              </Button>
              <Button
                variant="outline"
                onClick={genNlm}
                disabled={nlmLoading || passageLoading || mindmapLoading}
                title="Cần nlm login trên máy; ~2–4 phút"
              >
                {nlmLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ImageIcon className="mr-2 h-4 w-4" />
                )}
                Ảnh NLM (~3p)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex gap-2 border-b pb-2">
          {(
            [
              ['passage', 'Đọc hiểu'],
              ['cloze', 'Cloze'],
              ['mindmap', 'Sơ đồ'],
            ] as const
          ).map(([id, label]) => (
            <Button
              key={id}
              size="sm"
              variant={tab === id ? 'default' : 'ghost'}
              onClick={() => setTab(id)}
            >
              {label}
            </Button>
          ))}
        </div>

        {tab === 'passage' && (
          <div className="space-y-4">
            {passageError && (
              <Card className="border-red-300 bg-red-50/50 dark:bg-red-950/20">
                <CardContent className="pt-4 text-sm text-red-700 dark:text-red-300">
                  {passageError}
                </CardContent>
              </Card>
            )}
            {passageLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
                <Loader2 className="h-5 w-5 animate-spin" />
                Đang sinh đoạn (Zhipu/Groq, có thể 15–60s)…
              </div>
            )}
            {passage && (
              <>
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-lg">{passage.title}</CardTitle>
                      <Badge>{passage.level}</Badge>
                      <Badge variant="outline">{passage.wordCount} words</Badge>
                      <Badge
                        variant={passage.coverage >= 0.75 ? 'default' : 'destructive'}
                      >
                        coverage {Math.round(passage.coverage * 100)}%
                      </Badge>
                      <Badge variant="outline">try {passage.meta.attempts}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="leading-relaxed text-[15px] whitespace-pre-wrap">
                      {highlightPassage(passage.passage)}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      <span className="text-xs text-muted-foreground mr-1 self-center">
                        Used:
                      </span>
                      {passage.usedWords.map((w) => (
                        <Badge key={w} variant="secondary" className="text-xs">
                          {w}
                        </Badge>
                      ))}
                      {passage.missingWords.length > 0 && (
                        <>
                          <span className="text-xs text-muted-foreground mx-1 self-center">
                            Missing:
                          </span>
                          {passage.missingWords.map((w) => (
                            <Badge key={w} variant="destructive" className="text-xs">
                              {w}
                            </Badge>
                          ))}
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Câu hỏi đọc hiểu</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {passage.questions.map((q, i) => (
                      <div key={i} className="space-y-2">
                        <p className="text-sm font-medium">
                          {i + 1}. {q.q}
                        </p>
                        <div className="grid gap-1.5">
                          {q.options.map((opt) => {
                            const selected = qAnswers[i] === opt;
                            let cls =
                              'justify-start h-auto py-2 px-3 text-left font-normal text-sm';
                            if (qRevealed) {
                              if (opt === q.answer) cls += ' border-emerald-500 bg-emerald-50';
                              else if (selected) cls += ' border-red-400 bg-red-50';
                            } else if (selected) {
                              cls += ' border-primary';
                            }
                            return (
                              <Button
                                key={opt}
                                variant="outline"
                                className={cls}
                                disabled={qRevealed}
                                onClick={() =>
                                  setQAnswers((prev) => ({ ...prev, [i]: opt }))
                                }
                              >
                                {qRevealed && opt === q.answer && (
                                  <Check className="mr-2 h-3.5 w-3.5 text-emerald-600" />
                                )}
                                {qRevealed && selected && opt !== q.answer && (
                                  <X className="mr-2 h-3.5 w-3.5 text-red-500" />
                                )}
                                {opt}
                              </Button>
                            );
                          })}
                        </div>
                        {qRevealed && q.explain && (
                          <p className="text-xs text-muted-foreground pl-1">{q.explain}</p>
                        )}
                      </div>
                    ))}
                    <div className="flex items-center gap-3 pt-2">
                      {!qRevealed ? (
                        <Button onClick={() => setQRevealed(true)}>Chấm điểm</Button>
                      ) : (
                        <>
                          <Badge variant="secondary">
                            {qScore?.ok}/{qScore?.total} đúng
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setQAnswers({});
                              setQRevealed(false);
                            }}
                          >
                            <RotateCcw className="mr-1 h-3.5 w-3.5" />
                            Làm lại
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
            {!passage && !passageLoading && !passageError && (
              <p className="text-sm text-muted-foreground text-center py-10">
                Chọn pack → bấm <strong>Sinh đoạn văn + quiz</strong>
              </p>
            )}
          </div>
        )}

        {tab === 'cloze' && (
          <div className="space-y-4">
            {!passage && (
              <p className="text-sm text-muted-foreground text-center py-10">
                Cần sinh đoạn văn trước (tab Đọc hiểu).
              </p>
            )}
            {passage && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Điền từ (cloze)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="leading-relaxed text-[15px]">
                    {renderClozeText(
                      passage.cloze.text,
                      passage.cloze.blanks,
                      clozeAnswers,
                      (id, value) =>
                        setClozeAnswers((prev) => ({ ...prev, [id]: value })),
                      clozeRevealed
                    )}
                  </p>
                  <div className="flex items-center gap-3">
                    {!clozeRevealed ? (
                      <Button onClick={() => setClozeRevealed(true)}>Chấm cloze</Button>
                    ) : (
                      <>
                        <Badge variant="secondary">
                          {clozeScore?.ok}/{clozeScore?.total} đúng
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setClozeAnswers({});
                            setClozeRevealed(false);
                          }}
                        >
                          <RotateCcw className="mr-1 h-3.5 w-3.5" />
                          Làm lại
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {tab === 'mindmap' && (
          <div className="space-y-4">
            {mindmapError && (
              <Card className="border-red-300 bg-red-50/50">
                <CardContent className="pt-4 text-sm text-red-700">{mindmapError}</CardContent>
              </Card>
            )}
            {nlmError && (
              <Card className="border-amber-300 bg-amber-50/50">
                <CardContent className="pt-4 text-sm text-amber-900">
                  <strong>NLM:</strong> {nlmError}
                </CardContent>
              </Card>
            )}
            {(mindmapLoading || nlmLoading) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
                <Loader2 className="h-5 w-5 animate-spin" />
                {nlmLoading
                  ? 'NotebookLM đang vẽ infographic (2–4 phút, đừng tắt)…'
                  : 'Đang gom mindmap JSON…'}
              </div>
            )}
            {mindmap && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{mindmap.theme}</CardTitle>
                  {mindmap.description && (
                    <p className="text-sm text-muted-foreground">{mindmap.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed bg-muted/40 rounded-md p-4 overflow-x-auto">
                    {mindmap.markdown}
                  </pre>
                  {mindmap.unused && mindmap.unused.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Unused: {mindmap.unused.join(', ')}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
            {nlmUrl && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Infographic NLM</CardTitle>
                  {nlmMeta && (
                    <p className="text-xs text-muted-foreground break-all">{nlmMeta}</p>
                  )}
                </CardHeader>
                <CardContent>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={nlmUrl}
                    alt="NLM infographic"
                    className="w-full rounded-md border"
                  />
                  <a
                    href={nlmUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary underline mt-2 inline-block"
                  >
                    Mở ảnh full
                  </a>
                </CardContent>
              </Card>
            )}
            {!mindmap && !nlmUrl && !mindmapLoading && !nlmLoading && !mindmapError && !nlmError && (
              <p className="text-sm text-muted-foreground text-center py-10">
                Bấm <strong>Mindmap JSON</strong> (nhanh) hoặc <strong>Ảnh NLM</strong> (đẹp, chậm).
              </p>
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center pb-8">
          Local only · <code>/demo/pack-practice</code> · API{' '}
          <code>/api/demo/pack-passage</code> · mindmap tái dùng{' '}
          <code>/api/mindmap/*</code>
        </p>
      </div>
    </div>
  );
}
