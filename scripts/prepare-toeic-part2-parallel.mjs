import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const mainTrackerPath = path.resolve('data/tiktok/toeic-part2-100.json');
const catalogPath = path.resolve('src/data/toeic/toeic-catalog-index.json');
const practiceRoot = path.resolve('src/data/toeic/datasets/estudyme_data/practice_parts');
const workerDir = path.resolve('tmp/toeic-p2-workers');

const main = JSON.parse(await readFile(mainTrackerPath, 'utf8'));
const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
const part2Sets = catalog.practiceParts?.['2'] ?? [];
const allQuestionIds = [];

for (const item of part2Sets) {
  const data = JSON.parse(await readFile(path.join(practiceRoot, item.file), 'utf8'));
  let questionNumber = 0;
  for (const card of data.cards ?? []) {
    const subList = Array.isArray(card.childQuestions) && card.childQuestions.length > 0
      ? card.childQuestions
      : [card];
    for (const _question of subList) {
      questionNumber += 1;
      allQuestionIds.push(`q-${item.id}-${questionNumber}`);
    }
  }
}

const uniqueIds = [...new Set(allQuestionIds)];
if (uniqueIds.length < 300) {
  throw new Error(`Kho Part 2 chỉ có ${uniqueIds.length} câu, cần tối thiểu 300.`);
}

const selectedIds = uniqueIds.slice(0, 300);
const ranges = [[1, 25], [26, 50], [51, 75], [76, 100]];
await mkdir(workerDir, { recursive: true });

for (let workerIndex = 0; workerIndex < ranges.length; workerIndex += 1) {
  const [start, end] = ranges[workerIndex];
  const pool = selectedIds.slice(workerIndex * 75, (workerIndex + 1) * 75);
  const poolSet = new Set(pool);
  const excludedQuestionIds = uniqueIds.filter((id) => !poolSet.has(id));
  const videos = main.videos
    .filter((video) => video.number >= start && video.number <= end)
    .map((video) => ({ ...video }));

  const worker = {
    campaign: `LingoPro TOEIC Part 2 · worker ${workerIndex + 1}`,
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    totalVideos: videos.length,
    questionsPerVideo: 3,
    distribution: { '1': 0, '2': videos.length, '3': 0, '4': 0 },
    excludedQuestionIds,
    videos,
  };

  const trackerFile = path.join(workerDir, `w${workerIndex + 1}.json`);
  await writeFile(trackerFile, `${JSON.stringify(worker, null, 2)}\n`, 'utf8');
  console.log(`[TOEIC P2] w${workerIndex + 1}: video ${start}-${end}, pool=${pool.length}, exclude=${excludedQuestionIds.length}`);
}

console.log(`[TOEIC P2] Bank=${uniqueIds.length}, selected=300, workers=4.`);
