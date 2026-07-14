/**
 * Xuất PDF chủ đề / unit thư viện (toàn bộ pack, không chỉ 1 chặng).
 * Cách: HTML A4 branded → cửa sổ in → "Lưu thành PDF" (desktop + mobile).
 * Watermark nhẹ: 1 dải chéo mờ + góc + footer (không lưới chéo dày).
 * Nội dung: từ · dạng từ · nghĩa VI · ví dụ EN (từ global_dictionary).
 */

export interface WordGloss {
  pos?: string;
  definition?: string;
  example?: string;
  ipa?: string;
}

export interface PdfWordRow {
  word: string;
  pos?: string;
  definition?: string;
  example?: string;
  ipa?: string;
}

export interface PdfPack {
  title: string;
  /** Legacy: chỉ list string — PDF vẫn chạy, cột nghĩa trống */
  words: Array<string | PdfWordRow>;
}

export interface TopicPdfInput {
  routeTitle: string;
  routeIcon?: string;
  topicTitle: string;
  /** Unit / subtopic */
  unitTitle: string;
  packs: PdfPack[];
  cefrLabel?: string | null;
  /** URL app — mặc định origin */
  siteUrl?: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function slugify(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

function normalizeRow(item: string | PdfWordRow): PdfWordRow {
  if (typeof item === 'string') return { word: item };
  return {
    word: item.word,
    pos: item.pos?.trim() || '',
    definition: item.definition?.trim() || '',
    example: item.example?.trim() || '',
    ipa: item.ipa?.trim().replace(/^\/+|\/+$/g, '') || '',
  };
}

function formatIpa(ipa?: string): string {
  const s = (ipa ?? '').trim().replace(/^\/+|\/+$/g, '');
  return s ? `/${s}/` : '';
}

/** Gắn gloss map vào packs (giữ thứ tự từ). */
export function applyGlossesToPacks(
  packs: { title: string; words: string[] }[],
  glosses: Record<string, WordGloss>,
): PdfPack[] {
  return packs.map((p) => ({
    title: p.title,
    words: p.words.map((w) => {
      const g = glosses[w.toLowerCase()] ?? glosses[w];
      return {
        word: w,
        pos: g?.pos ?? '',
        definition: g?.definition ?? '',
        example: g?.example ?? '',
        ipa: g?.ipa ?? '',
      };
    }),
  }));
}

export function buildTopicPdfHtml(input: TopicPdfInput): string {
  const site = (input.siteUrl ?? (typeof window !== 'undefined' ? window.location.origin : 'https://lingopro.online')).replace(/\/$/, '');
  const hostLabel = site.replace(/^https?:\/\//, '').replace(/\/$/, '') || 'lingopro.online';
  const logoUrl = `${site}/icons/icon-192.webp`;
  const allRows = input.packs.flatMap((p) => p.words.map(normalizeRow));
  const totalWords = allRows.length;
  const withDef = allRows.filter((r) => r.definition).length;
  const withIpa = allRows.filter((r) => r.ipa).length;
  const date = new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const packBlocks = input.packs
    .map((pack, pi) => {
      const rows = pack.words
        .map((item, wi) => {
          const r = normalizeRow(item);
          const n = wi + 1;
          const ipaText = formatIpa(r.ipa);
          const ipa = ipaText
            ? `<div class="ipa">${escapeHtml(ipaText)}</div>`
            : `<div class="ipa muted">—</div>`;
          const pos = r.pos
            ? `<span class="pos">${escapeHtml(r.pos)}</span>`
            : `<span class="pos muted">—</span>`;
          const def = r.definition
            ? escapeHtml(r.definition)
            : `<span class="muted">…</span>`;
          const ex = r.example
            ? `<em>${escapeHtml(r.example)}</em>`
            : `<span class="muted">—</span>`;
          return `<tr>
            <td class="num">${n}</td>
            <td class="word">
              <div class="lemma">${escapeHtml(r.word)}</div>
              ${ipa}
              ${pos}
            </td>
            <td class="def">${def}</td>
            <td class="ex">${ex}</td>
          </tr>`;
        })
        .join('');
      return `
      <section class="pack ${pi > 0 ? 'pack-break' : ''}">
        <h2>Chặng ${pi + 1} · ${escapeHtml(pack.title)}
          <span class="pill">${pack.words.length} từ</span>
        </h2>
        <table>
          <thead>
            <tr>
              <th class="num">#</th>
              <th class="word">Từ · IPA · dạng</th>
              <th class="def">Nghĩa (VI)</th>
              <th class="ex">Ví dụ (EN)</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </section>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(input.unitTitle)} · LingoPro</title>
  <style>
    @page {
      size: A4;
      margin: 12mm 12mm 16mm;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      font-size: 11pt;
      line-height: 1.35;
      background: #fff;
      position: relative;
    }
    .watermark-hero {
      position: fixed;
      left: 50%;
      top: 45%;
      z-index: 0;
      pointer-events: none;
      transform: translate(-50%, -50%) rotate(-28deg);
      font-size: 22pt;
      font-weight: 800;
      letter-spacing: 0.06em;
      color: #6366f1;
      opacity: 0.045;
      white-space: nowrap;
      user-select: none;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .wm-corner {
      position: fixed;
      right: 8mm;
      bottom: 10mm;
      z-index: 1;
      pointer-events: none;
      font-size: 7.5pt;
      font-weight: 800;
      color: #4f46e5;
      opacity: 0.55;
      letter-spacing: 0.02em;
      user-select: none;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page-foot {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 1;
      pointer-events: none;
      text-align: center;
      font-size: 7pt;
      font-weight: 600;
      color: #94a3b8;
      padding: 3px 8px 5px;
      border-top: 1px solid #f1f5f9;
      background: rgba(255,255,255,0.88);
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page-foot strong { color: #6366f1; font-weight: 800; }
    .sheet {
      position: relative;
      z-index: 2;
      max-width: 190mm;
      margin: 0 auto;
      padding: 8px 4px 28px;
    }
    header.brand {
      display: flex;
      align-items: center;
      gap: 12px;
      padding-bottom: 10px;
      border-bottom: 3px solid #4f46e5;
      margin-bottom: 14px;
    }
    header.brand img {
      width: 44px; height: 44px; border-radius: 10px;
      object-fit: cover; background: #eef2ff;
    }
    header.brand .meta { flex: 1; min-width: 0; }
    header.brand .name {
      font-size: 13pt; font-weight: 800; color: #4f46e5; letter-spacing: -0.02em;
    }
    header.brand .tag {
      font-size: 8.5pt; color: #64748b; font-weight: 600; margin-top: 2px;
    }
    header.brand .qr-hint {
      text-align: right; font-size: 8pt; color: #64748b; font-weight: 600;
      max-width: 42%;
    }
    header.brand .qr-hint a { color: #4f46e5; text-decoration: none; font-weight: 800; }
    h1 {
      font-size: 16pt; font-weight: 900; margin: 0 0 4px; line-height: 1.2;
    }
    .subtitle {
      font-size: 9.5pt; color: #475569; font-weight: 600; margin: 0 0 10px;
    }
    .badges { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
    .badge {
      display: inline-block; padding: 3px 8px; border-radius: 999px;
      background: #eef2ff; color: #3730a3; font-size: 8.5pt; font-weight: 800;
    }
    .badge.soft { background: #f1f5f9; color: #475569; }
    .howto {
      background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;
      padding: 8px 10px; font-size: 8.5pt; color: #334155; margin-bottom: 14px;
    }
    .howto strong { color: #0f172a; }
    .share-box {
      margin-top: 10px; padding: 8px; border-radius: 8px; background: #eef2ff;
      font-size: 8.5pt; color: #312e81; font-weight: 600;
    }
    h2 {
      font-size: 11.5pt; font-weight: 900; margin: 16px 0 8px;
      display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
      color: #1e1b4b;
      page-break-after: avoid;
    }
    .pill {
      font-size: 8pt; font-weight: 800; background: #4f46e5; color: #fff;
      padding: 2px 7px; border-radius: 999px;
    }
    table {
      width: 100%; border-collapse: collapse; table-layout: fixed;
      font-size: 9pt;
    }
    th, td {
      border: 1px solid #cbd5e1; padding: 5px 6px; vertical-align: top;
    }
    th {
      background: #eef2ff; color: #312e81; font-weight: 800; text-align: left;
      font-size: 8pt;
    }
    td.num, th.num { width: 26px; text-align: center; color: #64748b; font-weight: 700; }
    td.word, th.word { width: 22%; }
    td.def, th.def { width: 38%; }
    td.ex, th.ex { width: 32%; font-size: 8.5pt; color: #334155; }
    .lemma { font-weight: 800; color: #0f172a; font-size: 9.5pt; }
    .ipa {
      font-family: "Segoe UI", "Lucida Sans Unicode", "Arial Unicode MS", sans-serif;
      font-size: 8pt; font-weight: 600; color: #64748b; margin-top: 1px;
      letter-spacing: 0.01em;
    }
    .ipa.muted { color: #cbd5e1; }
    .pos {
      display: inline-block; margin-top: 2px; font-size: 7.5pt; font-weight: 700;
      color: #4f46e5; background: #eef2ff; padding: 1px 5px; border-radius: 4px;
    }
    .pos.muted, .muted { color: #94a3b8; font-weight: 600; font-style: normal; background: transparent; padding: 0; }
    td.def { font-size: 8.5pt; color: #1e293b; line-height: 1.35; }
    td.ex em { font-style: italic; color: #475569; }
    tr:nth-child(even) td { background: #f8fafc; }
    tr { page-break-inside: avoid; }
    .pack-break { page-break-before: auto; }
    footer.foot {
      margin-top: 18px; padding-top: 10px; border-top: 1px dashed #94a3b8;
      font-size: 8pt; color: #64748b; text-align: center; line-height: 1.5;
    }
    footer.foot strong { color: #4f46e5; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
      a { color: inherit; text-decoration: none; }
      .watermark-hero { opacity: 0.05; }
      .wm-corner { opacity: 0.5; }
    }
    .toolbar {
      position: sticky; top: 0; z-index: 10;
      display: flex; gap: 8px; flex-wrap: wrap; align-items: center;
      padding: 10px; background: #0f172a; color: #fff; margin: -8px -4px 12px;
      border-radius: 0 0 10px 10px;
    }
    .toolbar button {
      border: 0; border-radius: 8px; padding: 8px 14px; font-weight: 800;
      font-size: 12px; cursor: pointer; background: #4f46e5; color: #fff;
    }
    .toolbar button.secondary { background: #334155; }
    .toolbar span { font-size: 11px; opacity: 0.9; flex: 1; }
  </style>
</head>
<body>
  <div class="watermark-hero" aria-hidden="true">${escapeHtml(hostLabel)}</div>
  <div class="wm-corner" aria-hidden="true">${escapeHtml(hostLabel)}</div>
  <div class="page-foot" aria-hidden="true">
    LingoPro · <strong>${escapeHtml(hostLabel)}</strong> · ôn offline · học SRS trên app
  </div>

  <div class="sheet">
    <div class="toolbar no-print">
      <button type="button" onclick="window.print()">⬇ Lưu / In PDF</button>
      <button type="button" class="secondary" onclick="window.close()">Đóng</button>
      <span>Chọn máy in → <b>Lưu thành PDF</b> · đã kèm dạng từ + nghĩa</span>
    </div>

    <header class="brand">
      <img src="${escapeHtml(logoUrl)}" alt="LingoPro" width="44" height="44" />
      <div class="meta">
        <div class="name">LingoPro</div>
        <div class="tag">Học từ vựng · nhớ lâu · SRS · ${escapeHtml(hostLabel)}</div>
      </div>
      <div class="qr-hint">
        Học online miễn phí<br/>
        <a href="${escapeHtml(site)}/library">${escapeHtml(hostLabel)}/library</a>
      </div>
    </header>

    <h1>${input.routeIcon ? `${escapeHtml(input.routeIcon)} ` : ''}${escapeHtml(input.unitTitle)}</h1>
    <p class="subtitle">
      ${escapeHtml(input.routeTitle)}
      ${input.topicTitle ? ` · ${escapeHtml(input.topicTitle)}` : ''}
    </p>
    <div class="badges">
      <span class="badge">${totalWords} từ</span>
      <span class="badge">${input.packs.length} chặng</span>
      <span class="badge soft">${withDef}/${totalWords} nghĩa</span>
      <span class="badge soft">${withIpa}/${totalWords} IPA</span>
      ${input.cefrLabel ? `<span class="badge soft">CEFR ${escapeHtml(input.cefrLabel)}</span>` : ''}
      <span class="badge soft">Xuất ${escapeHtml(date)}</span>
    </div>

    <div class="howto">
      <strong>Nội dung:</strong> IPA (US ưu tiên) + dạng từ + nghĩa VI + ví dụ EN từ từ điển LingoPro.
      Ôn offline / chia sẻ nhóm — audio & ảnh học trên app.
      <div class="share-box">
        📎 Lưu PDF → gửi Zalo/Drive · bạn bè mở link app để học SRS cùng bộ.
      </div>
    </div>

    ${packBlocks}

    <footer class="foot">
      © LingoPro · Tài liệu ôn tập · Watermark: <strong>${escapeHtml(hostLabel)}</strong><br/>
      Không thay thế phiên học có hình ảnh & phát âm trên app · Mời bạn học free tại
      <strong>${escapeHtml(hostLabel)}</strong>
    </footer>
  </div>
  <script>
    try {
      document.title = ${JSON.stringify(`${input.unitTitle} · LingoPro`)};
    } catch (e) {}
  </script>
</body>
</html>`;
}

/** Mở tab in PDF; trả true nếu mở được. */
export function openTopicPdfPreview(input: TopicPdfInput): boolean {
  const html = buildTopicPdfHtml(input);
  const w = window.open('', '_blank');
  if (!w) return false;
  w.document.open();
  w.document.write(html);
  w.document.close();
  return true;
}

/** Tên file gợi ý khi user lưu PDF. */
export function suggestPdfFileName(unitTitle: string, routeTitle?: string): string {
  const parts = ['lingopro', routeTitle ? slugify(routeTitle) : '', slugify(unitTitle)].filter(Boolean);
  return `${parts.join('-') || 'lingopro-vocab'}.pdf`;
}
