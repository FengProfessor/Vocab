import { execFile, spawn } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { promisify } from 'node:util';
import puppeteer from 'puppeteer';

const execFileAsync = promisify(execFile);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function run(command, commandArgs, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, {
      stdio: 'inherit',
      shell: false,
      ...options,
    });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} thoát với mã ${code}`));
    });
  });
}

async function downloadAudio(url, targetPath) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Không tải được audio ${url}: HTTP ${response.status}`);
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  await writeFile(targetPath, bytes);
}

async function analyzePart3Audio(audioPath) {
  try {
    const { stderr } = await execFileAsync('ffmpeg', [
      '-i', audioPath,
      '-af', 'silencedetect=noise=-28dB:d=1.2',
      '-f', 'null', '-'
    ]);
    const silences = [];
    const regex = /silence_end:\s*([\d\.]+)\s*\|\s*silence_duration:\s*([\d\.]+)/g;
    let match;
    while ((match = regex.exec(stderr)) !== null) {
      silences.push({ end: parseFloat(match[1]), duration: parseFloat(match[2]) });
    }
    return silences;
  } catch (err) {
    console.warn('[P3 audio analyze warning]', err.message);
    return [];
  }
}

async function showOverlay(page, { title, subtitle, eyebrow, variant = 'intro', actionText = null }) {
  await page.evaluate(
    ({ overlayTitle, overlaySubtitle, overlayEyebrow, overlayVariant, overlayActionText }) => {
      document.getElementById('lingopro-video-overlay')?.remove();
      const overlay = document.createElement('div');
      overlay.id = 'lingopro-video-overlay';
      overlay.style.position = 'fixed';
      overlay.style.inset = '0';
      overlay.style.zIndex = '2147483647';
      overlay.style.display = 'flex';
      overlay.style.alignItems = 'center';
      overlay.style.justifyContent = 'center';
      overlay.style.padding = '28px 24px';
      overlay.style.pointerEvents = 'none';
      overlay.style.fontFamily = 'var(--font-be-vietnam-pro), var(--font-inter), "Segoe UI", sans-serif';
      overlay.style.textAlign = 'center';
      overlay.style.color = '#ffffff';
      overlay.style.background =
        overlayVariant === 'cta'
          ? 'linear-gradient(160deg, rgba(15,23,42,.97), rgba(6,95,70,.96))'
          : 'linear-gradient(160deg, rgba(15,23,42,.96), rgba(30,41,59,.92))';

      const card = document.createElement('div');
      card.style.width = '100%';
      card.style.maxWidth = '380px';
      card.style.padding = '28px 22px';
      card.style.borderRadius = '24px';
      card.style.background = 'rgba(255,255,255,.08)';
      card.style.border = '1px solid rgba(255,255,255,.14)';
      card.style.boxShadow = '0 24px 70px rgba(0,0,0,.28)';
      card.style.backdropFilter = 'blur(10px)';

      const eyebrowEl = document.createElement('div');
      eyebrowEl.textContent = overlayEyebrow;
      eyebrowEl.style.display = 'inline-flex';
      eyebrowEl.style.alignItems = 'center';
      eyebrowEl.style.justifyContent = 'center';
      eyebrowEl.style.minHeight = '28px';
      eyebrowEl.style.padding = '0 12px';
      eyebrowEl.style.borderRadius = '999px';
      eyebrowEl.style.background = 'rgba(255,255,255,.12)';
      eyebrowEl.style.border = '1px solid rgba(255,255,255,.16)';
      eyebrowEl.style.fontSize = '12px';
      eyebrowEl.style.fontWeight = '600';
      eyebrowEl.style.letterSpacing = '.08em';
      eyebrowEl.style.textTransform = 'uppercase';

      const titleEl = document.createElement('div');
      titleEl.textContent = overlayTitle;
      titleEl.style.marginTop = '18px';
      titleEl.style.fontSize = overlayVariant === 'cta' ? '22px' : '36px';
      titleEl.style.fontWeight = '700';
      titleEl.style.lineHeight = '1.08';
      titleEl.style.letterSpacing = '-.035em';
      titleEl.style.textWrap = 'balance';
      if (overlayVariant === 'cta') {
        titleEl.style.whiteSpace = 'nowrap';
      }

      const subtitleEl = document.createElement('div');
      subtitleEl.textContent = overlaySubtitle;
      subtitleEl.style.marginTop = '14px';
      subtitleEl.style.fontSize = '19px';
      subtitleEl.style.fontWeight = '500';
      subtitleEl.style.lineHeight = '1.4';
      subtitleEl.style.color = 'rgba(255,255,255,.82)';
      subtitleEl.style.letterSpacing = '-.01em';
      subtitleEl.style.textWrap = 'balance';
      if (overlayVariant === 'cta') {
        subtitleEl.style.fontSize = '24px';
        subtitleEl.style.fontWeight = '700';
      }

      card.append(eyebrowEl, titleEl, subtitleEl);
      overlay.appendChild(card);
      document.body.appendChild(overlay);
    },
    {
      overlayTitle: title,
      overlaySubtitle: subtitle,
      overlayEyebrow: eyebrow,
      overlayVariant: variant,
      overlayActionText: actionText,
    }
  );
}

async function hideOverlay(page) {
  await page.evaluate(() => document.getElementById('lingopro-video-overlay')?.remove());
}

async function ensurePart3Stage(page, questionsData) {
  await page.evaluate((data) => {
    document.getElementById('lingopro-part3-stage')?.remove();
    const stage = document.createElement('div');
    stage.id = 'lingopro-part3-stage';
    stage.style.position = 'fixed';
    stage.style.inset = '0';
    stage.style.zIndex = '2147483645';
    stage.style.background = '#0b1220';
    stage.style.fontFamily = 'var(--font-be-vietnam-pro), var(--font-inter), -apple-system, sans-serif';
    stage.style.color = '#f8fafc';
    stage.style.overflow = 'hidden';

    // Header
    const header = document.createElement('div');
    header.style.position = 'absolute';
    header.style.top = '22px';
    header.style.left = '24px';
    header.style.right = '55px';
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';

    const badge = document.createElement('div');
    badge.textContent = '🎧 Part 3 · 3 Câu liên tiếp';
    badge.style.display = 'inline-flex';
    badge.style.alignItems = 'center';
    badge.style.padding = '4px 10px';
    badge.style.borderRadius = '999px';
    badge.style.background = 'rgba(59, 130, 246, 0.15)';
    badge.style.border = '1px solid rgba(59, 130, 246, 0.35)';
    badge.style.fontSize = '11px';
    badge.style.fontWeight = '700';
    badge.style.color = '#60a5fa';
    badge.style.letterSpacing = '0.04em';
    badge.style.textTransform = 'uppercase';

    const brand = document.createElement('div');
    brand.textContent = 'LingoPro';
    brand.style.fontSize = '16px';
    brand.style.fontWeight = '800';
    brand.style.color = '#4ade80';
    brand.style.textShadow = '0 0 12px rgba(74, 222, 128, 0.6)';

    header.append(badge, brand);

    // Audio status bar
    const audioBar = document.createElement('div');
    audioBar.id = 'p3-audio-bar';
    audioBar.style.position = 'absolute';
    audioBar.style.top = '62px';
    audioBar.style.left = '24px';
    audioBar.style.right = '55px';
    audioBar.style.display = 'flex';
    audioBar.style.alignItems = 'center';
    audioBar.style.justifyContent = 'space-between';
    audioBar.style.padding = '7px 12px';
    audioBar.style.borderRadius = '12px';
    audioBar.style.background = 'rgba(30, 41, 59, 0.85)';
    audioBar.style.border = '1px solid rgba(148, 163, 184, 0.18)';

    const waveBox = document.createElement('div');
    waveBox.id = 'p3-wave-container';
    waveBox.style.display = 'flex';
    waveBox.style.alignItems = 'center';
    waveBox.style.gap = '3px';
    waveBox.style.height = '16px';
    for (let i = 0; i < 4; i++) {
      const b = document.createElement('div');
      b.style.width = '3px';
      b.style.height = `${[50, 100, 40, 80][i]}%`;
      b.style.borderRadius = '2px';
      b.style.background = '#4ade80';
      waveBox.appendChild(b);
    }

    const statusText = document.createElement('div');
    statusText.id = 'p3-status-text';
    statusText.textContent = 'Đang nghe hội thoại (Đọc trước 3 câu)...';
    statusText.style.fontSize = '11.5px';
    statusText.style.fontWeight = '600';
    statusText.style.color = '#cbd5e1';

    const timer = document.createElement('div');
    timer.id = 'p3-timer';
    timer.textContent = '00:00';
    timer.style.fontFamily = 'monospace';
    timer.style.fontSize = '13px';
    timer.style.fontWeight = '700';
    timer.style.color = '#4ade80';

    audioBar.append(waveBox, statusText, timer);

    // 3 Questions Container
    const qContainer = document.createElement('div');
    qContainer.id = 'p3-questions-container';
    qContainer.style.position = 'absolute';
    qContainer.style.top = '106px';
    qContainer.style.left = '24px';
    qContainer.style.right = '55px';
    qContainer.style.display = 'flex';
    qContainer.style.flexDirection = 'column';
    qContainer.style.gap = '8px';

    data.forEach((q, idx) => {
      const card = document.createElement('div');
      card.id = `p3-qcard-${idx + 1}`;
      card.style.background = 'rgba(15, 23, 42, 0.92)';
      card.style.border = '1px solid rgba(148, 163, 184, 0.22)';
      card.style.borderRadius = '13px';
      card.style.padding = '8px 11px';
      card.style.transition = 'all 0.25s ease';

      const qHeader = document.createElement('div');
      qHeader.style.display = 'flex';
      qHeader.style.alignItems = 'flex-start';
      qHeader.style.gap = '7px';
      qHeader.style.marginBottom = '5px';

      const qNum = document.createElement('div');
      qNum.id = `p3-qnum-${idx + 1}`;
      qNum.textContent = `Q${idx + 1}`;
      qNum.style.flexShrink = '0';
      qNum.style.width = '22px';
      qNum.style.height = '22px';
      qNum.style.borderRadius = '6px';
      qNum.style.background = 'rgba(255, 255, 255, 0.1)';
      qNum.style.display = 'flex';
      qNum.style.alignItems = 'center';
      qNum.style.justifyContent = 'center';
      qNum.style.fontSize = '10.5px';
      qNum.style.fontWeight = '800';
      qNum.style.color = '#94a3b8';

      const qPrompt = document.createElement('div');
      qPrompt.textContent = q.prompt;
      qPrompt.style.fontSize = '12px';
      qPrompt.style.fontWeight = '650';
      qPrompt.style.lineHeight = '1.3';
      qPrompt.style.color = '#f1f5f9';

      qHeader.append(qNum, qPrompt);

      const optsGrid = document.createElement('div');
      optsGrid.style.display = 'flex';
      optsGrid.style.flexDirection = 'column';
      optsGrid.style.gap = '3.5px';
      optsGrid.style.paddingLeft = '28px';

      (q.options || []).forEach((opt) => {
        const row = document.createElement('div');
        row.id = `p3-opt-${idx + 1}-${opt.key}`;
        row.style.display = 'flex';
        row.style.alignItems = 'flex-start';
        row.style.gap = '6px';
        row.style.padding = '3px 7px';
        row.style.borderRadius = '6px';
        row.style.background = 'rgba(255, 255, 255, 0.04)';
        row.style.border = '1px solid rgba(148, 163, 184, 0.12)';
        row.style.fontSize = '10.5px';
        row.style.color = '#cbd5e1';

        const k = document.createElement('span');
        k.textContent = opt.key;
        k.style.flexShrink = '0';
        k.style.fontWeight = '750';
        k.style.color = '#94a3b8';
        k.style.fontSize = '10px';
        k.style.width = '12px';
        k.style.lineHeight = '1.4';

        const t = document.createElement('span');
        t.textContent = opt.text;
        t.style.lineHeight = '1.3';
        t.style.wordBreak = 'break-word';

        row.append(k, t);
        optsGrid.appendChild(row);
      });

      card.append(qHeader, optsGrid);
      qContainer.appendChild(card);
    });

    stage.append(header, audioBar, qContainer);
    document.body.appendChild(stage);
  }, questionsData);
}

async function updatePart3Highlight(page, { activeQuestionIndex, revealedAnswers = {}, statusText, timerText }) {
  await page.evaluate(({ activeIdx, revealed, status, timerVal }) => {
    if (status) {
      const st = document.getElementById('p3-status-text');
      if (st) st.textContent = status;
    }
    if (timerVal) {
      const tm = document.getElementById('p3-timer');
      if (tm) tm.textContent = timerVal;
    }

    [1, 2, 3].forEach((idx) => {
      const card = document.getElementById(`p3-qcard-${idx}`);
      const num = document.getElementById(`p3-qnum-${idx}`);
      if (!card || !num) return;

      if (idx === activeIdx) {
        card.style.borderColor = '#38bdf8';
        card.style.boxShadow = '0 0 16px rgba(56, 189, 248, 0.25)';
        card.style.background = 'rgba(30, 41, 59, 0.95)';
        num.style.background = '#0284c7';
        num.style.color = '#fff';
      } else {
        card.style.borderColor = 'rgba(148, 163, 184, 0.22)';
        card.style.boxShadow = 'none';
        card.style.background = 'rgba(15, 23, 42, 0.92)';
        num.style.background = 'rgba(255, 255, 255, 0.1)';
        num.style.color = '#94a3b8';
      }

      // Check revealed answer
      const correctKey = revealed[idx];
      if (correctKey) {
        const correctRow = document.getElementById(`p3-opt-${idx}-${correctKey}`);
        if (correctRow) {
          correctRow.style.background = '#15803d';
          correctRow.style.borderColor = '#4ade80';
          correctRow.style.color = '#ffffff';
          correctRow.style.fontWeight = '700';
          correctRow.style.boxShadow = '0 0 8px rgba(74, 222, 128, 0.4)';
          const k = correctRow.querySelector('span');
          if (k) k.style.color = '#ffffff';
          if (!correctRow.querySelector('.check-mark')) {
            const cm = document.createElement('span');
            cm.className = 'check-mark';
            cm.textContent = ' ✓';
            cm.style.color = '#bbf7d0';
            correctRow.appendChild(cm);
          }
        }
      }
    });
  }, { activeIdx: activeQuestionIndex, revealed: revealedAnswers, status: statusText, timerVal: timerText });
}

async function showPart3TranscriptReview(page, rawTranscript) {
  await page.evaluate((transcript) => {
    const qContainer = document.getElementById('p3-questions-container');
    const audioBar = document.getElementById('p3-audio-bar');
    if (audioBar) audioBar.style.display = 'none';
    if (!qContainer) return;

    qContainer.replaceChildren();
    qContainer.style.top = '62px';

    const card = document.createElement('div');
    card.style.background = 'rgba(15, 23, 42, 0.95)';
    card.style.border = '1px solid rgba(148, 163, 184, 0.22)';
    card.style.borderRadius = '14px';
    card.style.padding = '14px 16px';

    const cardTitle = document.createElement('div');
    cardTitle.textContent = '🎧 Transcript Đoạn Hội Thoại';
    cardTitle.style.fontSize = '14px';
    cardTitle.style.fontWeight = '800';
    cardTitle.style.color = '#f8fafc';
    cardTitle.style.marginBottom = '8px';

    const dialogue = document.createElement('div');
    dialogue.style.fontSize = '11.5px';
    dialogue.style.lineHeight = '1.55';
    dialogue.style.color = '#cbd5e1';

    // Clean and highlight transcript
    let clean = (transcript || '')
      .replace(/<p><strong>Transcript:<\/strong><\/p>/gi, '')
      .replace(/&rsquo;/g, "'")
      .replace(/&lsquo;/g, "'")
      .replace(/&rdquo;/g, '"')
      .replace(/&ldquo;/g, '"')
      .replace(/&amp;/g, '&')
      .trim();

    clean = clean.replace(
      /<b>\s*Q1\s*([^<]+)<\/b>/gi,
      '<span style="background:rgba(34,197,94,.2);color:#86efac;padding:1px 4px;border-radius:4px;border-bottom:1.5px solid #22c55e;font-weight:650;"><span style="font-size:9.5px;font-weight:800;padding:1px 4px;border-radius:3px;background:#15803d;color:#fff;margin-right:2px;">Q1</span>$1</span>'
    );
    clean = clean.replace(
      /<b>\s*Q2\s*([^<]+)<\/b>/gi,
      '<span style="background:rgba(234,179,8,.2);color:#fde047;padding:1px 4px;border-radius:4px;border-bottom:1.5px solid #eab308;font-weight:650;"><span style="font-size:9.5px;font-weight:800;padding:1px 4px;border-radius:3px;background:#a16207;color:#fff;margin-right:2px;">Q2</span>$1</span>'
    );
    clean = clean.replace(
      /<b>\s*Q3\s*([^<]+)<\/b>/gi,
      '<span style="background:rgba(168,85,247,.2);color:#d8b4fe;padding:1px 4px;border-radius:4px;border-bottom:1.5px solid #a855f7;font-weight:650;"><span style="font-size:9.5px;font-weight:800;padding:1px 4px;border-radius:3px;background:#7e22ce;color:#fff;margin-right:2px;">Q3</span>$1</span>'
    );
    clean = clean.replace(/(M|W|Man|Woman):/g, '<span style="font-weight:750;color:#93c5fd;">$1:</span>');

    dialogue.innerHTML = clean;
    card.append(cardTitle, dialogue);

    const tipBox = document.createElement('div');
    tipBox.style.background = 'rgba(30, 41, 59, 0.7)';
    tipBox.style.border = '1px solid rgba(148, 163, 184, 0.18)';
    tipBox.style.borderRadius = '10px';
    tipBox.style.padding = '8px 12px';
    tipBox.style.fontSize = '11px';
    tipBox.style.lineHeight = '1.45';
    tipBox.style.color = '#94a3b8';
    tipBox.innerHTML = '<strong style="color:#f1f5f9;">💡 Bí kíp Part 3:</strong> Vị trí đáp án thường xuất hiện tuần tự theo mạch hội thoại (Đầu ➔ Giữa ➔ Cuối). Hãy đọc trước câu hỏi để định vị manh mối!';

    qContainer.append(card, tipBox);
  }, rawTranscript);
}

async function muxAudio(videoPath, audioEvents, finalPath, tempDir, videoRate = 1) {
  const videoFilter = videoRate > 1
    ? `setpts=${videoRate}*PTS,fps=30,scale=1080:1920:flags=lanczos`
    : 'scale=1080:1920:flags=lanczos';
  if (audioEvents.length === 0) {
    await run('ffmpeg', [
      '-y', '-i', videoPath,
      '-vf', videoFilter,
      '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-threads', '4',
      '-pix_fmt', 'yuv420p', '-an',
      finalPath,
    ]);
    return;
  }

  const inputArgs = ['-y', '-i', videoPath];
  const filters = [];
  const mixLabels = [];

  for (let index = 0; index < audioEvents.length; index += 1) {
    const event = audioEvents[index];
    const audioPath = path.join(tempDir, `audio-${index + 1}.mp3`);
    await downloadAudio(event.src, audioPath);
    inputArgs.push('-i', audioPath);
    const label = `a${index + 1}`;
    const delay = Math.max(0, Math.round(event.offsetMs));
    filters.push(`[${index + 1}:a]adelay=${delay}|${delay},volume=1[${label}]`);
    mixLabels.push(`[${label}]`);
  }

  filters.push(
    `${mixLabels.join('')}amix=inputs=${mixLabels.length}:duration=longest:dropout_transition=0,apad[aout]`
  );

  await run('ffmpeg', [
    ...inputArgs,
    '-filter_complex', filters.join(';'),
    '-map', '0:v:0',
    '-map', '[aout]',
    '-vf', videoFilter,
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-threads', '4',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '192k',
    '-shortest',
    '-movflags', '+faststart',
    finalPath,
  ]);
}

async function createStillSegment(imagePath, durationSeconds, outputPath, options = {}) {
  const filterGraph = 'fps=30,scale=1080:1920:flags=lanczos';
  if (options.audioPath) {
    const gain = options.audioGain || 1;
    await run('ffmpeg', [
      '-y',
      '-loop', '1',
      '-t', String(durationSeconds),
      '-i', imagePath,
      '-i', options.audioPath,
      '-filter_complex', `[0:v]${filterGraph}[v];[1:a]volume=${gain},apad=whole_dur=${durationSeconds}[a]`,
      '-map', '[v]',
      '-map', '[a]',
      '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-threads', '4',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
      '-shortest',
      outputPath,
    ]);
  } else {
    await run('ffmpeg', [
      '-y',
      '-loop', '1',
      '-t', String(durationSeconds),
      '-i', imagePath,
      '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo',
      '-vf', filterGraph,
      '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-threads', '4',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
      '-shortest',
      outputPath,
    ]);
  }
}

async function concatSegments(segmentPaths, finalPath) {
  const listFile = path.resolve('tmp/p3_concat.txt');
  const content = segmentPaths
    .map((filePath) => `file '${filePath.replaceAll('\\', '/')}'`)
    .join('\n');
  await writeFile(listFile, `${content}\n`, 'utf8');

  await run('ffmpeg', [
    '-y',
    '-f', 'concat',
    '-safe', '0',
    '-i', listFile,
    '-c', 'copy',
    finalPath,
  ]);
  await rm(listFile, { force: true });
}

// ── Test Runner ──
async function main() {
  const baseUrl = 'http://localhost:3000';
  const outDir = path.resolve('out/p3_test_run');
  await mkdir(outDir, { recursive: true });

  console.log('[P3 Prototype] Fetching a Part 3 question cluster from local API...');
  const testRes = await fetch(`${baseUrl}/api/toeic/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ testId: 'bank', part: '3', limit: '3', mode: 'practice', filterMode: 'all_random' }),
  });
  if (!testRes.ok) throw new Error(`API failed: HTTP ${testRes.status}`);
  const testPayload = await testRes.json();
  const questions = testPayload.clusters?.[0]?.questions || testPayload.questions?.slice(0, 3) || [];
  const sessionToken = testPayload.sessionToken || '';

  if (questions.length < 3) throw new Error('Cần 3 câu hỏi Part 3.');
  console.log(`[P3 Prototype] Got 3 questions: ${questions.map(q => q.id).join(', ')}`);

  // Pre-fetch explanations
  const explanations = await Promise.all(
    questions.map(async (q) => {
      const r = await fetch(`${baseUrl}/api/toeic/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testId: 'bank', questionId: q.id, part: 3, sessionToken }),
      });
      return await r.json();
    })
  );

  const questionsData = questions.map((q, idx) => ({
    num: idx + 1,
    id: q.id,
    prompt: q.prompt,
    options: q.options || [],
    correctAnswer: explanations[idx]?.correctAnswer || 'A',
  }));

  const transcript = explanations.find(e => e.transcript)?.transcript || '';
  const audioUrl = questions[0]?.audioUrl;
  console.log(`[P3 Prototype] Audio URL: ${audioUrl}`);

  // Download & Analyze Audio Silences
  const tempAudio = path.join(outDir, 'source_audio.mp3');
  await downloadAudio(audioUrl, tempAudio);
  const silences = await analyzePart3Audio(tempAudio);
  console.log(`[P3 Prototype] Detected ${silences.length} silences:`, silences);

  // Puppeteer Setup
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 450, height: 800, deviceScaleFactor: 2.4 });

  const rawVideo = path.join(outDir, 'screen.webm');
  const coreVideo = path.join(outDir, 'core.mp4');
  const introImage = path.join(outDir, 'intro.png');
  const outroImage = path.join(outDir, 'outro.png');
  const introVideo = path.join(outDir, 'intro.mp4');
  const outroVideo = path.join(outDir, 'outro.mp4');
  const finalVideo = path.join(outDir, 'part3_prototype.mp4');

  // 1. Intro screenshot
  await showOverlay(page, {
    eyebrow: 'LingoPro · P3',
    title: 'TOEIC Part 3',
    subtitle: 'Hội Thoại · 3 Câu Liên Tiếp',
  });
  await page.screenshot({ path: introImage, type: 'png' });
  await hideOverlay(page);

  // 2. Build Stage DOM
  await ensurePart3Stage(page, questionsData);

  // 3. Start Screencast
  const recorder = await page.screencast({ path: rawVideo, fps: 30, quality: 24 });
  const recordingStartedAt = Date.now();
  const audioEvents = [];

  try {
    audioEvents.push({ src: audioUrl, offsetMs: Date.now() - recordingStartedAt });

    // Audio Playback with synchronized state transitions
    await page.evaluate(({ audioSrc }) => {
      const audio = document.createElement('audio');
      audio.id = 'p3-active-audio';
      audio.src = audioSrc;
      audio.style.display = 'none';
      document.body.appendChild(audio);
      void audio.play();
    }, { audioSrc: audioUrl });

    // Filter silences that occur after initial dialogue start (>= 20s)
    const etsPauses = silences.filter((s) => s.end >= 20);
    const hasEtsPauses = etsPauses.length >= 3;
    console.log('[P3 Prototype] Filtered ETS pauses:', etsPauses);
    
    // Silence 0: Dialogue ends (~35-43s)
    // Silence 1: Q1 pause ends (~50-55s)
    // Silence 2: Q2 pause ends (~60-67s)
    // Silence 3: Q3 pause ends (~68-72s)
    const tDialogueEnd = hasEtsPauses ? etsPauses[0].end * 1000 : 38000;
    const tQ1End = hasEtsPauses ? etsPauses[1].end * 1000 : 50000;
    const tQ2End = hasEtsPauses ? etsPauses[2].end * 1000 : 62000;
    const tQ3End = etsPauses.length >= 4 ? etsPauses[3].end * 1000 : (tQ2End + 8000);
    console.log(`[P3 Prototype] Timings: DialogueEnd=${tDialogueEnd}ms, Q1End=${tQ1End}ms, Q2End=${tQ2End}ms, Q3End=${tQ3End}ms`);

    const revealed = {};

    // Phase 1: Listening dialogue
    const startListen = Date.now();
    while (Date.now() - startListen < tDialogueEnd) {
      const elapsed = Math.floor((Date.now() - startListen) / 1000);
      const remaining = Math.max(0, Math.floor((tQ3End - (Date.now() - startListen)) / 1000));
      const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
      const ss = String(remaining % 60).padStart(2, '0');
      await updatePart3Highlight(page, {
        activeQuestionIndex: 0,
        revealedAnswers: revealed,
        statusText: 'Đang nghe hội thoại (Đọc trước 3 câu)...',
        timerText: `${mm}:${ss}`,
      });
      await sleep(250);
    }

    // Phase 2: Q1 active
    while (Date.now() - startListen < tQ1End) {
      const remaining = Math.max(0, Math.floor((tQ3End - (Date.now() - startListen)) / 1000));
      const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
      const ss = String(remaining % 60).padStart(2, '0');
      await updatePart3Highlight(page, {
        activeQuestionIndex: 1,
        revealedAnswers: revealed,
        statusText: 'Suy nghĩ & Trả lời Câu 1...',
        timerText: `${mm}:${ss}`,
      });
      await sleep(250);
    }
    revealed[1] = questionsData[0].correctAnswer;

    // Phase 3: Q2 active
    while (Date.now() - startListen < tQ2End) {
      const remaining = Math.max(0, Math.floor((tQ3End - (Date.now() - startListen)) / 1000));
      const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
      const ss = String(remaining % 60).padStart(2, '0');
      await updatePart3Highlight(page, {
        activeQuestionIndex: 2,
        revealedAnswers: revealed,
        statusText: 'Suy nghĩ & Trả lời Câu 2...',
        timerText: `${mm}:${ss}`,
      });
      await sleep(250);
    }
    revealed[2] = questionsData[1].correctAnswer;

    // Phase 4: Q3 active
    while (Date.now() - startListen < tQ3End) {
      const remaining = Math.max(0, Math.floor((tQ3End - (Date.now() - startListen)) / 1000));
      const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
      const ss = String(remaining % 60).padStart(2, '0');
      await updatePart3Highlight(page, {
        activeQuestionIndex: 3,
        revealedAnswers: revealed,
        statusText: 'Suy nghĩ & Trả lời Câu 3...',
        timerText: `${mm}:${ss}`,
      });
      await sleep(250);
    }
    revealed[3] = questionsData[2].correctAnswer;

    // All answers revealed hold
    await updatePart3Highlight(page, {
      activeQuestionIndex: 0,
      revealedAnswers: revealed,
      statusText: 'Hoàn thành 3/3 câu!',
      timerText: '00:00',
    });
    await sleep(2000);

    // Phase 5: Transcript Evidence Review
    if (transcript) {
      await showPart3TranscriptReview(page, transcript);
      await sleep(5500);
    }
  } finally {
    await recorder.stop();
  }

  // Outro screenshot
  await showOverlay(page, {
    eyebrow: 'LingoPro · TOEIC',
    title: 'Luyện đề TOEIC trọn bộ miễn phí',
    subtitle: 'lingopro.online/toeic',
    variant: 'cta',
  });
  await page.screenshot({ path: outroImage, type: 'png' });
  await page.close();
  await browser.close();

  // Mux & Stitch
  console.log('[P3 Prototype] Muxing audio & stitching segments...');
  await muxAudio(rawVideo, audioEvents, coreVideo, outDir, 1);
  const outroAudioPath = path.resolve('public/sfx/outro/lingopro-soft-marimba.mp3');
  await createStillSegment(outroImage, 3.8, outroVideo, { audioPath: outroAudioPath, audioGain: 1.25 });
  const hookAudioPath = path.resolve('out/audio-hook-samples/06-lingopro-two-note.mp3');
  await createStillSegment(introImage, 0.7, introVideo, { audioPath: hookAudioPath, audioGain: 9 });
  await concatSegments([introVideo, coreVideo, outroVideo], finalVideo);

  console.log(`[P3 Prototype] Success! Output: ${finalVideo}`);
}

main().catch(console.error);
