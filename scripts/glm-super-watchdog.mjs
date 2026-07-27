/**
 * Super-watchdog: never exits. Every 60s ensure glm-burn-parent is alive.
 * Start once with: node scripts/glm-super-watchdog.mjs
 * Detach: start /B node scripts/glm-super-watchdog.mjs
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const logDir = path.join(root, 'scripts', 'logs');
const superLog = path.join(logDir, 'super-watchdog.log');
const pidFile = path.join(logDir, 'parent.pid');
const parentScript = path.join(root, 'scripts', 'glm-burn-parent.mjs');

fs.mkdirSync(logDir, { recursive: true });

function slog(msg) {
  const line = `${new Date().toISOString()} ${msg}`;
  console.log(line);
  try {
    fs.appendFileSync(superLog, `${line}\n`);
  } catch {
    /* ignore */
  }
}

function isPidAlive(pid) {
  if (!pid || !Number.isFinite(pid)) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function readParentPid() {
  try {
    const t = fs.readFileSync(pidFile, 'utf8').trim();
    const n = parseInt(t, 10);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function findParentViaWmic() {
  try {
    const out = execSync(
      'wmic process where "name=\'node.exe\'" get ProcessId,CommandLine /FORMAT:CSV',
      { encoding: 'utf8', windowsHide: true, timeout: 15000 }
    );
    for (const line of out.split(/\r?\n/)) {
      if (line.includes('glm-burn-parent')) {
        const parts = line.split(',');
        const pid = parseInt(parts[parts.length - 1], 10);
        if (Number.isFinite(pid)) return pid;
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

function workersFreshCount() {
  let n = 0;
  const now = Date.now();
  for (let i = 0; i < 3; i++) {
    try {
      const st = fs.statSync(path.join(logDir, `forever-w${i}.log`));
      if (now - st.mtimeMs < 8 * 60 * 1000) n++;
    } catch {
      /* ignore */
    }
  }
  return n;
}

function startParent() {
  slog('starting glm-burn-parent');
  const child = spawn(process.execPath, [parentScript], {
    cwd: root,
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
    env: process.env,
  });
  child.unref();
  if (child.pid) {
    try {
      fs.writeFileSync(pidFile, String(child.pid), 'utf8');
    } catch {
      /* ignore */
    }
    slog(`started parent pid=${child.pid}`);
  } else {
    slog('start parent: no pid');
  }
}

function ensure() {
  let pid = readParentPid();
  if (!isPidAlive(pid)) {
    pid = findParentViaWmic();
  }
  const fresh = workersFreshCount();

  if (pid && isPidAlive(pid) && fresh >= 1) {
    slog(`OK parent=${pid} freshWorkers=${fresh}`);
    return;
  }

  if (pid && isPidAlive(pid) && fresh === 0) {
    slog(`STALE parent=${pid} - kill and restart`);
    try {
      process.kill(pid, 'SIGTERM');
    } catch {
      try {
        execSync(`taskkill /PID ${pid} /T /F`, { windowsHide: true });
      } catch {
        /* ignore */
      }
    }
    // brief wait then start
    setTimeout(startParent, 2000);
    return;
  }

  slog('DEAD parent - start');
  startParent();
}

slog(`=== SUPER WATCHDOG START pid=${process.pid} ===`);
ensure();
setInterval(ensure, 60_000);

// keep alive
setInterval(() => {
  slog(`super-heartbeat pid=${process.pid}`);
}, 120_000);
