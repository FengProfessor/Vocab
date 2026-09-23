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
    <StudentShell title="Sân chơi tiếng Anh" requireAuth={false}>
      <div className="mx-auto max-w-5xl px-1 pb-24 pt-3 text-slate-900 sm:px-4 dark:text-slate-100">
        {storageError && <p role="status" className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Trình duyệt chưa lưu được kỷ lục. Bạn vẫn có thể tiếp tục chơi.</p>}
        {session ? <EnglishGameSession mode={session.mode} words={session.words} onExit={() => setSession(null)} onRecord={recordScore} /> : <>
          <Link href="/practice" className="mb-5 inline-flex items-center gap-1 py-2 text-sm font-semibold text-slate-500 hover:text-indigo-600"><ChevronLeft size={16} /> Sử dụng từ & Luyện tập</Link>
          <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-6 text-white shadow-lg shadow-indigo-200/30 sm:p-9">
            <div aria-hidden="true" className="absolute -right-8 -top-12 h-52 w-52 rounded-full border-[30px] border-white/10" />
            <div className="relative max-w-2xl"><p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold"><Gamepad2 size={16} /> LINGOPRO PLAY · 6 MINI GAME</p><h1 className="mt-5 text-3xl font-black leading-tight sm:text-4xl">Chơi một chút.<br />Nhớ thêm thật nhiều.</h1><p className="mt-4 max-w-lg text-sm leading-relaxed text-indigo-100 sm:text-base">Biến từ vựng và ngữ pháp thành những thử thách nhỏ. Chọn game yêu thích, nối combo và phá kỷ lục của chính mình.</p><div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold">{['🧩 3 game từ vựng', '🛠️ 3 game ngữ pháp', '💡 Sai có lời giải'].map((label) => <span key={label} className="rounded-full bg-white/15 px-3 py-2">{label}</span>)}</div></div>
          </section>

          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-700 dark:bg-slate-900" aria-labelledby="word-source-title">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 id="word-source-title" className="text-sm font-black">Bộ từ cho 3 game từ vựng</h2><span className="text-xs text-slate-500">Ngữ pháp dùng bộ câu nền tảng riêng</span></div>
            <div className="flex flex-wrap gap-2">{([...Object.keys(GAME_TOPICS), 'saved'] as Source[]).map((key) => <button key={key} onClick={() => setSource(key)} aria-pressed={source === key} className={`min-h-11 rounded-xl border px-4 py-2 text-sm font-bold transition ${source === key ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 text-slate-600 hover:border-indigo-300 dark:border-slate-700 dark:text-slate-300'}`}>{key === 'saved' ? '📚 Từ đã lưu' : `${GAME_TOPICS[key].emoji} ${GAME_TOPICS[key].title}`}</button>)}</div>
            {source === 'saved' ? <div className="mt-3 text-sm text-slate-500" role="status">{!userId ? <Link href="/auth" className="font-semibold text-indigo-600 underline">Đăng nhập để chơi với từ của bạn</Link> : loading ? <span className="inline-flex items-center gap-2"><Loader2 className="animate-spin" size={16} />Đang tải từ của bạn…</span> : loadError ? <span>{loadError} <button onClick={() => setReload((value) => value + 1)} className="px-2 py-2 font-bold text-indigo-600 underline">Thử lại</button></span> : <span>{savedWords.length} từ hợp lệ từ tối đa 50 từ lưu gần nhất.{savedWords.length < 4 ? ' Cần ít nhất 4 từ khác nghĩa để đua từ; chọn bộ chủ đề để chơi ngay.' : ''}</span>}</div> : <p className="mt-3 text-xs text-slate-500">{pool.length} từ · Xáo trộn mỗi ván · Có nghĩa và ví dụ</p>}
          </section>

          <div className="mb-4 mt-7 flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-black">Hôm nay chơi gì?</h2><div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800" aria-label="Lọc game">{[['all', 'Tất cả'], ['vocab', 'Từ vựng'], ['grammar', 'Ngữ pháp']].map(([id, label]) => <button key={id} onClick={() => setCategory(id)} aria-pressed={category === id} className={`min-h-10 rounded-lg px-3 text-sm font-semibold ${category === id ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-700 dark:text-indigo-200' : 'text-slate-500 dark:text-slate-400'}`}>{label}</button>)}</div></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{GAME_MODES.filter((game) => category === 'all' || game.category === category).map((game) => {
            const available = playableWords(game.id, pool);
            const minimum = game.id === 'sprint' ? 4 : game.id === 'memory' ? 2 : 1;
            const disabled = game.category === 'vocab' && ((source === 'saved' && (loading || Boolean(loadError))) || available.length < minimum);
            return <article key={game.id} className="flex flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-900"><div className="flex items-start justify-between"><div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br text-3xl shadow-sm ${game.color}`}>{game.emoji}</div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300">{game.label}</span></div><h3 className="mt-5 text-lg font-black">{game.title}</h3><p className="mt-2 flex-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{game.description}</p><p className="mb-4 mt-4 flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400"><Trophy size={14} /> Kỷ lục trên máy: {records[game.id] ?? 0} điểm</p><button disabled={disabled} onClick={() => setSession({ mode: game.id, words: available })} className="flex min-h-12 items-center justify-between rounded-xl bg-indigo-50 px-4 py-3 text-sm font-black text-indigo-700 transition hover:bg-indigo-600 hover:text-white disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:bg-indigo-950/50 dark:text-indigo-200 dark:disabled:bg-slate-800" aria-label={`Chơi ${game.title}`}>{disabled ? loading ? 'Đang tải từ…' : `Cần ${minimum} từ phù hợp` : 'Chơi ngay'}<ArrowRight size={18} /></button>{disabled && game.id === 'scramble' && !loading && <p className="mt-2 text-xs text-slate-500">Dùng từ đơn 3–14 chữ cái, không có dấu cách.</p>}</article>;
          })}</div>
          <p className="mt-6 text-center text-xs leading-relaxed text-slate-500">Kỷ lục lưu trên trình duyệt này. Điểm game tách riêng với XP và lịch ôn.<br />Duy trì trí nhớ lâu hơn với <Link href="/review" className="font-bold text-indigo-600 underline underline-offset-2">Ôn tập ngắt quãng</Link>.</p>
        </>}
      </div>
    </StudentShell>
  );
}
