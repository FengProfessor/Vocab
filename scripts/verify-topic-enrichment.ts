/**
 * Automated Verification Script for Speaking Topic Library Enrichment
 * File: scripts/verify-topic-enrichment.ts
 *
 * Execution:
 *   npx tsx scripts/verify-topic-enrichment.ts
 *   npx tsx scripts/verify-topic-enrichment.ts --verbose
 *   npx tsx scripts/verify-topic-enrichment.ts --file=src/data/speaking/topic-library/describing/objects-around-me.ts
 *
 * Strict Verification Gates:
 * 1. 100% of all 50 topic data files are dynamically loadable without syntax/import errors.
 * 2. Every single topic has unique ID, valid category, level, and keyVocabulary.
 * 3. Every vocabulary item has:
 *    - Valid term, ipa, meaningVi, exampleEn, exampleVi (no undefined/null).
 *    - Non-empty associatedActions array with 2-3 bilingual items ({ en: string, vi: string }).
 *    - Non-empty, valid HTTPS imageUrl from whitelisted reputable stock domains.
 * 4. Master barrel (allTopicLibraryItems) matches sum of individual file items and loads successfully.
 */

import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

// Whitelisted stock image domains (aligned with src/lib/media-url.ts)
const APPROVED_IMAGE_DOMAINS = [
  'images.unsplash.com',
  'unsplash.com',
  'images.pexels.com',
  'pexels.com',
  'pixabay.com',
  'upload.wikimedia.org',
  'res.cloudinary.com',
];

const PLACEHOLDER_PATTERN = /(TODO|TBD|placeholder|dummy|lorem|undefined|null|via\.placeholder|example\.com)/i;

interface Defect {
  file: string;
  topicId: string;
  topicTitle: string;
  term?: string;
  gate: string;
  issue: string;
}

interface AuditStats {
  totalFiles: number;
  filesLoaded: number;
  totalTopics: number;
  totalVocab: number;
  vocabWithActions: number;
  vocabWithValidActions: number;
  vocabWithImage: number;
  vocabWithValidImage: number;
  missingEnrichmentItems: number;
  defects: Defect[];
}

function parseCliArgs() {
  const args = process.argv.slice(2);
  const fileArg = args.find(a => a.startsWith('--file='));
  return {
    verbose: args.includes('--verbose'),
    targetFile: fileArg ? fileArg.slice('--file='.length) : null,
  };
}

function collectTopicFiles(baseDir: string): string[] {
  const results: string[] = [];
  function walk(dir: string) {
    const list = fs.readdirSync(dir);
    for (const item of list) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (item.endsWith('.ts')) {
        results.push(fullPath);
      }
    }
  }
  walk(baseDir);
  return results.sort();
}

function isValidImageUrl(rawUrl: unknown): { valid: boolean; reason?: string } {
  if (typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return { valid: false, reason: 'Missing or empty imageUrl' };
  }
  if (PLACEHOLDER_PATTERN.test(rawUrl)) {
    return { valid: false, reason: `ImageUrl contains placeholder text: "${rawUrl}"` };
  }
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:') {
      return { valid: false, reason: `Invalid protocol: "${parsed.protocol}" (must be https:)` };
    }
    const host = parsed.hostname.toLowerCase();
    const isApproved = APPROVED_IMAGE_DOMAINS.some(d => host === d || host.endsWith(`.${d}`));
    if (!isApproved) {
      return { valid: false, reason: `Domain "${host}" not in approved stock image whitelist` };
    }
    return { valid: true };
  } catch {
    return { valid: false, reason: `Malformed URL: "${rawUrl}"` };
  }
}

function isValidAssociatedActions(actions: unknown): { valid: boolean; reason?: string } {
  if (actions === undefined || actions === null) {
    return { valid: false, reason: 'Missing associatedActions' };
  }
  if (!Array.isArray(actions)) {
    return { valid: false, reason: 'associatedActions is not an array' };
  }
  if (actions.length === 0) {
    return { valid: false, reason: 'associatedActions is empty' };
  }
  if (actions.length < 2 || actions.length > 3) {
    return {
      valid: false,
      reason: `Expected 2 to 3 actions, but found ${actions.length}`,
    };
  }

  for (let i = 0; i < actions.length; i++) {
    const act = actions[i];
    if (!act || typeof act !== 'object') {
      return { valid: false, reason: `Action at index [${i}] is not an object` };
    }
    const { en, vi } = act as { en?: unknown; vi?: unknown };
    if (typeof en !== 'string' || en.trim().length < 3) {
      return { valid: false, reason: `Action [${i}] English text "en" is missing or too short (min length 3)` };
    }
    if (typeof vi !== 'string' || vi.trim().length < 3) {
      return { valid: false, reason: `Action [${i}] Vietnamese translation "vi" is missing or too short (min length 3)` };
    }
    if (PLACEHOLDER_PATTERN.test(en) || PLACEHOLDER_PATTERN.test(vi)) {
      return { valid: false, reason: `Action [${i}] contains placeholder tokens (en: "${en}", vi: "${vi}")` };
    }
    if (en.trim().toLowerCase() === vi.trim().toLowerCase()) {
      return { valid: false, reason: `Action [${i}] "en" and "vi" are identical (not bilingual)` };
    }
  }

  return { valid: true };
}

async function runEnrichmentVerification() {
  const { verbose, targetFile } = parseCliArgs();
  const rootDir = process.cwd();
  const topicDir = path.resolve(rootDir, 'src/data/speaking/topic-library');

  console.log('\n===============================================================');
  console.log('🔍 LINGOPRO SPEAKING TOPIC LIBRARY ENRICHMENT AUDITOR');
  console.log('===============================================================\n');

  if (!fs.existsSync(topicDir)) {
    console.error(`❌ Directory not found: ${topicDir}`);
    process.exit(1);
  }

  const allFiles = collectTopicFiles(topicDir);
  const contentFiles = allFiles.filter(f => !f.endsWith('index.ts'));
  const barrelFiles = allFiles.filter(f => f.endsWith('index.ts'));

  let filesToAudit = contentFiles;
  if (targetFile) {
    const resolvedPath = path.isAbsolute(targetFile) ? targetFile : path.resolve(rootDir, targetFile);
    if (!fs.existsSync(resolvedPath)) {
      console.error(`❌ Specified target file not found: ${resolvedPath}`);
      process.exit(1);
    }
    filesToAudit = [resolvedPath];
  }

  console.log(`📁 Total topic files discovered: ${allFiles.length}`);
  console.log(`   - Subcategory content files: ${contentFiles.length}`);
  console.log(`   - Category & master barrel files: ${barrelFiles.length}`);
  console.log(`   - Auditing target: ${filesToAudit.length} file(s)\n`);

  const stats: AuditStats = {
    totalFiles: filesToAudit.length,
    filesLoaded: 0,
    totalTopics: 0,
    totalVocab: 0,
    vocabWithActions: 0,
    vocabWithValidActions: 0,
    vocabWithImage: 0,
    vocabWithValidImage: 0,
    missingEnrichmentItems: 0,
    defects: [],
  };

  const topicIdsSeen = new Set<string>();

  // 1. Audit individual files
  for (const filePath of filesToAudit) {
    const relPath = path.relative(rootDir, filePath).replace(/\\/g, '/');
    let moduleExports: Record<string, unknown>;

    try {
      moduleExports = await import(pathToFileURL(filePath).href);
      stats.filesLoaded++;
    } catch (err) {
      stats.defects.push({
        file: relPath,
        topicId: 'N/A',
        topicTitle: 'N/A',
        gate: 'GATE_1_LOADABILITY',
        issue: `Failed to import file: ${(err as Error).message}`,
      });
      continue;
    }

    // Extract exported topic array (looking for array of topic objects with id and keyVocabulary)
    const topicArrays = Object.values(moduleExports).filter(
      val => Array.isArray(val) && val.length > 0 && typeof val[0] === 'object' && val[0] !== null && 'id' in val[0] && 'keyVocabulary' in val[0]
    ) as Array<Array<Record<string, unknown>>>;

    if (topicArrays.length === 0) {
      stats.defects.push({
        file: relPath,
        topicId: 'N/A',
        topicTitle: 'N/A',
        gate: 'GATE_1_LOADABILITY',
        issue: 'No exported array of TopicLibraryItem found in file',
      });
      continue;
    }

    const topics = topicArrays[0];
    stats.totalTopics += topics.length;

    for (const topic of topics) {
      const topicId = String(topic.id || 'MISSING_ID');
      const topicTitle = String(topic.titleEn || 'MISSING_TITLE');

      // Check ID uniqueness
      if (topicIdsSeen.has(topicId)) {
        stats.defects.push({
          file: relPath,
          topicId,
          topicTitle,
          gate: 'GATE_2_TOPIC_SCHEMA',
          issue: `Duplicate topic ID: "${topicId}"`,
        });
      } else {
        topicIdsSeen.add(topicId);
      }

      // Check category and level
      if (!topic.category || typeof topic.category !== 'string') {
        stats.defects.push({
          file: relPath,
          topicId,
          topicTitle,
          gate: 'GATE_2_TOPIC_SCHEMA',
          issue: 'Topic missing category',
        });
      }
      if (!topic.level || typeof topic.level !== 'string') {
        stats.defects.push({
          file: relPath,
          topicId,
          topicTitle,
          gate: 'GATE_2_TOPIC_SCHEMA',
          issue: 'Topic missing level',
        });
      }

      // Check keyVocabulary existence
      const keyVocab = topic.keyVocabulary as Array<Record<string, unknown>> | undefined;
      if (!Array.isArray(keyVocab) || keyVocab.length === 0) {
        stats.defects.push({
          file: relPath,
          topicId,
          topicTitle,
          gate: 'GATE_2_TOPIC_SCHEMA',
          issue: 'Topic missing keyVocabulary array or keyVocabulary is empty',
        });
        continue;
      }

      for (let vIdx = 0; vIdx < keyVocab.length; vIdx++) {
        const vocab = keyVocab[vIdx];
        stats.totalVocab++;

        if (!vocab || typeof vocab !== 'object') {
          stats.defects.push({
            file: relPath,
            topicId,
            topicTitle,
            gate: 'GATE_3_VOCAB_SCHEMA',
            issue: `Vocabulary item at index [${vIdx}] is null or undefined`,
          });
          continue;
        }

        const term = String(vocab.term || `item[${vIdx}]`);

        // Check basic vocabulary fields
        const requiredFields: Array<'term' | 'ipa' | 'meaningVi' | 'exampleEn' | 'exampleVi'> = [
          'term',
          'ipa',
          'meaningVi',
          'exampleEn',
          'exampleVi',
        ];
        for (const field of requiredFields) {
          const val = vocab[field];
          if (typeof val !== 'string' || !val.trim()) {
            stats.defects.push({
              file: relPath,
              topicId,
              topicTitle,
              term,
              gate: 'GATE_3_VOCAB_SCHEMA',
              issue: `Field "${field}" is missing or empty`,
            });
          } else if (PLACEHOLDER_PATTERN.test(val)) {
            stats.defects.push({
              file: relPath,
              topicId,
              topicTitle,
              term,
              gate: 'GATE_3_VOCAB_SCHEMA',
              issue: `Field "${field}" contains placeholder text: "${val}"`,
            });
          }
        }

        // Check associatedActions
        let itemMissingActions = false;
        const hasActionsArray = Array.isArray(vocab.associatedActions) && vocab.associatedActions.length > 0;
        if (hasActionsArray) {
          stats.vocabWithActions++;
        } else {
          itemMissingActions = true;
        }

        const actionCheck = isValidAssociatedActions(vocab.associatedActions);
        if (actionCheck.valid) {
          stats.vocabWithValidActions++;
        } else {
          stats.defects.push({
            file: relPath,
            topicId,
            topicTitle,
            term,
            gate: 'GATE_4_ACTIONS',
            issue: actionCheck.reason || 'Invalid associatedActions',
          });
        }

        // Check imageUrl
        let itemMissingImage = false;
        if (typeof vocab.imageUrl === 'string' && vocab.imageUrl.trim().length > 0) {
          stats.vocabWithImage++;
        } else {
          itemMissingImage = true;
        }

        const imageCheck = isValidImageUrl(vocab.imageUrl);
        if (imageCheck.valid) {
          stats.vocabWithValidImage++;
        } else {
          stats.defects.push({
            file: relPath,
            topicId,
            topicTitle,
            term,
            gate: 'GATE_5_IMAGE_URL',
            issue: imageCheck.reason || 'Invalid imageUrl',
          });
        }

        if (itemMissingActions || itemMissingImage || !actionCheck.valid || !imageCheck.valid) {
          stats.missingEnrichmentItems++;
        }

        if (verbose) {
          console.log(`   ${actionCheck.valid && imageCheck.valid ? '✓' : '✗'} [${topicId}] ${term} -> Actions: ${actionCheck.valid ? 'OK' : 'FAIL'}, Image: ${imageCheck.valid ? 'OK' : 'FAIL'}`);
        }
      }
    }
  }

  // 2. Audit master barrel if running full sweep
  if (!targetFile) {
    const masterIndexPath = path.resolve(topicDir, 'index.ts');
    try {
      const masterMod = await import(pathToFileURL(masterIndexPath).href);
      const masterItems = masterMod.allTopicLibraryItems;
      if (!Array.isArray(masterItems)) {
        stats.defects.push({
          file: 'src/data/speaking/topic-library/index.ts',
          topicId: 'MASTER',
          topicTitle: 'Master Barrel',
          gate: 'GATE_6_BARREL',
          issue: 'allTopicLibraryItems is not exported as an Array',
        });
      } else if (masterItems.length !== stats.totalTopics) {
        stats.defects.push({
          file: 'src/data/speaking/topic-library/index.ts',
          topicId: 'MASTER',
          topicTitle: 'Master Barrel',
          gate: 'GATE_6_BARREL',
          issue: `Master barrel item count mismatch: found ${masterItems.length}, expected ${stats.totalTopics}`,
        });
      }
    } catch (err) {
      stats.defects.push({
        file: 'src/data/speaking/topic-library/index.ts',
        topicId: 'MASTER',
        topicTitle: 'Master Barrel',
        gate: 'GATE_6_BARREL',
        issue: `Failed to import master barrel: ${(err as Error).message}`,
      });
    }
  }

  // 3. Print Results Summary Table
  console.log('\n===============================================================');
  console.log('📊 AUDIT SUMMARY REPORT');
  console.log('===============================================================');
  console.log(`Files Processed:                ${stats.filesLoaded} / ${stats.totalFiles} (${stats.filesLoaded === stats.totalFiles ? '100%' : 'FAIL'})`);
  console.log(`Topics Audited:                 ${stats.totalTopics}`);
  console.log(`Vocabulary Items Audited:       ${stats.totalVocab}`);
  console.log(`Items with associatedActions:   ${stats.vocabWithActions} / ${stats.totalVocab}`);
  console.log(`Items with valid 2-3 Actions:   ${stats.vocabWithValidActions} / ${stats.totalVocab}`);
  console.log(`Items with imageUrl:            ${stats.vocabWithImage} / ${stats.totalVocab}`);
  console.log(`Items with valid imageUrl:      ${stats.vocabWithValidImage} / ${stats.totalVocab}`);
  console.log(`Un-enriched Vocabulary Items:   ${stats.missingEnrichmentItems} / ${stats.totalVocab} missing items`);
  console.log(`Total Defects Detected:         ${stats.defects.length}`);
  console.log('===============================================================\n');

  if (stats.defects.length > 0) {
    console.error(`❌ VERIFICATION FAILED with ${stats.defects.length} defect(s) (${stats.missingEnrichmentItems} missing items):\n`);
    const displayLimit = Math.min(stats.defects.length, 20);
    for (let i = 0; i < displayLimit; i++) {
      const d = stats.defects[i];
      console.error(`  [${d.gate}] ${d.file} -> Topic [${d.topicId}] "${d.topicTitle}" | Term: "${d.term || 'N/A'}"`);
      console.error(`    ↳ Reason: ${d.issue}\n`);
    }
    if (stats.defects.length > displayLimit) {
      console.error(`  ... and ${stats.defects.length - displayLimit} more defects truncated.\n`);
    }
    process.exit(1);
  }

  console.log('✅ ALL VERIFICATION GATES PASSED (100% Loadable, 100% Actions, 100% ImageUrls)!');
  process.exit(0);
}

runEnrichmentVerification().catch(err => {
  console.error('Fatal crash during verification execution:', err);
  process.exit(1);
});
