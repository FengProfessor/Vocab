'use client';

import React from 'react';
import Image from 'next/image';
import PronounMatrixTable from './PronounMatrixTable';
import FormattedText from './FormattedText';
import { Table, CheckCircle2, AlertCircle, Info, BookOpen, AlertTriangle, Sparkles, Volume2 } from 'lucide-react';
import { grammarAudio } from '@/lib/grammar/grammarAudioManager';

export interface FormulaRow {
  form?: string;
  type?: string;
  structure?: string;
  base?: string;
  ['mạo_từ']?: string;
  time?: string;
  singular?: string;
  rule?: string;
  third?: string;
  thirdPerson?: string;
  example?: string;
  plural?: string;
  case?: string;
  [key: string]: unknown;
}

interface GrammarRuleItem {
  case?: string;
  rule?: string;
  example?: string;
  [key: string]: unknown;
}

interface GrammarMistakeItem {
  wrong: string;
  right: string;
  why: string;
  [key: string]: unknown;
}

export interface GrammarTheoryData {
  definition?: string;
  tips?: string;
  comparison?: string;
  formula?: {
    rows?: FormulaRow[];
    note?: string;
  };
  rules?: GrammarRuleItem[];
  mistakes?: GrammarMistakeItem[];
  signals?: string[];
  bilingual_examples?: Array<{ en?: string; vi?: string }>;
  [key: string]: unknown;
}

interface GrammarReferenceTableProps {
  topicSlug: string;
  topicTitle?: string;
  topicTitleVi?: string;
  topicSummary?: string;
  theoryData?: GrammarTheoryData | null;
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
                <th className="p-3 border-r border-border min-w-[120px] sticky left-0 bg-muted/95 z-10 backdrop-blur-xs">Chủ ngữ (Ngôi)</th>
                <th className="p-3 border-r border-border text-primary font-bold min-w-[120px]">Khẳng định (+)</th>
                <th className="p-3 border-r border-border text-rose-700 dark:text-rose-400 font-bold min-w-[140px]">Phủ định (-)</th>
                <th className="p-3 border-r border-border min-w-[130px]">Nghi vấn (?)</th>
                <th className="p-3 border-r border-border min-w-[110px]">Quá khứ đơn</th>
                <th className="p-3 min-w-[240px]">Ví dụ thực tế</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              <tr className="hover:bg-muted/10">
                <td className="p-3 font-semibold border-r border-border/60 bg-background sticky left-0 z-10">
                  <div className="flex items-center gap-2.5">
                    <div className="relative w-9 h-9 shrink-0 border border-border overflow-hidden bg-muted/30">
                      <Image
                        src="/grammar/topics/personal-pronouns/v2_i.jpg"
                        alt="Tôi (I)"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div>
                      <div className="font-bold text-foreground text-sm">I</div>
                      <div className="text-[11px] font-sans font-medium text-primary">Tôi</div>
                    </div>
                  </div>
                </td>
                <td className="p-3 font-bold text-primary border-r border-border/60 text-sm">am (I&apos;m)</td>
                <td className="p-3 font-medium text-rose-700 dark:text-rose-400 border-r border-border/60">am not (I&apos;m not)</td>
                <td className="p-3 border-r border-border/60">Am I...?</td>
                <td className="p-3 font-bold border-r border-border/60">was</td>
                <td className="p-3 font-sans text-xs">
                  <div className="flex items-start justify-between gap-1">
                    <div className="font-medium text-foreground">I am a student.</div>
                    <button
                      type="button"
                      onClick={() => grammarAudio.play('table-tobe-i', 'I am a student.')}
                      className="p-1 text-muted-foreground hover:text-foreground shrink-0 transition-colors"
                      title="Nghe câu ví dụ"
                      aria-label="Nghe câu ví dụ"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="text-muted-foreground text-[11px]">Tôi là học sinh.</div>
                </td>
              </tr>
              <tr className="hover:bg-muted/10">
                <td className="p-3 font-semibold border-r border-border/60 bg-background sticky left-0 z-10">
                  <div className="flex items-start gap-2.5">
                    <div className="flex -space-x-2 shrink-0">
                      <div className="relative w-8 h-8 border border-border overflow-hidden bg-muted/30 z-30" title="He (Anh ấy)">
                        <Image src="/grammar/topics/personal-pronouns/v2_he.jpg" alt="He" fill className="object-cover" unoptimized />
                      </div>
                      <div className="relative w-8 h-8 border border-border overflow-hidden bg-muted/30 z-20" title="She (Cô ấy)">
                        <Image src="/grammar/topics/personal-pronouns/v2_she.jpg" alt="She" fill className="object-cover" unoptimized />
                      </div>
                      <div className="relative w-8 h-8 border border-border overflow-hidden bg-muted/30 z-10" title="It (Nó)">
                        <Image src="/grammar/topics/personal-pronouns/v2_it.jpg" alt="It" fill className="object-cover" unoptimized />
                      </div>
                    </div>
                    <div>
                      <div className="font-bold text-foreground text-xs">He / She / It</div>
                      <div className="text-[10px] text-muted-foreground font-sans">Anh ấy / Cô ấy / Nó (Số ít)</div>
                    </div>
                  </div>
                </td>
                <td className="p-3 font-bold text-primary border-r border-border/60 text-sm">is (he&apos;s / she&apos;s)</td>
                <td className="p-3 font-medium text-rose-700 dark:text-rose-400 border-r border-border/60">is not (isn&apos;t)</td>
                <td className="p-3 border-r border-border/60">Is he / she...?</td>
                <td className="p-3 font-bold border-r border-border/60">was</td>
                <td className="p-3 font-sans text-xs">
                  <div className="flex items-start justify-between gap-1">
                    <div className="font-medium text-foreground">She is very happy.</div>
                    <button
                      type="button"
                      onClick={() => grammarAudio.play('table-tobe-she', 'She is very happy.')}
                      className="p-1 text-muted-foreground hover:text-foreground shrink-0 transition-colors"
                      title="Nghe câu ví dụ"
                      aria-label="Nghe câu ví dụ"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="text-muted-foreground text-[11px]">Cô ấy rất vui vẻ.</div>
                </td>
              </tr>
              <tr className="hover:bg-muted/10">
                <td className="p-3 font-semibold border-r border-border/60 bg-background sticky left-0 z-10">
                  <div className="flex items-start gap-2.5">
                    <div className="flex -space-x-2 shrink-0">
                      <div className="relative w-8 h-8 border border-border overflow-hidden bg-muted/30 z-30" title="We (Chúng tôi)">
                        <Image src="/grammar/topics/personal-pronouns/v2_we.jpg" alt="We" fill className="object-cover" unoptimized />
                      </div>
                      <div className="relative w-8 h-8 border border-border overflow-hidden bg-muted/30 z-20" title="They (Họ)">
                        <Image src="/grammar/topics/personal-pronouns/v2_they.jpg" alt="They" fill className="object-cover" unoptimized />
                      </div>
                      <div className="relative w-8 h-8 border border-border overflow-hidden bg-muted/30 z-10" title="You (Bạn)">
                        <Image src="/grammar/topics/personal-pronouns/v2_you.jpg" alt="You" fill className="object-cover" unoptimized />
                      </div>
                    </div>
                    <div>
                      <div className="font-bold text-foreground text-xs">You / We / They</div>
                      <div className="text-[10px] text-muted-foreground font-sans">Bạn / Chúng tôi / Họ (Số nhiều)</div>
                    </div>
                  </div>
                </td>
                <td className="p-3 font-bold text-primary border-r border-border/60 text-sm">are (you&apos;re / they&apos;re)</td>
                <td className="p-3 font-medium text-rose-700 dark:text-rose-400 border-r border-border/60">are not (aren&apos;t)</td>
                <td className="p-3 border-r border-border/60">Are you / they...?</td>
                <td className="p-3 font-bold border-r border-border/60">were</td>
                <td className="p-3 font-sans text-xs">
                  <div className="flex items-start justify-between gap-1">
                    <div className="font-medium text-foreground">They are in the garden.</div>
                    <button
                      type="button"
                      onClick={() => grammarAudio.play('table-tobe-they', 'They are in the garden.')}
                      className="p-1 text-muted-foreground hover:text-foreground shrink-0 transition-colors"
                      title="Nghe câu ví dụ"
                      aria-label="Nghe câu ví dụ"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="text-muted-foreground text-[11px]">Họ đang ở trong vườn.</div>
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
                <th className="p-3 border-r border-border min-w-[120px] sticky left-0 bg-muted/95 z-10 backdrop-blur-xs">Khoảng cách</th>
                <th className="p-3 border-r border-border text-primary font-bold min-w-[160px]">Số ít (Singular)</th>
                <th className="p-3 border-r border-border text-emerald-700 dark:text-emerald-400 font-bold min-w-[160px]">Số nhiều (Plural)</th>
                <th className="p-3 min-w-[260px]">Ví dụ thực tế đối chiếu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              <tr className="hover:bg-muted/10">
                <td className="p-3 font-semibold border-r border-border/60 bg-background sticky left-0 z-10">
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
                <td className="p-3 font-semibold border-r border-border/60 bg-background sticky left-0 z-10">
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
  const formulaRows: FormulaRow[] = theoryData?.formula?.rows || [];
  const formulaNote: string = theoryData?.formula?.note || '';
  const rules: GrammarRuleItem[] = theoryData?.rules || [];
  const mistakes: GrammarMistakeItem[] = theoryData?.mistakes || [];
  const signals: string[] = theoryData?.signals || [];

  // Check if rows have genuine base vs third person columns (e.g. Present Simple, Have got)
  const hasThirdCol = formulaRows.some(
    (r) =>
      Boolean(r.third || r.thirdPerson) &&
      !String(r.third || r.thirdPerson).toLowerCase().includes('ngữ cảnh')
  );

  // Helper to extract structure and example across all 62 topics
  const resolveStructure = (r: FormulaRow) =>
    r.structure || r.base || (r['mạo_từ'] as string | undefined) || r.time || r.singular || r.rule || '—';

  const resolveExampleEn = (r: FormulaRow, idx: number) =>
    r.example || theoryData?.bilingual_examples?.[idx]?.en || theoryData?.bilingual_examples?.[0]?.en || '';

  const resolveExampleVi = (r: FormulaRow, idx: number) =>
    (r.example ? '' : theoryData?.bilingual_examples?.[idx]?.vi || theoryData?.bilingual_examples?.[0]?.vi) || '';

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
                  <th className="p-3 border-r border-border min-w-[130px] sticky left-0 bg-muted/95 z-10 backdrop-blur-xs">Dạng thể</th>
                  {hasThirdCol ? (
                    <>
                      <th className="p-3 border-r border-border text-primary font-bold min-w-[180px]">
                        I / You / We / They / Số nhiều
                      </th>
                      <th className="p-3 border-r border-border text-indigo-700 dark:text-indigo-400 font-bold min-w-[180px]">
                        He / She / It / Số ít
                      </th>
                      <th className="p-3 min-w-[220px]">Ví dụ thực tế</th>
                    </>
                  ) : (
                    <>
                      <th className="p-3 border-r border-border text-primary font-bold min-w-[220px]">
                        Cấu trúc ngữ pháp
                      </th>
                      <th className="p-3 min-w-[260px]">Ví dụ thực tế minh họa</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {formulaRows.map((r, i) => (
                  <tr key={i} className="hover:bg-muted/10">
                    <td className="p-3 font-semibold border-r border-border/60 bg-background text-primary sticky left-0 z-10">
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
                        <td className="p-3 font-sans text-xs">
                          {resolveExampleEn(r, i) ? (
                            <div className="space-y-0.5">
                              <div className="font-medium text-foreground">
                                <FormattedText text={resolveExampleEn(r, i)} />
                              </div>
                              {resolveExampleVi(r, i) && (
                                <div className="text-muted-foreground text-[11px]">
                                  <FormattedText text={resolveExampleVi(r, i)} />
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-3 font-bold border-r border-border/60 text-foreground">
                          <FormattedText text={resolveStructure(r)} />
                        </td>
                        <td className="p-3 font-sans text-xs">
                          {resolveExampleEn(r, i) ? (
                            <div className="space-y-0.5">
                              <div className="font-medium text-foreground">
                                <FormattedText text={resolveExampleEn(r, i)} />
                              </div>
                              {resolveExampleVi(r, i) && (
                                <div className="text-muted-foreground text-[11px]">
                                  <FormattedText text={resolveExampleVi(r, i)} />
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {formulaNote && (
            <div className="p-3 border border-border bg-muted/10 text-xs text-muted-foreground flex items-start gap-2 rounded-none">
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
                <th className="p-3 border-r border-border min-w-[130px] sticky left-0 bg-muted/95 z-10 backdrop-blur-xs">Cấu trúc (Form)</th>
                <th className="p-3 border-r border-border text-primary font-bold min-w-[200px]">Công thức chuẩn</th>
                <th className="p-3 min-w-[260px]">Ví dụ thực tế minh họa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              <tr className="hover:bg-muted/10">
                <td className="p-3 font-semibold border-r border-border/60 bg-background sticky left-0 z-10">Khẳng định (+)</td>
                <td className="p-3 font-bold text-primary border-r border-border/60">
                  Subject + Verb (chia) + Object / Complement
                </td>
                <td className="p-3 font-sans text-xs">
                  <div className="font-medium text-foreground">The team completed the analysis on schedule.</div>
                  <div className="text-muted-foreground text-[11px]">Đội ngũ đã hoàn thành phân tích đúng tiến độ.</div>
                </td>
              </tr>
              <tr className="hover:bg-muted/10">
                <td className="p-3 font-semibold border-r border-border/60 bg-background sticky left-0 z-10">Phủ định (-)</td>
                <td className="p-3 font-bold text-rose-700 dark:text-rose-400 border-r border-border/60">
                  Subject + Auxiliary + not + Verb (nguyên thể)
                </td>
                <td className="p-3 font-sans text-xs">
                  <div className="font-medium text-foreground">We do not compromise on project quality.</div>
                  <div className="text-muted-foreground text-[11px]">Chúng tôi không thỏa hiệp về chất lượng dự án.</div>
                </td>
              </tr>
              <tr className="hover:bg-muted/10">
                <td className="p-3 font-semibold border-r border-border/60 bg-background sticky left-0 z-10">Nghi vấn (?)</td>
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
                {mistakes.map((m, i) => (
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
        <div className="p-3.5 border border-border bg-muted/10 space-y-2 rounded-none">
          <div className="font-mono text-xs uppercase tracking-wider font-semibold text-foreground flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-primary" />
            <span>Dấu hiệu nhận biết & Từ nhận diện</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {signals.map((sig, i) => (
              <span
                key={i}
                className="px-2 py-0.5 font-mono text-xs border border-border bg-background text-foreground rounded-none"
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
