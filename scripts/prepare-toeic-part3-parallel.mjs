import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const mainTrackerPath = path.resolve('data/tiktok/toeic-part3-100.json');
const catalogPath = path.resolve('src/data/toeic/toeic-catalog-index.json');
const practiceRoot = path.resolve('src/data/toeic/datasets/estudyme_data/practice_parts');
const workerDir = path.resolve('tmp/toeic-p3-workers');

const main = JSON.parse(await readFile(mainTrackerPath, 'utf8'));
const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
const part3Sets = catalog.practiceParts?.['3'] ?? [];

const allBankQuestionIds = [];
const graphicClusters = [];
const audioOnlyClusters = [];

for (const item of part3Sets) {
  const filePath = path.join(practiceRoot, item.file);
  const data = JSON.parse(await readFile(filePath, 'utf8'));
  let questionNumber = 0;

  for (const card of data.cards ?? []) {
    const subList = Array.isArray(card.childQuestions) && card.childQuestions.length > 0
      ? card.childQuestions
      : [card];

    const clusterQuestionIds = [];
    for (const _question of subList) {
      questionNumber += 1;
      const qId = `q-${item.id}-${questionNumber}`;
      clusterQuestionIds.push(qId);
      allBankQuestionIds.push(qId);
    }

    const hasImage = Boolean(card.image || subList.some((s) => Boolean(s.image)));
    const clusterInfo = {
      setId: item.id,
      cardId: card.id,
      hasImage,
      questionIds: clusterQuestionIds,
    };

    if (hasImage) {
      graphicClusters.push(clusterInfo);
    } else {
      audioOnlyClusters.push(clusterInfo);
    }
  }
}

const uniqueBankIds = [...new Set(allBankQuestionIds)];
console.log(`[TOEIC P3 Bank] Total questions: ${uniqueBankIds.length}, Graphic clusters: ${graphicClusters.length}, Audio clusters: ${audioOnlyClusters.length}`);

if (uniqueBankIds.length < 300) {
  throw new Error(`Kho Part 3 chỉ có ${uniqueBankIds.length} câu, cần tối thiểu 300.`);
}

// 4 workers x 25 videos = 100 clusters (300 questions).
// Distribute 17 graphic clusters: [4, 4, 4, 5] across 4 workers.
// Distribute 83 audio clusters: [21, 21, 21, 20] across 4 workers.
const ranges = [
  { start: 1, end: 25, graphicCount: 4, audioCount: 21 },
  { start: 26, end: 50, graphicCount: 4, audioCount: 21 },
  { start: 51, end: 75, graphicCount: 4, audioCount: 21 },
  { start: 76, end: 100, graphicCount: 5, audioCount: 20 },
];

await mkdir(workerDir, { recursive: true });

let graphicOffset = 0;
let audioOffset = 0;

for (let workerIndex = 0; workerIndex < ranges.length; workerIndex += 1) {
  const { start, end, graphicCount, audioCount } = ranges[workerIndex];

  const assignedGraphic = graphicClusters.slice(graphicOffset, graphicOffset + graphicCount);
  graphicOffset += graphicCount;

  const assignedAudio = audioOnlyClusters.slice(audioOffset, audioOffset + audioCount);
  audioOffset += audioCount;

  const assignedClusters = [...assignedGraphic, ...assignedAudio];
  const poolQuestionIds = assignedClusters.flatMap((c) => c.questionIds);
  const poolSet = new Set(poolQuestionIds);

  const excludedQuestionIds = uniqueBankIds.filter((id) => !poolSet.has(id));

  const videos = main.videos
    .filter((video) => video.number >= start && video.number <= end)
    .map((video) => ({ ...video }));

  const worker = {
    campaign: `LingoPro TOEIC Part 3 · worker ${workerIndex + 1}`,
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    totalVideos: videos.length,
    questionsPerVideo: 3,
    distribution: { '1': 0, '2': 0, '3': videos.length, '4': 0 },
    excludedQuestionIds,
    videos,
  };

  const trackerFile = path.join(workerDir, `w${workerIndex + 1}.json`);
  await writeFile(trackerFile, `${JSON.stringify(worker, null, 2)}\n`, 'utf8');

  console.log(
    `[TOEIC P3] w${workerIndex + 1}: videos ${start}-${end}, clusters=${assignedClusters.length} (graphic=${assignedGraphic.length}, audio=${assignedAudio.length}), poolQs=${poolQuestionIds.length}, exclude=${excludedQuestionIds.length}`
  );
}

console.log(`[TOEIC P3] Bank=${uniqueBankIds.length}, selected=300 (100 clusters), workers=4.`);
