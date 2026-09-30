'use client';

import React from 'react';
import PronounMatrixTable from './PronounMatrixTable';
import FormattedText from './FormattedText';
import { Table, CheckCircle2, AlertCircle, Info, BookOpen, AlertTriangle, Sparkles } from 'lucide-react';

interface GrammarReferenceTableProps {
  topicSlug: string;
  topicTitle?: string;
  topicTitleVi?: string;
  topicSummary?: string;
  theoryData?: any;
}

export default function GrammarReferenceTable({
  topicSlug,
  topicTitle = '',
  topicTitleVi = '',
  topicSummary = '',
  theoryData,
}: GrammarReferenceTableProps) {
  // 1. Specialized: Personal Pronouns Matrix
  if (topicSlug === 'personal-pronouns') {
    return <PronounMatrixTable />;
  }

  // 2. Specialized: Verb to be
  if (topicSlug === 'verb-to-be') {
    return (
      <div className="space-y-6">
        <div className="border border-border p-4 bg-muted/20 rounded-none">
          <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-0.5">
            <Table className="h-3.5 w-3.5 text-primary" />
            Bảng chia động từ To Be (Hiện tại & Quá khứ)
          </div>
          <div className="text-sm font-semibold text-foreground">
            Đối chiếu các dạng to be theo từng ngôi qua thể khẳng định, phủ định và câu hỏi
          </div>
        </div>

        <div className="border border-border overflow-x-auto rounded-none bg-card">
          <table className="w-full text-left font-mono text-xs divide-y divide-border">
            <thead className="bg-muted/40 uppercase text-muted-foreground">
              <tr>
                <th className="p-3 border-r border-border min-w-[120px]">Chủ ngữ (Ngôi)</th>
                <th className="p-3 border-r border-border text-primary font-bold min-w-[120px]">Khẳng định (+)</th>
                <th className="p-3 border-r border-border text-rose-700 dark:text-rose-400 font-bold min-w-[140px]">Phủ định (-)</th>
                <th className="p-3 border-r border-border min-w-[130px]">Nghi vấn (?)</th>
                <th className="p-3 border-r border-border min-w-[110px]">Quá khứ đơn</th>
                <th className="p-3 min-w-[240px]">Ví dụ thực tế</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              <tr className="hover:bg-muted/10">
                <td className="p-3 font-semibold border-r border-border/60 bg-muted/5">I</td>
                <td className="p-3 font-bold text-primary border-r border-border/60">am (I&apos;m)</td>
                <td className="p-3 font-medium text-rose-700 dark:text-rose-400 border-r border-border/60">am not (I&apos;m not)</td>
                <td className="p-3 border-r border-border/60">Am I...?</td>
                <td className="p-3 font-bold border-r border-border/60">was</td>
                <td className="p-3 font-sans text-xs">
                  <div className="font-medium text-foreground">I am ready for the interview.</div>
                  <div className="text-muted-foreground text-[11px]">Tôi đã sẵn sàng cho buổi phỏng vấn.</div>
                </td>
              </tr>
              <tr className="hover:bg-muted/10">
                <td className="p-3 font-semibold border-r border-border/60 bg-muted/5">He / She / It / Danh từ số ít</td>
                <td className="p-3 font-bold text-primary border-r border-border/60">is (he&apos;s / she&apos;s)</td>
                <td className="p-3 font-medium text-rose-700 dark:text-rose-400 border-r border-border/60">is not (isn&apos;t)</td>
                <td className="p-3 border-r border-border/60">Is he / she...?</td>
                <td className="p-3 font-bold border-r border-border/60">was</td>
                <td className="p-3 font-sans text-xs">
                  <div className="font-medium text-foreground">She is an experienced architect.</div>
                  <div className="text-muted-foreground text-[11px]">Cô ấy là một kiến trúc sư giàu kinh nghiệm.</div>
                </td>
              </tr>
              <tr className="hover:bg-muted/10">
                <td className="p-3 font-semibold border-r border-border/60 bg-muted/5">You / We / They / Danh từ số nhiều</td>
                <td className="p-3 font-bold text-primary border-r border-border/60">are (you&apos;re / they&apos;re)</td>
                <td className="p-3 font-medium text-rose-700 dark:text-rose-400 border-r border-border/60">are not (aren&apos;t)</td>
                <td className="p-3 border-r border-border/60">Are you / they...?</td>
                <td className="p-3 font-bold border-r border-border/60">were</td>
                <td className="p-3 font-sans text-xs">
                  <div className="font-medium text-foreground">They are in the meeting room.</div>
                  <div className="text-muted-foreground text-[11px]">Họ đang ở trong phòng họp.</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="border border-border p-3.5 bg-card rounded-none space-y-1">
            <div className="font-mono uppercase font-bold text-primary flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              1. Vai trò của To Be
            </div>
            <p className="text-muted-foreground leading-relaxed">
              To be kết nối chủ ngữ với tính từ (<em>She is smart</em>), danh từ chỉ nghề nghiệp/danh tính (<em>He is a doctor</em>), hoặc cụm giới từ chỉ địa điểm (<em>We are at home</em>).
            </p>
          </div>
          <div className="border border-border p-3.5 bg-card rounded-none space-y-1">
            <div className="font-mono uppercase font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              2. Lỗi hay gặp
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Không dùng <em>&quot;am not&quot;</em> viết tắt thành <em>&quot;amn&apos;t&quot;</em> (không tồn tại). Ở quá khứ, <em>You</em> luôn đi với <em>were</em> (không dùng <em>you was</em>).
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 3. Specialized: Demonstratives (this, that, these, those)
  if (topicSlug === 'demonstratives') {
    return (
      <div className="space-y-6">
        <div className="border border-border p-4 bg-muted/20 rounded-none">
          <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-0.5">
            <Table className="h-3.5 w-3.5 text-primary" />
            Ma trận Từ chỉ định (Demonstratives Matrix)
          </div>
          <div className="text-sm font-semibold text-foreground">
            Đối chiếu khoảng cách (Gần / Xa) và số lượng (Số ít / Số nhiều)
          </div>
        </div>

        <div className="border border-border overflow-x-auto rounded-none bg-card">
          <table className="w-full text-left font-mono text-xs divide-y divide-border">
            <thead className="bg-muted/40 uppercase text-muted-foreground">
              <tr>
                <th className="p-3 border-r border-border min-w-[120px]">Khoảng cách</th>
                <th className="p-3 border-r border-border text-primary font-bold min-w-[160px]">Số ít (Singular)</th>
                <th className="p-3 border-r border-border text-emerald-700 dark:text-emerald-400 font-bold min-w-[160px]">Số nhiều (Plural)</th>
                <th className="p-3 min-w-[260px]">Ví dụ thực tế đối chiếu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              <tr className="hover:bg-muted/10">
                <td className="p-3 font-semibold border-r border-border/60 bg-muted/5">
                  <div>Ở gần (Near)</div>
                  <div className="text-[11px] text-muted-foreground font-normal font-sans">Trong tầm tay hoặc thời điểm hiện tại</div>
                </td>
                <td className="p-3 border-r border-border/60 bg-primary/5">
                  <div className="text-sm font-bold text-primary">This</div>
                  <div className="text-[11px] text-muted-foreground font-sans">Cái này, người này</div>
                </td>
                <td className="p-3 border-r border-border/60 bg-emerald-500/5">
                  <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400">These</div>
                  <div className="text-[11px] text-muted-foreground font-sans">Những cái này, những người này</div>
                </td>
                <td className="p-3 font-sans text-xs space-y-1">
                  <div><strong className="text-primary">This</strong> book is useful. (1 cuốn ở gần)</div>
                  <div><strong className="text-emerald-700 dark:text-emerald-400">These</strong> documents need signing. (nhiều bản ở gần)</div>
                </td>
              </tr>
              <tr className="hover:bg-muted/10">
                <td className="p-3 font-semibold border-r border-border/60 bg-muted/5">
                  <div>Ở xa (Far)</div>
                  <div className="text-[11px] text-muted-foreground font-normal font-sans">Ngoài tầm với hoặc mốc thời gian đã qua</div>
                </td>
                <td className="p-3 border-r border-border/60 bg-primary/5">
                  <div className="text-sm font-bold text-primary">That</div>
                  <div className="text-[11px] text-muted-foreground font-sans">Cái kia, người đó</div>
                </td>
                <td className="p-3 border-r border-border/60 bg-emerald-500/5">
                  <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Those</div>
                  <div className="text-[11px] text-muted-foreground font-sans">Những cái kia, những người đó</div>
                </td>
                <td className="p-3 font-sans text-xs space-y-1">
                  <div><strong className="text-primary">That</strong> building is historic. (1 tòa nhà ở xa)</div>
                  <div><strong className="text-emerald-700 dark:text-emerald-400">Those</strong> cars belong to staff. (nhiều xe ở xa)</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="border border-border p-3.5 bg-card rounded-none space-y-1">
            <div className="font-mono uppercase font-bold text-primary flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              Sự hòa hợp danh từ
            </div>
            <p className="text-muted-foreground leading-relaxed">
              <em>This / That</em> đi với danh từ số ít hoặc không đếm được (<em>this water, that car</em>). <em>These / Those</em> bắt buộc đi với danh từ số nhiều (<em>these pens, those books</em>).
            </p>
          </div>
          <div className="border border-border p-3.5 bg-card rounded-none space-y-1">
            <div className="font-mono uppercase font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              Lỗi hay gặp
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Tránh quên thêm số nhiều vào danh từ sau <em>these/those</em>: không viết <em>&quot;these car&quot;</em>, phải viết <em>&quot;these cars&quot;</em>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 4. Universal Reference Table Engine: Dynamically renders real formulas, rules, and common mistakes for ALL other 59 topics!
  const formulaRows: any[] = theoryData?.formula?.rows || [];
  const formulaNote: string = theoryData?.formula?.note || '';
  const rules: any[] = theoryData?.rules || [];
  const mistakes: any[] = theoryData?.mistakes || [];
  const signals: string[] = theoryData?.signals || [];

  // Check if rows have base vs third person columns
  const hasThirdCol = formulaRows.some((r) => r.third || r.thirdPerson);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Table Header */}
      <div className="border border-border p-4 bg-muted/20 rounded-none">
        <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-0.5">
          <Table className="h-3.5 w-3.5 text-primary" />
          Bảng quy tắc chuẩn hóa: {topicTitle}
        </div>
        <div className="text-sm font-semibold text-foreground">
          {topicTitleVi ? `${topicTitleVi} — Khung công thức và hệ thống đối chiếu thực tế` : 'Khung công thức và hệ thống đối chiếu thực tế'}
        </div>
      </div>

      {/* 1. Core Formula Table */}
      {formulaRows.length > 0 ? (
        <div className="space-y-2">
          <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5 text-primary" />
            <span>1. Bảng công thức cú pháp chuẩn</span>
          </div>

          <div className="border border-border overflow-x-auto rounded-none bg-card">
            <table className="w-full text-left font-mono text-xs divide-y divide-border">
              <thead className="bg-muted/40 uppercase text-muted-foreground">
                <tr>
                  <th className="p-3 border-r border-border min-w-[130px]">Dạng thể</th>
                  {hasThirdCol ? (
                    <>
                      <th className="p-3 border-r border-border text-primary font-bold min-w-[180px]">
                        I / You / We / They / Số nhiều
                      </th>
                      <th className="p-3 border-r border-border text-indigo-700 dark:text-indigo-400 font-bold min-w-[180px]">
                        He / She / It / Số ít
                      </th>
                    </>
                  ) : (
                    <>
                      <th className="p-3 border-r border-border text-primary font-bold min-w-[220px]">
                        Cấu trúc ngữ pháp
                      </th>
                      <th className="p-3 min-w-[240px]">Ví dụ thực tế minh họa</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {formulaRows.map((r, i) => (
                  <tr key={i} className="hover:bg-muted/10">
                    <td className="p-3 font-semibold border-r border-border/60 bg-muted/5 text-primary">
                      <FormattedText text={r.form} />
                    </td>
                    {hasThirdCol ? (
                      <>
                        <td className="p-3 font-bold border-r border-border/60 text-foreground">
                          <FormattedText text={r.base || r.structure || '—'} />
                        </td>
                        <td className="p-3 font-bold border-r border-border/60 text-indigo-700 dark:text-indigo-400">
                          <FormattedText text={r.third || r.thirdPerson || '—'} />
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-3 font-bold border-r border-border/60 text-foreground">
                          <FormattedText text={r.structure || r.base || '—'} />
                        </td>
                        <td className="p-3 font-sans text-xs text-muted-foreground">
                          <FormattedText text={r.example || '—'} />
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {formulaNote && (
            <div className="p-3 border border-border bg-muted/10 text-xs text-muted-foreground flex items-start gap-2">
              <Info className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
              <span><FormattedText text={formulaNote} /></span>
            </div>
          )}
        </div>
      ) : (
        <div className="border border-border overflow-x-auto rounded-none bg-card">
          <table className="w-full text-left font-mono text-xs divide-y divide-border">
            <thead className="bg-muted/40 uppercase text-muted-foreground">
              <tr>
                <th className="p-3 border-r border-border min-w-[130px]">Cấu trúc (Form)</th>
                <th className="p-3 border-r border-border text-primary font-bold min-w-[200px]">Công thức chuẩn</th>
                <th className="p-3 min-w-[260px]">Ví dụ thực tế minh họa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              <tr className="hover:bg-muted/10">
                <td className="p-3 font-semibold border-r border-border/60 bg-muted/5">Khẳng định (+)</td>
                <td className="p-3 font-bold text-primary border-r border-border/60">
                  Subject + Verb (chia) + Object / Complement
                </td>
                <td className="p-3 font-sans text-xs">
                  <div className="font-medium text-foreground">The team completed the analysis on schedule.</div>
                  <div className="text-muted-foreground text-[11px]">Đội ngũ đã hoàn thành phân tích đúng tiến độ.</div>
                </td>
              </tr>
              <tr className="hover:bg-muted/10">
                <td className="p-3 font-semibold border-r border-border/60 bg-muted/5">Phủ định (-)</td>
                <td className="p-3 font-bold text-rose-700 dark:text-rose-400 border-r border-border/60">
                  Subject + Auxiliary + not + Verb (nguyên thể)
                </td>
                <td className="p-3 font-sans text-xs">
                  <div className="font-medium text-foreground">We do not compromise on project quality.</div>
                  <div className="text-muted-foreground text-[11px]">Chúng tôi không thỏa hiệp về chất lượng dự án.</div>
                </td>
              </tr>
              <tr className="hover:bg-muted/10">
                <td className="p-3 font-semibold border-r border-border/60 bg-muted/5">Nghi vấn (?)</td>
                <td className="p-3 font-bold text-emerald-700 dark:text-emerald-400 border-r border-border/60">
                  (Wh-) + Auxiliary + Subject + Verb...?
                </td>
                <td className="p-3 font-sans text-xs">
                  <div className="font-medium text-foreground">Do they need further assistance with the report?</div>
                  <div className="text-muted-foreground text-[11px]">Họ có cần thêm hỗ trợ với bản báo cáo không?</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* 2. Morphology / Spelling Rules Table */}
      {rules.length > 0 && (
        <div className="space-y-2">
          <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
            <span>2. Bảng quy tắc biến thể & chia đuôi</span>
          </div>

          <div className="border border-border overflow-x-auto rounded-none bg-card">
            <table className="w-full text-left font-mono text-xs divide-y divide-border">
              <thead className="bg-muted/40 uppercase text-muted-foreground">
                <tr>
                  <th className="p-3 border-r border-border min-w-[160px]">Trường hợp áp dụng</th>
                  <th className="p-3 border-r border-border text-primary font-bold min-w-[140px]">Quy tắc biến đổi</th>
                  <th className="p-3 min-w-[240px]">Ví dụ thực tế</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {rules.map((ruleItem, i) => (
                  <tr key={i} className="hover:bg-muted/10">
                    <td className="p-3 font-semibold border-r border-border/60 bg-muted/5 text-foreground font-sans">
                      <FormattedText text={ruleItem.case} />
                    </td>
                    <td className="p-3 font-bold border-r border-border/60 text-primary">
                      <FormattedText text={ruleItem.rule} />
                    </td>
                    <td className="p-3 text-muted-foreground font-sans">
                      <FormattedText text={ruleItem.example} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Common Mistakes Comparison Table */}
      {mistakes.length > 0 && (
        <div className="space-y-2">
          <div className="font-mono text-xs uppercase tracking-wider text-rose-700 dark:text-rose-400 font-semibold flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
            <span>3. Lỗi hay gặp & Cách sửa chuẩn xác</span>
          </div>

          <div className="border border-border overflow-x-auto rounded-none bg-card">
            <table className="w-full text-left font-mono text-xs divide-y divide-border">
              <thead className="bg-rose-500/10 uppercase text-muted-foreground border-b border-rose-500/20">
                <tr>
                  <th className="p-3 border-r border-border text-rose-700 dark:text-rose-400 font-bold min-w-[180px]">
                    Câu sai (Tránh lỗi này)
                  </th>
                  <th className="p-3 border-r border-border text-emerald-700 dark:text-emerald-400 font-bold min-w-[180px]">
                    Câu đúng (Chuẩn mực)
                  </th>
                  <th className="p-3 min-w-[260px] font-sans">Giải thích vì sao</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {mistakes.slice(0, 5).map((m, i) => (
                  <tr key={i} className="hover:bg-muted/10">
                    <td className="p-3 border-r border-border/60 text-rose-700 dark:text-rose-400 font-medium">
                      ✕ <FormattedText text={m.wrong} />
                    </td>
                    <td className="p-3 border-r border-border/60 text-emerald-700 dark:text-emerald-400 font-bold">
                      ✓ <FormattedText text={m.right} />
                    </td>
                    <td className="p-3 font-sans text-xs text-muted-foreground leading-relaxed">
                      <FormattedText text={m.why} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Signals & Context Clues */}
      {signals.length > 0 && (
        <div className="p-3.5 border border-border bg-muted/10 space-y-2">
          <div className="font-mono text-xs uppercase tracking-wider font-semibold text-foreground flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-primary" />
            <span>Dấu hiệu nhận biết & Từ nhận diện</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {signals.map((sig, i) => (
              <span
                key={i}
                className="px-2 py-0.5 font-mono text-xs border border-border bg-background text-foreground"
              >
                <FormattedText text={sig} />
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Summary Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className="border border-border p-3.5 bg-card rounded-none space-y-1">
          <div className="font-mono uppercase font-bold text-primary flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
            Bản chất cấu trúc
          </div>
          <p className="text-muted-foreground leading-relaxed">
            {topicSummary || 'Nắm vững quy tắc ngữ pháp giúp bạn diễn đạt chuẩn xác, tự nhiên và tự tin trong cả văn viết học thuật lẫn giao tiếp thực tế.'}
          </p>
        </div>

        <div className="border border-border p-3.5 bg-card rounded-none space-y-1">
          <div className="font-mono uppercase font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            Lời khuyên khi áp dụng
          </div>
          <p className="text-muted-foreground leading-relaxed">
            Luôn kiểm tra sự hòa hợp giữa chủ ngữ và động từ, đồng thời chú ý ngữ cảnh thời gian để tránh nhầm lẫn thì.
          </p>
        </div>
      </div>
    </div>
  );
}
