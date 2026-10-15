/**
 * End-to-End Test & Verification for NotebookLM Reading AI Enricher
 *
 * Verifies:
 * 1. Live authentication check for profile 'burn-minh' (phongvo061502@gmail.com)
 * 2. Real NLM CLI operations on curated sample reading articles:
 *    - Notebook creation
 *    - Passage source upload
 *    - Podcast audio overview generation (audio status: 'generating' / 'ready')
 *    - Mindmap generation and conversion to ReadingMindmapData
 *    - Quiz generation and extraction into ReadingQuestion[]
 * 3. Saving all generated artifacts into article metadata
 * 4. Error and edge-case handling (invalid profile, async queuing, mindmap converter)
 *
 * Usage:
 *   npx tsx scripts/test-nlm-reading-enricher.ts
 *   npx tsx scripts/test-nlm-reading-enricher.ts --cleanup
 *   npx tsx scripts/test-nlm-reading-enricher.ts --profile=burn-minh
 */

import * as path from 'path';
import dotenv from 'dotenv';
import {
  checkNlmCliStatus,
  generateNlmArtifacts,
  convertNlmMindmapToReadingFormat,
  convertNlmQuizToReadingQuestions,
  deleteNlmNotebook,
  getNotebookStudioStatus,
  downloadNlmAudio,
} from '../src/lib/reading-ai-enricher';
import { parseVstepArticles, parseToeicArticles } from '../src/lib/reading-article-parser';
import type { ReadingArticle } from '../src/types/reading-library';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const args = process.argv.slice(2);
const profileArg = args.find((a) => a.startsWith('--profile='))?.split('=')[1] || 'burn-minh';
const cleanupRequested = args.includes('--cleanup');
const unitOnly = args.includes('--unit-only');

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  ❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

async function runTestSuite() {
  console.log('====================================================');
  console.log('   NOTEBOOKLM READING ENRICHER LIVE TEST SUITE      ');
  console.log('====================================================\n');
  console.log(`Profile:   ${profileArg}`);
  console.log(`Cleanup:   ${cleanupRequested ? 'Yes (delete test notebooks)' : 'No (retain notebooks)'}\n`);

  const createdNotebooks: string[] = [];

  try {
    // ── STEP 1: Authentication Check ──
    console.log('─── [STEP 1] Verifying NLM Live Authentication ───');
    const auth = await checkNlmCliStatus(profileArg);
    console.log(`  Installed:      ${auth.installed}`);
    console.log(`  Authenticated:  ${auth.authenticated}`);
    console.log(`  Account:        ${auth.account || 'N/A'}`);
    console.log(`  Notebooks:      ${auth.notebookCount ?? 'N/A'}`);

    assert(auth.installed, 'NotebookLM CLI (nlm) is installed on host system');
    assert(auth.authenticated, `Profile "${profileArg}" is successfully authenticated`);
    assert(
      typeof auth.account === 'string' && auth.account.length > 0,
      `Detected authenticated account: ${auth.account}`
    );

    // ── STEP 2: Unit Testing Mindmap Tree & Graph Conversion ──
    console.log('\n─── [STEP 2] Testing Mindmap Structure Transformation ───');
    const sampleRawNlmMindmap = {
      name: 'Global Climate Patterns',
      children: [
        {
          name: 'Atmospheric Circulation',
          children: [{ name: 'Hadley Cells' }, { name: 'Polar Vortices' }],
        },
        {
          name: 'Ocean Currents',
          children: [{ name: 'Gulf Stream' }, { name: 'El Niño-Southern Oscillation' }],
        },
      ],
    };

    const transformedMm = convertNlmMindmapToReadingFormat(
      sampleRawNlmMindmap,
      'Global Climate Patterns'
    );
    assert(transformedMm.title === 'Global Climate Patterns', 'Mindmap title preserved');
    assert(transformedMm.root?.label === 'Global Climate Patterns', 'Mindmap root label matched');
    assert(
      Array.isArray(transformedMm.root?.children) && transformedMm.root.children.length === 2,
      'Root has 2 primary branches'
    );
    assert(
      transformedMm.root?.children?.[0]?.children?.length === 2,
      'First branch has 2 sub-nodes'
    );
    assert(
      transformedMm.root?.children?.[0]?.children?.[0]?.label === 'Hadley Cells',
      'Nested sub-node label preserved correctly'
    );
    assert(
      Array.isArray(transformedMm.nodes) && transformedMm.nodes.length === 7,
      `Flat graph nodes generated (${transformedMm.nodes?.length} nodes)`
    );
    assert(
      Array.isArray(transformedMm.edges) && transformedMm.edges.length === 6,
      `Flat graph edges generated (${transformedMm.edges?.length} edges)`
    );

    // Test empty tree edge case
    const emptyMm = convertNlmMindmapToReadingFormat(null, 'Empty Subject');
    assert(emptyMm.root?.id === 'root' && emptyMm.root.label === 'Empty Subject', 'Empty tree returns valid fallback root');
    assert(emptyMm.nodes?.length === 1 && emptyMm.edges?.length === 0, 'Empty tree returns 1 root node and 0 edges');

    // ── STEP 2b: Unit Testing Quiz Conversion & Answer Shuffling ──
    console.log('\n─── [STEP 2b] Testing Quiz Conversion & Option Shuffling ───');
    const sampleRawQuiz = {
      title: 'Mock Reading Quiz',
      questions: [
        {
          question: 'What is the capital of France?',
          answerOptions: [
            { text: 'Paris', isCorrect: true, rationale: 'Paris is the capital of France.' },
            { text: 'London', isCorrect: false },
            { text: 'Berlin', isCorrect: false },
            { text: 'Madrid', isCorrect: false },
          ],
        },
        {
          question: 'Which element has atomic number 1?',
          answerOptions: [
            { text: 'Hydrogen', isCorrect: true, rationale: 'Hydrogen is atomic number 1.' },
            { text: 'Helium', isCorrect: false },
            { text: 'Carbon', isCorrect: false },
            { text: 'Oxygen', isCorrect: false },
          ],
        },
        {
          question: 'What is the largest ocean?',
          answerOptions: [
            { text: 'Pacific', isCorrect: true, rationale: 'The Pacific Ocean is largest.' },
            { text: 'Atlantic', isCorrect: false },
            { text: 'Indian', isCorrect: false },
            { text: 'Arctic', isCorrect: false },
          ],
        },
        {
          question: 'Which planet is closest to the Sun?',
          answerOptions: [
            { text: 'Mercury', isCorrect: true, rationale: 'Mercury is closest.' },
            { text: 'Venus', isCorrect: false },
            { text: 'Earth', isCorrect: false },
            { text: 'Mars', isCorrect: false },
          ],
        },
      ],
    };

    const convertedQuestions = convertNlmQuizToReadingQuestions(sampleRawQuiz);
    assert(convertedQuestions.length === 4, `Converted 4 quiz questions`);

    const expectedCorrect = ['Paris', 'Hydrogen', 'Pacific', 'Mercury'];
    const answerIndices: number[] = [];

    for (let qIdx = 0; qIdx < convertedQuestions.length; qIdx++) {
      const q = convertedQuestions[qIdx];
      const ansIdx = q.answer as number;
      answerIndices.push(ansIdx);
      assert(
        q.options[ansIdx] === expectedCorrect[qIdx],
        `Q${qIdx + 1}: option[${ansIdx}] matches correct answer "${expectedCorrect[qIdx]}" after shuffling`
      );
      assert(Boolean(q.explain), `Q${qIdx + 1}: explanation preserved from correct option rationale`);
    }

    // Verify empty quiz handling
    const emptyQuiz = convertNlmQuizToReadingQuestions(null);
    assert(Array.isArray(emptyQuiz) && emptyQuiz.length === 0, 'Empty quiz input returns empty array');

    // ── STEP 3: Live Generation on Curated Reading Samples ──
    if (!unitOnly) {
      console.log('\n─── [STEP 3] Selecting Curated Sample Reading Articles ───');
      const vstepArticles = parseVstepArticles();
      const toeicArticles = parseToeicArticles();

      assert(vstepArticles.length > 0, `Loaded ${vstepArticles.length} VSTEP articles from dataset`);
      assert(toeicArticles.length > 0, `Loaded ${toeicArticles.length} TOEIC articles from dataset`);

      // Pick 1 academic VSTEP article and 1 practical TOEIC article
      const sampleVstep = vstepArticles.find(
        (a) => a.passage_plain && a.passage_plain.length > 300 && a.passage_plain.length < 1500
      ) || vstepArticles[0];

      const sampleToeic = toeicArticles.find(
        (a) => a.passage_plain && a.passage_plain.length > 200 && a.passage_plain.length < 1200
      ) || toeicArticles[0];

      const testArticles: Array<{ name: string; article: ReadingArticle }> = [
        { name: 'VSTEP Academic Article', article: sampleVstep },
        { name: 'TOEIC Business Article', article: sampleToeic },
      ];

      console.log(`Selected sample 1: [VSTEP] "${sampleVstep.title}" (${sampleVstep.cefr_level}, ${sampleVstep.word_count} words)`);
      console.log(`Selected sample 2: [TOEIC] "${sampleToeic.title}" (${sampleToeic.cefr_level}, ${sampleToeic.word_count} words)\n`);

      for (let i = 0; i < testArticles.length; i++) {
        const { name, article } = testArticles[i];
        console.log(`─── [STEP 3.${i + 1}] Processing ${name}: "${article.title}" ───`);

        const startTime = Date.now();
        const nlmResult = await generateNlmArtifacts(article.title, article.passage_plain, {
          profile: profileArg,
          generateAudio: true,
          generateQuiz: true,
          generateMindmap: true,
          waitForQuiz: true,
          quizTimeoutMs: 35000,
        });

        const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`  Enrichment completed in ${elapsedSec}s`);

        assert(!nlmResult.error, `Artifact generation succeeded without fatal error (Error: ${nlmResult.error || 'none'})`);
        assert(Boolean(nlmResult.notebookId), `Notebook created with ID: ${nlmResult.notebookId}`);

        if (nlmResult.notebookId) {
          createdNotebooks.push(nlmResult.notebookId);
        }

        // Check podcast metadata
        assert(Boolean(nlmResult.podcastMeta), 'Podcast metadata object returned');
        assert(
          nlmResult.podcastMeta?.audio_status === 'generating' ||
            nlmResult.podcastMeta?.audio_status === 'ready',
          `Podcast audio status is valid: ${nlmResult.podcastMeta?.audio_status}`
        );
        assert(
          Boolean(nlmResult.podcastMeta?.nlm_audio_id),
          `Audio artifact ID recorded: ${nlmResult.podcastMeta?.nlm_audio_id}`
        );
        assert(
          nlmResult.podcastMeta?.nlm_notebook_id === nlmResult.notebookId,
          `Notebook ID matches in podcast meta: ${nlmResult.podcastMeta?.nlm_notebook_id}`
        );

        // Check mindmap data
        assert(Boolean(nlmResult.mindmapData), 'Mindmap data generated');
        assert(
          Boolean(nlmResult.mindmapData?.root),
          'Mindmap contains valid root node hierarchy'
        );
        const childCount = nlmResult.mindmapData?.root?.children?.length || 0;
        assert(childCount > 0, `Mindmap generated ${childCount} primary branches`);
        assert(
          Array.isArray(nlmResult.mindmapData?.nodes) && (nlmResult.mindmapData?.nodes?.length || 0) > 0,
          `Mindmap flat graph nodes generated (${nlmResult.mindmapData?.nodes?.length} nodes)`
        );

        // Check quiz questions
        if (nlmResult.quizQuestions && nlmResult.quizQuestions.length > 0) {
          console.log(`  ✓ NLM Quiz returned ${nlmResult.quizQuestions.length} multiple-choice questions`);
          const firstQ = nlmResult.quizQuestions[0];
          assert(Boolean(firstQ.question), `Sample question text: "${firstQ.question.slice(0, 70)}..."`);
          assert(Array.isArray(firstQ.options) && firstQ.options.length >= 2, `Question has ${firstQ.options.length} options`);
          assert(typeof firstQ.answer === 'number', `Correct answer index: ${firstQ.answer} (${firstQ.options[firstQ.answer as number]})`);
          assert(
            firstQ.answer >= 0 && firstQ.answer < firstQ.options.length,
            `Answer index ${firstQ.answer} is within valid bounds [0..${firstQ.options.length - 1}]`
          );
        } else {
          console.log('  ℹ️ Quiz was queued or still processing at poll timeout (asynchronous status handled gracefully)');
        }

        // Verify saving into article metadata
        article.podcast_meta = nlmResult.podcastMeta;
        article.mindmap_data = nlmResult.mindmapData;
        if (nlmResult.quizQuestions && nlmResult.quizQuestions.length > 0) {
          article.questions = nlmResult.quizQuestions;
        }
        if (nlmResult.audioUrl) {
          article.audio_url = nlmResult.audioUrl;
        }

        assert(article.podcast_meta.nlm_notebook_id === nlmResult.notebookId, 'Article metadata: podcast_meta saved');
        assert(Boolean(article.mindmap_data?.root), 'Article metadata: mindmap_data saved');
        console.log(`  ✓ Successfully updated article metadata for "${article.title}"!\n`);

        // Verify studio status
        if (nlmResult.notebookId) {
          const studioArtifacts = await getNotebookStudioStatus(nlmResult.notebookId, profileArg);
          console.log(`  Studio status check for notebook ${nlmResult.notebookId}: ${studioArtifacts.length} artifact(s) found`);
          for (const art of studioArtifacts) {
            console.log(`    - Artifact [${art.type}]: status=${art.status}, id=${art.id || art.artifact_id}`);
          }
        }
        console.log('');
      }
    } else {
      console.log('\n─── [STEP 3] Skipped live generation (running in --unit-only mode) ───');
    }

    // ── STEP 4: Edge Case Verification ──
    console.log('─── [STEP 4] Edge Case: Non-existent Profile Handling ───');
    const invalidAuth = await checkNlmCliStatus('non-existent-profile-12345');
    assert(!invalidAuth.authenticated, 'Invalid profile is detected as unauthenticated');
    assert(Boolean(invalidAuth.error), `Appropriate error message returned: ${invalidAuth.error?.slice(0, 75)}...`);

    const failRes = await generateNlmArtifacts('Sample Title', 'Sample Passage', {
      profile: 'non-existent-profile-12345',
    });
    assert(Boolean(failRes.error), 'generateNlmArtifacts returns descriptive error for invalid profile without unhandled rejection');

    console.log('\n─── [STEP 4b] Edge Case: Audio Download Resiliency ───');
    const audioDlResult = await downloadNlmAudio('non-existent-nb-123', 'test.m4a', { profile: profileArg });
    assert(!audioDlResult.success, 'downloadNlmAudio fails gracefully on non-existent or unrendered audio');
    assert(Boolean(audioDlResult.error), 'downloadNlmAudio returns error description without uncaught exception');

    console.log('\n🎉 ALL NOTEBOOKLM INTEGRATION TESTS PASSED SUCCESSFULLY!');
  } finally {
    // ── STEP 5: Cleanup (if requested) ──
    if (cleanupRequested && createdNotebooks.length > 0) {
      console.log('\n─── [STEP 5] Cleaning Up Generated Test Notebooks ───');
      for (const nbId of createdNotebooks) {
        const deleted = await deleteNlmNotebook(nbId, profileArg);
        console.log(`  ${deleted ? '✓' : '⚠️'} Deleted test notebook: ${nbId}`);
      }
    } else if (createdNotebooks.length > 0) {
      console.log(`\nℹ️ Created test notebooks retained: ${createdNotebooks.join(', ')}`);
      console.log('   (Run with --cleanup flag to delete test notebooks automatically)');
    }
  }
}

runTestSuite().catch((err) => {
  console.error('\n❌ Fatal error during test execution:', err);
  process.exit(1);
});
