'use client';

/**
 * LingoTown demo v2 — map pixel thật + sprite walk.
 * /demo/lingo-town · local only
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ASSETS,
  ZONES,
  QUESTS,
  GROVE_WORDS,
  RACE_QUESTIONS,
  SHOP_ITEMS,
  loadProgress,
  saveProgress,
  defaultProgress,
  applyCheckIn,
  tryCompleteQuest,
  buyItem,
  levelFromXp,
  activeTitle,
  buildLeaderboard,
  zoneAtNorm,
  skinGlow,
  type TownProgress,
  type ZoneDef,
  type ZoneId,
} from '@/lib/lingo-town';
import { consumeActivityReturn, getActivity, type LingoActivity } from '@/lib/lingo-town-activities';
import { ActivityLauncher } from '@/components/lingo-town/ActivityLauncher';
import { InGameActivityFrame } from '@/components/lingo-town/InGameActivityFrame';

type ModalKind = ZoneId | 'npc' | null;

const VIEW_W = 960;
const VIEW_H = 540;

interface HeroSheet {
  img: HTMLImageElement;
  /** canvas đã xóa nền trắng (chroma) */
  sheet: HTMLCanvasElement;
  cols: number;
  rows: number;
  cw: number;
  ch: number;
}

/** Bóc nền trắng/grid → alpha (sprite AI thường dính nền) */
function punchWhiteBg(src: HTMLImageElement): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = src.naturalWidth;
  c.height = src.naturalHeight;
  const x = c.getContext('2d')!;
  x.drawImage(src, 0, 0);
  const data = x.getImageData(0, 0, c.width, c.height);
  const d = data.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];
    // trắng / xám rất nhạt của grid
    if (r > 230 && g > 230 && b > 230) {
      d[i + 3] = 0;
    } else if (r > 210 && g > 210 && b > 210) {
      // soft edge
      const avg = (r + g + b) / 3;
      d[i + 3] = Math.max(0, Math.min(255, (235 - avg) * 8));
    }
  }
  x.putImageData(data, 0, 0);
  return c;
}

function useKeys() {
  const keys = useRef<Record<string, boolean>>({});
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = true;
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    };
    const up = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', down, { passive: false });
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);
  return keys;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`load fail ${src}`));
    img.src = src;
  });
}

export default function LingoTownPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keys = useKeys();
  const mapImg = useRef<HTMLImageElement | null>(null);
  const hero = useRef<HeroSheet | null>(null);
  const uiImg = useRef<HTMLImageElement | null>(null);
  const player = useRef({
    nx: 0.48,
    ny: 0.55,
    facing: 0 as 0 | 1 | 2 | 3, // 0 down 1 right 2 up 3 left
    frame: 0,
    moving: false,
    anim: 0,
  });
  const nearIdRef = useRef<ZoneId | null>(null);
  const progressRef = useRef(defaultProgress());
  const modalRef = useRef<ModalKind>(null);
  const raf = useRef(0);
  const lastTs = useRef(0);
  const assetsReady = useRef(false);

  const [ready, setReady] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [progress, setProgress] = useState<TownProgress>(defaultProgress);
  const [nearZone, setNearZone] = useState<ZoneDef | null>(null);
  const [modal, setModal] = useState<ModalKind>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [groveIdx, setGroveIdx] = useState(0);
  const [groveShow, setGroveShow] = useState(false);
  const [groveDone, setGroveDone] = useState(0);
  const [raceIdx, setRaceIdx] = useState(0);
  const [raceScore, setRaceScore] = useState(0);
  const [raceBot, setRaceBot] = useState(0);
  const [raceOver, setRaceOver] = useState(false);
  const [raceStarted, setRaceStarted] = useState(false);
  const [deskName, setDeskName] = useState('Học viên');
  const [embedAct, setEmbedAct] = useState<{
    activity: LingoActivity;
    returnPath: string;
    startedAt: number;
  } | null>(null);

  progressRef.current = progress;
  modalRef.current = modal;

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3000);
  }, []);

  const openInGame = useCallback((activity: LingoActivity) => {
    setModal(null); // đóng zone modal, mở full iframe
    setEmbedAct({
      activity,
      returnPath: '/demo/lingo-town',
      startedAt: Date.now(),
    });
  }, []);

  const persist = useCallback((p: TownProgress) => {
    setProgress(p);
    saveProgress(p);
  }, []);

  useEffect(() => {
    let p = loadProgress();
    const pending = consumeActivityReturn();
    if (pending) {
      const act = getActivity(pending.actId);
      if (act && (Date.now() - pending.startedAt) / 1000 > 20) {
        p = {
          ...p,
          xp: p.xp + act.xpReward,
          coins: p.coins + Math.floor(act.xpReward / 8),
        };
        saveProgress(p);
        window.setTimeout(() => showToast(`Xong ${act.titleVi} · +${act.xpReward} XP`), 300);
      }
    }
    setProgress(p);
    setDeskName(p.name);
    progressRef.current = p;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openZone = useCallback((z: ZoneDef) => {
    setModal(z.id);
    if (z.id === 'grove') {
      setGroveIdx(0);
      setGroveShow(false);
      setGroveDone(0);
    }
    if (z.id === 'arena') {
      setRaceIdx(0);
      setRaceScore(0);
      setRaceBot(0);
      setRaceOver(false);
      setRaceStarted(false);
    }
  }, []);

  // load assets
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [map, heroImg, ui] = await Promise.all([
          loadImage(ASSETS.map),
          loadImage(ASSETS.hero),
          loadImage(ASSETS.ui),
        ]);
        if (cancelled) return;
        mapImg.current = map;
        uiImg.current = ui;
        const cols = 4;
        const rows = 3;
        const sheet = punchWhiteBg(heroImg);
        hero.current = {
          img: heroImg,
          sheet,
          cols,
          rows,
          cw: heroImg.naturalWidth / cols,
          ch: heroImg.naturalHeight / rows,
        };
        assetsReady.current = true;
        setReady(true);
      } catch (e) {
        setLoadErr(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // render loop
  useEffect(() => {
    if (!ready) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

    const step = (ts: number) => {
      const dt = Math.min(0.05, (ts - (lastTs.current || ts)) / 1000);
      lastTs.current = ts;
      const modalOpen = modalRef.current !== null;
      const p = player.current;
      const prog = progressRef.current;

      if (!modalOpen) {
        let dx = 0;
        let dy = 0;
        const k = keys.current;
        if (k['w'] || k['arrowup']) dy -= 1;
        if (k['s'] || k['arrowdown']) dy += 1;
        if (k['a'] || k['arrowleft']) dx -= 1;
        if (k['d'] || k['arrowright']) dx += 1;

        const speed = 0.22; // norm units / sec
        if (dx || dy) {
          const len = Math.hypot(dx, dy) || 1;
          dx = (dx / len) * speed * dt;
          dy = (dy / len) * speed * dt;
          // soft water block bottom-right pier water
          let nx = clamp(p.nx + dx, 0.04, 0.96);
          let ny = clamp(p.ny + dy, 0.06, 0.94);
          // block deep water corner
          if (nx > 0.78 && ny > 0.78) {
            nx = p.nx;
            ny = Math.min(ny, 0.78);
          }
          p.nx = nx;
          p.ny = ny;
          p.moving = true;
          p.anim += dt * 8;
          if (Math.abs(dx) > Math.abs(dy)) p.facing = dx > 0 ? 1 : 3;
          else p.facing = dy > 0 ? 0 : 2;
          p.frame = Math.floor(p.anim) % 4;
        } else {
          p.moving = false;
          p.frame = 0;
        }

        if (k['e'] || k['enter'] || k[' ']) {
          k['e'] = false;
          k['enter'] = false;
          k[' '] = false;
          const z = zoneAtNorm(p.nx, p.ny);
          if (z) openZone(z);
        }
      }

      const zNow = zoneAtNorm(p.nx, p.ny);
      const zid = zNow?.id ?? null;
      if (zid !== nearIdRef.current) {
        nearIdRef.current = zid;
        setNearZone(zNow);
      }

      // --- draw ---
      ctx.imageSmoothingEnabled = true;
      // letterbox wood
      ctx.fillStyle = '#1c1410';
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);

      const map = mapImg.current;
      if (map) {
        // cover view keeping aspect
        const scale = Math.max(VIEW_W / map.naturalWidth, VIEW_H / map.naturalHeight);
        const mw = map.naturalWidth * scale;
        const mh = map.naturalHeight * scale;
        const mx = (VIEW_W - mw) / 2;
        const my = (VIEW_H - mh) / 2;
        ctx.drawImage(map, mx, my, mw, mh);

        // gentle vignette
        const g = ctx.createRadialGradient(
          VIEW_W / 2,
          VIEW_H / 2,
          VIEW_H * 0.2,
          VIEW_W / 2,
          VIEW_H / 2,
          VIEW_H * 0.75
        );
        g.addColorStop(0, 'rgba(0,0,0,0)');
        g.addColorStop(1, 'rgba(20,12,8,0.35)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, VIEW_W, VIEW_H);

        // zone soft rings when near
        for (const z of ZONES) {
          const zx = mx + (z.x + z.w / 2) * mw;
          const zy = my + (z.y + z.h / 2) * mh;
          const pulse = 0.5 + 0.5 * Math.sin(ts / 400 + z.x * 10);
          const active = zNow?.id === z.id;
          ctx.beginPath();
          ctx.arc(zx, zy, (active ? 28 : 18) + pulse * 4, 0, Math.PI * 2);
          ctx.strokeStyle = active ? z.accent : z.accent + '66';
          ctx.lineWidth = active ? 3 : 1.5;
          ctx.stroke();
          if (active) {
            ctx.fillStyle = z.accent + '22';
            ctx.fill();
          }
        }

        // floating dust / fireflies
        ctx.fillStyle = 'rgba(255,236,160,0.55)';
        for (let i = 0; i < 18; i++) {
          const fx = ((Math.sin(ts / 900 + i * 1.7) * 0.5 + 0.5) * 0.9 + 0.05) * VIEW_W;
          const fy = ((Math.cos(ts / 1100 + i * 2.1) * 0.5 + 0.5) * 0.85 + 0.08) * VIEW_H;
          const r = 1.2 + (i % 3) * 0.6;
          ctx.beginPath();
          ctx.arc(fx, fy, r, 0, Math.PI * 2);
          ctx.fill();
        }

        // player world pos
        const px = mx + p.nx * mw;
        const py = my + p.ny * mh;

        // shadow
        ctx.fillStyle = 'rgba(0,0,0,0.28)';
        ctx.beginPath();
        ctx.ellipse(px, py + 18, 14, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // skin glow ring
        ctx.beginPath();
        ctx.arc(px, py + 2, 22, 0, Math.PI * 2);
        ctx.fillStyle = skinGlow(prog.equipped);
        ctx.fill();

        const sheet = hero.current;
        if (sheet) {
          // rows: 0 down, 1 side(right), 2 up — left = flip side
          let row = 0;
          let flip = false;
          if (p.facing === 0) row = 0;
          else if (p.facing === 2) row = 2;
          else if (p.facing === 1) {
            row = 1;
            flip = false;
          } else {
            row = 1;
            flip = true;
          }
          const col = p.moving ? p.frame : 0;
          const sw = sheet.cw;
          const sh = sheet.ch;
          const dw = 48;
          const dh = 48;
          ctx.imageSmoothingEnabled = false;
          ctx.save();
          if (flip) {
            ctx.translate(px, py);
            ctx.scale(-1, 1);
            ctx.drawImage(
              sheet.sheet,
              col * sw,
              row * sh,
              sw,
              sh,
              -dw / 2,
              -dh + 8,
              dw,
              dh
            );
          } else {
            ctx.drawImage(
              sheet.sheet,
              col * sw,
              row * sh,
              sw,
              sh,
              px - dw / 2,
              py - dh + 8,
              dw,
              dh
            );
          }
          ctx.restore();
          ctx.imageSmoothingEnabled = true;
        }

        // nameplate
        const label = prog.name || 'You';
        ctx.font = 'bold 12px "Segoe UI", system-ui, sans-serif';
        const tw = ctx.measureText(label).width;
        ctx.fillStyle = 'rgba(15,10,8,0.72)';
        roundRect(ctx, px - tw / 2 - 8, py - 52, tw + 16, 18, 6);
        ctx.fill();
        ctx.fillStyle = '#fff7ed';
        ctx.textAlign = 'center';
        ctx.fillText(label, px, py - 39);
        ctx.textAlign = 'left';

        if (zNow && !modalOpen) {
          ctx.fillStyle = 'rgba(15,10,8,0.85)';
          roundRect(ctx, px - 52, py + 28, 104, 22, 8);
          ctx.fill();
          ctx.fillStyle = '#fde68a';
          ctx.font = 'bold 11px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('[E]  ' + zNow.name, px, py + 43);
          ctx.textAlign = 'left';
        }
      }

      raf.current = requestAnimationFrame(step);
    };

    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [ready, keys, openZone]);

  const lv = useMemo(() => levelFromXp(progress.xp), [progress.xp]);
  const board = useMemo(() => buildLeaderboard(progress), [progress]);
  const title = activeTitle(progress.inventory);
  const xpPct = Math.round((lv.into / lv.need) * 100);

  const doCheckIn = () => {
    const r = applyCheckIn(progress);
    persist(r.progress);
    showToast(r.message);
  };

  const groveKnow = (knew: boolean) => {
    if (knew) {
      const nextDone = groveDone + 1;
      setGroveDone(nextDone);
      let p = {
        ...progress,
        xp: progress.xp + 8,
        coins: progress.coins + 2,
        totalReviews: progress.totalReviews + 1,
      };
      if (nextDone >= GROVE_WORDS.length) {
        const q = tryCompleteQuest(p, 'q-flash');
        p = q.progress;
        showToast(q.gained ? q.msg : 'Đã ôn xong 5 từ!');
      }
      persist(p);
    }
    setGroveShow(false);
    if (groveIdx + 1 < GROVE_WORDS.length) setGroveIdx(groveIdx + 1);
  };

  const startRace = () => {
    setRaceStarted(true);
    setRaceIdx(0);
    setRaceScore(0);
    setRaceBot(0);
    setRaceOver(false);
  };

  const answerRace = (opt: string) => {
    if (raceOver || !raceStarted) return;
    const q = RACE_QUESTIONS[raceIdx];
    let score = raceScore;
    const bot = raceBot + (Math.random() > 0.35 ? 1 : 0);
    if (opt === q.a) score += 1;
    const next = raceIdx + 1;
    if (next >= RACE_QUESTIONS.length) {
      setRaceScore(score);
      setRaceBot(bot);
      setRaceOver(true);
      setRaceIdx(next);
      let p = {
        ...progress,
        xp: progress.xp + 10 + score * 8,
        coins: progress.coins + 3 + score * 3,
        racesWon: progress.racesWon + (score >= bot ? 1 : 0),
      };
      const qd = tryCompleteQuest(p, 'q-race');
      p = qd.progress;
      persist(p);
      showToast(
        score >= bot
          ? `Thắng ${score}-${bot}! ${qd.gained ? qd.msg : ''}`
          : `Thua ${score}-${bot}. ${qd.gained ? qd.msg : ''}`
      );
    } else {
      setRaceScore(score);
      setRaceBot(bot);
      setRaceIdx(next);
    }
  };

  const onBuy = (id: string) => {
    const r = buyItem(progress, id);
    persist(r.progress);
    showToast(r.msg);
  };

  const saveDesk = () => {
    const name = deskName.trim().slice(0, 16) || 'Học viên';
    persist({ ...progress, name });
    showToast(`Xin chào, ${name}!`);
  };

  const resetDemo = () => {
    if (!confirm('Reset progress demo?')) return;
    localStorage.removeItem('lingotown-demo-v2');
    localStorage.removeItem('lingotown-demo-v1');
    const p = defaultProgress();
    persist(p);
    setDeskName(p.name);
    player.current.nx = 0.48;
    player.current.ny = 0.55;
    showToast('Đã reset.');
  };

  const pad = (key: string, on: boolean) => {
    keys.current[key] = on;
  };

  return (
    <div
      className="min-h-screen text-amber-50"
      style={{
        background:
          'radial-gradient(ellipse at top, #3d2914 0%, #1a100a 45%, #0c0806 100%)',
      }}
    >
      <div className="mx-auto max-w-5xl px-3 py-4 space-y-3">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-amber-500/80 font-semibold">
              LingoTown · pixel hub demo
            </p>
            <h1
              className="text-2xl sm:text-3xl font-bold tracking-tight"
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                textShadow: '0 2px 0 #0006',
              }}
            >
              Thành phố từ vựng
            </h1>
            <p className="text-xs text-amber-100/50 mt-1">
              WASD di chuyển · E tương tác · ít tính năng, hình ảnh game
            </p>
          </div>
          <div className="flex gap-3 text-xs">
            <Link href="/demo/lingo-library" className="text-amber-300/80 hover:text-amber-200 underline">
              Thư viện
            </Link>
            <Link href="/demo/pack-practice" className="text-amber-300/50 hover:text-amber-200 underline">
              Pack reading
            </Link>
            <button type="button" onClick={resetDemo} className="text-red-300/70 hover:text-red-200">
              Reset
            </button>
          </div>
        </header>

        {/* RPG HUD */}
        <div
          className="grid grid-cols-1 sm:grid-cols-3 gap-2 rounded-xl p-3 border border-amber-900/60"
          style={{
            background:
              'linear-gradient(180deg, rgba(60,40,24,0.95), rgba(30,20,12,0.98))',
            boxShadow: 'inset 0 1px 0 #a67c5233, 0 8px 24px #0008',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-lg border-2 border-amber-700/80 overflow-hidden shrink-0 bg-[#2a1c12] flex items-center justify-center text-2xl"
              style={{ boxShadow: '0 0 12px ' + skinGlow(progress.equipped) }}
              title="Avatar"
            >
              🧑‍🎓
            </div>
            <div className="min-w-0">
              <div className="font-semibold truncate text-amber-50">
                {progress.name}
                {title ? (
                  <span className="ml-1 text-[10px] text-violet-300 font-normal">· {title}</span>
                ) : null}
              </div>
              <div className="text-[11px] text-amber-200/60">Lv.{lv.level}</div>
              <div className="mt-1 h-2.5 rounded-full bg-black/40 overflow-hidden border border-amber-900/50">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${xpPct}%`,
                    background: 'linear-gradient(90deg,#fbbf24,#f59e0b,#fde68a)',
                  }}
                />
              </div>
              <div className="text-[10px] text-amber-200/40 mt-0.5">
                {lv.into}/{lv.need} XP
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 font-mono text-sm">
            <span className="flex items-center gap-1.5">
              <span className="text-amber-400 text-lg">★</span>
              <span>{progress.xp}</span>
              <span className="text-amber-200/40 text-xs">XP</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-yellow-300 text-lg">🪙</span>
              <span>{progress.coins}</span>
            </span>
          </div>
          <div className="flex items-center justify-end gap-2 text-sm">
            <span className="text-rose-400">
              {progress.streak > 0 ? `❤️×${progress.streak}` : '🤍 streak'}
            </span>
            <span className="text-[11px] text-amber-200/40">
              {progress.lastCheckIn === new Date().toISOString().slice(0, 10)
                ? 'đã điểm danh'
                : 'chưa điểm danh'}
            </span>
          </div>
        </div>

        {/* Game stage */}
        <div
          className="relative rounded-xl overflow-hidden border-4 border-[#5c3d24]"
          style={{
            boxShadow:
              '0 0 0 2px #2a1810, 0 20px 50px #000a, inset 0 0 40px #0004',
          }}
        >
          {!ready && !loadErr && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#1a100a] text-amber-200/70 text-sm">
              Đang tải bản đồ pixel…
            </div>
          )}
          {loadErr && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#1a100a] text-red-300 text-sm p-4 text-center">
              Lỗi load asset: {loadErr}
            </div>
          )}
          <canvas
            ref={canvasRef}
            width={VIEW_W}
            height={VIEW_H}
            className="w-full h-auto block bg-black cursor-pointer"
            style={{ imageRendering: 'auto' }}
            onClick={(e) => {
              if (modal || !ready) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const nx = (e.clientX - rect.left) / rect.width;
              const ny = (e.clientY - rect.top) / rect.height;
              // move toward click + open if zone
              player.current.nx = Math.max(0.04, Math.min(0.96, nx));
              player.current.ny = Math.max(0.06, Math.min(0.94, ny));
              const z = zoneAtNorm(player.current.nx, player.current.ny);
              if (z) openZone(z);
            }}
          />

          {nearZone && !modal && (
            <div
              className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-3 sm:max-w-xs rounded-xl px-4 py-3 border border-amber-800/80"
              style={{
                background: 'linear-gradient(160deg, rgba(55,36,20,0.94), rgba(25,16,10,0.96))',
                boxShadow: '0 8px 24px #0008',
              }}
            >
              <div className="font-semibold text-amber-50">
                {nearZone.emoji} {nearZone.name}
              </div>
              <div className="text-xs text-amber-100/55 mt-0.5">{nearZone.blurb}</div>
              <button
                type="button"
                className="mt-2 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-300 px-3 py-1.5 rounded-lg"
                onClick={() => openZone(nearZone)}
              >
                Vào khu vực
              </button>
            </div>
          )}

          {/* mobile pad */}
          <div className="sm:hidden absolute bottom-24 right-2 grid grid-cols-3 gap-1">
            <i />
            <Pad label="▲" hold={(o) => pad('arrowup', o)} />
            <i />
            <Pad label="◀" hold={(o) => pad('arrowleft', o)} />
            <Pad
              label="E"
              hold={(o) => {
                if (o) keys.current['e'] = true;
              }}
            />
            <Pad label="▶" hold={(o) => pad('arrowright', o)} />
            <i />
            <Pad label="▼" hold={(o) => pad('arrowdown', o)} />
            <i />
          </div>
        </div>

        {/* quick warp — game-like location bar */}
        <div className="flex flex-wrap gap-1.5">
          {ZONES.map((z) => (
            <button
              key={z.id}
              type="button"
              onClick={() => {
                player.current.nx = z.x + z.w / 2;
                player.current.ny = z.y + z.h / 2;
                openZone(z);
              }}
              className="text-[11px] px-2.5 py-1 rounded-full border border-amber-900/70 bg-amber-950/40 hover:bg-amber-900/50 text-amber-100/80"
            >
              {z.emoji} {z.name}
            </button>
          ))}
        </div>

        {toast && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 max-w-sm rounded-xl bg-amber-300 text-amber-950 px-4 py-2.5 text-sm font-semibold shadow-2xl border border-amber-100">
            {toast}
          </div>
        )}

        <InGameActivityFrame
          open={embedAct}
          onClose={({ awardedXp, actTitle }) => {
            setEmbedAct(null);
            setProgress(loadProgress());
            if (awardedXp > 0) {
              showToast(`Xong ${actTitle ?? 'activity'} · +${awardedXp} XP`);
            }
          }}
        />

        {/* MODAL */}
        {modal && (
          <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-3 bg-black/55 backdrop-blur-[2px]">
            <div
              className="w-full max-w-md rounded-2xl overflow-hidden border-2 border-amber-800/90 max-h-[85vh] overflow-y-auto"
              style={{
                background:
                  'linear-gradient(180deg, #4a3220 0%, #2a1c12 40%, #1a120c 100%)',
                boxShadow: '0 25px 60px #000c, inset 0 1px 0 #c4a57444',
              }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-amber-900/80 bg-black/20">
                <h2 className="font-bold text-amber-50 text-sm">
                  {ZONES.find((z) => z.id === modal)?.emoji}{' '}
                  {ZONES.find((z) => z.id === modal)?.name ?? modal}
                </h2>
                <button
                  type="button"
                  className="text-amber-200/60 hover:text-amber-100 text-xs"
                  onClick={() => setModal(null)}
                >
                  Đóng ✕
                </button>
              </div>
              <div className="p-4 space-y-3 text-sm text-amber-50/90">
                {modal === 'fountain' && (
                  <>
                    <p className="text-amber-100/60 text-xs leading-relaxed">
                      Nước đài lấp lánh… Hãy điểm danh để thắp sáng streak của bạn.
                    </p>
                    <button
                      type="button"
                      onClick={doCheckIn}
                      className="w-full py-2.5 rounded-xl font-bold text-amber-950 bg-gradient-to-r from-sky-300 to-cyan-400 hover:from-sky-200 hover:to-cyan-300"
                    >
                      Điểm danh hôm nay
                    </button>
                  </>
                )}

                {modal === 'grove' && (
                  <>
                    <ActivityLauncher
                      zone="grove"
                      returnPath="/demo/lingo-town"
                      onOpenInGame={openInGame}
                      title="App LingoPro tại Rừng thẻ"
                    />
                    <div className="border-t border-amber-900/40 pt-3">
                      <p className="text-xs text-amber-100/50 mb-2">
                        Mini demo hub · {groveDone}/{GROVE_WORDS.length} thẻ
                      </p>
                      {groveIdx < GROVE_WORDS.length ? (
                        <div className="rounded-xl border border-amber-800/60 bg-black/25 p-5 text-center space-y-3">
                          <div className="text-3xl font-bold tracking-wide text-emerald-200">
                            {GROVE_WORDS[groveIdx].en}
                          </div>
                          {groveShow ? (
                            <>
                              <div className="text-xl text-amber-100">{GROVE_WORDS[groveIdx].vi}</div>
                              <div className="flex gap-2 justify-center">
                                <button
                                  type="button"
                                  className="px-4 py-1.5 rounded-lg bg-emerald-500 text-emerald-950 font-semibold"
                                  onClick={() => groveKnow(true)}
                                >
                                  Nhớ
                                </button>
                                <button
                                  type="button"
                                  className="px-4 py-1.5 rounded-lg bg-stone-700"
                                  onClick={() => groveKnow(false)}
                                >
                                  Chưa
                                </button>
                              </div>
                            </>
                          ) : (
                            <button
                              type="button"
                              className="text-amber-300 underline"
                              onClick={() => setGroveShow(true)}
                            >
                              Lật thẻ
                            </button>
                          )}
                        </div>
                      ) : (
                        <p className="text-emerald-300">Hoàn thành mini demo! 🌿</p>
                      )}
                    </div>
                  </>
                )}

                {modal === 'pier' && (
                  <>
                    <p className="text-xs text-amber-100/60 leading-relaxed">
                      Cầu sách → <strong>Library Hall</strong> (đông người, pair, nhạc) + app
                      LingoPro thật.
                    </p>
                    <Link
                      href="/demo/lingo-library"
                      className="block text-center rounded-xl py-2.5 font-bold text-amber-950 bg-gradient-to-r from-amber-300 to-yellow-400"
                    >
                      Vào Thư viện chung
                    </Link>
                    <ActivityLauncher
                      zone="pier"
                      returnPath="/demo/lingo-town"
                      onOpenInGame={openInGame}
                      title="Hoặc mở app ngay"
                      compact
                    />
                  </>
                )}

                {modal === 'board' && (
                  <ul className="space-y-1 font-mono text-xs">
                    {board.slice(0, 8).map((row) => (
                      <li
                        key={row.rank + row.name}
                        className={`flex justify-between px-3 py-1.5 rounded-lg ${
                          row.isYou
                            ? 'bg-amber-400/20 text-amber-100 border border-amber-500/40'
                            : 'bg-black/20'
                        }`}
                      >
                        <span>
                          #{row.rank} {row.name}
                          {row.isYou ? ' ← bạn' : ''}
                        </span>
                        <span className="text-amber-300">{row.xp}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {modal === 'shop' && (
                  <ul className="space-y-2">
                    {SHOP_ITEMS.map((item) => {
                      const owned = progress.inventory.includes(item.id);
                      return (
                        <li
                          key={item.id}
                          className="flex items-center justify-between gap-2 rounded-xl border border-amber-900/50 bg-black/20 px-3 py-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-4 h-4 rounded-full shrink-0 border border-white/20"
                              style={{ background: item.tint, boxShadow: `0 0 8px ${item.tint}` }}
                            />
                            <div className="min-w-0">
                              <div className="text-xs font-medium truncate">{item.name}</div>
                              <div className="text-[10px] text-amber-100/40">
                                {item.cost === 0 ? 'Free' : `${item.cost} xu`}
                                {owned ? ' · owned' : ''}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="text-[11px] px-2.5 py-1 rounded-lg bg-violet-500/90 hover:bg-violet-400 text-white font-semibold shrink-0"
                            onClick={() => onBuy(item.id)}
                          >
                            {owned && item.kind === 'skin' ? 'Mặc' : owned ? 'OK' : 'Mua'}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}

                {modal === 'hall' && (
                  <>
                    <ActivityLauncher
                      zone="hall"
                      returnPath="/demo/lingo-town"
                      onOpenInGame={openInGame}
                      title="Quest = mở app LingoPro"
                    />
                    <ul className="space-y-2 border-t border-amber-900/40 pt-3">
                      {QUESTS.map((q) => {
                        const done = progress.questsDone.includes(q.id);
                        return (
                          <li
                            key={q.id}
                            className="rounded-xl border border-amber-900/50 bg-black/20 px-3 py-2"
                          >
                            <div className="flex justify-between text-xs font-semibold">
                              <span>
                                {done ? '✅' : '📜'} {q.title}
                              </span>
                              <span className="text-amber-300">
                                +{q.xp}XP +{q.coins}🪙
                              </span>
                            </div>
                            <p className="text-[11px] text-amber-100/45 mt-0.5">{q.desc}</p>
                          </li>
                        );
                      })}
                    </ul>
                  </>
                )}

                {modal === 'arena' && (
                  <>
                    <ActivityLauncher
                      zone="arena"
                      returnPath="/demo/lingo-town"
                      onOpenInGame={openInGame}
                      title="Đấu bằng app thật"
                      compact
                    />
                    {!raceStarted && (
                      <>
                        <p className="text-xs text-amber-100/55">
                          Hoặc race mini hub vs bot:
                        </p>
                        <button
                          type="button"
                          onClick={startRace}
                          className="w-full py-2.5 rounded-xl font-bold bg-gradient-to-r from-red-400 to-rose-500 text-white"
                        >
                          Bắt đầu race demo
                        </button>
                      </>
                    )}
                    {raceStarted && !raceOver && raceIdx < RACE_QUESTIONS.length && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-[11px] font-mono text-amber-100/45">
                          <span>
                            {raceIdx + 1}/{RACE_QUESTIONS.length}
                          </span>
                          <span>
                            Bạn {raceScore} · Bot {raceBot}
                          </span>
                        </div>
                        <p className="font-medium">{RACE_QUESTIONS[raceIdx].q}</p>
                        <div className="grid gap-1.5">
                          {RACE_QUESTIONS[raceIdx].options.map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              className="text-left px-3 py-2 rounded-lg border border-amber-800/60 bg-black/25 hover:border-rose-400/80 hover:bg-rose-500/10"
                              onClick={() => answerRace(opt)}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {raceOver && (
                      <div className="text-center space-y-2 py-2">
                        <p className="text-xl font-bold">
                          {raceScore >= raceBot ? '🏆 Chiến thắng!' : '💀 Thua rồi'}
                        </p>
                        <p className="font-mono text-amber-200">
                          {raceScore} — {raceBot}
                        </p>
                        <button type="button" className="underline text-xs" onClick={startRace}>
                          Chơi lại
                        </button>
                      </div>
                    )}
                  </>
                )}

                {modal === 'desk' && (
                  <>
                    <ActivityLauncher
                      zone="desk"
                      returnPath="/demo/lingo-town"
                      onOpenInGame={openInGame}
                      title="Góc học → app LingoPro"
                      compact
                    />
                    <label className="text-xs text-amber-100/50">Tên trên phố</label>
                    <input
                      className="w-full rounded-xl border border-amber-800/60 bg-black/30 px-3 py-2 text-sm"
                      value={deskName}
                      onChange={(e) => setDeskName(e.target.value)}
                      maxLength={16}
                    />
                    <button
                      type="button"
                      onClick={saveDesk}
                      className="w-full py-2 rounded-xl font-bold bg-lime-400 text-lime-950"
                    >
                      Lưu tên
                    </button>
                    <ul className="text-[11px] font-mono text-amber-100/45 space-y-1 pt-1">
                      <li>Ôn thẻ: {progress.totalReviews}</li>
                      <li>Race thắng: {progress.racesWon}</li>
                      <li>
                        Quest: {progress.questsDone.length}/{QUESTS.length}
                      </li>
                    </ul>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        <p className="text-center text-[10px] text-amber-100/25 pb-8">
          map + hero sprite · /demo/lingo-town · localStorage v2
        </p>
      </div>
    </div>
  );
}

function roundRect(
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

function Pad({ label, hold }: { label: string; hold: (on: boolean) => void }) {
  return (
    <button
      type="button"
      className="w-11 h-11 rounded-xl bg-black/55 border border-amber-800/60 text-amber-100 font-bold text-sm active:bg-amber-900/50"
      onPointerDown={(e) => {
        e.preventDefault();
        hold(true);
      }}
      onPointerUp={() => hold(false)}
      onPointerLeave={() => hold(false)}
      onPointerCancel={() => hold(false)}
    >
      {label}
    </button>
  );
}
