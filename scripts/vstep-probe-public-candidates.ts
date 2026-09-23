import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';

type VstepSkill = 'listening' | 'reading' | 'writing' | 'speaking' | 'full_mock' | 'unknown';
type Provenance = 'official' | 'practice' | 'recalled' | 'public_drive' | 'community';

interface SourceCandidate {
  candidateId: string;
  sourceId: string;
  sourceName: string;
  url: string;
  title: string;
  skill: VstepSkill;
  provenance: Provenance;
  priority: number;
  reviewAction: 'eligible_for_public_probe' | 'metadata_only' | 'manual_review';
}

interface CandidateFile {
  version: string;
  candidates: SourceCandidate[];
}

interface ProbeResult {
  candidateId: string;
  sourceId: string;
  url: string;
  skill: VstepSkill;
  provenance: Provenance;
  status: number | null;
  fetched: boolean;
  contentAccessible: boolean;
  htmlBytes: number;
  pageTitle: string;
  writingPromptCount: number;
  speakingPromptCount: number;
  questionNodeCount: number;
  audioNodeCount: number;
  promptPreview?: string;
  error?: string;
}

const ROOT = process.cwd();
const CANDIDATES_PATH = path.join(ROOT, 'src', 'data', 'vstep', 'discovery', 'vstep-source-candidates.json');
const APPLY = process.argv.includes('--apply');

function readArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

function parseLimit(): number {
  const raw = Number(readArg('limit') || '30');
  if (!Number.isFinite(raw)) return 30;
  return Math.max(1, Math.min(100, Math.floor(raw)));
}

function shortPreview(value: string): string | undefined {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (!normalized) return undefined;
  return normalized.slice(0, 80);
}

async function probe(candidate: SourceCandidate): Promise<ProbeResult> {
  try {
    const response = await fetch(candidate.url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LingoPro-VSTEP-PublicProbe/1.0)',
        Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5',
      },
    });
    const contentType = response.headers.get('content-type') || '';
    if (!response.ok || !contentType.includes('text/html')) {
      return {
        candidateId: candidate.candidateId,
        sourceId: candidate.sourceId,
        url: candidate.url,
        skill: candidate.skill,
        provenance: candidate.provenance,
        status: response.status,
        fetched: response.ok,
        contentAccessible: false,
        htmlBytes: 0,
        pageTitle: '',
        writingPromptCount: 0,
        speakingPromptCount: 0,
        questionNodeCount: 0,
        audioNodeCount: 0,
      };
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const writingPrompts = $('.writing-prompt-text');
    const speakingPrompts = $('[data-question-text]');
    const questionNodes = $('[data-question-id], .question-item, .question-card');
    const audioNodes = $('audio, source[src$=".mp3"], source[src*=".mp3?"]');
    const firstPrompt = writingPrompts.first().text() || speakingPrompts.first().attr('data-question-text') || '';
    const writingPromptCount = writingPrompts.length;
    const speakingPromptCount = speakingPrompts.length;
    const questionNodeCount = questionNodes.length;

    return {
      candidateId: candidate.candidateId,
      sourceId: candidate.sourceId,
      url: candidate.url,
      skill: candidate.skill,
      provenance: candidate.provenance,
      status: response.status,
      fetched: true,
      contentAccessible: writingPromptCount + speakingPromptCount + questionNodeCount > 0,
      htmlBytes: Buffer.byteLength(html, 'utf8'),
      pageTitle: $('title').first().text().replace(/\s+/g, ' ').trim(),
      writingPromptCount,
      speakingPromptCount,
      questionNodeCount,
      audioNodeCount: audioNodes.length,
      promptPreview: shortPreview(firstPrompt),
    };
  } catch (error) {
    return {
      candidateId: candidate.candidateId,
      sourceId: candidate.sourceId,
      url: candidate.url,
      skill: candidate.skill,
      provenance: candidate.provenance,
      status: null,
      fetched: false,
      contentAccessible: false,
      htmlBytes: 0,
      pageTitle: '',
      writingPromptCount: 0,
      speakingPromptCount: 0,
      questionNodeCount: 0,
      audioNodeCount: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function mapWithConcurrency<T, R>(items: T[], concurrency: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (true) {
      const index = nextIndex++;
      if (index >= items.length) return;
      results[index] = await fn(items[index]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
  return results;
}

async function main(): Promise<void> {
  const file = JSON.parse(fs.readFileSync(CANDIDATES_PATH, 'utf8')) as CandidateFile;
  const sourceFilter = readArg('source');
  const provenanceFilter = readArg('provenance') as Provenance | undefined;
  const skillFilter = readArg('skill') as VstepSkill | undefined;
  const limit = parseLimit();

  const selected = file.candidates
    .filter((candidate) => candidate.reviewAction === 'eligible_for_public_probe')
    .filter((candidate) => !sourceFilter || candidate.sourceId === sourceFilter)
    .filter((candidate) => !provenanceFilter || candidate.provenance === provenanceFilter)
    .filter((candidate) => !skillFilter || candidate.skill === skillFilter)
    .slice(0, limit);

  console.log(`[VSTEP Probe] probing ${selected.length} public pages`);
  const probes = await mapWithConcurrency(selected, 4, probe);
  const output = {
    version: file.version,
    filters: {
      source: sourceFilter || null,
      provenance: provenanceFilter || null,
      skill: skillFilter || null,
      limit,
    },
    totalProbed: probes.length,
    fetched: probes.filter((result) => result.fetched).length,
    contentAccessible: probes.filter((result) => result.contentAccessible).length,
    probes,
  };

  const outputPath = APPLY
    ? path.join(ROOT, 'src', 'data', 'vstep', 'discovery', 'vstep-source-probes.json')
    : path.join(ROOT, 'tmp', 'vstep-source-probes.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  console.log(`[VSTEP Probe] fetched=${output.fetched}/${output.totalProbed} contentAccessible=${output.contentAccessible}/${output.totalProbed}`);
  console.log(`[VSTEP Probe] -> ${outputPath}`);
}

main().catch((error) => {
  console.error('[VSTEP Probe] Fatal:', error);
  process.exit(1);
});
