/**
 * Fixture to empirically test process lifecycle rollback hooks in empirical-mutation-challenge.ts
 */
import fs from 'node:fs';
import path from 'node:path';

// Load challenge module to populate in-memory pristineBuffers and register lifecycle hooks
import './empirical-mutation-challenge';

const mode = process.argv[2] || 'uncaught';
const targetFile = path.resolve(__dirname, '../../src/lib/grammar-exercises.ts');

// Deliberately write corrupted content to monitored file
fs.writeFileSync(targetFile, `/* ADVERSARIAL DISK POLLUTION IN MODE: ${mode} */\n`);

if (mode === 'uncaught') {
  throw new Error('SIMULATED_UNCAUGHT_EXCEPTION_CRASH');
} else if (mode === 'sigint') {
  process.emit('SIGINT');
} else if (mode === 'sigterm') {
  process.emit('SIGTERM');
} else if (mode === 'exit') {
  process.exit(0);
} else {
  throw new Error(`Unknown mode: ${mode}`);
}
