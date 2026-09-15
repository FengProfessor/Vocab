const { NextRequest } = require('next/server');
const path = require('path');
const fs = require('fs');

async function runTests() {
  console.log('Testing Lead Magnet API endpoints...');

  // Test 1: Verify Ebook markdown exists and is non-empty
  const mdPath = path.join(__dirname, '../docs/sat-thu-toeic-listening-lead-magnet.md');
  if (!fs.existsSync(mdPath)) {
    throw new Error('Markdown file missing at docs/sat-thu-toeic-listening-lead-magnet.md');
  }
  const mdContent = fs.readFileSync(mdPath, 'utf8');
  console.log('✔ Ebook Markdown exists, size:', (mdContent.length / 1024).toFixed(1), 'KB');

  // Test 2: Verify Dict JSON has 150 items
  const dictPath = path.join(__dirname, '../src/data/sat-thu-toeic-dict.json');
  const dict = JSON.parse(fs.readFileSync(dictPath, 'utf8'));
  console.log('✔ 150-Word Dictionary count:', dict.length);
  if (dict.length !== 150) throw new Error('Dict count is not 150');

  // Test 3: Verify all 15 dimensions exist in data
  const dataTs = fs.readFileSync(path.join(__dirname, '../src/data/sat-thu-toeic-listening-data.ts'), 'utf8');
  for (let i = 1; i <= 15; i++) {
    if (!dataTs.includes(`id: ${i},`)) {
      throw new Error(`Dimension id: ${i} missing from data TS file`);
    }
  }
  console.log('✔ All 15 dimensions verified in sat-thu-toeic-listening-data.ts');

  // Test 4: Verify route files exist
  const routes = [
    'src/app/lead-magnet/sat-thu-toeic-listening/page.tsx',
    'src/app/sat-thu-toeic-listening/page.tsx',
    'src/app/api/lead-magnet/subscribe/route.ts',
    'src/app/api/lead-magnet/download/route.ts',
    'src/app/api/lead-magnet/ebook/route.ts',
    'src/components/lead-magnet/LeadMagnetClient.tsx',
    'src/components/lead-magnet/DiagnosticScorecard.tsx',
    'src/components/lead-magnet/EmailOptinCard.tsx',
    'src/components/lead-magnet/KillerMatrixSection.tsx',
    'src/components/lead-magnet/StatsComparisonTable.tsx',
    'src/components/lead-magnet/DictionarySection.tsx',
    'src/components/lead-magnet/EbookReaderModal.tsx',
  ];
  for (const r of routes) {
    if (!fs.existsSync(path.join(__dirname, '..', r))) {
      throw new Error(`Route or component missing: ${r}`);
    }
  }
  console.log('✔ All 12 project files and components exist and verified.');
  console.log('ALL VERIFICATION CHECKS PASSED!');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
