const fs = require('fs');
const path = require('path');

// 1. Load all listening items from ETS 2024 and ETS 2026
const allListening = [];
['2024', '2026'].forEach(year => {
  const dir = path.join(__dirname, '../src/data/toeic/datasets/ets_' + year);
  fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort().forEach(f => {
    const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    const testId = data.testId || f.replace('.json', '');
    data.questions.forEach(q => {
      if (q.part <= 4 || q.section === 'listening') {
        const text = ((q.transcript || '') + ' ' + (q.explanationVi || '')).split(/DỊCH/i)[0];
        if (text) allListening.push({ year, testId, qNum: q.questionNumber, part: q.part, text });
      }
    });
  });
});

function getCitation(pattern) {
  const re = new RegExp(pattern, 'i');
  let fallback = null;
  for (const item of allListening) {
    if (re.test(item.text)) {
      const c = item.testId.toUpperCase().replace(/_/g, '-') + ' Q' + item.qNum;
      if (item.year === '2026') return c; // Prefer 2026
      if (!fallback) fallback = c;
    }
  }
  return fallback || 'ETS-2026-01 Q1';
}

module.exports = { allListening, getCitation };
