import fs from 'fs';
import { execSync } from 'child_process';
import os from 'os';
import path from 'path';

const env = fs.readFileSync('.env.local', 'utf8');
function get(k) {
  const line = env.split(/\r?\n/).find((l) => l.startsWith(`${k}=`));
  if (!line) return '';
  return line.slice(k.length + 1).trim().replace(/^["']|["']$/g, '');
}

const key = get('ZHIPU_API_KEY');
const model = get('ZHIPU_MODEL') || 'glm-4-flash';
const base = get('ZHIPU_BASE_URL') || 'https://open.bigmodel.cn/api/paas/v4';

if (!key) {
  console.error('No ZHIPU_API_KEY in .env.local');
  process.exit(1);
}

console.log('key len', key.length, 'nl', /[\r\n]/.test(key), 'prefix', key.slice(0, 4));
console.log('model', model);
console.log('base', base);

const dir = os.tmpdir();
const files = {
  ZHIPU_API_KEY: path.join(dir, 'zk.txt'),
  ZHIPU_MODEL: path.join(dir, 'zm.txt'),
  ZHIPU_BASE_URL: path.join(dir, 'zb.txt'),
};
fs.writeFileSync(files.ZHIPU_API_KEY, key, 'utf8');
fs.writeFileSync(files.ZHIPU_MODEL, model, 'utf8');
fs.writeFileSync(files.ZHIPU_BASE_URL, base, 'utf8');

for (const [name, file] of Object.entries(files)) {
  // Windows: type file | vercel env add
  const cmd = `cmd /c "type ${file} | vercel env add ${name} production --force"`;
  console.log('push', name);
  try {
    const out = execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    console.log(out.slice(0, 200));
  } catch (e) {
    console.log(String(e.stdout || e.stderr || e).slice(0, 300));
  }
}

// smoke test key live
const r = await fetch(`${base.replace(/\/$/, '')}/chat/completions`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${key}`,
  },
  body: JSON.stringify({
    model,
    messages: [{ role: 'user', content: 'JSON only: {"ok":true}' }],
    temperature: 0.1,
    response_format: { type: 'json_object' },
  }),
});
console.log('live zhipu', r.status, (await r.text()).slice(0, 120));
