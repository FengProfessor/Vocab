import fs from 'fs';
const p = 'scripts/grammar-a0a2/upgrade-quiz-all-remaining.mjs';
let s = fs.readFileSync(p, 'utf8');
const lines = s.split(/\n/);
const out = lines.map((line) => {
  if (line.includes('Short answer:') && line.includes('have got')) {
    return "  tf('Short answer Yes I have — not Yes I have got.', true, 'no got in short answer', 'short'),";
  }
  if (line.includes('got your email')) {
    return "  mcq('I have ___ a new laptop. (got/get)', ['got', 'get', 'getting', 'gets'], 'got', 'I have got', 'email'),";
  }
  if (line.includes("We've ___ a problem")) {
    return "  mcq('We have ___ a problem.', ['got', 'get', 'getting', 'gets'], 'got', 'We have got', 'weve'),";
  }
  if (line.includes('got time now') && line.includes("haven't")) {
    return "  fill('I ___ got time now. (have not/has not)', ['have not', 'has not'], 'have not', 'I have not got', 'time'),";
  }
  if (line.includes("She hasn't got ___ brothers")) {
    return "  mcq('She has not got ___ brothers.', ['any', 'some', 'a', 'much'], 'any', 'has not got + any', 'any'),";
  }
  // fix tf with nested quotes problems for There's
  if (line.includes('common short form') && line.includes('There is')) {
    return "  tf('Theres is a common short form of There is.', true, 'theres', 'short'),";
  }
  return line;
});
fs.writeFileSync(p, out.join('\n'));
console.log('done');
