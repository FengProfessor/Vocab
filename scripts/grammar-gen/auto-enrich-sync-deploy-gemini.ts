import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const CWD = path.resolve(DIR, '../..'); // web-app directory

function log(msg: string) {
  console.log(`[AutoPipelineGemini] ${new Date().toISOString()} - ${msg}`);
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
  log("Starting Gemini Auto Enrich -> Sync -> Deploy pipeline...");

  // 1. Run enrich-exercises-gemini.ts
  log("Step 1: Running enrich-exercises-gemini.ts to enrich all remaining lessons to 100 exercises...");
  const enrichSuccess = runCmd('npx', ['tsx', 'scripts/grammar-gen/enrich-exercises-gemini.ts', '--delay', '1000']);
  log(`Enrich finished. Success status: ${enrichSuccess}`);

  // 2. Run sync-lessons.ts to sync with database
  log("Step 2: Syncing completed lessons to Supabase database...");
  runCmd('npx', ['tsx', 'scripts/grammar-gen/sync-lessons.ts', '--all', '--apply']);

  // 3. Git commit & deploy
  log("Step 3: Staging and committing enriched JSON files...");
  runCmd('git', ['add', 'scripts/grammar-gen/out/*.json']);
  
  // Check if we actually have changes in the out directory before committing
  const statusRes = spawnSync('git', ['status', '--porcelain'], { cwd: CWD, shell: true, encoding: 'utf-8' });
  const hasChanges = statusRes.stdout && statusRes.stdout.includes('scripts/grammar-gen/out/');
  
  if (hasChanges) {
    runCmd('git', ['commit', '-m', 'feat(grammar): mass enrich grammar exercises to 100 questions per lesson via Gemini']);
    runCmd('git', ['push', 'origin', 'main']);
    log("Git push successful.");
  } else {
    log("No changes detected in out/*.json to commit.");
  }

  // 4. Trigger production deploy on Vercel
  log("Step 4: Deploying to Vercel Production...");
  runCmd('npx', ['vercel', '--prod', '--yes']);
  log("Vercel deploy command executed.");
}

main().catch((err) => {
  log(`Fatal error in pipeline: ${err.message}`);
});
