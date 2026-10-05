import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const mainTrackerPath = path.resolve('data/tiktok/toeic-part4-100.json');
const checklistPath = path.resolve('docs/tiktok-toeic-part4-100-checklist.md');
const workerDir = path.resolve('tmp/toeic-p4-workers');

const allowPartial = process.argv.includes('--partial') || process.argv.includes('--allow-partial');
const main = JSON.parse(await readFile(mainTrackerPath, 'utf8'));

let merged = 0;
let totalRendered = 0;

for (let workerIndex = 1; workerIndex <= 4; workerIndex += 1) {
  const workerFile = path.join(workerDir, `w${workerIndex}.json`);
  const worker = JSON.parse(await readFile(workerFile, 'utf8'));
  const incomplete = worker.videos.filter((video) => !['rendered', 'posted'].includes(video.status));

  if (!allowPartial && incomplete.length > 0) {
    throw new Error(`w${workerIndex} còn ${incomplete.length} video chưa render.`);
  }

  for (const workerVideo of worker.videos) {
    const target = main.videos.find((video) => video.id === workerVideo.id);
    if (!target) throw new Error(`Không tìm thấy ${workerVideo.id} trong master tracker.`);

    if (['rendered', 'posted'].includes(workerVideo.status)) {
      Object.assign(target, workerVideo);
      totalRendered += 1;
    }
    merged += 1;
  }
}

main.updatedAt = new Date().toISOString();
await writeFile(mainTrackerPath, `${JSON.stringify(main, null, 2)}\n`, 'utf8');

const lines = [
  '# LingoPro · TOEIC Part 4 · 100 video',
  '',
  `> Tiến độ: **${totalRendered}/100 đã render** · 100 bài nói ngắn (cluster 3 câu liên tiếp) · 300 câu không lặp.`,
  '',
  ...main.videos.map((video) => {
    const isDone = ['rendered', 'posted'].includes(video.status);
    const box = isDone ? '[x]' : '[ ]';
    const file = video.outputFile ? ` · \`${video.outputFile}\`` : '';
    return `- ${box} ${video.id} · P4-${String(video.episode).padStart(3, '0')}${file}`;
  }),
  '',
];
await writeFile(checklistPath, `${lines.join('\n')}\n`, 'utf8');

const questionIds = main.videos
  .filter((v) => ['rendered', 'posted'].includes(v.status))
  .flatMap((video) => video.questionIds ?? []);
const uniqueQuestionIds = new Set(questionIds);

console.log(
  `[TOEIC P4] merged=${merged} rendered=${totalRendered}/100 questions=${questionIds.length} unique=${uniqueQuestionIds.size}`
);

if (!allowPartial) {
  if (totalRendered !== 100) {
    throw new Error(`Kỳ vọng 100 video đã render, nhận ${totalRendered}.`);
  }
  if (questionIds.length !== 300 || uniqueQuestionIds.size !== 300) {
    throw new Error(
      `Kỳ vọng 300 câu không lặp, nhận total=${questionIds.length}, unique=${uniqueQuestionIds.size}.`
    );
  }
}
