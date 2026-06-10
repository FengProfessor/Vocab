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
const sheetName = 'FLASHCARD ONLINE PRO3M';
const sheet = workbook.Sheets[sheetName];

if (!sheet) {
  console.error(`Sheet "${sheetName}" not found!`);
  process.exit(1);
}

// Convert first 15 rows of the sheet to JSON array
const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
console.log(`Total rows in sheet "${sheetName}": ${rawData.length}`);
console.log('First 15 rows:');
rawData.slice(0, 15).forEach((row, idx) => {
  console.log(`Row ${idx + 1}:`, row);
});
