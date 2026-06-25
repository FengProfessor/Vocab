import * as path from 'path';
import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Load env variables from .env.local
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^\s*([^#=]+)\s*=\s*(.*)$/);
    if (m) {
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      process.env[m[1].trim()] = v;
    }
  });
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('❌ Missing Supabase env variables');
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

// Argument parsing helper
const getArg = (n: string) => {
  const p = process.argv.find(a => a.startsWith(`--${n}=`));
  return p ? p.split('=').slice(1).join('=') : undefined;
};
const hasFlag = (n: string) => process.argv.includes(`--${n}`);

const LIMIT = parseInt(getArg('limit') || '9999', 10);
const COMMIT = hasFlag('commit');

// CP437 decoding setup
const CP437_CHARS = [
  '\u00c7', '\u00fc', '\u00e9', '\u00e2', '\u00e4', '\u00e0', '\u00e5', '\u00e7', // 80-87
  '\u00ea', '\u00eb', '\u00e8', '\u00ef', '\u00ee', '\u00ec', '\u00c4', '\u00c5', // 88-8F
  '\u00c9', '\u00e6', '\u00c6', '\u00f4', '\u00f6', '\u00f2', '\u00fb', '\u00f9', // 90-97
  '\u00ff', '\u00d6', '\u00dc', '\u00a2', '\u00a3', '\u00a5', '\u20a7', '\u0192', // 98-9F
  '\u00e1', '\u00ed', '\u00f3', '\u00fa', '\u00f1', '\u00d1', '\u00aa', '\u00ba', // A0-A7
  '\u00bf', '\u2310', '\u00ac', '\u00bd', '\u00bc', '\u00a1', '\u00ab', '\u00bb', // A8-AF
  '\u2591', '\u2592', '\u2593', '\u2502', '\u2524', '\u2561', '\u2562', '\u2556', // B0-B7
  '\u2555', '\u2563', '\u2551', '\u2557', '\u255d', '\u255c', '\u255b', '\u2510', // B8-BF
  '\u2514', '\u2534', '\u252c', '\u251c', '\u2500', '\u253c', '\u255e', '\u255f', // C0-C7
  '\u255a', '\u2554', '\u2569', '\u2566', '\u2560', '\u2550', '\u256c', '\u2567', // C8-CF
  '\u2568', '\u2564', '\u2565', '\u2559', '\u2558', '\u2552', '\u2553', '\u256b', // D0-D7
  '\u256a', '\u2518', '\u250c', '\u2588', '\u2584', '\u258c', '\u2590', '\u2580', // D8-DF
  '\u03b1', '\u00df', '\u0393', '\u03c0', '\u03a3', '\u03c3', '\u00b5', '\u03c4', // E0-E7
  '\u03a6', '\u0398', '\u03a9', '\u03b4', '\u221e', '\u03c6', '\u03b5', '\u2229', // E8-EF
  '\u2261', '\u00b1', '\u2265', '\u2264', '\u2320', '\u2321', '\u00f7', '\u2248', // F0-F7
  '\u00b0', '\u2219', '\u00b7', '\u221a', '\u207f', '\u00b2', '\u25a0', '\u00a0'  // F8-FF
];

const charToByteMap: Record<string, number> = {};
for (let i = 0; i < 128; i++) charToByteMap[String.fromCharCode(i)] = i;
for (let i = 0; i < CP437_CHARS.length; i++) charToByteMap[CP437_CHARS[i]] = i + 128;

function decodeCP437ToUTF8(str: string): string {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (charToByteMap[char] !== undefined) {
      bytes.push(charToByteMap[char]);
    } else {
      const code = char.charCodeAt(0);
      bytes.push(code < 256 ? code : 63); // 63 is '?'
    }
  }
  return Buffer.from(bytes).toString('utf8');
}

function buildIpaPrompt(phrase: string): string {
  return `You are an expert phonetician.
Provide the correct, natural International Phonetic Alphabet (IPA) pronunciation for this English phrase: "${phrase}".
Use standard UK/US pronunciation conventions.

Rules:
- Return ONLY the IPA string wrapped in slashes, for example: /ɪn hɒt ˈwɔːtə/ or /steɪ ɪn tʌtʃ wɪð/.
- Do NOT include any explanations, alternative versions, introductory text, or markdown formatting.
- If you are not absolutely sure, return the best approximation.`;
}

interface Row {
  id: string;
  word: string;
  tags: string[];
  data: any;
}

async function main() {
  const { getRouter } = await import('../src/lib/ai-router');
  let router: any = null;

  console.log('🔍 Scanning global_dictionary for collocations/phrases with corrupted IPA...');
  let from = 0;
  const size = 1000;
  const corruptedRows: Row[] = [];
  const boxDrawingRegex = /[\u2500-\u259F]/;

  while (true) {
    const { data, error } = await supabase
      .from('global_dictionary')
      .select('id, word, tags, data')
      .range(from, from + size - 1);

    if (error) {
      console.error('❌ Supabase scan error:', error.message);
      process.exit(1);
    }
    if (!data || data.length === 0) break;

    for (const r of data) {
      const word = r.word || '';
      const wordCount = word.trim().split(/\s+/).filter(Boolean).length;
      // Filter for phrases/collocations (word count >= 2)
      if (wordCount >= 2) {
        const d = r.data || {};
        const ipa = (d.pronunciations?.[0]?.ipa || '').trim();
        if (boxDrawingRegex.test(ipa)) {
          corruptedRows.push({
            id: r.id,
            word,
            tags: r.tags || [],
            data: d
          });
        }
      }
    }

    if (data.length < size) break;
    from += size;
  }

  const totalCorrupted = corruptedRows.length;
  console.log(`📊 Found ${totalCorrupted} corrupted phrases.`);
  
  const todo = corruptedRows.slice(0, LIMIT);
  console.log(`Processing ${todo.length} records.`);
  console.log(COMMIT ? '⚠️  COMMIT MODE: Updates will be written to the database.' : '👁️  DRY-RUN MODE: Previewing fixes, NO database writes. Use --commit to apply changes.\n');

  if (todo.length === 0) {
    console.log('✅ No corrupted records found matching criteria.');
    return;
  }

  // Backup original data to local file before modifications
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupDir = path.resolve(__dirname, '../tmp');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  const backupPath = path.join(backupDir, `corrupted-ipa-backup-${ts}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(todo, null, 2), 'utf8');
  console.log(`💾 Saved backup of ${todo.length} records to ${backupPath}\n`);

  let resolvedViaCP437 = 0;
  let resolvedViaAI = 0;
  let failedCount = 0;
  let updatedCount = 0;

  for (let i = 0; i < todo.length; i++) {
    const row = todo[i];
    const oldIpa = row.data?.pronunciations?.[0]?.ipa || '';
    let correctedIpa = '';
    let method = '';

    // Step 1: Try CP437 decoding
    const decoded = decodeCP437ToUTF8(oldIpa);
    if (decoded && !boxDrawingRegex.test(decoded)) {
      correctedIpa = decoded;
      method = 'CP437 Decode';
      resolvedViaCP437++;
    } else {
      // Step 2: Fallback to AI Router
      if (!router) {
        try {
          router = getRouter();
        } catch (e: any) {
          console.error('❌ Failed to initialize AIRouter:', e.message);
        }
      }

      if (router) {
        try {
          let aiOutput = '';
          for (let attempt = 0; attempt < 3; attempt++) {
            try {
              aiOutput = await router.generate(buildIpaPrompt(row.word), 'smart', false);
              break;
            } catch (e: any) {
              const isRate = /429|quota|cooldown|RESOURCE_EXHAUSTED/i.test(e.message || '');
              if (isRate && attempt < 2) {
                console.warn(`   ⏳ rate limit hit, waiting 30s before retry...`);
                await new Promise(r => setTimeout(r, 30000));
              } else {
                throw e;
              }
            }
          }

          if (aiOutput) {
            correctedIpa = aiOutput.trim();
            method = 'AI Fallback';
            resolvedViaAI++;
          }
        } catch (aiErr: any) {
          console.error(`   ✗ AI generation failed for "${row.word}":`, aiErr.message);
        }
      }
    }

    if (correctedIpa) {
      // Standardize IPA format: ensure wrapped in /.../
      let bareIpa = correctedIpa.replace(/^\/+|\/+$/g, '').trim();
      const finalIpa = `/${bareIpa}/`;

      console.log(`[${i + 1}/${todo.length}] "${row.word}"`);
      console.log(`   Before: ${oldIpa}`);
      console.log(`   After : ${finalIpa} (via ${method})`);

      if (COMMIT) {
        const updatedData = { ...row.data };
        if (!updatedData.pronunciations) updatedData.pronunciations = [];
        if (!updatedData.pronunciations[0]) updatedData.pronunciations[0] = {};
        updatedData.pronunciations[0].ipa = finalIpa;

        const { error } = await supabase
          .from('global_dictionary')
          .update({ data: updatedData })
          .eq('id', row.id);

        if (error) {
          console.error(`   ❌ Failed to write to Supabase:`, error.message);
          failedCount++;
        } else {
          updatedCount++;
        }
      } else {
        updatedCount++; // Track dry-run preview count as updated
      }
    } else {
      console.error(`[${i + 1}/${todo.length}] ✗ Failed to resolve IPA for "${row.word}"`);
      failedCount++;
    }

    // Small delay to prevent rate limiting
    await new Promise(r => setTimeout(r, 50));
  }

  console.log('\n======================================');
  console.log('🏁 EXECUTION SUMMARY');
  console.log(`Total corrupted records checked: ${todo.length}`);
  console.log(`Resolved via CP437 decoding   : ${resolvedViaCP437}`);
  console.log(`Resolved via AI fallback       : ${resolvedViaAI}`);
  console.log(`Failed to resolve              : ${failedCount}`);
  console.log(`Successfully updated in DB     : ${COMMIT ? updatedCount : 0} (Dry-run previewed: ${!COMMIT ? updatedCount : 0})`);
  console.log(`Backup saved to                : ${backupPath}`);
  console.log('======================================');

  if (!COMMIT) {
    console.log('\n💡 To save these fixes to the database, run the command with the --commit flag:');
    console.log(`   npx tsx scripts/fix-corrupted-ipa.ts --commit`);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
