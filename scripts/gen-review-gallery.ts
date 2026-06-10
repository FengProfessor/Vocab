/**
 * [ReviewGallery] Sinh 1 file HTML duy nhất để review TẤT CẢ ảnh đã fill.
 * Features:
 *   - Pagination 50/page, prev/next + jump to page
 *   - Filter theo nguồn (Pexels / DuckDuckGo / Wikipedia / pixabay / pexels-low)
 *   - Click ✅/❌/🤔 → lưu localStorage, summary realtime
 *   - Export ❌ list → tải JSON các từ cần backfill lại
 *   - Lazy load images (loading="lazy")
 *
 * Chạy: cd web-app && npx tsx scripts/gen-review-gallery.ts
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
  data: { results?: Array<{ meanings?: Array<{ pos?: string; definition?: string }> }>; pronunciations?: Array<{ ipa?: string }> } | null;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(url, key);

  console.log('[ReviewGallery] đang tải data từ DB...');

  // Lấy tất cả từ có ảnh thực (KHÔNG skip-function/none/placeholder/null)
  const all: Row[] = [];
  let from = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('global_dictionary')
      .select('word, image_url, image_source, data')
      .not('image_url', 'is', null)
      .not('image_source', 'in', '(skip-function,none,placeholder)')
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
  console.log(`[ReviewGallery] có ${all.length} ảnh để review`);

  // Transform để HTML inline gọn
  const items = all.map((r) => {
    const m0 = r.data?.results?.[0]?.meanings?.[0] || {};
    const ipa = r.data?.pronunciations?.[0]?.ipa || '';
    return {
      w: r.word,
      u: r.image_url!,
      s: r.image_source!,
      p: m0.pos || '',
      d: (m0.definition || '').slice(0, 180),
      i: ipa,
    };
  });

  // Đếm theo nguồn
  const bySource: Record<string, number> = {};
  for (const it of items) bySource[it.s] = (bySource[it.s] || 0) + 1;

  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8"/>
<title>Image Review — ${items.length} ảnh</title>
<style>
  *,*::before,*::after { box-sizing: border-box; }
  body { font-family: system-ui, -apple-system, sans-serif; background:#0f172a; color:#e2e8f0; margin:0; padding:0; }
  header { position: sticky; top:0; background:#1e293b; padding:14px 20px; box-shadow:0 2px 10px #0008; z-index:10; }
  h1 { margin:0 0 6px; font-size:18px; }
  .controls { display:flex; gap:10px; align-items:center; flex-wrap:wrap; font-size:13px; }
  .controls > * { background:#334155; color:#e2e8f0; border:none; padding:6px 12px; border-radius:6px; font-size:13px; cursor:pointer; }
  .controls button:hover, .controls select:hover { background:#475569; }
  .controls input[type=number] { width:80px; }
  .stats { color:#94a3b8; padding: 4px 10px; background:transparent; }
  .stats b { color:#e2e8f0; }
  .summary { margin-left:auto; }
  .summary span { margin: 0 8px; font-weight:600; }
  .grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap:14px; padding:16px; }
  .card { background:#1e293b; border-radius:10px; overflow:hidden; border:2px solid transparent; transition:border-color .15s, transform .15s; }
  .card:hover { transform: translateY(-2px); }
  .card.ok { border-color:#22c55e; }
  .card.bad { border-color:#ef4444; }
  .card.meh { border-color:#eab308; }
  .img { aspect-ratio: 16/10; background:#0f172a; position:relative; }
  .img img { width:100%; height:100%; object-fit:cover; display:block; }
  .img .src { position:absolute; bottom:4px; right:4px; background:#000c; color:#fff; padding:2px 6px; border-radius:3px; font-size:10px; font-weight:600; }
  .body { padding:8px 10px 10px; }
  .word { font-weight:700; font-size:15px; color:#f1f5f9; margin-bottom:2px; }
  .ipa { color:#94a3b8; font-size:11px; font-family: monospace; margin-bottom:4px; }
  .pos { display:inline-block; background:#334155; color:#94a3b8; padding:1px 5px; border-radius:3px; font-size:10px; margin-right:3px; }
  .def { font-size:11px; line-height:1.35; color:#cbd5e1; margin:3px 0 8px; max-height:48px; overflow:hidden; }
  .actions { display:flex; gap:4px; }
  .actions button { flex:1; padding:4px 0; border:none; border-radius:4px; cursor:pointer; font-size:14px; }
  .b-ok { background:#16a34a; color:white; } .b-bad { background:#dc2626; color:white; } .b-meh { background:#ca8a04; color:white; }
  .actions button:hover { opacity:0.85; }
  .footer { padding:30px 20px; text-align:center; color:#64748b; font-size:13px; }
  .pagination { display:flex; gap:8px; align-items:center; justify-content:center; padding:14px; }
  .pagination button { background:#334155; color:#e2e8f0; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-size:13px; }
  .pagination button:disabled { opacity:0.4; cursor:not-allowed; }
  .pagination input { width:60px; text-align:center; background:#0f172a; color:#e2e8f0; border:1px solid #475569; padding:6px; border-radius:4px; }
</style>
</head>
<body>
<header>
  <h1>Review ảnh từ vựng — <span id="total">${items.length}</span> ảnh</h1>
  <div class="controls">
    <label class="stats">Nguồn: <select id="filter">
      <option value="all">Tất cả (${items.length})</option>
      ${Object.entries(bySource).sort((a, b) => b[1] - a[1]).map(([s, c]) => `<option value="${s}">${s} (${c})</option>`).join('')}
    </select></label>
    <label class="stats">Hiện: <select id="reviewed">
      <option value="all">Tất cả</option>
      <option value="unreviewed">Chưa review</option>
      <option value="ok">✅ Đúng</option>
      <option value="bad">❌ Sai</option>
      <option value="meh">🤔 Tạm</option>
    </select></label>
    <button id="exportBad">Export ❌ list (JSON)</button>
    <button id="reset">Xóa marks</button>
    <div class="summary stats">
      ✅ <span id="cOk">0</span> · ❌ <span id="cBad">0</span> · 🤔 <span id="cMeh">0</span> / <span id="cTotal">0</span>
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
  Marks lưu trong localStorage. Click ✅/❌/🤔 để đánh giá.<br>
  Sau khi xong, bấm "Export ❌ list" để tải JSON các từ cần backfill lại.
</div>

<script>
const ITEMS = ${JSON.stringify(items)};
const PAGE_SIZE = 50;
const LS_KEY = 'imageReview.marks.v1';
let marks = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
let currentPage = 1;
let filtered = ITEMS;

function applyFilter() {
  const src = document.getElementById('filter').value;
  const rev = document.getElementById('reviewed').value;
  filtered = ITEMS.filter(it => {
    if (src !== 'all' && it.s !== src) return false;
    const m = marks[it.w];
    if (rev === 'unreviewed' && m) return false;
    if (rev === 'ok' && m !== 'ok') return false;
    if (rev === 'bad' && m !== 'bad') return false;
    if (rev === 'meh' && m !== 'meh') return false;
    return true;
  });
  document.getElementById('cTotal').textContent = filtered.length;
  document.getElementById('totalPages').textContent = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  document.getElementById('totalPagesDup').textContent = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  if (currentPage > Math.ceil(filtered.length / PAGE_SIZE)) currentPage = 1;
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
    return \`
      <div class="card \${m}" data-word="\${it.w}">
        <div class="img">
          <img src="\${it.u}" alt="\${it.w}" loading="lazy" onerror="this.style.opacity=0.3"/>
          <div class="src">\${it.s}</div>
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
  document.getElementById('prev').disabled = currentPage <= 1;
  document.getElementById('next').disabled = currentPage >= Math.ceil(filtered.length / PAGE_SIZE);
  document.getElementById('prev2').disabled = currentPage <= 1;
  document.getElementById('next2').disabled = currentPage >= Math.ceil(filtered.length / PAGE_SIZE);
  window.scrollTo({top:0, behavior:'smooth'});
}

function mark(word, type, btn) {
  if (marks[word] === type) {
    delete marks[word]; // click lại → bỏ mark
  } else {
    marks[word] = type;
  }
  localStorage.setItem(LS_KEY, JSON.stringify(marks));
  const card = btn.closest('.card');
  card.classList.remove('ok','bad','meh');
  if (marks[word]) card.classList.add(marks[word]);
  updateSummary();
}

document.getElementById('filter').onchange = () => { currentPage = 1; applyFilter(); };
document.getElementById('reviewed').onchange = () => { currentPage = 1; applyFilter(); };
document.getElementById('prev').onclick = document.getElementById('prev2').onclick = () => { if (currentPage>1) { currentPage--; render(); } };
document.getElementById('next').onclick = document.getElementById('next2').onclick = () => { if (currentPage<Math.ceil(filtered.length/PAGE_SIZE)) { currentPage++; render(); } };
document.getElementById('page').onchange = (e) => { currentPage = Math.max(1, Math.min(Math.ceil(filtered.length/PAGE_SIZE), parseInt(e.target.value)||1)); render(); };
document.getElementById('exportBad').onclick = () => {
  const bad = Object.entries(marks).filter(([_,v]) => v === 'bad').map(([w]) => w);
  const blob = new Blob([JSON.stringify(bad, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'images-bad-list.json';
  a.click();
};
document.getElementById('reset').onclick = () => {
  if (!confirm('Xóa toàn bộ marks?')) return;
  marks = {};
  localStorage.removeItem(LS_KEY);
  updateSummary();
  applyFilter();
};

updateSummary();
applyFilter();
</script>
</body>
</html>`;

  const out = path.resolve(process.cwd(), 'tmp-image-review.html');
  fs.writeFileSync(out, html, 'utf-8');
  console.log(`[ReviewGallery] file: ${out}`);
  console.log(`[ReviewGallery] mở: file:///${out.replace(/\\/g, '/')}`);
  console.log(`[ReviewGallery] Phân bố nguồn:`);
  for (const [s, c] of Object.entries(bySource).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${s.padEnd(15)} ${c}`);
  }
}

main();
