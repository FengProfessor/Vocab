import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { allOxfordThemeDefs, groupOxfordByTheme } from './oxford-themes.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const text = readFileSync(path.join(ROOT, 'scripts/lists/oxford-3000.txt'), 'utf8');
const words: string[] = [];
for (const raw of text.split(/[\r\n,]+/)) {
  let t = raw.trim().toLowerCase();
  if (!t || t.startsWith('#')) continue;
  t = t.replace(/^\d+[.)]\s*/, '').replace(/\s+/g, ' ');
  if (t.length > 1 && t.length < 80) words.push(t);
}
const uniq = [...new Set(words)];
const g = groupOxfordByTheme(uniq);
let sum = 0;
for (const t of allOxfordThemeDefs()) {
  const n = (g.get(t.key) ?? []).length;
  sum += n;
  console.log(String(n).padStart(4), t.key.padEnd(12), t.title, '|', (g.get(t.key) ?? []).slice(0, 6).join(', '));
}
console.log('total', sum, 'of', uniq.length);
