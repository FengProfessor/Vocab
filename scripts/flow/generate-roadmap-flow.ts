/**
 * Roadmap Vocabulary Flow Prompt Generator
 * Đọc trực tiếp từ src/data/roadmap/vocab-stages-v1.json (3.000 từ lấy gốc).
 * Sinh Prompt 4 lớp sư phạm chuẩn Google Flow / Imagen 3 / Nano Banana.
 *
 * Cách dùng:
 * - Test 10 từ đầu của Topic 1:
 *   npx tsx scripts/flow/generate-roadmap-flow.ts --stage 1 --topic s1-topic-family --limit 10
 * - Toàn bộ Topic 1 (75 từ):
 *   npx tsx scripts/flow/generate-roadmap-flow.ts --stage 1 --topic s1-topic-family
 * - Toàn bộ Stage 1 (900 từ):
 *   npx tsx scripts/flow/generate-roadmap-flow.ts --stage 1
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import vocabStagesArtifact from '../../src/data/roadmap/vocab-stages-v1.json';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

interface VocabWord {
  id: string;
  word: string;
  pos: string;
  ipa?: string;
  meaningVi: string;
  example: string;
  exampleVi?: string;
  collocation?: string;
}

interface TopicData {
  id: string;
  stage: number;
  index: number;
  title: string;
  titleEn: string;
  words: VocabWord[];
}

function getWorkingGeminiKeys(): string[] {
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

const SYSTEM_PROMPT = `You are a World-Class Educational Art Director & Prompt Engineer creating flashcard illustrations for an English learning app.
Your task is to generate high-fidelity, pedagogically vivid image prompts for Google Flow (Nano Banana / Imagen 3).

CRITICAL DESIGN RULES:
1. PEDAGOGICAL MICRO-SCENE: Do NOT generate generic or literal stock photos. Depict a specific, memorable storytelling scene with expressive 3D animated characters demonstrating the action or concept in context.
2. CONSISTENT AESTHETIC PRESET: All images MUST follow this exact style:
   "3D stylized digital animation illustration, warm soft volumetric lighting, vibrant inviting colors, Pixar Disney aesthetic, clean readable composition, expressive character emotions, 8k resolution"
3. STRICT NEGATIVE CONSTRAINTS: End every prompt with:
   ", no text, no letters, no words, no signs, no speech bubbles, no watermarks, no typography, no logos"
4. FORMAT: Return a valid JSON array of objects:
[
  {
    "word": "family",
    "slug": "family",
    "pedagogical_scene": "A warm, joyful family (parents, two kids, and a cute puppy) laughing together around a cozy dinner table.",
    "prompt": "A warm and cheerful 3D stylized illustration of a diverse family with a mother, father, two young children, and an energetic golden puppy laughing together around a cozy wooden dining table with bowls of warm soup, warm golden hour sunlight streaming through the window, happy and affectionate facial expressions, 3D stylized digital animation illustration, warm soft volumetric lighting, vibrant inviting colors, Pixar Disney aesthetic, clean readable composition, expressive character emotions, 8k resolution, no text, no letters, no words, no signs, no speech bubbles, no watermarks, no typography, no logos"
  }
]`;

async function callAiForBatch(wordsChunk: VocabWord[]): Promise<any[]> {
  const keys = getWorkingGeminiKeys();
  const promptRequest = `${SYSTEM_PROMPT}\n\nList of vocabulary words to generate prompts for:\n${JSON.stringify(
    wordsChunk.map((w) => ({
      word: w.word,
      pos: w.pos,
      meaningVi: w.meaningVi,
      example: w.example,
      collocation: w.collocation,
    })),
    null,
    2
  )}`;

  // Try Gemini first
  for (const k of keys) {
    try {
      const genAI = new GoogleGenerativeAI(k);
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: { responseMimeType: 'application/json' },
      });
      const res = await model.generateContent(promptRequest);
      const txt = res.response.text();
      if (txt) {
        const parsed = JSON.parse(txt);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e: any) {
      // continue to next key or fallback
    }
  }

  // Fallback to Groq 120b
  if (process.env.GROQ_API_KEY) {
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
            { role: 'user', content: promptRequest },
          ],
        }),
      });
      if (groqRes.ok) {
        const json = await groqRes.json();
        const content = json.choices?.[0]?.message?.content;
        const parsed = JSON.parse(content);
        const list = Array.isArray(parsed) ? parsed : parsed.results || Object.values(parsed)[0];
        if (Array.isArray(list)) return list;
      }
    } catch (err: any) {
      console.warn('[RoadmapFlow] Groq fallback error:', err.message);
    }
  }

  throw new Error('All AI providers failed for this batch');
}

async function main() {
  const args = process.argv.slice(2);
  const stageArgIdx = args.indexOf('--stage');
  const targetStage = stageArgIdx !== -1 ? parseInt(args[stageArgIdx + 1], 10) : 1;

  const topicArgIdx = args.indexOf('--topic');
  const targetTopicId = topicArgIdx !== -1 ? args[topicArgIdx + 1].trim().toLowerCase() : null;

  const limitArgIdx = args.indexOf('--limit');
  const limit = limitArgIdx !== -1 ? parseInt(args[limitArgIdx + 1], 10) : null;

  const stagesData = (vocabStagesArtifact as any).stages || [];
  const stage = stagesData.find((s: any) => s.stage === targetStage);
  if (!stage) {
    throw new Error(`Stage ${targetStage} not found in vocab-stages-v1.json`);
  }

  console.log(`=======================================================`);
  console.log(`🚀 ROADMAP FLOW PROMPT GENERATOR - STAGE ${targetStage}: ${stage.titleVi}`);
  console.log(`=======================================================`);

  let topics: TopicData[] = stage.topics || [];
  if (targetTopicId) {
    topics = topics.filter((t) => t.id.toLowerCase() === targetTopicId);
    if (topics.length === 0) {
      throw new Error(`Topic "${targetTopicId}" not found in Stage ${targetStage}`);
    }
  }

  let totalWordsCollected = 0;
  for (const topic of topics) {
    let words = topic.words || [];
    if (limit && limit > 0) {
      words = words.slice(0, limit);
    }

    console.log(`\n📌 [Topic ${topic.index}/${topics.length}] ${topic.title} (${topic.titleEn}) — ${words.length} từ`);
    const allManifest: any[] = [];
    const chunkSize = 15; // Process in chunks of 15 words to avoid token cutoffs

    for (let i = 0; i < words.length; i += chunkSize) {
      const chunk = words.slice(i, i + chunkSize);
      process.stdout.write(`   Processing words ${i + 1}-${i + chunk.length}... `);
      try {
        const batchResults = await callAiForBatch(chunk);
        // Ensure slug is set correctly
        for (const item of batchResults) {
          if (!item.slug) item.slug = slugify(item.word);
        }
        allManifest.push(...batchResults);
        process.stdout.write(`✅ (${batchResults.length} prompts)\n`);
      } catch (err: any) {
        process.stdout.write(`❌ Error: ${err.message}\n`);
      }
    }

    // Save output files for this topic
    const topicDir = path.resolve(process.cwd(), `tmp/flow/stage${targetStage}/${topic.id}`);
    fs.mkdirSync(topicDir, { recursive: true });

    const manifestFile = path.join(topicDir, 'manifest.json');
    const promptsFile = path.join(topicDir, 'prompts.txt');

    fs.writeFileSync(manifestFile, JSON.stringify(allManifest, null, 2), 'utf-8');
    const promptLines = allManifest.map((item) => (item.prompt || '').replace(/\r?\n/g, ' '));
    fs.writeFileSync(promptsFile, promptLines.join('\n'), 'utf-8');

    console.log(`   -> Manifest: ${manifestFile}`);
    console.log(`   -> Prompts:  ${promptsFile} (${promptLines.length} prompts ready)`);
    totalWordsCollected += allManifest.length;
  }

  console.log(`\n=======================================================`);
  console.log(`🎉 HOÀN TẤT! Đã sinh thành công ${totalWordsCollected} prompts cho Stage ${targetStage}.`);
  console.log(`\nĐể sinh ảnh ngầm qua gflow-cli:`);
  console.log(`gflow image t2i --prompts-file tmp/flow/stage${targetStage}/${targetTopicId || 'topic-id'}/prompts.txt --aspect 16:9 --out tmp/flow/stage${targetStage}/${targetTopicId || 'topic-id'}/output/ --jitter 3-8`);
  console.log(`=======================================================\n`);
}

main().catch((err) => {
  console.error('[RoadmapFlow] Fatal error:', err);
  process.exit(1);
});
