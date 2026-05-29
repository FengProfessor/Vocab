// extract-theory-vi.js
// Dùng Gemini để tóm tắt lý thuyết tiếng Việt từ grammar_lessons.theory → theory_vi

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env.local') });

const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// --- Setup ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function getGeminiKey() {
  const keys = (process.env.GEMINI_API_KEY || '').split(',').map(k => k.trim()).filter(Boolean);
  if (!keys.length) throw new Error('GEMINI_API_KEY not set');
  return keys[Math.floor(Math.random() * keys.length)];
}

function buildPrompt(theory) {
  return `Đây là nội dung ngữ pháp tiếng Anh từ sách giáo khoa (có cả tiếng Anh lẫn tiếng Việt xen kẽ):

<theory>
${theory}
</theory>

Hãy viết lại phần GIẢI THÍCH TIẾNG VIỆT ngắn gọn (tối đa 800 từ) bao gồm:
1. Định nghĩa/khái niệm chính bằng tiếng Việt
2. Cách dùng quan trọng (bullet points)
3. Lưu ý đặc biệt nếu có

Chỉ viết nội dung tiếng Việt, không dịch các ví dụ tiếng Anh. Định dạng markdown.`;
}

async function extractTheoryVi(lesson) {
  const key = getGeminiKey();
  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 1500,
    },
  });

  const result = await model.generateContent(buildPrompt(lesson.theory));
  return result.response.text().trim();
}

async function processBatch(lessons) {
  return Promise.allSettled(
    lessons.map(async (lesson) => {
      try {
        const theoryVi = await extractTheoryVi(lesson);
        const { error } = await supabase
          .from('grammar_lessons')
          .update({ theory_vi: theoryVi })
          .eq('id', lesson.id);

        if (error) throw new Error(`DB update failed: ${error.message}`);
        console.log(`[extract-theory-vi] ✓ lesson ${lesson.id} — "${lesson.title || lesson.id}"`);
        return { id: lesson.id, success: true };
      } catch (err) {
        console.error(`[extract-theory-vi] ✗ lesson ${lesson.id}: ${err.message}`);
        return { id: lesson.id, success: false, error: err.message };
      }
    })
  );
}

async function main() {
  console.log('[extract-theory-vi] Fetching lessons with theory_vi IS NULL...');

  const { data: lessons, error } = await supabase
    .from('grammar_lessons')
    .select('id, title, theory')
    .is('theory_vi', null)
    .not('theory', 'is', null);

  if (error) {
    console.error('[extract-theory-vi] Failed to fetch lessons:', error.message);
    process.exit(1);
  }

  if (!lessons || lessons.length === 0) {
    console.log('[extract-theory-vi] No lessons need processing. Done.');
    return;
  }

  console.log(`[extract-theory-vi] Found ${lessons.length} lessons to process.`);

  const BATCH_SIZE = 5;
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < lessons.length; i += BATCH_SIZE) {
    const batch = lessons.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(lessons.length / BATCH_SIZE);
    console.log(`[extract-theory-vi] Batch ${batchNum}/${totalBatches} (${batch.length} lessons)...`);

    const results = await processBatch(batch);

    for (const r of results) {
      if (r.status === 'fulfilled' && r.value.success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    // Delay 1s giữa các batch để tránh rate limit
    if (i + BATCH_SIZE < lessons.length) {
      await new Promise(res => setTimeout(res, 1000));
    }
  }

  console.log(`\n[extract-theory-vi] Done. ✓ ${successCount} thành công, ✗ ${failCount} thất bại.`);
}

main().catch(err => {
  console.error('[extract-theory-vi] Fatal error:', err);
  process.exit(1);
});
