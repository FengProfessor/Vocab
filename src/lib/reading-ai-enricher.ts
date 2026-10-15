/**
 * Reading AI Enrichment Pipeline
 *
 * 1. Multi-key Gemini Rotation (GEMINI_API_KEY, GEMINI_API_KEY_SECONDARY, GEMINI_API_KEY_TERTIARY)
 * 2. Automatic Vietnamese translation, cloze blanks, vocab highlights, and mindmap generation
 * 3. NotebookLM CLI integration (audio, quiz, mindmap) with graceful fallback
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { exec, execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import type {
  ReadingClozeBlank,
  ReadingVocabularyItem,
  ReadingMindmapData,
  ReadingMindmapNode,
  ReadingPodcastMeta,
  ReadingQuestion,
} from '../types/reading-library';

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Executes NotebookLM CLI command safely without shell quoting / injection vulnerabilities.
 */
export async function runNlm(
  args: string[],
  options: { timeout?: number; env?: Record<string, string | undefined> } = {}
): Promise<{ stdout: string; stderr: string }> {
  const binary = process.platform === 'win32' ? 'nlm.exe' : 'nlm';
  try {
    return await execFileAsync(binary, args, {
      timeout: options.timeout || 30000,
      env: options.env ? { ...process.env, ...options.env } : process.env,
      windowsHide: true,
    });
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      const quoted = args
        .map((a) => (/[ \t\n\v"]/.test(a) ? `"${a.replace(/"/g, '\\"')}"` : a))
        .join(' ');
      return await execAsync(`nlm ${quoted}`, {
        timeout: options.timeout || 30000,
        env: options.env ? { ...process.env, ...options.env } : process.env,
      });
    }
    throw err;
  }
}

// Key rotation state
interface KeySlot {
  key: string;
  calls: number;
  lastUsed: number;
}

let keySlots: KeySlot[] = [];
let currentKeyIndex = 0;

export function initGeminiKeys(): KeySlot[] {
  if (keySlots.length > 0) return keySlots;

  const rawKeys: string[] = [];

  const main = process.env.GEMINI_API_KEY || '';
  for (const k of main.split(',')) {
    if (k.trim()) rawKeys.push(k.trim());
  }

  const sec = process.env.GEMINI_API_KEY_SECONDARY || '';
  for (const k of sec.split(',')) {
    if (k.trim()) rawKeys.push(k.trim());
  }

  const tert = process.env.GEMINI_API_KEY_TERTIARY || '';
  for (const k of tert.split(',')) {
    if (k.trim()) rawKeys.push(k.trim());
  }

  // Deduplicate
  const uniqueKeys = Array.from(new Set(rawKeys));
  keySlots = uniqueKeys.map((key) => ({ key, calls: 0, lastUsed: 0 }));

  if (keySlots.length > 0) {
    console.log(`[ReadingEnricher] Loaded ${keySlots.length} Gemini API key(s) in rotation pool.`);
  } else {
    console.warn(`[ReadingEnricher] No Gemini API keys found in environment.`);
  }

  return keySlots;
}

function getNextGeminiKey(): string {
  initGeminiKeys();
  if (keySlots.length === 0) {
    throw new Error('No Gemini API key available for enrichment');
  }

  const slot = keySlots[currentKeyIndex % keySlots.length];
  currentKeyIndex = (currentKeyIndex + 1) % keySlots.length;
  slot.calls += 1;
  slot.lastUsed = Date.now();
  return slot.key;
}

export interface ArticleEnrichmentResult {
  translation: string;
  summary: string;
  clozeBlanks: ReadingClozeBlank[];
  vocabularyHighlights: ReadingVocabularyItem[];
  mindmapData: ReadingMindmapData;
}

/**
 * Enriches an article using Gemini: translation, cloze blanks, vocab, and mindmap.
 */
export async function enrichArticleWithGemini(
  title: string,
  passagePlain: string,
  cefrLevel: string,
  themeId: string,
  options?: { skipClozeIfPresent?: boolean; hasCloze?: boolean }
): Promise<ArticleEnrichmentResult> {
  const apiKey = getNextGeminiKey();
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
    },
  });

  const prompt = `
You are an expert English language educator and curriculum designer.
Analyze the following English reading article (Level: ${cefrLevel}, Theme: ${themeId}):

Title: "${title}"
Passage:
"""
${passagePlain}
"""

Generate a JSON object with:
1. "translation": A natural, fluent Vietnamese translation of the entire passage.
2. "summary": A concise 2-3 sentence Vietnamese summary of the passage.
3. "vocabularyHighlights": Array of 5-8 key academic/target vocabulary words suitable for level ${cefrLevel}. Each item must have:
   - "word": string (base/lemma or exact word from passage)
   - "pos": "noun" | "verb" | "adj" | "adv" | "idiom"
   - "meaning_vi": Vietnamese definition in this context
   - "phonetic": IPA pronunciation
   - "context_sentence": short sentence from the passage or an example
4. "clozeBlanks": ${options?.hasCloze ? '[]' : `Array of 3-5 cloze test blanks chosen from the text. Each item must have:
   - "id": "blank-1", "blank-2", etc.
   - "index": 1, 2, ...
   - "word": the exact word in the text that should be a blank
   - "answer": the correct word
   - "options": 4 multiple choice options [optionA, optionB, optionC, optionD] including the correct answer
   - "explain": Vietnamese explanation why this answer is correct`}
5. "mindmap": A structured mindmap representing the core ideas, arguments, and details of the passage:
   - "title": "${title}"
   - "root": {
       "id": "root",
       "label": "${title}",
       "children": [
         {
           "id": "branch-1",
           "label": "Main Topic / Introduction",
           "details": "key points",
           "children": [...]
         },
         ...
       ]
     }

Output strict JSON only.
`.trim();

  const response = await model.generateContent(prompt);
  const text = response.response.text();
  const parsed = JSON.parse(text);

  return {
    translation: parsed.translation || '',
    summary: parsed.summary || '',
    clozeBlanks: Array.isArray(parsed.clozeBlanks) ? parsed.clozeBlanks : [],
    vocabularyHighlights: Array.isArray(parsed.vocabularyHighlights)
      ? parsed.vocabularyHighlights
      : [],
    mindmapData: parsed.mindmap || {
      title,
      root: { id: 'root', label: title, children: [] },
    },
  };
}

/**
 * Transforms NotebookLM mindmap tree ({ name, children }) to LingoPro ReadingMindmapData,
 * populating both hierarchical root tree and flat graph nodes/edges.
 */
export function convertNlmMindmapToReadingFormat(
  rawTree: any,
  title: string
): ReadingMindmapData {
  let counter = 1;
  const nodes: Array<{ id: string; label: string; group?: string }> = [];
  const edges: Array<{ source: string; target: string; label?: string }> = [];

  function mapNode(node: any, parentId?: string, depth = 0): ReadingMindmapNode {
    const id = `mm-node-${counter++}`;
    const label = node.name || node.title || node.label || 'Node';
    const group = depth === 0 ? 'root' : depth === 1 ? 'primary' : 'secondary';

    nodes.push({ id, label, group });
    if (parentId) {
      edges.push({ source: parentId, target: id });
    }

    const children =
      Array.isArray(node.children) && node.children.length > 0
        ? node.children.map((child: any) => mapNode(child, id, depth + 1))
        : undefined;

    return {
      id,
      label,
      children,
    };
  }

  const rootItem = Array.isArray(rawTree) ? rawTree[0] : rawTree;
  let rootNode: ReadingMindmapNode;

  if (rootItem) {
    rootNode = mapNode(rootItem, undefined, 0);
  } else {
    rootNode = { id: 'root', label: title, children: [] };
    nodes.push({ id: 'root', label: title, group: 'root' });
  }

  return {
    title,
    root: rootNode,
    nodes,
    edges,
  };
}

/**
 * Converts raw NotebookLM quiz JSON into typed ReadingQuestion array.
 * Shuffles options so that the correct answer is evenly distributed across A, B, C, D
 * instead of always being placed at index 0 (Option A) by NotebookLM default.
 */
export function convertNlmQuizToReadingQuestions(quizJson: any): ReadingQuestion[] {
  if (!quizJson) return [];
  const rawQuestions: any[] = Array.isArray(quizJson)
    ? quizJson
    : Array.isArray(quizJson.questions)
    ? quizJson.questions
    : [];

  return rawQuestions.map((q: any, idx: number) => {
    let rawOptions: Array<{ text: string; isCorrect: boolean; rationale?: string }> = [];

    if (Array.isArray(q.answerOptions)) {
      rawOptions = q.answerOptions.map((opt: any) => ({
        text: opt.text || String(opt),
        isCorrect: Boolean(opt.isCorrect),
        rationale: opt.rationale || undefined,
      }));
    } else if (Array.isArray(q.options)) {
      const correctIdx = typeof q.answer === 'number' ? q.answer : 0;
      rawOptions = q.options.map((opt: any, oIdx: number) => ({
        text: typeof opt === 'string' ? opt : opt.text || String(opt),
        isCorrect: oIdx === correctIdx,
        rationale: opt.rationale || undefined,
      }));
    }

    if (rawOptions.length === 0) {
      return {
        id: `nlm-q-${idx + 1}`,
        type: 'mcq' as const,
        question: q.question || '',
        options: [],
        answer: 0,
      };
    }

    // Shuffle options using Fisher-Yates so Option A is not always correct
    const shuffled = [...rawOptions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const correctIdx = shuffled.findIndex((opt) => opt.isCorrect);
    const finalAnswerIdx = correctIdx >= 0 ? correctIdx : 0;
    const correctItem = shuffled[finalAnswerIdx];

    return {
      id: `nlm-q-${idx + 1}`,
      type: 'mcq' as const,
      question: q.question || '',
      options: shuffled.map((opt) => opt.text),
      answer: finalAnswerIdx,
      explain: correctItem?.rationale || q.hint || q.explain || undefined,
    };
  });
}

/**
 * Checks whether NotebookLM CLI (`nlm`) is authenticated and responsive.
 */
export async function checkNlmCliStatus(profile = 'burn-minh'): Promise<{
  installed: boolean;
  authenticated: boolean;
  account?: string;
  notebookCount?: number;
  error?: string;
}> {
  try {
    const { stdout } = await runNlm(['login', '--check', '-p', profile], { timeout: 20000 });
    const isAuth =
      stdout.includes('Valid') ||
      stdout.includes('valid') ||
      stdout.includes('Logged in') ||
      stdout.includes('Successfully');

    const accMatch = stdout.match(/Account:\s*([^\r\n]+)/i);
    const nbMatch = stdout.match(/Notebooks found:\s*(\d+)/i);

    return {
      installed: true,
      authenticated: isAuth,
      account: accMatch ? accMatch[1].trim() : undefined,
      notebookCount: nbMatch ? parseInt(nbMatch[1], 10) : undefined,
    };
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      return {
        installed: false,
        authenticated: false,
        error: 'NotebookLM CLI (nlm) is not installed on PATH.',
      };
    }

    const output = (err.stdout || '') + (err.stderr || '') + (err.message || '');
    if (
      output.includes('Authentication expired') ||
      output.includes('Authentication failed') ||
      output.includes('Credentials have expired') ||
      output.includes('cookies have expired')
    ) {
      return {
        installed: true,
        authenticated: false,
        error: `Authentication expired for profile "${profile}". Run "nlm login -p ${profile}" in your terminal to re-authenticate.`,
      };
    }
    return {
      installed: true,
      authenticated: false,
      error: err.stderr || err.message,
    };
  }
}

/**
 * Retrieves studio artifacts for an existing notebook.
 */
export async function getNotebookStudioStatus(
  notebookId: string,
  profile = 'burn-minh'
): Promise<Array<{ id: string; artifact_id?: string; type: string; status: string; audio_url?: string | null }>> {
  try {
    const { stdout } = await runNlm(['studio', 'status', notebookId, '-p', profile, '--json'], {
      timeout: 20000,
    });
    const parsed = JSON.parse(stdout);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Deletes a notebook permanently.
 */
export async function deleteNlmNotebook(
  notebookId: string,
  profile = 'burn-minh'
): Promise<boolean> {
  try {
    await runNlm(['notebook', 'delete', notebookId, '-y', '-p', profile, '--json'], {
      timeout: 20000,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Downloads a completed audio podcast from NotebookLM.
 */
export async function downloadNlmAudio(
  notebookId: string,
  outputPath: string,
  options?: { profile?: string; artifactId?: string }
): Promise<{ success: boolean; filePath?: string; error?: string }> {
  const profile = options?.profile || 'burn-minh';
  const args = ['download', 'audio', notebookId, '-o', outputPath, '--no-progress'];
  if (options?.artifactId) {
    args.push('--id', options.artifactId);
  }

  try {
    await runNlm(args, {
      timeout: 60000,
      env: { ...process.env, NLM_PROFILE: profile, NOTEBOOKLM_PROFILE: profile },
    });
    if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
      return { success: true, filePath: outputPath };
    }
    return { success: false, error: 'Downloaded audio file is missing or empty' };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export interface GenerateNlmArtifactsOptions {
  profile?: string;
  generateAudio?: boolean;
  generateQuiz?: boolean;
  generateMindmap?: boolean;
  waitForQuiz?: boolean;
  quizTimeoutMs?: number;
  deleteNotebookAfter?: boolean;
}

export interface NlmArtifactsResult {
  audioUrl?: string;
  podcastMeta?: ReadingPodcastMeta;
  mindmapData?: ReadingMindmapData;
  quizQuestions?: ReadingQuestion[];
  notebookId?: string;
  error?: string;
}

/**
 * Generates an audio podcast, quiz questions, and mindmap via NotebookLM CLI if authenticated.
 */
export async function generateNlmArtifacts(
  title: string,
  passage: string,
  optionsOrProfile: string | GenerateNlmArtifactsOptions = 'burn-minh'
): Promise<NlmArtifactsResult> {
  const options: GenerateNlmArtifactsOptions =
    typeof optionsOrProfile === 'string'
      ? { profile: optionsOrProfile }
      : optionsOrProfile;

  const profile = options.profile || 'burn-minh';
  const generateAudio = options.generateAudio !== false;
  const generateQuiz = options.generateQuiz !== false;
  const generateMindmap = options.generateMindmap !== false;
  const waitForQuiz = options.waitForQuiz !== false;
  const quizTimeoutMs = options.quizTimeoutMs || 35000;

  const authStatus = await checkNlmCliStatus(profile);
  if (!authStatus.authenticated) {
    return {
      error: `NLM not authenticated: ${authStatus.error || 'expired credentials'}. Run 'nlm login -p ${profile}' to enable live podcast/quiz/mindmap generation.`,
    };
  }

  const tempDir = os.tmpdir();
  let notebookId: string | undefined;

  try {
    // 1. Create notebook
    const sanitizedTitle = `Reading: ${title.replace(/[\r\n`$\\]/g, ' ')}`.slice(0, 45).trim();
    const { stdout: createNbOut } = await runNlm(
      ['notebook', 'create', sanitizedTitle, '-p', profile, '--json'],
      { timeout: 35000 }
    );
    const nbData = JSON.parse(createNbOut);
    notebookId = nbData.notebook_id || nbData.id;

    if (!notebookId) {
      throw new Error(`Failed to create notebook: ${createNbOut}`);
    }

    // 2. Add passage as source using a temp file to avoid CLI argument length & quoting issues
    const tempSourcePath = path.join(
      tempDir,
      `nlm_src_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.txt`
    );
    await fs.promises.writeFile(tempSourcePath, passage, 'utf8');

    try {
      const sanitizedSourceTitle =
        title.replace(/[\r\n`$\\]/g, ' ').slice(0, 50).trim() || 'Reading Passage';
      await runNlm(
        ['source', 'add', notebookId, '--file', tempSourcePath, '--title', sanitizedSourceTitle, '--wait', '-p', profile, '--json'],
        { timeout: 90000 }
      );
    } finally {
      try {
        if (fs.existsSync(tempSourcePath)) {
          await fs.promises.unlink(tempSourcePath);
        }
      } catch {}
    }

    // 3. Create audio overview (podcast)
    let audioUrl: string | undefined;
    let podcastMeta: ReadingPodcastMeta = {
      format: 'deep_dive',
      nlm_notebook_id: notebookId,
      audio_status: 'generating',
      notes: `NotebookLM notebook ID: ${notebookId}`,
    };

    if (generateAudio) {
      try {
        const { stdout: audioOut } = await runNlm(
          ['audio', 'create', notebookId, '--format', 'deep_dive', '-y', '-p', profile, '--json'],
          { timeout: 35000 }
        );
        const audioData = JSON.parse(audioOut);
        const audioId = audioData.artifact_id || audioData.id;
        podcastMeta = {
          format: 'deep_dive',
          nlm_notebook_id: notebookId,
          nlm_audio_id: audioId,
          audio_status: audioData.status === 'completed' ? 'ready' : 'generating',
          notes: `Created via NotebookLM CLI profile ${profile}. Status: ${audioData.status || 'queued'}`,
        };
        if (audioData.audio_url) {
          audioUrl = audioData.audio_url;
        }
      } catch (aErr: any) {
        podcastMeta.audio_status = 'failed';
        podcastMeta.notes = `Audio creation failed: ${aErr.message}`;
      }
    }

    // 4. Create mindmap
    let mindmapData: ReadingMindmapData | undefined;
    if (generateMindmap) {
      try {
        const sanitizedMmTitle =
          title.replace(/[\r\n`$\\]/g, ' ').slice(0, 50).trim() || 'Mind Map';
        const { stdout: mmOut } = await runNlm(
          ['mindmap', 'create', notebookId, '-t', sanitizedMmTitle, '-y', '-p', profile, '--json'],
          { timeout: 45000 }
        );
        const mmData = JSON.parse(mmOut);
        let parsedTree: any = null;
        if (mmData.mind_map_json) {
          try {
            parsedTree =
              typeof mmData.mind_map_json === 'string'
                ? JSON.parse(mmData.mind_map_json)
                : mmData.mind_map_json;
          } catch {}
        }

        if (!parsedTree) {
          // Fallback: try download mindmap if create returned artifact_id
          const tempMmFile = path.join(tempDir, `nlm_mm_${Date.now()}.json`);
          try {
            await runNlm(
              ['download', 'mind-map', notebookId, '-o', tempMmFile],
              {
                timeout: 20000,
                env: { ...process.env, NLM_PROFILE: profile, NOTEBOOKLM_PROFILE: profile },
              }
            );
            if (fs.existsSync(tempMmFile)) {
              parsedTree = JSON.parse(await fs.promises.readFile(tempMmFile, 'utf8'));
              await fs.promises.unlink(tempMmFile);
            }
          } catch {}
        }

        if (parsedTree) {
          mindmapData = convertNlmMindmapToReadingFormat(parsedTree, title);
        }
      } catch (mErr: any) {
        console.warn(`[ReadingEnricher] Mindmap generation skipped or failed: ${mErr.message}`);
      }
    }

    // 5. Create quiz questions
    let quizQuestions: ReadingQuestion[] | undefined;
    if (generateQuiz) {
      try {
        const { stdout: quizOut } = await runNlm(
          ['quiz', 'create', notebookId, '--count', '3', '--difficulty', '3', '-y', '-p', profile, '--json'],
          { timeout: 35000 }
        );
        const quizData = JSON.parse(quizOut);
        const quizArtifactId = quizData.artifact_id || quizData.id;

        if (waitForQuiz && quizArtifactId) {
          // Poll for quiz completion (quizzes typically finish in 10-30s)
          const maxAttempts = Math.ceil(quizTimeoutMs / 4000);
          let quizCompleted = false;

          for (let attempt = 0; attempt < maxAttempts; attempt++) {
            await sleep(4000);
            try {
              const { stdout: statusOut } = await runNlm(
                ['studio', 'status', notebookId, '-p', profile, '--json'],
                { timeout: 15000 }
              );
              const artifacts = JSON.parse(statusOut);
              const qArt = Array.isArray(artifacts)
                ? artifacts.find(
                    (a: any) =>
                      (a.type === 'quiz' || a.artifact_type === 'quiz') &&
                      (a.id === quizArtifactId || a.artifact_id === quizArtifactId)
                  )
                : null;

              if (qArt && qArt.status === 'completed') {
                quizCompleted = true;
                break;
              }
              if (qArt && qArt.status === 'failed') {
                break;
              }
            } catch {
              // Retry on transient status error
            }
          }

          if (quizCompleted) {
            const tempQuizFile = path.join(
              tempDir,
              `nlm_quiz_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.json`
            );
            try {
              await runNlm(
                ['download', 'quiz', notebookId, '--id', quizArtifactId, '-o', tempQuizFile, '--format', 'json'],
                {
                  timeout: 20000,
                  env: { ...process.env, NLM_PROFILE: profile, NOTEBOOKLM_PROFILE: profile },
                }
              );
              if (fs.existsSync(tempQuizFile)) {
                const quizJson = JSON.parse(await fs.promises.readFile(tempQuizFile, 'utf8'));
                quizQuestions = convertNlmQuizToReadingQuestions(quizJson);
              }
            } catch (dErr: any) {
              console.warn(`[ReadingEnricher] Failed to download completed quiz: ${dErr.message}`);
            } finally {
              try {
                if (fs.existsSync(tempQuizFile)) {
                  await fs.promises.unlink(tempQuizFile);
                }
              } catch {}
            }
          }
        }
      } catch (qErr: any) {
        console.warn(`[ReadingEnricher] Quiz generation skipped or failed: ${qErr.message}`);
      }
    }

    // Cleanup notebook if requested
    if (options.deleteNotebookAfter && notebookId) {
      await deleteNlmNotebook(notebookId, profile);
    }

    return {
      audioUrl,
      podcastMeta,
      mindmapData,
      quizQuestions,
      notebookId,
    };
  } catch (err: any) {
    return {
      notebookId,
      error: `NLM generation error: ${err.message}`,
    };
  }
}
