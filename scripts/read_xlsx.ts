import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

const filePath = path.resolve(__dirname, '../../tmp/ngu_phap_tron_doi.xlsx');
console.log('Reading file:', filePath);

if (!fs.existsSync(filePath)) {
  console.error('File does not exist!');
  process.exit(1);
}

const workbook = XLSX.readFile(filePath);
console.log('Sheet names:', workbook.SheetNames);

workbook.SheetNames.forEach(sheetName => {
  const sheet = workbook.Sheets[sheetName];
  let links: { cell: string; text: string; url: string }[] = [];
  
  // Iterate through all cells in the sheet
  for (const cellAddress in sheet) {
    // Skip internal fields starting with !
    if (cellAddress.startsWith('!')) continue;
    
    const cell = sheet[cellAddress];
    if (!cell) continue;
    
    // Check if cell has a hyperlink property
    let url = '';
    if (cell.l && cell.l.Target) {
      url = cell.l.Target;
    } else if (typeof cell.v === 'string' && (cell.v.includes('youtube.com') || cell.v.includes('youtu.be') || cell.v.includes('docs.google.com') || cell.v.includes('drive.google.com'))) {
      url = cell.v;
    }
    
    if (url) {
      links.push({
        cell: cellAddress,
        text: String(cell.v || '').trim(),
        url: url
      });
    }
  }
  
  console.log(`Sheet "${sheetName}": found ${links.length} total links.`);
  if (links.length > 0) {
    // Group links by domains or print first 15 links
    const youtubeLinks = links.filter(l => l.url.includes('youtube.com') || l.url.includes('youtu.be'));
    const driveLinks = links.filter(l => l.url.includes('drive.google.com'));
    const docLinks = links.filter(l => l.url.includes('docs.google.com') && !l.url.includes('docs.google.com/spreadsheets'));
    const otherLinks = links.filter(l => !youtubeLinks.includes(l) && !driveLinks.includes(l) && !docLinks.includes(l));
    
    console.log(`  YouTube links: ${youtubeLinks.length}`);
    console.log(`  Drive links: ${driveLinks.length}`);
    console.log(`  Other links: ${otherLinks.length}`);
    
    if (youtubeLinks.length > 0) {
      console.log('  Sample YouTube links:');
      youtubeLinks.slice(0, 10).forEach(l => {
        console.log(`    [Cell ${l.cell}] (Text: "${l.text}"): ${l.url}`);
      });
    } else if (links.length > 0) {
      console.log('  Sample links:');
      links.slice(0, 10).forEach(l => {
        console.log(`    [Cell ${l.cell}] (Text: "${l.text}"): ${l.url}`);
      });
    }
  }
});
