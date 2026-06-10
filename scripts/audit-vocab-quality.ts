import * as path from 'path';
import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Load .env.local
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^\s*([^#=]+)\s*=\s*(.*)$/);
    if (m) {
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      process.env[m[1].trim()] = v;
    }
  });
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error('❌ Thiếu Supabase env'); process.exit(1); }
const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const PLACEHOLDER = '⏳ Click to enrich / Auto-enrich';

// Ký tự nguyên âm có dấu tiếng Việt + đ → nhận diện "nghĩa thực sự là tiếng Việt"
const VIET_RE = /[ăâđêôơưàáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ]/i;
// IPA thật thường chứa ít nhất 1 ký tự phiên âm đặc trưng (ngoài bảng chữ ascii)
const IPA_PHON_RE = /[ɪiːeɛæəɜɑɒɔʊuʌaɐ̃ˈˌθðŋʃʒʤʧtʃdʒçɲʁħʕɣβɸ]/u;

interface Row { word: string; tags: string[] | null; data: any; image_url: string | null; image_source: string | null; image_confidence: number | null; }
interface Audit {
  word: string; ipa: string; pos: string; def: string; example: string;
  synCount: number; antCount: number; img: string | null; imgSource: string; imgConf: number | null;
  isPhrase: boolean; flags: string[];
}

function auditRow(r: Row): Audit {
  const d = r.data || {};
  const ipa = (d.pronunciations?.[0]?.ipa || '').trim();
  const meaning = d.results?.[0]?.meanings?.[0] || {};
  const pos = (meaning.pos || '').trim();
  const def = (meaning.definition || '').trim();
  const example = (meaning.example || '').trim();
  const synCount = Array.isArray(d.synonyms) ? d.synonyms.length : 0;
  const antCount = Array.isArray(d.antonyms) ? d.antonyms.length : 0;
  const imgSource = r.image_source || 'none';
  const wordCount = r.word.trim().split(/\s+/).filter(Boolean).length;
  const ipaTokens = ipa.split(/\s+/).filter(Boolean).length;
  const isPhrase = wordCount >= 2;

  const flags: string[] = [];
  if (!ipa) flags.push('noIPA');
  else if (/n\/a|cannot|provide|unknown|\bAI\b|error|sorry/i.test(ipa) || ipa.length > 40) flags.push('ipaJunk'); // AI ghi rác vào field IPA — KHÔNG tính (r)/(s) optional hợp lệ của Oxford
  else if (!IPA_PHON_RE.test(ipa)) flags.push('ipaSusp'); // toàn ascii → nghi spelling/bịa
  // Cụm ≥3 từ nhưng IPA chỉ vài token → IPA bị cắt cụt / chỉ lấy 1 từ (lỗi nặng của idiom)
  if (isPhrase && wordCount >= 3 && ipaTokens < Math.ceil(wordCount / 2)) flags.push('phraseIpaShort');
  if (!def) flags.push('noDef');
  else if (/click|enrich|⏳/i.test(def)) flags.push('defMarker');
  else if (!VIET_RE.test(def) && def.split(/\s+/).length >= 2) flags.push('defNotViet'); // nghĩa nghi không phải tiếng Việt
  if (!example) flags.push('noExample');
  if (synCount === 0) flags.push('noSyn');
  if (imgSource === 'none' || !r.image_url) flags.push('noImg');

  return { word: r.word, ipa, pos, def, example, synCount, antCount, img: r.image_url, imgSource, imgConf: r.image_confidence, isPhrase, flags };
}

async function main() {
  console.log('🔍 Quét global_dictionary...');
  let from = 0; const size = 1000; const audits: Audit[] = [];
  let totalAll = 0;
  while (true) {
    const { data, error } = await supabase
      .from('global_dictionary')
      .select('word, tags, data, image_url, image_source, image_confidence')
      .range(from, from + size - 1);
    if (error) { console.error('❌', error.message); process.exit(1); }
    if (!data || data.length === 0) break;
    for (const r of data as Row[]) {
      totalAll++;
      const def = (r.data?.results?.[0]?.meanings?.[0]?.definition || '').trim();
      if (!def || def === PLACEHOLDER) continue; // chỉ audit từ ĐÃ có nghĩa
      audits.push(auditRow(r));
    }
    if (data.length < size) break;
    from += size;
  }

  const N = audits.length;
  const pct = (n: number) => `${n} (${((n / N) * 100).toFixed(1)}%)`;
  const count = (f: string) => audits.filter(a => a.flags.includes(f)).length;

  console.log(`\n=== AUDIT ${N} TỪ ĐÃ CÓ NGHĨA (trên tổng ${totalAll}) ===`);
  console.log(`Thiếu IPA            : ${pct(count('noIPA'))}`);
  console.log(`IPA RÁC (N/A,AI,...) : ${pct(count('ipaJunk'))}`);
  console.log(`IPA nghi bịa (ascii) : ${pct(count('ipaSusp'))}`);
  console.log(`Nghĩa nghi KHÔNG-Việt: ${pct(count('defNotViet'))}`);
  console.log(`Sót marker trong nghĩa: ${pct(count('defMarker'))}`);
  console.log(`Thiếu ví dụ          : ${pct(count('noExample'))}`);
  console.log(`Thiếu synonyms       : ${pct(count('noSyn'))}`);
  console.log(`Thiếu ảnh            : ${pct(count('noImg'))}`);
  const clean = audits.filter(a => a.flags.length === 0).length;
  console.log(`SẠCH (0 cờ lỗi)      : ${pct(clean)}`);

  // Soi riêng nhóm cụm từ/idiom — nơi chất lượng kém nhất
  const phrases = audits.filter(a => a.isPhrase);
  const phP = (n: number) => `${n} (${((n / phrases.length) * 100).toFixed(1)}%)`;
  console.log(`\n=== CỤM TỪ / IDIOM: ${phrases.length} cụm ===`);
  console.log(`IPA cắt cụt nghi sai : ${phP(count('phraseIpaShort'))}`);
  console.log(`Nghĩa nghi ko-Việt   : ${phP(phrases.filter(a => a.flags.includes('defNotViet')).length)}`);
  console.log(`Thiếu synonyms       : ${phP(phrases.filter(a => a.flags.includes('noSyn')).length)}`);

  // image_source distribution
  const srcMap = new Map<string, number>();
  for (const a of audits) srcMap.set(a.imgSource, (srcMap.get(a.imgSource) || 0) + 1);
  console.log('\n=== Nguồn ảnh ===');
  for (const [s, c] of [...srcMap.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${s.padEnd(14)} ${c}`);

  // 40 mẫu random để mắt người đọc
  const shuffled = [...audits].sort(() => Math.random() - 0.5);
  console.log('\n=== 40 MẪU NGẪU NHIÊN ===');
  for (const a of shuffled.slice(0, 40)) {
    const fl = a.flags.length ? ` ⚠️[${a.flags.join(',')}]` : '';
    console.log(`• ${a.word}  /${a.ipa}/  (${a.pos}) = ${a.def}  | ex: ${a.example.slice(0, 60)}${fl}`);
  }

  // Ghi HTML cho user tự duyệt toàn bộ
  const json = JSON.stringify(audits).replace(/</g, '\\u003c');
  const html = buildHtml(json, N, {
    noIPA: count('noIPA'), ipaJunk: count('ipaJunk'), ipaSusp: count('ipaSusp'), defNotViet: count('defNotViet'),
    defMarker: count('defMarker'), noExample: count('noExample'), noSyn: count('noSyn'),
    noImg: count('noImg'), clean, phrase: phrases.length, phraseIpaShort: count('phraseIpaShort'),
  });
  const outPath = path.resolve(__dirname, '../../quality-audit.html');
  fs.writeFileSync(outPath, html, 'utf8');
  console.log(`\n📄 Đã ghi HTML: ${outPath}`);
}

function buildHtml(json: string, n: number, stats: Record<string, number>): string {
  return `<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Audit chất lượng từ vựng — ${n} từ</title>
<style>
*{box-sizing:border-box} body{font-family:system-ui,Segoe UI,Roboto,sans-serif;margin:0;background:#0f172a;color:#e2e8f0}
header{position:sticky;top:0;background:#1e293b;padding:14px 18px;box-shadow:0 2px 10px rgba(0,0,0,.4);z-index:10}
h1{font-size:18px;margin:0 0 10px}
.bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.f{cursor:pointer;border:1px solid #334155;background:#0f172a;color:#cbd5e1;padding:6px 10px;border-radius:8px;font-size:13px}
.f.active{background:#2563eb;border-color:#2563eb;color:#fff}
.f .n{opacity:.7;margin-left:4px}
input{background:#0f172a;border:1px solid #334155;color:#e2e8f0;padding:7px 10px;border-radius:8px;font-size:13px;min-width:180px}
#grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px;padding:16px}
.card{background:#1e293b;border:1px solid #334155;border-radius:12px;overflow:hidden;display:flex;flex-direction:column}
.card.bad{border-color:#b91c1c}
.thumb{width:100%;height:150px;object-fit:cover;background:#0b1220}
.noimg{height:150px;display:flex;align-items:center;justify-content:center;color:#475569;font-size:13px;background:#0b1220}
.body{padding:10px 12px;font-size:13px;line-height:1.5}
.w{font-size:16px;font-weight:700;color:#fff}
.ipa{color:#38bdf8;font-family:monospace}
.pos{color:#a78bfa;font-style:italic;font-size:12px}
.def{color:#e2e8f0;margin:4px 0}
.ex{color:#94a3b8;font-size:12px;font-style:italic}
.syn{color:#64748b;font-size:11px;margin-top:4px}
.flags{margin-top:6px;display:flex;flex-wrap:wrap;gap:4px}
.flag{background:#7f1d1d;color:#fecaca;font-size:10px;padding:2px 6px;border-radius:5px}
#count{font-size:13px;color:#94a3b8;margin-left:auto}
</style></head><body>
<header>
<h1>🔍 Audit chất lượng — ${n} từ đã có nghĩa</h1>
<div class="bar">
<span class="f active" data-f="all">Tất cả<span class="n">${n}</span></span>
<span class="f" data-f="noIPA">Thiếu IPA<span class="n">${stats.noIPA}</span></span>
<span class="f" data-f="ipaJunk">IPA rác<span class="n">${stats.ipaJunk}</span></span>
<span class="f" data-f="ipaSusp">IPA nghi bịa<span class="n">${stats.ipaSusp}</span></span>
<span class="f" data-f="defNotViet">Nghĩa ko-Việt<span class="n">${stats.defNotViet}</span></span>
<span class="f" data-f="phrase">Cụm từ<span class="n">${stats.phrase}</span></span>
<span class="f" data-f="phraseIpaShort">IPA cụm sai<span class="n">${stats.phraseIpaShort}</span></span>
<span class="f" data-f="defMarker">Sót marker<span class="n">${stats.defMarker}</span></span>
<span class="f" data-f="noExample">Thiếu ví dụ<span class="n">${stats.noExample}</span></span>
<span class="f" data-f="noSyn">Thiếu synonym<span class="n">${stats.noSyn}</span></span>
<span class="f" data-f="noImg">Thiếu ảnh<span class="n">${stats.noImg}</span></span>
<span class="f" data-f="clean">✅ Sạch<span class="n">${stats.clean}</span></span>
<input id="q" placeholder="🔎 tìm từ...">
<span id="count"></span>
</div></header>
<div id="grid"></div>
<script>
const DATA=${json};
let filter='all',q='';
const grid=document.getElementById('grid'),countEl=document.getElementById('count');
function match(a){
  if(q && !a.word.toLowerCase().includes(q)) return false;
  if(filter==='all') return true;
  if(filter==='clean') return a.flags.length===0;
  if(filter==='phrase') return a.isPhrase;
  return a.flags.includes(filter);
}
function render(){
  const list=DATA.filter(match).slice(0,600);
  countEl.textContent=DATA.filter(match).length+' từ'+(DATA.filter(match).length>600?' (hiện 600 đầu)':'');
  grid.innerHTML=list.map(a=>{
    const img=a.img?\`<img class="thumb" loading="lazy" src="\${a.img}" onerror="this.outerHTML='<div class=noimg>ảnh lỗi</div>'">\`:'<div class="noimg">không có ảnh</div>';
    const flags=a.flags.map(f=>\`<span class="flag">\${f}</span>\`).join('');
    return \`<div class="card \${a.flags.length?'bad':''}">\${img}<div class="body">
    <div class="w">\${a.word} <span class="ipa">/\${a.ipa||'—'}/</span></div>
    <div class="pos">\${a.pos||''}</div>
    <div class="def">\${a.def||'<i>(trống)</i>'}</div>
    <div class="ex">\${a.example||''}</div>
    <div class="syn">syn:\${a.synCount} · ant:\${a.antCount} · img:\${a.imgSource}</div>
    <div class="flags">\${flags}</div></div></div>\`;
  }).join('');
}
document.querySelectorAll('.f').forEach(el=>el.onclick=()=>{
  document.querySelectorAll('.f').forEach(x=>x.classList.remove('active'));
  el.classList.add('active');filter=el.dataset.f;render();
});
document.getElementById('q').oninput=e=>{q=e.target.value.toLowerCase().trim();render();};
render();
</script></body></html>`;
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
