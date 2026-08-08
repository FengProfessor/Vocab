import { spawn } from 'node:child_process';
import path from 'node:path';
import { geminiGenerate, hasGeminiKeys } from '@/lib/gemini-multi';

const LOG = '[LLMChain]';
const FALLBACK_TIMEOUT_MS = 60_000;

export type GenerateOpts = {
  preferGemini?: boolean;
  jsonMode?: boolean;
  temperature?: number;
};

/**
 * Step 2: Groq Edge Proxy (Vercel)
 * Yêu cầu: Biến môi trường GROQ_PROXY_URL="https://groq-proxy.vercel.app/api"
 */
async function groqProxyGenerate(
  prompt: string,
  jsonMode: boolean,
  temperature: number
): Promise<string> {
  const proxyUrl = process.env.GROQ_PROXY_URL;
  if (!proxyUrl) {
    throw new Error(`${LOG} Missing GROQ_PROXY_URL environment variable`);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FALLBACK_TIMEOUT_MS);

  try {
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile', // hoặc llama-3.1-8b-instant
        messages: [{ role: 'user', content: prompt }],
        temperature,
        ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const txt = await response.text();
      throw new Error(`${LOG} Proxy HTTP ${response.status}: ${txt}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string | null } }>;
    };
    const content = (data?.choices?.[0]?.message?.content ?? '').trim();
    if (!content) {
      throw new Error(`${LOG} Proxy returned empty content`);
    }
    return content;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Step 3: Local CLI Wrapper (codex-headless)
 * Spawn tiến trình CLI ngầm (asynchronous) để không làm block Node.js server.
 */
async function localCLIGenerate(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // Generate a unique temp file name using Date.now() + Math.random()
    const tmpId = Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 9);
    // Vị trí lưu tạm: trong thư mục tmp của OS (nếu có) hoặc tmp của project
    const tmpDir = process.env.TEMP || process.env.TMP || '/tmp';
    const tmpOutFile = path.join(tmpDir, `tmp-llm-${tmpId}.json`).replace(/\\/g, '/');

    // Dọn dẹp file cũ nếu có (an toàn)
    if (existsSync(tmpOutFile)) {
      try {
        const fs = require('node:fs');
        fs.unlinkSync(tmpOutFile);
      } catch {}
    }

    const binName = process.platform === 'win32' ? 'codex.cmd' : 'codex';
    const args = [
      'exec',
      '--json',
      '-'
    ];

    console.log(`${LOG} Spawning local CLI: ${binName} ${args.join(' ')}`);

    const child = spawn(binName, args, {
      env: { ...process.env },
      shell: true,
    });

    child.stdin.write(prompt);
    child.stdin.end();

    let stdoutOut = '';
    child.stdout.on('data', (data) => {
      stdoutOut += data.toString();
    });

    let stderrOut = '';
    child.stderr.on('data', (data) => {
      stderrOut += data.toString();
    });

    const timeoutId = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(`${LOG} Local CLI Timeout sau 5 phút.`));
    }, 300_000);

    child.on('close', (code) => {
      clearTimeout(timeoutId);
      
      if (code !== 0) {
        reject(new Error(`${LOG} Local CLI thất bại (exit code ${code}). Stderr: ${stderrOut || 'không có'}`));
        return;
      }

      // Try to parse the output. Codex might stream JSONL items. We look for 'item.completed' and extract agent_message
      try {
        let content = '';
        const lines = stdoutOut.split('\n');
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);
            if (parsed && parsed.type === 'item.completed' && parsed.agent_message) {
              content = parsed.agent_message;
              break;
            }
          } catch (e) {
            // ignore non-json lines
          }
        }
        
        // If not found in stream, maybe it just returned raw json?
        if (!content) {
          content = stdoutOut;
        }

        if (!content.trim()) {
           reject(new Error(`${LOG} Local CLI trả về nội dung rỗng.`));
           return;
        }
        resolve(content);
      } catch (err) {
        reject(new Error(`${LOG} Lỗi đọc kết quả Local CLI: ${String(err)}`));
      }
    });
    
    child.on('error', (err) => {
      clearTimeout(timeoutId);
      reject(new Error(`${LOG} Lỗi spawn Local CLI: ${err.message}`));
    });
  });
}

/**
 * 3-Step LLM Fallback (Gemini -> Groq Proxy -> Local CLI)
 * @returns { text: string, provider: string }
 */
export async function generateWith3StepFallback(
  prompt: string,
  opts: GenerateOpts = {}
): Promise<{ text: string; provider: string }> {
  const preferGemini = opts.preferGemini ?? hasGeminiKeys();
  const jsonMode = opts.jsonMode ?? true;
  const temperature = opts.temperature ?? 0.35;

  const errors: string[] = [];
  
  // ==========================
  // STEP 1: GEMINI DIRECT
  // ==========================
  if (preferGemini) {
    try {
      console.log(`${LOG} Step 1: Thử Gemini API...`);
      const text = await geminiGenerate(prompt, { json: jsonMode, temperature });
      return { text, provider: 'gemini' };
    } catch (err: unknown) {
      const e = err instanceof Error ? err : new Error(String(err));
      console.warn(`${LOG} Step 1 (Gemini) thất bại: ${e.message.slice(0, 200)}`);
      errors.push(`Gemini: ${e.message}`);
    }
  } else {
    errors.push('Gemini: Not preferred or missing keys');
  }

  // ==========================
  // STEP 2: GROQ PROXY
  // ==========================
  if (process.env.GROQ_PROXY_URL) {
    try {
      console.log(`${LOG} Step 2: Fallback sang Groq Proxy...`);
      const text = await groqProxyGenerate(prompt, jsonMode, temperature);
      return { text, provider: 'groq-proxy' };
    } catch (err: unknown) {
      const e = err instanceof Error ? err : new Error(String(err));
      console.warn(`${LOG} Step 2 (Groq Proxy) thất bại: ${e.message.slice(0, 200)}`);
      errors.push(`Groq: ${e.message}`);
    }
  } else {
    console.warn(`${LOG} Bỏ qua Step 2 (Groq Proxy) vì thiếu biến GROQ_PROXY_URL`);
    errors.push('Groq: Missing GROQ_PROXY_URL');
  }

  // ==========================
  // STEP 3: LOCAL CLI
  // ==========================
  try {
    console.log(`${LOG} Step 3: Fallback cuối cùng sang Local CLI (codex exec)...`);
    const text = await localCLIGenerate(prompt);
    return { text, provider: 'local-cli' };
  } catch (err: unknown) {
    const e = err instanceof Error ? err : new Error(String(err));
    console.warn(`${LOG} Step 3 (Local CLI) thất bại: ${e.message.slice(0, 200)}`);
    errors.push(`Local CLI: ${e.message}`);
  }

  // Nếu cả 3 step đều fail
  throw new Error(`${LOG} Fallback thất bại toàn tập. Chi tiết: ${errors.join(' | ')}`);
}
