import * as path from 'path';
import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// 1. Load .env.local manually
const envPath = path.resolve(__dirname, '../.env.local');
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
    .normalize('NFD') // Decompose diacritics
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/-+/g, '-'); // Remove duplicate hyphens
}

async function main() {
  const args = process.argv.slice(2);
  const jsonName = args[0] || 'FLASHCARD ONLINE PRO3M_all_vocab.json';
  const generalTag = args[1] || 'pro3m';

  const jsonPath = path.resolve(__dirname, `../../tmp/vocab/${jsonName}`);
  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ Error: JSON file not found at ${jsonPath}`);
    process.exit(1);
  }

  console.log(`📖 Reading vocabulary from ${jsonPath}...`);
  const rawData = fs.readFileSync(jsonPath, 'utf8');
  const vocabData = JSON.parse(rawData);

  // Build a map of word -> Set of tags
  const wordToTags = new Map<string, Set<string>>();

  for (const lessonName of Object.keys(vocabData)) {
    const lessonInfo = vocabData[lessonName];
    const lessonSlug = `${generalTag}-${slugify(lessonName)}`;
    const words = lessonInfo.words || [];

    for (const rawWord of words) {
      const cleanWord = rawWord.trim().toLowerCase();
      if (!cleanWord) continue;

      if (!wordToTags.has(cleanWord)) {
        wordToTags.set(cleanWord, new Set([generalTag]));
      }
      wordToTags.get(cleanWord)!.add(lessonSlug);
    }
  }

  const allWords = Array.from(wordToTags.keys());
  const totalWords = allWords.length;
  console.log(`📊 Found ${totalWords} unique words/phrases across all lessons.`);

  const batchSize = 100;
  let insertedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < totalWords; i += batchSize) {
    const batchWords = allWords.slice(i, i + batchSize);
    console.log(`⚡ Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(totalWords / batchSize)} (words ${i + 1} - ${Math.min(i + batchSize, totalWords)})...`);

    // Fetch existing words in this batch
    const { data: existingRows, error: fetchError } = await supabase
      .from('global_dictionary')
      .select('id, word, tags, data, image_url, image_source, image_confidence, image_query, image_verified_at, created_at')
      .in('word', batchWords);

    if (fetchError) {
      console.error(`❌ Error fetching existing words for batch starting at index ${i}:`, fetchError.message);
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

    for (const word of batchWords) {
      const newTagsSet = wordToTags.get(word)!;
      const existingRow = existingMap.get(word);

      if (existingRow) {
        // Merge tags
        const existingTags = existingRow.tags || [];
        const mergedTagsSet = new Set([...existingTags, ...newTagsSet]);
        const mergedTags = Array.from(mergedTagsSet);

        // Check if tags actually changed
        const tagsChanged = mergedTags.length !== existingTags.length || !mergedTags.every((t: string) => existingTags.includes(t));

        if (tagsChanged) {
          updatedRows.push({
            id: existingRow.id,
            word: word,
            tags: mergedTags,
            data: existingRow.data // Keep existing data unchanged
          });
          updatedCount++;
        } else {
          skippedCount++;
        }
      } else {
        // Create new row
        newRows.push({
          word: word,
          tags: Array.from(newTagsSet),
          data: {
            word: word,
            pronunciations: [],
            results: [{ meanings: [{ pos: '', definition: '⏳ Click to enrich / Auto-enrich', example: '', collocations: [] }] }]
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
        console.error(`❌ Error inserting new rows for batch starting at index ${i}:`, insertError.message);
      } else {
        console.log(`   -> Inserted ${newRows.length} new words`);
      }
    }

    if (updatedRows.length > 0) {
      const { error: updateError } = await supabase
        .from('global_dictionary')
        .upsert(updatedRows, { onConflict: 'word' });

      if (updateError) {
        console.error(`❌ Error updating tags for batch starting at index ${i}:`, updateError.message);
      } else {
        console.log(`   -> Updated tags for ${updatedRows.length} existing words`);
      }
    }

    if (newRows.length === 0 && updatedRows.length === 0) {
      console.log(`   -> All words in this batch already have up-to-date tags. Skipping.`);
    }
  }

  console.log('\n🏁 Seeding complete!');
  console.log(`- New words inserted: ${insertedCount}`);
  console.log(`- Existing words tags updated: ${updatedCount}`);
  console.log(`- Words skipped (already up-to-date): ${skippedCount}`);
  console.log(`- Total unique words processed: ${totalWords}`);
}

main().catch(err => {
  console.error('❌ Unhandled error in main execution:', err);
  process.exit(1);
});
