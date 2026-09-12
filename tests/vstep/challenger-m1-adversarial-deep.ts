/**
 * Deep Adversarial Attack Suite for VSTEP Test Loader
 * Challenger M1 Iteration 2
 */

import { resolveExamFilePath, loadRawVstepExam, loadVstepExamSafe } from '../../src/lib/vstep-test-loader';

interface AttackCase {
  category: string;
  payload: any;
  expectedResolution: null | string;
  reason: string;
}

const attackVectors: AttackCase[] = [
  // 1. Windows ADS (Alternative Data Streams)
  { category: 'Windows ADS', payload: 'vstep-mock-01::$DATA', expectedResolution: null, reason: 'Contains colon (fails alphanumeric whitelist)' },
  { category: 'Windows ADS', payload: 'vstep-exam-01:stream', expectedResolution: null, reason: 'Contains colon' },

  // 2. Whitespace handling
  { category: 'Whitespace', payload: 'vstep mock 01', expectedResolution: null, reason: 'Interior space rejected' },
  { category: 'Whitespace', payload: 'vstep\tmock\t01', expectedResolution: null, reason: 'Interior tab rejected' },
  { category: 'Whitespace', payload: 'vstep\nmock\n01', expectedResolution: null, reason: 'Interior newline rejected' },
  { category: 'Whitespace', payload: '   ', expectedResolution: null, reason: 'Whitespace-only string rejected' },
  { category: 'Whitespace', payload: 'vstep-exam-01 ', expectedResolution: 'EXISTS', reason: 'Trailing whitespace trimmed safely' },
  { category: 'Whitespace', payload: ' vstep-exam-01', expectedResolution: 'EXISTS', reason: 'Leading whitespace trimmed safely' },

  // 3. Number boundary and formats
  { category: 'Numeric Edge', payload: 'vstep-mock--1', expectedResolution: null, reason: 'Negative number' },
  { category: 'Numeric Edge', payload: 'vstep-mock-1.5', expectedResolution: null, reason: 'Float dot' },
  { category: 'Numeric Edge', payload: 'vstep-mock-0', expectedResolution: null, reason: 'Zero not in 1..23' },
  { category: 'Numeric Edge', payload: 'vstep-mock-00', expectedResolution: null, reason: 'Double zero' },
  { category: 'Numeric Edge', payload: 'vstep-mock-24', expectedResolution: null, reason: 'Beyond 23' },
  { category: 'Numeric Edge', payload: 'vstep-mock-9999', expectedResolution: null, reason: 'Regex matches up to 3 digits only' },
  { category: 'Numeric Edge', payload: 'vstep-mock-100', expectedResolution: null, reason: 'Beyond 23' },

  // 4. Case insensitivity (Safe exams MUST resolve even in uppercase)
  { category: 'Case Insensitivity', payload: 'VSTEP-MOCK-01', expectedResolution: 'EXISTS', reason: 'Case normalized and valid' },
  { category: 'Case Insensitivity', payload: 'Vstep-Exam-23', expectedResolution: 'EXISTS', reason: 'Case normalized and valid' },
  { category: 'Case Insensitivity', payload: 'VSTEP-LISTENING-56', expectedResolution: 'EXISTS', reason: 'Case normalized and valid' },

  // 5. Prototype and Special Objects
  { category: 'Prototype Tampering', payload: '__proto__', expectedResolution: null, reason: 'No regex match' },
  { category: 'Prototype Tampering', payload: 'constructor', expectedResolution: null, reason: 'No regex match' },
  { category: 'Prototype Tampering', payload: 'toString', expectedResolution: null, reason: 'No regex match' },
  { category: 'Non-string Input', payload: null, expectedResolution: null, reason: 'Not a string' },
  { category: 'Non-string Input', payload: undefined, expectedResolution: null, reason: 'Not a string' },
  { category: 'Non-string Input', payload: 12345, expectedResolution: null, reason: 'Not a string' },
  { category: 'Non-string Input', payload: {}, expectedResolution: null, reason: 'Not a string' },
  { category: 'Non-string Input', payload: [], expectedResolution: null, reason: 'Not a string' },

  // 6. Injection & Special characters
  { category: 'Command Injection', payload: 'vstep-mock-01; calc.exe', expectedResolution: null, reason: 'Semicolon and space' },
  { category: 'Command Injection', payload: 'vstep-mock-01`id`', expectedResolution: null, reason: 'Backticks' },
  { category: 'Command Injection', payload: 'vstep-mock-01$(id)', expectedResolution: null, reason: 'Dollar and parens' },
  { category: 'SQL Injection', payload: "vstep-mock-01' OR '1'='1", expectedResolution: null, reason: 'Quotes and spaces' },
  { category: 'XSS Injection', payload: '<script>alert(1)</script>', expectedResolution: null, reason: 'Tags' },
  { category: 'Null Byte Injection', payload: 'vstep-mock-01\0.json', expectedResolution: null, reason: 'Null byte' },
  { category: 'Unicode Bidi Override', payload: 'vstep-mock-\u202e10-exam', expectedResolution: null, reason: 'Non-ASCII chars' },

  // 7. Path Traversal variants
  { category: 'Path Traversal', payload: '..', expectedResolution: null, reason: 'Dot dot' },
  { category: 'Path Traversal', payload: '../', expectedResolution: null, reason: 'Dot dot slash' },
  { category: 'Path Traversal', payload: '..\\', expectedResolution: null, reason: 'Dot dot backslash' },
  { category: 'Path Traversal', payload: '....//', expectedResolution: null, reason: 'Nested traversal' },
  { category: 'Path Traversal', payload: 'vstep-mock-01/../vstep-mock-01', expectedResolution: null, reason: 'Path traversal embedded' },
  { category: 'Path Traversal', payload: 'vstep-mock-01/../../vstep-mock-01', expectedResolution: null, reason: 'Path traversal embedded' },
  { category: 'Path Traversal', payload: 'vstep-mock-01/../../package.json', expectedResolution: null, reason: 'Path traversal embedded' },
  { category: 'Path Traversal', payload: 'tests/vstep-exam-01', expectedResolution: null, reason: 'Subdirectory specification' },
  { category: 'Path Traversal', payload: '/etc/passwd', expectedResolution: null, reason: 'Root path' },
  { category: 'Path Traversal', payload: 'C:\\boot.ini', expectedResolution: null, reason: 'Drive path' },
];

let passed = 0;
let failed = 0;

console.log('⚔️  RUNNING DEEP ADVERSARIAL ATTACK SUITE (40 Attack Vectors)...\n');

for (const vec of attackVectors) {
  const res = resolveExamFilePath(vec.payload);
  let ok = false;
  if (vec.expectedResolution === 'EXISTS') {
    ok = res !== null && typeof res === 'string';
  } else {
    ok = res === null;
  }

  if (ok) {
    passed++;
  } else {
    failed++;
    console.error(`❌ VULNERABILITY FOUND [${vec.category}]: payload: ${JSON.stringify(vec.payload)} -> result: ${res} (expected: ${vec.expectedResolution})`);
  }
}

console.log(`\nResults: ${passed}/${attackVectors.length} vectors successfully defended.`);
if (failed > 0) {
  console.error(`🚨 ${failed} VULNERABILITIES DETECTED!`);
  process.exit(1);
} else {
  console.log(`🛡️ ALL 40 ADVERSARIAL VECTORS DEFEATED WITH 100% SUCCESS.`);
  process.exit(0);
}
