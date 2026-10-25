/**
 * Dashboard tiến độ enrich placeholder (tag pro3m).
 *   npx tsx scripts/enrich-progress.ts            # 1 snapshot
 *   npx tsx scripts/enrich-progress.ts --watch    # vòng lặp 30s, tự ghi lại enrich-progress.html
 *   ... --watch --interval=20                      # đổi chu kỳ (giây)
 *
 * Đo "remaining" = số dòng pro3m còn definition placeholder (đếm head:true, không tải data).
 * Rate/ETA tính từ lịch sử 15 phút lưu ở tmp/enrich-progress-state.json.
 * HTML có meta-refresh 30s → mở 1 lần là thấy số tự nhảy (watcher nền ghi đè file).
 */
import * as path from 'path';
import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^\s*([^#=]+)\s*=\s*(.*)$/);
    if (m) { let v = m[2].trim(); if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1); process.env[m[1].trim()] = v; }
  });
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error('❌ Thiếu Supabase env'); process.exit(1); }
const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const getArg = (n: string) => { const p = process.argv.find(a => a.startsWith(`--${n}=`)); return p ? p.split('=').slice(1).join('=') : undefined; };
const WATCH = process.argv.includes('--watch');
const INTERVAL = parseInt(getArg('interval') || '30', 10) * 1000;
const TAG = 'pro3m';
const PLACEHOLDER = '⏳ Click to enrich / Auto-enrich';
const TOTAL = 5189; // tổng từ cần enrich (mốc gốc)
const HTML_PATH = path.resolve(__dirname, '../../enrich-progress.html');
const STATE_PATH = path.resolve(__dirname, '../../tmp/enrich-progress-state.json');
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const fmt = (min: number) => min >= 60 ? `${Math.floor(min / 60)}h${Math.round(min % 60)}m` : `${Math.round(min)}m`;

async function snapshot() {
  const totalQ = await supabase.from('global_dictionary').select('*', { count: 'exact', head: true }).contains('tags', [TAG]);
  const remQ = await supabase.from('global_dictionary').select('*', { count: 'exact', head: true })
    .contains('tags', [TAG]).eq('data->results->0->meanings->0->>definition', PLACEHOLDER);
  if (remQ.error) throw remQ.error;
  return { totalPro3m: totalQ.count || 0, remaining: remQ.count || 0 };
}

function loadHist(): { t: number; r: number }[] { try { return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8')); } catch { return []; } }
function saveHist(h: { t: number; r: number }[]) { fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true }); fs.writeFileSync(STATE_PATH, JSON.stringify(h)); }

async function tick(): Promise<number> {
  const { totalPro3m, remaining } = await snapshot();
  const done = Math.max(0, TOTAL - remaining);
  const pct = Math.min(100, done / TOTAL * 100);

  const now = Date.now();
  let hist = loadHist(); hist.push({ t: now, r: remaining });
  hist = hist.filter(h => now - h.t <= 15 * 60 * 1000); saveHist(hist);

  let rate = 0, eta = 0;
  if (hist.length >= 2) {
    const f = hist[0]; const dtMin = (now - f.t) / 60000; const dr = f.r - remaining;
    if (dtMin > 0 && dr > 0) { rate = dr / dtMin; eta = remaining / rate; }
  }

  const blocks = Math.round(pct / 2.5);
  console.log(`${new Date().toLocaleTimeString()} [${'█'.repeat(blocks)}${'░'.repeat(40 - blocks)}] ${pct.toFixed(1)}% · xong ${done}/${TOTAL} · còn ${remaining} · ${rate ? rate.toFixed(1) + '/ph · ETA ' + fmt(eta) : 'đang đo...'}`);
  fs.writeFileSync(HTML_PATH, html({ done, remaining, pct, rate, eta, totalPro3m, now }), 'utf8');
  return remaining;
}

function html(d: { done: number; remaining: number; pct: number; rate: number; eta: number; totalPro3m: number; now: number }): string {
  const done = d.remaining === 0;
  return `<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
${done ? '' : '<meta http-equiv="refresh" content="30">'}
<title>Tiến độ enrich — ${d.pct.toFixed(1)}%</title>
<style>
*{box-sizing:border-box;margin:0} body{font-family:system-ui,Segoe UI,Roboto,sans-serif;background:#0b1220;color:#e2e8f0;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:24px}
.card{background:#13203a;border:1px solid #25406b;border-radius:20px;padding:36px 40px;max-width:560px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.5)}
.h{font-size:14px;letter-spacing:.5px;color:#7c93b8;text-transform:uppercase;margin-bottom:6px}
.big{font-size:64px;font-weight:800;line-height:1;color:#fff;font-variant-numeric:tabular-nums}
.big span{font-size:28px;color:#60a5fa}
.track{height:18px;background:#0b1220;border-radius:10px;overflow:hidden;margin:22px 0 8px;border:1px solid #25406b}
.fill{height:100%;background:linear-gradient(90deg,#2563eb,#22d3ee);width:${d.pct}%;transition:width .6s ease;border-radius:10px}
.row{display:flex;gap:14px;margin-top:18px}
.stat{flex:1;background:#0f1b33;border:1px solid #25406b;border-radius:12px;padding:14px 16px}
.stat .k{font-size:12px;color:#7c93b8}
.stat .v{font-size:22px;font-weight:700;color:#e2e8f0;font-variant-numeric:tabular-nums;margin-top:3px}
.done{background:#064e3b;border-color:#10b981}
.foot{margin-top:20px;font-size:12px;color:#5b7099;text-align:center}
.pulse{display:inline-block;width:9px;height:9px;border-radius:50%;background:#22d3ee;margin-right:6px;animation:p 1.4s infinite}
@keyframes p{0%,100%{opacity:.3}50%{opacity:1}}
</style></head><body><div class="card">
<div class="h">${done ? '✅ Hoàn tất enrich' : '<span class="pulse"></span>Đang enrich placeholder (pro3m)'}</div>
<div class="big">${d.pct.toFixed(1)}<span>%</span></div>
<div class="track"><div class="fill"></div></div>
<div class="row">
<div class="stat ${done ? 'done' : ''}"><div class="k">Đã giải nghĩa</div><div class="v">${d.done.toLocaleString()}</div></div>
<div class="stat"><div class="k">Còn lại</div><div class="v">${d.remaining.toLocaleString()}</div></div>
</div>
<div class="row">
<div class="stat"><div class="k">Tốc độ</div><div class="v">${d.rate ? d.rate.toFixed(1) + ' từ/phút' : '…'}</div></div>
<div class="stat"><div class="k">Còn khoảng</div><div class="v">${d.rate ? fmt(d.eta) : '…'}</div></div>
</div>
<div class="foot">Tổng cần enrich: ${TOTAL.toLocaleString()} · Tổng pro3m: ${d.totalPro3m.toLocaleString()} · Cập nhật ${new Date(d.now).toLocaleTimeString()}${done ? '' : ' · tự làm mới mỗi 30s'}</div>
</div></body></html>`;
}

async function main() {
  if (!WATCH) { await tick(); console.log(`📄 ${HTML_PATH}`); return; }
  console.log('👁️  WATCH mode — Ctrl+C để dừng. Ghi lại HTML mỗi ' + INTERVAL / 1000 + 's.');
  for (;;) {
    let rem = -1;
    try { rem = await tick(); } catch (e: any) { console.error('tick error:', e.message); }
    if (rem === 0) { console.log('✅ Hoàn tất — dừng watcher.'); break; }
    await sleep(INTERVAL);
  }
}
main().catch(e => { console.error('Fatal:', e); process.exit(1); });
