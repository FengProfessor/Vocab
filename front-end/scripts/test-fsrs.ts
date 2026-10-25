/* Kiểm chứng lib/fsrs.ts: learning/relearning steps hoạt động — Quên → phút, không còn nhiều ngày.
 * Chạy: cd web-app && npx tsx scripts/test-fsrs.ts
 */
import { scheduleNext, type FsrsGrade } from '../src/lib/fsrs';

const now = new Date('2026-06-04T09:00:00Z');
const STATE = ['New', 'Learning', 'Review', 'Relearning'];

function delta(iso: string): string {
  const mins = (new Date(iso).getTime() - now.getTime()) / 60000;
  if (mins < 60) return `${mins.toFixed(0)} phút`;
  if (mins < 1440) return `${(mins / 60).toFixed(1)} giờ`;
  return `${(mins / 1440).toFixed(0)} ngày`;
}

console.log('=== THẺ MỚI (chưa học) ===');
for (const [g, name] of [[1, 'Again/Quên'], [3, 'Good/Nhớ'], [4, 'Easy/Dễ']] as const) {
  const r = scheduleNext(null, g as FsrsGrade, now);
  console.log(`${name.padEnd(12)} → ôn sau ${delta(r.next_review_date).padStart(8)} | state=${STATE[r.state]} S=${r.stability.toFixed(2)}`);
}

console.log('\n=== THẺ ĐÃ THUỘC (S=10, ôn đúng hạn sau 10 ngày) ===');
const mature = {
  stability: 10, difficulty: 5, interval_days: 10, review_count: 5,
  state: 2, lapses: 0, learning_steps: 0,
  next_review_date: now.toISOString(),
  last_reviewed_at: new Date(now.getTime() - 10 * 86_400_000).toISOString(),
};
for (const [g, name] of [[1, 'Again/Quên'], [2, 'Hard/Khó'], [3, 'Good/Nhớ'], [4, 'Easy/Dễ']] as const) {
  const r = scheduleNext(mature, g as FsrsGrade, now);
  console.log(`${name.padEnd(12)} → ôn sau ${delta(r.next_review_date).padStart(8)} | state=${STATE[r.state]} S=${r.stability.toFixed(2)} lapses=${r.lapses}`);
}

console.log('\n=== LEGACY (state=0 nhưng đã có S=20) — phải coi là Review, KHÔNG reset ===');
const legacy = { stability: 20, difficulty: 5, interval_days: 20, review_count: 8, state: 0, next_review_date: now.toISOString(), last_reviewed_at: new Date(now.getTime() - 20 * 86_400_000).toISOString() };
const lg = scheduleNext(legacy, 3 as FsrsGrade, now);
console.log(`Good → ôn sau ${delta(lg.next_review_date)} | state=${STATE[lg.state]} S=${lg.stability.toFixed(2)} (S phải > 20, không về ~0)`);

console.log('\n=== CHUỖI QUÊN → 2 bước (10→30 phút) → giãn theo ngày (ôn đúng lúc due) ===');
{
  let card: import('../src/lib/fsrs').SrsRowLike = mature;
  let t = new Date(now);
  const seq: Array<[FsrsGrade, string]> = [[1, 'Quên'], [3, 'Nhớ'], [3, 'Nhớ'], [3, 'Nhớ']];
  for (const [g, nm] of seq) {
    const r = scheduleNext(card, g, t);
    const gap = (new Date(r.next_review_date).getTime() - t.getTime()) / 60000;
    const gapStr = gap < 60 ? `${gap.toFixed(0)} phút` : gap < 1440 ? `${(gap / 60).toFixed(1)} giờ` : `${(gap / 1440).toFixed(0)} ngày`;
    console.log(`${nm.padEnd(6)} → ôn sau ${gapStr.padStart(8)} | state=${STATE[r.state]}`);
    card = r;
    t = new Date(r.next_review_date);
  }
}

console.log('\nKỳ vọng: Quên → 10 phút → (Nhớ) 30 phút → rồi mới giãn theo ngày. Legacy không bị reset.');
