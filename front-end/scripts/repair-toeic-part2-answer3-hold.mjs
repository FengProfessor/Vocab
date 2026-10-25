import { execFile } from 'node:child_process';
import { readdir, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const targetDir = path.resolve(process.argv[2] || 'out/tiktok-toeic-part2-100/P2');
const holdSeconds = Number(process.argv[3] || 2.5);
const outroSeconds = 3.8;

async function probeDuration(file) {
  const { stdout } = await execFileAsync('ffprobe', [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'default=nw=1:nk=1',
    file,
  ]);
  return Number(stdout.trim());
}

async function repair(file) {
  const duration = await probeDuration(file);
  const splitAt = duration - outroSeconds;
  if (!(splitAt > 1)) throw new Error(`Duration bất thường: ${file} (${duration})`);

  const tmp = `${file}.answer3-fix.mp4`;
  const freezeStart = Math.max(0, splitAt - 0.04);
  const fc = [
    `[0:v]split=3[vmain0][vhold0][vout0]`,
    `[vmain0]trim=end=${splitAt},setpts=PTS-STARTPTS[vmain]`,
    `[vhold0]trim=start=${freezeStart}:end=${splitAt},setpts=PTS-STARTPTS,tpad=stop_mode=clone:stop_duration=${holdSeconds}[vhold]`,
    `[vout0]trim=start=${splitAt},setpts=PTS-STARTPTS[vout]`,
    `[0:a]asplit=2[amain0][aout0]`,
    `[amain0]atrim=end=${splitAt},asetpts=PTS-STARTPTS[amain]`,
    `anullsrc=r=48000:cl=stereo:d=${holdSeconds}[ahold]`,
    `[aout0]atrim=start=${splitAt},asetpts=PTS-STARTPTS[aout]`,
    `[vmain][amain][vhold][ahold][vout][aout]concat=n=3:v=1:a=1[v][a]`,
  ].join(';');

  await execFileAsync('ffmpeg', [
    '-y', '-i', file,
    '-filter_complex', fc,
    '-map', '[v]', '-map', '[a]',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-threads', '4',
    '-pix_fmt', 'yuv420p', '-r', '30',
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
    '-movflags', '+faststart',
    tmp,
  ], { maxBuffer: 1024 * 1024 * 4 });

  await rm(file, { force: true });
  await rename(tmp, file);
  console.log(`[P2 answer3 fix] ${path.basename(file)} +${holdSeconds}s`);
}

const names = (await readdir(targetDir))
  .filter((name) => /^\d{3},p2\.mp4$/i.test(name))
  .sort();

for (const name of names) {
  await repair(path.join(targetDir, name));
}

console.log(`[P2 answer3 fix] Hoàn tất ${names.length} video.`);
