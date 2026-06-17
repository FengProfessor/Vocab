/**
 * Test & So Sánh Stable Diffusion WebUI Local vs Pollinations AI (Online).
 * Chạy: cd web-app && npx tsx scripts/test-local-sd.ts
 */
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { search as searchSdWebui } from '../src/lib/image-sources/sd-webui';
import { search as searchPollinations } from '../src/lib/image-sources/pollinations';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
  const query = 'conundrum visual concept';
  const outDir = path.resolve(process.cwd(), 'scratch');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  console.log('=== SO SÁNH ENGINE TẠO ẢNH AI ===');
  console.log(`Từ khóa test: "${query}"\n`);

  // 1. Chạy Test Stable Diffusion Local
  console.log('⏳ 1. Đang gọi Stable Diffusion Local (http://127.0.0.1:7860)...');
  const t0 = Date.now();
  let localUrls: string[] = [];
  try {
    localUrls = await searchSdWebui(query, 1);
  } catch (err: any) {
    console.error('❌ SD WebUI Local gặp lỗi:', err.message);
  }
  const t1 = Date.now();

  if (localUrls.length > 0 && localUrls[0].startsWith('data:image/')) {
    const base64Data = localUrls[0].split(',')[1];
    const buf = Buffer.from(base64Data, 'base64');
    const outPath = path.join(outDir, 'test-sd-local.png');
    fs.writeFileSync(outPath, buf);
    console.log(`✅ Thành công! Thời gian: ${((t1 - t0) / 1000).toFixed(2)}s`);
    console.log(`   Kích thước ảnh: ${buf.byteLength} bytes`);
    console.log(`   Lưu file tại: ${outPath}\n`);
  } else {
    console.log('❌ SD WebUI Local không chạy hoặc bị tắt (ENABLE_LOCAL_SD=false).');
    console.log('   (Hãy kiểm tra xem Stable Diffusion đã khởi chạy với cờ --api chưa)\n');
  }

  // 2. Chạy Test Pollinations AI (Online)
  console.log('⏳ 2. Đang gọi Pollinations AI (Online Generator)...');
  const t2 = Date.now();
  let pollUrls: string[] = [];
  try {
    pollUrls = await searchPollinations(query, 1);
  } catch (err: any) {
    console.error('❌ Pollinations AI gặp lỗi:', err.message);
  }
  const t3 = Date.now();

  if (pollUrls.length > 0) {
    console.log(`✅ Thành công! Thời gian phản hồi: ${((t3 - t2) / 1000).toFixed(2)}s`);
    console.log(`   URL trả về: ${pollUrls[0]}`);
    try {
      const res = await fetch(pollUrls[0]);
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        const outPath = path.join(outDir, 'test-pollinations.png');
        fs.writeFileSync(outPath, buf);
        console.log(`   Kích thước ảnh tải về: ${buf.byteLength} bytes`);
        console.log(`   Lưu file tại: ${outPath}\n`);
      } else {
        console.log('   ⚠️ Không tải được ảnh thực tế từ URL của Pollinations.');
      }
    } catch (e: any) {
      console.log('   ⚠️ Lỗi khi tải ảnh Pollinations:', e.message);
    }
  } else {
    console.log('❌ Không nhận được URL nào từ Pollinations AI.\n');
  }
}

main().catch((err) => console.error('Lỗi thực thi script:', err));
