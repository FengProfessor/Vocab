/**
 * Challenger Tier 5 Adversarial Master Runner
 * Aggregates all Tier 5 Adversarial Hardening suites:
 * 1. Steganographic Watermark Preservation & Robustness Across 4,000 Questions
 * 2. Media Proxy Rapid Sequential Range Requests & Audio Scrubbing
 * 3. Question History Rapid Flag Toggling, Note Saving & Concurrency Stress
 */

import { TestRunner, SuiteStats } from './test-harness';
import { runChallengerWatermarkTests } from './challenger-tier5-watermark.test';
import { runChallengerProxyRangeTests } from './challenger-tier5-proxy-range.test';
import { runChallengerHistoryStressTests } from './challenger-tier5-history-stress.test';

async function main() {
  console.log('================================================================================');
  console.log('  CHALLENGER M6-1 — TIER 5 ADVERSARIAL COVERAGE HARDENING SUITE');
  console.log('  Scope: 4,000 Questions Steganography, Rapid Range Requests, History Stress');
  console.log('================================================================================\n');

  const startTime = Date.now();
  const runner = new TestRunner();

  console.log('▶ Running Suite 1: 4,000 Questions Steganographic Watermark Hardening...');
  await runChallengerWatermarkTests(runner);

  console.log('\n▶ Running Suite 2: Media Proxy Rapid Sequential Range Requests...');
  await runChallengerProxyRangeTests(runner);

  console.log('\n▶ Running Suite 3: Question History Rapid Flag Toggling & Note Saving Stress...');
  await runChallengerHistoryStressTests(runner);

  const stats = runner.getStats();
  const totalDuration = Date.now() - startTime;

  console.log('\n================================================================================');
  console.log('  TIER 5 ADVERSARIAL EXECUTION SUMMARY');
  console.log('================================================================================');
  console.log(`  Total Tests : ${stats.total}`);
  console.log(`  Passed      : ${stats.passed}`);
  console.log(`  Failed      : ${stats.failed}`);
  console.log(`  Duration    : ${totalDuration}ms`);
  console.log('================================================================================\n');

  if (stats.failed > 0) {
    console.error(`❌ FAILURE: ${stats.failed} adversarial test(s) failed.`);
    process.exit(1);
  } else {
    console.log(`✅ VERDICT: 100% EMPIRICAL PASS (${stats.passed}/${stats.total} tests passed)`);
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal runner error:', err);
  process.exit(1);
});
