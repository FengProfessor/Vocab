/**
 * Quick test: gọi trực tiếp gemini-2.5-flash-image-preview (Nano Banana).
 * Chạy: cd web-app && npx tsx scripts/test-gemini-image.ts
 */
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MODEL = process.env.TEST_MODEL || 'gemini-2.5-flash-image';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

async function main() {
  const raw = process.env.GEMINI_API_KEY || '';
  const keys = raw.split(',').map((k) => k.trim()).filter(Boolean);
  if (keys.length === 0) {
    console.error('Không có GEMINI_API_KEY');
    process.exit(1);
  }
  console.log(`Tìm thấy ${keys.length} key(s). Test từng key:\n`);

  const prompt = `Generate a clear, simple illustration suitable for an English vocabulary flashcard.
Subject: a red apple on a white background
Requirements:
- Centered subject, minimal background, no text
- Photographic style, vibrant colors`;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const masked = key.slice(0, 8) + '...' + key.slice(-4);
    process.stdout.write(`[key #${i + 1} ${masked}] `);
    try {
      const res = await fetch(`${ENDPOINT}?key=${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ['IMAGE'] },
        }),
        signal: AbortSignal.timeout(45000),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        console.log(`HTTP ${res.status}: ${txt.slice(0, 250).replace(/\n/g, ' ')}`);
        continue;
      }
      const json = await res.json();
      const parts = json?.candidates?.[0]?.content?.parts || [];
      const img = parts.find((p: any) => p.inlineData?.data);
      if (!img) {
        console.log(`response không có ảnh. Parts:`, JSON.stringify(parts).slice(0, 200));
        continue;
      }
      const buf = Buffer.from(img.inlineData.data, 'base64');
      const outFile = path.resolve(process.cwd(), `tmp-gemini-test-${i + 1}.png`);
      fs.writeFileSync(outFile, buf);
      console.log(`OK — ${buf.byteLength} bytes → ${outFile}`);
    } catch (e) {
      console.log(`EXC: ${(e as Error).message}`);
    }
  }
}

main();
