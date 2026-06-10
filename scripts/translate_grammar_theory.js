const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const geminiKeys = process.env.GEMINI_API_KEY;

if (!supabaseUrl || !supabaseKey || !geminiKeys) {
  console.error('Missing credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Retrieve the first key if it is comma-separated
const apiKey = geminiKeys.split(',')[0].trim();
const genAI = new GoogleGenerativeAI(apiKey);

async function translateTheories() {
  console.log('--- LingoPro Grammar Theory Translator ---');
  
  // Find lessons with empty or null theory_vi
  const { data: lessons, error } = await supabase
    .from('grammar_lessons')
    .select('id, title, theory, theory_vi')
    .or('theory_vi.is.null, theory_vi.eq.""');

  if (error) {
    console.error('Error fetching lessons:', error.message);
    return;
  }

  const pending = lessons.filter(l => !l.theory_vi || l.theory_vi.trim().length === 0);
  console.log(`Found ${pending.length} lessons requiring Vietnamese translation.`);

  if (pending.length === 0) {
    console.log('All lessons already have Vietnamese translations! Exiting.');
    return;
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  for (let i = 0; i < pending.length; i++) {
    const lesson = pending[i];
    console.log(`\n[${i + 1}/${pending.length}] Translating lesson: "${lesson.title}"...`);
    
    if (!lesson.theory || lesson.theory.trim().length === 0) {
      console.log(`Skipping lesson "${lesson.title}" because English theory is empty.`);
      continue;
    }

    try {
      const prompt = `
You are a professional ESL teacher and expert translator.
Translate the following English grammar theory lesson into high-quality, clear, and natural Vietnamese.

Rules for translation:
1. Preserve all Markdown formatting (bold text, lists, headers, code, tables).
2. Clean up any OCR scanning garbage (e.g. incorrect characters, commas used instead of periods for bullet numbering like "1, " -> "1. ", or broken layout elements).
3. Do NOT translate technical grammatical terms directly if they are usually referred to by their English name in Vietnamese ESL contexts, or provide both (e.g., "Present Simple" -> "Thì Hiện tại đơn (Present Simple)").
4. Keep all English example sentences in English, but translate their explanations/notes to Vietnamese.
5. Return ONLY the translated Vietnamese Markdown. Do NOT include introductory words like "Here is the translation:" or markdown fences unless they are part of the content.

Lesson Title: ${lesson.title}
English Theory Content to Translate:
---
${lesson.theory}
---
`;

      const result = await model.generateContent(prompt);
      const translatedText = result.response.text().trim();

      if (translatedText && translatedText.length > 50) {
        const { error: updateError } = await supabase
          .from('grammar_lessons')
          .update({ theory_vi: translatedText })
          .eq('id', lesson.id);

        if (updateError) {
          console.error(`Error updating lesson database row for "${lesson.title}":`, updateError.message);
        } else {
          console.log(`✓ Successfully translated and updated: "${lesson.title}" (${translatedText.length} chars)`);
        }
      } else {
        console.warn(`⚠ AI returned insufficient content for "${lesson.title}":`, translatedText);
      }

      // Respect rate limits: wait 1.5s
      await new Promise(resolve => setTimeout(resolve, 1500));
    } catch (err) {
      console.error(`Failed to translate lesson "${lesson.title}":`, err.message);
      // Wait a bit longer if there's an error
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  console.log('\n=== TRANSLATION COMPLETED ===');
}

translateTheories();
