import AdmZip from 'adm-zip';
import * as cheerio from 'cheerio';
import type { AnyNode, Element } from 'domhandler';
import ExcelJS from 'exceljs';
import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import {
  parsePastedVocabText,
  parseStructuredVocabRows,
  type VocabParseResult,
} from '@/lib/teacher-vocab-import';

const TEMPLATE_HEADERS = [
  'STT',
  'Từ vựng (Word)',
  'Phiên âm (IPA)',
  'Từ loại',
  'Nghĩa tiếng Việt',
  'Family Word (Họ từ - tham khảo)',
  'Ghi chú / Cấu trúc',
];

const TEMPLATE_SAMPLE_ROWS = [
  [
    '1',
    'Antibiotic',
    '/ˌæntɪbaɪˈɒtɪk/',
    'n, adj',
    '- (n) Thuốc kháng sinh - (adj) Có tính kháng sinh',
    '• Antibacterial (adj): kháng khuẩn',
    '',
  ],
  [
    '2',
    'Cut down on',
    '/ˌkʌt ˈdaʊn ɒn/',
    'phr v',
    'Cắt giảm (lượng tiêu thụ...)',
    '—',
    '• Cut down on sugar/fat: cắt giảm đường/chất béo',
  ],
  [
    '3',
    'Balanced',
    '/ˈbælənst/',
    'adj',
    'Cân đối, có sự cân bằng (chế độ ăn...)',
    '• Balance (n, v)\n• Unbalanced (adj): mất cân đối',
    '',
  ],
];

function getLocalTagName(node: AnyNode): string {
  if (node.type !== 'tag') return '';
  const name = (node as Element).name || '';
  const idx = name.indexOf(':');
  return idx >= 0 ? name.slice(idx + 1).toLowerCase() : name.toLowerCase();
}

function collectParagraphText(node: AnyNode): string {
  let out = '';
  const walk = (n: AnyNode) => {
    if (n.type === 'text') return;
    if (n.type !== 'tag') return;
    const tag = getLocalTagName(n);
    if (tag === 't' || tag === 'deltext' || tag === 'instrtext') {
      for (const child of n.children || []) {
        if (child.type === 'text') {
          out += child.data;
        }
      }
      return;
    }
    if (tag === 'tab') {
      out += ' ';
      return;
    }
    if (tag === 'br' || tag === 'cr') {
      out += '\n';
      return;
    }
    for (const child of n.children || []) {
      walk(child);
    }
  };
  walk(node);
  return out.replace(/[ \t]+\n/g, '\n').replace(/\n[ \t]+/g, '\n').trim();
}

function findBodyElement($: cheerio.CheerioAPI): Element | null {
  let bodyEl: Element | null = null;
  $('*').each((_, el) => {
    if (getLocalTagName(el) === 'body') {
      bodyEl = el as Element;
      return false;
    }
    return undefined;
  });
  return bodyEl;
}

function extractTableRows(tableEl: Element): string[][] {
  const rows: string[][] = [];
  for (const child of tableEl.children || []) {
    if (getLocalTagName(child) !== 'tr') continue;
    const rowCells: string[] = [];
    for (const cellNode of (child as Element).children || []) {
      if (getLocalTagName(cellNode) !== 'tc') continue;
      const paragraphs: string[] = [];
      for (const pNode of (cellNode as Element).children || []) {
        if (getLocalTagName(pNode) === 'p') {
          const txt = collectParagraphText(pNode);
          if (txt) paragraphs.push(txt);
        } else if (getLocalTagName(pNode) === 'tbl') {
          // Nested table fallback: flatten text
          const nested = extractTableRows(pNode as Element);
          for (const nr of nested) {
            const joined = nr.filter(Boolean).join(' ');
            if (joined) paragraphs.push(joined);
          }
        }
      }
      rowCells.push(paragraphs.join('\n').trim());
    }
    if (rowCells.some((c) => c !== '')) {
      rows.push(rowCells);
    }
  }
  return rows;
}

/**
 * Đọc file Word (.docx) ở phía server bằng adm-zip + cheerio XML mode.
 * Giữ nguyên thứ tự các tiêu đề phần (paragraph) ngay trước từng bảng (table).
 */
export function parseDocxBuffer(buffer: Buffer): VocabParseResult {
  let zip: AdmZip;
  try {
    zip = new AdmZip(buffer);
  } catch {
    throw new Error('Không thể giải nén file .docx. Vui lòng kiểm tra file Word hợp lệ (định dạng .docx, không phải .doc cũ).');
  }

  const docEntry = zip.getEntry('word/document.xml');
  if (!docEntry) {
    throw new Error('File .docx thiếu nội dung word/document.xml. Nếu là file .doc cũ, vui lòng mở bằng Word và Save As (.docx).');
  }

  const xml = docEntry.getData().toString('utf8');
  const $ = cheerio.load(xml, { xmlMode: true });
  const bodyEl = findBodyElement($);
  if (!bodyEl) {
    throw new Error('Không đọc được cấu trúc nội dung trong file Word (.docx).');
  }

  const tables: Array<{ section?: string; rows: string[][] }> = [];
  const allParagraphs: string[] = [];
  let pendingSection = '';

  for (const child of bodyEl.children || []) {
    const tag = getLocalTagName(child);
    if (tag === 'p') {
      const pText = collectParagraphText(child);
      if (pText) {
        allParagraphs.push(pText);
        if (
          pText.length >= 5 &&
          pText.length <= 160 &&
          !/^[.,;:!?]+$/.test(pText) &&
          !/^(?:lưu ý|chú ý|note)\s*:/i.test(pText)
        ) {
          pendingSection = pText;
        }
      }
    } else if (tag === 'tbl') {
      const rows = extractTableRows(child as Element);
      if (rows.length > 0) {
        tables.push({ section: pendingSection, rows });
        pendingSection = '';
      }
    }
  }

  if (tables.length > 0) {
    return parseStructuredVocabRows(tables, 'docx_table');
  }

  return parsePastedVocabText(allParagraphs.join('\n'));
}

function excelCellToText(v: unknown): string {
  if (v == null) return '';
  if (v instanceof Date) {
    return v.toISOString().split('T')[0];
  }
  if (typeof v === 'object') {
    const obj = v as Record<string, unknown>;
    if (Array.isArray(obj.richText)) {
      return (obj.richText as Array<{ text?: string }>)
        .map((part) => part.text ?? '')
        .join('')
        .trim();
    }
    if (typeof obj.text === 'string') {
      return obj.text.trim();
    }
    if ('result' in obj) {
      return obj.result == null ? '' : String(obj.result).trim();
    }
    return String(v).trim();
  }
  return String(v).trim();
}

/**
 * Đọc file Excel (.xlsx) ở phía server bằng exceljs.
 */
export async function parseXlsxBuffer(buffer: Buffer): Promise<VocabParseResult> {
  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.load(buffer as unknown as Parameters<typeof wb.xlsx.load>[0]);
  } catch {
    throw new Error('Không thể đọc file Excel (.xlsx). Vui lòng kiểm tra lại định dạng file.');
  }

  const tables: Array<{ section?: string; rows: string[][] }> = [];
  for (const ws of wb.worksheets) {
    const rows: string[][] = [];
    ws.eachRow({ includeEmpty: false }, (row) => {
      const cells: string[] = [];
      for (let colIdx = 1; colIdx <= row.cellCount; colIdx++) {
        cells.push(excelCellToText(row.getCell(colIdx).value));
      }
      if (cells.some((c) => c !== '')) {
        rows.push(cells);
      }
    });
    if (rows.length > 0) {
      tables.push({ section: '', rows });
    }
  }

  return parseStructuredVocabRows(tables, 'spreadsheet');
}

/**
 * Tạo file Excel mẫu (.xlsx) chuẩn cho giáo viên tải về.
 */
export async function buildExcelTemplateBuffer(): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Tu vung');

  ws.columns = [
    { width: 6 },
    { width: 22 },
    { width: 20 },
    { width: 12 },
    { width: 36 },
    { width: 38 },
    { width: 38 },
  ];

  const sectionRow = ws.addRow(['1. Từ vựng trọng tâm (Mẫu nhập LingoPro — sửa hoặc thêm dòng bên dưới)']);
  sectionRow.font = { bold: true, size: 12 };
  ws.mergeCells('A1:G1');

  const headerRow = ws.addRow(TEMPLATE_HEADERS);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
  });

  for (const sample of TEMPLATE_SAMPLE_ROWS) {
    const row = ws.addRow(sample);
    row.eachCell((cell) => {
      cell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
    });
  }

  const out = await wb.xlsx.writeBuffer();
  return Buffer.from(out);
}

/**
 * Tạo file Word mẫu (.docx) chuẩn cho giáo viên tải về.
 */
export async function buildDocxTemplateBuffer(): Promise<Buffer> {
  const makeCell = (text: string, isHeader = false) =>
    new TableCell({
      children: (text || '')
        .split('\n')
        .map(
          (line) =>
            new Paragraph({
              children: [
                new TextRun({
                  text: line,
                  bold: isHeader,
                  size: isHeader ? 20 : 19,
                }),
              ],
            }),
        ),
    });

  const headerTableRow = new TableRow({
    tableHeader: true,
    children: TEMPLATE_HEADERS.map((h) => makeCell(h, true)),
  });

  const dataRows = TEMPLATE_SAMPLE_ROWS.map(
    (r) =>
      new TableRow({
        children: r.map((cellVal) => makeCell(cellVal, false)),
      }),
  );

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: '1. Từ vựng trọng tâm (Mẫu nhập LingoPro)',
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Lưu ý: Cột Family Word và Ghi chú sẽ hiển thị cho học sinh xem tham khảo, không bắt buộc học thuộc hoặc kiểm tra.',
                italics: true,
                size: 18,
              }),
            ],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [headerTableRow, ...dataRows],
          }),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}
