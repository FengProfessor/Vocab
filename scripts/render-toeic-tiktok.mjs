import { spawn } from 'node:child_process';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import puppeteer from 'puppeteer';
import {
  getPendingSlots,
  getUsedQuestionIds,
  loadCampaign,
  markRendered,
  syncChecklist,
} from './toeic-tiktok-tracker.mjs';

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
const captureSpeed = Math.max(1, Number(args.get('captureSpeed') || 1));
const allowReuse = args.get('allowReuse') === 'true';
const outputDir = path.resolve(args.get('outDir') || 'out/tiktok-toeic');
const trackerPath = args.get('tracker') ? path.resolve(args.get('tracker')) : null;
const checklistPath = path.resolve(args.get('checklist') || 'docs/tiktok-toeic-100-checklist.md');

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
  await page.waitForFunction(
    (answerKey) =>
      [...document.querySelectorAll('[role="radiogroup"] button')].some((button) => {
        const text = (button.textContent || '').replace(/\s+/g, ' ').trim();
        return text.startsWith(`[ ${answerKey} ]`) || text.startsWith(`[${answerKey}]`);
      }),
    { timeout: 5000 },
    answer
  );
  const clicked = await page.evaluate((answerKey) => {
    const target = [...document.querySelectorAll('[role="radiogroup"] button')].find((button) => {
      const text = (button.textContent || '').replace(/\s+/g, ' ').trim();
      return text.startsWith(`[ ${answerKey} ]`) || text.startsWith(`[${answerKey}]`);
    });
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

  const fallbackKeys = fallbackOptions
    .map((option) => option?.key)
    .filter((key) => ['A', 'B', 'C', 'D'].includes(key));
  const keys = fallbackKeys.length > 0 ? fallbackKeys : ['A', 'B', 'C', 'D'];
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

function normalizeTranscriptText(transcript) {
  return decodeHtmlEntities(
    String(transcript || '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\r/g, '')
  )
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .trim();
}

function extractPart2Prompt(transcript) {
  const normalized = normalizeTranscriptText(transcript)
    .replace(/^Tape scripts\s*/i, '')
    .trim();
  const firstOption = normalized.search(/\(A\)/i);
  return (firstOption >= 0 ? normalized.slice(0, firstOption) : normalized)
    .replace(/\s+/g, ' ')
    .trim();
}

function buildPart2Explanation(prompt, correctOption) {
  const normalized = String(prompt || '').trim().toLowerCase();
  const lead = normalized.split(/\s+/)[0]?.replace(/[^a-z]/g, '') || '';
  const hints = {
    when: 'When → hỏi thời gian',
    where: 'Where → hỏi địa điểm',
    who: 'Who → hỏi người',
    whose: 'Whose → hỏi sở hữu',
    why: 'Why → hỏi lý do',
    how: 'How → hỏi cách thức / trạng thái',
    what: 'What → hỏi thông tin / sự việc',
    which: 'Which → yêu cầu chọn một phương án',
  };
  const hint = hints[lead] || 'Nghe ý nghĩa cả câu, tránh chọn theo từ khóa lặp lại';
  const answerText = correctOption?.text ? ` → “${correctOption.text}”` : '';
  return `${hint}${answerText}`;
}

async function showPart2ListeningState(page, questionNumber, totalQuestions, mode = 'listen', speed = 1) {
  await page.evaluate(({ current, total, currentMode, currentSpeed }) => {
    const promptBox = document.getElementById('lingopro-listening-prompt');
    const timer = document.getElementById('lingopro-part1-timer');
    const choices = document.getElementById('lingopro-part1-choices');
    const questionLabel = document.getElementById('lingopro-part1-question-label');
    if (questionLabel) questionLabel.textContent = `Câu ${current}/${total}`;
    if (choices) {
      choices.style.display = 'none';
      choices.replaceChildren();
    }
    if (timer) {
      timer.style.display = 'flex';
      timer.style.top = '430px';
      timer.textContent = currentMode === 'listen' ? '00:00' : '00:05';
    }
    if (!promptBox) return;

    promptBox.replaceChildren();
    promptBox.style.display = 'flex';
    promptBox.style.flexDirection = 'column';
    promptBox.style.top = '112px';
    promptBox.style.minHeight = '250px';
    promptBox.style.padding = '28px 24px';
    promptBox.style.justifyContent = 'center';
    promptBox.style.alignItems = 'center';
    promptBox.style.textAlign = 'center';
    promptBox.style.background = 'rgba(15,23,42,.72)';
    promptBox.style.border = '1px solid rgba(74,222,128,.18)';

    const icon = document.createElement('div');
    icon.textContent = currentMode === 'listen' ? '🎧' : '✓';
    icon.style.fontSize = '52px';
    icon.style.lineHeight = '1';
    icon.style.marginBottom = '16px';

    const title = document.createElement('div');
    title.textContent = currentMode === 'listen' ? 'LISTEN' : 'CHỐT ĐÁP ÁN';
    title.style.fontSize = currentMode === 'listen' ? '31px' : '25px';
    title.style.fontWeight = '850';
    title.style.letterSpacing = currentMode === 'listen' ? '.12em' : '.02em';
    title.style.color = currentMode === 'listen' ? '#f8fafc' : '#86efac';

    const subtitle = document.createElement('div');
    subtitle.textContent = currentMode === 'listen'
      ? 'Nghe câu hỏi và 3 phản hồi'
      : 'Bạn có 5 giây để chọn A, B hoặc C';
    subtitle.style.marginTop = '8px';
    subtitle.style.fontSize = '15px';
    subtitle.style.fontWeight = '600';
    subtitle.style.color = '#94a3b8';

    const wave = document.createElement('div');
    wave.style.height = '52px';
    wave.style.display = 'flex';
    wave.style.alignItems = 'center';
    wave.style.justifyContent = 'center';
    wave.style.gap = '5px';
    wave.style.marginTop = '22px';
    wave.style.opacity = currentMode === 'listen' ? '1' : '.28';
    for (let index = 0; index < 13; index += 1) {
      const bar = document.createElement('span');
      bar.style.display = 'block';
      bar.style.width = '5px';
      bar.style.height = `${16 + ((index * 11) % 30)}px`;
      bar.style.borderRadius = '999px';
      bar.style.background = '#4ade80';
      bar.style.boxShadow = '0 0 10px rgba(74,222,128,.35)';
      if (currentMode === 'listen') {
        const duration = (0.55 + (index % 4) * 0.11) / currentSpeed;
        const delay = (index * 0.04) / currentSpeed;
        bar.style.animation = `lingoproP2Wave ${duration}s ease-in-out ${delay}s infinite alternate`;
      }
      wave.appendChild(bar);
    }

    if (!document.getElementById('lingopro-p2-wave-style')) {
      const style = document.createElement('style');
      style.id = 'lingopro-p2-wave-style';
      style.textContent = '@keyframes lingoproP2Wave { from { transform: scaleY(.35); opacity:.55 } to { transform: scaleY(1); opacity:1 } }';
      document.head.appendChild(style);
    }

    promptBox.append(icon, title, subtitle, wave);
  }, { current: questionNumber, total: totalQuestions, currentMode: mode, currentSpeed: speed });
}

async function showPart2DecisionCountdown(page, questionNumber, totalQuestions, seconds = 5, speed = 1) {
  await showPart2ListeningState(page, questionNumber, totalQuestions, 'decide', speed);
  for (let remaining = seconds; remaining > 0; remaining -= 1) {
    await page.evaluate((value) => {
      const timer = document.getElementById('lingopro-part1-timer');
      if (timer) timer.textContent = `00:0${value}`;
    }, remaining);
    await sleep(1000 / speed);
  }
}

async function showPart2RetentionCard(page) {
  await page.evaluate(() => {
    const promptBox = document.getElementById('lingopro-listening-prompt');
    const timer = document.getElementById('lingopro-part1-timer');
    const choices = document.getElementById('lingopro-part1-choices');
    const questionLabel = document.getElementById('lingopro-part1-question-label');
    if (questionLabel) questionLabel.textContent = 'Hoàn thành 3/3';
    if (timer) timer.style.display = 'none';
    if (choices) choices.style.display = 'none';
    if (!promptBox) return;
    promptBox.replaceChildren();
    promptBox.style.display = 'flex';
    promptBox.style.top = '150px';
    promptBox.style.minHeight = '190px';
    promptBox.style.alignItems = 'center';
    promptBox.style.justifyContent = 'center';
    promptBox.style.textAlign = 'center';
    promptBox.style.fontSize = '27px';
    promptBox.style.fontWeight = '850';
    promptBox.style.color = '#f8fafc';
    promptBox.style.background = 'rgba(15,23,42,.78)';
    promptBox.style.border = '1px solid rgba(74,222,128,.2)';
    promptBox.textContent = 'Bạn đúng được mấy câu?';
  });
}

async function showPart2Review(page, { index, total, prompt, options, correctAnswer, explanation }) {
  await page.evaluate(({ current, count, questionPrompt, answerOptions, correct, note }) => {
    const promptBox = document.getElementById('lingopro-listening-prompt');
    const timer = document.getElementById('lingopro-part1-timer');
    const choices = document.getElementById('lingopro-part1-choices');
    const questionLabel = document.getElementById('lingopro-part1-question-label');
    if (questionLabel) questionLabel.textContent = `Đáp án ${current}/${count}`;
    if (timer) timer.style.display = 'none';

    if (promptBox) {
      promptBox.replaceChildren();
      promptBox.style.display = 'flex';
      promptBox.style.top = '82px';
      promptBox.style.minHeight = '112px';
      promptBox.style.padding = '16px 20px';
      promptBox.style.alignItems = 'flex-start';
      promptBox.style.justifyContent = 'center';
      promptBox.style.textAlign = 'left';
      promptBox.style.fontSize = '18px';
      promptBox.style.lineHeight = '1.35';
      promptBox.style.background = 'rgba(30,41,59,.94)';
      promptBox.style.border = '1px solid rgba(148,163,184,.22)';
      promptBox.textContent = questionPrompt || 'Question–Response';
    }

    if (!choices) return;
    choices.replaceChildren();
    choices.style.display = 'flex';
    choices.style.top = '216px';
    choices.style.width = '340px';

    for (const option of answerOptions) {
      const row = document.createElement('div');
      const isCorrect = option.key === correct;
      row.style.display = 'grid';
      row.style.gridTemplateColumns = '38px minmax(0,1fr)';
      row.style.alignItems = 'center';
      row.style.gap = '9px';
      row.style.minHeight = '52px';
      row.style.padding = '8px 10px';
      row.style.borderRadius = '13px';
      row.style.background = isCorrect ? '#15803d' : 'rgba(30,41,59,.95)';
      row.style.border = isCorrect ? '1px solid rgba(134,239,172,.75)' : '1px solid rgba(148,163,184,.2)';
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
      text.style.fontSize = '14px';
      text.style.fontWeight = isCorrect ? '750' : '500';
      text.style.lineHeight = '1.3';
      text.style.color = '#f8fafc';
      row.append(key, text);
      choices.appendChild(row);
    }

    const noteBox = document.createElement('div');
    noteBox.textContent = note;
    noteBox.style.marginTop = '6px';
    noteBox.style.padding = '10px 12px';
    noteBox.style.borderRadius = '12px';
    noteBox.style.background = 'rgba(74,222,128,.08)';
    noteBox.style.border = '1px solid rgba(74,222,128,.18)';
    noteBox.style.color = '#bbf7d0';
    noteBox.style.fontSize = '12px';
    noteBox.style.fontWeight = '650';
    noteBox.style.lineHeight = '1.35';
    choices.appendChild(noteBox);
  }, {
    current: index,
    count: total,
    questionPrompt: prompt,
    answerOptions: options,
    correct: correctAnswer,
    note: explanation,
  });
}

async function renderPart2Sequence(page, questions, sessionToken, recordingStartedAt, audioEvents, speed = 1) {
  const reviews = [];
  for (let index = 0; index < questions.length; index += 1) {
    const question = questions[index];
    const current = index + 1;
    await setPart1QuestionStage(page, '', current, questions.length);
    await showPart2ListeningState(page, current, questions.length, 'listen', speed);

    const explanation = await resolveExplanation(page, question, sessionToken);
    const answerOptions = extractTranscriptOptions(explanation.transcript, question.options);
    const prompt = extractPart2Prompt(explanation.transcript) || question.prompt || 'Question–Response';
    const correctAnswer = explanation.correctAnswer;
    const correctOption = answerOptions.find((option) => option.key === correctAnswer);
    reviews.push({
      prompt,
      options: answerOptions,
      correctAnswer,
      explanation: buildPart2Explanation(prompt, correctOption),
    });

    const audioSrc = question.audioUrl || '';
    if (audioSrc) {
      audioEvents.push({ src: audioSrc, offsetMs: (Date.now() - recordingStartedAt) * speed });
      await playSourceAudioWithCountdown(page, audioSrc, speed);
    }
    await showPart2DecisionCountdown(page, current, questions.length, 5, speed);
  }

  await showPart2RetentionCard(page);
  await sleep(700 / speed);
  for (let index = 0; index < reviews.length; index += 1) {
    await showPart2Review(page, {
      index: index + 1,
      total: reviews.length,
      ...reviews[index],
    });
    await sleep(4300 / speed);
  }

  // Giữ riêng đáp án 3 thêm một nhịp trước khi dừng screencast.
  // Puppeteer/ffmpeg có thể mất vài frame cuối khi recorder.stop() chạy ngay
  // sau review cuối, khiến outro nối vào quá sớm và trông như đè lên đáp án 3.
  if (reviews.length > 0) {
    await sleep(2500 / speed);
  }
}

async function ensurePart1Stage(page, currentPart = 1) {
  await page.evaluate((activePart) => {
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
    imageFrame.id = 'lingopro-part1-image-frame';
    imageFrame.style.left = '14px';
    imageFrame.style.top = '68px';
    imageFrame.style.width = '422px';
    imageFrame.style.height = '304px';
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

    const listeningPrompt = document.createElement('div');
    listeningPrompt.id = 'lingopro-listening-prompt';
    listeningPrompt.style.position = 'absolute';
    listeningPrompt.style.left = '22px';
    listeningPrompt.style.right = '22px';
    listeningPrompt.style.top = '120px';
    listeningPrompt.style.minHeight = '170px';
    listeningPrompt.style.display = activePart === 1 ? 'none' : 'flex';
    listeningPrompt.style.alignItems = 'center';
    listeningPrompt.style.justifyContent = 'center';
    listeningPrompt.style.padding = '24px';
    listeningPrompt.style.borderRadius = '20px';
    listeningPrompt.style.background = 'rgba(30,41,59,.92)';
    listeningPrompt.style.border = '1px solid rgba(148,163,184,.22)';
    listeningPrompt.style.textAlign = 'center';
    listeningPrompt.style.fontSize = '24px';
    listeningPrompt.style.fontWeight = '700';
    listeningPrompt.style.lineHeight = '1.35';
    listeningPrompt.textContent =
      activePart === 2
        ? 'Nghe câu hỏi và chọn câu trả lời đúng'
        : activePart === 3
          ? 'Nghe đoạn hội thoại và chọn đáp án đúng'
          : 'Nghe bài nói và chọn đáp án đúng';
    imageFrame.style.display = activePart === 1 ? 'block' : 'none';

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

    stage.append(questionLabel, brandLabel, imageFrame, listeningPrompt, timer, choices);
    document.body.appendChild(stage);
  }, currentPart);
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

async function showQuestionChoices(page, prompt, options) {
  await page.evaluate(
    ({ questionPrompt, answerOptions }) => {
      const promptBox = document.getElementById('lingopro-listening-prompt');
      const timer = document.getElementById('lingopro-part1-timer');
      const choices = document.getElementById('lingopro-part1-choices');

      if (promptBox) {
        promptBox.textContent = questionPrompt || 'Chọn đáp án đúng';
        promptBox.style.display = 'flex';
        promptBox.style.top = '92px';
        promptBox.style.minHeight = '120px';
        promptBox.style.padding = '18px 22px';
        promptBox.style.fontSize = '19px';
        promptBox.style.textAlign = 'left';
        promptBox.style.justifyContent = 'flex-start';
      }
      if (timer) timer.style.display = 'none';
      if (!choices) return;

      choices.replaceChildren();
      choices.style.display = 'flex';
      choices.style.top = '238px';

      for (const option of answerOptions) {
        const row = document.createElement('div');
        row.style.display = 'grid';
        row.style.gridTemplateColumns = '38px minmax(0,1fr)';
        row.style.alignItems = 'center';
        row.style.gap = '9px';
        row.style.minHeight = '52px';
        row.style.padding = '8px 10px';
        row.style.borderRadius = '13px';
        row.style.background = 'rgba(30,41,59,.95)';
        row.style.border = '1px solid rgba(148,163,184,.28)';

        const key = document.createElement('div');
        key.textContent = option.key;
        key.style.width = '32px';
        key.style.height = '32px';
        key.style.display = 'flex';
        key.style.alignItems = 'center';
        key.style.justifyContent = 'center';
        key.style.borderRadius = '9px';
        key.style.background = 'rgba(255,255,255,.08)';
        key.style.fontWeight = '800';
        key.style.fontSize = '16px';

        const text = document.createElement('div');
        text.textContent = option.text;
        text.style.fontSize = '14px';
        text.style.fontWeight = '500';
        text.style.lineHeight = '1.3';
        text.style.color = '#f8fafc';

        row.append(key, text);
        choices.appendChild(row);
      }
    },
    { questionPrompt: prompt || '', answerOptions: options }
  );
}

async function resetListeningPrompt(page, currentPart) {
  await page.evaluate((activePart) => {
    const promptBox = document.getElementById('lingopro-listening-prompt');
    const choices = document.getElementById('lingopro-part1-choices');
    if (promptBox) {
      promptBox.style.top = '120px';
      promptBox.style.minHeight = '170px';
      promptBox.style.padding = '24px';
      promptBox.style.fontSize = '24px';
      promptBox.style.textAlign = 'center';
      promptBox.style.justifyContent = 'center';
      promptBox.textContent =
        activePart === 2
          ? 'Nghe câu hỏi và chọn câu trả lời đúng'
          : activePart === 3
            ? 'Nghe đoạn hội thoại và chọn đáp án đúng'
            : 'Nghe bài nói và chọn đáp án đúng';
    }
    if (choices) choices.style.top = '392px';
  }, currentPart);
}

async function playSourceAudioWithCountdown(page, src, speed = 1) {
  await page.evaluate(
    ({ audioSrc, playbackSpeed }) =>
      new Promise((resolve) => {
        document.getElementById('lingopro-source-audio')?.remove();
        const audio = document.createElement('audio');
        audio.id = 'lingopro-source-audio';
        audio.src = audioSrc;
        audio.preload = 'auto';
        audio.style.display = 'none';
        document.body.appendChild(audio);

        const timer = document.getElementById('lingopro-part1-timer');
        const updateTimer = () => {
          const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
          const remaining = Math.max(0, Math.ceil(duration - audio.currentTime));
          const minutes = String(Math.floor(remaining / 60)).padStart(2, '0');
          const seconds = String(remaining % 60).padStart(2, '0');
          if (timer) timer.textContent = `${minutes}:${seconds}`;
        };

        const start = () => {
          audio.playbackRate = playbackSpeed;
          updateTimer();
          const interval = window.setInterval(updateTimer, 120);
          const timeout = window.setTimeout(() => {
            window.clearInterval(interval);
            resolve(null);
          }, Math.max(3000, (((audio.duration || 0) + 5) * 1000) / playbackSpeed));
          audio.addEventListener('ended', () => {
            window.clearInterval(interval);
            window.clearTimeout(timeout);
            if (timer) timer.textContent = '00:00';
            resolve(null);
          }, { once: true });
          void audio.play();
        };

        if (audio.readyState >= 1) start();
        else audio.addEventListener('loadedmetadata', start, { once: true });
        audio.load();
      }),
    { audioSrc: src, playbackSpeed: speed }
  );
}

async function showStageCountdown(page, seconds) {
  await page.evaluate(() => {
    const timer = document.getElementById('lingopro-part1-timer');
    const choices = document.getElementById('lingopro-part1-choices');
    if (timer) timer.style.display = 'flex';
    if (choices) choices.style.display = 'none';
  });
  for (let remaining = seconds; remaining > 0; remaining -= 1) {
    await page.evaluate((value) => {
      const timer = document.getElementById('lingopro-part1-timer');
      if (timer) timer.textContent = `00:0${value}`;
    }, remaining);
    await sleep(1000);
  }
  await page.evaluate(() => {
    const timer = document.getElementById('lingopro-part1-timer');
    if (timer) timer.textContent = '00:00';
  });
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

async function muxAudio(videoPath, audioEvents, finalPath, tempDir, videoRate = 1) {
  const videoFilter = videoRate > 1
    ? `setpts=${videoRate}*PTS,fps=30,scale=1080:1920:flags=lanczos`
    : 'scale=1080:1920:flags=lanczos';
  if (audioEvents.length === 0) {
    await run('ffmpeg', [
      '-y',
      '-i',
      videoPath,
      '-vf',
      videoFilter,
      '-c:v',
      'libx264',
      '-preset',
      'veryfast',
      '-crf',
      '20',
      '-threads',
      '4',
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
    videoFilter,
    '-c:v',
    'libx264',
    '-preset',
    'veryfast',
    '-crf',
    '20',
    '-threads',
    '4',
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

async function createStillSegment(imagePath, durationSeconds, targetPath, { ding = false, audioPath = null, audioGain = 1 } = {}) {
  const audioSource = ding
    ? 'sine=frequency=1350:sample_rate=48000:duration=0.28'
    : 'anullsrc=channel_layout=stereo:sample_rate=48000';
  const audioInputArgs = audioPath ? ['-i', audioPath] : ['-f', 'lavfi', '-i', audioSource];
  const audioFilter = audioPath
    ? `volume=${audioGain},alimiter=limit=0.95,apad`
    : ding
      ? 'volume=0.28,afade=t=out:st=0.04:d=0.24,aecho=0.7:0.22:38:0.16,pan=stereo|c0=c0|c1=c0,apad'
      : null;
  await run('ffmpeg', [
    '-y',
    '-loop',
    '1',
    '-i',
    imagePath,
    ...audioInputArgs,
    '-t',
    String(durationSeconds),
    ...(audioFilter ? ['-af', audioFilter] : []),
    '-vf',
    'fps=30,format=yuv420p',
    '-c:v',
    'libx264',
    '-preset',
    'veryfast',
    '-crf',
    '20',
    '-threads',
    '4',
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
    'veryfast',
    '-crf',
    '20',
    '-threads',
    '4',
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

async function renderOne(browser, videoNumber, trackerSlot = null) {
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
  const partOutputDir = path.join(outputDir, `P${part}`);
  await mkdir(partOutputDir, { recursive: true });
  const finalVideo = path.join(
    partOutputDir,
    trackerSlot
      ? `${trackerSlot.id.replace('LP-TK-', '')},p${part}.mp4`
      : `${suffix},p${part}.mp4`
  );
  await mkdir(workDir, { recursive: true });

  let usedQuestionIds = [];
  if (trackerPath) {
    const campaign = await loadCampaign(trackerPath);
    usedQuestionIds = [
      ...getUsedQuestionIds(campaign, part),
      ...(Array.isArray(campaign.excludedQuestionIds) ? campaign.excludedQuestionIds : []),
    ];
    const historyRecords = Object.fromEntries(
      usedQuestionIds.map((questionId) => [
        questionId,
        {
          questionId,
          part,
          lastAnsweredAt: '2026-01-01T00:00:00.000Z',
          isCorrect: true,
          attemptCount: 1,
          selectedOption: 'A',
        },
      ])
    );
    await page.evaluateOnNewDocument((records) => {
      localStorage.setItem(
        'lingo_toeic_question_history',
        JSON.stringify({ version: 1, updatedAt: new Date().toISOString(), records })
      );
    }, historyRecords);
  }

  const filterMode = trackerPath && !allowReuse ? 'unseen' : 'all_random';
  const url = `${baseUrl}/toeic/exam/bank?part=${part}&limit=${questionsPerVideo}&mode=practice&filterMode=${filterMode}`;
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
  const questionIds = questions.map((question) => String(question.id));
  const duplicatedIds = questionIds.filter((id) => usedQuestionIds.includes(id));
  if (!allowReuse && duplicatedIds.length > 0) {
    throw new Error(`Phát hiện câu đã dùng lại: ${duplicatedIds.join(', ')}`);
  }

  await sleep(900);
  const paletteIsOpen = await page
    .$eval(
      'aside[aria-label="Bảng câu hỏi"]',
      (aside) => aside.className.includes('translate-x-0')
    )
    .catch(() => false);
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

  await showOverlay(page, {
    eyebrow: `LingoPro · P${part}`,
    title: `TOEIC Part ${part}`,
    subtitle: `Listening · ${questions.length} câu`,
  });
  await page.screenshot({ path: introImage, type: 'png', captureBeyondViewport: false });
  await hideOverlay(page);
  await ensurePart1Stage(page, part);
  await setPart1QuestionStage(page, questions[0]?.imageUrl, 1, questions.length);

  const recorder = await page.screencast({ path: rawVideo, fps: 30, quality: 24 });
  const recordingStartedAt = Date.now();
  const audioEvents = [];
  let lastAudioSrc = '';

  try {
    await sleep(part === 2 ? 450 / captureSpeed : 450);

    if (part === 2) {
      await renderPart2Sequence(page, questions, sessionToken, recordingStartedAt, audioEvents, captureSpeed);
    } else {
      for (let index = 0; index < questions.length; index += 1) {
        const question = questions[index];
        await setPart1QuestionStage(page, question.imageUrl, index + 1, questions.length);
        const explanation = await resolveExplanation(page, question, sessionToken);
        const correctAnswer = explanation.correctAnswer;
        const audioSrc = question.audioUrl || '';
        const isNewAudio = Boolean(audioSrc && audioSrc !== lastAudioSrc);

        if (isNewAudio) {
          if (part === 3) await resetListeningPrompt(page, part);
          const offsetMs = Date.now() - recordingStartedAt;
          audioEvents.push({ src: audioSrc, offsetMs });
          lastAudioSrc = audioSrc;
          await playSourceAudioWithCountdown(page, audioSrc);
        } else if (part !== 3) {
          await showStageCountdown(page, answerDelaySeconds);
        }

        const answerOptions =
          part <= 2
            ? extractTranscriptOptions(explanation.transcript, question.options)
            : question.options;

        if (part === 3) {
          await showQuestionChoices(page, question.prompt, answerOptions);
          await sleep(answerDelaySeconds * 1000);
        }

        await revealPart1Choices(page, answerOptions, correctAnswer);
        await sleep(4200);
      }
    }

  } finally {
    await recorder.stop();
  }

  await showOverlay(page, {
    eyebrow: 'LingoPro · TOEIC',
    title: 'Học + Luyện thi TOEIC miễn phí ở',
    subtitle: 'Lingopro.online/toeic',
    variant: 'cta',
  });
  await page.screenshot({ path: outroImage, type: 'png', captureBeyondViewport: false });
  await page.close();

  await muxAudio(rawVideo, audioEvents, coreVideo, workDir, part === 2 ? captureSpeed : 1);
  const outroAudioPath = path.resolve('public/sfx/outro/lingopro-soft-marimba.mp3');
  await createStillSegment(outroImage, 3.8, outroVideo, { audioPath: outroAudioPath, audioGain: 1.25 });
  const hookAudioPath = path.resolve('out/audio-hook-samples/06-lingopro-two-note.mp3');
  await createStillSegment(introImage, 0.7, introVideo, { audioPath: hookAudioPath, audioGain: 9 });
  await concatSegments([introVideo, coreVideo, outroVideo], finalVideo);
  if (trackerPath && trackerSlot) {
    const campaign = await markRendered({
      trackerPath,
      slotId: trackerSlot.id,
      questionIds,
      outputFile: path.relative(process.cwd(), finalVideo).replaceAll('\\', '/'),
    });
    await syncChecklist(campaign, checklistPath);
    console.log(`[TOEIC TikTok] Tracker: ${trackerSlot.id} -> rendered`);
  }
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
    const renderWithRetry = async (videoNumber, trackerSlot = null) => {
      const maxAttempts = 4;
      let lastError = null;
      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
          return await renderOne(browser, videoNumber, trackerSlot);
        } catch (error) {
          lastError = error;
          console.warn(
            `[TOEIC TikTok] Lần render ${attempt}/${maxAttempts} thất bại cho video ${videoNumber}: ${error?.message || error}`
          );
          const pages = await browser.pages().catch(() => []);
          await Promise.all(
            pages.map((openPage) =>
              openPage.isClosed() ? Promise.resolve() : openPage.close().catch(() => {})
            )
          );
          if (attempt < maxAttempts) await sleep(1500);
        }
      }
      throw lastError;
    };

    if (trackerPath) {
      const campaign = await loadCampaign(trackerPath);
      const slots = getPendingSlots(campaign, part, videos);
      if (slots.length === 0) {
        throw new Error(`Không còn video P${part} ở trạng thái todo trong tracker.`);
      }
      for (const slot of slots) {
        await renderWithRetry(slot.number, slot);
      }
    } else {
      for (let index = 1; index <= videos; index += 1) {
        await renderWithRetry(index);
      }
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error('[TOEIC TikTok] Render thất bại:', error);
  process.exit(1);
});
