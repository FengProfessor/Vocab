/**
 * [ReviewGalleryV3] Gallery với tabs theo CLIP confidence + auto-pre-marked.
 *
 * Tabs:
 *  - "Vision Cao" (confidence ≥70) — KEEP, pre-mark ✅
 *  - "Vision TB" (50-69) — borderline, pre-mark 🤔
 *  - "Vision Thấp" (15-49 với hậu tố -low) — pre-mark 🤔
 *  - "Đang nghi" (<15) — pre-mark ❌
 *  - "Thiếu ảnh" (none/placeholder, image_url=null) — pre-mark ❌
 *
 * Score CLIP visible trên mỗi card (góc trên-trái).
 * Filter source vẫn còn (dropdown).
 *
 * Chạy: cd web-app && npx tsx scripts/gen-review-gallery-v3.ts
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

interface Row {
  word: string;
  image_url: string | null;
  image_source: string | null;
  image_confidence: number | null;
  data: { results?: Array<{ meanings?: Array<{ pos?: string; definition?: string }> }>; pronunciations?: Array<{ ipa?: string }> } | null;
}

function categorize(r: Row): 'high' | 'med' | 'low' | 'reject' | 'missing' {
  if (!r.image_url || r.image_source === 'none' || r.image_source === 'placeholder') return 'missing';
  const c = r.image_confidence;
  if (c == null) return 'med'; // chưa chấm → trung tính
  if (c >= 70) return 'high';
  if (c >= 50) return 'med';
  if (c >= 15) return 'low';
  return 'reject';
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(url, key);

  console.log('[V3] tải data...');

  // Lấy TẤT CẢ từ, kể cả missing image (để hiển thị tab thiếu)
  const all: Row[] = [];
  let from = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('global_dictionary')
      .select('word, image_url, image_source, image_confidence, data')
      .not('image_source', 'eq', 'skip-function') // bỏ qua function words (icon ở frontend)
      .order('word')
      .range(from, from + PAGE - 1);
    if (error) {
      console.error(error);
      process.exit(1);
    }
    if (!data || data.length === 0) break;
    all.push(...(data as Row[]));
    if (data.length < PAGE) break;
    from += PAGE;
  }
  console.log(`[V3] có ${all.length} từ`);

  // Phân loại + pre-mark
  const items = all.map((r) => {
    const m0 = r.data?.results?.[0]?.meanings?.[0] || {};
    const ipa = r.data?.pronunciations?.[0]?.ipa || '';
    const cat = categorize(r);
    const preMark = cat === 'high' ? 'ok' : cat === 'reject' || cat === 'missing' ? 'bad' : 'meh';
    return {
      w: r.word,
      u: r.image_url || '',
      s: r.image_source || 'none',
      c: r.image_confidence,
      cat,
      mark: preMark,
      p: m0.pos || '',
      d: (m0.definition || '').slice(0, 180),
      i: ipa,
    };
  });

  const counts = {
    high: items.filter((x) => x.cat === 'high').length,
    med: items.filter((x) => x.cat === 'med').length,
    low: items.filter((x) => x.cat === 'low').length,
    reject: items.filter((x) => x.cat === 'reject').length,
    missing: items.filter((x) => x.cat === 'missing').length,
  };

  // Đếm theo nguồn (chỉ cho items có ảnh)
  const bySource: Record<string, number> = {};
  for (const it of items) if (it.u) bySource[it.s] = (bySource[it.s] || 0) + 1;

  // Marks ban đầu (pre-filled)
  const initMarks: Record<string, 'ok' | 'meh' | 'bad'> = {};
  for (const it of items) initMarks[it.w] = it.mark as 'ok' | 'meh' | 'bad';

  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8"/>
<title>Image Review v3 — ${items.length} từ</title>
<style>
  *,*::before,*::after { box-sizing: border-box; }
  body { font-family: system-ui, -apple-system, sans-serif; background:#0f172a; color:#e2e8f0; margin:0; padding:0; }
  header { position: sticky; top:0; background:#1e293b; padding:14px 20px; box-shadow:0 2px 10px #0008; z-index:10; }
  h1 { margin:0 0 8px; font-size:18px; }
  .tabs { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:10px; }
  .tab { padding:8px 14px; background:#334155; border:none; border-radius:8px; cursor:pointer; color:#e2e8f0; font-size:13px; font-weight:600; }
  .tab.active { background:#2563eb; }
  .tab .count { display:inline-block; margin-left:6px; background:#0f172a; padding:1px 8px; border-radius:10px; font-size:11px; }
  .tab.active .count { background:#1e40af; }
  .controls { display:flex; gap:10px; align-items:center; flex-wrap:wrap; font-size:13px; }
  .controls select, .controls button { background:#334155; color:#e2e8f0; border:none; padding:6px 12px; border-radius:6px; font-size:13px; cursor:pointer; }
  .stats { color:#94a3b8; padding: 4px 10px; }
  .stats b { color:#e2e8f0; }
  .summary { margin-left:auto; }
  .summary span { margin: 0 8px; font-weight:600; }
  .grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap:14px; padding:16px; }
  .card { background:#1e293b; border-radius:10px; overflow:hidden; border:2px solid transparent; position: relative; }
  .card.ok { border-color:#22c55e; }
  .card.bad { border-color:#ef4444; }
  .card.meh { border-color:#eab308; }
  .conf { position:absolute; top:6px; left:6px; background:#000c; color:#fff; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:700; z-index:2; }
  .conf.high { background:#16a34a; }
  .conf.med { background:#eab308; color:#000; }
  .conf.low { background:#ea580c; }
  .conf.reject { background:#dc2626; }
  .img { aspect-ratio: 16/10; background:#0f172a; position:relative; }
  .img img { width:100%; height:100%; object-fit:cover; display:block; }
  .img .src { position:absolute; bottom:4px; right:4px; background:#000c; color:#fff; padding:2px 6px; border-radius:3px; font-size:10px; font-weight:600; }
  .no-img { width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:#475569; font-size:12px; }
  .body { padding:8px 10px 10px; }
  .word { font-weight:700; font-size:15px; color:#f1f5f9; margin-bottom:2px; }
  .ipa { color:#94a3b8; font-size:11px; font-family: monospace; margin-bottom:4px; }
  .pos { display:inline-block; background:#334155; color:#94a3b8; padding:1px 5px; border-radius:3px; font-size:10px; margin-right:3px; }
  .def { font-size:11px; line-height:1.35; color:#cbd5e1; margin:3px 0 8px; max-height:48px; overflow:hidden; }
  .actions { display:flex; gap:4px; }
  .actions button { flex:1; padding:4px 0; border:none; border-radius:4px; cursor:pointer; font-size:14px; }
  .b-ok { background:#16a34a; color:white; } .b-bad { background:#dc2626; color:white; } .b-meh { background:#ca8a04; color:white; }
  .pagination { display:flex; gap:8px; align-items:center; justify-content:center; padding:14px; }
  .pagination button { background:#334155; color:#e2e8f0; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; }
  .pagination button:disabled { opacity:0.4; cursor:not-allowed; }
  .pagination input { width:60px; text-align:center; background:#0f172a; color:#e2e8f0; border:1px solid #475569; padding:6px; border-radius:4px; }
  .footer { padding:30px 20px; text-align:center; color:#64748b; font-size:13px; }
</style>
</head>
<body>
<header>
  <h1>Review ảnh v3 — <span id="totalAll">${items.length}</span> từ (loại trừ skip-function)</h1>
  <div class="tabs" id="tabs">
    <button class="tab active" data-tab="all">Tất cả <span class="count">${items.length}</span></button>
    <button class="tab" data-tab="high">✅ Vision Cao (≥70) <span class="count">${counts.high}</span></button>
    <button class="tab" data-tab="med">🟡 Vision TB (50-69) <span class="count">${counts.med}</span></button>
    <button class="tab" data-tab="low">🟠 Vision Thấp (15-49) <span class="count">${counts.low}</span></button>
    <button class="tab" data-tab="reject">❌ Nghi sai (&lt;15) <span class="count">${counts.reject}</span></button>
    <button class="tab" data-tab="missing">⚪ Thiếu ảnh <span class="count">${counts.missing}</span></button>
  </div>
  <div class="controls">
    <label class="stats">Nguồn: <select id="filter">
      <option value="all">Tất cả</option>
      ${Object.entries(bySource).sort((a, b) => b[1] - a[1]).map(([s, c]) => `<option value="${s}">${s} (${c})</option>`).join('')}
    </select></label>
    <button id="exportBad">Export ❌ list (JSON)</button>
    <button id="reset">Reset marks → pre-mark</button>
    <div class="summary stats">
      ✅ <span id="cOk">0</span> · 🤔 <span id="cMeh">0</span> · ❌ <span id="cBad">0</span> / <span id="cTotal">0</span>
    </div>
  </div>
</header>

<div class="pagination">
  <button id="prev">‹ Trước</button>
  <span class="stats">Trang <input type="number" id="page" value="1" min="1"/> / <span id="totalPages">1</span></span>
  <button id="next">Sau ›</button>
</div>

<div class="grid" id="grid"></div>

<div class="pagination">
  <button id="prev2">‹ Trước</button>
  <span class="stats">Trang <span id="pageDup">1</span> / <span id="totalPagesDup">1</span></span>
  <button id="next2">Sau ›</button>
</div>

<div class="footer">
  Marks tự load từ DB confidence. Click ✅/🤔/❌ để override. Lưu localStorage.<br>
  Export ❌ list → tải JSON các từ cần backfill lại.
</div>

<script>
const ITEMS = ${JSON.stringify(items)};
const INIT_MARKS = ${JSON.stringify(initMarks)};
const PAGE_SIZE = 50;
const LS_KEY = 'imageReview.v3.marks';

// Load marks: INIT_MARKS overlay với localStorage user override
let userMarks = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
let marks = { ...INIT_MARKS, ...userMarks };

let currentTab = 'all';
let currentPage = 1;
let filtered = ITEMS;

function applyFilter() {
  const src = document.getElementById('filter').value;
  filtered = ITEMS.filter(it => {
    if (currentTab !== 'all' && it.cat !== currentTab) return false;
    if (src !== 'all' && it.s !== src) return false;
    return true;
  });
  document.getElementById('cTotal').textContent = filtered.length;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  document.getElementById('totalPages').textContent = totalPages;
  document.getElementById('totalPagesDup').textContent = totalPages;
  if (currentPage > totalPages) currentPage = 1;
  render();
}

function updateSummary() {
  let ok=0, bad=0, meh=0;
  for (const k in marks) {
    if (marks[k] === 'ok') ok++;
    else if (marks[k] === 'bad') bad++;
    else if (marks[k] === 'meh') meh++;
  }
  document.getElementById('cOk').textContent = ok;
  document.getElementById('cBad').textContent = bad;
  document.getElementById('cMeh').textContent = meh;
}

function render() {
  const grid = document.getElementById('grid');
  const start = (currentPage - 1) * PAGE_SIZE;
  const slice = filtered.slice(start, start + PAGE_SIZE);
  grid.innerHTML = slice.map(it => {
    const m = marks[it.w] || '';
    const confClass = it.cat === 'high' ? 'high' : it.cat === 'med' ? 'med' : it.cat === 'low' ? 'low' : 'reject';
    const confLabel = it.c != null ? String(it.c) : (it.u ? '—' : '∅');
    return \`
      <div class="card \${m}" data-word="\${it.w}">
        <div class="conf \${confClass}">\${confLabel}</div>
        <div class="img">
          \${it.u
            ? '<img src="' + it.u + '" alt="' + it.w + '" loading="lazy"/>' +
              '<div class="src">' + it.s + '</div>'
            : '<div class="no-img">⚪ chưa có ảnh</div>'}
        </div>
        <div class="body">
          <div class="word">\${it.w} \${it.i ? '<span class="ipa">/' + it.i + '/</span>' : ''}</div>
          \${it.p ? '<span class="pos">' + it.p + '</span>' : ''}
          <div class="def">\${it.d || '<em style="color:#64748b">không có nghĩa</em>'}</div>
          <div class="actions">
            <button class="b-ok" onclick="mark('\${it.w.replace(/'/g, "\\\\'")}','ok',this)">✅</button>
            <button class="b-meh" onclick="mark('\${it.w.replace(/'/g, "\\\\'")}','meh',this)">🤔</button>
            <button class="b-bad" onclick="mark('\${it.w.replace(/'/g, "\\\\'")}','bad',this)">❌</button>
          </div>
        </div>
      </div>\`;
  }).join('');
  document.getElementById('page').value = currentPage;
  document.getElementById('pageDup').textContent = currentPage;
  const last = Math.ceil(filtered.length / PAGE_SIZE);
  document.getElementById('prev').disabled = currentPage <= 1;
  document.getElementById('next').disabled = currentPage >= last;
  document.getElementById('prev2').disabled = currentPage <= 1;
  document.getElementById('next2').disabled = currentPage >= last;
  window.scrollTo({top:0, behavior:'smooth'});
}

function mark(word, type, btn) {
  if (marks[word] === type) {
    delete marks[word];
  } else {
    marks[word] = type;
  }
  userMarks[word] = marks[word];
  localStorage.setItem(LS_KEY, JSON.stringify(userMarks));
  const card = btn.closest('.card');
  card.classList.remove('ok','bad','meh');
  if (marks[word]) card.classList.add(marks[word]);
  updateSummary();
}

document.querySelectorAll('.tab').forEach(t => {
  t.onclick = () => {
    document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    currentTab = t.dataset.tab;
    currentPage = 1;
    applyFilter();
  };
});
document.getElementById('filter').onchange = () => { currentPage = 1; applyFilter(); };
document.getElementById('prev').onclick = document.getElementById('prev2').onclick = () => { if (currentPage>1) { currentPage--; render(); } };
document.getElementById('next').onclick = document.getElementById('next2').onclick = () => {
  const last = Math.ceil(filtered.length / PAGE_SIZE);
  if (currentPage<last) { currentPage++; render(); }
};
document.getElementById('page').onchange = (e) => {
  const last = Math.ceil(filtered.length / PAGE_SIZE);
  currentPage = Math.max(1, Math.min(last, parseInt(e.target.value)||1));
  render();
};
document.getElementById('exportBad').onclick = () => {
  const bad = Object.entries(marks).filter(([_,v]) => v === 'bad').map(([w]) => w);
  const blob = new Blob([JSON.stringify(bad, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'images-bad-list.json';
  a.click();
};
document.getElementById('reset').onclick = () => {
  if (!confirm('Reset marks về CLIP pre-mark? (Xóa user overrides)')) return;
  userMarks = {};
  marks = { ...INIT_MARKS };
  localStorage.removeItem(LS_KEY);
  updateSummary();
  applyFilter();
};

updateSummary();
applyFilter();
</script>
</body>
</html>`;

  const out = path.resolve(process.cwd(), 'tmp-image-review-v3.html');
  fs.writeFileSync(out, html, 'utf-8');
  console.log(`[V3] file: ${out}`);
  console.log(`[V3] phân loại:`);
  console.log(`  ✅ Vision cao (≥70):   ${counts.high}`);
  console.log(`  🟡 Vision TB (50-69):  ${counts.med}`);
  console.log(`  🟠 Vision thấp (15-49): ${counts.low}`);
  console.log(`  ❌ Nghi sai (<15):    ${counts.reject}`);
  console.log(`  ⚪ Thiếu ảnh:         ${counts.missing}`);
}

main();
