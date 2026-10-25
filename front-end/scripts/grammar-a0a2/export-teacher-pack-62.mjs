/**
 * Batch Export 62 Grammar Topics Teacher Pack
 * Student HTML Handouts + Teacher Answer Keys (Markdown) + INDEX.md + manifest.json + README.md
 *
 * Usage:
 *   node scripts/grammar-a0a2/export-teacher-pack-62.mjs
 *   node scripts/grammar-a0a2/export-teacher-pack-62.mjs --only articles,present-simple
 *   node scripts/grammar-a0a2/export-teacher-pack-62.mjs --out tmp/teacher-pack-62
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { buildGrammarLessonPdfHtml } from '../../src/lib/grammar-lesson-pdf.ts';

function loadEnv() {
  const envPath = path.resolve('.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('File .env.local not found');
    process.exit(1);
  }
  const raw = fs.readFileSync(envPath, 'utf8');
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i < 0) continue;
    let v = line.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    env[line.slice(0, i).trim()] = v;
  }
  return env;
}

function parseArgs() {
  const args = process.argv.slice(2);
  let outDir = 'tmp/teacher-pack-62';
  let onlySlugs = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--out' && args[i + 1]) {
      outDir = args[i + 1];
      i++;
    } else if (args[i] === '--only' && args[i + 1]) {
      onlySlugs = args[i + 1].split(',').map((s) => s.trim()).filter(Boolean);
      i++;
    }
  }

  return { outDir: path.resolve(outDir), onlySlugs };
}

function formatAnswer(a) {
  if (a === true) return 'Đúng';
  if (a === false) return 'Sai';
  if (Array.isArray(a)) return a.map(String).join(' / ');
  return String(a ?? '');
}

function cleanCellText(s, maxLength) {
  const str = String(s ?? '')
    .replace(/[\r\n]+/g, ' ')
    .replace(/\|/g, '/')
    .trim();
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1) + '…';
}

async function main() {
  const { outDir, onlySlugs } = parseArgs();
  console.log(`🚀 Starting Teacher Pack Export -> ${outDir}`);

  const env = loadEnv();
  const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const { data: topics, error: tErr } = await sb
    .from('grammar_topics')
    .select('id, slug, title, title_vi, level, order_index');

  if (tErr) {
    console.error('❌ Failed to fetch topics:', tErr);
    process.exit(1);
  }

  if (!topics || topics.length === 0) {
    console.error('❌ No grammar topics found in DB.');
    process.exit(1);
  }

  // Sort by level (beginner -> intermediate -> advanced), then order_index
  const levelRank = { beginner: 1, intermediate: 2, advanced: 3 };
  topics.sort((a, b) => {
    const la = levelRank[a.level] || 99;
    const lb = levelRank[b.level] || 99;
    if (la !== lb) return la - lb;
    return (a.order_index ?? 0) - (b.order_index ?? 0);
  });

  const { data: lessons, error: lErr } = await sb
    .from('grammar_lessons')
    .select('topic_id, title, theory_vi, sections, exercises, examples');

  if (lErr) {
    console.error('❌ Failed to fetch lessons:', lErr);
    process.exit(1);
  }

  const lessonMap = new Map((lessons || []).map((l) => [l.topic_id, l]));

  // Ensure target directories exist
  const studentDir = path.join(outDir, 'student');
  const teacherDir = path.join(outDir, 'teacher');
  fs.mkdirSync(studentDir, { recursive: true });
  fs.mkdirSync(teacherDir, { recursive: true });

  const dateStr = new Date().toISOString().slice(0, 10);
  const manifestTopics = [];
  let allKeysMd = `# LingoPro — Tổng Hợp Đáp Án 62 Bài Ngữ Pháp (Teacher Keys)\n\n`;
  allKeysMd += `Ngày xuất: ${dateStr}\n\n`;
  allKeysMd += `> **Lưu ý dành cho giáo viên:** File này tổng hợp toàn bộ đáp án của 62 bài ngữ pháp.\n\n---\n\n`;

  let exportedStudentCount = 0;
  let exportedTeacherCount = 0;
  let totalExercises = 0;
  let totalExamples = 0;
  let hasMissingExerciseWarning = false;

  const targetTopics = onlySlugs
    ? topics.filter((t) => onlySlugs.includes(t.slug))
    : topics;

  for (let idx = 0; idx < topics.length; idx++) {
    const topic = topics[idx];
    const isTarget = !onlySlugs || onlySlugs.includes(topic.slug);
    if (!isTarget) continue;

    const lesson = lessonMap.get(topic.id);
    if (!lesson) {
      console.warn(`⚠️ [WARN] Topic ${topic.slug} has no corresponding lesson in grammar_lessons!`);
      continue;
    }

    const exercises = lesson.exercises || [];
    const examples = lesson.examples || [];
    const nEx = exercises.length;
    const nEg = examples.length;

    totalExercises += nEx;
    totalExamples += nEg;

    if (nEx < 36) {
      console.warn(`⚠️ [WARN] ${topic.slug} only has ${nEx} exercises (<36 required)!`);
      hasMissingExerciseWarning = true;
    }

    const orderStr = String(idx + 1).padStart(2, '0');
    const fileBase = `${orderStr}-${topic.level}-${topic.slug}`;
    const studentFileName = `${fileBase}.html`;
    const teacherFileName = `${fileBase}-KEY.md`;

    // 1. Write Student Handout (HTML)
    const sections = lesson.sections || {};
    const studentHtml = buildGrammarLessonPdfHtml({
      title: lesson.title || topic.title,
      titleVi: topic.title_vi || topic.title,
      level: topic.level,
      slug: topic.slug,
      definition: sections.definition || (lesson.theory_vi || '').slice(0, 800),
      tips: sections.tips,
      mistakes: sections.mistakes,
      wordbanks: sections.wordbanks,
      exercises: exercises,
      exerciseCap: 0, // all exercises
      withAnswers: false, // NO answers shown to students
      siteUrl: 'https://lingopro.online',
    });

    const studentFilePath = path.join(studentDir, studentFileName);
    fs.writeFileSync(studentFilePath, studentHtml, 'utf8');
    exportedStudentCount++;

    // 2. Write Teacher Answer Key (Markdown)
    let keyMd = `# ${topic.title_vi || topic.title} (\`${topic.slug}\`)\n\n`;
    keyMd += `Level: **${topic.level}** · Order: **${orderStr}** · Exercises: **${nEx}** · Examples: **${nEg}** · Xuất: **${dateStr}**\n\n`;
    keyMd += `| # | Type | Question (rút gọn) | Answer | FB |\n`;
    keyMd += `|---:|------|-------------------|--------|----|\n`;

    exercises.forEach((e, i) => {
      const qText = cleanCellText(e.q || e.question || '', 80);
      const ansVal = formatAnswer(e.answer !== undefined ? e.answer : e.correct_answer);
      const aText = cleanCellText(ansVal, 50);
      const fbText = cleanCellText(e.fb || e.explanation || '', 100);
      const typeStr = cleanCellText(e.type || 'mcq', 20);
      keyMd += `| ${i + 1} | ${typeStr} | ${qText} | ${aText} | ${fbText} |\n`;
    });

    const teacherFilePath = path.join(teacherDir, teacherFileName);
    fs.writeFileSync(teacherFilePath, keyMd, 'utf8');
    exportedTeacherCount++;

    // Add to ALL-KEYS.md
    allKeysMd += `## <a id="${topic.slug}"></a> ${orderStr}. ${topic.title_vi || topic.title} (\`${topic.slug}\`)\n\n`;
    allKeysMd += keyMd;
    allKeysMd += `\n---\n\n`;

    manifestTopics.push({
      order: idx + 1,
      order_str: orderStr,
      slug: topic.slug,
      level: topic.level,
      title: topic.title,
      title_vi: topic.title_vi,
      filename_student: studentFileName,
      filename_teacher: teacherFileName,
      n_exercises: nEx,
      n_examples: nEg,
      has_student_html: true,
      has_teacher_key: true,
    });
  }

  // Write ALL-KEYS.md
  const allKeysPath = path.join(teacherDir, 'ALL-KEYS.md');
  fs.writeFileSync(allKeysPath, allKeysMd, 'utf8');

  // 3. Write INDEX.md
  let indexMd = `# 📚 Bộ Tài Liệu In Ngữ Pháp LingoPro (62 Chủ Điểm)\n\n`;
  indexMd += `> **Dành cho Giáo viên & Trung tâm LingoPro**\n`;
  indexMd += `> Tổng số bài: **${manifestTopics.length}** | Tổng số bài tập: **${totalExercises}** | Tổng ví dụ: **${totalExamples}** | Ngày xuất: **${dateStr}**\n\n`;
  indexMd += `### 📌 Mục Lục Chi Tiết\n\n`;
  indexMd += `| # | Level | Slug | Tên Bài Học (VI) | BT | Ví dụ | Student Handout (HTML) | Teacher Key (MD) |\n`;
  indexMd += `|---|-------|------|------------------|---:|------:|------------------------|------------------|\n`;

  manifestTopics.forEach((t) => {
    const sRel = `student/${t.filename_student}`;
    const tRel = `teacher/${t.filename_teacher}`;
    indexMd += `| ${t.order_str} | ${t.level} | \`${t.slug}\` | ${t.title_vi || t.title} | ${t.n_exercises} | ${t.n_examples} | [📄 Handout HTML](${sRel}) | [🔑 Đáp án MD](${tRel}) |\n`;
  });

  indexMd += `\n---\n\n`;
  indexMd += `👉 **[Xem toàn bộ đáp án 62 bài trong 1 file (ALL-KEYS.md)](teacher/ALL-KEYS.md)**\n`;

  fs.writeFileSync(path.join(outDir, 'INDEX.md'), indexMd, 'utf8');

  // 4. Write manifest.json
  const manifestData = {
    generated_at: new Date().toISOString(),
    total_topics: manifestTopics.length,
    total_exercises: totalExercises,
    total_examples: totalExamples,
    topics: manifestTopics,
  };
  fs.writeFileSync(
    path.join(outDir, 'manifest.json'),
    JSON.stringify(manifestData, null, 2),
    'utf8'
  );

  // 5. Write README.md
  let readmeMd = `# 🖨️ Hướng Dẫn In Bộ Tài Liệu Ngữ Pháp LingoPro\n\n`;
  readmeMd += `Bộ tài liệu ngữ pháp 62 chủ điểm được xuất tự động từ hệ thống LingoPro.\n\n`;
  readmeMd += `## 📁 Cấu trúc thư mục\n\n`;
  readmeMd += `\`\`\`text\n`;
  readmeMd += `teacher-pack-62/\n`;
  readmeMd += `├── README.md               # Hướng dẫn này\n`;
  readmeMd += `├── INDEX.md                # Mục lục 62 bài + links\n`;
  readmeMd += `├── manifest.json           # Thống kê machine-readable\n`;
  readmeMd += `├── student/                # Handout cho Học Sinh (KHÔNG có đáp án)\n`;
  readmeMd += `│   ├── 01-beginner-countable-uncountable.html\n`;
  readmeMd += `│   └── ...\n`;
  readmeMd += `└── teacher/                # Đáp án cho Giáo Viên\n`;
  readmeMd += `    ├── 01-beginner-countable-uncountable-KEY.md\n`;
  readmeMd += `    ├── ...\n`;
  readmeMd += `    └── ALL-KEYS.md         # File gộp toàn bộ 62 đáp án\n`;
  readmeMd += `\`\`\`\n\n`;
  readmeMd += `## 🖨️ Hướng dẫn xuất PDF cho Học Sinh (Handout)\n\n`;
  readmeMd += `1. Mở file HTML trong thư mục \`student/\` bằng Google Chrome / Microsoft Edge.\n`;
  readmeMd += `2. Nhấn nút **"⬇ Lưu / In PDF"** ở thanh công cụ hoặc ấn tổ hợp phím **Ctrl + P** (Cmd + P trên Mac).\n`;
  readmeMd += `3. Tại mục **Máy in (Destination)**, chọn **Lưu dưới dạng PDF (Save as PDF)**.\n`;
  readmeMd += `4. Cấu hình in chuẩn A4:\n`;
  readmeMd += `   - **Khổ giấy (Paper size):** A4\n`;
  readmeMd += `   - **Tỷ lệ (Scale):** Mặc định (Default) hoặc Fit to printable area\n`;
  readmeMd += `   - **Đầu trang và chân trang (Headers and footers):** Bỏ chọn (để giữ thiết kế branded LingoPro clean)\n`;
  readmeMd += `5. Nhấn **Lưu (Save)**.\n\n`;
  readmeMd += `## 🔑 Đáp án Giáo viên\n\n`;
  readmeMd += `- Đáp án dạng Markdown trong \`teacher/\` giúp giáo viên dễ dàng tra cứu, copy vào slide bài giảng hoặc in trực tiếp.\n`;
  readmeMd += `- File \`teacher/ALL-KEYS.md\` chứa tất cả đáp án 62 bài có anchor link dạng \`#slug\`.\n`;

  fs.writeFileSync(path.join(outDir, 'README.md'), readmeMd, 'utf8');

  console.log(`\n✅ EXPORT COMPLETE!`);
  console.log(`- Student HTML files: ${exportedStudentCount}`);
  console.log(`- Teacher KEY files: ${exportedTeacherCount}`);
  console.log(`- Total Exercises: ${totalExercises}`);
  console.log(`- Total Examples: ${totalExamples}`);
  console.log(`- INDEX.md & manifest.json created successfully.`);

  if (!onlySlugs && exportedStudentCount < 62) {
    console.error(`❌ [FAIL] Expected 62 student HTML files, but got ${exportedStudentCount}`);
    process.exit(1);
  }

  if (hasMissingExerciseWarning) {
    console.error(`❌ [FAIL] One or more topics have <36 exercises.`);
    process.exit(1);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Fatal error during export:', err);
  process.exit(1);
});
