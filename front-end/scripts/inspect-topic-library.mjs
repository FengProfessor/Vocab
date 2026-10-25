import fs from 'fs';
import path from 'path';

const baseDir = path.resolve('src/data/speaking/topic-library');
const categories = ['daily-situations', 'describing', 'social', 'workplace-extended'];

const allFiles = [];
const nonIndexFiles = [];
const indexFiles = [];

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDir(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.ts')) {
      const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
      allFiles.push({ fullPath, relPath, name: entry.name });
      if (entry.name === 'index.ts') {
        indexFiles.push({ fullPath, relPath, name: entry.name });
      } else {
        nonIndexFiles.push({ fullPath, relPath, name: entry.name });
      }
    }
  }
}

scanDir(baseDir);

console.log(`Total .ts files in topic-library: ${allFiles.length}`);
console.log(`Index files: ${indexFiles.length}`);
console.log(`Non-index topic files: ${nonIndexFiles.length}`);

// Category breakdown
const categoryCounts = {};
for (const f of nonIndexFiles) {
  const cat = f.relPath.split('/')[0];
  categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
}
console.log('Topic files by category:', JSON.stringify(categoryCounts, null, 2));

// Detailed per-file analysis
const fileDetails = [];
let totalSubtopics = 0;
let totalVocabulary = 0;
let totalDialogues = 0;
let totalPhrases = 0;
let existingActionsCount = 0;
let existingImagesCount = 0;

for (const file of nonIndexFiles) {
  const content = fs.readFileSync(file.fullPath, 'utf8');

  // Exports
  const namedExports = [...content.matchAll(/export\s+const\s+([A-Za-z0-9_]+)/g)].map(m => m[1]);
  const defaultExport = /export\s+default/.test(content);
  const typeAnnotationMatch = content.match(/:\s*(?:readonly\s+)?([A-Za-z0-9_]+(?:\[\])?)/);
  
  // Specific check for TopicLibraryItem[]
  const hasTopicLibraryItemType = /TopicLibraryItem\[\]/.test(content);

  // Subtopics count: looking for titleEn inside the exported array
  const titleEnMatches = [...content.matchAll(/["']?titleEn["']?\s*:\s*['"`](.*?)['"`]/g)];
  const subtopicCount = titleEnMatches.length;
  totalSubtopics += subtopicCount;

  // Key vocabulary items: count term: '...'
  const termMatches = [...content.matchAll(/["']?term["']?\s*:\s*['"`](.*?)['"`]/g)];
  const vocabCount = termMatches.length;
  totalVocabulary += vocabCount;

  // Check if associatedActions or imageUrl already exist
  const actionsMatches = [...content.matchAll(/["']?associatedActions["']?\s*:/g)];
  const imageMatches = [...content.matchAll(/["']?imageUrl["']?\s*:/g)];
  existingActionsCount += actionsMatches.length;
  existingImagesCount += imageMatches.length;

  // Dialogues
  const dialogueTurns = [...content.matchAll(/["']?speaker["']?\s*:\s*['"`](.*?)['"`]/g)].length;
  totalDialogues += dialogueTurns;

  fileDetails.push({
    category: file.relPath.split('/')[0],
    fileName: file.name,
    relPath: file.relPath,
    namedExports,
    hasDefaultExport: defaultExport,
    hasTopicLibraryItemType,
    subtopicCount,
    vocabCount,
    actionsCount: actionsMatches.length,
    imageCount: imageMatches.length,
    sizeBytes: fs.statSync(file.fullPath).size
  });
}

console.log('\n--- Summary Statistics ---');
console.log(`Total non-index topic files: ${nonIndexFiles.length}`);
console.log(`Total sub-topics (items): ${totalSubtopics}`);
console.log(`Total vocabulary items: ${totalVocabulary}`);
console.log(`Existing associatedActions: ${existingActionsCount}`);
console.log(`Existing imageUrl: ${existingImagesCount}`);
console.log(`Average vocab per subtopic: ${(totalVocabulary / totalSubtopics).toFixed(2)}`);
console.log(`Average vocab per file: ${(totalVocabulary / nonIndexFiles.length).toFixed(2)}`);
console.log(`Average subtopics per file: ${(totalSubtopics / nonIndexFiles.length).toFixed(2)}`);

console.log('\n--- Category Breakdown ---');
for (const [cat, count] of Object.entries(categoryCounts)) {
  console.log(`  ${cat}: ${count} files`);
}

// Detailed schema analysis across files
const allVocabProps = new Set();
const allTopicProps = new Set();
const levelsCount = {};
const allTermsList = [];
const distinctTermsSet = new Set();
const quoteStyles = { jsonQuoted: 0, jsUnquoted: 0 };
let minVocabPerSubtopic = 999;
let maxVocabPerSubtopic = 0;
let minSubtopicsPerFile = 999;
let maxSubtopicsPerFile = 0;

for (const file of nonIndexFiles) {
  const content = fs.readFileSync(file.fullPath, 'utf8');

  // Quoting style check
  if (content.includes('"id":') || content.includes('"titleEn":')) {
    quoteStyles.jsonQuoted++;
  } else {
    quoteStyles.jsUnquoted++;
  }

  // Count subtopics in this file
  const titleEnMatches = [...content.matchAll(/["']?titleEn["']?\s*:\s*['"`](.*?)['"`]/g)];
  if (titleEnMatches.length < minSubtopicsPerFile) minSubtopicsPerFile = titleEnMatches.length;
  if (titleEnMatches.length > maxSubtopicsPerFile) maxSubtopicsPerFile = titleEnMatches.length;

  // Levels
  const levelMatches = [...content.matchAll(/["']?level["']?\s*:\s*['"`](.*?)['"`]/g)];
  for (const lm of levelMatches) {
    levelsCount[lm[1]] = (levelsCount[lm[1]] || 0) + 1;
  }

  // Terms
  const termMatches = [...content.matchAll(/["']?term["']?\s*:\s*['"`](.*?)['"`]/g)];
  for (const tm of termMatches) {
    allTermsList.push(tm[1].trim());
    distinctTermsSet.add(tm[1].trim().toLowerCase());
  }

  // Vocab properties check
  const vocabPropMatches = [...content.matchAll(/(term|ipa|partOfSpeech|meaningVi|exampleEn|exampleVi|associatedActions|imageUrl)\s*:/g)];
  for (const vpm of vocabPropMatches) {
    allVocabProps.add(vpm[1]);
  }

  // Topic properties check
  const topicPropMatches = [...content.matchAll(/(id|category|subcategory|level|titleEn|titleVi|icon|situationVi|sampleDialogue|keyVocabulary|usefulPhrases|aiTutorPrompt|tags)\s*:/g)];
  for (const tpm of topicPropMatches) {
    allTopicProps.add(tpm[1]);
  }
}

console.log('\n--- Schema Analysis ---');
console.log('Detected Topic Properties:', Array.from(allTopicProps).sort());
console.log('Detected Vocab Properties:', Array.from(allVocabProps).sort());
console.log('Subtopics by CEFR Level:', levelsCount);
console.log('Quoting style (files):', quoteStyles);
console.log(`Min subtopics/file: ${minSubtopicsPerFile}, Max subtopics/file: ${maxSubtopicsPerFile}`);
console.log(`Total vocabulary instances: ${allTermsList.length}`);
console.log(`Distinct terms (case-insensitive): ${distinctTermsSet.size}`);

console.log('\n--- All 50 Topic Files Table ---');
fileDetails.forEach((f, idx) => {
  const num = (idx + 1).toString().padStart(2, '0');
  console.log(`${num}. [${f.category}] ${f.fileName} | Subtopics: ${f.subtopicCount} | Vocab: ${f.vocabCount} | Type: ${f.hasTopicLibraryItemType ? 'TopicLibraryItem[]' : 'unknown'} | Export: ${f.namedExports.join(', ')}`);
});

fs.writeFileSync('scripts/topic-library-survey-data.json', JSON.stringify({
  totalTsFiles: allFiles.length,
  indexFilesCount: indexFiles.length,
  nonIndexTopicFilesCount: nonIndexFiles.length,
  totalSubtopics,
  totalVocabulary,
  existingActionsCount,
  existingImagesCount,
  distinctTermsCount: distinctTermsSet.size,
  levelsCount,
  quoteStyles,
  categoryCounts,
  fileDetails
}, null, 2));



