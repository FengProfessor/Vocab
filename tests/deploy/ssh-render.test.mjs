import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const workflowPath = join(repoRoot, '.github', 'workflows', 'deploy-server.yml');
const workflow = readFileSync(workflowPath, 'utf8');
const lines = workflow.split(/\r?\n/);

const actionLine = lines.findIndex((line) => line.includes('uses: appleboy/ssh-action@v1.0.3'));
assert.notEqual(actionLine, -1, 'pinned SSH action step is missing');

const nextStep = lines.findIndex((line, index) => index > actionLine && /^\s{6}- name:/.test(line));
const stepEnd = nextStep === -1 ? lines.length : nextStep;
const stepLines = lines.slice(actionLine, stepEnd);
assert.equal(
  stepLines.some((line) => /^\s+script_stop:/.test(line)),
  false,
  'script_stop mutates multiline shell syntax in drone-ssh v1.7.3',
);
assert(stepLines.some((line) => /^\s+envs:\s*EXPECTED_SHA,CRON_SECRET\s*$/.test(line)));

const scriptLine = lines.findIndex(
  (line, index) => index > actionLine && index < stepEnd && /^\s+script:\s*\|\s*$/.test(line),
);
assert.notEqual(scriptLine, -1, 'SSH script block is missing');
const scriptIndent = lines[scriptLine].match(/^\s*/)[0].length + 2;
const scriptLines = [];
for (let index = scriptLine + 1; index < stepEnd; index += 1) {
  const line = lines[index];
  if (line.trim() !== '' && line.match(/^\s*/)[0].length < scriptIndent) break;
  scriptLines.push(line.slice(Math.min(scriptIndent, line.length)));
}

const script = scriptLines.join('\n');
assert(!script.includes('${{'), 'remote script contains an unresolved workflow expression');
assert(script.includes('deploy/run-deploy.sh'), 'remote bootstrap must invoke the versioned deploy runner');
assert(!script.includes('activate-release.sh'), 'activation logic must not remain inline');
assert(!script.includes('npm ci'), 'build logic must not remain inline');

// drone-ssh prefixes exported action env values before sending the script to bash.
const rendered = [
  "export EXPECTED_SHA='aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'",
  "export CRON_SECRET='test-secret-with-escaped-'\"'\"'-quote'",
  script,
].join('\n');
const tempRoot = mkdtempSync(join(tmpdir(), 'ssh-render-'));
const renderedPath = join(tempRoot, 'rendered-remote.sh');
const bash = process.platform === 'win32' && existsSync('C:\\Program Files\\Git\\bin\\bash.exe')
  ? 'C:\\Program Files\\Git\\bin\\bash.exe'
  : 'bash';
try {
  writeFileSync(renderedPath, rendered);
  execFileSync(bash, ['-n', renderedPath], { stdio: 'pipe' });
} catch (error) {
  const numbered = rendered.split('\n').map((line, index) => `${index + 1}: ${line}`).join('\n');
  process.stderr.write(`${error.stderr?.toString() ?? error.message}\n${numbered}\n`);
  throw error;
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}

console.log('PASS rendered SSH payload parses with bash -n');
