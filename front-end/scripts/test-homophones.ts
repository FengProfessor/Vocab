/**
 * Test homophones: kiểm tra xem từ "bank" với 2 nghĩa "bờ sông" và "ngân hàng"
 * có trả về 2 ảnh khác nhau phù hợp hay không.
 * Chạy: cd web-app && npx tsx scripts/test-homophones.ts
 */
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
  const { resolveWordImage } = await import('../src/lib/image-pipeline');

  console.log('=== KHỞI ĐỘNG TEST TỪ ĐA NGHĨA (HOMOPHONES) ===\n');

  const testCases = [
    {
      word: 'bank',
      pos: 'noun',
      definition: 'bờ sông, dải đất dọc theo mép nước',
    },
    {
      word: 'bank',
      pos: 'noun',
      definition: 'ngân hàng, tổ chức tài chính nhận tiền gửi',
    },
  ];

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    console.log(`[Test #${i + 1}] Từ: "${tc.word}" (${tc.pos}) | Nghĩa: "${tc.definition}"`);
    const t0 = Date.now();
    try {
      const result = await resolveWordImage({
        word: tc.word,
        pos: tc.pos,
        definition: tc.definition,
        meaningCount: 2,
        forceVision: true,
      });
      const dt = ((Date.now() - t0) / 1000).toFixed(1);
      console.log(`  -> URL: ${result.url || 'KHÔNG TÌM THẤY'}`);
      console.log(`  -> Nguồn: ${result.source}`);
      console.log(`  -> Query đã dùng: "${result.query}"`);
      console.log(`  -> Điểm tin cậy (Vision): ${result.confidence ?? 'n/a'}`);
      console.log(`  -> Thời gian: ${dt}s\n`);
    } catch (e) {
      console.error(`  -> LỖI:`, (e as Error).message, '\n');
    }
  }
}

main().catch(console.error);
