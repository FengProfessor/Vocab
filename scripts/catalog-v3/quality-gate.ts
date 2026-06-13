/**
 * Catalog V3 — quality pipeline. Đọc artifact + global_dictionary (READ-ONLY) → tính:
 *   - meaningCoverage (100% nghĩa vượt kiểm tra lỗi rõ ràng là hard gate)
 *   - imageCoverage (featured ≥90%, extended ≥80%)
 *   - cefrRange (từ data.openVocab nếu đã apply; hiện thường null)
 *   - publishStatus per subtopic/topic/route, quality score, quarantine
 *
 * Ghi:
 *   - src/data/vocab/catalog-v3.quality.json  (API merge với artifact lúc serve — giữ artifact deterministic)
 *   - docs/catalog-v3-quality.md + .json      (báo cáo người đọc)
 *
 * KHÔNG ghi DB. Chạy (web-app/): npx tsx scripts/catalog-v3/quality-gate.ts
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(DIR, '../..');
const ARTIFACT = path.join(ROOT, 'src/data/vocab/catalog-v3.json');
const QUALITY_OUT = path.join(ROOT, 'src/data/vocab/catalog-v3.quality.json');
const REPORT_DIR = path.resolve(ROOT, '../docs');
const REPORT_MD = path.join(REPORT_DIR, 'catalog-v3-quality.md');
const REPORT_JSON = path.join(REPORT_DIR, 'catalog-v3-quality.json');

const IMG_CONF_MIN = 70;
const FEATURED_IMG_GATE = 0.9;
const EXTENDED_IMG_GATE = 0.8;
const SUBTOPIC_MIN = 30;
const SUBTOPIC_MAX = 90;
const MOJIBAKE = /[─-╿]|ß[╗║╔╝┤┐]|├[│¼┤]|─[ä]/;
const VN_CHARS = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;

function loadEnv() {
  const p = path.join(process.cwd(), '.env.local');
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) { let v = m[2]; if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1); process.env[m[1]] = v; }
  }
}

interface Artifact {
  catalogVersion: string;
  routes: { id: string; featured: boolean; title: string; topicIds: string[] }[];
  topics: { id: string; routeId: string; title: string; subtopicIds: string[] }[];
  subtopics: { id: string; topicId: string; routeId: string; title: string; wordCount: number; packIds: string[] }[];
  packs: { id: string; subtopicId: string; words: { word: string }[] }[];
}
interface GdRow { word: string; data: { results?: { meanings?: { definition?: string }[] }[]; openVocab?: { cefr?: string; cefrLevels?: string[]; cefrMin?: string; cefrMax?: string } } | null; image_url: string | null; image_confidence: number | null }

async function main() {
  loadEnv();
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const art = JSON.parse(readFileSync(ARTIFACT, 'utf8')) as Artifact;

  // Map subtopic → từ của nó (qua packs)
  const packsBySub = new Map<string, string[]>();
  for (const p of art.packs) {
    const arr = packsBySub.get(p.subtopicId) ?? [];
    for (const w of p.words) arr.push(w.word);
    packsBySub.set(p.subtopicId, arr);
  }
  const allWords = [...new Set(art.packs.flatMap((p) => p.words.map((w) => w.word)))];

  // Query global_dictionary theo chunk
  const dict = new Map<string, GdRow>();
  const CHUNK = 400;
  for (let i = 0; i < allWords.length; i += CHUNK) {
    const slice = allWords.slice(i, i + CHUNK);
    const { data, error } = await sb.from('global_dictionary').select('word, data, image_url, image_confidence').in('word', slice);
    if (error) throw new Error('global_dictionary query: ' + error.message);
    for (const r of (data ?? []) as GdRow[]) dict.set(r.word.toLowerCase(), r);
  }

  const validMeaning = (r?: GdRow): boolean => {
    const def = r?.data?.results?.[0]?.meanings?.[0]?.definition?.trim();
    if (!def || def.includes('⏳') || MOJIBAKE.test(def)) return false;
    return VN_CHARS.test(def) || !(/[a-z]/i.test(def) && def.split(/\s+/).length >= 3);
  };
  // Ảnh hợp lệ = có URL và (chưa chấm điểm = null → chấp nhận ảnh legacy) hoặc (đã chấm ≥ ngưỡng).
  // Chỉ confidence THẤP RÕ RÀNG (<70) mới bị loại.
  const validImg = (r?: GdRow): boolean => !!r?.image_url && (r.image_confidence == null || r.image_confidence >= IMG_CONF_MIN);
  const CEFR_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  // Mỗi từ có thể có dải cefrMin..cefrMax (đa POS). Lấy cả 2 biên để dải subtopic phủ đúng.
  const cefrBounds = (r?: GdRow): number[] => {
    const ov = r?.data?.openVocab;
    if (!ov) return [];
    const lo = ov.cefrMin ?? ov.cefr;
    const hi = ov.cefrMax ?? ov.cefr;
    return [lo, hi].filter((x): x is string => !!x && CEFR_ORDER.includes(x)).map((x) => CEFR_ORDER.indexOf(x));
  };

  const routeFeatured = new Map(art.routes.map((r) => [r.id, r.featured]));

  const subQuality: Record<string, unknown> = {};
  const quarantine: { type: string; word: string; subtopicId: string; reason: string }[] = [];
  const missingImagesAll: string[] = [];
  let publishedSub = 0, draftSub = 0;

  for (const sub of art.subtopics) {
    const words = packsBySub.get(sub.id) ?? [];
    let meaningOk = 0, imgOk = 0;
    const missingImages: string[] = [];
    const cefrs: number[] = [];
    let coverImage: string | null = null;
    for (const w of words) {
      const r = dict.get(w);
      if (validMeaning(r)) meaningOk++; else quarantine.push({ type: 'word', word: w, subtopicId: sub.id, reason: r ? 'nghĩa rỗng, lỗi mã hóa hoặc chưa dịch rõ ràng' : 'không có trong global_dictionary' });
      if (validImg(r)) { imgOk++; if (!coverImage) coverImage = r!.image_url; } else { missingImages.push(w); }
      cefrs.push(...cefrBounds(r));
    }
    missingImagesAll.push(...missingImages);
    const meaningCov = words.length ? meaningOk / words.length : 0;
    const imgCov = words.length ? imgOk / words.length : 0;
    const imgGate = routeFeatured.get(sub.routeId) ? FEATURED_IMG_GATE : EXTENDED_IMG_GATE;
    const inSubRange = sub.wordCount >= SUBTOPIC_MIN && sub.wordCount <= SUBTOPIC_MAX;
    const cefrRange = cefrs.length ? { min: CEFR_ORDER[Math.min(...cefrs)], max: CEFR_ORDER[Math.max(...cefrs)] } : null;

    // Hard gate publish = TOÀN VẸN NỘI DUNG: 100% nghĩa vượt kiểm tra lỗi rõ ràng + ≥10 từ.
    // Ảnh KHÔNG ẩn subtopic nữa — nó vào qualityScore để xếp hạng nổi bật.
    // featuredEligible = đạt ngưỡng ảnh (featured≥90%/extended≥80%) → ưu tiên hiển thị đầu.
    const published = meaningCov >= 1 && words.length >= 10;
    const status: 'published' | 'draft' | 'quarantine' = meaningCov < 0.5 ? 'quarantine' : published ? 'published' : 'draft';
    const featuredEligible = imgCov >= imgGate;
    if (status === 'published') publishedSub++; else draftSub++;
    const qualityScore = Math.round(100 * (0.5 * meaningCov + 0.4 * imgCov + 0.1 * (inSubRange ? 1 : 0.6)));

    subQuality[sub.id] = {
      publishStatus: status, featuredEligible, qualityScore, meaningCoverage: +meaningCov.toFixed(3), imageCoverage: +imgCov.toFixed(3),
      wordCount: words.length, inSubtopicRange: inSubRange, cefrRange, coverImage,
      missingImageCount: missingImages.length, missingImages: missingImages.slice(0, 50),
      failReasons: [
        meaningCov < 1 ? `nghĩa hợp lệ ${Math.round(meaningCov * 100)}% (<100%) — CHẶN publish` : null,
        imgCov < imgGate ? `ảnh ${Math.round(imgCov * 100)}% (<${Math.round(imgGate * 100)}%) — chưa nổi bật` : null,
        !inSubRange ? `số từ ${sub.wordCount} ngoài ${SUBTOPIC_MIN}-${SUBTOPIC_MAX}` : null,
      ].filter(Boolean),
    };
  }

  // Rollup topic + route
  const topicQuality: Record<string, unknown> = {};
  for (const t of art.topics) {
    const subs = t.subtopicIds.map((id) => subQuality[id] as { publishStatus: string; qualityScore: number });
    const pub = subs.filter((s) => s.publishStatus === 'published').length;
    topicQuality[t.id] = { publishStatus: pub > 0 ? 'published' : 'draft', publishedSubtopics: pub, totalSubtopics: subs.length, qualityScore: subs.length ? Math.round(subs.reduce((a, s) => a + s.qualityScore, 0) / subs.length) : 0 };
  }
  const routeQuality: Record<string, unknown> = {};
  for (const r of art.routes) {
    const subs = art.subtopics.filter((s) => s.routeId === r.id).map((s) => subQuality[s.id] as { publishStatus: string });
    const pub = subs.filter((s) => s.publishStatus === 'published').length;
    routeQuality[r.id] = { publishStatus: pub > 0 ? 'published' : 'draft', publishedSubtopics: pub, totalSubtopics: subs.length };
  }

  const summary = {
    catalogVersion: art.catalogVersion,
    subtopics: art.subtopics.length, publishedSubtopics: publishedSub, draftSubtopics: draftSub,
    words: allWords.length, wordsInDict: [...dict.keys()].length,
    quarantineWords: quarantine.length, missingImages: missingImagesAll.length,
  };

  // Ghi quality file (cho API merge) — KHÔNG kèm timestamp để giảm churn.
  writeFileSync(QUALITY_OUT, JSON.stringify({ catalogVersion: art.catalogVersion, summary, routes: routeQuality, topics: topicQuality, subtopics: subQuality }, null, 2) + '\n', 'utf8');

  // Báo cáo
  if (!existsSync(REPORT_DIR)) mkdirSync(REPORT_DIR, { recursive: true });
  writeFileSync(REPORT_JSON, JSON.stringify({ summary, quarantine: quarantine.slice(0, 500), subtopics: subQuality }, null, 2) + '\n', 'utf8');

  const failing = art.subtopics
    .map((s) => ({ s, q: subQuality[s.id] as { publishStatus: string; failReasons: string[]; qualityScore: number } }))
    .filter((x) => x.q.publishStatus !== 'published')
    .sort((a, b) => a.q.qualityScore - b.q.qualityScore);

  const md = [
    `# Catalog V3 — Quality Report`,
    ``,
    `- catalogVersion: \`${art.catalogVersion}\``,
    `- Subtopic: ${summary.subtopics} · published **${publishedSub}** · draft ${draftSub}`,
    `- Từ: ${summary.words} · trong global_dictionary ${summary.wordsInDict}`,
    `- Quarantine (từ thiếu nghĩa/lỗi mã hóa/chưa dịch rõ ràng/không có dict): **${summary.quarantineWords}**`,
    `- Ảnh thiếu (conf<${IMG_CONF_MIN} hoặc trống): **${summary.missingImages}**`,
    ``,
    `## Subtopic CHƯA đạt publish (${failing.length})`,
    ``,
    `| Quality | Status | Subtopic | Lý do |`,
    `| --- | --- | --- | --- |`,
    ...failing.map((x) => `| ${x.q.qualityScore} | ${x.q.publishStatus} | ${x.s.title} | ${x.q.failReasons.join('; ')} |`),
    ``,
    `> Hard gate publish: 100% nghĩa vượt kiểm tra lỗi rõ ràng (không rỗng, placeholder, mojibake hoặc câu English dài). Ảnh và khoảng 30-90 từ là tín hiệu xếp hạng/cảnh báo mềm.`,
  ].join('\n');
  writeFileSync(REPORT_MD, md + '\n', 'utf8');

  console.log(`[quality] published ${publishedSub}/${summary.subtopics} subtopic · quarantine ${summary.quarantineWords} từ · ảnh thiếu ${summary.missingImages}`);
  console.log(`  → ${QUALITY_OUT}`);
  console.log(`  → ${REPORT_MD}`);
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
