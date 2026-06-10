import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';

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

import { getRouter } from '../src/lib/ai-router';

// Helper to sanitize filename
function sanitizeFilename(filename: string): string {
  return filename.replace(/[\\/*?:"<>|]/g, "").trim();
}

interface ProcessResult {
  words: string[];
  apiCalled: boolean;
}

async function processVideo(sheetName: string, cell: string, title: string, youtubeUrl: string): Promise<ProcessResult | null> {
  const safeSheet = sanitizeFilename(sheetName);
  const safeTitle = sanitizeFilename(title).substring(0, 40);
  const transcriptDir = path.resolve(__dirname, `../../tmp/transcripts/${safeSheet}`);
  
  // Robust prefix-based transcript path finding
  let transcriptPath = '';
  if (fs.existsSync(transcriptDir)) {
    const files = fs.readdirSync(transcriptDir);
    const prefix = `${cell}_`;
    const matchedFile = files.find(f => f.startsWith(prefix));
    if (matchedFile) {
      transcriptPath = path.join(transcriptDir, matchedFile);
    }
  }
  
  if (!transcriptPath) {
    transcriptPath = path.join(transcriptDir, `${cell}_${safeTitle}.txt`);
  }
  
  const vocabDir = path.resolve(__dirname, `../../tmp/vocab/${safeSheet}`);
  // Robust prefix-based vocab path finding
  let vocabPath = '';
  if (fs.existsSync(vocabDir)) {
    const files = fs.readdirSync(vocabDir);
    const prefix = `${cell}_`;
    const matchedFile = files.find(f => f.startsWith(prefix) && f.endsWith('_vocab.json'));
    if (matchedFile) {
      vocabPath = path.join(vocabDir, matchedFile);
    }
  }
  
  if (!vocabPath) {
    vocabPath = path.join(vocabDir, `${cell}_${safeTitle}_vocab.json`);
  }
  
  if (fs.existsSync(vocabPath)) {
    console.log(`  -> Vocabulary already extracted for ${cell}: "${title}". Skipping.`);
    return {
      words: JSON.parse(fs.readFileSync(vocabPath, 'utf8')) as string[],
      apiCalled: false
    };
  }
  
  // Ensure transcript exists, otherwise skip
  if (!fs.existsSync(transcriptPath)) {
    console.log(`  -> Transcript not found for ${cell}. skipping downloading here...`);
  }
  
  // Try finding again
  if (!fs.existsSync(transcriptPath) && fs.existsSync(transcriptDir)) {
    const files = fs.readdirSync(transcriptDir);
    const prefix = `${cell}_`;
    const matchedFile = files.find(f => f.startsWith(prefix));
    if (matchedFile) {
      transcriptPath = path.join(transcriptDir, matchedFile);
    }
  }
  
  if (!fs.existsSync(transcriptPath)) {
    console.error(`  -> Transcript file still missing for ${cell}. Skipping.`);
    return null;
  }
  
  // Read transcript
  const rawContent = fs.readFileSync(transcriptPath, 'utf8');
  // Skip the metadata header if present (robust against CRLF and LF)
  const parts = rawContent.split(/--------------------------------------------------\r?\n/);
  const transcriptText = parts.length > 1 ? parts[1].trim() : rawContent.trim();
  
  if (!transcriptText || transcriptText.includes("Status: Subtitles Disabled") || transcriptText.includes("Status: No Transcript Found") || transcriptText.includes("Status: Video Unavailable")) {
    console.warn(`  -> Transcript text is empty or unavailable for ${cell}. Caching empty vocab.`);
    if (!fs.existsSync(vocabDir)) {
      fs.mkdirSync(vocabDir, { recursive: true });
    }
    fs.writeFileSync(vocabPath, JSON.stringify([], null, 2), 'utf8');
    return { words: [], apiCalled: false };
  }
  
  console.log(`  -> Extracting vocabulary via Gemini for ${cell}: "${title}"...`);
  
  const prompt = `You are an expert English language teacher and linguist.
I will give you a raw audio transcript of a video teaching English vocabulary. 
In this video, the teacher speaks a list of English words and phrases (often repeating them for pronunciation practice).

Here is the raw transcript:
"""
${transcriptText}
"""

Please analyze the transcript and extract the unique list of English words and phrases taught in this video.
Instructions:
- Clean up any transcription errors or typos (e.g. "household shore" should be corrected to "household chore", "meat" to "meet" depending on context).
- Keep only English words/phrases (no Vietnamese explanations).
- Remove duplicates and keep only unique words/phrases.
- Return the list in the order they appear in the video.
- Return ONLY a valid JSON object with a single key "vocabulary" containing a string array of the extracted words/phrases.

Example Output:
{
  "vocabulary": ["take out", "homemaker", "finance", "do the washing up", "heavy lifting"]
}
Strict JSON format only.`;
  
  let attempt = 0;
  while (attempt < 5) {
    try {
      const router = getRouter();
      const rawResponse = await router.generate(prompt, 'normal', true);
      
      let parsed: { vocabulary: string[] };
      try {
        parsed = JSON.parse(rawResponse);
      } catch {
        const match = rawResponse.match(/\{[\s\S]*\}/);
        if (!match) throw new Error("Could not find JSON object in model response");
        parsed = JSON.parse(match[0]);
      }
      
      const vocab = parsed.vocabulary || [];
      
      // Save individual file
      if (!fs.existsSync(vocabDir)) {
        fs.mkdirSync(vocabDir, { recursive: true });
      }
      fs.writeFileSync(vocabPath, JSON.stringify(vocab, null, 2), 'utf8');
      console.log(`  -> Success! Extracted ${vocab.length} words.`);
      return { words: vocab, apiCalled: true };
      
    } catch (err: any) {
      attempt++;
      const errMsg = err.message || String(err);
      const isRateLimit = errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("cooldown") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("limit") || errMsg.includes("No keys available");
      
      if (isRateLimit && attempt < 5) {
        const waitTime = errMsg.includes("No keys available") || errMsg.includes("cooldown") ? 65000 : 45000;
        console.warn(`  -> Rate limited or keys in cooldown (attempt ${attempt}/5). Waiting ${waitTime/1000} seconds before retry...`);
        await new Promise(r => setTimeout(r, waitTime));
      } else {
        console.error(`  -> Failed to extract vocabulary via Gemini for ${cell}:`, errMsg);
        return null;
      }
    }
  }
  return null;
}

async function main() {
  const jsonPath = path.resolve(__dirname, '../../tmp/extracted_youtube_links.json');
  if (!fs.existsSync(jsonPath)) {
    console.error(`Error: ${jsonPath} not found. Run the extraction script first.`);
    process.exit(1);
  }
  
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const args = process.argv.slice(2);
  const limit = args[0] ? parseInt(args[0], 10) : 5; // Default limit to 5 for test run
  const sheetName = args[1] || 'FLASHCARD ONLINE PRO3M';
  const videos = data[sheetName];
  
  if (!videos) {
    console.error(`Error: Sheet "${sheetName}" not found in extracted links JSON.`);
    process.exit(1);
  }
  
  console.log(`\n==========================================`);
  console.log(`Starting Vocabulary Extraction for "${sheetName}"`);
  console.log(`Processing up to ${limit} videos. (Pass a higher number as an argument to process more)`);
  console.log(`==========================================\n`);
  
  const finalResult: { [lessonName: string]: { cell: string; youtubeUrl: string; wordCount: number; words: string[] } } = {};
  
  for (let i = 0; i < Math.min(videos.length, limit); i++) {
    const video = videos[i];
    console.log(`[${i+1}/${Math.min(videos.length, limit)}] Lesson: "${video.title}" (Cell: ${video.cell})`);
    
    const result = await processVideo(sheetName, video.cell, video.title, video.youtubeUrl);
    if (result) {
      finalResult[video.title] = {
        cell: video.cell,
        youtubeUrl: video.youtubeUrl,
        wordCount: result.words.length,
        words: result.words
      };
      
      if (result.apiCalled) {
        console.log(`  -> Sleeping 12s to respect rate limits...`);
        await new Promise(r => setTimeout(r, 12000));
      }
    }
  }
  
  // Save combined output
  const outputDir = path.resolve(__dirname, '../../tmp/vocab');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const outputPath = path.join(outputDir, `${sanitizeFilename(sheetName)}_all_vocab.json`);
  
  // Merge with existing data if present
  let mergedResult = finalResult;
  if (fs.existsSync(outputPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
      mergedResult = { ...existing, ...finalResult };
    } catch (e) {}
  }
  
  fs.writeFileSync(outputPath, JSON.stringify(mergedResult, null, 2), 'utf8');
  console.log(`\nCombined vocabulary saved to: ${outputPath}`);
  console.log(`Successfully processed lessons. Check the output file to see the words!`);
}

main().catch(console.error);
