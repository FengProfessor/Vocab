import * as fs from 'node:fs';
import * as path from 'node:path';

type JsonObject = Record<string, unknown>;

const PREFIX = '[OpenVocab]';
const ALLOWED_LICENSES = new Set(['CC BY-SA 4.0', 'CC BY 4.0', 'MIT']);
const CEFR_LEVELS = new Set(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);
const WORD_PATTERN = /^[a-z]+(?:[ '-][a-z]+)*$/;
const DEFAULT_ARTIFACT = path.resolve(process.cwd(), 'tmp/open-vocab-staging/open-vocab-staging.json');

function parseArtifactPath(argv: string[]): string {
  const arg = argv.find((value) => value.startsWith('--artifact='));
  return path.resolve(arg ? arg.slice('--artifact='.length) : DEFAULT_ARTIFACT);
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function strings(value: unknown): string[] | undefined {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
    ? value
    : undefined;
}

function validate(): void {
  const artifactPath = parseArtifactPath(process.argv.slice(2));
  const parsed = JSON.parse(fs.readFileSync(artifactPath, 'utf8')) as unknown;
  if (!isObject(parsed) || !Array.isArray(parsed.entries)) throw new Error('Artifact thiếu entries array.');

  const errorsByEntry = new Map<number, string[]>();
  const globalErrors: string[] = [];
  const seenWords = new Set<string>();
  const sourceCoverage = new Map<string, number>();
  let cefrCoverage = 0;
  let ipaCoverage = 0;
  let topicCoverage = 0;

  parsed.entries.forEach((rawEntry, index) => {
    const errors: string[] = [];
    if (!isObject(rawEntry)) {
      errors.push('entry không phải object');
      errorsByEntry.set(index, errors);
      return;
    }

    const word = typeof rawEntry.word === 'string' ? rawEntry.word : '';
    if (!WORD_PATTERN.test(word) || word !== word.toLowerCase()) errors.push(`word không hợp lệ: "${word}"`);
    if (seenWords.has(word)) errors.push(`duplicate word: "${word}"`);
    seenWords.add(word);

    if (rawEntry.cefr !== undefined) {
      cefrCoverage += 1;
      if (typeof rawEntry.cefr !== 'string' || !CEFR_LEVELS.has(rawEntry.cefr)) errors.push(`CEFR không hợp lệ: ${String(rawEntry.cefr)}`);
    }

    if (rawEntry.ipaUs !== undefined) {
      ipaCoverage += 1;
      const ipaValues = strings(rawEntry.ipaUs);
      if (!ipaValues || ipaValues.length === 0 || ipaValues.some((ipa) => !/^\/[^/\r\n\t]+\/$/.test(ipa))) {
        errors.push('ipaUs không hợp lệ');
      }
    }

    if (rawEntry.wordnetTopics !== undefined) {
      topicCoverage += 1;
      const topics = strings(rawEntry.wordnetTopics);
      if (!topics || topics.length === 0) errors.push('wordnetTopics không hợp lệ');
      if (!isObject(rawEntry.review) || rawEntry.review.wordnetTopics !== true) {
        errors.push('WordNet topics phải đánh dấu review.wordnetTopics=true');
      }
    }

    if (!Array.isArray(rawEntry.sources) || rawEntry.sources.length === 0) {
      errors.push('thiếu source attribution');
    } else {
      const entrySourceIds = new Set<string>();
      for (const source of rawEntry.sources) {
        if (!isObject(source)) {
          errors.push('source không phải object');
          continue;
        }
        const id = typeof source.id === 'string' ? source.id : '';
        const license = typeof source.license === 'string' ? source.license : '';
        const attribution = typeof source.attribution === 'string' ? source.attribution.trim() : '';
        const inputFile = typeof source.inputFile === 'string' ? source.inputFile.trim() : '';
        if (!id || !attribution || !inputFile) errors.push(`source attribution thiếu trường: ${id || '?'}`);
        if (!ALLOWED_LICENSES.has(license)) errors.push(`license ngoài allowlist: "${license}"`);
        if (entrySourceIds.has(id)) errors.push(`duplicate source attribution: ${id}`);
        if (id) {
          entrySourceIds.add(id);
          sourceCoverage.set(id, (sourceCoverage.get(id) ?? 0) + 1);
        }
      }
      if (rawEntry.cefr !== undefined && !entrySourceIds.has('cefr-j')) errors.push('CEFR thiếu attribution cefr-j');
      if (rawEntry.ipaUs !== undefined && !entrySourceIds.has('ipa-dict-en-us')) errors.push('IPA-US thiếu attribution ipa-dict-en-us');
      if (rawEntry.wordnetTopics !== undefined && !entrySourceIds.has('open-english-wordnet')) errors.push('WordNet topics thiếu attribution open-english-wordnet');
    }
    if (errors.length > 0) errorsByEntry.set(index, errors);
  });

  if (parsed.schemaVersion !== 1) globalErrors.push('schemaVersion phải là 1');
  if (parsed.mode !== 'dry-run') globalErrors.push('mode phải là dry-run');

  const total = parsed.entries.length;
  const invalid = errorsByEntry.size;
  const invalidPercent = total === 0 ? 100 : (invalid / total) * 100;
  const diagnostics = isObject(parsed.diagnostics) ? parsed.diagnostics : undefined;
  const sourceRowsObject = diagnostics && isObject(diagnostics.sourceRows) ? diagnostics.sourceRows : {};
  const sourceRows = Object.values(sourceRowsObject).reduce<number>(
    (sum, count) => sum + (typeof count === 'number' ? count : 0),
    0,
  );
  const rejectedRows = diagnostics && Array.isArray(diagnostics.rejectedRows) ? diagnostics.rejectedRows.length : 0;
  const rejectedPercent = sourceRows === 0 ? 100 : (rejectedRows / sourceRows) * 100;
  const duplicateObject = diagnostics && isObject(diagnostics.duplicateWordsWithinSource)
    ? diagnostics.duplicateWordsWithinSource
    : {};
  const duplicateCount = Object.values(duplicateObject).reduce<number>(
    (sum, words) => sum + (Array.isArray(words) ? words.length : 0),
    0,
  );
  console.log(`${PREFIX} Artifact: ${artifactPath}`);
  console.log(`${PREFIX} Coverage: total=${total}, CEFR=${cefrCoverage}, IPA-US=${ipaCoverage}, WordNet-topics=${topicCoverage}`);
  console.log(`${PREFIX} Source coverage: ${[...sourceCoverage.entries()].map(([id, count]) => `${id}=${count}`).join(', ') || 'none'}`);
  console.log(`${PREFIX} Invalid entries: ${invalid}/${total} (${invalidPercent.toFixed(2)}%), rejected rows=${rejectedRows}/${sourceRows} (${rejectedPercent.toFixed(2)}%)`);
  console.log(`${PREFIX} Duplicate words within source: ${duplicateCount}; global errors=${globalErrors.length}`);

  for (const [index, errors] of [...errorsByEntry.entries()].slice(0, 30)) {
    console.error(`${PREFIX} entry[${index}]: ${errors.join('; ')}`);
  }
  globalErrors.forEach((error) => console.error(`${PREFIX} ${error}`));
  if (errorsByEntry.size > 30) console.error(`${PREFIX} ... còn ${errorsByEntry.size - 30} entry lỗi.`);

  if (globalErrors.length > 0 || invalidPercent > 1 || rejectedPercent > 1) {
    throw new Error('Validation thất bại: lỗi global, invalid entries > 1%, hoặc rejected rows > 1%.');
  }
  console.log(`${PREFIX} Validation đạt ngưỡng invalid <= 1%.`);
}

try {
  validate();
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`${PREFIX} ${message}`);
  process.exitCode = 1;
}
