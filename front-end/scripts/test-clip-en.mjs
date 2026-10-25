import { pipeline } from '@huggingface/transformers';
import path from 'path';
const classifier = await pipeline('zero-shot-image-classification', 'Xenova/clip-vit-base-patch32');

const tests = [
  ['02_abandon.jpg', 'abandon'],
  ['15_actress.jpg', 'actress'],
  ['09_accident.jpg', 'accident'],
  ['18_adapt.jpg', 'adapt'],
  ['p_account.jpg', 'account'],
];

for (const [file, word] of tests) {
  const img = path.resolve('tmp-check-imgs-v2', file);
  // Test 4 variants of labels
  const variants = [
    [word, 'random unrelated thing', 'text card or letters'],
    [`a photo of ${word}`, 'random unrelated thing', 'text card or letters'],
    [`an image illustrating ${word}`, 'random unrelated thing', 'text card or letters'],
  ];
  console.log(`\n${word}:`);
  for (let i = 0; i < variants.length; i++) {
    const r = await classifier(img, variants[i]);
    const target = r.find(x => x.label === variants[i][0]);
    console.log(`  v${i+1}: "${variants[i][0].slice(0,30)}" → ${(target.score * 100).toFixed(0)}%`);
  }
}
