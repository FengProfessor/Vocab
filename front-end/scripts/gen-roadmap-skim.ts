/**
 * Sinh file xem nhanh lộ trình — lướt 1 mạch từ A0→B2 + THPT.
 * Chạy: npx tsx scripts/gen-roadmap-skim.ts
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(DIR, '..');
const REPO = path.resolve(ROOT, '..');

function load<T>(rel: string): T {
  return JSON.parse(readFileSync(path.join(ROOT, rel), 'utf8')) as T;
}

const STEP: Record<string, string> = {
  vocab: '📘 Từ vựng',
  grammar: '📗 Ngữ pháp',
  pronunciation: '🎧 Phát âm',
  checkpoint: '🏁 Checkpoint',
  reading: '📖 Đọc hiểu',
  cloze: '📝 Cloze',
  arrange: '🔀 Sắp xếp',
  announcement: '📢 Thông báo',
  leaflet: '📄 Tờ rơi',
  exam: '📋 Đề mini',
};

interface Step { type: string; title: string; wordCount?: number; ref?: string }
interface Unit { title: string; index: number; steps: Step[] }
interface Level { id: string; titleVi: string; description: string; units: Unit[] }
interface Roadmap { levels: Level[] }
interface ExitLevel { canDo: string[]; notYet: string[]; targetLemmas: string; labelVi: string }
interface Exit { levels: Record<string, ExitLevel>; disclaimer: string }
interface Placement {
  version: string;
  rule: { questionsPerLevel: number; passPerLevel: number };
  questions: unknown[];
}

function renderTrack(data: Roadmap, title: string, exit?: Exit): string {
  let md = '';
  let totalSteps = 0;
  let totalWords = 0;
  let totalUnits = 0;
  for (const lv of data.levels) {
    totalUnits += lv.units.length;
    for (const u of lv.units) {
      for (const s of u.steps) {
        totalSteps += 1;
        if (s.type === 'vocab') totalWords += s.wordCount ?? 0;
      }
    }
  }
  md += `# ${title}\n\n`;
  md += `> **File xem nhanh** — lướt từ trên xuống là nắm hết. Cập nhật 2026-07-14.\n\n`;
  md += `| | |\n|--|--|\n`;
  md += `| Cấp | ${data.levels.map((l) => l.id).join(' → ')} |\n`;
  md += `| Chặng | ${totalUnits} |\n`;
  md += `| Bước học | ${totalSteps} |\n`;
  if (totalWords > 0) md += `| Từ vựng (ước trong path) | ~${totalWords} |\n`;
  md += `\n---\n\n`;

  for (const lv of data.levels) {
    const ex = exit?.levels?.[lv.id];
    md += `## ${lv.id} — ${lv.titleVi}\n\n`;
    md += `${lv.description}\n\n`;
    if (ex) {
      md += `**Can-do:** ${ex.canDo.join(' · ')}\n\n`;
      md += `**Chưa gồm:** ${ex.notYet.join(' · ')}\n\n`;
      md += `*${ex.targetLemmas}*\n\n`;
    }
    for (const u of lv.units) {
      md += `### ${u.title}\n\n`;
      for (const s of u.steps) {
        const label = STEP[s.type] ?? s.type;
        const extra = s.wordCount ? ` (${s.wordCount} từ)` : '';
        md += `- ${label}: **${s.title}**${extra}\n`;
      }
      md += `\n`;
    }
    md += `---\n\n`;
  }
  return md;
}

function main(): void {
  const cefr = load<Roadmap>('src/data/roadmap/roadmap-v1.json');
  const thpt = load<Roadmap>('src/data/roadmap/roadmap-thpt-v1.json');
  const exit = load<Exit>('src/data/roadmap/exit-standards-v1.json');
  const place = load<Placement>('src/data/roadmap/placement-v1.json');

  let out = '';
  out += `# LingoPro — XEM NHANH TOÀN BỘ LỘ TRÌNH\n\n`;
  out += `> Mở file này, scroll 1 mạch từ đầu. Không cần vào app.\n\n`;
  out += `## 30 giây nắm ý\n\n`;
  out += `1. Vào app → **Lộ trình** → chọn CEFR hoặc THPT.\n`;
  out += `2. CEFR: placement ~35 câu hoặc tự chọn cấp A0–B2.\n`;
  out += `3. Mỗi chặng: **Từ vựng → Ngữ pháp → (Phát âm) → Checkpoint ≥80%**.\n`;
  out += `4. Free: **A0 + A1**. Pro: **A2 → B2**.\n`;
  out += `5. Đây là **core scaffold**, không phải chứng chỉ CEFR chính thức.\n`;
  out += `6. THPT = ôn **dạng đề 2025** (beta), chưa = full SGK.\n\n`;
  out += `---\n\n`;

  out += renderTrack(cefr, 'Phần 1 — Lộ trình CEFR (A0 → B2)', exit);

  out += `## Placement (xếp cấp)\n\n`;
  out += `- **${place.questions.length} câu** · version \`${place.version}\`\n`;
  out += `- ${place.rule.questionsPerLevel} câu/cấp · đạt ≥${place.rule.passPerLevel}/${place.rule.questionsPerLevel} coi là pass cấp\n`;
  out += `- Chấm hybrid (tổng điểm + floor A0/A1) — tránh 1 lỗi lo âu đẩy về mất gốc\n\n`;
  out += `---\n\n`;

  out += renderTrack(thpt, 'Phần 2 — Luyện thi THPT (beta)');

  out += `## Bài tập có nhiều không?\n\n`;
  out += `| Nguồn | Ước lượng |\n|-------|----------|\n`;
  out += `| Checkpoint CEFR (57 chặng × ~13 câu) | **~700+** câu trộn |\n`;
  out += `| Ngữ pháp DB (62 topic) | **~4000** câu (TB ~66/bài; checkpoint lấy mẫu) |\n`;
  out += `| Phát âm 26 bài × 8 round | **~208** lượt nghe-chọn |\n`;
  out += `| LearnMode ~112 gói × ~12 từ × 2 pha | **~2700** lượt flashcard nếu làm hết path |\n`;
  out += `| Placement | 35 câu |\n\n`;

  out += `## Disclaimer\n\n`;
  out += `${exit.disclaimer}\n\n`;
  out += `---\n\n`;
  out += `*Sinh tự động: \`npx tsx scripts/gen-roadmap-skim.ts\`*\n`;

  const docsDir = path.join(REPO, 'docs', 'roadmap-research');
  mkdirSync(docsDir, { recursive: true });
  const p1 = path.join(docsDir, 'XEM-NHANH-LO-TRINH.md');
  const p2 = path.join(REPO, 'XEM-NHANH-LO-TRINH-LINGOPRO.md');
  writeFileSync(p1, out, 'utf8');
  writeFileSync(p2, out, 'utf8');
  console.log(`[Skim] ${p1}`);
  console.log(`[Skim] ${p2}`);
  console.log(`[Skim] ${out.split('\n').length} dòng`);
}

main();
