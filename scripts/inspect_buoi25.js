const fs = require('fs');

const html = fs.readFileSync('D:/Vibe/Vocab/bai-giang/25-chuyen-de-np-thpt/buoi/buoi25/01-Phieu-Hoc-Tap-Buoi25.html', 'utf8');
console.log('bay matches in Buoi 25 HTML:', html.match(/class=["']bay["']/gi));

const md = fs.readFileSync('D:/Vibe/Vocab/bai-giang/25-chuyen-de-np-thpt/buoi/buoi25/03-Giao-An-Buoi25.md', 'utf8');
const lines = md.split('\n');
lines.forEach((l, i) => {
  if (/bẫy/i.test(l)) {
    console.log(`L${i+1}:`, l.slice(0, 100));
  }
});
