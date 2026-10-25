import * as path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { parseVstepArticles, parseToeicArticles } from '../src/lib/reading-article-parser';
import { PACK_THEMES, isValidPackThemeId } from '../src/lib/pack-themes';
import { CEFR_CONFIG } from '../src/app/practice/reading-library/page';
import type { ReadingArticle } from '../src/types/reading-library';
import fs from 'fs';

async function runTests() {
  console.log('=== RUNNING READING LIBRARY VERIFICATION SUITE ===\n');
  let passed = 0;
  let failed = 0;

  function assert(desc: string, condition: boolean, extra?: any) {
    if (condition) {
      console.log(`✅ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${desc}`, extra || '');
      failed++;
    }
  }

  // 1. Check CEFR configuration covers all 6 levels
  const expectedLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  assert(
    'CEFR_CONFIG covers all 6 standard CEFR levels',
    expectedLevels.every((lvl) => Boolean(CEFR_CONFIG[lvl as keyof typeof CEFR_CONFIG]))
  );

  // 2. Check 15 Pack Themes are valid
  assert('PACK_THEMES has at least 15 curated themes', PACK_THEMES.length >= 15);
  assert(
    'All themes have emoji, labelVi, and valid ID',
    PACK_THEMES.every((t) => t.id && t.labelVi && t.emoji && isValidPackThemeId(t.id))
  );

  // 3. Test Cloze answer extraction logic
  const sampleBlankLetter = {
    id: 'b-1',
    word: 'C',
    index: 1,
    answer: 'C',
    options: ['Nonetheless', 'Otherwise', 'Accordingly', 'Similarly'],
  };
  const getExpectedClozeAnswer = (blank: any) => {
    if (typeof blank.answer === 'string' && /^[A-D]$/i.test(blank.answer)) {
      const idx = blank.answer.toUpperCase().charCodeAt(0) - 65;
      if (blank.options && blank.options[idx]) return blank.options[idx].trim();
    }
    return String(blank.answer || blank.word || '').trim();
  };

  assert(
    'Cloze letter "C" correctly resolves to "Accordingly"',
    getExpectedClozeAnswer(sampleBlankLetter) === 'Accordingly'
  );

  const sampleBlankWord = {
    id: 'b-2',
    word: 'wakes',
    index: 1,
    answer: 'wakes',
    options: ['wakes', 'sleeps', 'jumps', 'cries'],
  };
  assert(
    'Cloze word answer resolves directly to word',
    getExpectedClozeAnswer(sampleBlankWord) === 'wakes'
  );

  // 4. Test MCQ expected index logic
  const getExpectedMcqIndex = (q: any): number => {
    if (typeof q.answer === 'number') return q.answer;
    if (typeof q.answer === 'string') {
      if (/^[A-D]$/i.test(q.answer)) {
        return q.answer.toUpperCase().charCodeAt(0) - 65;
      }
      return q.options.findIndex(
        (o: string) => o.trim().toLowerCase() === String(q.answer).trim().toLowerCase()
      );
    }
    return 0;
  };

  assert(
    'MCQ numeric answer 2 resolves to index 2',
    getExpectedMcqIndex({ answer: 2, options: ['A', 'B', 'C', 'D'] }) === 2
  );
  assert(
    'MCQ letter answer "B" resolves to index 1',
    getExpectedMcqIndex({ answer: 'B', options: ['A', 'B', 'C', 'D'] }) === 1
  );
  assert(
    'MCQ letter answer "D" resolves to index 3',
    getExpectedMcqIndex({ answer: 'D', options: ['A', 'B', 'C', 'D'] }) === 3
  );

  // 5. Check routes exist on disk
  const routesToCheck = [
    'src/app/practice/reading-library/page.tsx',
    'src/app/practice/reading/page.tsx',
    'src/app/api/reading/progress/route.ts',
    'src/app/api/reading/articles/route.ts',
    'src/lib/reading-library-cache.ts',
  ];
  for (const r of routesToCheck) {
    const fullPath = path.resolve(process.cwd(), r);
    assert(`File exists: ${r}`, fs.existsSync(fullPath));
  }

  // 6. Check navigation integration
  const practicePagePath = path.resolve(process.cwd(), 'src/app/practice/page.tsx');
  const practicePageContent = fs.readFileSync(practicePagePath, 'utf8');
  assert(
    'Practice Hub includes /practice/reading-library link',
    practicePageContent.includes('/practice/reading-library')
  );

  const dailyReadingPath = path.resolve(process.cwd(), 'src/app/practice/daily-reading/page.tsx');
  const dailyReadingContent = fs.readFileSync(dailyReadingPath, 'utf8');
  assert(
    'Daily Reading page includes /practice/reading-library tab/link',
    dailyReadingContent.includes('/practice/reading-library')
  );

  const studentNavPath = path.resolve(process.cwd(), 'src/lib/student-nav.ts');
  const studentNavContent = fs.readFileSync(studentNavPath, 'utf8');
  assert(
    'Student navigation menu includes /practice/reading-library',
    studentNavContent.includes('/practice/reading-library')
  );

  // 7. Test getPassageParagraphs multi-paragraph extraction
  const { getPassageParagraphs } = await import('../src/app/practice/reading-library/page');
  const dummyHtmlArticle: any = {
    passage: '<p>First paragraph with details.</p><p>Second paragraph with evidence.</p><p>Third concluding paragraph.</p>',
    passage_plain: 'First paragraph with details. Second paragraph with evidence. Third concluding paragraph.',
  };
  const extractedParas = getPassageParagraphs(dummyHtmlArticle);
  assert(
    'getPassageParagraphs extracts 3 distinct paragraphs from HTML',
    extractedParas.length === 3 && extractedParas[1] === 'Second paragraph with evidence.'
  );

  const dummyPlainArticle: any = {
    passage: '',
    passage_plain: 'Line 1\n\nLine 2\n\nLine 3',
  };
  const extractedPlainParas = getPassageParagraphs(dummyPlainArticle);
  assert(
    'getPassageParagraphs extracts 3 distinct paragraphs from newline-separated plain text',
    extractedPlainParas.length === 3 && extractedPlainParas[0] === 'Line 1'
  );

  // 8. Test API single article semantics (no fallthrough returning array)
  const { NextRequest } = await import('next/server');
  const { GET } = await import('../src/app/api/reading/articles/route');

  const notFoundReq = new NextRequest('http://localhost:3000/api/reading/articles?slug=this-slug-definitely-does-not-exist-xyz');
  const notFoundRes = await GET(notFoundReq);
  const notFoundJson = await notFoundRes.json();
  assert(
    'API returns 404 when querying non-existent article (no fallthrough to list)',
    notFoundRes.status === 404 && notFoundJson.article === null && !notFoundJson.articles
  );

  const slugAsIdReq = new NextRequest('http://localhost:3000/api/reading/articles?id=voa-a1-morning-coffee-tradition');
  const slugAsIdRes = await GET(slugAsIdReq);
  const slugAsIdJson = await slugAsIdRes.json();
  assert(
    'API handles slug passed into id param gracefully',
    slugAsIdRes.status === 200 && slugAsIdJson.article?.title === 'A Morning Coffee Routine'
  );

  console.log(`\n========================================`);
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
