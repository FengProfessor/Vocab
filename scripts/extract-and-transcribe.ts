import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

const filePath = path.resolve(__dirname, '../../tmp/ngu_phap_tron_doi.xlsx');
const outputJsonPath = path.resolve(__dirname, '../../tmp/extracted_youtube_links.json');

console.log('Reading file:', filePath);

if (!fs.existsSync(filePath)) {
  console.error('File does not exist!');
  process.exit(1);
}

const workbook = XLSX.readFile(filePath);
const allData: { [sheetName: string]: { cell: string; title: string; youtubeUrl: string }[] } = {};
let grandTotal = 0;

workbook.SheetNames.forEach(sheetName => {
  const sheet = workbook.Sheets[sheetName];
  const items: { cell: string; title: string; youtubeUrl: string }[] = [];
  
  for (const cellAddress in sheet) {
    if (cellAddress.startsWith('!')) continue;
    
    const cell = sheet[cellAddress];
    if (!cell) continue;
    
    let url = '';
    if (cell.l && cell.l.Target) {
      url = cell.l.Target;
    } else if (typeof cell.v === 'string' && (cell.v.includes('youtube.com') || cell.v.includes('youtu.be'))) {
      url = cell.v;
    }
    
    if (url) {
      // Decode Google URL redirects if present
      let cleanUrl = url;
      try {
        if (url.includes('google.com/url?q=')) {
          const urlObj = new URL(url);
          const qParam = urlObj.searchParams.get('q');
          if (qParam) {
            cleanUrl = qParam;
          }
        }
      } catch (err) {
        // Fallback to original url
      }
      
      // Keep only YouTube links
      if (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be')) {
        // Try to find the title of the row/video. Usually it is in the same row, in column B or a nearby cell.
        // Let's find the row number
        const match = cellAddress.match(/^([A-Z]+)([0-9]+)$/);
        let title = '';
        if (match) {
          const colStr = match[1];
          const rowNum = match[2];
          
          // Look left from the current cell column to find the first non-empty cell that is not "LINK" or "BÀI GIẢNG"
          let colCharCode = colStr.charCodeAt(0);
          while (colCharCode > 65) { // Stop at column A (65)
            colCharCode--;
            const checkColChar = String.fromCharCode(colCharCode);
            const checkCell = sheet[`${checkColChar}${rowNum}`];
            if (checkCell && checkCell.v) {
              const valStr = String(checkCell.v).trim();
              if (valStr && valStr.toUpperCase() !== 'LINK' && valStr.toUpperCase() !== 'BÀI GIẢNG') {
                title = valStr;
                break;
              }
            }
          }
          
          // If still no title found, fallback to B or A
          if (!title) {
            const titleCell = sheet[`B${rowNum}`];
            if (titleCell && titleCell.v) {
              title = String(titleCell.v).trim();
            } else {
              const colACell = sheet[`A${rowNum}`];
              if (colACell && colACell.v) {
                title = String(colACell.v).trim();
              }
            }
          }
        }
        
        items.push({
          cell: cellAddress,
          title: title || 'Untitled Video',
          youtubeUrl: cleanUrl
        });
      }
    }
  }
  
  if (items.length > 0) {
    allData[sheetName] = items;
    grandTotal += items.length;
    console.log(`Sheet "${sheetName}": Extracted ${items.length} YouTube links.`);
  }
});

console.log(`Grand Total YouTube Links Extracted: ${grandTotal}`);

// Create tmp folder if not exists
const tmpDir = path.dirname(outputJsonPath);
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
}

fs.writeFileSync(outputJsonPath, JSON.stringify(allData, null, 2), 'utf-8');
console.log('Saved extracted YouTube links to:', outputJsonPath);
