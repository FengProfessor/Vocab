/**
 * Edge case test: CLIP có phân biệt được ảnh SAI không?
 * Test: cho ảnh ĐÚNG nhưng query với meaning SAI.
 */
import { pipeline } from '@huggingface/transformers';
import path from 'path';
import fs from 'fs';

const classifier = await pipeline('zero-shot-image-classification', 'Xenova/clip-vit-base-patch32');

console.log('=== Edge case: ảnh ĐÚNG, target SAI ===\n');

// abandon image: nhà bỏ hoang. Query với meaning sai → CLIP phải score thấp
const imgPath = path.resolve('tmp-check-imgs-v2', '02_abandon.jpg');

const tests = [
  ['CORRECT target', ['abandoned building', 'random object', 'text card']],
  ['WRONG: cat target', ['a cat or kitten', 'abandoned building', 'random object']],
  ['WRONG: festival target', ['festival celebration crowd', 'abandoned building', 'random object']],
  ['WRONG: account target', ['accounting bookkeeping', 'abandoned building', 'random object']],
];

for (const [label, labels] of tests) {
  const result = await classifier(imgPath, labels);
  const top = result[0];
  const target = result.find(r => r.label === labels[0]);
  console.log(`${label.padEnd(25)} | top: "${top.label}" (${(top.score * 100).toFixed(0)}%) | target[0] "${labels[0]}": ${(target.score * 100).toFixed(0)}%`);
}

console.log('\n=== Test ảnh BIKINI (NSFW) vs actress query ===');
// Tải ảnh tương tự production
console.log('(Skipped — need bigger sample)');

console.log('\n=== Test với meaning Tiếng Việt ===');
const viTests = [
  ['bỏ rơi, ruồng bỏ', 'random unrelated thing'],
  ['mèo', 'random unrelated thing'],
  ['lễ hội', 'random unrelated thing'],
];
for (const labels of viTests) {
  const result = await classifier(imgPath, labels);
  console.log(`Target VI "${labels[0].padEnd(20)}" → top: "${result[0].label}" (${(result[0].score * 100).toFixed(0)}%)`);
}
