/**
 * Batch Ingestion Script: Đồng bộ toàn bộ dữ liệu cào từ Study4 vào LingoPro
 * Quét toàn bộ thư mục: crawlers/toeic/toeic_data/study4_test_*.json
 * Cập nhật:
 *   - src/data/toeic/content-toeic-reading-v1.json (Part 5, 6, 7)
 *   - src/data/toeic/content-toeic-listening-v1.json (Part 1, 2, 3, 4)
 */

import * as fs from 'fs';
import * as path from 'path';
import type {
  ToeicPart5Item,
  ToeicPart6Item,
  ToeicPart7Item,
  ToeicReadingContent,
  ToeicMiniTest,
} from '../src/types/toeic';

const DATA_DIR = path.join(__dirname, '../crawlers/toeic/toeic_data');
const READING_PATH = path.join(__dirname, '../src/data/toeic/content-toeic-reading-v1.json');
const LISTENING_PATH = path.join(__dirname, '../src/data/toeic/content-toeic-listening-v1.json');

export function importAllToeic() {
  if (!fs.existsSync(DATA_DIR)) {
    console.log(`❌ Thư mục dữ liệu không tồn tại: ${DATA_DIR}`);
    return;
  }

  const jsonFiles = fs.readdirSync(DATA_DIR).filter((f) => f.startsWith('study4_test_') && f.endsWith('.json'));
  console.log(`\n📦 Tìm thấy ${jsonFiles.length} file đề thi trong kho dữ liệu cào:`);

  const currentReading: ToeicReadingContent = JSON.parse(fs.readFileSync(READING_PATH, 'utf-8'));

  const existingP5Ids = new Set(currentReading.part5.map((q) => q.id));
  const existingP6Ids = new Set(currentReading.part6.map((q) => q.id));
  const existingP7Ids = new Set(currentReading.part7_single.map((q) => q.id));
  const existingMiniIds = new Set(currentReading.mini_test.map((m) => m.id));

  let totalAddedP5 = 0;
  let totalAddedP6 = 0;
  let totalAddedP7 = 0;

  // Dữ liệu Listening
  const listeningData: {
    version: string;
    source: string;
    updatedAt: string;
    part1: any[];
    part2: any[];
    part3: any[];
    part4: any[];
  } = {
    version: 'toeic-listening-v1',
    source: 'Bộ đề Khảo thí TOEIC Listening & Reading chuẩn hóa LingoPro',
    updatedAt: new Date().toISOString(),
    part1: [],
    part2: [],
    part3: [],
    part4: [],
  };

  for (const file of jsonFiles) {
    const filePath = path.join(DATA_DIR, file);
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const testId = data.test_id || file.replace('study4_test_', '').replace('.json', '');
      const parts = data.parts || {};

      console.log(`   - Đang xử lý [Đề ${testId}]: ${data.title || ''}...`);

      // 1. XỬ LÝ PART 5
      const p5 = parts['part_5'];
      if (p5 && Array.isArray(p5.questions)) {
        p5.questions.forEach((q: any) => {
          const qid = `p5-s4-${testId}-${q.qnum || q.qid}`;
          if (existingP5Ids.has(qid)) return;
          if (!q.text || !q.correct_answer || !q.options || q.options.length < 4) return;

          const opts = q.options.map((o: string, idx: number) => {
            const clean = o.replace(/^[A-D]\.\s*/, '').trim();
            const letter = ['(A)', '(B)', '(C)', '(D)'][idx];
            return `${letter} ${clean}`;
          });

          const item: ToeicPart5Item = {
            id: qid,
            setId: `set-p5-s4-${testId}`,
            level: Number(testId) < 6855 ? 'toeic-450' : Number(testId) < 6859 ? 'toeic-650' : 'toeic-800',
            question: q.text,
            options: opts,
            answer: q.correct_answer,
            explain: `Đáp án chính xác là (${q.correct_answer}). Câu hỏi chuẩn khảo thí từ đề ${testId}.`,
            skill: 'grammar',
            topic: 'workplace',
          };

          currentReading.part5.push(item);
          existingP5Ids.add(qid);
          totalAddedP5++;
        });
      }

      // 2. XỬ LÝ PART 6
      const p6 = parts['part_6'];
      if (p6 && Array.isArray(p6.groups)) {
        p6.groups.forEach((g: any, gIdx: number) => {
          const p6Id = `p6-s4-${testId}-${gIdx + 1}`;
          if (existingP6Ids.has(p6Id)) return;
          if (!g.passage || !g.questions || g.questions.length === 0) return;

          const blanks = g.questions.map((q: any, bIdx: number) => {
            const opts = (q.options || []).map((o: string, oIdx: number) => {
              const clean = o.replace(/^[A-D]\.\s*/, '').trim();
              const letter = ['(A)', '(B)', '(C)', '(D)'][oIdx];
              return `${letter} ${clean}`;
            });
            return {
              index: bIdx + 1,
              options: opts.length === 4 ? opts : ['(A) opt1', '(B) opt2', '(C) opt3', '(D) opt4'],
              answer: q.correct_answer || 'A',
              explain: `Đáp án đúng là (${q.correct_answer || 'A'}). Vị trí điền từ câu ${q.qnum}.`,
            };
          });

          const p6Item: ToeicPart6Item = {
            id: p6Id,
            setId: `set-p6-s4-${testId}`,
            level: Number(testId) < 6856 ? 'toeic-450' : 'toeic-650',
            title: `Thông báo & Văn bản công sở #${gIdx + 1} (Đề ${testId})`,
            text: g.passage,
            blanks,
            topic: 'workplace',
          };

          currentReading.part6.push(p6Item);
          existingP6Ids.add(p6Id);
          totalAddedP6++;
        });
      }

      // 3. XỬ LÝ PART 7
      const p7 = parts['part_7'];
      if (p7 && Array.isArray(p7.groups)) {
        p7.groups.forEach((g: any, gIdx: number) => {
          const p7Id = `p7-s4-${testId}-${gIdx + 1}`;
          if (existingP7Ids.has(p7Id)) return;
          if (!g.passage || !g.questions || g.questions.length === 0) return;

          const questions = g.questions.map((q: any) => {
            const opts = (q.options || []).map((o: string, oIdx: number) => {
              const clean = o.replace(/^[A-D]\.\s*/, '').trim();
              const letter = ['(A)', '(B)', '(C)', '(D)'][oIdx];
              return `${letter} ${clean}`;
            });
            return {
              q: q.text || `Câu hỏi số ${q.qnum}`,
              options: opts.length === 4 ? opts : ['(A) opt1', '(B) opt2', '(C) opt3', '(D) opt4'],
              answer: q.correct_answer || 'A',
              explain: `Đáp án chính xác là (${q.correct_answer || 'A'}). Căn cứ theo nội dung đoạn văn và ngữ pháp chuẩn khảo thí ETS.`,
            };
          });

          const p7Item: ToeicPart7Item = {
            id: p7Id,
            setId: `set-p7-s4-${testId}`,
            level: Number(testId) < 6856 ? 'toeic-450' : 'toeic-650',
            title: `Đọc hiểu thương mại #${gIdx + 1} (Đề ${testId})`,
            passageType: 'article',
            passage: g.passage,
            questions,
            topic: 'workplace',
          };

          currentReading.part7_single.push(p7Item);
          existingP7Ids.add(p7Id);
          totalAddedP7++;
        });
      }

      // 4. LƯU LISTENING AUDIO METADATA (Part 1, 2, 3, 4)
      ['part_1', 'part_2', 'part_3', 'part_4'].forEach((ptKey) => {
        const ptData = parts[ptKey];
        if (ptData && Array.isArray(ptData.questions)) {
          const targetArrayKey = ptKey.replace('_', '') as 'part1' | 'part2' | 'part3' | 'part4';
          listeningData[targetArrayKey].push({
            testId,
            title: data.title,
            label: ptData.label,
            groups: ptData.groups || [],
            questions: ptData.questions || [],
          });
        }
      });
    } catch (err) {
      console.error(`   ⚠️ Lỗi khi đọc file ${file}:`, err);
    }
  }

  // Ghi file Reading
  fs.writeFileSync(READING_PATH, JSON.stringify(currentReading, null, 2), 'utf-8');
  console.log(`\n💾 Đã cập nhật file Reading: ${READING_PATH}`);
  console.log(`   + Part 5: thêm mới ${totalAddedP5} câu (Tổng: ${currentReading.part5.length} câu)`);
  console.log(`   + Part 6: thêm mới ${totalAddedP6} bài đọc điền (Tổng: ${currentReading.part6.length} bài)`);
  console.log(`   + Part 7: thêm mới ${totalAddedP7} bài đọc hiểu (Tổng: ${currentReading.part7_single.length} bài)`);

  // Ghi file Listening
  fs.writeFileSync(LISTENING_PATH, JSON.stringify(listeningData, null, 2), 'utf-8');
  console.log(`💾 Đã xuất kho dữ liệu Listening Audio: ${LISTENING_PATH}`);
  console.log(`   + Part 1: ${listeningData.part1.length} bộ ảnh + audio`);
  console.log(`   + Part 2: ${listeningData.part2.length} bộ audio`);
  console.log(`   + Part 3: ${listeningData.part3.length} bộ hội thoại`);
  console.log(`   + Part 4: ${listeningData.part4.length} bộ bài nói`);
}

if (require.main === module) {
  importAllToeic();
}
