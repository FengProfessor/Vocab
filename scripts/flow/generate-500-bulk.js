const fs = require('fs');
const path = require('path');

const roadmapPath = path.resolve(__dirname, '../../src/data/roadmap/vocab-stages-v1.json');
const roadmap = JSON.parse(fs.readFileSync(roadmapPath, 'utf-8'));
const stage1 = roadmap.stages[0];

const allWords = [];
for (const topic of stage1.topics) {
  for (const w of topic.words) {
    allWords.push({
      topicId: topic.id,
      topicTitle: topic.title,
      ...w
    });
    if (allWords.length >= 500) break;
  }
  if (allWords.length >= 500) break;
}

console.log(`Collected ${allWords.length} words from Stage 1 topics.`);

const lines = allWords.map((item, idx) => {
  const stt = idx + 1;
  const word = item.word;
  let ex = item.example ? item.example.replace(/[\r\n]+/g, ' ').trim() : '';
  if (ex.includes('I use ' + word) || ex.length < 6) {
    ex = item.meaningVi ? `expressive scene showing ${word} (${item.meaningVi})` : `memorable scene of ${word}`;
  }
  return `${stt} | ${word} | ${ex}`;
});

const outDir = path.resolve(__dirname, '../../tmp/flow');
fs.mkdirSync(outDir, { recursive: true });

const txtPath = path.join(outDir, 'vocab_500_bulk.txt');
fs.writeFileSync(txtPath, lines.join('\n'), 'utf-8');
console.log(`Saved TXT to: ${txtPath} (${fs.statSync(txtPath).size} bytes, ${lines.length} lines)`);

// Also save CSV for direct spreadsheet / upload support
const csvLines = ['STT,Word,Prompt'];
allWords.forEach((item, idx) => {
  const stt = idx + 1;
  const word = item.word;
  let ex = item.example ? item.example.replace(/[\r\n"]+/g, ' ').trim() : '';
  if (ex.includes('I use ' + word) || ex.length < 6) {
    ex = item.meaningVi ? `expressive scene showing ${word} (${item.meaningVi})` : `memorable scene of ${word}`;
  }
  csvLines.push(`${stt},"${word}","${ex.replace(/"/g, '""')}"`);
});

const csvPath = path.join(outDir, 'vocab_500_bulk.csv');
fs.writeFileSync(csvPath, csvLines.join('\n'), 'utf-8');
console.log(`Saved CSV to: ${csvPath} (${fs.statSync(csvPath).size} bytes, ${csvLines.length} lines)`);
