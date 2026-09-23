import { spawn } from 'node:child_process';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import puppeteer from 'puppeteer';

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, ...rest] = arg.replace(/^--/, '').split('=');
    return [key, rest.join('=') || 'true'];
  })
);

const baseUrl = args.get('baseUrl') || 'http://localhost:3000';
const part = Number(args.get('part') || 1);
const questionsPerVideo = Number(args.get('questions') || 3);
const videos = Number(args.get('videos') || 1);
const answerDelaySeconds = Number(args.get('answerDelay') || 3);
const outputDir = path.resolve(args.get('outDir') || 'out/tiktok-toeic');

if (![1, 2, 3, 4].includes(part)) {
  throw new Error('--part phải là 1, 2, 3 hoặc 4.');
}
if (!Number.isInteger(questionsPerVideo) || questionsPerVideo < 1) {
  throw new Error('--questions phải là số nguyên dương.');
}
if (!Number.isInteger(videos) || videos < 1) {
  throw new Error('--videos phải là số nguyên dương.');
}

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

      if (overlayVariant === 'cta' && overlayActionText) {
        const action = document.createElement('div');
        action.textContent = overlayActionText;
        action.style.margin = '22px auto 0';
        action.style.width = 'fit-content';
        action.style.padding = '11px 18px';
        action.style.borderRadius = '14px';
        action.style.background = '#ffffff';
        action.style.color = '#0f172a';
        action.style.fontSize = '17px';
        action.style.fontWeight = '700';
        action.style.letterSpacing = '-.01em';
        card.appendChild(action);
      }

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

async function showCountdown(page, seconds) {
  await page.evaluate(() => {
    document.getElementById('lingopro-countdown')?.remove();
    const badge = document.createElement('div');
    badge.id = 'lingopro-countdown';
    badge.style.position = 'fixed';
    badge.style.top = '76px';
    badge.style.right = '16px';
    badge.style.zIndex = '2147483646';
    badge.style.width = '56px';
    badge.style.height = '56px';
    badge.style.borderRadius = '999px';
    badge.style.display = 'flex';
    badge.style.alignItems = 'center';
    badge.style.justifyContent = 'center';
    badge.style.background = 'rgba(15,23,42,.94)';
    badge.style.color = '#fff';
    badge.style.font = '800 26px/1 Arial, sans-serif';
    badge.style.boxShadow = '0 8px 28px rgba(0,0,0,.28)';
    document.body.appendChild(badge);
  });

  for (let remaining = seconds; remaining > 0; remaining -= 1) {
    await page.evaluate((value) => {
      const badge = document.getElementById('lingopro-countdown');
      if (badge) badge.textContent = String(value);
    }, remaining);
    await sleep(1000);
  }

  await page.evaluate(() => document.getElementById('lingopro-countdown')?.remove());
}

async function clickCorrectAnswer(page, answer) {
  const clicked = await page.evaluate((answerKey) => {
    const target = [...document.querySelectorAll('button')].find(
      (button) => (button.textContent || '').trim() === `[ ${answerKey} ]`
    );
    if (!(target instanceof HTMLButtonElement)) return false;
    target.click();
    return true;
  }, answer);

  if (!clicked) {
    throw new Error(`Không tìm thấy nút đáp án ${answer}.`);
  }
}

async function goNext(page) {
  const clicked = await page.evaluate(() => {
    const target = [...document.querySelectorAll('button')].find((button) =>
      (button.getAttribute('title') || '').startsWith('Câu tiếp theo')
    );
    if (!(target instanceof HTMLButtonElement) || target.disabled) return false;
    target.click();
    return true;
  });
  if (!clicked) return false;
  await sleep(650);
  return true;
}

async function resolveExplanation(page, question, sessionToken) {
  const result = await page.evaluate(
    async ({ currentQuestion, token }) => {
      const response = await fetch('/api/toeic/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId: 'bank',
          questionNumber: currentQuestion.questionNumber,
          questionId: currentQuestion.id,
          part: currentQuestion.part,
          sessionToken: token,
        }),
      });
      if (!response.ok) return null;
      return response.json();
    },
    { currentQuestion: question, token: sessionToken }
  );

  const answer = result?.correctAnswer;
  if (!['A', 'B', 'C', 'D'].includes(answer)) {
    throw new Error(`Không lấy được đáp án câu ${question.questionNumber}.`);
  }
  return result;
}

function decodeHtmlEntities(value) {
  return String(value || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function extractTranscriptOptions(transcript, fallbackOptions = []) {
  const normalized = decodeHtmlEntities(
    String(transcript || '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\r/g, '')
  )
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .trim();

  const keys = ['A', 'B', 'C', 'D'];
  return keys.map((key, index) => {
    const nextKey = keys[index + 1];
    const pattern = nextKey
      ? new RegExp(`\\(${key}\\)\\s*([\\s\\S]*?)(?=\\(${nextKey}\\))`, 'i')
      : new RegExp(`\\(${key}\\)\\s*([\\s\\S]*)$`, 'i');
    const match = normalized.match(pattern);
    const transcriptText = match?.[1]?.replace(/\s+/g, ' ').trim() || '';
    const fallbackText = fallbackOptions.find((option) => option?.key === key)?.text || '';
    return { key, text: transcriptText || fallbackText || `Đáp án ${key}` };
  });
}

async function ensurePart1Stage(page) {
  await page.evaluate(() => {
    document.getElementById('lingopro-part1-stage')?.remove();
    const stage = document.createElement('div');
    stage.id = 'lingopro-part1-stage';
    stage.style.position = 'fixed';
    stage.style.inset = '0';
    stage.style.zIndex = '2147483645';
    stage.style.background = '#0b1220';
    stage.style.fontFamily = 'var(--font-be-vietnam-pro), var(--font-inter), "Segoe UI", sans-serif';
    stage.style.color = '#f8fafc';

    const questionLabel = document.createElement('div');
    questionLabel.id = 'lingopro-part1-question-label';
    questionLabel.style.position = 'absolute';
    questionLabel.style.left = '22px';
    questionLabel.style.top = '38px';
    questionLabel.style.fontSize = '18px';
    questionLabel.style.fontWeight = '700';
    questionLabel.style.letterSpacing = '-.02em';
    questionLabel.style.color = '#f8fafc';

    const brandLabel = document.createElement('div');
    brandLabel.textContent = 'LingoPro';
    brandLabel.style.position = 'absolute';
    brandLabel.style.right = '22px';
    brandLabel.style.top = '38px';
    brandLabel.style.fontSize = '18px';
    brandLabel.style.fontWeight = '700';
    brandLabel.style.letterSpacing = '-.02em';
    brandLabel.style.color = '#4ade80';
    brandLabel.style.textShadow = '0 0 5px rgba(74,222,128,.95), 0 0 12px rgba(34,197,94,.8), 0 0 22px rgba(34,197,94,.55)';

    const imageFrame = document.createElement('div');
    imageFrame.style.position = 'absolute';
    imageFrame.style.left = '22px';
    imageFrame.style.top = '86px';
    imageFrame.style.width = '356px';
    imageFrame.style.height = '286px';
    imageFrame.style.borderRadius = '18px';
    imageFrame.style.overflow = 'hidden';
    imageFrame.style.background = '#111827';
    imageFrame.style.boxShadow = '0 16px 40px rgba(0,0,0,.3)';

    const image = document.createElement('img');
    image.id = 'lingopro-part1-image';
    image.alt = '';
    image.style.width = '100%';
    image.style.height = '100%';
    image.style.objectFit = 'contain';
    image.style.background = '#111827';
    imageFrame.appendChild(image);

    const timer = document.createElement('div');
    timer.id = 'lingopro-part1-timer';
    timer.style.position = 'absolute';
    timer.style.left = '22px';
    timer.style.top = '392px';
    timer.style.width = '340px';
    timer.style.height = '54px';
    timer.style.display = 'flex';
    timer.style.alignItems = 'center';
    timer.style.justifyContent = 'center';
    timer.style.borderRadius = '16px';
    timer.style.background = 'rgba(15,23,42,.92)';
    timer.style.border = '1px solid rgba(148,163,184,.28)';
    timer.style.fontSize = '25px';
    timer.style.fontWeight = '700';
    timer.style.fontVariantNumeric = 'tabular-nums';
    timer.style.letterSpacing = '.04em';

    const choices = document.createElement('div');
    choices.id = 'lingopro-part1-choices';
    choices.style.position = 'absolute';
    choices.style.left = '22px';
    choices.style.top = '392px';
    choices.style.width = '340px';
    choices.style.display = 'none';
    choices.style.flexDirection = 'column';
    choices.style.gap = '7px';

    stage.append(questionLabel, brandLabel, imageFrame, timer, choices);
    document.body.appendChild(stage);
  });
}

async function setPart1QuestionStage(page, imageUrl, questionNumber = 1, totalQuestions = 1) {
  await page.evaluate(({ src, current, total }) => {
    const image = document.getElementById('lingopro-part1-image');
    const timer = document.getElementById('lingopro-part1-timer');
    const choices = document.getElementById('lingopro-part1-choices');
    const questionLabel = document.getElementById('lingopro-part1-question-label');
    if (image instanceof HTMLImageElement) image.src = src || '';
    if (questionLabel) questionLabel.textContent = `Câu ${current}/${total}`;
    if (timer) {
      timer.style.display = 'flex';
      timer.textContent = '00:00';
    }
    if (choices) {
      choices.style.display = 'none';
      choices.replaceChildren();
    }
  }, {
    src: imageUrl || '',
    current: questionNumber,
    total: totalQuestions,
  });
  if (imageUrl) {
    await page.waitForFunction(
      () => {
        const image = document.getElementById('lingopro-part1-image');
        return image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0;
      },
      { timeout: 15000 }
    );
  }
}

async function playAudioWithCountdown(page) {
  await page.evaluate(
    () =>
      new Promise((resolve) => {
        const audio = document.querySelector('audio');
        const timer = document.getElementById('lingopro-part1-timer');
        if (!(audio instanceof HTMLAudioElement)) {
          resolve(null);
          return;
        }

        const updateTimer = () => {
          const remaining = Math.max(0, Math.ceil((audio.duration || 0) - audio.currentTime));
          const minutes = String(Math.floor(remaining / 60)).padStart(2, '0');
          const seconds = String(remaining % 60).padStart(2, '0');
          if (timer) timer.textContent = `${minutes}:${seconds}`;
        };

        audio.currentTime = 0;
        updateTimer();
        const interval = window.setInterval(updateTimer, 120);
        const timeout = window.setTimeout(
          () => {
            window.clearInterval(interval);
            resolve(null);
          },
          Math.max(8000, ((audio.duration || 0) + 5) * 1000)
        );

        audio.addEventListener(
          'ended',
          () => {
            window.clearInterval(interval);
            window.clearTimeout(timeout);
            if (timer) timer.textContent = '00:00';
            resolve(null);
          },
          { once: true }
        );
        void audio.play();
      })
  );
}

async function revealPart1Choices(page, options, correctAnswer) {
  await page.evaluate(
    ({ answerOptions, correct }) => {
      const timer = document.getElementById('lingopro-part1-timer');
      const choices = document.getElementById('lingopro-part1-choices');
      if (timer) timer.style.display = 'none';
      if (!choices) return;
      choices.replaceChildren();
      choices.style.display = 'flex';

      for (const option of answerOptions) {
        const row = document.createElement('div');
        const isCorrect = option.key === correct;
        row.style.display = 'grid';
        row.style.gridTemplateColumns = '38px minmax(0,1fr)';
        row.style.alignItems = 'center';
        row.style.gap = '9px';
        row.style.minHeight = '46px';
        row.style.padding = '7px 10px';
        row.style.borderRadius = '13px';
        row.style.background = isCorrect ? '#15803d' : 'rgba(30,41,59,.95)';
        row.style.border = isCorrect
          ? '1px solid rgba(134,239,172,.75)'
          : '1px solid rgba(148,163,184,.2)';
        row.style.boxShadow = isCorrect ? '0 8px 24px rgba(21,128,61,.28)' : 'none';

        const key = document.createElement('div');
        key.textContent = option.key;
        key.style.width = '32px';
        key.style.height = '32px';
        key.style.display = 'flex';
        key.style.alignItems = 'center';
        key.style.justifyContent = 'center';
        key.style.borderRadius = '9px';
        key.style.background = isCorrect ? 'rgba(255,255,255,.18)' : 'rgba(255,255,255,.08)';
        key.style.fontWeight = '800';
        key.style.fontSize = '16px';

        const text = document.createElement('div');
        text.textContent = option.text;
        text.style.fontSize = '13px';
        text.style.fontWeight = isCorrect ? '700' : '500';
        text.style.lineHeight = '1.28';
        text.style.color = '#f8fafc';

        row.append(key, text);
        choices.appendChild(row);
      }
    },
    { answerOptions: options, correct: correctAnswer }
  );
}

async function waitForAudioReady(page) {
  await page.waitForFunction(
    () => {
      const audio = document.querySelector('audio');
      return Boolean(audio && audio.currentSrc && Number.isFinite(audio.duration) && audio.duration > 0);
    },
    { timeout: 15000 }
  );
  return page.evaluate(() => {
    const audio = document.querySelector('audio');
    return audio
      ? { src: audio.currentSrc || audio.src, duration: Number(audio.duration || 0) }
      : null;
  });
}

async function playAudioAndWait(page) {
  const started = await page.evaluate(() => {
    const audio = document.querySelector('audio');
    if (!(audio instanceof HTMLAudioElement)) return false;
    audio.currentTime = 0;
    void audio.play();
    return true;
  });
  if (!started) return;

  await page.evaluate(
    () =>
      new Promise((resolve) => {
        const audio = document.querySelector('audio');
        if (!(audio instanceof HTMLAudioElement)) {
          resolve(null);
          return;
        }
        if (audio.ended) {
          resolve(null);
          return;
        }
        const timeout = window.setTimeout(resolve, Math.max(8000, (audio.duration + 5) * 1000));
        audio.addEventListener(
          'ended',
          () => {
            window.clearTimeout(timeout);
            resolve(null);
          },
          { once: true }
        );
      })
  );
}

async function muxAudio(videoPath, audioEvents, finalPath, tempDir) {
  if (audioEvents.length === 0) {
    await run('ffmpeg', [
      '-y',
      '-i',
      videoPath,
      '-vf',
      'scale=1080:1920:flags=lanczos',
      '-c:v',
      'libx264',
      '-preset',
      'medium',
      '-crf',
      '20',
      '-pix_fmt',
      'yuv420p',
      '-an',
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
    '-filter_complex',
    filters.join(';'),
    '-map',
    '0:v:0',
    '-map',
    '[aout]',
    '-vf',
    'scale=1080:1920:flags=lanczos',
    '-c:v',
    'libx264',
    '-preset',
    'medium',
    '-crf',
    '20',
    '-pix_fmt',
    'yuv420p',
    '-c:a',
    'aac',
    '-b:a',
    '192k',
    '-shortest',
    '-movflags',
    '+faststart',
    finalPath,
  ]);
}

async function createStillSegment(imagePath, durationSeconds, targetPath, { ding = false } = {}) {
  const audioSource = ding
    ? 'sine=frequency=1350:sample_rate=48000:duration=0.28'
    : 'anullsrc=channel_layout=stereo:sample_rate=48000';
  const audioFilter = ding
    ? 'volume=0.28,afade=t=out:st=0.04:d=0.24,aecho=0.7:0.22:38:0.16,pan=stereo|c0=c0|c1=c0,apad'
    : null;
  await run('ffmpeg', [
    '-y',
    '-loop',
    '1',
    '-i',
    imagePath,
    '-f',
    'lavfi',
    '-i',
    audioSource,
    '-t',
    String(durationSeconds),
    ...(audioFilter ? ['-af', audioFilter] : []),
    '-vf',
    'fps=30,format=yuv420p',
    '-c:v',
    'libx264',
    '-preset',
    'medium',
    '-crf',
    '20',
    '-c:a',
    'aac',
    '-b:a',
    '192k',
    '-shortest',
    '-movflags',
    '+faststart',
    targetPath,
  ]);
}

async function concatSegments(segmentPaths, finalPath) {
  const inputArgs = segmentPaths.flatMap((segmentPath) => ['-i', segmentPath]);
  const concatInputs = segmentPaths
    .map((_, index) => `[${index}:v:0][${index}:a:0]`)
    .join('');
  await run('ffmpeg', [
    '-y',
    ...inputArgs,
    '-filter_complex',
    `${concatInputs}concat=n=${segmentPaths.length}:v=1:a=1[v][a]`,
    '-map',
    '[v]',
    '-map',
    '[a]',
    '-c:v',
    'libx264',
    '-preset',
    'medium',
    '-crf',
    '20',
    '-pix_fmt',
    'yuv420p',
    '-c:a',
    'aac',
    '-b:a',
    '192k',
    '-movflags',
    '+faststart',
    finalPath,
  ]);
}

async function renderOne(browser, videoNumber) {
  const page = await browser.newPage();
  // Giữ layout mobile 450x800 CSS px; DPR cao giúp screenshot hook/outro đạt 1080x1920 thật.
  await page.setViewport({ width: 450, height: 800, deviceScaleFactor: 2.4 });
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);

  const suffix = String(videoNumber).padStart(3, '0');
  const workDir = path.join(outputDir, `.tmp-part${part}-${suffix}`);
  const rawVideo = path.join(workDir, 'screen.webm');
  const coreVideo = path.join(workDir, 'core.mp4');
  const introImage = path.join(workDir, 'intro.png');
  const outroImage = path.join(workDir, 'outro.png');
  const introVideo = path.join(workDir, 'intro.mp4');
  const outroVideo = path.join(workDir, 'outro.mp4');
  const finalVideo = path.join(outputDir, `toeic-part${part}-${suffix}.mp4`);
  await mkdir(workDir, { recursive: true });

  const url = `${baseUrl}/toeic/exam/bank?part=${part}&limit=${questionsPerVideo}&mode=practice&filterMode=all_random`;
  const testResponsePromise = page.waitForResponse(
    (response) => response.url().includes('/api/toeic/test') && response.request().method() === 'POST',
    { timeout: 30000 }
  );

  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  const testResponse = await testResponsePromise;
  const testPayload = await testResponse.json();
  const questions = Array.isArray(testPayload?.questions) ? testPayload.questions.slice(0, questionsPerVideo) : [];
  const sessionToken = testPayload?.sessionToken || '';

  if (questions.length === 0) {
    throw new Error('API không trả về câu hỏi TOEIC.');
  }

  await sleep(900);
  const paletteIsOpen = await page.$eval(
    'aside[aria-label="Bảng câu hỏi"]',
    (aside) => aside.className.includes('translate-x-0')
  );
  if (paletteIsOpen) {
    await page.keyboard.press('Escape');
    await sleep(350);
  }
  await page.addStyleTag({
    content: `
      aside[aria-label="Bảng câu hỏi"] { display: none !important; }
      nextjs-portal { display: none !important; }
    `,
  });

  const useMinimalPart1Stage = part === 1;
  if (useMinimalPart1Stage) {
    await showOverlay(page, {
      eyebrow: `LingoPro · P${part}`,
      title: `TOEIC Part ${part}`,
      subtitle: `Listening · ${questions.length} câu`,
    });
    await page.screenshot({ path: introImage, type: 'png', captureBeyondViewport: false });
    await hideOverlay(page);
    await ensurePart1Stage(page);
    await setPart1QuestionStage(page, questions[0]?.imageUrl, 1, questions.length);
  } else {
    await showOverlay(page, {
      eyebrow: `LingoPro · P${part}`,
      title: `TOEIC Part ${part}`,
      subtitle: `Listening · ${questions.length} câu`,
    });
    await page.screenshot({ path: introImage, type: 'png', captureBeyondViewport: false });
    await hideOverlay(page);
  }

  const recorder = await page.screencast({ path: rawVideo, fps: 30, quality: 24 });
  const recordingStartedAt = Date.now();
  const audioEvents = [];
  let lastAudioSrc = '';

  try {
    await sleep(450);

    for (let index = 0; index < questions.length; index += 1) {
      const question = questions[index];
      if (useMinimalPart1Stage) {
        await setPart1QuestionStage(page, question.imageUrl, index + 1, questions.length);
      }
      const audio = await waitForAudioReady(page);
      const explanation = await resolveExplanation(page, question, sessionToken);
      const correctAnswer = explanation.correctAnswer;

      if (audio?.src && audio.src !== lastAudioSrc) {
        const offsetMs = Date.now() - recordingStartedAt;
        audioEvents.push({ src: audio.src, offsetMs });
        lastAudioSrc = audio.src;
        if (useMinimalPart1Stage) {
          await playAudioWithCountdown(page);
        } else {
          await playAudioAndWait(page);
        }
      }

      if (useMinimalPart1Stage) {
        const transcriptOptions = extractTranscriptOptions(explanation.transcript, question.options);
        await revealPart1Choices(page, transcriptOptions, correctAnswer);
        await clickCorrectAnswer(page, correctAnswer);
        await sleep(4200);
      } else {
        await showCountdown(page, answerDelaySeconds);
        await clickCorrectAnswer(page, correctAnswer);
        await sleep(1800);
      }

      if (index < questions.length - 1) {
        const moved = await goNext(page);
        if (!moved) throw new Error(`Không chuyển được sang câu ${index + 2}.`);
      }
    }

  } finally {
    await recorder.stop();
  }

  if (useMinimalPart1Stage) {
    await showOverlay(page, {
      eyebrow: 'LingoPro · TOEIC',
      title: 'Học + Luyện thi TOEIC miễn phí ở',
      subtitle: 'Lingopro.online/toeic',
      variant: 'cta',
    });
    await page.screenshot({ path: outroImage, type: 'png', captureBeyondViewport: false });
  } else {
    await showOverlay(page, {
      eyebrow: 'LingoPro',
      title: 'Muốn luyện full TOEIC?',
      subtitle: 'Luyện thêm Part 1–4, xem đáp án và giải thích ngay trên LingoPro.',
      variant: 'cta',
      actionText: 'lingopro.vn',
    });
    await page.screenshot({ path: outroImage, type: 'png', captureBeyondViewport: false });
  }
  await page.close();

  await muxAudio(rawVideo, audioEvents, coreVideo, workDir);
  await createStillSegment(outroImage, 3.8, outroVideo);
  await createStillSegment(introImage, 0.7, introVideo, { ding: true });
  await concatSegments([introVideo, coreVideo, outroVideo], finalVideo);
  await rm(workDir, { recursive: true, force: true });
  console.log(`[TOEIC TikTok] Đã render: ${finalVideo}`);
  return finalVideo;
}

async function main() {
  await mkdir(outputDir, { recursive: true });
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required'],
  });

  try {
    for (let index = 1; index <= videos; index += 1) {
      await renderOne(browser, index);
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error('[TOEIC TikTok] Render thất bại:', error);
  process.exit(1);
});
