import fs from 'fs';

const envPath = '.env.local';
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    if (process.env[m[1]]) continue;
    process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
  }
}

const z = (process.env.ZHIPU_API_KEY || '').split(',').map((s) => s.trim()).filter(Boolean);
const g = (process.env.GROQ_API_KEY || '').split(',').map((s) => s.trim()).filter(Boolean);
console.log('zhipu keys', z.length, 'groq keys', g.length);

const base = (process.env.ZHIPU_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4').replace(/\/$/, '');
const model = process.env.ZHIPU_MODEL || 'glm-4-flash';

async function tryKey(label, url, key, body) {
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });
  const t = await r.text();
  console.log(label, r.status, t.slice(0, 220).replace(/\n/g, ' '));
  return r.status;
}

if (z[0]) {
  await tryKey('zhipu0', `${base}/chat/completions`, z[0], {
    model,
    messages: [{ role: 'user', content: 'Return JSON only: {"ok":true}' }],
    temperature: 0.1,
    response_format: { type: 'json_object' },
  });
}
if (g[0]) {
  await tryKey('groq0', 'https://api.groq.com/openai/v1/chat/completions', g[0], {
    model: 'llama-3.1-8b-instant',
    messages: [{ role: 'user', content: 'Return JSON only: {"ok":true}' }],
    temperature: 0.1,
    response_format: { type: 'json_object' },
  });
}

// Longer JSON like ai-sentence
const longPrompt = `Analyze: "Students outperformed those."
Return ONLY JSON:
{"translation_vi":"...","kernel":{"text":"Students outperformed those.","s":"students","v":"outperformed","o":"those","translation_vi":"..."},"logic":null,"segments":[],"build_levels":[{"level":0,"text":"Students outperformed those.","slot_vi":"Xương"}],"chunks":[{"text":"outperformed","base":"outperform","meaning_vi":"vượt trội"}],"notes":[]}`;

if (g[0]) {
  await tryKey('groq-long', 'https://api.groq.com/openai/v1/chat/completions', g[0], {
    model: 'llama-3.1-8b-instant',
    messages: [{ role: 'user', content: longPrompt }],
    temperature: 0.1,
    response_format: { type: 'json_object' },
  });
}
if (z[0]) {
  await tryKey('zhipu-long', `${base}/chat/completions`, z[0], {
    model,
    messages: [{ role: 'user', content: longPrompt }],
    temperature: 0.1,
    response_format: { type: 'json_object' },
  });
}
