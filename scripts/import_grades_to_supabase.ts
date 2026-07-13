import * as path from 'path';
import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// 1. Load .env.local manually
// Vì script chạy ở thư mục scratch, envPath nằm ở d:/Vocab/web-app/.env.local
const envPath = "d:/Vocab/web-app/.env.local";
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase environment variables in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Helper to slugify lesson title
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

async function importGradeVocab(jsonPath: string, generalTag: string) {
  if (!fs.existsSync(jsonPath)) {
    printError(`❌ Error: JSON file not found at ${jsonPath}`);
    return;
  }

  console.log(`📖 Reading vocabulary from ${jsonPath}...`);
  const rawData = fs.readFileSync(jsonPath, 'utf8');
  const gradeData = JSON.parse(rawData);

  // Group words and their info
  const wordInfoMap = new Map<string, {
    ipa: string;
    pos: string;
    meaning: string;
    example: string;
    vn_ex: string;
    tags: Set<string>;
  }>();

  for (const lessonName of Object.keys(gradeData)) {
    const words = gradeData[lessonName] || [];
    const lessonSlug = `${generalTag}-${slugify(lessonName)}`;

    for (const item of words) {
      const cleanWord = item.word.trim();
      if (!cleanWord) continue;
      const lowerWord = cleanWord.toLowerCase();

      if (!wordInfoMap.has(lowerWord)) {
        wordInfoMap.set(lowerWord, {
          ipa: item.ipa || '',
          pos: item.pos || '',
          meaning: item.meaning || '',
          example: item.example || '',
          vn_ex: item.vn_ex || '',
          tags: new Set([generalTag])
        });
      }
      wordInfoMap.get(lowerWord)!.tags.add(lessonSlug);
    }
  }

  const allWords = Array.from(wordInfoMap.keys());
  const totalWords = allWords.length;
  console.log(`📊 Found ${totalWords} unique words/phrases in this grade.`);

  const batchSize = 50;
  let insertedCount = 0;
  let updatedCount = 0;

  for (let i = 0; i < totalWords; i += batchSize) {
    const batchWords = allWords.slice(i, i + batchSize);
    console.log(`⚡ Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(totalWords / batchSize)}...`);

    // Fetch existing words
    const { data: existingRows, error: fetchError } = await supabase
      .from('global_dictionary')
      .select('id, word, tags, data')
      .in('word', batchWords);

    if (fetchError) {
      console.error(`❌ Error fetching existing rows:`, fetchError.message);
      continue;
    }

    const existingMap = new Map<string, any>();
    if (existingRows) {
      for (const row of existingRows) {
        existingMap.set(row.word.toLowerCase(), row);
      }
    }

    const newRows: any[] = [];
    const updatedRows: any[] = [];

    for (const lowerWord of batchWords) {
      const info = wordInfoMap.get(lowerWord)!;
      const originalWord = allWords.find(w => w.toLowerCase() === lowerWord) || lowerWord;
      
      const existingRow = existingMap.get(lowerWord);

      // Build data schema
      const ipaObj = info.ipa ? [{ ipa: info.ipa, audio: '' }] : [];
      const meaningObj = {
        pos: info.pos,
        definition: info.meaning,
        example: info.example,
        translation: info.vn_ex
      };

      if (existingRow) {
        // Merge tags
        const existingTags = existingRow.tags || [];
        const mergedTags = Array.from(new Set([...existingTags, ...info.tags]));

        // Cập nhật cấu trúc data nhưng bảo tồn cấu trúc cũ nếu có
        let updatedData = existingRow.data || {};
        updatedData.word = existingRow.word || originalWord;
        updatedData.pronunciations = ipaObj.length > 0 ? ipaObj : (updatedData.pronunciations || []);
        
        if (!updatedData.results) {
          updatedData.results = [{ meanings: [meaningObj] }];
        } else if (updatedData.results[0]) {
          if (!updatedData.results[0].meanings) {
            updatedData.results[0].meanings = [meaningObj];
          } else {
            // Ghi đè hoặc chèn nghĩa đầu tiên
            updatedData.results[0].meanings[0] = {
              ...updatedData.results[0].meanings[0],
              ...meaningObj
            };
          }
        }

        updatedRows.push({
          id: existingRow.id,
          word: existingRow.word,
          tags: mergedTags,
          data: updatedData
        });
        updatedCount++;
      } else {
        // Tạo dòng mới
        newRows.push({
          word: originalWord,
          tags: Array.from(info.tags),
          data: {
            word: originalWord,
            pronunciations: ipaObj,
            results: [{ meanings: [meaningObj] }]
          },
          image_url: null,
          image_source: 'none'
        });
        insertedCount++;
      }
    }

    if (newRows.length > 0) {
      const { error: insertError } = await supabase
        .from('global_dictionary')
        .insert(newRows);

      if (insertError) {
        console.error(`❌ Insert error for new words:`, insertError.message);
      } else {
        console.log(`   -> Inserted ${newRows.length} new words`);
      }
    }

    if (updatedRows.length > 0) {
      const { error: updateError } = await supabase
        .from('global_dictionary')
        .upsert(updatedRows, { onConflict: 'word' });

      if (updateError) {
        console.error(`❌ Upsert error for updated words:`, updateError.message);
      } else {
        console.log(`   -> Updated ${updatedRows.length} existing words`);
      }
    }
  }

  console.log(`🎉 Finished import: Inserted ${insertedCount}, Updated ${updatedCount}`);
}

function printError(msg: string) {
  console.error(msg);
}

async function main() {
  const g10Path = "d:/Vocab/scratch/vocab_lop_10_full.json";
  const g12Path = "d:/Vocab/scratch/vocab_lop_12_full.json";
  const ieltsPath = "d:/Vocab/scratch/vocab_ielts_full.json";
  const toeicPath = "d:/Vocab/scratch/vocab_toeic_full.json";
  const phrasalPath = "d:/Vocab/scratch/vocab_phrasal_full.json";
  const advancedPath = "d:/Vocab/scratch/vocab_advanced_full.json";
  const oxfordPath = "d:/Vocab/scratch/vocab_oxford_full.json";
  const ngslPath = "d:/Vocab/scratch/vocab_ngsl_full.json";

  console.log('=== START SUPABASE IMPORT FOR GRADE 10 ===');
  await importGradeVocab(g10Path, 'pro3m');

  console.log('\n=== START SUPABASE IMPORT FOR GRADE 12 ===');
  await importGradeVocab(g12Path, 'pro3m');

  console.log('\n=== START SUPABASE IMPORT FOR IELTS ===');
  await importGradeVocab(ieltsPath, 'exam-ielts');

  console.log('\n=== START SUPABASE IMPORT FOR TOEIC ===');
  await importGradeVocab(toeicPath, 'exam-toeic');

  console.log('\n=== START SUPABASE IMPORT FOR PHRASAL VERBS ===');
  await importGradeVocab(phrasalPath, 'exam-academic');

  console.log('\n=== START SUPABASE IMPORT FOR ADVANCED ===');
  await importGradeVocab(advancedPath, 'exam-academic');

  console.log('\n=== START SUPABASE IMPORT FOR OXFORD 3000 ===');
  await importGradeVocab(oxfordPath, 'pro3m');

  console.log('\n=== START SUPABASE IMPORT FOR NGSL/NAWL ===');
  await importGradeVocab(ngslPath, 'pro3m');
}

main().catch(err => {
  console.error('❌ Unhandled exception:', err);
  process.exit(1);
});
