import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const CWD = path.resolve(DIR, '../..'); // web-app directory

function log(msg: string) {
  console.log(`[AutoPipeline] ${new Date().toISOString()} - ${msg}`);
}

function runCmd(cmd: string, args: string[]): boolean {
  log(`Running: ${cmd} ${args.join(' ')}`);
  const res = spawnSync(cmd, args, {
    cwd: CWD,
    shell: true,
    encoding: 'utf-8',
    stdio: 'inherit'
  });
  if (res.error) {
    log(`Error executing ${cmd}: ${res.error.message}`);
    return false;
  }
  log(`Command exited with status ${res.status}`);
  return res.status === 0;
}

async function main() {
  log("Starting Auto Enrich -> Sync -> Deploy -> Shutdown pipeline...");

  // 1. Run enrich-exercises
  log("Step 1: Running enrich-exercises.ts...");
  const enrichSuccess = runCmd('npx', ['tsx', 'scripts/grammar-gen/enrich-exercises.ts', '--delay', '1000']);
  log(`Enrich finished. Success status: ${enrichSuccess}`);

  // 2. Run sync-lessons to sync with database
  log("Step 2: Syncing completed lessons to Supabase database...");
  runCmd('npx', ['tsx', 'scripts/grammar-gen/sync-lessons.ts', '--all', '--apply']);

  // 3. Git commit & deploy
  log("Step 3: Staging and committing enriched JSON files...");
  runCmd('git', ['add', 'scripts/grammar-gen/out/*.json']);
  
  // Check if we actually have changes in the out directory before committing
  const statusRes = spawnSync('git', ['status', '--porcelain'], { cwd: CWD, shell: true, encoding: 'utf-8' });
  const hasChanges = statusRes.stdout && statusRes.stdout.includes('scripts/grammar-gen/out/');
  
  if (hasChanges) {
    runCmd('git', ['commit', '-m', 'feat(grammar): mass enrich grammar exercises to 100 questions per lesson']);
    runCmd('git', ['push']);
    log("Deploy triggered via git push.");
  } else {
    log("No changes detected in out/*.json to commit.");
  }

  // 4. Shutdown system
  log("Step 4: Shutting down computer in 30 seconds...");
  runCmd('shutdown', ['/s', '/f', '/t', '30', '/c', '"LingoPro Grammar Enrichment pipeline completed. Shutting down system."']);
}

main().catch((err) => {
  log(`Fatal error in pipeline: ${err.message}`);
  // Attempt shutdown anyway as requested by the user
  runCmd('shutdown', ['/s', '/f', '/t', '60', '/c', '"Pipeline failed with error. Shutting down system."']);
});
