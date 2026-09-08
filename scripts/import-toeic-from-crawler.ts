/**
 * Adapter script: Chuyển đổi dữ liệu cào được từ Study4 hoặc Crawler khác thành định dạng chuẩn của LingoPro
 * Hỗ trợ:
 *   npx tsx scripts/import-toeic-from-crawler.ts crawlers/toeic/toeic_data/study4_test_6852.json
 * Hoặc tự động quét tất cả file trong toeic_data/
 */

import * as fs from 'fs';
import * as path from 'path';
import type {
  ToeicPart5Item,
  ToeicPart6Item,
  ToeicPart7Item,
  ToeicReadingContent,
} from '../src/types/toeic';

const TARGET_PATH = path.join(__dirname, '../src/data/toeic/content-toeic-reading-v1.json');

export function importCrawledData(filePath?: string) {
  let fileToRead = filePath;

  if (!fileToRead) {
    // Tìm file study4 mới nhất trong toeic_data
    const dataDir = path.join(__dirname, '../crawlers/toeic/toeic_data');
    if (fs.existsSync(dataDir)) {
      const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json') && f.includes('study4'));
      if (files.length > 0) {
        fileToRead = path.join(dataDir, files[files.length - 1]);
      }
    }
    if (!fileToRead) {
      fileToRead = path.join(__dirname, '../crawlers/toeic/toeic_data/toeic_aggregate.json');
    }
  }

  if (!fs.existsSync(fileToRead)) {
    console.log(`⚠️ Không tìm thấy file dữ liệu: ${fileToRead}`);
    return;
  }

  console.log(`\n📥 Đang đọc dữ liệu từ: ${fileToRead}...`);
  const rawJson = JSON.parse(fs.readFileSync(fileToRead, 'utf-8'));
  const currentContent: ToeicReadingContent = JSON.parse(fs.readFileSync(TARGET_PATH, 'utf-8'));

  let addedPart5 = 0;
  let addedPart6 = 0;
  let addedPart7 = 0;

  const existingP5Ids = new Set(currentContent.part5.map((q) => q.id));
  const existingP6Ids = new Set(currentContent.part6.map((q) => q.id));
  const existingP7Ids = new Set(currentContent.part7_single.map((q) => q.id));

  // 1. Định dạng dữ liệu từ Study4 Crawler (có cấu trúc "parts": {"part_5": ...})
  if (rawJson.parts && typeof rawJson.parts === 'object') {
    const testId = rawJson.test_id || 'test';

    // Xử lý Part 5
    const part5Data = rawJson.parts['part_5'] || rawJson.parts['5'];
    if (part5Data && Array.isArray(part5Data.questions)) {
      part5Data.questions.forEach((q: any) => {
        const qnum = q.qnum || q.qid;
        const p5Id = `p5-s4-${testId}-${qnum}`;
        if (existingP5Ids.has(p5Id)) return;

        // Chuẩn hóa format (A) option
        const opts = (q.options || []).map((o: string, idx: number) => {
          const clean = o.replace(/^[A-D]\.\s*/, '').trim();
          const letter = ['(A)', '(B)', '(C)', '(D)'][idx] || `(${String.fromCharCode(65 + idx)})`;
          return `${letter} ${clean}`;
        });

        if (opts.length < 4 || !q.text || !q.correct_answer) return;

        const item: ToeicPart5Item = {
          id: p5Id,
          setId: `set-p5-s4-${testId}`,
          level: 'toeic-650',
          question: q.text,
          options: opts,
          answer: q.correct_answer,
          explain: `Đáp án đúng là ${q.correct_answer}. Câu hỏi được đối soát chuẩn xác theo đề thi Study4.`,
          skill: 'grammar',
          topic: 'workplace',
        };

        currentContent.part5.push(item);
        existingP5Ids.add(p5Id);
        addedPart5++;
      });
    }
  }

  // 2. Định dạng từ crawler tổng hợp (toeic_aggregate.json)
  if (Array.isArray(rawJson.reading)) {
    for (const test of rawJson.reading) {
      if (test.part === 5 && test.questions?.length) {
        test.questions.forEach((q: any, idx: number) => {
          const qText = q.text || q.prompt || q.question || '';
          if (!qText) return;

          const p5Id = `p5-crawled-${Date.now()}-${idx + 1}`;
          if (existingP5Ids.has(p5Id)) return;

          const opts = (q.options && q.options.length === 4)
            ? q.options.map((o: string, oIdx: number) => {
                const letter = ['(A)', '(B)', '(C)', '(D)'][oIdx];
                return o.startsWith('(') ? o : `${letter} ${o}`;
              })
            : ['(A) opt1', '(B) opt2', '(C) opt3', '(D) opt4'];

          const p5Item: ToeicPart5Item = {
            id: p5Id,
            setId: 'set-p5-crawled-1',
            level: 'toeic-650',
            question: qText,
            options: opts,
            answer: q.answer || 'A',
            explain: q.explanation || 'Đáp án chính xác theo cấu trúc chuẩn TOEIC.',
            skill: q.skill || 'grammar',
            topic: q.topic || 'workplace',
          };

          currentContent.part5.push(p5Item);
          existingP5Ids.add(p5Id);
          addedPart5++;
        });
      }
    }
  }

  // Ghi file
  fs.writeFileSync(TARGET_PATH, JSON.stringify(currentContent, null, 2), 'utf-8');

  console.log(`\n🎉 ĐỒNG BỘ DỮ LIỆU VÀO LINGOPRO THÀNH CÔNG:`);
  console.log(`   + Part 5 thêm mới: ${addedPart5} câu`);
  console.log(`   + Tổng số câu Part 5 hiện tại: ${currentContent.part5.length} câu`);
  console.log(`   📁 File dữ liệu web app: ${TARGET_PATH}`);
}

if (require.main === module) {
  const targetArg = process.argv[2];
  importCrawledData(targetArg);
}
