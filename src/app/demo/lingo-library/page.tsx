'use client';

/**
 * DEMO Thư viện chung — dozens people, pair, scenario talk, study + music.
 * /demo/lingo-library
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  LIBRARY_MAP,
  HERO_SHEET,
  SCENARIOS,
  STUDY_MUSIC,
  createLibraryCrowd,
  pickRandomPartner,
  randomBubble,
  statusLabel,
  type LibraryPhase,
  type SeatStudent,
  type PartnerInfo,
  type TalkScenario,
} from '@/lib/lingo-library';
import { loadProgress, saveProgress, type TownProgress } from '@/lib/lingo-town';
import {
  consumeActivityReturn,
  getActivity,
} from '@/lib/lingo-town-activities';
import { ActivityLauncher } from '@/components/lingo-town/ActivityLauncher';
import { InGameActivityFrame } from '@/components/lingo-town/InGameActivityFrame';
import type { LingoActivity } from '@/lib/lingo-town-activities';

const VIEW_W = 960;
const VIEW_H = 540;

type Bubble = { id: string; nx: number; ny: number; text: string; until: number };

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => rej(new Error(src));
    img.src = src;
  });
}

export default function LingoLibraryPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapRef = useRef<HTMLImageElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const crowdRef = useRef<SeatStudent[]>([]);
  const bubblesRef = useRef<Bubble[]>([]);
  const phaseRef = useRef<LibraryPhase>('lobby');
  const partnerRef = useRef<PartnerInfo | null>(null);
  const raf = useRef(0);
  const lastTs = useRef(0);
  const matchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState<TownProgress | null>(null);
  const [phase, setPhase] = useState<LibraryPhase>('lobby');
  const [crowd, setCrowd] = useState<SeatStudent[]>([]);
  const [partner, setPartner] = useState<PartnerInfo | null>(null);
  const [scenario, setScenario] = useState<TalkScenario | null>(null);
  const [lineIdx, setLineIdx] = useState(0);
  const [showVi, setShowVi] = useState(false);
  const [myRole, setMyRole] = useState<'A' | 'B'>('B');
  const [toast, setToast] = useState<string | null>(null);
  const [musicOn, setMusicOn] = useState(false);
  const [musicId, setMusicId] = useState(STUDY_MUSIC[0].id);
  const [musicErr, setMusicErr] = useState<string | null>(null);
  const [studySeconds, setStudySeconds] = useState(0);
  const [matchDots, setMatchDots] = useState(0);
  const [onlineCount, setOnlineCount] = useState(36);
  const [embedAct, setEmbedAct] = useState<{
    activity: LingoActivity;
    returnPath: string;
    startedAt: number;
  } | null>(null);

  const openInGame = useCallback((activity: LingoActivity) => {
    setEmbedAct({
      activity,
      returnPath: '/demo/lingo-library',
      startedAt: Date.now(),
    });
  }, []);

  phaseRef.current = phase;
  partnerRef.current = partner;

  const showToast = useCallback((m: string) => {
    setToast(m);
    window.setTimeout(() => setToast(null), 2800);
  }, []);

  // init + nhận XP khi quay lại từ app LingoPro
  useEffect(() => {
    let p = loadProgress();
    const pending = consumeActivityReturn();
    if (pending) {
      const act = getActivity(pending.actId);
      if (act) {
        const mins = (Date.now() - pending.startedAt) / 60000;
        // tối thiểu mở app > 20s mới +XP (tránh spam)
        if (mins * 60 > 20) {
          p = {
            ...p,
            xp: p.xp + act.xpReward,
            coins: p.coins + Math.floor(act.xpReward / 8),
          };
          saveProgress(p);
          // toast sau mount
          window.setTimeout(() => {
            showToast(`Hoàn thành ${act.titleVi} · +${act.xpReward} XP`);
          }, 400);
        }
      }
    }
    setProgress(p);
    const c = createLibraryCrowd(p.name, 36);
    crowdRef.current = c;
    setCrowd(c);
    setOnlineCount(c.length);

    loadImage(LIBRARY_MAP)
      .then((img) => {
        mapRef.current = img;
        setReady(true);
      })
      .catch(() => setReady(true));

    return () => {
      if (matchTimer.current) clearTimeout(matchTimer.current);
      audioRef.current?.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once
  }, []);

  // ambient: bubble + small status flicker
  useEffect(() => {
    const id = window.setInterval(() => {
      const c = crowdRef.current;
      if (c.length < 2) return;
      const s = c[1 + Math.floor(Math.random() * (c.length - 1))];
      if (s.isYou) return;
      bubblesRef.current.push({
        id: `${Date.now()}-${s.id}`,
        nx: s.nx,
        ny: s.ny,
        text: randomBubble(),
        until: Date.now() + 3200,
      });
      if (bubblesRef.current.length > 8) bubblesRef.current.shift();
      // random status dance
      if (Math.random() > 0.7 && phaseRef.current === 'lobby') {
        const statuses: SeatStudent['status'][] = ['studying', 'idle', 'paired', 'speaking'];
        s.status = statuses[Math.floor(Math.random() * statuses.length)];
        setCrowd([...crowdRef.current]);
      }
      // online count breathe
      setOnlineCount((n) => {
        const d = Math.random() > 0.5 ? 1 : -1;
        return Math.max(28, Math.min(48, n + d));
      });
    }, 2200);
    return () => clearInterval(id);
  }, []);

  // matching dots
  useEffect(() => {
    if (phase !== 'matching') return;
    const id = window.setInterval(() => setMatchDots((d) => (d + 1) % 4), 400);
    return () => clearInterval(id);
  }, [phase]);

  // study timer + soft XP
  useEffect(() => {
    if (phase !== 'study') return;
    const id = window.setInterval(() => {
      setStudySeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'study' || studySeconds === 0 || studySeconds % 60 !== 0) return;
    if (!progress) return;
    const next = { ...progress, xp: progress.xp + 5, coins: progress.coins + 1 };
    setProgress(next);
    saveProgress(next);
    showToast('+5 XP focus (1 phút)');
  }, [studySeconds, phase, progress, showToast]);

  // music
  useEffect(() => {
    const track = STUDY_MUSIC.find((m) => m.id === musicId) ?? STUDY_MUSIC[0];
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = true;
      audioRef.current.volume = 0.35;
    }
    const a = audioRef.current;
    a.src = track.url;
    if (musicOn) {
      a.play().catch((e) => {
        setMusicErr('Trình duyệt chặn autoplay — bấm bật nhạc lại.');
        setMusicOn(false);
        console.warn(e);
      });
    } else {
      a.pause();
    }
  }, [musicId, musicOn]);

  // canvas draw
  useEffect(() => {
    if (!ready) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = (ts: number) => {
      lastTs.current = ts;
      ctx.fillStyle = '#120c08';
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);

      const map = mapRef.current;
      let mx = 0;
      let my = 0;
      let mw = VIEW_W;
      let mh = VIEW_H;
      if (map) {
        const scale = Math.max(VIEW_W / map.naturalWidth, VIEW_H / map.naturalHeight);
        mw = map.naturalWidth * scale;
        mh = map.naturalHeight * scale;
        mx = (VIEW_W - mw) / 2;
        my = (VIEW_H - mh) / 2;
        ctx.drawImage(map, mx, my, mw, mh);
      }

      // warm study overlay in study phase
      if (phaseRef.current === 'study') {
        ctx.fillStyle = 'rgba(40, 20, 8, 0.28)';
        ctx.fillRect(0, 0, VIEW_W, VIEW_H);
        // lamp glow
        const g = ctx.createRadialGradient(VIEW_W * 0.5, VIEW_H * 0.35, 40, VIEW_W * 0.5, VIEW_H * 0.4, 280);
        g.addColorStop(0, 'rgba(251, 191, 36, 0.12)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      }

      // vignette
      const vg = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.15, VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.7);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, 'rgba(10,6,4,0.45)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);

      const students = crowdRef.current;
      // sort by y for depth
      const sorted = [...students].sort((a, b) => a.ny - b.ny);

      for (const s of sorted) {
        const px = mx + s.nx * mw;
        const py = my + s.ny * mh;
        // desk shadow
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.ellipse(px, py + 10, 12, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // body
        const bob = s.status === 'studying' ? Math.sin(ts / 500 + s.nx * 20) * 1.5 : 0;
        ctx.fillStyle = s.color;
        // head
        ctx.beginPath();
        ctx.arc(px, py - 10 + bob, 7, 0, Math.PI * 2);
        ctx.fill();
        // body
        ctx.fillRect(px - 6, py - 4 + bob, 12, 12);
        // you ring
        if (s.isYou) {
          ctx.strokeStyle = '#fde68a';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(px, py - 2 + bob, 16, 0, Math.PI * 2);
          ctx.stroke();
        }
        // partner ring
        if (partnerRef.current && s.name === partnerRef.current.name && !s.isYou) {
          ctx.strokeStyle = '#f472b6';
          ctx.lineWidth = 2;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.arc(px, py - 2 + bob, 15, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        // status pip
        const pip =
          s.status === 'studying'
            ? '#4ade80'
            : s.status === 'speaking'
              ? '#f472b6'
              : s.status === 'paired'
                ? '#a78bfa'
                : '#94a3b8';
        ctx.fillStyle = pip;
        ctx.beginPath();
        ctx.arc(px + 8, py - 14 + bob, 3, 0, Math.PI * 2);
        ctx.fill();

        // name for you + partner + nearby random
        if (s.isYou || (partnerRef.current && s.name === partnerRef.current.name)) {
          ctx.font = 'bold 10px system-ui';
          ctx.fillStyle = 'rgba(0,0,0,0.65)';
          const label = s.isYou ? 'You' : s.name;
          const tw = ctx.measureText(label).width;
          ctx.fillRect(px - tw / 2 - 4, py - 28 + bob, tw + 8, 12);
          ctx.fillStyle = '#fff';
          ctx.textAlign = 'center';
          ctx.fillText(label, px, py - 19 + bob);
          ctx.textAlign = 'left';
        }
      }

      // highlight partner seat if paired — find student by name or fake offset near you
      if (partnerRef.current && phaseRef.current !== 'lobby') {
        const you = students.find((s) => s.isYou);
        if (you) {
          const px = mx + (you.nx + 0.05) * mw;
          const py = my + you.ny * mh;
          ctx.fillStyle = partnerRef.current.color;
          ctx.beginPath();
          ctx.arc(px, py - 10, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillRect(px - 6, py - 4, 12, 12);
          ctx.fillStyle = 'rgba(0,0,0,0.65)';
          ctx.font = 'bold 10px system-ui';
          const tw = ctx.measureText(partnerRef.current.name).width;
          ctx.fillRect(px - tw / 2 - 4, py - 28, tw + 8, 12);
          ctx.fillStyle = '#fce7f3';
          ctx.textAlign = 'center';
          ctx.fillText(partnerRef.current.name, px, py - 19);
          ctx.textAlign = 'left';
        }
      }

      // bubbles
      const now = Date.now();
      bubblesRef.current = bubblesRef.current.filter((b) => b.until > now);
      for (const b of bubblesRef.current) {
        const px = mx + b.nx * mw;
        const py = my + b.ny * mh - 36;
        ctx.font = '10px system-ui';
        const tw = Math.min(140, ctx.measureText(b.text).width);
        ctx.fillStyle = 'rgba(255,251,235,0.92)';
        round(ctx, px - tw / 2 - 6, py - 12, tw + 12, 18, 6);
        ctx.fill();
        ctx.fillStyle = '#1c1917';
        ctx.textAlign = 'center';
        ctx.fillText(b.text, px, py, 140);
        ctx.textAlign = 'left';
      }

      raf.current = requestAnimationFrame(draw);
    };
    raf.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf.current);
  }, [ready]);

  const startMatch = () => {
    setPhase('matching');
    setPartner(null);
    setScenario(null);
    setLineIdx(0);
    showToast('Đang tìm bạn học trong thư viện…');
    if (matchTimer.current) clearTimeout(matchTimer.current);
    matchTimer.current = setTimeout(() => {
      const p = pickRandomPartner([]);
      setPartner(p);
      setPhase('paired');
      // mark a crowd member paired visually
      const c = crowdRef.current;
      const bot = c.find((s) => !s.isYou && s.name.startsWith(p.name[0]));
      if (bot) bot.status = 'paired';
      const you = c.find((s) => s.isYou);
      if (you) you.status = 'paired';
      setCrowd([...c]);
      showToast(`Ghép với ${p.name} (Lv.${p.level})!`);
    }, 2200 + Math.random() * 1500);
  };

  const cancelMatch = () => {
    if (matchTimer.current) clearTimeout(matchTimer.current);
    setPhase('lobby');
    setPartner(null);
    showToast('Đã hủy tìm cặp');
  };

  const beginScenario = (sc: TalkScenario) => {
    setScenario(sc);
    setLineIdx(0);
    setShowVi(false);
    setMyRole('B'); // player thường là learner (B)
    setPhase('scenario');
    const c = crowdRef.current;
    const you = c.find((s) => s.isYou);
    if (you) you.status = 'speaking';
    setCrowd([...c]);
  };

  const nextLine = () => {
    if (!scenario) return;
    if (lineIdx + 1 >= scenario.lines.length) {
      // complete
      if (progress) {
        const next = {
          ...progress,
          xp: progress.xp + scenario.xpReward,
          coins: progress.coins + Math.floor(scenario.xpReward / 5),
        };
        setProgress(next);
        saveProgress(next);
        showToast(`Xong kịch bản! +${scenario.xpReward} XP — ngồi học nhé`);
      }
      setPhase('study');
      setMusicOn(true);
      setStudySeconds(0);
      const c = crowdRef.current;
      const you = c.find((s) => s.isYou);
      if (you) you.status = 'studying';
      setCrowd([...c]);
      return;
    }
    setLineIdx(lineIdx + 1);
    setShowVi(false);
  };

  const enterStudyOnly = () => {
    setPhase('study');
    setMusicOn(true);
    setStudySeconds(0);
    const c = crowdRef.current;
    const you = c.find((s) => s.isYou);
    if (you) you.status = 'studying';
    setCrowd([...c]);
    showToast('Chế độ ngồi học — bật nhạc focus');
  };

  const leaveStudy = () => {
    setPhase(partner ? 'paired' : 'lobby');
    setMusicOn(false);
    showToast('Rời bàn học');
  };

  const unpair = () => {
    setPartner(null);
    setScenario(null);
    setPhase('lobby');
    setMusicOn(false);
    const c = crowdRef.current.map((s) =>
      s.isYou ? { ...s, status: 'idle' as const } : s
    );
    crowdRef.current = c;
    setCrowd(c);
  };

  const line = scenario?.lines[lineIdx];
  const isMyTurn = line?.role === myRole;
  const progressPct = scenario ? Math.round(((lineIdx + 1) / scenario.lines.length) * 100) : 0;

  const onlineList = useMemo(() => {
    return [...crowd]
      .filter((s) => !s.isYou)
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 24);
  }, [crowd]);

  return (
    <div
      className="min-h-screen text-amber-50"
      style={{
        background: 'radial-gradient(ellipse at top, #2c1810 0%, #120a08 50%, #080504 100%)',
      }}
    >
      <div className="mx-auto max-w-6xl px-3 py-4 space-y-3">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-amber-500/80 font-semibold">
              LingoTown · Thư viện chung
            </p>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Georgia, serif' }}>
              Library Hall
            </h1>
            <p className="text-xs text-amber-100/45 mt-0.5">
              Hàng chục người đang học · bắt cặp · kịch bản nói · ngồi học + nhạc
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs items-center">
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
              {onlineCount} online
            </span>
            {progress && (
              <span className="font-mono text-amber-200/70">
                {progress.name} · {progress.xp} XP
              </span>
            )}
            <Link href="/demo/lingo-town" className="underline text-amber-300/70">
              ← Town
            </Link>
          </div>
        </header>

        <div className="grid lg:grid-cols-[1fr_280px] gap-3">
          {/* Stage */}
          <div className="space-y-2">
            <div
              className="relative rounded-xl overflow-hidden border-4 border-[#4a3020]"
              style={{ boxShadow: '0 0 0 1px #1a1008, 0 20px 50px #000a' }}
            >
              {!ready && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-black text-sm text-amber-200/50">
                  Đang mở cửa thư viện…
                </div>
              )}
              <canvas ref={canvasRef} width={VIEW_W} height={VIEW_H} className="w-full h-auto block" />

              {/* phase chips on canvas */}
              <div className="absolute top-2 left-2 flex flex-wrap gap-1.5">
                <PhaseChip active={phase === 'lobby'} label="Sảnh" />
                <PhaseChip active={phase === 'matching'} label="Tìm cặp" />
                <PhaseChip active={phase === 'paired' || phase === 'scenario'} label="Pair" />
                <PhaseChip active={phase === 'study'} label="Ngồi học" />
              </div>

              {phase === 'matching' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
                  <div className="rounded-2xl bg-[#2a1c12]/95 border border-amber-800 px-8 py-6 text-center shadow-2xl">
                    <div className="text-3xl mb-2">🔎</div>
                    <p className="font-semibold text-amber-50">
                      Đang tìm bạn học{'.'.repeat(matchDots)}
                    </p>
                    <p className="text-xs text-amber-100/50 mt-1">Quét {onlineCount} người trong hall…</p>
                    <button
                      type="button"
                      onClick={cancelMatch}
                      className="mt-4 text-xs underline text-amber-200/60"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Main action panel */}
            <div
              className="rounded-xl border border-amber-900/60 p-4 space-y-3"
              style={{
                background: 'linear-gradient(180deg, rgba(50,34,22,0.95), rgba(22,14,10,0.98))',
              }}
            >
              {phase === 'lobby' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2 items-center">
                    <button
                      type="button"
                      onClick={startMatch}
                      className="px-4 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-pink-400 to-fuchsia-500 text-white shadow-lg"
                    >
                      🤝 Bắt cặp học
                    </button>
                    <button
                      type="button"
                      onClick={enterStudyOnly}
                      className="px-4 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-300 to-yellow-500 text-amber-950"
                    >
                      🎧 Ngồi học + nhạc
                    </button>
                    <p className="text-xs text-amber-100/40 w-full">
                      Social layer (pair / nhạc) + bên dưới mở <strong>app LingoPro thật</strong>
                    </p>
                  </div>
                  <ActivityLauncher
                    zone="library"
                    returnPath="/demo/lingo-library"
                    onOpenInGame={openInGame}
                  />
                </div>
              )}

              {phase === 'paired' && partner && (
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-12 h-12 rounded-xl border-2 border-white/20 shrink-0"
                      style={{ background: partner.color, boxShadow: `0 0 16px ${partner.color}66` }}
                    />
                    <div>
                      <div className="font-bold">
                        {partner.name}{' '}
                        <span className="text-xs font-normal text-amber-200/50">Lv.{partner.level}</span>
                      </div>
                      <p className="text-xs text-amber-100/50">{partner.bio}</p>
                    </div>
                    <button type="button" onClick={unpair} className="ml-auto text-xs text-red-300/70 underline">
                      Rời pair
                    </button>
                  </div>
                  <p className="text-xs text-amber-100/55">Chọn kịch bản nói chuyện (bạn = role B):</p>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {SCENARIOS.map((sc) => (
                      <button
                        key={sc.id}
                        type="button"
                        onClick={() => beginScenario(sc)}
                        className="text-left rounded-xl border border-amber-800/60 bg-black/25 hover:border-pink-400/50 hover:bg-pink-500/10 px-3 py-2.5"
                      >
                        <div className="text-sm font-semibold">{sc.title}</div>
                        <div className="text-[11px] text-amber-100/40">
                          {sc.level} · {sc.setting} · +{sc.xpReward} XP
                        </div>
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={enterStudyOnly}
                    className="text-xs text-amber-300 underline"
                  >
                    Bỏ qua → ngồi học cùng nhau
                  </button>
                </div>
              )}

              {phase === 'scenario' && scenario && line && (
                <div className="space-y-3">
                  <div className="flex justify-between text-[11px] text-amber-100/45">
                    <span>
                      {scenario.title} · lượt {lineIdx + 1}/{scenario.lines.length}
                    </span>
                    <span>{progressPct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-black/40 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-pink-400 to-amber-300 transition-all"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>

                  <div
                    className={`rounded-2xl border px-4 py-3 ${
                      isMyTurn
                        ? 'border-emerald-500/50 bg-emerald-500/10'
                        : 'border-sky-500/40 bg-sky-500/10'
                    }`}
                  >
                    <div className="text-[10px] uppercase tracking-wider mb-1 opacity-60">
                      {line.role === 'A' ? `${partner?.name ?? 'Partner'} (A)` : 'Bạn (B)'}
                      {isMyTurn ? ' · lượt bạn nói' : ' · nghe partner'}
                    </div>
                    <p className="text-lg leading-snug font-medium text-amber-50">{line.en}</p>
                    {showVi && (
                      <p className="text-sm text-amber-200/60 mt-2 border-t border-white/10 pt-2">
                        {line.vi}
                      </p>
                    )}
                    {line.hint && (
                      <p className="text-[11px] text-amber-100/35 mt-1">💡 {line.hint}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setShowVi((v) => !v)}
                      className="px-3 py-1.5 rounded-lg text-xs border border-amber-800 bg-black/30"
                    >
                      {showVi ? 'Ẩn nghĩa' : 'Hiện nghĩa VI'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setMyRole((r) => (r === 'A' ? 'B' : 'A'))}
                      className="px-3 py-1.5 rounded-lg text-xs border border-amber-800 bg-black/30"
                    >
                      Đổi role (đang {myRole})
                    </button>
                    <button
                      type="button"
                      onClick={nextLine}
                      className="ml-auto px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-400 text-amber-950"
                    >
                      {lineIdx + 1 >= scenario.lines.length ? 'Hoàn thành → Ngồi học' : 'Câu tiếp →'}
                    </button>
                  </div>
                </div>
              )}

              {phase === 'study' && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <div>
                      <div className="text-sm font-semibold">🎧 Focus session</div>
                      <div className="text-xs text-amber-100/45 font-mono">
                        {Math.floor(studySeconds / 60)}:{String(studySeconds % 60).padStart(2, '0')}
                        {partner ? ` · cùng ${partner.name}` : ' · solo'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                      <select
                        className="text-xs rounded-lg bg-black/40 border border-amber-800 px-2 py-1.5"
                        value={musicId}
                        onChange={(e) => setMusicId(e.target.value)}
                      >
                        {STUDY_MUSIC.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.title}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          setMusicErr(null);
                          setMusicOn((v) => !v);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                          musicOn ? 'bg-emerald-500 text-emerald-950' : 'bg-stone-700'
                        }`}
                      >
                        {musicOn ? 'Nhạc: ON' : 'Nhạc: OFF'}
                      </button>
                      <button
                        type="button"
                        onClick={leaveStudy}
                        className="px-3 py-1.5 rounded-lg text-xs border border-amber-800"
                      >
                        Đứng dậy
                      </button>
                    </div>
                  </div>
                  {musicErr && <p className="text-[11px] text-amber-300/70">{musicErr}</p>}
                  <p className="text-xs text-amber-100/40 leading-relaxed">
                    Đèn dịu · co-study silent. Mỗi 60s +5 XP (demo). Muốn học “thật” — mở app bên
                    dưới (flashcard / review / grammar…) rồi quay lại hall.
                  </p>
                  <ActivityLauncher
                    zone="library"
                    returnPath="/demo/lingo-library"
                    title="Học app trong lúc ngồi"
                    compact
                    onOpenInGame={openInGame}
                  />
                  <div className="h-2 rounded-full bg-black/40 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-600 to-amber-300 transition-all duration-1000"
                      style={{ width: `${Math.min(100, (studySeconds % 60) * (100 / 60))}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar people */}
          <aside
            className="rounded-xl border border-amber-900/60 p-3 flex flex-col max-h-[720px]"
            style={{ background: 'linear-gradient(180deg, #2a1c14, #14100c)' }}
          >
            <div className="text-xs font-semibold text-amber-200/80 mb-2 flex justify-between">
              <span>Trong hall</span>
              <span className="font-mono text-emerald-400/80">{onlineCount}</span>
            </div>
            <ul className="flex-1 overflow-y-auto space-y-1 pr-1 text-xs">
              <li className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-amber-400/10 border border-amber-500/20">
                <span className="w-2 h-2 rounded-full bg-teal-400" />
                <span className="font-semibold">{progress?.name ?? 'Bạn'} (you)</span>
                <span className="ml-auto text-amber-100/40">{statusLabel(crowd.find((s) => s.isYou)?.status ?? 'idle')}</span>
              </li>
              {onlineList.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/5"
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                  <span className="truncate">{s.name}</span>
                  <span className="text-amber-100/30">Lv.{s.level}</span>
                  <span className="ml-auto text-[10px] text-amber-100/35">{statusLabel(s.status)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-2 pt-2 border-t border-amber-900/50 text-[10px] text-amber-100/35 leading-relaxed">
              🟢 học · 🩷 nói · 🟣 pair · ⚪ rảnh
              <br />
              Demo local — không phải multiplayer thật
            </div>
          </aside>
        </div>

        {toast && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 max-w-sm rounded-xl bg-amber-300 text-amber-950 px-4 py-2 text-sm font-semibold shadow-2xl">
            {toast}
          </div>
        )}

        <InGameActivityFrame
          open={embedAct}
          onClose={({ awardedXp, actTitle }) => {
            setEmbedAct(null);
            if (awardedXp > 0) {
              setProgress(loadProgress());
              showToast(`Xong ${actTitle ?? 'activity'} · +${awardedXp} XP`);
            } else {
              showToast('Đã về thư viện');
            }
          }}
        />

        <p className="text-center text-[10px] text-amber-100/20 pb-6">
          /demo/lingo-library · presence mô phỏng · kịch bản 4 topic · music stream demo
        </p>
      </div>
    </div>
  );
}

function PhaseChip({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
        active
          ? 'bg-amber-400 text-amber-950 border-amber-200'
          : 'bg-black/50 text-amber-100/50 border-amber-900/50'
      }`}
    >
      {label}
    </span>
  );
}

function round(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
