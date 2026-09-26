import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { syncChecklist } from './toeic-tiktok-tracker.mjs';

const phase = process.argv[2] || 'unique';
if (!['unique', 'reuse'].includes(phase)) throw new Error('Phase phải là unique hoặc reuse.');

const mainTrackerPath = path.resolve('data/tiktok/toeic-part1-100.json');
const checklistPath = path.resolve('docs/tiktok-toeic-part1-100-checklist.md');
const workerDir = path.resolve('tmp/toeic-p1-workers');
const main = JSON.parse(await readFile(mainTrackerPath, 'utf8'));

let merged = 0;
for (let workerIndex = 1; workerIndex <= 4; workerIndex += 1) {
  const workerPath = path.join(workerDir, `${phase}-w${workerIndex}.json`);
  const worker = JSON.parse(await readFile(workerPath, 'utf8'));
  const incomplete = worker.videos.filter((video) => !['rendered', 'posted'].includes(video.status));
  if (incomplete.length > 0) {
    throw new Error(`${phase}-w${workerIndex} còn ${incomplete.length} video chưa render.`);
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
await syncChecklist(main, checklistPath);

const rendered = main.videos.filter((video) => ['rendered', 'posted'].includes(video.status));
const questionIds = rendered.flatMap((video) => video.questionIds ?? []);
const uniqueQuestionIds = new Set(questionIds);
console.log(`[TOEIC P1] merged=${merged} rendered=${rendered.length}/100 questions=${questionIds.length} unique=${uniqueQuestionIds.size}`);
