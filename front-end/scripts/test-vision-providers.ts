/**
 * [TestVision] Smoke test 3 providers Vision + orchestrator.
 * Chạy: cd web-app && npx tsx scripts/test-vision-providers.ts
 */
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SAMPLE_URL = 'https://images.pexels.com/photos/30354454/pexels-photo-30354454.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';
const CTX = { word: 'festival', pos: 'noun', definition: 'Lễ hội, ngày hội' };

async function main() {
  console.log('=== TEST VISION PROVIDERS ===\n');
  console.log('Test URL:', SAMPLE_URL);
  console.log('Word:', CTX.word, '|', CTX.definition);
  console.log();

  // 1. HuggingFace
  console.log('--- 1. HuggingFace ---');
  if (!process.env.HF_TOKEN) {
    console.log('SKIP: no HF_TOKEN');
  } else {
    const t1 = Date.now();
    const { verifyImageMeaningHF } = await import('../src/lib/vision-providers/huggingface-vision');
    const res = await verifyImageMeaningHF(SAMPLE_URL, CTX);
    console.log(`  score=${res.score} (${((Date.now() - t1) / 1000).toFixed(1)}s) | ${res.reason}`);
  }
  console.log();

  // 2. Cloudflare
  console.log('--- 2. Cloudflare Workers AI ---');
  if (!process.env.CLOUDFLARE_ACCOUNT_ID || !process.env.CLOUDFLARE_API_TOKEN) {
    console.log('SKIP: no CF credentials');
  } else {
    const t1 = Date.now();
    const { verifyImageMeaningCF } = await import('../src/lib/vision-providers/cloudflare-vision');
    const res = await verifyImageMeaningCF(SAMPLE_URL, CTX);
    console.log(`  score=${res.score} (${((Date.now() - t1) / 1000).toFixed(1)}s) | ${res.reason}`);
  }
  console.log();

  // 3. Groq (có thể đang exhausted)
  console.log('--- 3. Groq ---');
  if (!process.env.GROQ_API_KEY) {
    console.log('SKIP: no GROQ_API_KEY');
  } else {
    const t1 = Date.now();
    const { verifyImageMeaningGroq } = await import('../src/lib/groq-vision');
    const res = await verifyImageMeaningGroq(SAMPLE_URL, CTX);
    console.log(`  score=${res.score} (${((Date.now() - t1) / 1000).toFixed(1)}s) | ${res.reason}`);
  }
  console.log();

  // 4. Orchestrator round-robin (5 calls)
  console.log('--- 4. Orchestrator round-robin (5 calls) ---');
  const { verifyImageMulti } = await import('../src/lib/vision-providers/orchestrator');
  for (let i = 0; i < 5; i++) {
    const t1 = Date.now();
    const res = await verifyImageMulti(SAMPLE_URL, CTX);
    console.log(`  [${i + 1}] provider=${res.provider} score=${res.score} (${((Date.now() - t1) / 1000).toFixed(1)}s) | ${res.reason.slice(0, 60)}`);
    await new Promise((r) => setTimeout(r, 800));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
