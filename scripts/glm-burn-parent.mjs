/**
 * Parent: spawn forever workers (OpenRouter free by default).
 * ALWAYS restart on death (except hard quota exit 42).
 * node scripts/glm-burn-parent.mjs
 *
 * Env:
 *   CORE_SENSES_PROVIDER=openrouter|glm
 *   BURN_SHARDS=2
 *   BURN_DELAY_MS=1200
 *   BURN_LIMIT=80
 *   OPENROUTER_MODEL=openrouter/free
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(root, '.env.local') });

const logDir = path.join(root, 'scripts', 'logs');
fs.mkdirSync(logDir, { recursive: true });

const parentLog = path.join(logDir, 'parent.log');
const pidFile = path.join(logDir, 'parent.pid');

const PROVIDER = (process.env.CORE_SENSES_PROVIDER || 'openrouter').toLowerCase();
const SHARDS = Math.max(1, parseInt(process.env.BURN_SHARDS || '2', 10) || 2);
const DELAY_MS = Math.max(200, parseInt(process.env.BURN_DELAY_MS || '1200', 10) || 1200);
const LIMIT = Math.max(10, parseInt(process.env.BURN_LIMIT || '80', 10) || 80);
const MODEL = process.env.OPENROUTER_MODEL || 'openrouter/free';

const children = new Map();
const deadShards = new Set();
let stopping = false;

function plog(msg) {
  const line = `${new Date().toISOString()} ${msg}`;
  console.log(line);
  try {
    fs.appendFileSync(parentLog, `${line}\n`);
  } catch {
    /* ignore */
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function writePid() {
  try {
    fs.writeFileSync(pidFile, String(process.pid), 'utf8');
  } catch {
    /* ignore */
  }
}

function spawnWorker(shard) {
  if (stopping || deadShards.has(shard)) return null;

  const logPath = path.join(logDir, `forever-w${shard}.log`);
  let outFd;
  try {
    outFd = fs.openSync(logPath, 'a');
    fs.writeSync(
      outFd,
      `\n===== worker spawn ${new Date().toISOString()} shard=${shard} provider=${PROVIDER} =====\n`,
    );
  } catch (e) {
    plog(`log open fail shard=${shard}: ${e.message}`);
    scheduleRestart(shard, 30_000);
    return null;
  }

  const modelArg = PROVIDER === 'openrouter' ? ` --model=${MODEL}` : '';
  const cmdline = `npx tsx scripts/backfill-core-senses-glm.ts --provider=${PROVIDER}${modelArg} --forever --limit=${LIMIT} --delay=${DELAY_MS} --shard=${shard}/${SHARDS}`;

  let child;
  try {
    child = spawn('cmd.exe', ['/d', '/s', '/c', cmdline], {
      cwd: root,
      env: {
        ...process.env,
        GLM_BACKFILL_LOG: logPath,
        CORE_SENSES_PROVIDER: PROVIDER,
        OPENROUTER_MODEL: MODEL,
      },
      stdio: ['ignore', outFd, outFd],
      windowsHide: true,
    });
  } catch (e) {
    plog(`spawn fail shard=${shard}: ${e.message}`);
    try {
      fs.closeSync(outFd);
    } catch {
      /* ignore */
    }
    scheduleRestart(shard, 30_000);
    return null;
  }

  plog(`spawn shard=${shard} pid=${child.pid} provider=${PROVIDER}`);
  children.set(shard, { child, outFd });

  child.on('exit', (code, signal) => {
    plog(`exit shard=${shard} code=${code} signal=${signal}`);
    try {
      fs.closeSync(outFd);
    } catch {
      /* ignore */
    }
    children.delete(shard);

    if (code === 42) {
      plog(`shard=${shard} HARD QUOTA stop`);
      deadShards.add(shard);
      return;
    }
    // crash / rate-limit exit → wait longer before restart (avoid thrash)
    const wait = code === 0 ? 45_000 : 60_000;
    scheduleRestart(shard, wait);
  });

  child.on('error', (err) => {
    plog(`error shard=${shard}: ${err.message}`);
  });

  return child;
}

function scheduleRestart(shard, wait) {
  if (stopping) return;
  plog(`shard=${shard} restart in ${Math.round(wait / 1000)}s`);
  setTimeout(() => {
    if (stopping || deadShards.has(shard)) return;
    if (children.has(shard)) return;
    spawnWorker(shard);
  }, wait);
}

function shutdown() {
  stopping = true;
  plog('shutdown');
  for (const { child } of children.values()) {
    try {
      child.kill();
    } catch {
      /* ignore */
    }
  }
  try {
    fs.unlinkSync(pidFile);
  } catch {
    /* ignore */
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

setInterval(() => {
  writePid();
  const alive = [...children.keys()];
  plog(
    `heartbeat alive=[${alive.join(',')}] quota=[${[...deadShards].join(',')}] provider=${PROVIDER} pid=${process.pid}`,
  );
}, 45_000);

async function main() {
  writePid();
  plog('=== PARENT START ===');
  plog(`root=${root} pid=${process.pid} provider=${PROVIDER} shards=${SHARDS} delay=${DELAY_MS} model=${MODEL}`);

  for (let s = 0; s < SHARDS; s++) {
    spawnWorker(s);
    await sleep(4000);
  }
  plog('all shards up — parent event loop forever');
  await new Promise(() => {});
}

main().catch((e) => {
  plog(`fatal ${e?.stack || e}`);
  process.exit(1);
});
