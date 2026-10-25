import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const phase = process.argv[2] || 'unique';
const baseUrl = process.argv[3] || 'http://localhost:3001';
const mainTrackerPath = path.resolve('data/tiktok/toeic-part1-100.json');
const workerDir = path.resolve('tmp/toeic-p1-workers');

if (!['unique', 'reuse'].includes(phase)) {
  throw new Error('Phase phải là unique hoặc reuse.');
}

const main = JSON.parse(await readFile(mainTrackerPath, 'utf8'));
const response = await fetch(`${baseUrl}/api/toeic/test`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ testId: 'bank', part: '1', limit: '500', mode: 'practice', filterMode: 'all_random' }),
});

if (!response.ok) throw new Error(`Không tải được bank Part 1: HTTP ${response.status}`);
const payload = await response.json();
const allQuestionIds = [...new Set((payload.questions ?? []).map((q) => String(q.id)))].sort();
if (allQuestionIds.length !== 210) {
  throw new Error(`Kỳ vọng 210 câu Part 1, nhận ${allQuestionIds.length}.`);
}

const renderedQuestionIds = new Set(
  main.videos
    .filter((video) => ['rendered', 'posted'].includes(video.status))
    .flatMap((video) => video.questionIds ?? [])
    .map(String)
);

const ranges = phase === 'unique'
  ? [[10, 24], [25, 39], [40, 54], [55, 70]]
  : [[71, 78], [79, 86], [87, 93], [94, 100]];

const sourceIds = phase === 'unique'
  ? allQuestionIds.filter((id) => !renderedQuestionIds.has(id))
  : allQuestionIds;

const requiredQuestions = ranges.map(([start, end]) => (end - start + 1) * 3);
const totalRequired = requiredQuestions.reduce((sum, count) => sum + count, 0);

if (phase === 'unique' && sourceIds.length !== totalRequired) {
  throw new Error(`Unique phase cần ${totalRequired} câu còn lại, nhận ${sourceIds.length}.`);
}
if (phase === 'reuse' && sourceIds.length < totalRequired) {
  throw new Error(`Reuse phase cần ít nhất ${totalRequired} câu, nhận ${sourceIds.length}.`);
}

await mkdir(workerDir, { recursive: true });

let offset = 0;
for (let workerIndex = 0; workerIndex < ranges.length; workerIndex += 1) {
  const [start, end] = ranges[workerIndex];
  const required = requiredQuestions[workerIndex];
  let pool;

  if (phase === 'unique') {
    pool = sourceIds.slice(offset, offset + required);
    offset += required;
  } else {
    const remainingWorkers = ranges.length - workerIndex;
    const remainingIds = sourceIds.length - offset;
    const poolSize = Math.ceil(remainingIds / remainingWorkers);
    pool = sourceIds.slice(offset, offset + poolSize);
    offset += poolSize;
  }

  if (pool.length < required) {
    throw new Error(`Worker ${workerIndex + 1} chỉ có ${pool.length}/${required} câu.`);
  }

  const poolSet = new Set(pool);
  const excludedQuestionIds = allQuestionIds.filter((id) => !poolSet.has(id));
  const videos = main.videos
    .filter((video) => video.number >= start && video.number <= end)
    .map((video) => ({
      ...video,
      status: 'todo',
      questionIds: [],
      outputFile: null,
      renderedAt: null,
      postedAt: null,
      platformUrl: null,
    }));

  const worker = {
    campaign: `LingoPro TOEIC Part 1 · ${phase} · worker ${workerIndex + 1}`,
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    totalVideos: videos.length,
    questionsPerVideo: 3,
    distribution: { '1': videos.length, '2': 0, '3': 0, '4': 0 },
    excludedQuestionIds,
    videos,
  };

  const trackerFile = path.join(workerDir, `${phase}-w${workerIndex + 1}.json`);
  await writeFile(trackerFile, `${JSON.stringify(worker, null, 2)}\n`, 'utf8');
  console.log(`[TOEIC P1] ${phase} w${workerIndex + 1}: video ${start}-${end}, pool=${pool.length}, exclude=${excludedQuestionIds.length}`);
}

