import { execSync } from 'node:child_process';
import { existsSync, readdirSync, statSync, readFileSync } from 'node:fs';
import path from 'node:path';

const P3_DIR = 'out/tiktok-toeic-part3-100/P3';
const P4_DIR = 'out/tiktok-toeic-part4-100/P4';

function auditDirectory(dir, partNum) {
  console.log(`\n======================================================`);
  console.log(`🔍 AUDITING PART ${partNum} (${dir})`);
  console.log(`======================================================`);

  if (!existsSync(dir)) {
    console.error(`❌ Directory not found: ${dir}`);
    return;
  }

  const files = readdirSync(dir).filter((f) => f.endsWith('.mp4')).sort();
  console.log(`📁 Total MP4 files: ${files.length}/100`);

  let corrupted = 0;
  let invalidRes = 0;
  let invalidAudio = 0;
  const durations = [];
  const sizesMB = [];

  // Check all 100 files for basic stats
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fullPath = path.join(dir, file);
    const szMB = statSync(fullPath).size / (1024 * 1024);
    sizesMB.push(szMB);

    // Deep check every 10th file + first and last files
    if (i % 10 === 0 || i === files.length - 1) {
      try {
        const cmdV = `ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate,codec_name -of json "${fullPath}"`;
        const vInfo = JSON.parse(execSync(cmdV, { stdio: ['ignore', 'pipe', 'pipe'] }).toString());
        const vStream = vInfo.streams?.[0];

        const cmdA = `ffprobe -v error -select_streams a:0 -show_entries stream=codec_name,sample_rate,channels -of json "${fullPath}"`;
        const aInfo = JSON.parse(execSync(cmdA, { stdio: ['ignore', 'pipe', 'pipe'] }).toString());
        const aStream = aInfo.streams?.[0];

        const cmdD = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${fullPath}"`;
        const dur = parseFloat(execSync(cmdD, { stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim());
        durations.push(dur);

        // Decode test
        const cmdCheck = `ffmpeg -v error -i "${fullPath}" -f null -`;
        const errOutput = execSync(cmdCheck, { stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();

        const isResOk = vStream && vStream.width === 1080 && vStream.height === 1920;
        const isAudioOk = aStream && aStream.channels >= 1 && aStream.codec_name === 'aac';
        if (!isResOk) invalidRes++;
        if (!isAudioOk) invalidAudio++;
        if (errOutput) corrupted++;

        // Audio volume detect
        const cmdVol = `ffmpeg -i "${fullPath}" -filter:a volumedetect -f null -`;
        const volOutput = execSync(cmdVol, { stdio: ['ignore', 'pipe', 'pipe'] }).toString();
        const maxVol = volOutput.match(/max_volume:\s*([-\d\.]+)\s*dB/)?.[1] || 'N/A';
        const meanVol = volOutput.match(/mean_volume:\s*([-\d\.]+)\s*dB/)?.[1] || 'N/A';

        console.log(
          `  ✓ [Sample ${file}] ${vStream?.width}x${vStream?.height} @ ${vStream?.r_frame_rate} | ${aStream?.codec_name} ${aStream?.sample_rate}Hz | ${dur.toFixed(1)}s | ${szMB.toFixed(2)} MB | Vol: ${meanVol}dB (Peak: ${maxVol}dB) | Decode: OK`
        );
      } catch (err) {
        corrupted++;
        console.error(`  ❌ [Error on ${file}]:`, err.message);
      }
    }
  }

  const avgSize = (sizesMB.reduce((a, b) => a + b, 0) / sizesMB.length).toFixed(2);
  const minSize = Math.min(...sizesMB).toFixed(2);
  const maxSize = Math.max(...sizesMB).toFixed(2);
  const avgDur = (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(1);

  console.log(`\n📊 Summary for Part ${partNum}:`);
  console.log(`  - Files count: ${files.length}/100`);
  console.log(`  - File sizes: Min ${minSize} MB | Avg ${avgSize} MB | Max ${maxSize} MB`);
  console.log(`  - Duration (sampled): Avg ${avgDur}s`);
  console.log(`  - Resolution errors: ${invalidRes}`);
  console.log(`  - Audio stream errors: ${invalidAudio}`);
  console.log(`  - Decode/Corruption errors: ${corrupted}`);
}

auditDirectory(P3_DIR, 3);
auditDirectory(P4_DIR, 4);
