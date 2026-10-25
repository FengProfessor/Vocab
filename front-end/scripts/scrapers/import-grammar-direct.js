/**
 * Import grammar từ grammar_ocr.json vào Supabase.
 * Dùng page-range tĩnh từ Mục Lục thay vì keyword detection.
 * OCR_index = PDF_page - 1
 *
 * Chạy (từ web-app/):
 *   node scripts/scrapers/import-grammar-direct.js [--dry-run]
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DRY_RUN = process.argv.includes('--dry-run');
const NO_CLEAR = process.argv.includes('--no-clear');
const TOPICS_ARG = process.argv.find(a => a.startsWith('--topics='));
const FILTER_SLUGS = TOPICS_ARG ? TOPICS_ARG.split('=')[1].split(',') : null;

// =============================================
// 1. PAGE RANGE MAP (từ Mục Lục sách Mai Lan Hương)
// OCR_index = PDF_page - 1
// =============================================
const TOPIC_RANGES = [
  { slug: 'danh-tu',           title: 'Nouns',                              title_vi: 'Danh từ',                                level: 'beginner',     ocrStart: 4,   ocrEnd: 24  },
  { slug: 'dai-tu',            title: 'Pronouns',                           title_vi: 'Đại từ',                                 level: 'beginner',     ocrStart: 25,  ocrEnd: 48  },
  { slug: 'tinh-tu',           title: 'Adjectives',                         title_vi: 'Tính từ',                                level: 'beginner',     ocrStart: 49,  ocrEnd: 67  },
  { slug: 'trang-tu',          title: 'Adverbs',                            title_vi: 'Trạng từ',                               level: 'beginner',     ocrStart: 68,  ocrEnd: 80  },
  { slug: 'so-sanh',           title: 'Comparison of Adjectives & Adverbs', title_vi: 'So sánh tính từ và trạng từ',            level: 'beginner',     ocrStart: 81,  ocrEnd: 93  },
  { slug: 'dong-tu',           title: 'Verbs',                              title_vi: 'Động từ',                                level: 'beginner',     ocrStart: 94,  ocrEnd: 130 },
  { slug: 'cum-dong-tu',       title: 'Phrasal Verbs',                      title_vi: 'Cụm động từ',                            level: 'intermediate', ocrStart: 131, ocrEnd: 144 },
  { slug: 'gioi-tu',           title: 'Prepositions',                       title_vi: 'Giới từ',                                level: 'beginner',     ocrStart: 145, ocrEnd: 167 },
  { slug: 'lien-tu',           title: 'Conjunctions',                       title_vi: 'Liên từ',                                level: 'beginner',     ocrStart: 168, ocrEnd: 173 },
  { slug: 'mao-tu',            title: 'Articles',                           title_vi: 'Mạo từ',                                 level: 'beginner',     ocrStart: 174, ocrEnd: 188 },
  { slug: 'thi',               title: 'Tenses',                             title_vi: 'Thì',                                    level: 'intermediate', ocrStart: 189, ocrEnd: 224 },
  { slug: 'phoi-hop-thi',      title: 'The Sequence of Tenses',             title_vi: 'Sự phối hợp thì',                        level: 'intermediate', ocrStart: 225, ocrEnd: 233 },
  { slug: 'menh-de-wish',      title: 'Clauses after Wish and If Only',     title_vi: 'Mệnh đề sau Wish và If Only',            level: 'intermediate', ocrStart: 234, ocrEnd: 237 },
  { slug: 'menh-de-muc-dich',  title: 'Purpose Clauses',                    title_vi: 'Cụm từ và mệnh đề chỉ mục đích',         level: 'intermediate', ocrStart: 238, ocrEnd: 241 },
  { slug: 'menh-de-ket-qua',   title: 'Result Clauses',                     title_vi: 'Cụm từ và mệnh đề chỉ kết quả',          level: 'intermediate', ocrStart: 242, ocrEnd: 246 },
  { slug: 'menh-de-nguyen-nhan', title: 'Cause & Reason Clauses',           title_vi: 'Cụm từ và mệnh đề chỉ nguyên nhân',      level: 'intermediate', ocrStart: 247, ocrEnd: 249 },
  { slug: 'menh-de-tuong-phan', title: 'Contrast Clauses',                  title_vi: 'Cụm từ và mệnh đề chỉ sự tương phản',   level: 'intermediate', ocrStart: 250, ocrEnd: 253 },
  { slug: 'as-if-as-though',   title: 'As if, As though, Would rather',     title_vi: 'As if, As though, Would rather',          level: 'intermediate', ocrStart: 254, ocrEnd: 259 },
  { slug: 'menh-de-danh-tu',   title: 'Noun Clauses',                       title_vi: 'Mệnh đề danh từ',                        level: 'intermediate', ocrStart: 260, ocrEnd: 261 },
  { slug: 'menh-de-quan-he',   title: 'Relative Clauses',                   title_vi: 'Mệnh đề quan hệ',                        level: 'intermediate', ocrStart: 262, ocrEnd: 278 },
  { slug: 'cau',               title: 'Sentences',                          title_vi: 'Câu',                                    level: 'intermediate', ocrStart: 279, ocrEnd: 297 },
  { slug: 'nhan-manh',         title: 'Emphasis',                           title_vi: 'Hình thức nhấn mạnh',                    level: 'advanced',     ocrStart: 298, ocrEnd: 303 },
  { slug: 'cau-dieu-kien',     title: 'Conditional Sentences',              title_vi: 'Câu điều kiện',                          level: 'intermediate', ocrStart: 304, ocrEnd: 315 },
  { slug: 'loi-noi-gian-tiep', title: 'Indirect Speech',                    title_vi: 'Lời nói gián tiếp',                      level: 'intermediate', ocrStart: 316, ocrEnd: 331 },
  { slug: 'cau-bi-dong',       title: 'Passive Sentences',                  title_vi: 'Câu bị động',                            level: 'intermediate', ocrStart: 332, ocrEnd: 347 },
  { slug: 'so-luong',          title: 'Expression of Quantity',             title_vi: 'Sự diễn tả về số lượng',                 level: 'beginner',     ocrStart: 348, ocrEnd: 359 },
  { slug: 'thanh-lap-tu',      title: 'Word Formations',                    title_vi: 'Cách thành lập từ',                      level: 'intermediate', ocrStart: 360, ocrEnd: 366 },
  { slug: 'hinh-thuc-tu',      title: 'Word Forms',                         title_vi: 'Hình thức của từ',                       level: 'intermediate', ocrStart: 367, ocrEnd: 369 },
  { slug: 'thanh-ngu',         title: 'Idiomatic Expressions',              title_vi: 'Thành ngữ',                              level: 'advanced',     ocrStart: 370, ocrEnd: 375 },
  { slug: 'van-phong',         title: 'Styles',                             title_vi: 'Văn phong',                              level: 'advanced',     ocrStart: 376, ocrEnd: 380 },
];

// =============================================
// 2. TRÍCH XUẤT VÍ DỤ
// =============================================
function extractExamples(text) {
  const examples = [];
  const lines = text.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length < 10) continue;
    // Pattern: "câu tiếng Anh (dịch tiếng Việt)" hoặc "en → vi"
    const m = trimmed.match(/^(.+?)\(([^)]{5,})\)\s*$|^(.+?)\s*[→—–-]\s*(.+?)$/);
    if (m) {
      const en = (m[1] || m[3] || '').replace(/\*\*/g, '').trim();
      const vi = (m[2] || m[4] || '').replace(/\*\*/g, '').trim();
      if (en && vi && en.length > 5 && vi.length > 2 && /[a-zA-Z]/.test(en) && examples.length < 10) {
        examples.push({ en, vi });
      }
    }
  }
  return examples;
}

// =============================================
// 3. PARSE SECTIONS TỪ TEXT TOPIC
// =============================================
function isExerciseTitle(title) {
  if (/\?/.test(title)) return true;
  if (/^\d+\.\s/.test(title)) return true;
  // Roman numeral alone
  if (/^[IVX]+\.?\s*$/.test(title)) return true;
  // OCR garbage: too short or no real word
  if (title.length < 5) return true;
  if (!/[a-zA-ZÀ-ỹ]{3}/.test(title)) return true;
  // Starts with special chars (OCR noise like "` GUM...", "3NH...")
  if (/^[^a-zA-ZÀ-ỹĐđ]/.test(title)) return true;
  // Single letter + dot sub-bullet (e.g. "c. super-", "a. something")
  if (/^[a-z]\.\s/.test(title)) return true;
  // All-uppercase (no diacritics) → topic/chapter heading leaked as section
  const stripped = title.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[đĐ]/g, 'd');
  if (stripped === stripped.toUpperCase() && /[A-Z]{4}/.test(stripped)) return true;
  // Exercise instruction starters
  if (/^(Ex:|Choose|Fill|Rewrite|Complete|Put|Make|Correct|Find|Match|Select|Underline|Look at|What|Which|How|Are|Do|Did|Is|Has|Have|Write|Read|Say|Use|Report|Comment|Decide|Each of|Replace|Supply|Turn|Join|Change|Combine|Check|Give|Identify|Circle|Most of|Some of|For each|For the|For every|He |She |Emphasize|Add|Note the|There are|There is)/i.test(title)) return true;
  // Chapter headings
  if (/^(Chương|CHƯƠNG)\s+\d+/.test(title)) return true;
  return false;
}

function parseSections(fullText) {
  const lessons = [];
  // Chia theo mục La Mã: I., II., III., IV., ... (đứng đầu dòng)
  const parts = fullText.split(/\n(?=\*{0,2}[IVX]+\.\s)/);

  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.length < 50) continue;

    const firstLine = trimmed.split('\n')[0]
      .replace(/\*\*/g, '')
      .replace(/^[IVX]+\.\s+/, '')
      .trim();

    if (!firstLine || firstLine.length < 3 || firstLine.length > 200) continue;
    if (isExerciseTitle(firstLine)) continue;
    if (/^Exercises?\s*$/i.test(firstLine)) continue;

    const bodyLines = trimmed.split('\n').slice(1);
    const body = bodyLines
      .filter(l => l.trim().length > 3)
      .join('\n')
      .trim()
      .substring(0, 8000);

    if (body.length < 30) continue;

    lessons.push({
      title: firstLine.substring(0, 200),
      theory: body,
      examples: extractExamples(body),
    });
  }
  return lessons;
}

// =============================================
// 4. UPSERT TOPIC VÀ LESSON
// =============================================
async function upsertTopic(topicConfig) {
  const { data: existing } = await supabase
    .from('grammar_topics')
    .select('id')
    .eq('slug', topicConfig.slug)
    .maybeSingle();

  if (existing) return existing.id;

  const { data, error } = await supabase
    .from('grammar_topics')
    .insert({
      slug: topicConfig.slug,
      title: topicConfig.title,
      title_vi: topicConfig.title_vi,
      level: topicConfig.level,
      order_index: TOPIC_RANGES.findIndex(t => t.slug === topicConfig.slug) * 10,
    })
    .select('id')
    .single();

  if (error) throw new Error(`Lỗi tạo topic ${topicConfig.slug}: ${error.message}`);
  return data.id;
}

async function saveLesson(topicId, lesson, orderIndex) {
  const { data: dup } = await supabase
    .from('grammar_lessons')
    .select('id')
    .eq('topic_id', topicId)
    .eq('title', lesson.title)
    .maybeSingle();

  if (dup) return false;

  const { error } = await supabase.from('grammar_lessons').insert({
    topic_id: topicId,
    title: lesson.title,
    theory: lesson.theory,
    theory_vi: null,
    examples: lesson.examples,
    source: 'mai-lan-huong-pdf',
    order_index: orderIndex,
  });

  if (error) throw new Error(`Lỗi lưu lesson "${lesson.title}": ${error.message}`);
  return true;
}

// =============================================
// 5. XÓA DỮ LIỆU CŨ (topics + lessons cascade)
// =============================================
async function clearOldData() {
  console.log('Xóa dữ liệu grammar cũ (topics + lessons cascade)...');
  const { error } = await supabase
    .from('grammar_topics')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // xóa tất cả
  if (error) throw new Error('Lỗi xóa topics: ' + error.message);
  console.log('Đã xóa xong.');
}

// =============================================
// 6. MAIN
// =============================================
async function main() {
  const jsonPath = 'D:\\Vocab\\grammar_ocr.json';
  if (!fs.existsSync(jsonPath)) {
    console.error('Không tìm thấy file:', jsonPath);
    process.exit(1);
  }

  const pages = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  console.log(`OCR pages: ${pages.length} | DRY_RUN: ${DRY_RUN}`);

  if (!DRY_RUN && !NO_CLEAR) {
    await clearOldData();
  }

  const activeRanges = FILTER_SLUGS
    ? TOPIC_RANGES.filter(t => FILTER_SLUGS.includes(t.slug))
    : TOPIC_RANGES;

  let totalSaved = 0;
  let totalSkipped = 0;

  for (let ti = 0; ti < activeRanges.length; ti++) {
    const topic = activeRanges[ti];

    // Gom text của topic từ page range
    const topicPages = pages.slice(topic.ocrStart, topic.ocrEnd + 1);
    const fullText = topicPages.join('\n');

    const lessons = parseSections(fullText);

    // Fallback: nếu không parse được section, tạo 1 lesson tổng
    if (lessons.length === 0) {
      const cleanText = fullText
        .replace(/Exercises?\s*\n[\s\S]*?(?=\n\*{0,2}[IVX]+\.|\n[A-Z]{4}|$)/gi, '')
        .trim();
      if (cleanText.length > 100) {
        lessons.push({
          title: topic.title_vi,
          theory: cleanText.substring(0, 8000),
          examples: extractExamples(cleanText),
        });
      }
    }

    console.log(`\n[${topic.title_vi}] pages OCR ${topic.ocrStart}-${topic.ocrEnd} → ${lessons.length} bài`);

    if (DRY_RUN) {
      lessons.forEach(l => console.log('  •', l.title.substring(0, 70)));
      continue;
    }

    const topicId = await upsertTopic(topic);

    for (let i = 0; i < lessons.length; i++) {
      try {
        const saved = await saveLesson(topicId, lessons[i], i);
        if (saved) {
          console.log(`  ✓ ${lessons[i].title.substring(0, 70)}`);
          totalSaved++;
        } else {
          totalSkipped++;
        }
      } catch (e) {
        console.error(`  ✗ ${e.message}`);
      }
    }
  }

  if (!DRY_RUN) {
    console.log(`\n========================================`);
    console.log(`✅ Hoàn tất! Đã lưu ${totalSaved} bài học, bỏ qua ${totalSkipped} trùng.`);
  }
}

main().catch(e => {
  console.error('Lỗi:', e.message);
  process.exit(1);
});
