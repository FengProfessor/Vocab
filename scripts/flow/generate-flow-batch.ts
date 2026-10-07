import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

interface WordEntry {
  word: string;
  pos: string;
  definition: string;
  example: string;
}

function getWorkingKeys(): string[] {
  const raw = process.env.GEMINI_API_KEY || '';
  return raw.split(',').map((k) => k.trim()).filter(Boolean);
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

const SYSTEM_PROMPT = `You are a World-Class Educational Art Director & Prompt Engineer specializing in English Vocabulary Learning.
Your mission is to craft extremely vivid, pedagogically accurate image prompts for Google Flow (Imagen 3 / Nano Banana).

CRITICAL PEDAGOGICAL RULES:
1. NEVER be purely literal for idioms/metaphors (e.g., "cost an arm and a leg" must NOT depict severed limbs, but rather a shocked person with a tiny receipt and an empty wallet with a flying moth).
2. CONCRETE MICRO-STORY: For abstract words (e.g. "reluctant", "scrutinize", "abundant"), create a tangible scene with an expressive human or animal character experiencing that exact feeling/action.
3. CONSISTENT VISUAL STYLE: All images must be in "3D Stylized Pixar / Disney digital animation art style". Warm volumetric lighting, expressive facial emotions, clean readable composition, rich vibrant colors.
4. STRICT NEGATIVE CONSTRAINTS: Always end with: ", 3d stylized digital art, Pixar aesthetic, clean composition, soft cinematic lighting, 8k resolution, no text, no letters, no typography, no watermarks, no words, no signs, no speech bubbles".

Input: An array of words with part of speech, Vietnamese meaning, and example sentence.
Output: A JSON array where each item has:
{
  "word": "the input word",
  "slug": "word_slug",
  "pedagogical_scene": "brief 1-sentence explanation of what scenario was chosen and why it explains the word",
  "prompt": "the complete detailed visual prompt for Google Flow"
}`;

async function main() {
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!sbUrl || !sbKey) throw new Error('Missing Supabase credentials in .env.local');

  const supabase = createClient(sbUrl, sbKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const args = process.argv.slice(2);
  const sampleArgIndex = args.indexOf('--words');
  const countArgIndex = args.indexOf('--limit');
  const limit = countArgIndex !== -1 ? parseInt(args[countArgIndex + 1], 10) : 10;

  const targetWords: WordEntry[] = [];

  if (sampleArgIndex !== -1 && args[sampleArgIndex + 1]) {
    const rawWords = args[sampleArgIndex + 1].split(',').map((w) => w.trim().toLowerCase());
    const { data } = await supabase
      .from('global_dictionary')
      .select('word, data')
      .in('word', rawWords);

    for (const w of rawWords) {
      const match = data?.find((d) => d.word.toLowerCase() === w);
      const m = match?.data?.results?.[0]?.meanings?.[0];
      targetWords.push({
        word: w,
        pos: m?.pos || (w.includes(' ') ? 'phrase' : 'word'),
        definition: match?.data?.vietnamese || match?.data?.meaning || m?.definition || '',
        example: m?.example || '',
      });
    }
  } else {
    // Query words missing images
    console.log(`[FlowBatch] Querying top ${limit} words with missing images from global_dictionary...`);
    const { data, error } = await supabase
      .from('global_dictionary')
      .select('word, data, image_url, image_source')
      .or('image_url.is.null,image_source.eq.none')
      .not('image_source', 'eq', 'skip-function')
      .limit(limit);

    if (error) throw error;
    if (!data || data.length === 0) {
      console.log('[FlowBatch] No missing words found.');
      return;
    }

    for (const r of data) {
      const m = r.data?.results?.[0]?.meanings?.[0];
      targetWords.push({
        word: r.word,
        pos: m?.pos || (r.word.includes(' ') ? 'phrase' : 'word'),
        definition: r.data?.vietnamese || r.data?.meaning || m?.definition || '',
        example: m?.example || '',
      });
    }
  }

  console.log(`[FlowBatch] Processing ${targetWords.length} words with Gemini to generate 4-layer prompts...`);

  const promptRequest = `${SYSTEM_PROMPT}\n\nList of vocabulary words to process:\n${JSON.stringify(
    targetWords,
    null,
    2
  )}`;

  const keys = getWorkingKeys();
  let responseText = '';
  
  for (const k of keys) {
    try {
      const genAI = new GoogleGenerativeAI(k);
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: { responseMimeType: 'application/json' },
      });
      const res = await model.generateContent(promptRequest);
      responseText = res.response.text();
      if (responseText) {
        console.log(`[FlowBatch] Successfully generated prompts via Gemini!`);
        break;
      }
    } catch (e: any) {
      console.warn(`[FlowBatch] Gemini Key failed (${e.status || e.message?.slice(0, 80)}). Trying next...`);
    }
  }

  // Fallback to Groq if Gemini is busy
  if (!responseText && process.env.GROQ_API_KEY) {
    console.log('[FlowBatch] Falling back to Groq (openai/gpt-oss-120b)...');
    try {
      const groqKey = process.env.GROQ_API_KEY.split(',')[0].trim();
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'openai/gpt-oss-120b',
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: `${SYSTEM_PROMPT}\nReturn your JSON inside an object with a "results" key containing the array: {"results": [...]}`,
            },
            {
              role: 'user',
              content: `List of vocabulary words to process:\n${JSON.stringify(targetWords, null, 2)}`,
            },
          ],
        }),
      });
      if (groqRes.ok) {
        const groqJson = await groqRes.json();
        const content = groqJson.choices?.[0]?.message?.content;
        const parsed = JSON.parse(content);
        const list = Array.isArray(parsed) ? parsed : parsed.results || Object.values(parsed)[0];
        if (Array.isArray(list)) {
          responseText = JSON.stringify(list);
          console.log(`[FlowBatch] Successfully generated prompts via Groq 120b!`);
        }
      } else {
        console.warn('[FlowBatch] Groq error:', await groqRes.text());
      }
    } catch (e: any) {
      console.warn('[FlowBatch] Groq exception:', e.message);
    }
  }

  if (!responseText) throw new Error('All AI providers failed');
  const generatedManifest = JSON.parse(responseText);

  const outDir = path.resolve(process.cwd(), 'tmp/flow');
  fs.mkdirSync(outDir, { recursive: true });

  const manifestPath = path.join(outDir, 'manifest.json');
  const promptsTxtPath = path.join(outDir, 'prompts.txt');

  fs.writeFileSync(manifestPath, JSON.stringify(generatedManifest, null, 2), 'utf-8');

  // Prompts file for gflow-cli
  const promptLines = generatedManifest.map((item: any) => item.prompt.replace(/\r?\n/g, ' '));
  fs.writeFileSync(promptsTxtPath, promptLines.join('\n'), 'utf-8');

  console.log(`\n[FlowBatch] Successfully generated ${generatedManifest.length} detailed prompts!`);
  console.log(`-> Manifest:   ${manifestPath}`);
  console.log(`-> Prompts TXT: ${promptsTxtPath}`);
  console.log(`\nTo generate images headlessly via gflow-cli, run:`);
  console.log(`gflow image t2i --prompts-file tmp/flow/prompts.txt --aspect 16:9 --out tmp/flow/output/ --jitter 3-8\n`);
}

main().catch((err) => {
  console.error('[FlowBatch] Error:', err);
  process.exit(1);
});
