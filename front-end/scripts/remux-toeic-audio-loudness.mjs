import { spawn } from 'node:child_process';
import { existsSync, readdirSync, statSync, copyFileSync, unlinkSync } from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
function getArg(key, defaultValue) {
  const index = args.indexOf(key);
  if (index !== -1 && index + 1 < args.length) {
    return args[index + 1];
  }
  return defaultValue;
}

const part = Number(getArg('--part', 1));
const workers = Number(getArg('--workers', 4));
const targetDir = getArg('--dir', `out/tiktok-toeic-part${part}-100/P${part}`);

if (!existsSync(targetDir)) {
  console.error(`Target directory not found: ${targetDir}`);
  process.exit(1);
}

const allFiles = readdirSync(targetDir)
  .filter((f) => f.endsWith('.mp4') && !f.includes('.tmp.'))
  .sort((a, b) => {
    const numA = parseInt(a, 10) || 0;
    const numB = parseInt(b, 10) || 0;
    return numA - numB;
  });

console.log(`[Loudness Normalizer] Found ${allFiles.length} videos in ${targetDir}`);
console.log(`[Loudness Normalizer] Concurrency: ${workers} workers`);

function runCommand(cmd, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    proc.stderr.on('data', (d) => {
      stderr += d.toString();
    });
    proc.on('close', (code) => {
      if (code === 0) resolve({ stderr });
      else reject(new Error(`Command failed with code ${code}: ${stderr.slice(-300)}`));
    });
    proc.on('error', reject);
  });
}

async function remuxVideo(fileName) {
  const inputPath = path.join(targetDir, fileName);
  const tempPath = path.join(targetDir, `${fileName}.tmp.mp4`);

  const ffmpegArgs = [
    '-y',
    '-i', inputPath,
    '-c:v', 'copy',
    '-af', 'dynaudnorm=f=150:g=15:p=0.95:m=10.0:r=0.9',
    '-c:a', 'aac',
    '-b:a', '192k',
    tempPath,
  ];

  await runCommand('ffmpeg', ffmpegArgs);

  const stats = statSync(tempPath);
  if (stats.size < 100000) {
    unlinkSync(tempPath);
    throw new Error(`Temp file too small (${stats.size} bytes) for ${fileName}`);
  }

  // Windows safe overwrite
  copyFileSync(tempPath, inputPath);
  unlinkSync(tempPath);
}

async function main() {
  const startTime = Date.now();
  let completed = 0;
  let failed = 0;

  const queue = [...allFiles];

  async function worker(workerId) {
    while (queue.length > 0) {
      const file = queue.shift();
      if (!file) break;
      try {
        await remuxVideo(file);
        completed += 1;
        if (completed % 10 === 0 || completed === allFiles.length) {
          console.log(`[Worker ${workerId}] Progress: ${completed}/${allFiles.length} (${Math.round((completed / allFiles.length) * 100)}%)`);
        }
      } catch (err) {
        failed += 1;
        console.error(`[Worker ${workerId}] Failed on ${file}: ${err.message}`);
      }
    }
  }

  const workerPromises = Array.from({ length: workers }, (_, i) => worker(i + 1));
  await Promise.all(workerPromises);

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n[Loudness Normalizer] DONE: ${completed} succeeded, ${failed} failed in ${durationSec}s`);

  // Verification step
  console.log('\n[Verification] Checking volume of sample videos...');
  const sampleFiles = ['001,p1.mp4', '012,p1.mp4', '020,p1.mp4', '050,p1.mp4', '100,p1.mp4'].filter(f => allFiles.includes(f));

  for (const sample of sampleFiles) {
    const filePath = path.join(targetDir, sample);
    const { stderr: volOverall } = await runCommand('ffmpeg', ['-i', filePath, '-filter:a', 'volumedetect', '-f', 'null', '-']);
    const { stderr: volSpeech } = await runCommand('ffmpeg', ['-ss', '10', '-to', '25', '-i', filePath, '-filter:a', 'volumedetect', '-f', 'null', '-']);
    
    const maxOverall = volOverall.match(/max_volume:\s*([-\d\.]+)\s*dB/)?.[1];
    const meanOverall = volOverall.match(/mean_volume:\s*([-\d\.]+)\s*dB/)?.[1];
    const maxSpeech = volSpeech.match(/max_volume:\s*([-\d\.]+)\s*dB/)?.[1];
    const meanSpeech = volSpeech.match(/mean_volume:\s*([-\d\.]+)\s*dB/)?.[1];

    console.log(`  -> ${sample}: Speech [Max: ${maxSpeech} dB | Mean: ${meanSpeech} dB] | Overall [Max: ${maxOverall} dB | Mean: ${meanOverall} dB]`);
  }
}

main().catch((err) => {
  console.error('[Fatal Error]', err);
  process.exit(1);
});
