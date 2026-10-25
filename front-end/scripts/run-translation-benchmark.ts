import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { translateWithDetails } from '../src/lib/api/translation';
import { extractPhrasesFromSentence } from '../src/lib/api/phrase-extractor';
import type { TranslationBenchmarkItem } from './generate-1000-translation-tests';

async function runBenchmark() {
  const jsonPath = path.resolve(process.cwd(), 'data', 'benchmarks', 'translation-1000-test-suite.json');
  if (!fs.existsSync(jsonPath)) {
    console.error(`Benchmark file not found at ${jsonPath}`);
    process.exit(1);
  }

  const allItems: TranslationBenchmarkItem[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

  // Parse arguments
  const args = process.argv.slice(2);
  let limit = 20; // Default sample size 20 to test quickly
  let selectedCategory: string = 'all';

  for (const arg of args) {
    if (arg.startsWith('--limit=')) {
      limit = parseInt(arg.replace('--limit=', ''), 10) || 20;
    }
    if (arg.startsWith('--category=')) {
      selectedCategory = arg.replace('--category=', '');
    }
  }

  let testPool = allItems;
  if (selectedCategory !== 'all') {
    testPool = testPool.filter((i) => i.category === selectedCategory);
  }

  // Pick representative sample evenly across categories
  const sample: TranslationBenchmarkItem[] = [];
  const step = Math.max(1, Math.floor(testPool.length / limit));
  for (let i = 0; i < testPool.length && sample.length < limit; i += step) {
    sample.push(testPool[i]);
  }

  console.log('='.repeat(80));
  console.log(`🚀 BẮT ĐẦU CHẠY BENCHMARK DỊCH THUẬT (MẪU ${sample.length} / ${allItems.length} CÂU)`);
  console.log(`📂 Danh mục: ${selectedCategory.toUpperCase()}`);
  console.log('='.repeat(80));

  let passedNuance = 0;
  let trapAvoided = 0;
  let phraseExtractedCount = 0;

  for (let i = 0; i < sample.length; i++) {
    const item = sample[i];
    console.log(`\n[${i + 1}/${sample.length}] ID #${item.id} [${item.level}] (${item.categoryLabel})`);
    console.log(`🇬🇧 EN: "${item.english}"`);
    console.log(`💡 Sắc thái cốt lõi: ${item.keyNuance}`);
    console.log(`⚠️ Bẫy dịch thô cần tránh: "${item.badTranslationTrap}"`);

    try {
      // 1. Dịch câu
      const transResult = await translateWithDetails(item.english, {
        sourceLang: 'en',
        targetLang: 'vi',
      });
      console.log(`🇻🇳 Bản dịch máy: "${transResult.translatedText}" (${transResult.provider})`);

      // Kiểm tra xem có bị dính bẫy dịch thô từng chữ không
      const badTraps = item.badTranslationTrap.split('/').map((s) => s.trim().toLowerCase());
      const translationLower = transResult.translatedText.toLowerCase();
      const fellIntoTrap = badTraps.some((trap) => trap && translationLower.includes(trap));

      if (fellIntoTrap) {
        console.log(`   ❌ CẢNH BÁO: Bản dịch máy bị dính bẫy dịch thô ("${item.badTranslationTrap}")`);
      } else {
        trapAvoided++;
        console.log(`   ✅ Bản dịch máy tránh được bẫy dịch thô.`);
      }

      // 2. Bóc tách cụm từ
      const phrases = await extractPhrasesFromSentence(item.english, transResult.translatedText);
      if (phrases.length > 0) {
        phraseExtractedCount++;
        console.log(`   🎯 Bóc tách được ${phrases.length} cụm từ:`);
        phrases.forEach((p) => {
          console.log(`      • [${p.type.toUpperCase()}] "${p.baseForm}": ${p.meaningVi}`);
        });

        // Kiểm tra xem cụm bóc tách có chứa nghĩa cốt lõi không
        const meanings = phrases.map((p) => p.meaningVi.toLowerCase() + ' ' + p.baseForm.toLowerCase()).join(' ');
        const expectedWords = item.expectedMeaningVi.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
        const hasNuance = expectedWords.some((w) => meanings.includes(w));
        if (hasNuance) {
          passedNuance++;
          console.log(`   ✅ Bóc tách nắm bắt đúng sắc thái kỳ vọng ("${item.expectedMeaningVi}")`);
        }
      } else {
        console.log(`   ⚪ Không bóc tách được cụm từ nào.`);
      }
    } catch (err) {
      console.error(`   ❌ Lỗi khi test câu #${item.id}:`, (err as Error).message);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('📊 KẾT QUẢ BENCHMARK DỊCH THUẬT');
  console.log('='.repeat(80));
  console.log(`- Tổng số câu test: ${sample.length}`);
  console.log(`- Tránh được bẫy dịch thô (Trap Avoided): ${trapAvoided} / ${sample.length} (${Math.round((trapAvoided / sample.length) * 100)}%)`);
  console.log(`- Tỷ lệ bóc tách cụm từ thành công: ${phraseExtractedCount} / ${sample.length} (${Math.round((phraseExtractedCount / sample.length) * 100)}%)`);
  console.log(`- Bóc tách khớp đúng sắc thái khó: ${passedNuance} / ${sample.length} (${Math.round((passedNuance / sample.length) * 100)}%)`);
  console.log('='.repeat(80));
}

runBenchmark().catch(console.error);
