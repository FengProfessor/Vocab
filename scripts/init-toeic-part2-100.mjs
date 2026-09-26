import { access, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const trackerPath = path.resolve('data/tiktok/toeic-part2-100.json');
const checklistPath = path.resolve('docs/tiktok-toeic-part2-100-checklist.md');

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

const now = new Date().toISOString();
const videos = Array.from({ length: 100 }, (_, index) => {
  const number = index + 1;
  return {
    id: `LP-TK-${String(number).padStart(3, '0')}`,
    number,
    part: 2,
    episode: number,
    questionCount: 3,
    status: 'todo',
    questionIds: [],
    outputFile: null,
    renderedAt: null,
    postedAt: null,
    platformUrl: null,
    note: '',
  };
});

const campaign = {
  campaign: 'LingoPro TOEIC Part 2 · 100 videos',
  version: 1,
  createdAt: now,
  updatedAt: now,
  totalVideos: 100,
  questionsPerVideo: 3,
  distribution: { '1': 0, '2': 100, '3': 0, '4': 0 },
  videos,
};

const lines = [
  '# LingoPro · TOEIC Part 2 · 100 video',
  '',
  '> Mỗi video 3 câu Question–Response. 300 câu được chia pool riêng để không lặp giữa các video.',
  '',
  ...videos.map((video) => `- [ ] ${video.id} · P2-${String(video.episode).padStart(3, '0')}`),
  '',
];

await mkdir(path.dirname(trackerPath), { recursive: true });
await mkdir(path.dirname(checklistPath), { recursive: true });
await writeFile(trackerPath, `${JSON.stringify(campaign, null, 2)}\n`, 'utf8');
await writeFile(checklistPath, `${lines.join('\n')}\n`, 'utf8');

console.log(`[TOEIC P2] Tracker: ${trackerPath}`);
console.log('[TOEIC P2] Đã khởi tạo 100 slot, 3 câu/video.');
