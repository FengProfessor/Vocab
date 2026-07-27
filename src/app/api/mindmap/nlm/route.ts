import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { writeFile, unlink, mkdir } from 'fs/promises';
import path from 'path';
import os from 'os';
import {
  getAuthUser,
  unauthorized,
  checkRateLimitAsync,
  tooManyRequests,
  isValidString,
} from '@/lib/api-security';
import { normalizeWordInputs, parseWordText } from '@/lib/mindmap';
import {
  formatWordListForNlm,
  prepareInfographicWords,
  INFOGRAPHIC_MIN_WORDS,
  INFOGRAPHIC_MAX_WORDS,
} from '@/lib/ipa-resolve';

export const maxDuration = 300;

const NLM_PYTHON =
  process.env.NLM_PYTHON ||
  path.join(
    process.env.USERPROFILE || process.env.HOME || '',
    'pipx',
    'venvs',
    'notebooklm-cli',
    'Scripts',
    'python.exe'
  );

const SCRIPT = path.join(process.cwd(), 'scripts', 'nlm-vocab-infographic.py');
const DOWNLOAD_JS = path.join(process.cwd(), 'scripts', 'download-nlm-image.mjs');
const EXPORT_DIR = path.join(process.cwd(), 'public', 'nlm-exports');

function runCmd(
  cmd: string,
  args: string[],
  timeoutMs: number
): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
      windowsHide: true,
    });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill();
      resolve({ code: -1, stdout, stderr: stderr + '\n[timeout]' });
    }, timeoutMs);
    child.stdout.on('data', (d: Buffer) => {
      stdout += d.toString('utf8');
    });
    child.stderr.on('data', (d: Buffer) => {
      stderr += d.toString('utf8');
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ code: code ?? 1, stdout, stderr });
    });
    child.on('error', (err) => {
      clearTimeout(timer);
      resolve({ code: 1, stdout, stderr: String(err) });
    });
  });
}

function parseLastJson(stdout: string): Record<string, unknown> | null {
  const lines = stdout
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {
    try {
      return JSON.parse(lines[i]) as Record<string, unknown>;
    } catch {
      /* continue */
    }
  }
  return null;
}

/**
 * POST /api/mindmap/nlm
 * Tạo **Infographic (Đồ họa thông tin)** NotebookLM + tải PNG về /public/nlm-exports.
 */
export async function POST(req: Request): Promise<NextResponse> {
  try {
    // Route spawn subprocess Python 240s → BẮT BUỘC auth (chống guest đốt CPU/disk trên self-host)
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();
    const rl = await checkRateLimitAsync(`mindmap-nlm-info:${auth.userId}`, 4, 180_000);
    if (!rl.allowed) return tooManyRequests();

    const body = (await req.json()) as {
      words?: unknown;
      text?: unknown;
      title?: unknown;
      notebookId?: unknown;
      orientation?: unknown;
      detail?: unknown;
      language?: unknown;
    };

    let inputs = normalizeWordInputs(body.words);
    if (inputs.length === 0 && typeof body.text === 'string') {
      inputs = parseWordText(body.text);
    }

    const title =
      typeof body.title === 'string' && isValidString(body.title, 100)
        ? body.title.trim()
        : 'Vocab Infographic';

    const orientation =
      body.orientation === 'portrait' || body.orientation === 'square'
        ? body.orientation
        : 'landscape';
    // detailed: NLM bố cục dày hơn, dễ gắn đủ 35–45 từ
    const detail =
      body.detail === 'concise' || body.detail === 'standard' ? body.detail : 'detailed';
    const language =
      typeof body.language === 'string' && isValidString(body.language, 10)
        ? body.language.trim()
        : 'vi';

    // 35–45 từ/chủ đề + IPA CHỈ từ điển (không LLM)
    console.log(`[NLM Infographic] prepare ${inputs.length} words (target ${INFOGRAPHIC_MIN_WORDS}–${INFOGRAPHIC_MAX_WORDS})…`);
    const prepared = await prepareInfographicWords(inputs, {
      hardMin: INFOGRAPHIC_MIN_WORDS,
      hardMax: INFOGRAPHIC_MAX_WORDS,
    });
    if (prepared.error || prepared.words.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: prepared.error || 'Không chuẩn bị được list từ',
          ipaStats: prepared.stats,
        },
        { status: 400 }
      );
    }
    const withIpa = prepared.words;
    const ipaStats = prepared.stats;
    const wordText = formatWordListForNlm(withIpa);

    const tmpDir = path.join(os.tmpdir(), 'lingopro-nlm');
    await mkdir(tmpDir, { recursive: true });
    await mkdir(EXPORT_DIR, { recursive: true });
    const wordsFile = path.join(tmpDir, `words-${Date.now()}.txt`);
    await writeFile(wordsFile, wordText, 'utf8');

    const focus = [
      `Printable ESL vocabulary infographic for Vietnamese students.`,
      `Theme/unit: "${title}". Exactly ${withIpa.length} words (one topic only).`,
      `CRITICAL IPA: Copy every IPA string EXACTLY from the source list. Do NOT invent, alter, or omit IPA.`,
      `CRITICAL VISUALS: For EACH word, the illustration must literally depict THAT word's meaning only (see DRAW: cue).`,
      `Do NOT reuse the same icon for different words. No wrong object, no decorative random scenes.`,
      `Each entry shows: English word + /IPA/ + Vietnamese meaning + matching icon/photo.`,
      `Group into 4–6 situational sub-sections. Clean A4-friendly layout, high contrast, large readable text.`,
    ].join(' ');

    const args = [
      SCRIPT,
      '--title',
      title,
      '--words-file',
      wordsFile,
      '--orientation',
      orientation,
      '--detail',
      detail,
      '--language',
      language,
      '--focus',
      focus,
      '--poll-seconds',
      '200',
    ];
    if (typeof body.notebookId === 'string' && body.notebookId.trim()) {
      args.push('--notebook-id', body.notebookId.trim());
    }

    console.log(
      `[NLM Infographic] start send=${withIpa.length} verifiedIpa=${ipaStats.verifiedIpa}/${ipaStats.total} dropped=${ipaStats.dropped.length} title=${title}`
    );
    const { code, stdout, stderr } = await runCmd(NLM_PYTHON, args, 240_000);

    try {
      await unlink(wordsFile);
    } catch {
      /* ignore */
    }

    const parsed = parseLastJson(stdout);
    if (!parsed) {
      console.error('[NLM Infographic] no json', { code, stderr: stderr.slice(0, 400), stdout: stdout.slice(0, 400) });
      return NextResponse.json(
        {
          success: false,
          error:
            'NotebookLM CLI lỗi. Chạy `nlm login` rồi thử lại. ' +
            (stderr || stdout || `exit ${code}`).slice(0, 280),
        },
        { status: 502 }
      );
    }
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: String(parsed.error || 'NLM failed'), detail: parsed },
        { status: 502 }
      );
    }

    const artifactId = String(parsed.artifact_id || Date.now());
    const imageRemote =
      (typeof parsed.image_url_base === 'string' && parsed.image_url_base) ||
      (typeof parsed.image_url === 'string' && parsed.image_url) ||
      '';

    let localImagePath: string | null = null;
    let publicUrl: string | null = null;
    let downloadError: string | null = null;

    if (imageRemote) {
      const fileName = `infographic-${artifactId.slice(0, 8)}.png`;
      const absOut = path.join(EXPORT_DIR, fileName);
      // Artifact báo full size (vd 2752×1536). Truyền w/h để tránh tải thumbnail 512×286.
      const expW = typeof parsed.width === 'number' ? String(parsed.width) : '0';
      const expH = typeof parsed.height === 'number' ? String(parsed.height) : '0';
      // Ưu tiên full URL có =w… nếu còn; image_url_base dùng kèm w/h
      const downloadSrc =
        (typeof parsed.image_url === 'string' && parsed.image_url) || imageRemote;
      console.log(
        `[NLM Infographic] download ${downloadSrc.slice(0, 80)}… → ${fileName} (${expW}x${expH})`
      );
      const dl = await runCmd(
        process.execPath,
        [DOWNLOAD_JS, downloadSrc, absOut, expW, expH],
        120_000
      );
      const dlJson = parseLastJson(dl.stdout) || parseLastJson(dl.stderr);
      if (dlJson?.success) {
        localImagePath = absOut;
        publicUrl = `/nlm-exports/${fileName}`;
        console.log(
          `[NLM Infographic] PNG ${dlJson.width}x${dlJson.height} bytes=${dlJson.bytes}`
        );
      } else {
        downloadError = String(dlJson?.error || dl.stderr || dl.stdout || 'download failed').slice(0, 300);
        console.warn('[NLM Infographic] download fail:', downloadError);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        provider: 'notebooklm',
        type: 'infographic',
        title: parsed.title,
        notebookId: parsed.notebook_id,
        notebookUrl: parsed.notebook_url,
        artifactId: parsed.artifact_id,
        imageUrl: publicUrl,
        imageRemoteUrl: parsed.image_url,
        caption: parsed.caption,
        bodyText: parsed.body_text,
        width: parsed.width,
        height: parsed.height,
        orientation,
        detail,
        language,
        elapsedMs: parsed.elapsed_ms,
        downloadError,
        localImagePath,
        imageWidth:
          typeof parsed.width === 'number'
            ? parsed.width
            : null,
        imageHeight:
          typeof parsed.height === 'number'
            ? parsed.height
            : null,
        wordCount: withIpa.length,
        inputWordCount: inputs.length,
        ipaStats: {
          withIpa: ipaStats.withIpa,
          verifiedIpa: ipaStats.verifiedIpa,
          total: ipaStats.total,
          bySource: ipaStats.bySource,
          missing: ipaStats.missing,
          dropped: ipaStats.dropped,
        },
        sampleLines: withIpa.slice(0, 5).map((w) => formatWordListForNlm([w])),
        note: parsed.note,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[NLM Infographic] fail:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
