/**
 * [CheckImg] Sinh HTML hiển thị grid ảnh + nghĩa để check thủ công.
 * Chạy: cd web-app && npx tsx scripts/gen-check-images-html.ts
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const WORDS_TO_CHECK = [
  'a', 'abandon', 'about', 'above', 'abroad', 'absolutely', 'academic',
  'accept', 'accident', 'according to', 'account', 'accurate', 'acquire',
  'activity', 'actress', 'actual', 'actually', 'adapt', 'additional', 'administration',
];

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(url, key);

  const { data, error } = await supabase
    .from('global_dictionary')
    .select('word, image_url, image_source, data')
    .in('word', WORDS_TO_CHECK);

  if (error) {
    console.error(error);
    process.exit(1);
  }

  // Sort theo thứ tự gốc
  const byWord = Object.fromEntries(data!.map((r) => [r.word, r]));
  const rows = WORDS_TO_CHECK.map((w) => byWord[w]).filter(Boolean);

  const cards = rows.map((r) => {
    const meanings = (r.data?.results?.[0]?.meanings || []) as Array<{ pos?: string; definition?: string }>;
    const m0 = meanings[0] || {};
    const allMeanings = meanings
      .slice(0, 3)
      .map((m) => `<div class="m"><span class="pos">${m.pos || '?'}</span> ${m.definition || '<em>thiếu nghĩa</em>'}</div>`)
      .join('');
    const ipa = r.data?.pronunciations?.[0]?.ipa || '';
    return `
      <div class="card">
        <div class="img-wrap">
          ${r.image_url
            ? `<img src="${r.image_url}" alt="${r.word}" loading="lazy" onerror="this.style.display='none';this.parentElement.classList.add('err')"/>`
            : '<div class="no-img">không có ảnh</div>'}
          <div class="src">${r.image_source}</div>
        </div>
        <div class="body">
          <h3>${r.word} ${ipa ? `<span class="ipa">/${ipa}/</span>` : ''}</h3>
          ${allMeanings || '<em>không có nghĩa</em>'}
          <div class="actions">
            <button class="ok" onclick="mark(this,'ok')">✅ Đúng</button>
            <button class="bad" onclick="mark(this,'bad')">❌ Sai</button>
            <button class="meh" onclick="mark(this,'meh')">🤔 Tạm</button>
          </div>
        </div>
      </div>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8"/>
<title>Check ảnh backfill — 20 từ</title>
<style>
  body { font-family: system-ui, -apple-system, sans-serif; background:#0f172a; color:#e2e8f0; margin:0; padding:24px; }
  h1 { margin:0 0 8px; }
  .stats { color:#94a3b8; margin-bottom: 24px; }
  .grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:20px; }
  .card { background:#1e293b; border-radius:12px; overflow:hidden; border:2px solid transparent; transition:border-color .2s; }
  .card.ok { border-color:#22c55e; }
  .card.bad { border-color:#ef4444; }
  .card.meh { border-color:#eab308; }
  .img-wrap { position:relative; aspect-ratio: 16/10; background:#0f172a; }
  .img-wrap img { width:100%; height:100%; object-fit:cover; display:block; }
  .img-wrap.err::before { content:'⚠ ảnh tải lỗi'; position:absolute; inset:0; display:flex; align-items:center; justify-content:center; color:#fca5a5; }
  .no-img { width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:#475569; }
  .src { position:absolute; bottom:6px; right:6px; background:#000a; color:#fff; padding:2px 8px; border-radius:4px; font-size:11px; }
  .body { padding:12px 16px; }
  h3 { margin:0 0 8px; font-size:18px; color:#f1f5f9; }
  .ipa { color:#94a3b8; font-weight:normal; font-size:14px; font-family: monospace; }
  .m { font-size:13px; margin-bottom:4px; line-height:1.4; color:#cbd5e1; }
  .pos { display:inline-block; background:#334155; color:#94a3b8; padding:1px 6px; border-radius:3px; font-size:11px; margin-right:4px; }
  .actions { display:flex; gap:6px; margin-top:10px; }
  button { flex:1; padding:6px; border:none; border-radius:6px; cursor:pointer; font-size:13px; font-weight:500; }
  .ok { background:#22c55e; color:white; } .bad { background:#ef4444; color:white; } .meh { background:#eab308; color:white; }
  .summary { position:fixed; bottom:20px; right:20px; background:#1e293b; padding:14px 20px; border-radius:10px; box-shadow:0 4px 20px #0008; }
  .summary span { margin: 0 6px; font-weight:600; }
</style>
</head>
<body>
<h1>Check ảnh backfill — 20 từ vừa lấy</h1>
<p class="stats">Click ✅/❌/🤔 để đánh giá. Summary realtime bên dưới phải.</p>
<div class="grid">${cards}</div>
<div class="summary">
  ✅ <span id="ok">0</span> · ❌ <span id="bad">0</span> · 🤔 <span id="meh">0</span> / ${rows.length}
</div>
<script>
function mark(btn, type) {
  const card = btn.closest('.card');
  card.classList.remove('ok','bad','meh');
  card.classList.add(type);
  document.getElementById('ok').textContent = document.querySelectorAll('.card.ok').length;
  document.getElementById('bad').textContent = document.querySelectorAll('.card.bad').length;
  document.getElementById('meh').textContent = document.querySelectorAll('.card.meh').length;
}
</script>
</body>
</html>`;

  const out = path.resolve(process.cwd(), 'tmp-check-images.html');
  fs.writeFileSync(out, html, 'utf-8');
  console.log(`[CheckImg] HTML: ${out}`);
  console.log(`[CheckImg] Mở: file:///${out.replace(/\\/g, '/')}`);
}

main();
