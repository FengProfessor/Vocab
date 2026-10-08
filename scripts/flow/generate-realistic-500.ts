import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import vocabStagesArtifact from '../../src/data/roadmap/vocab-stages-v1.json';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

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

const SYSTEM_PROMPT = `You are a World-Class Educational Art Director designing flashcards for an English learning app.
Your goal is to write a single, vivid, realistic everyday life scene description for each vocabulary word.

CRITICAL RULES:
1. RELATABLE EVERYDAY LIFE: Depict real normal human beings in relatable, authentic everyday situations (family moments, workplace, grocery shopping, street scenes, cooking, studying).
2. IMMEDIATE RECOGNITION: The scene MUST make the meaning of the target word instantly obvious within 0.1 seconds without needing a dictionary.
3. NATURAL HUMAN CONTEXT: Avoid cartoonish, abstract, or animal characters. Focus on genuine human expressions, relatable props, and realistic settings.
4. FORMAT: Return a valid JSON array of objects with fields: "stt", "word", "scene".
Example:
[
  { "stt": 1, "word": "family", "scene": "A warm multi-generational family laughing together while sharing a home-cooked dinner around a wooden dining table" },
  { "stt": 2, "word": "mother", "scene": "A caring mother gently tucking her sleepy child into bed with a soft bedtime storybook" }
]`;

async function callAiForChunk(chunk: any[], startStt: number): Promise<any[]> {
  const keys = getWorkingGeminiKeys();
  const inputList = chunk.map((w, i) => ({
    stt: startStt + i,
    word: w.word,
    pos: w.pos,
    meaningVi: w.meaningVi,
    example: w.example,
  }));

  const userPrompt = `${SYSTEM_PROMPT}\n\nList of vocabulary words:\n${JSON.stringify(inputList, null, 2)}`;

  // Try Gemini Flash
  for (const k of keys) {
    try {
      const genAI = new GoogleGenerativeAI(k);
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: { responseMimeType: 'application/json' },
      });
      const res = await model.generateContent(userPrompt);
      const txt = res.response.text();
      if (txt) {
        const parsed = JSON.parse(txt);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e: any) {
      // try next key
    }
  }

  // Fallback to Groq
  if (process.env.GROQ_API_KEY) {
    try {
      const groqKey = process.env.GROQ_API_KEY.split(',')[0].trim();
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: `Return JSON object {"items": [...]} for:\n${JSON.stringify(inputList)}` },
          ],
        }),
      });
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        const arr = Array.isArray(parsed) ? parsed : parsed.items || [];
        if (arr.length > 0) return arr;
      }
    } catch (e: any) {}
  }

  // Fallback heuristic if AI fails
  return chunk.map((w, i) => {
    let ex = (w.example || '').replace(/[\r\n]+/g, ' ').trim();
    if (!ex || ex.includes('I use ' + w.word)) {
      ex = w.meaningVi ? `real person in an everyday situation involving ${w.word} (${w.meaningVi})` : `an everyday scene showing ${w.word}`;
    }
    return {
      stt: startStt + i,
      word: w.word,
      scene: ex,
    };
  });
}

async function main() {
  const stage1 = vocabStagesArtifact.stages[0];
  const allWords: any[] = [];
  for (const topic of stage1.topics) {
    for (const w of topic.words) {
      allWords.push({ topicId: topic.id, ...w });
      if (allWords.length >= 500) break;
    }
    if (allWords.length >= 500) break;
  }

  console.log(`=======================================================`);
  console.log(`🎬 GENERATING REALISTIC EVERYDAY SCENES FOR 500 WORDS`);
  console.log(`=======================================================`);

  const chunkSize = 50;
  const fullResults: any[] = [];

  for (let i = 0; i < allWords.length; i += chunkSize) {
    const chunk = allWords.slice(i, i + chunkSize);
    const startStt = i + 1;
    process.stdout.write(`Generating scenes for words ${startStt} - ${startStt + chunk.length - 1}... `);
    try {
      const results = await callAiForChunk(chunk, startStt);
      // Map results
      for (let j = 0; j < chunk.length; j++) {
        const orig = chunk[j];
        const resItem = results.find((r: any) => r.word?.toLowerCase() === orig.word.toLowerCase()) || results[j] || {};
        const scene = resItem.scene || orig.example || `A real person with ${orig.word}`;
        fullResults.push({
          stt: startStt + j,
          word: orig.word,
          pos: orig.pos,
          meaningVi: orig.meaningVi,
          scene: scene.replace(/[\r\n|]+/g, ' ').trim(),
          slug: slugify(orig.word),
        });
      }
      process.stdout.write(`✅ (${results.length} scenes)\n`);
    } catch (err: any) {
      process.stdout.write(`❌ Error: ${err.message}\n`);
    }
  }

  const outDir = path.resolve(process.cwd(), 'tmp/flow');
  fs.mkdirSync(outDir, { recursive: true });

  // 1. Text format for Flow Tool
  const txtLines = fullResults.map((r) => `${r.stt} | ${r.word} | ${r.scene}`);
  const txtPath = path.join(outDir, 'vocab_500_bulk.txt');
  fs.writeFileSync(txtPath, txtLines.join('\n'), 'utf-8');

  // 2. CSV format
  const csvLines = ['STT,Word,Scene'];
  fullResults.forEach((r) => {
    csvLines.push(`${r.stt},"${r.word}","${r.scene.replace(/"/g, '""')}"`);
  });
  const csvPath = path.join(outDir, 'vocab_500_bulk.csv');
  fs.writeFileSync(csvPath, csvLines.join('\n'), 'utf-8');

  // 3. Manifest with full photorealistic prompt
  const manifestItems = fullResults.map((r) => {
    const fullPrompt = `A candid, authentic, high-resolution photograph of ${r.scene}, natural daylight, cinematic 35mm photography, warm relatable everyday moment, realistic human facial expressions, true-to-life skin textures, 8k resolution, 16:9 widescreen, no text, no letters, no typography, no watermarks, no logos`;
    return {
      stt: r.stt,
      word: r.word,
      slug: r.slug,
      scene: r.scene,
      prompt: fullPrompt,
    };
  });
  const manifestPath = path.join(outDir, 'vocab_500_manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifestItems, null, 2), 'utf-8');

  console.log(`\n🎉 HOÀN TẤT! Đã sinh xong 500 bối cảnh người thật đời thường:`);
  console.log(` - TXT:      ${txtPath} (${fs.statSync(txtPath).size} bytes)`);
  console.log(` - CSV:      ${csvPath} (${fs.statSync(csvPath).size} bytes)`);
  console.log(` - Manifest: ${manifestPath} (${fs.statSync(manifestPath).size} bytes)`);
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
