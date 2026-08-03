import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';

function loadEnv(): void {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!match || process.env[match[1]]) continue;
    let value = match[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
}

interface Row {
  word: string;
  image_url: string | null;
  image_source: string | null;
  image_confidence: number | null;
  data: any;
}

function categorize(r: Row): 'high' | 'med' | 'low' | 'unverified' | 'missing' {
  if (!r.image_url || r.image_source === 'none' || r.image_source === 'placeholder') return 'missing';
  const c = r.image_confidence;
  if (c == null) return 'unverified';
  if (c >= 85) return 'high';
  if (c >= 70) return 'med';
  return 'low';
}

async function main() {
  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(url, key);

  console.log('[IELTS Gallery] Loading catalog & dictionary data...');
  const catalog = JSON.parse(readFileSync(path.join(process.cwd(), 'src/data/vocab/catalog-v3.json'), 'utf8'));
  const ieltsTopics = catalog.topics.filter((t: any) => t.routeId === 'ielts');
  const ieltsTopicIds = new Set(ieltsTopics.map((t: any) => t.id));
  const ieltsSubs = catalog.subtopics.filter((s: any) => s.routeId === 'ielts' || ieltsTopicIds.has(s.topicId));

  const wordToSubtopic = new Map<string, string>();
  const allWords = new Set<string>();

  for (const s of ieltsSubs) {
    const packs = catalog.packs.filter((p: any) => p.subtopicId === s.id);
    for (const p of packs) {
      for (const wObj of p.words) {
        const w = wObj.word.trim().toLowerCase();
        allWords.add(w);
        if (!wordToSubtopic.has(w)) {
          wordToSubtopic.set(w, s.title);
        }
      }
    }
  }

  const wordList = [...allWords];
  console.log(`Loaded ${wordList.length} unique IELTS words.`);

  const gdMap = new Map<string, Row>();
  const CHUNK = 300;
  for (let i = 0; i < wordList.length; i += CHUNK) {
    const slice = wordList.slice(i, i + CHUNK);
    const { data, error } = await supabase
      .from('global_dictionary')
      .select('word, image_url, image_source, image_confidence, data')
      .in('word', slice);

    if (!error && data) {
      for (const r of data) {
        gdMap.set(r.word.toLowerCase(), r as Row);
      }
    }
  }

  const items = wordList.map((w) => {
    const r = gdMap.get(w) || {
      word: w,
      image_url: null,
      image_source: 'none',
      image_confidence: null,
      data: null
    };
    const sub = wordToSubtopic.get(w) || 'IELTS Core';
    const m0 = r.data?.results?.[0]?.meanings?.[0] || {};
    const ipa = r.data?.pronunciations?.[0]?.ipa || r.data?.phonetic || '';
    const cat = categorize(r);
    const preMark = cat === 'high' || cat === 'med' ? 'ok' : cat === 'low' || cat === 'missing' ? 'bad' : 'meh';

    return {
      w: r.word,
      sub,
      u: r.image_url || '',
      s: r.image_source || 'none',
      c: r.image_confidence,
      cat,
      mark: preMark,
      p: m0.pos || '',
      d: (m0.definition || '').slice(0, 180),
      i: ipa
    };
  });

  const counts = {
    high: items.filter((x) => x.cat === 'high').length,
    med: items.filter((x) => x.cat === 'med').length,
    low: items.filter((x) => x.cat === 'low').length,
    unverified: items.filter((x) => x.cat === 'unverified').length,
    missing: items.filter((x) => x.cat === 'missing').length
  };

  const subtopicsList = [...new Set(items.map((x) => x.sub))].sort();
  const initMarks: Record<string, 'ok' | 'meh' | 'bad'> = {};
  for (const it of items) initMarks[it.w] = it.mark as 'ok' | 'meh' | 'bad';

  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8"/>
<title>IELTS Image Gallery Review — ${items.length} từ</title>
<style>
  *,*::before,*::after { box-sizing: border-box; }
  body { font-family: system-ui, -apple-system, sans-serif; background:#0f172a; color:#e2e8f0; margin:0; padding:0; }
  header { position: sticky; top:0; background:#1e293b; padding:14px 20px; box-shadow:0 2px 10px #0008; z-index:10; }
  h1 { margin:0 0 8px; font-size:18px; color: #38bdf8; }
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
  .conf.low { background:#dc2626; }
  .conf.unverified { background:#64748b; }
  .img { aspect-ratio: 16/10; background:#0f172a; position:relative; }
  .img img { width:100%; height:100%; object-fit:cover; display:block; }
  .img .src { position:absolute; bottom:4px; right:4px; background:#000c; color:#fff; padding:2px 6px; border-radius:3px; font-size:10px; font-weight:600; }
  .no-img { width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:#475569; font-size:12px; }
  .body { padding:8px 10px 10px; }
  .sub-tag { font-size:10px; color:#38bdf8; font-weight:600; margin-bottom:2px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap; }
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
  <h1>🎓 IELTS Image Review Gallery — <span id="totalAll">${items.length}</span> từ (59 Subtopics)</h1>
  <div class="tabs" id="tabs">
    <button class="tab active" data-tab="all">Tất cả <span class="count">${items.length}</span></button>
    <button class="tab" data-tab="high">🌟 AI Vision Xuất sắc (≥85) <span class="count">${counts.high}</span></button>
    <button class="tab" data-tab="med">✅ AI Vision Tốt (70-84) <span class="count">${counts.med}</span></button>
    <button class="tab" data-tab="low">⚠️ Vision Thấp (<70) <span class="count">${counts.low}</span></button>
    <button class="tab" data-tab="unverified">❓ Chưa Chấm <span class="count">${counts.unverified}</span></button>
    <button class="tab" data-tab="missing">❌ Thiếu ảnh <span class="count">${counts.missing}</span></button>
  </div>
  <div class="controls">
    <label class="stats">Chủ đề (Subtopic): <select id="subFilter">
      <option value="all">Tất cả Subtopic (${subtopicsList.length})</option>
      ${subtopicsList.map((s) => `<option value="${s}">${s}</option>`).join('')}
    </select></label>
    <button id="exportBad">Export danh sách từ cần đổi ảnh (JSON)</button>
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

<div class="footer">
  Thư viện đánh giá chất lượng bộ ảnh 2,899 từ IELTS. Click ✅/🤔/❌ để ghi nhận và xuất file JSON các ảnh cần cập nhật.
</div>

<script>
const ITEMS = ${JSON.stringify(items)};
const INIT_MARKS = ${JSON.stringify(initMarks)};
const PAGE_SIZE = 60;
const LS_KEY = 'ielts.imageReview.marks';

let userMarks = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
let marks = { ...INIT_MARKS, ...userMarks };

let currentTab = 'all';
let currentSub = 'all';
let currentPage = 1;
let filtered = ITEMS;

function applyFilter() {
  filtered = ITEMS.filter(it => {
    if (currentTab !== 'all' && it.cat !== currentTab) return false;
    if (currentSub !== 'all' && it.sub !== currentSub) return false;
    return true;
  });
  document.getElementById('cTotal').textContent = filtered.length;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  document.getElementById('totalPages').textContent = totalPages;
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
    const confClass = it.cat === 'high' ? 'high' : it.cat === 'med' ? 'med' : it.cat === 'low' ? 'low' : 'unverified';
    const confLabel = it.c != null ? String(it.c) : (it.u ? '?' : '∅');
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
          <div class="sub-tag">\${it.sub}</div>
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
  const last = Math.ceil(filtered.length / PAGE_SIZE);
  document.getElementById('prev').disabled = currentPage <= 1;
  document.getElementById('next').disabled = currentPage >= last;
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
document.getElementById('subFilter').onchange = (e) => {
  currentSub = e.target.value;
  currentPage = 1;
  applyFilter();
};
document.getElementById('prev').onclick = () => { if (currentPage>1) { currentPage--; render(); } };
document.getElementById('next').onclick = () => {
  const last = Math.ceil(filtered.length / PAGE_SIZE);
  if (currentPage<last) { currentPage++; render(); }
};
document.getElementById('exportBad').onclick = () => {
  const bad = Object.entries(marks).filter(([_,v]) => v === 'bad').map(([w]) => w);
  const blob = new Blob([JSON.stringify(bad, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'ielts-images-bad-list.json';
  a.click();
};

updateSummary();
applyFilter();
</script>
</body>
</html>`;

  const outPath = path.join(process.cwd(), 'docs/ielts-image-review-gallery.html');
  writeFileSync(outPath, html, 'utf8');
  console.log(`\n🎉 Successfully generated IELTS Image Gallery at: ${outPath}`);
}

main();
