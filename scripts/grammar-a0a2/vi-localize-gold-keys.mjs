/**
 * Việt hóa header formula + case rules trong gold-lessons-a0.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(__dirname, 'gold-lessons-a0.mjs');
let s = fs.readFileSync(file, 'utf8');

const pairs = [
  [/\bSubject:/g, "'Chủ ngữ':"],
  [/\bForm:/g, "'Dạng':"],
  [/\bStructure:/g, "'Cấu trúc':"],
  [/\bExample:/g, "'Ví dụ':"],
  [/\bAdj:/g, "'Tính từ sở hữu':"],
  [/\bPronoun:/g, "'Đại từ sở hữu':"],
  [/Ví_dụ:/g, "'Ví dụ':"],
];

for (const [re, rep] of pairs) s = s.replace(re, rep);

// rules.case labels
const caseMap = [
  ["case: 'Subject'", "case: 'Chủ ngữ (Subject)'"],
  ["case: 'Object after V'", "case: 'Tân ngữ sau động từ'"],
  ["case: 'Object after prep'", "case: 'Tân ngữ sau giới từ'"],
  ["case: 'Negative'", "case: 'Phủ định'"],
  ["case: 'Question'", "case: 'Nghi vấn'"],
  ["case: 'Short answers'", "case: 'Trả lời ngắn'"],
  ["case: 'he/she/it / singular N'", "case: 'he/she/it / danh từ số ít'"],
  ["case: 'you/we/they / plural N'", "case: 'you/we/they / danh từ số nhiều'"],
  ["case: 'I'", "case: 'I'"],
  ["case: 'near'", "case: 'Gần'"],
  ["case: 'far'", "case: 'Xa'"],
  ["case: 'plural near'", "case: 'Số nhiều gần'"],
  ["case: 'plural far'", "case: 'Số nhiều xa'"],
];

for (const [a, b] of caseMap) s = s.split(a).join(b);

// formula Form values that are pure EN short labels
s = s.split("'+ regular'").join("'+ có quy tắc (V-ed)'");
s = s.split("'+ irregular'").join("'+ bất quy tắc (V2)'");
s = s.split("'+ singular / U'").join("'+ số ít / U'");
s = s.split("'+ plural'").join("'+ số nhiều'");
s = s.split("'- singular / U'").join("'- số ít / U'");
s = s.split("'- plural'").join("'- số nhiều'");
s = s.split("'? singular / U'").join("'? số ít / U'");
s = s.split("'? plural'").join("'? số nhiều'");
s = s.split("'Short answers'").join("'Trả lời ngắn'");

// note: Object → tân ngữ where teaching
s = s.replace(
  /luôn dùng \*\*Object\*\*/g,
  'luôn dùng **tân ngữ (Object)**'
);
s = s.replace(
  /dùng \*\*Object\*\*/g,
  'dùng **tân ngữ (Object)**'
);

fs.writeFileSync(file, s, 'utf8');

const left = s.match(/\b(Subject|Form|Structure|Example|Adj|Pronoun):/g) || [];
console.log('remaining EN keys:', left.length, left.slice(0, 10));
console.log('OK gold-lessons-a0.mjs localized');
