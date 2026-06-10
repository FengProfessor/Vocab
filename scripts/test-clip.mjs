/**
 * Test CLIP với zero-shot classification:
 * - Cho ảnh + array of labels
 * - CLIP trả probabilities cho mỗi label
 * - Score = probability cho label đúng
 */
import { pipeline } from '@huggingface/transformers';
import fs from 'fs';
import path from 'path';

console.log('Loading CLIP model (lần đầu ~30-60s download/cache)...');
const t0 = Date.now();
const classifier = await pipeline('zero-shot-image-classification', 'Xenova/clip-vit-base-patch32');
console.log(`Loaded in ${((Date.now() - t0) / 1000).toFixed(1)}s\n`);

const tests = [
  { file: '02_abandon.jpg', word: 'abandon', meaning: 'abandoned building, deserted, ruined' },
  { file: '15_actress.jpg', word: 'actress', meaning: 'female actor on stage or film' },
  { file: '09_accident.jpg', word: 'accident', meaning: 'car crash, traffic accident' },
  { file: '18_adapt.jpg', word: 'adapt', meaning: 'adaptation, prosthetic leg, overcoming' },
  { file: 'p_account.jpg', word: 'account', meaning: 'accounting, bookkeeping, finance work' },
];

for (const t of tests) {
  const imgPath = path.resolve('tmp-check-imgs-v2', t.file);
  if (!fs.existsSync(imgPath)) {
    console.log('SKIP', t.file, '(not found)');
    continue;
  }

  const t1 = Date.now();
  // Labels: target meaning vs distractors
  const labels = [
    t.meaning,
    'random unrelated object',
    'dictionary text card with letters',
    'blank empty image',
  ];

  const result = await classifier(imgPath, labels);
  const matchScore = result[0].label === t.meaning ? result[0].score :
                     (result.find(r => r.label === t.meaning)?.score || 0);

  const dt = ((Date.now() - t1) / 1000).toFixed(1);
  console.log(`${t.word.padEnd(10)} | ${dt}s | top: "${result[0].label.slice(0, 30)}" (${(result[0].score * 100).toFixed(0)}%) | target: ${(matchScore * 100).toFixed(0)}%`);
}
