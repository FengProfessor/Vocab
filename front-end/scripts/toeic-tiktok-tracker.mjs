import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

export const DEFAULT_TRACKER_PATH = path.resolve('data/tiktok/toeic-listening-100.json');
export const DEFAULT_CHECKLIST_PATH = path.resolve('docs/tiktok-toeic-100-checklist.md');

const PART_LABELS = {
  1: 'Part 1 · Photographs',
  2: 'Part 2 · Question–Response',
  3: 'Part 3 · Conversations',
  4: 'Part 4 · Short Talks',
};

function nowIso() {
  return new Date().toISOString();
}

export function createCampaign() {
  const episodes = { 1: 0, 2: 0, 3: 0, 4: 0 };
  const videos = Array.from({ length: 100 }, (_, index) => {
    const number = index + 1;
    const part = ((index % 4) + 1);
    episodes[part] += 1;
    return {
      id: `LP-TK-${String(number).padStart(3, '0')}`,
      number,
      part,
      episode: episodes[part],
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

  return {
    campaign: 'LingoPro TOEIC Listening 100',
    version: 1,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    totalVideos: 100,
    questionsPerVideo: 3,
    distribution: { '1': 25, '2': 25, '3': 25, '4': 25 },
    videos,
  };
}

export async function loadCampaign(trackerPath = DEFAULT_TRACKER_PATH) {
  const raw = await readFile(trackerPath, 'utf8');
  return JSON.parse(raw);
}

export async function saveCampaign(campaign, trackerPath = DEFAULT_TRACKER_PATH) {
  campaign.updatedAt = nowIso();
  await mkdir(path.dirname(trackerPath), { recursive: true });
  await writeFile(trackerPath, `${JSON.stringify(campaign, null, 2)}\n`, 'utf8');
}

export function getUsedQuestionIds(campaign, part) {
  return campaign.videos
    .filter((video) => video.part === part && ['rendered', 'posted'].includes(video.status))
    .flatMap((video) => video.questionIds || []);
}

export function getPendingSlots(campaign, part, limit = 1) {
  return campaign.videos
    .filter((video) => video.part === part && video.status === 'todo')
    .slice(0, limit);
}

export async function markRendered({ trackerPath, slotId, questionIds, outputFile }) {
  const campaign = await loadCampaign(trackerPath);
  const slot = campaign.videos.find((video) => video.id === slotId);
  if (!slot) throw new Error(`Không tìm thấy slot ${slotId}.`);
  slot.status = 'rendered';
  slot.questionIds = questionIds;
  slot.outputFile = outputFile;
  slot.renderedAt = nowIso();
  await saveCampaign(campaign, trackerPath);
  return campaign;
}

export async function syncChecklist(campaign, checklistPath = DEFAULT_CHECKLIST_PATH) {
  const rendered = campaign.videos.filter((video) => video.status === 'rendered').length;
  const posted = campaign.videos.filter((video) => video.status === 'posted').length;
  const todo = campaign.videos.filter((video) => video.status === 'todo').length;
  const lines = [
    '# LingoPro · TOEIC Listening · 100 video',
    '',
    `> Tiến độ: **${rendered + posted}/100 đã render** · **${posted}/100 đã đăng** · **${todo}/100 chờ sản xuất**`,
    '',
    'Mỗi video gồm 3 câu. Thứ tự đăng luân phiên P1 → P2 → P3 → P4; mỗi Part có 25 tập.',
    '',
  ];

  for (const part of [1, 2, 3, 4]) {
    lines.push(`## ${PART_LABELS[part]}`, '');
    for (const video of campaign.videos.filter((item) => item.part === part)) {
      const checked = video.status === 'todo' ? ' ' : 'x';
      const postedMark = video.status === 'posted' ? ' · ĐÃ ĐĂNG' : video.status === 'rendered' ? ' · ĐÃ RENDER' : '';
      const file = video.outputFile ? ` · \`${video.outputFile}\`` : '';
      lines.push(`- [${checked}] ${video.id} · P${video.part}-${String(video.episode).padStart(2, '0')}${postedMark}${file}`);
    }
    lines.push('');
  }

  await mkdir(path.dirname(checklistPath), { recursive: true });
  await writeFile(checklistPath, `${lines.join('\n')}\n`, 'utf8');
}

async function cli() {
  const [, , command = 'status', ...argv] = process.argv;
  const args = new Map(argv.map((arg) => {
    const [key, ...rest] = arg.replace(/^--/, '').split('=');
    return [key, rest.join('=') || 'true'];
  }));
  const trackerPath = path.resolve(args.get('tracker') || DEFAULT_TRACKER_PATH);
  const checklistPath = path.resolve(args.get('checklist') || DEFAULT_CHECKLIST_PATH);

  if (command === 'init') {
    const campaign = createCampaign();
    await saveCampaign(campaign, trackerPath);
    await syncChecklist(campaign, checklistPath);
    console.log(`[TOEIC TikTok] Đã tạo campaign 100 video: ${trackerPath}`);
    return;
  }

  const campaign = await loadCampaign(trackerPath);

  if (command === 'mark-posted') {
    const id = args.get('id');
    if (!id) throw new Error('Thiếu --id=LP-TK-001');
    const slot = campaign.videos.find((video) => video.id === id);
    if (!slot) throw new Error(`Không tìm thấy ${id}.`);
    if (slot.status === 'todo') throw new Error(`${id} chưa render, chưa thể đánh dấu posted.`);
    slot.status = 'posted';
    slot.postedAt = nowIso();
    slot.platformUrl = args.get('url') || slot.platformUrl;
    await saveCampaign(campaign, trackerPath);
  }

  await syncChecklist(campaign, checklistPath);
  const counts = campaign.videos.reduce((acc, video) => {
    acc[video.status] = (acc[video.status] || 0) + 1;
    return acc;
  }, {});
  console.log(`[TOEIC TikTok] todo=${counts.todo || 0} rendered=${counts.rendered || 0} posted=${counts.posted || 0}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  cli().catch((error) => {
    console.error('[TOEIC TikTok Tracker]', error);
    process.exit(1);
  });
}
