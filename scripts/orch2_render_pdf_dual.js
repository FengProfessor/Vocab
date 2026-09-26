#!/usr/bin/env node
/**
 * orch2_render_pdf_dual.js
 * ========================
 * Node.js entry point / CLI wrapper for the Dual PDF Generator Engine.
 * Supports rendering synchronized Teleprompter Script PDF (A4 Portrait)
 * and Slide Deck PDF (16:9 Landscape 1920x1080) for the TOEIC 20-min curriculum.
 *
 * Usage:
 *   node orch2_render_pdf_dual.js --representative
 *   node orch2_render_pdf_dual.js --lesson 16
 *   node orch2_render_pdf_dual.js --verify
 */

const { spawn } = require('child_process');
const path = require('path');

const scriptPath = path.join(__dirname, 'orch2_render_pdf_dual.py');
const args = process.argv.slice(2);

const pyProcess = spawn('python', [scriptPath, ...args], {
    stdio: 'inherit',
    shell: true
});

pyProcess.on('exit', (code) => {
    process.exit(code || 0);
});
