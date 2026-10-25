import { access, mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

const outputDir = path.resolve(process.argv[2] || 'out/tiktok-toeic-100');
const oldNamePattern = /^LP-TK-(\d{3})-P([1-4])-E\d{2}\.mp4$/i;

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

const files = await readdir(outputDir, { withFileTypes: true });
const moved = [];

for (const entry of files) {
  if (!entry.isFile()) continue;

  const match = entry.name.match(oldNamePattern);
  if (!match) continue;

  const [, number, part] = match;
  const partDir = path.join(outputDir, `P${part}`);
  const source = path.join(outputDir, entry.name);
  const target = path.join(partDir, `${number},p${part}.mp4`);

  await mkdir(partDir, { recursive: true });
  if (await exists(target)) {
    throw new Error(`[TOEIC Organize] File đích đã tồn tại: ${target}`);
  }

  await rename(source, target);
  moved.push({ number, part, target });
  console.log(`[TOEIC Organize] ${entry.name} -> P${part}/${number},p${part}.mp4`);
}

const trackerFiles = [
  'data/tiktok/toeic-listening-100.json',
  'tmp/toeic-batch/p1.json',
  'tmp/toeic-batch/p2.json',
  'tmp/toeic-batch/p3.json',
  'tmp/toeic-batch/p4.json',
];

for (const trackerFile of trackerFiles) {
  const trackerPath = path.resolve(trackerFile);
  if (!(await exists(trackerPath))) continue;

  const tracker = JSON.parse(await readFile(trackerPath, 'utf8'));
  let changed = false;

  for (const slot of tracker.slots ?? []) {
    if (!slot.outputFile || !slot.id || !slot.part) continue;
    const number = String(slot.id).replace('LP-TK-', '');
    const nextPath = `out/tiktok-toeic-100/P${slot.part}/${number},p${slot.part}.mp4`;
    if (slot.outputFile === nextPath) continue;

    slot.outputFile = nextPath;
    changed = true;
  }

  if (changed) {
    await writeFile(trackerPath, `${JSON.stringify(tracker, null, 2)}\n`, 'utf8');
    console.log(`[TOEIC Organize] Đã cập nhật tracker: ${trackerFile}`);
  }
}

console.log(`[TOEIC Organize] Hoàn tất: ${moved.length} video.`);
