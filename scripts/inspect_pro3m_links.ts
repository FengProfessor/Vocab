import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

const filePath = path.resolve(__dirname, '../../tmp/ngu_phap_tron_doi.xlsx');
const workbook = XLSX.readFile(filePath);
const sheetName = 'FLASHCARD ONLINE PRO3M';
const sheet = workbook.Sheets[sheetName];

let links: { cell: string; text: string; url: string }[] = [];

for (const cellAddress in sheet) {
  if (cellAddress.startsWith('!')) continue;
  
  const cell = sheet[cellAddress];
  if (!cell) continue;
  
  let url = '';
  if (cell.l && cell.l.Target) {
    url = cell.l.Target;
  } else if (typeof cell.v === 'string' && (cell.v.includes('http://') || cell.v.includes('https://'))) {
    url = cell.v;
  }
  
  if (url) {
    let cleanUrl = url;
    if (url.includes('google.com/url?q=')) {
      try {
        const urlObj = new URL(url);
        cleanUrl = urlObj.searchParams.get('q') || url;
      } catch (e) {}
    }
    
    // Find nearby text in the same row
    const match = cellAddress.match(/^([A-Z]+)([0-9]+)$/);
    let title = '';
    if (match) {
      const col = match[1];
      const row = match[2];
      // Get cell to the left
      const prevColChar = String.fromCharCode(col.charCodeAt(0) - 1);
      const prevCell = sheet[`${prevColChar}${row}`];
      if (prevCell && prevCell.v) {
        title = String(prevCell.v);
      }
    }
    
    links.push({
      cell: cellAddress,
      text: title,
      url: cleanUrl
    });
  }
}

console.log(`Total links in sheet: ${links.length}`);
links.slice(0, 15).forEach(l => {
  console.log(`  Cell ${l.cell} (Left text: "${l.text}") -> URL: ${l.url}`);
});
