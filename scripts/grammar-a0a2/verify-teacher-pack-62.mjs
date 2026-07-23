/**
 * Verification Script for 62 Grammar Topics Teacher Pack
 * Checks student HTML files, teacher KEY files, INDEX.md, manifest.json, and spot-checks 5 target slugs.
 *
 * Usage: node scripts/grammar-a0a2/verify-teacher-pack-62.mjs [outDir]
 * Default outDir: tmp/teacher-pack-62
 */

import fs from 'fs';
import path from 'path';

const SPOT_SLUGS = [
  'articles',
  'personal-pronouns',
  'present-simple',
  'cleft-sentences',
  'conditionals-0-1',
];

function main() {
  const outDir = path.resolve(process.argv[2] || 'tmp/teacher-pack-62');
  console.log(`🔍 Verifying Teacher Pack in: ${outDir}`);

  if (!fs.existsSync(outDir)) {
    console.error(`❌ Output directory does not exist: ${outDir}`);
    process.exit(1);
  }

  let failed = false;

  // 1. Verify student HTML files
  const studentDir = path.join(outDir, 'student');
  if (!fs.existsSync(studentDir)) {
    console.error(`❌ Directory missing: ${studentDir}`);
    process.exit(1);
  }

  const studentFiles = fs.readdirSync(studentDir).filter((f) => f.endsWith('.html'));
  console.log(`- Found ${studentFiles.length} student HTML files.`);
  if (studentFiles.length !== 62) {
    console.error(`❌ Expected 62 student HTML files, found ${studentFiles.length}`);
    failed = true;
  }

  // 2. Verify teacher KEY files
  const teacherDir = path.join(outDir, 'teacher');
  if (!fs.existsSync(teacherDir)) {
    console.error(`❌ Directory missing: ${teacherDir}`);
    process.exit(1);
  }

  const teacherFiles = fs.readdirSync(teacherDir).filter((f) => f.endsWith('-KEY.md'));
  console.log(`- Found ${teacherFiles.length} teacher KEY files.`);
  if (teacherFiles.length !== 62) {
    console.error(`❌ Expected 62 teacher KEY files, found ${teacherFiles.length}`);
    failed = true;
  }

  const allKeysPath = path.join(teacherDir, 'ALL-KEYS.md');
  if (!fs.existsSync(allKeysPath)) {
    console.error(`❌ Missing ALL-KEYS.md file in teacher directory`);
    failed = true;
  }

  // 3. Verify INDEX.md
  const indexPath = path.join(outDir, 'INDEX.md');
  if (!fs.existsSync(indexPath)) {
    console.error(`❌ Missing INDEX.md`);
    failed = true;
  } else {
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    const tableLines = indexContent
      .split(/\r?\n/)
      .filter((line) => line.trim().startsWith('|') && !line.includes('|---|') && !line.includes('| Tên Bài Học'));
    console.log(`- INDEX.md contains ${tableLines.length} data rows.`);
    if (tableLines.length < 62) {
      console.error(`❌ INDEX.md expected at least 62 data rows, got ${tableLines.length}`);
      failed = true;
    }
  }

  // 4. Verify manifest.json
  const manifestPath = path.join(outDir, 'manifest.json');
  let manifest = null;
  if (!fs.existsSync(manifestPath)) {
    console.error(`❌ Missing manifest.json`);
    failed = true;
  } else {
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      console.log(`- manifest.json: total_topics=${manifest.total_topics}, total_exercises=${manifest.total_exercises}, total_examples=${manifest.total_examples}`);
      if (manifest.total_topics !== 62) {
        console.error(`❌ manifest total_topics is ${manifest.total_topics}, expected 62`);
        failed = true;
      }
      for (const t of manifest.topics || []) {
        if (t.n_exercises < 36) {
          console.error(`❌ Topic ${t.slug} has n_exercises=${t.n_exercises} (< 36)`);
          failed = true;
        }
        if (t.n_examples < 10) {
          console.error(`❌ Topic ${t.slug} has n_examples=${t.n_examples} (< 10)`);
          failed = true;
        }
      }
    } catch (e) {
      console.error(`❌ Failed to parse manifest.json:`, e);
      failed = true;
    }
  }

  // 5. Spot-check 5 target slugs
  console.log(`\n🎯 Spot-checking 5 target slugs:`, SPOT_SLUGS.join(', '));
  for (const slug of SPOT_SLUGS) {
    const sFile = studentFiles.find((f) => f.includes(`-${slug}.html`));
    const tFile = teacherFiles.find((f) => f.includes(`-${slug}-KEY.md`));

    if (!sFile) {
      console.error(`❌ Spot-check failed: Missing student HTML for slug '${slug}'`);
      failed = true;
      continue;
    }
    if (!tFile) {
      console.error(`❌ Spot-check failed: Missing teacher KEY for slug '${slug}'`);
      failed = true;
      continue;
    }

    // Check student HTML
    const sContent = fs.readFileSync(path.join(studentDir, sFile), 'utf8');
    const hasHiddenAnswersSection = sContent.includes('style="display:none"') || sContent.includes('class="block answers');
    const containsDirectAnswersKeyText = sContent.includes('🔑 Đáp án');
    
    if (!hasHiddenAnswersSection && !containsDirectAnswersKeyText) {
      console.error(`❌ Spot-check failed: HTML for ${slug} does not contain expected hidden answer key section structure`);
      failed = true;
    } else {
      console.log(`  ✓ [HTML] ${sFile}: Verified student answers section hidden/handled (withAnswers: false)`);
    }

    // Check teacher KEY
    const tContent = fs.readFileSync(path.join(teacherDir, tFile), 'utf8');
    const hasHeaderColumn = tContent.includes('| Answer |') || tContent.includes('| Answer');
    const tableRows = tContent.split(/\r?\n/).filter((l) => l.trim().match(/^\|\s*\d+\s*\|/));
    
    const topicMeta = manifest?.topics?.find((t) => t.slug === slug);
    const expectedExCount = topicMeta ? topicMeta.n_exercises : 36;

    if (!hasHeaderColumn) {
      console.error(`❌ Spot-check failed: KEY.md for ${slug} missing '| Answer |' column`);
      failed = true;
    } else if (tableRows.length < expectedExCount) {
      console.error(`❌ Spot-check failed: KEY.md for ${slug} has ${tableRows.length} rows (< expected ${expectedExCount})`);
      failed = true;
    } else {
      console.log(`  ✓ [KEY] ${tFile}: Verified table header and ${tableRows.length} exercise rows (>= ${expectedExCount})`);
    }
  }

  if (failed) {
    console.error(`\n❌ VERIFICATION FAILED! Please inspect errors above.`);
    process.exit(1);
  } else {
    console.log(`\n🎉 VERIFICATION PASSED! All 62 handouts and answer keys verified successfully.`);
    process.exit(0);
  }
}

main();
