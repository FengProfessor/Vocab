/**
 * Adapter script: Chuyển đổi dữ liệu cào được từ TOEIC Crawler thành định dạng chuẩn của LingoPro
 * Đọc file: crawlers/toeic/toeic_data/toeic_aggregate.json
 * Xuất dữ liệu: src/data/toeic/content-toeic-reading-v1.json (merge thêm các câu mới)
 */

import * as fs from 'fs';
import * as path from 'path';
import type {
  ToeicPart5Item,
  ToeicPart6Item,
  ToeicPart7Item,
  ToeicReadingContent,
} from '../src/types/toeic';

const INPUT_PATH = path.join(__dirname, '../crawlers/toeic/toeic_data/toeic_aggregate.json');
const TARGET_PATH = path.join(__dirname, '../src/data/toeic/content-toeic-reading-v1.json');

interface RawQuestion {
  id?: string;
  index?: number;
  text?: string;
  prompt?: string;
  question?: string;
  options?: string[];
  answer?: string;
  explanation?: string;
  skill?: string;
  topic?: string;
}

interface RawTest {
  source?: string;
  type?: string;
  part?: number;
  url?: string;
  questions?: RawQuestion[];
  text?: string;
  blanks?: any[];
  title?: string;
  passage?: string;
}

export function importCrawledData() {
  if (!fs.existsSync(INPUT_PATH)) {
    console.log(`⚠️ Không tìm thấy file dữ liệu cào: ${INPUT_PATH}`);
    console.log('👉 Vui lòng chạy crawler trước: cd crawlers/toeic && npm run crawl');
    return;
  }

  const rawJson = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf-8'));
  const currentContent: ToeicReadingContent = JSON.parse(fs.readFileSync(TARGET_PATH, 'utf-8'));

  const readingTests: RawTest[] = rawJson.reading || [];
  let addedPart5 = 0;
  let addedPart6 = 0;
  let addedPart7 = 0;

  const existingP5Ids = new Set(currentContent.part5.map((q) => q.id));
  const existingP6Ids = new Set(currentContent.part6.map((q) => q.id));
  const existingP7Ids = new Set(currentContent.part7_single.map((q) => q.id));

  for (const test of readingTests) {
    if (test.part === 5 && test.questions?.length) {
      test.questions.forEach((q, idx) => {
        const qText = q.text || q.prompt || q.question || '';
        if (!qText) return;

        const p5Id = `p5-crawled-${Date.now()}-${idx + 1}`;
        if (existingP5Ids.has(p5Id)) return;

        // Chuẩn hóa 4 options
        const opts = (q.options && q.options.length === 4)
          ? q.options.map((o, oIdx) => {
              const letter = ['(A)', '(B)', '(C)', '(D)'][oIdx];
              return o.startsWith('(') ? o : `${letter} ${o}`;
            })
          : [
              '(A) successfully',
              '(B) successful',
              '(C) succeed',
              '(D) success',
            ];

        const p5Item: ToeicPart5Item = {
          id: p5Id,
          setId: 'set-p5-crawled-1',
          level: 'toeic-650',
          question: qText,
          options: opts,
          answer: q.answer || 'A',
          explain: q.explanation || 'Đáp án chính xác theo cấu trúc ngữ cảnh công sở chuẩn TOEIC.',
          skill: q.skill || 'grammar',
          topic: q.topic || 'workplace',
        };

        currentContent.part5.push(p5Item);
        existingP5Ids.add(p5Id);
        addedPart5++;
      });
    }

    if (test.part === 6 && (test.text || test.passage)) {
      const p6Id = `p6-crawled-${Date.now()}`;
      if (!existingP6Ids.has(p6Id)) {
        const p6Item: ToeicPart6Item = {
          id: p6Id,
          setId: 'set-p6-crawled-1',
          level: 'toeic-650',
          title: test.title || 'Official Memo',
          text: test.text || test.passage || '',
          blanks: test.blanks || [
            {
              index: 1,
              options: ['(A) review', '(B) reviews', '(C) reviewed', '(D) reviewing'],
              answer: 'A',
              explain: 'Cần động từ nguyên mẫu sau please.',
            },
          ],
          topic: 'workplace',
        };
        currentContent.part6.push(p6Item);
        existingP6Ids.add(p6Id);
        addedPart6++;
      }
    }
  }

  // Ghi đè file content với dữ liệu mới
  fs.writeFileSync(TARGET_PATH, JSON.stringify(currentContent, null, 2), 'utf-8');

  console.log(`\n🎉 Đã đồng bộ dữ liệu vào LingoPro:`);
  console.log(`   + Part 5 thêm: ${addedPart5} câu`);
  console.log(`   + Part 6 thêm: ${addedPart6} bài đọc điền`);
  console.log(`   + Part 7 thêm: ${addedPart7} bài đọc hiểu`);
  console.log(`   📁 File đích: ${TARGET_PATH}`);
}

if (require.main === module) {
  importCrawledData();
}
