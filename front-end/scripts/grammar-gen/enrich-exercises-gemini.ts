import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { readdir, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(DIR, 'out');
const SCHEMA_PATH = path.join(DIR, 'exercises-schema.json');

// --- CLI arguments ---
const args = process.argv.slice(2);
const getFlag = (n: string) => { const i = args.indexOf(n); return i >= 0 ? (args[i + 1] ?? '') : undefined; };
const hasFlag = (n: string) => args.includes(n);

const limitArg = parseInt(getFlag('--limit') || '0', 10);
const onlyArg = getFlag('--only');
const force = hasFlag('--force');
const delayMs = parseInt(getFlag('--delay') || '1000', 10);

interface Exercise {
  type: 'multiple_choice' | 'fill_blank' | 'error_correction';
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  difficulty: number;
}

interface Lesson {
  slug: string;
  title: string;
  title_vi: string;
  level: string;
  order: number;
  sections: {
    definition?: string;
    usage?: Array<{ label?: string; en?: string; vi?: string }>;
    rules?: Array<{ case?: string; rule?: string; example?: string }>;
    examples?: Array<{ en?: string; vi?: string }>;
  };
  exercises: Exercise[];
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Load environment variables from .env.local */
function loadEnv() {
  const p = path.join(process.cwd(), '.env.local');
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) {
      let v = m[2];
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      process.env[m[1]] = v;
    }
  }
}

function pickKey(envName: string): string {
  const raw = process.env[envName] || '';
  const keys = raw.split(',').map((k) => k.trim()).filter(Boolean);
  if (!keys.length) throw new Error(`Missing environment variable: ${envName}`);
  return keys[Math.floor(Math.random() * keys.length)];
}

async function callGemini(prompt: string, schema: any): Promise<string> {
  const key = pickKey('GEMINI_API_KEY');
  // Use gemini-2.5-flash as it supports JSON output structure and schema mapping
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
  
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: schema,
        temperature: 0.7,
        maxOutputTokens: 8192
      },
    }),
    signal: AbortSignal.timeout(90_000),
  });

  if (!res.ok) {
    throw new Error(`Gemini HTTP error ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text).join('') ?? '';
  if (!text) {
    throw new Error('Gemini returned empty response (possibly blocked by safety or max tokens)');
  }

  return text;
}

function validateExercise(ex: any): ex is Exercise {
  if (!ex || typeof ex !== 'object') return false;
  if (!['multiple_choice', 'fill_blank', 'error_correction'].includes(ex.type)) return false;
  if (typeof ex.question !== 'string' || !ex.question.trim()) return false;
  if (!Array.isArray(ex.options) || ex.options.length !== 4) return false;
  if (typeof ex.correct_answer !== 'string' || !ex.correct_answer.trim()) return false;
  
  // Case-insensitive options validation
  const cleanAnswer = ex.correct_answer.trim().toLowerCase();
  const cleanOpts = ex.options.map((o: any) => String(o).trim().toLowerCase());
  if (!cleanOpts.includes(cleanAnswer)) return false;
  
  if (typeof ex.explanation !== 'string' || !ex.explanation.trim()) return false;
  if (typeof ex.difficulty !== 'number' || ![1, 2, 3].includes(ex.difficulty)) return false;
  return true;
}

async function main() {
  loadEnv();
  console.log('[enrich-exercises-gemini] Starting grammar exercise enrichment script via Gemini API...');
  
  const files = (await readdir(OUT)).filter((f) => f.endsWith('.json')).sort();
  const schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf-8'));
  
  // Remove draft-07 specific elements to prevent Gemini API parsing failures
  delete schema.$schema;
  delete schema.additionalProperties;
  if (schema.properties?.exercises) {
    delete schema.properties.exercises.additionalProperties;
    if (schema.properties.exercises.items) {
      delete schema.properties.exercises.items.additionalProperties;
    }
  }
  if (schema.properties?.exercises?.items?.properties?.question) {
    delete schema.properties.exercises.items.properties.question.description;
  }
  if (schema.properties?.exercises?.items?.properties?.options) {
    delete schema.properties.exercises.items.properties.options.description;
  }
  if (schema.properties?.exercises?.items?.properties?.correct_answer) {
    delete schema.properties.exercises.items.properties.correct_answer.description;
  }
  if (schema.properties?.exercises?.items?.properties?.explanation) {
    delete schema.properties.exercises.items.properties.explanation.description;
  }
  if (schema.properties?.exercises?.items?.properties?.difficulty) {
    delete schema.properties.exercises.items.properties.difficulty.description;
    delete schema.properties.exercises.items.properties.difficulty.enum;
  }

  let targetFiles = files;
  if (onlyArg) {
    const onlySet = new Set(onlyArg.split(',').map((s) => s.trim() + '.json'));
    targetFiles = files.filter((f) => onlySet.has(f));
  }
  if (limitArg > 0) {
    targetFiles = targetFiles.slice(0, limitArg);
  }

  console.log(`[enrich-exercises-gemini] Found ${targetFiles.length} lessons to check.`);
  let totalGenerated = 0;

  for (const file of targetFiles) {
    const filePath = path.join(OUT, file);
    let lesson: Lesson;
    try {
      lesson = JSON.parse(readFileSync(filePath, 'utf-8')) as Lesson;
    } catch (err: any) {
      console.error(`  ❌ Failed to parse ${file}: ${err.message}`);
      continue;
    }

    if (!lesson.exercises) {
      lesson.exercises = [];
    }

    const currentCount = lesson.exercises.length;
    if (currentCount >= 100 && !force) {
      console.log(`  ⏭  ${lesson.slug} already has ${currentCount} exercises. Skipping.`);
      continue;
    }

    const targetCount = 100;
    const need = targetCount - (force ? 0 : currentCount);
    console.log(`  🚀 Enriching ${lesson.slug} (${lesson.title_vi}): current=${force ? 0 : currentCount}, target=${targetCount}, need to generate=${need}`);

    if (force) {
      lesson.exercises = [];
    }

    const batchSize = 25;
    const totalBatches = Math.ceil(need / batchSize);
    let hasFatalError = false;

    for (let batchIdx = 0; batchIdx < totalBatches; batchIdx++) {
      const remainingNeed = targetCount - lesson.exercises.length;
      if (remainingNeed <= 0) break;
      const currentBatchSize = Math.min(batchSize, remainingNeed);
      
      console.log(`     Batch ${batchIdx + 1}/${totalBatches}: Generating ${currentBatchSize} questions...`);

      const existingBrief = lesson.exercises.map((e) => ({
        question: e.question || (e as any).q || '',
        type: e.type,
      }));

      const prompt = `You are an expert English grammar teacher for Vietnamese learners.
Generate exactly ${currentBatchSize} new, high-quality, and diverse grammar exercises for the topic: "${lesson.title}" (Vietnamese: "${lesson.title_vi}").
Level: ${lesson.level} (beginner = A1-A2, intermediate = B1-B2, advanced = C1-C2).

Lesson description context:
Definition: ${lesson.sections.definition || ''}
Usage cases: ${JSON.stringify(lesson.sections.usage || [])}
Rules: ${JSON.stringify(lesson.sections.rules || [])}

We want to avoid duplicating questions. Do NOT generate questions that are identical or highly similar to these existing ones:
${JSON.stringify(existingBrief.slice(-35))}

Instructions for generating questions:
1. Generate exactly ${currentBatchSize} new questions.
2. For each question:
   - "type" MUST be one of: "multiple_choice", "fill_blank", or "error_correction".
   - Highlight the main grammar concept in the "question" using **markdown bold** (1-3 words, e.g. "Choose the correct **verb form**:", "Find the **incorrect** preposition:").
   - "options" must contain exactly 4 unique choices (strings).
   - "correct_answer" must exactly match one of the 4 options.
   - "explanation" must be in VIETNAMESE (pedagogical, explain why the correct option is right and briefly why other options are wrong, max 3 sentences).
   - Set "difficulty" to 1 (easy), 2 (medium), or 3 (hard).
3. Ensure there is a balanced variety among the 3 types (multiple_choice, fill_blank, error_correction).
4. Strictly return a JSON object with an "exercises" array containing the generated exercises. Do NOT wrap inside markdown.
`;

      let ok = false;
      let retries = 3;
      while (!ok && retries > 0) {
        try {
          const rawResult = await callGemini(prompt, schema);
          const parsed = JSON.parse(rawResult);
          
          if (!parsed || !Array.isArray(parsed.exercises)) {
            throw new Error('Result exercises property is not an array');
          }

          const newExs = parsed.exercises.filter((ex: any) => {
            if (!validateExercise(ex)) return false;
            
            // Normalize correct answer string casing
            const matchedOpt = ex.options.find((o: string) => o.toLowerCase() === ex.correct_answer.toLowerCase());
            if (matchedOpt) {
              ex.correct_answer = matchedOpt;
            }

            // Avoid duplicate check
            const isDup = lesson.exercises.some((e) => {
              const eQ = e.question || (e as any).q || '';
              const exQ = ex.question || ex.q || '';
              return eQ.toLowerCase().trim() === exQ.toLowerCase().trim();
            });
            return !isDup;
          });

          if (newExs.length === 0) {
            throw new Error('No valid new exercises generated in this attempt');
          }

          lesson.exercises.push(...newExs);
          console.log(`     ✅ Batch ${batchIdx + 1}/${totalBatches} completed successfully: added ${newExs.length} exercises (Total: ${lesson.exercises.length}/100)`);
          ok = true;
          totalGenerated += newExs.length;
        } catch (e: any) {
          retries--;
          console.warn(`     ⚠️ Attempt failed (${retries} retries left): ${e.message}`);
          if (e.message.includes('429') || e.message.toLowerCase().includes('quota') || e.message.toLowerCase().includes('rate limit')) {
            console.log('     ⏳ Rate limit hit, sleeping for 65s...');
            await sleep(65_000);
          } else if (retries > 0) {
            await sleep(2000);
          }
        }
      }

      if (!ok) {
        console.error(`     ❌ Failed to generate batch ${batchIdx + 1} after all retries.`);
        hasFatalError = true;
        break; // Stop processing this lesson to avoid infinite failure
      }

      await sleep(delayMs);
    }

    if (hasFatalError) {
      console.log(`  ⚠️ Stopping early due to generation error on ${lesson.slug}. Saving current progress.`);
    }

    // Save back to JSON file
    // Cap at exactly 100 questions
    if (lesson.exercises.length > targetCount) {
      lesson.exercises = lesson.exercises.slice(0, targetCount);
    }
    
    // Sort difficulty or keep order
    writeFileSync(filePath, JSON.stringify(lesson, null, 2), 'utf-8');
    console.log(`  ✨ Saved ${file} with ${lesson.exercises.length} exercises.`);
    
    if (hasFatalError) {
      break;
    }
  }

  console.log(`\n[enrich-exercises-gemini] Enrichment completed! Total new exercises generated: ${totalGenerated}`);
}

main().catch((err) => {
  console.error('[enrich-exercises-gemini] Fatal error:', err);
  process.exit(1);
});
