/**
 * Adapter đọc file Anki .apkg (zip chứa SQLite database).
 * Mỗi note có nhiều field phân cách bởi ký tự \x1f — quy ước field[0] = word,
 * field[1] = definition. Đặt file .apkg trong scripts/scrapers/decks/.
 */
import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import initSqlJs from 'sql.js';
import type { RawEntry } from '../core/normalizer';

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function scrapeApkg(filePath: string): Promise<RawEntry[]> {
  if (!fs.existsSync(filePath)) {
    console.warn('[Anki] File không tồn tại:', filePath);
    return [];
  }

  const zip = new AdmZip(filePath);
  const entries = zip.getEntries();
  // Anki dùng collection.anki21 (định dạng mới) hoặc collection.anki2
  const dbEntry =
    entries.find((e) => e.entryName === 'collection.anki21') ||
    entries.find((e) => e.entryName === 'collection.anki2');
  if (!dbEntry) {
    console.warn('[Anki] Không tìm thấy collection SQLite trong:', filePath);
    return [];
  }

  const SQL = await initSqlJs({
    locateFile: (file: string) => path.join(process.cwd(), 'node_modules/sql.js/dist', file),
  });
  const db = new SQL.Database(dbEntry.getData());

  let rows: unknown[][] = [];
  try {
    const res = db.exec('SELECT flds FROM notes');
    rows = res.length ? res[0].values : [];
  } finally {
    db.close();
  }

  const out: RawEntry[] = [];
  for (const row of rows) {
    const fields = String(row[0] || '')
      .split('\x1f')
      .map((f) => stripHtml(f));
    const word = fields[0];
    const definition = fields[1] || '';
    if (!word) continue;
    out.push({ word, meanings: definition ? [{ definition }] : [] });
  }
  return out;
}
