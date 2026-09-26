import { access, copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const sourcePath = path.resolve('tmp/toeic-batch/p1.json');
const trackerPath = path.resolve('data/tiktok/toeic-part1-100.json');
const checklistPath = path.resolve('docs/tiktok-toeic-part1-100-checklist.md');
const outputDir = path.resolve('out/tiktok-toeic-part1-100/P1');

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

if (await exists(trackerPath)) {
  throw new Error(`Tracker đã tồn tại, không reset tiến độ: ${trackerPath}`);
}

const source = JSON.parse(await readFile(sourcePath, 'utf8'));
const seededVideos = source.videos
  .filter((video) => video.part === 1 && ['rendered', 'posted'].includes(video.status) && video.outputFile)
  .sort((a, b) => a.episode - b.episode);

await mkdir(outputDir, { recursive: true });

for (let index = 0; index < seededVideos.length; index += 1) {
  const seeded = seededVideos[index];
  const targetNumber = index + 1;
  const target = path.join(outputDir, `${String(targetNumber).padStart(3, '0')},p1.mp4`);
  await copyFile(path.resolve(seeded.outputFile), target);
}

const now = new Date().toISOString();
const videos = Array.from({ length: 100 }, (_, index) => {
  const number = index + 1;
  const seeded = seededVideos[index];
  const seededOutputFile = seeded
    ? `out/tiktok-toeic-part1-100/P1/${String(number).padStart(3, '0')},p1.mp4`
    : null;
  return {
    id: `LP-TK-${String(number).padStart(3, '0')}`,
    number,
    part: 1,
    episode: number,
    questionCount: 3,
    status: seeded?.status ?? 'todo',
    questionIds: seeded?.questionIds ?? [],
    outputFile: seededOutputFile,
    renderedAt: seeded?.renderedAt ?? null,
    postedAt: seeded?.postedAt ?? null,
    platformUrl: seeded?.platformUrl ?? null,
    note: seeded?.note ?? '',
  };
});

const campaign = {
  campaign: 'LingoPro TOEIC Part 1 · 100 videos',
  version: 1,
  createdAt: now,
  updatedAt: now,
  totalVideos: 100,
  questionsPerVideo: 3,
  distribution: { '1': 100, '2': 0, '3': 0, '4': 0 },
  videos,
};

const lines = [
  '# LingoPro · TOEIC Part 1 · 100 video',
  '',
  '> Mỗi video 3 câu. 70 video đầu ưu tiên câu độc nhất; phần còn lại tái phối câu có kiểm soát.',
  '',
  ...videos.map((video) => {
    const checked = video.status === 'todo' ? ' ' : 'x';
    const file = video.outputFile ? ` · \`${video.outputFile}\`` : '';
    return `- [${checked}] ${video.id} · P1-${String(video.episode).padStart(3, '0')}${file}`;
  }),
  '',
];

await mkdir(path.dirname(trackerPath), { recursive: true });
await mkdir(path.dirname(checklistPath), { recursive: true });
await writeFile(trackerPath, `${JSON.stringify(campaign, null, 2)}\n`, 'utf8');
await writeFile(checklistPath, `${lines.join('\n')}\n`, 'utf8');

console.log(`[TOEIC P1] Tracker: ${trackerPath}`);
console.log(`[TOEIC P1] Đã seed ${seededVideos.length}/100 video P1 hiện có thành tập 001-${String(seededVideos.length).padStart(3, '0')}.`);
