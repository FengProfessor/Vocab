'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, Gamepad2, Loader2, Trophy } from 'lucide-react';
import { StudentShell } from '@/components/student/StudentShell';
import { useStudentContext } from '@/components/student/StudentProvider';
import { EnglishGameSession } from '@/components/games/EnglishGameSession';
import { GAME_MODES, GAME_TOPICS, type GameMode, type GameTopic, type GameWord } from '@/data/english-games';
import { cleanGameWords, parseGameRecords, playableWords } from '@/lib/english-games';
import { authFetch } from '@/lib/auth-fetch';

type Source = GameTopic | 'saved';

function subscribeRecords(listener: () => void) {
  window.addEventListener('storage', listener);
  window.addEventListener('lingopro-game-record', listener);
  return () => { window.removeEventListener('storage', listener); window.removeEventListener('lingopro-game-record', listener); };
}
const serverRecords = () => null;

export default function EnglishGamesPage() {
  const student = useStudentContext();
  const [category, setCategory] = useState('all');
  const [source, setSource] = useState<Source>('daily');
  const [wordLoad, setWordLoad] = useState<{ key: string; words: GameWord[]; error: string } | null>(null);
  const [reload, setReload] = useState(0);
  const [session, setSession] = useState<{ mode: GameMode; words: GameWord[] } | null>(null);
  const [storageError, setStorageError] = useState(false);
  const userId = student?.session?.user.id;
  const classroomId = student?.wordSummary.classroomId;
  const recordKey = `lingopro:english-games:v1:${userId ?? 'guest'}`;
  const readRecords = useCallback(() => {
    try { return localStorage.getItem(recordKey); } catch { return null; }
  }, [recordKey]);
  const records = parseGameRecords(useSyncExternalStore(subscribeRecords, readRecords, serverRecords));
  const loadKey = `${userId}:${classroomId}:${reload}`;
  const savedWords = wordLoad?.key === loadKey ? wordLoad.words : [];
  const loadError = wordLoad?.key === loadKey ? wordLoad.error : '';
  const loading = source === 'saved' && Boolean(userId) && wordLoad?.key !== loadKey;

  useEffect(() => {
    if (source !== 'saved' || !userId) return;
    const controller = new AbortController();
    const query = new URLSearchParams({ limit: '50', noCount: '1' });
    if (classroomId) query.set('classroomId', classroomId);
    authFetch(`/api/words?${query}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Không tải được bộ từ');
        const payload: unknown = await response.json();
        if (!payload || typeof payload !== 'object' || !('success' in payload) || !payload.success || !('data' in payload)) throw new Error('Dữ liệu chưa sẵn sàng');
        if (!controller.signal.aborted) setWordLoad({ key: loadKey, words: cleanGameWords(payload.data), error: '' });
      })
      .catch(() => { if (!controller.signal.aborted) setWordLoad({ key: loadKey, words: [], error: 'Chưa tải được từ đã lưu. Thử lại hoặc chọn bộ từ chủ đề nhé.' }); });
    return () => controller.abort();
  }, [source, userId, classroomId, loadKey]);

  const recordScore = useCallback((mode: GameMode, score: number) => {
    try {
      const current = parseGameRecords(localStorage.getItem(recordKey));
      const next = { ...current, [mode]: Math.max(current[mode] ?? 0, score) };
      localStorage.setItem(recordKey, JSON.stringify(next));
      window.dispatchEvent(new Event('lingopro-game-record'));
    } catch { setStorageError(true); }
  }, [recordKey]);

  const pool = source === 'saved' ? userId ? savedWords : [] : GAME_TOPICS[source].words;

  return (
    <StudentShell title="Đấu trường Phản xạ Học thuật" requireAuth={false}>
      <div className="mx-auto max-w-5xl px-1 pb-24 pt-3 text-slate-900 sm:px-4 dark:text-slate-100">
        {storageError && <p role="status" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-200">Trình duyệt chưa lưu được kỷ lục. Bạn vẫn có thể tiếp tục rèn luyện.</p>}
        {session ? <EnglishGameSession mode={session.mode} words={session.words} onExit={() => setSession(null)} onRecord={recordScore} /> : <>
          <Link href="/practice" className="mb-4 inline-flex items-center gap-1.5 py-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition"><ChevronLeft size={16} /> Quay lại Sử dụng từ & Luyện tập</Link>

          {/* Hero: Technical Minimalist Speed Training Facility */}
          <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-6 text-white sm:p-8">
            <div className="relative max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-md border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-xs font-mono font-semibold text-indigo-300">
                <Gamepad2 size={14} /> SPEED DRILLS · PHẢN XẠ ĐỀ THI CHUẨN HÓA
              </div>
              <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl text-white">
                Rèn Phản Xạ Dưới 2 Giây.<br />Bứt Phá Điểm Số Part 5 & Part 7.
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
                Phòng huấn luyện tốc độ cao dành cho thí sinh TOEIC (600–990), VSTEP (B2–C1) và IELTS Academic. Chuyển hóa Collocation, Paraphrasing và Bẫy ngữ pháp kinh điển thành phản xạ vô điều kiện dưới áp lực phòng thi.
              </p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs font-mono font-medium">
                {['🎯 Target 650–900+ TOEIC', '📐 Săn bẫy ETS Part 5', '🔗 Collocations & AWL', '⚡ Rèn tốc độ < 2s/câu'].map((label) => (
                  <span key={label} className="rounded-md border border-slate-700 bg-slate-900/90 px-2.5 py-1.5 text-slate-300">{label}</span>
                ))}
              </div>
            </div>
          </section>

          {/* Word Corpus Selector */}
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900" aria-labelledby="word-source-title">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 id="word-source-title" className="text-sm font-bold text-slate-900 dark:text-slate-100">Kho Ngữ Liệu Luyện Phản Xạ</h2>
              <span className="text-xs font-mono text-slate-500">Phân hệ Ngữ pháp sử dụng ngân hàng bẫy đề thi độc lập</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {([...Object.keys(GAME_TOPICS), 'saved'] as Source[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setSource(key)}
                  aria-pressed={source === key}
                  className={`min-h-[44px] rounded-xl border px-3.5 py-2 text-xs sm:text-sm font-semibold transition ${
                    source === key
                      ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  {key === 'saved' ? '📚 Kho từ cá nhân đã lưu' : `${GAME_TOPICS[key].emoji} ${GAME_TOPICS[key].title}`}
                </button>
              ))}
            </div>
            {source === 'saved' ? (
              <div className="mt-3 text-sm text-slate-500" role="status">
                {!userId ? (
                  <Link href="/auth" className="font-semibold text-indigo-600 underline">Đăng nhập để luyện với kho từ FSRS cá nhân</Link>
                ) : loading ? (
                  <span className="inline-flex items-center gap-2"><Loader2 className="animate-spin" size={16} />Đang tải dữ liệu từ vựng…</span>
                ) : loadError ? (
                  <span>{loadError} <button onClick={() => setReload((value) => value + 1)} className="px-2 py-2 font-bold text-indigo-600 underline">Thử lại</button></span>
                ) : (
                  <span>Đã tải {savedWords.length} thuật ngữ hợp lệ từ kho cá nhân.{savedWords.length < 4 ? ' Cần tối thiểu 4 từ để bắt đầu đường đua phản xạ; hãy chọn kho ngữ liệu đề thi chuẩn hóa bên trên.' : ''}</span>
                )}
              </div>
            ) : (
              <p className="mt-3 text-xs font-mono text-slate-500">{pool.length} thuật ngữ & collocations · Đảo ngẫu nhiên mỗi lượt · Đầy đủ ngữ cảnh đề thi</p>
            )}
          </section>

          {/* Mode Category Filter */}
          <div className="mb-4 mt-7 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Chọn Chế Độ Huấn Luyện</h2>
            <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-800" aria-label="Lọc chế độ">
              {[['all', 'Tất cả'], ['vocab', 'Từ vựng & Cụm từ'], ['grammar', 'Bẫy Ngữ pháp & Cấu trúc']].map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setCategory(id)}
                  aria-pressed={category === id}
                  className={`min-h-[38px] rounded-lg px-3 text-xs sm:text-sm font-semibold transition ${
                    category === id
                      ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-700 dark:text-indigo-200'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Drill Mode Cards Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {GAME_MODES.filter((game) => category === 'all' || game.category === category).map((game) => {
              const available = playableWords(game.id, pool);
              const minimum = game.id === 'sprint' ? 4 : game.id === 'memory' ? 2 : 1;
              const disabled = game.category === 'vocab' && ((source === 'saved' && (loading || Boolean(loadError))) || available.length < minimum);
              return (
                <article
                  key={game.id}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-2xl shadow-sm ${game.color}`}>
                        {game.emoji}
                      </div>
                      <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-mono font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {game.label}
                      </span>
                    </div>
                    <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-slate-100">{game.title}</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{game.description}</p>
                  </div>

                  <div className="mt-5">
                    <p className="mb-3 flex items-center gap-1.5 text-xs font-mono font-medium text-amber-600 dark:text-amber-400">
                      <Trophy size={13} /> Kỷ lục: <span className="font-bold tabular-nums">{records[game.id] ?? 0}</span> pts
                    </p>
                    <button
                      disabled={disabled}
                      onClick={() => setSession({ mode: game.id, words: available })}
                      className="flex min-h-[44px] w-full items-center justify-between rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:bg-indigo-600 dark:text-white dark:hover:bg-indigo-500 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
                      aria-label={`Bắt đầu rèn luyện ${game.title}`}
                    >
                      <span>{disabled ? (loading ? 'Đang nạp từ…' : `Cần tối thiểu ${minimum} thuật ngữ`) : 'Bắt đầu huấn luyện'}</span>
                      <ArrowRight size={16} />
                    </button>
                    {disabled && game.id === 'scramble' && !loading && (
                      <p className="mt-2 text-[11px] text-slate-500">Thuật ngữ yêu cầu 3–14 ký tự không dấu cách.</p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          <p className="mt-8 text-center text-xs font-mono text-slate-500">
            Dữ liệu huấn luyện phản xạ tốc độ cao · Tối ưu cho kỳ thi TOEIC, VSTEP & IELTS.<br />
            Duy trì trí nhớ dài hạn song song với thuật toán <Link href="/review" className="font-semibold text-indigo-600 underline underline-offset-2 hover:text-indigo-700">Ôn tập ngắt quãng (FSRS)</Link>.
          </p>
        </>}
      </div>
    </StudentShell>
  );
}
