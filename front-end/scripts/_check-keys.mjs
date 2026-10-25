import fs from 'fs';
const e = fs.readFileSync('.env.local', 'utf8');
for (const k of [
  'GEMINI_API_KEY',
  'GOOGLE_AI_API_KEY',
  'ZHIPU_API_KEY',
  'GROQ_API_KEY',
  'OPENROUTER_API_KEY',
  'GLM_API_KEY',
]) {
  const m = e.match(new RegExp(`^${k}=(.*)$`, 'm'));
  if (!m) {
    console.log(k, 'MISSING');
    continue;
  }
  const v = m[1].replace(/^["']|["']$/g, '').trim();
  console.log(k, 'SET', 'parts', v.split(',').filter(Boolean).length, 'len', v.length);
}
