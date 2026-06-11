import { readdirSync, readFileSync } from 'fs';
const d = './out';
const files = readdirSync(d).filter(f => f.endsWith('.json')).sort();
const bad = [];
for (const f of files) {
  try {
    const o = JSON.parse(readFileSync(d + '/' + f, 'utf8'));
    const s = o.sections || {};
    const ex = o.exercises || [];
    const e = [];
    if (!o.slug || !o.title_vi || !o.level) e.push('meta');
    if (!s.definition || s.definition.length < 40) e.push('def');
    if (!Array.isArray(s.usage) || s.usage.length < 4) e.push('usage<4');
    if (!Array.isArray(s.examples) || s.examples.length < 6) e.push('ex<6');
    if (!Array.isArray(s.mistakes) || s.mistakes.length < 3) e.push('mis<3');
    if (!Array.isArray(ex) || ex.length < 12) e.push('exr<12');
    if (e.length) bad.push(f + ': ' + e.join(','));
  } catch (err) { bad.push(f + ': PARSE FAIL ' + err.message); }
}
console.log(files.length + ' file. ' + bad.length + ' can xem:');
bad.forEach(b => console.log('  - ' + b));
