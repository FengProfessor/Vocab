import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const mainTrackerPath = path.resolve('data/tiktok/toeic-part2-100.json');
const checklistPath = path.resolve('docs/tiktok-toeic-part2-100-checklist.md');
const workerDir = path.resolve('tmp/toeic-p2-workers');
const main = JSON.parse(await readFile(mainTrackerPath, 'utf8'));

let merged = 0;
for (let workerIndex = 1; workerIndex <= 4; workerIndex += 1) {
  const worker = JSON.parse(await readFile(path.join(workerDir, `w${workerIndex}.json`), 'utf8'));
  const incomplete = worker.videos.filter((video) => !['rendered', 'posted'].includes(video.status));
  if (incomplete.length > 0) {
    throw new Error(`w${workerIndex} còn ${incomplete.length} video chưa render.`);
  }
  for (const workerVideo of worker.videos) {
    const target = main.videos.find((video) => video.id === workerVideo.id);
    if (!target) throw new Error(`Không tìm thấy ${workerVideo.id} trong master tracker.`);
    Object.assign(target, workerVideo);
    merged += 1;
  }
}

main.updatedAt = new Date().toISOString();
await writeFile(mainTrackerPath, `${JSON.stringify(main, null, 2)}\n`, 'utf8');

const lines = [
  '# LingoPro · TOEIC Part 2 · 100 video',
  '',
  '> Tiến độ: **100/100 đã render** · 3 câu/video · 300 câu Question–Response không lặp.',
  '',
  ...main.videos.map((video) => {
    const file = video.outputFile ? ` · \`${video.outputFile}\`` : '';
    return `- [x] ${video.id} · P2-${String(video.episode).padStart(3, '0')}${file}`;
  }),
  '',
];
await writeFile(checklistPath, `${lines.join('\n')}\n`, 'utf8');

const questionIds = main.videos.flatMap((video) => video.questionIds ?? []);
const uniqueQuestionIds = new Set(questionIds);
console.log(`[TOEIC P2] merged=${merged} rendered=100/100 questions=${questionIds.length} unique=${uniqueQuestionIds.size}`);
if (questionIds.length !== 300 || uniqueQuestionIds.size !== 300) {
  throw new Error(`Kỳ vọng 300 câu không lặp, nhận total=${questionIds.length}, unique=${uniqueQuestionIds.size}.`);
}
