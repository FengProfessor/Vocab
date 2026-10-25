/**
 * Xuất PDF handout 1 bài ngữ pháp.
 * HTML A4 branded → window.print → "Lưu thành PDF" (cùng pattern library-topic-pdf).
 */

export interface GrammarPdfWordbank {
  title?: string;
  icon?: string;
  note?: string;
  rows?: Record<string, string>[];
}

export interface GrammarPdfExercise {
  type?: string;
  q?: string;
  question?: string;
  opts?: string[];
  options?: string[];
  answer?: string | string[] | boolean;
  correct_answer?: string | string[] | boolean;
  fb?: string;
  explanation?: string;
}

export interface GrammarPdfInput {
  title: string;
  titleVi?: string | null;
  level?: string | null;
  slug?: string;
  definition?: string;
  tips?: string;
  mistakes?: { wrong?: string; right?: string; why?: string }[];
  wordbanks?: GrammarPdfWordbank[];
  exercises?: GrammarPdfExercise[];
  /** max exercise rows in worksheet (default 40; 0 = all) */
  exerciseCap?: number;
  siteUrl?: string;
  /** include answer key section */
  withAnswers?: boolean;
}

function escapeHtml(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function mdLite(s: string): string {
  // very light: bold **x** and line breaks
  return escapeHtml(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>');
}

function formatAnswer(a: unknown): string {
  if (a === true) return 'Đúng';
  if (a === false) return 'Sai';
  if (Array.isArray(a)) return a.map(String).join(' / ');
  return String(a ?? '');
}

export function slugifyGrammarPdf(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

export function buildGrammarLessonPdfHtml(input: GrammarPdfInput): string {
  const site = (
    input.siteUrl ??
    (typeof window !== 'undefined' ? window.location.origin : 'https://lingopro.online')
  ).replace(/\/$/, '');
  const hostLabel = site.replace(/^https?:\/\//, '').replace(/\/$/, '') || 'lingopro.online';
  const logoUrl = `${site}/icons/icon-192.webp`;
  const date = new Date().toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const withAnswers = input.withAnswers !== false;
  const cap = input.exerciseCap === 0 ? Number.POSITIVE_INFINITY : (input.exerciseCap ?? 40);
  const banks = (input.wordbanks ?? []).filter((b) => (b.rows?.length ?? 0) > 0);
  const exercises = (input.exercises ?? [])
    .filter((e) => String(e.q || e.question || '').trim())
    .slice(0, Number.isFinite(cap) ? cap : undefined);

  const bankBlocks = banks
    .map((b, bi) => {
      const rows = b.rows ?? [];
      const keys = rows[0] ? Object.keys(rows[0]) : [];
      if (!keys.length) return '';
      const thead = keys
        .map((k) => `<th>${escapeHtml(k.replace(/_/g, ' '))}</th>`)
        .join('');
      const tbody = rows
        .map(
          (r) =>
            `<tr>${keys.map((k) => `<td>${escapeHtml(String(r[k] ?? ''))}</td>`).join('')}</tr>`,
        )
        .join('');
      return `
      <section class="block">
        <h2>${b.icon ? `${escapeHtml(b.icon)} ` : ''}${escapeHtml(b.title || `Bảng ${bi + 1}`)}</h2>
        ${b.note ? `<p class="note">${mdLite(b.note)}</p>` : ''}
        <p class="meta-line">${rows.length} dòng</p>
        <div class="table-wrap">
          <table>
            <thead><tr>${thead}</tr></thead>
            <tbody>${tbody}</tbody>
          </table>
        </div>
      </section>`;
    })
    .join('');

  const exerciseBlocks = exercises
    .map((e, i) => {
      const q = String(e.q || e.question || '').trim();
      const opts = e.opts || e.options || [];
      const type = e.type || 'mcq';
      const typeLabel: Record<string, string> = {
        mcq: 'TN',
        multiple_choice: 'TN',
        fill: 'Điền',
        fill_blank: 'Điền',
        error: 'Sửa lỗi',
        error_correction: 'Sửa lỗi',
        tf: 'Đ/S',
      };
      const badge = typeLabel[type] || type;
      let optsHtml = '';
      if (type === 'tf') {
        optsHtml = `<div class="opts">☐ Đúng &nbsp;&nbsp; ☐ Sai</div>`;
      } else if (opts.length) {
        optsHtml = `<div class="opts">${opts
          .map((o, j) => `<div>☐ ${String.fromCharCode(65 + j)}. ${escapeHtml(String(o))}</div>`)
          .join('')}</div>`;
      } else {
        optsHtml = `<div class="blank-line">Đáp án: _______________________________</div>`;
      }
      return `
      <div class="ex">
        <div class="ex-h"><span class="badge">${escapeHtml(badge)}</span> <strong>${i + 1}.</strong> ${escapeHtml(q)}</div>
        ${optsHtml}
      </div>`;
    })
    .join('');

  const answerKey = withAnswers
    ? `<section class="block answers">
        <h2>🔑 Đáp án</h2>
        <ol class="ans-list">
          ${exercises
            .map((e, i) => {
              const ans = formatAnswer(
                e.answer !== undefined ? e.answer : e.correct_answer,
              );
              const fb = e.fb || e.explanation || '';
              return `<li><strong>${i + 1}.</strong> ${escapeHtml(ans)}${
                fb ? ` <span class="fb">— ${escapeHtml(fb)}</span>` : ''
              }</li>`;
            })
            .join('')}
        </ol>
        <p class="meta-line">Đối chiếu trên app: drill chấm điểm + SRS tiến độ.</p>
      </section>`
    : `<section class="block answers no-print" style="display:none">
        <h2>🔑 Đáp án (Ẩn)</h2>
        <ol class="ans-list">
          ${exercises
            .map((e, i) => {
              const ans = formatAnswer(
                e.answer !== undefined ? e.answer : e.correct_answer,
              );
              const fb = e.fb || e.explanation || '';
              return `<li><strong>${i + 1}.</strong> ${escapeHtml(ans)}${
                fb ? ` <span class="fb">— ${escapeHtml(fb)}</span>` : ''
              }</li>`;
            })
            .join('')}
        </ol>
      </section>`;

  const mistakes = (input.mistakes ?? []).slice(0, 12);
  const mistakesHtml = mistakes.length
    ? `<section class="block">
        <h2>⚠️ Lỗi hay gặp</h2>
        <ul class="mistakes">
          ${mistakes
            .map(
              (m) =>
                `<li><span class="wrong">${escapeHtml(m.wrong || '')}</span> → <span class="right">${escapeHtml(
                  m.right || '',
                )}</span>${m.why ? ` <em>(${escapeHtml(m.why)})</em>` : ''}</li>`,
            )
            .join('')}
        </ul>
      </section>`
    : '';

  const levelLabel =
    input.level === 'beginner'
      ? 'Cơ bản (A0–A1)'
      : input.level === 'intermediate'
        ? 'Trung cấp (A2)'
        : input.level === 'advanced'
          ? 'Nâng cao (B1+)'
          : input.level || 'Grammar';

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${escapeHtml(input.titleVi || input.title)} · LingoPro Grammar</title>
  <style>
    @page { size: A4; margin: 12mm 12mm 14mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0; font-family: "Segoe UI", system-ui, sans-serif;
      color: #0f172a; background: #e2e8f0; font-size: 11px; line-height: 1.45;
    }
    .sheet {
      max-width: 210mm; margin: 0 auto; background: #fff;
      padding: 10mm 12mm 14mm; min-height: 100vh; position: relative;
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
    .brand { display: flex; gap: 10px; align-items: center; margin-bottom: 10px; }
    .brand img { border-radius: 10px; }
    .brand .name { font-weight: 900; font-size: 16px; }
    .brand .tag { font-size: 10px; color: #64748b; }
    h1 { font-size: 18px; margin: 8px 0 4px; }
    .subtitle { margin: 0 0 8px; color: #475569; }
    .badges { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
    .badge {
      display: inline-block; padding: 3px 8px; border-radius: 999px;
      background: #eef2ff; color: #3730a3; font-weight: 700; font-size: 10px;
    }
    .badge.soft { background: #f1f5f9; color: #475569; }
    .howto {
      background: #fffbeb; border: 1px solid #fcd34d; border-radius: 10px;
      padding: 8px 10px; margin-bottom: 12px; font-size: 10.5px;
    }
    .block { margin: 14px 0; break-inside: avoid; }
    .block h2 { font-size: 13px; margin: 0 0 6px; color: #1e293b; }
    .note {
      background: #fff7ed; border-left: 3px solid #f59e0b;
      padding: 6px 8px; margin: 0 0 8px; font-size: 10.5px;
    }
    .meta-line { color: #94a3b8; font-size: 10px; margin: 0 0 6px; }
    .def { font-size: 11.5px; margin: 0; }
    .table-wrap { overflow-x: auto; }
    table {
      width: 100%; border-collapse: collapse; font-size: 9.5px;
      margin-bottom: 4px;
    }
    th, td {
      border: 1px solid #cbd5e1; padding: 4px 6px; text-align: left; vertical-align: top;
    }
    th { background: #e0e7ff; color: #312e81; font-weight: 800; }
    tr:nth-child(even) td { background: #f8fafc; }
    .mistakes { padding-left: 16px; margin: 0; }
    .mistakes .wrong { color: #b91c1c; text-decoration: line-through; }
    .mistakes .right { color: #047857; font-weight: 700; }
    .ex {
      border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px;
      margin-bottom: 8px; break-inside: avoid;
    }
    .ex-h { margin-bottom: 4px; }
    .ex .badge {
      background: #ecfeff; color: #0e7490; margin-right: 4px;
    }
    .opts { padding-left: 4px; color: #334155; }
    .opts div { margin: 2px 0; }
    .blank-line { color: #64748b; margin-top: 4px; }
    .answers { background: #f0fdf4; border: 1px solid #86efac; border-radius: 10px; padding: 10px; }
    .ans-list { margin: 0; padding-left: 18px; }
    .ans-list .fb { color: #64748b; font-weight: 400; }
    .foot {
      margin-top: 16px; padding-top: 8px; border-top: 1px dashed #cbd5e1;
      font-size: 9.5px; color: #64748b;
    }
    .page-foot {
      position: fixed; bottom: 4mm; left: 12mm; right: 12mm;
      font-size: 9px; color: #94a3b8; text-align: center;
    }
    @media print {
      body { background: #fff; }
      .toolbar, .no-print { display: none !important; }
      .sheet { padding: 0; max-width: none; }
      .page-foot { position: fixed; }
      a { color: inherit; text-decoration: none; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="toolbar no-print">
      <button type="button" onclick="window.print()">⬇ Lưu / In PDF</button>
      <button type="button" class="secondary" onclick="window.close()">Đóng</button>
      <span>Chọn máy in → <b>Lưu thành PDF</b> · handout ôn + làm bài</span>
    </div>

    <header class="brand">
      <img src="${escapeHtml(logoUrl)}" alt="LingoPro" width="40" height="40" onerror="this.style.display='none'"/>
      <div>
        <div class="name">LingoPro Grammar</div>
        <div class="tag">Handout ôn thi · ${escapeHtml(hostLabel)}</div>
      </div>
    </header>

    <h1>${escapeHtml(input.titleVi || input.title)}</h1>
    <p class="subtitle">${escapeHtml(input.title)}${input.slug ? ` · <code>${escapeHtml(input.slug)}</code>` : ''}</p>
    <div class="badges">
      <span class="badge">${escapeHtml(levelLabel)}</span>
      <span class="badge soft">${banks.length} bảng từ</span>
      <span class="badge soft">${exercises.length} câu BT</span>
      <span class="badge soft">Xuất ${escapeHtml(date)}</span>
    </div>

    <div class="howto">
      <strong>Cách dùng:</strong> đọc định nghĩa → học bảng case → làm bài (khoanh/điền) → đối chiếu đáp án cuối.
      Drill chấm điểm &amp; tiến độ trên app: <a href="${escapeHtml(site)}/grammar/learn">${escapeHtml(hostLabel)}/grammar/learn</a>
    </div>

    ${
      input.definition
        ? `<section class="block"><h2>🎯 Định nghĩa</h2><p class="def">${mdLite(input.definition)}</p></section>`
        : ''
    }

    ${bankBlocks}

    ${mistakesHtml}

    ${
      input.tips
        ? `<section class="block"><h2>🧠 Mẹo nhớ</h2><p class="def">${mdLite(input.tips)}</p></section>`
        : ''
    }

    <section class="block">
      <h2>✏️ Bài tập (${exercises.length} câu)</h2>
      ${exerciseBlocks || '<p class="meta-line">Chưa có bài tập.</p>'}
    </section>

    ${answerKey}

    <footer class="foot">
      © LingoPro · Tài liệu ôn ngữ pháp · Không thay drill interactive trên app<br/>
      Học online: <strong>${escapeHtml(hostLabel)}</strong>
    </footer>
  </div>
  <div class="page-foot">LingoPro Grammar · ${escapeHtml(hostLabel)} · ${escapeHtml(input.titleVi || input.title)}</div>
  <script>
    try { document.title = ${JSON.stringify(`${input.titleVi || input.title} · LingoPro Grammar`)}; } catch (e) {}
  </script>
</body>
</html>`;
}

export function openBlankPdfWindow(): Window | null {
  try {
    const w = window.open('about:blank', '_blank');
    if (!w) return null;
    try {
      w.opener = null;
    } catch {
      /* ignore */
    }
    return w;
  } catch {
    return null;
  }
}

export function writePdfHtmlToWindow(w: Window, html: string): void {
  w.document.open();
  w.document.write(html);
  w.document.close();
}

export function downloadGrammarPdfHtml(html: string, fileBaseName: string): void {
  const name = `${fileBaseName.replace(/\.pdf$/i, '').replace(/\.html$/i, '')}.html`;
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function suggestGrammarPdfFileName(title: string, slug?: string): string {
  const base = slugifyGrammarPdf(slug || title) || 'grammar';
  return `lingopro-grammar-${base}.pdf`;
}
