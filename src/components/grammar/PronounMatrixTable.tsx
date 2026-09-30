'use client';

import React, { useState, useMemo } from 'react';
import { Table, Search, CheckCircle2, AlertCircle, Info, BookOpen } from 'lucide-react';

interface PronounRow {
  person: string;
  meaning: string;
  subject: string;
  object: string;
  possessiveAdj: string;
  possessivePronoun: string;
  reflexive: string;
  exampleEn: React.ReactNode;
  exampleVi: string;
  type: 'singular' | 'plural';
  isConfusingPair?: boolean;
}

const PRONOUN_DATA: PronounRow[] = [
  {
    person: 'Ngôi 1 số ít',
    meaning: 'Tôi',
    type: 'singular',
    isConfusingPair: true,
    subject: 'I',
    object: 'me',
    possessiveAdj: 'my',
    possessivePronoun: 'mine',
    reflexive: 'myself',
    exampleEn: (
      <span>
        <strong className="text-primary font-bold">I</strong> prepared the report, and the director praised{' '}
        <strong className="text-emerald-700 dark:text-emerald-400 font-bold">me</strong>.
      </span>
    ),
    exampleVi: 'Tôi đã chuẩn bị bản báo cáo, và giám đốc khen ngợi tôi.',
  },
  {
    person: 'Ngôi 2 số ít',
    meaning: 'Bạn',
    type: 'singular',
    isConfusingPair: false,
    subject: 'you',
    object: 'you',
    possessiveAdj: 'your',
    possessivePronoun: 'yours',
    reflexive: 'yourself',
    exampleEn: (
      <span>
        <strong className="text-primary font-bold">You</strong> should trust your experience and believe in{' '}
        <strong className="text-foreground font-bold">yourself</strong>.
      </span>
    ),
    exampleVi: 'Bạn nên tin vào kinh nghiệm của mình và tin vào chính bạn.',
  },
  {
    person: 'Ngôi 3 số ít (Nam)',
    meaning: 'Anh ấy / Ông ấy',
    type: 'singular',
    isConfusingPair: true,
    subject: 'he',
    object: 'him',
    possessiveAdj: 'his',
    possessivePronoun: 'his',
    reflexive: 'himself',
    exampleEn: (
      <span>
        <strong className="text-primary font-bold">He</strong> analyzes the data, and the team consults{' '}
        <strong className="text-emerald-700 dark:text-emerald-400 font-bold">him</strong>.
      </span>
    ),
    exampleVi: 'Anh ấy phân tích dữ liệu, và đội ngũ tham khảo ý kiến của anh ấy.',
  },
  {
    person: 'Ngôi 3 số ít (Nữ)',
    meaning: 'Cô ấy / Bà ấy',
    type: 'singular',
    isConfusingPair: true,
    subject: 'she',
    object: 'her',
    possessiveAdj: 'her',
    possessivePronoun: 'hers',
    reflexive: 'herself',
    exampleEn: (
      <span>
        <strong className="text-primary font-bold">She</strong> leads the project, so the client trusts{' '}
        <strong className="text-emerald-700 dark:text-emerald-400 font-bold">her</strong>.
      </span>
    ),
    exampleVi: 'Cô ấy phụ trách dự án, vì vậy khách hàng tin tưởng cô ấy.',
  },
  {
    person: 'Ngôi 3 số ít (Vật)',
    meaning: 'Nó (vật, con vật)',
    type: 'singular',
    isConfusingPair: false,
    subject: 'it',
    object: 'it',
    possessiveAdj: 'its',
    possessivePronoun: '(its)',
    reflexive: 'itself',
    exampleEn: (
      <span>
        The machine is precise. <strong className="text-primary font-bold">It</strong> calibrates{' '}
        <strong className="text-foreground font-bold">itself</strong> automatically.
      </span>
    ),
    exampleVi: 'Cỗ máy rất chính xác. Nó tự động hiệu chuẩn chính nó.',
  },
  {
    person: 'Ngôi 1 số nhiều',
    meaning: 'Chúng tôi / Chúng ta',
    type: 'plural',
    isConfusingPair: true,
    subject: 'we',
    object: 'us',
    possessiveAdj: 'our',
    possessivePronoun: 'ours',
    reflexive: 'ourselves',
    exampleEn: (
      <span>
        <strong className="text-primary font-bold">We</strong> submitted our proposal, and the board invited{' '}
        <strong className="text-emerald-700 dark:text-emerald-400 font-bold">us</strong>.
      </span>
    ),
    exampleVi: 'Chúng tôi đã nộp đề xuất, và hội đồng đã mời chúng tôi.',
  },
  {
    person: 'Ngôi 2 số nhiều',
    meaning: 'Các bạn',
    type: 'plural',
    isConfusingPair: false,
    subject: 'you',
    object: 'you',
    possessiveAdj: 'your',
    possessivePronoun: 'yours',
    reflexive: 'yourselves',
    exampleEn: (
      <span>
        <strong className="text-primary font-bold">You</strong> must review your code{' '}
        <strong className="text-foreground font-bold">yourselves</strong> before testing.
      </span>
    ),
    exampleVi: 'Các bạn phải tự mình kiểm tra mã nguồn trước khi thử nghiệm.',
  },
  {
    person: 'Ngôi 3 số nhiều',
    meaning: 'Họ / Chúng nó',
    type: 'plural',
    isConfusingPair: true,
    subject: 'they',
    object: 'them',
    possessiveAdj: 'their',
    possessivePronoun: 'theirs',
    reflexive: 'themselves',
    exampleEn: (
      <span>
        <strong className="text-primary font-bold">They</strong> presented results, and colleagues supported{' '}
        <strong className="text-emerald-700 dark:text-emerald-400 font-bold">them</strong>.
      </span>
    ),
    exampleVi: 'Họ đã trình bày kết quả, và các đồng nghiệp đã ủng hộ họ.',
  },
];

export default function PronounMatrixTable() {
  const [filterMode, setFilterMode] = useState<'all' | 'singular' | 'plural' | 'confusing'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredData = useMemo(() => {
    return PRONOUN_DATA.filter((row) => {
      // Mode filter
      if (filterMode === 'singular' && row.type !== 'singular') return false;
      if (filterMode === 'plural' && row.type !== 'plural') return false;
      if (filterMode === 'confusing' && !row.isConfusingPair) return false;

      // Search filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        row.person.toLowerCase().includes(q) ||
        row.meaning.toLowerCase().includes(q) ||
        row.subject.toLowerCase().includes(q) ||
        row.object.toLowerCase().includes(q) ||
        row.possessiveAdj.toLowerCase().includes(q) ||
        row.possessivePronoun.toLowerCase().includes(q) ||
        row.reflexive.toLowerCase().includes(q) ||
        row.exampleVi.toLowerCase().includes(q)
      );
    });
  }, [filterMode, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Table Header & Controls */}
      <div className="border border-border p-4 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-none">
        <div>
          <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-0.5">
            <Table className="h-3.5 w-3.5 text-primary" />
            Bảng tra cứu đại từ tiếng Anh
          </div>
          <div className="text-sm font-semibold text-foreground">
            Đối chiếu 8 ngôi đại từ: chủ ngữ, tân ngữ, sở hữu và phản thân
          </div>
        </div>

        {/* Quick Search */}
        <div className="relative min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm từ (vd: him, us)..."
            className="w-full pl-8 pr-3 py-1.5 border border-border bg-background rounded-none font-mono text-xs focus:outline-none focus:border-foreground"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-border pb-2 text-xs font-mono">
        <span className="text-muted-foreground mr-1 text-[11px] uppercase tracking-wider">Lọc nhanh:</span>
        <button
          onClick={() => setFilterMode('all')}
          className={`px-3 py-1 border transition-colors rounded-none ${
            filterMode === 'all'
              ? 'border-foreground bg-foreground text-background font-bold'
              : 'border-border bg-background text-muted-foreground hover:text-foreground'
          }`}
        >
          Tất cả (8 ngôi)
        </button>
        <button
          onClick={() => setFilterMode('singular')}
          className={`px-3 py-1 border transition-colors rounded-none ${
            filterMode === 'singular'
              ? 'border-foreground bg-foreground text-background font-bold'
              : 'border-border bg-background text-muted-foreground hover:text-foreground'
          }`}
        >
          Số ít (I, you, he, she, it)
        </button>
        <button
          onClick={() => setFilterMode('plural')}
          className={`px-3 py-1 border transition-colors rounded-none ${
            filterMode === 'plural'
              ? 'border-foreground bg-foreground text-background font-bold'
              : 'border-border bg-background text-muted-foreground hover:text-foreground'
          }`}
        >
          Số nhiều (we, you, they)
        </button>
        <button
          onClick={() => setFilterMode('confusing')}
          className={`px-3 py-1 border transition-colors rounded-none ${
            filterMode === 'confusing'
              ? 'border-foreground bg-foreground text-background font-bold'
              : 'border-border bg-background text-muted-foreground hover:text-foreground'
          }`}
        >
          Cặp hay nhầm (I/me, he/him...)
        </button>
      </div>

      {/* Main Table */}
      <div className="border border-border overflow-x-auto rounded-none bg-card">
        <table className="w-full text-left font-mono text-xs divide-y divide-border">
          <thead className="bg-muted/40 uppercase text-muted-foreground sticky top-0 z-10">
            <tr>
              <th className="p-3 border-r border-border min-w-[130px]">
                <div>Ngôi</div>
                <div className="text-[10px] text-muted-foreground/70 font-normal lowercase tracking-normal">nghĩa tiếng Việt</div>
              </th>
              <th className="p-3 border-r border-border min-w-[110px] text-primary font-bold">
                <div>Chủ ngữ (S)</div>
                <div className="text-[10px] text-primary/70 font-normal lowercase tracking-normal">đứng trước động từ</div>
              </th>
              <th className="p-3 border-r border-border min-w-[110px] text-emerald-700 dark:text-emerald-400 font-bold">
                <div>Tân ngữ (O)</div>
                <div className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 font-normal lowercase tracking-normal">đứng sau V / giới từ</div>
              </th>
              <th className="p-3 border-r border-border min-w-[110px]">
                <div>Tính từ sở hữu</div>
                <div className="text-[10px] text-muted-foreground/70 font-normal lowercase tracking-normal">+ danh từ phía sau</div>
              </th>
              <th className="p-3 border-r border-border min-w-[100px]">
                <div>Đại từ sở hữu</div>
                <div className="text-[10px] text-muted-foreground/70 font-normal lowercase tracking-normal">đứng độc lập</div>
              </th>
              <th className="p-3 border-r border-border min-w-[100px]">
                <div>Phản thân</div>
                <div className="text-[10px] text-muted-foreground/70 font-normal lowercase tracking-normal">chính mình</div>
              </th>
              <th className="p-3 min-w-[280px]">
                <div>Ví dụ thực tế</div>
                <div className="text-[10px] text-muted-foreground/70 font-normal lowercase tracking-normal">đối chiếu chủ ngữ và tân ngữ</div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filteredData.length > 0 ? (
              filteredData.map((row, idx) => (
                <tr key={idx} className="hover:bg-muted/10 transition-colors">
                  <td className="p-3 font-semibold text-foreground border-r border-border/60 bg-muted/5">
                    <div>{row.person}</div>
                    <div className="text-[11px] text-muted-foreground font-normal font-sans">{row.meaning}</div>
                  </td>
                  <td className="p-3 font-bold text-primary border-r border-border/60 bg-primary/5 text-sm">
                    {row.subject}
                  </td>
                  <td className="p-3 font-bold text-emerald-700 dark:text-emerald-400 border-r border-border/60 bg-emerald-500/5 text-sm">
                    {row.object}
                  </td>
                  <td className="p-3 font-medium text-foreground border-r border-border/60">
                    {row.possessiveAdj}
                  </td>
                  <td className="p-3 font-medium text-muted-foreground border-r border-border/60">
                    {row.possessivePronoun}
                  </td>
                  <td className="p-3 font-medium text-muted-foreground border-r border-border/60">
                    {row.reflexive}
                  </td>
                  <td className="p-3 space-y-0.5 font-sans">
                    <div className="text-xs text-foreground font-serif leading-relaxed">
                      {row.exampleEn}
                    </div>
                    <div className="text-[11px] text-muted-foreground leading-normal">
                      {row.exampleVi}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="p-6 text-center text-muted-foreground font-sans">
                  Không tìm thấy từ phù hợp với từ khóa &quot;{searchQuery}&quot;.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 4 Lưu ý quan trọng khi dùng */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className="border border-border p-3.5 bg-card rounded-none space-y-1.5">
          <div className="font-mono uppercase font-bold text-primary flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
            1. Vị trí trong câu (S vs O)
          </div>
          <p className="text-muted-foreground leading-relaxed">
            <strong>Chủ ngữ (S)</strong> luôn đứng trước động từ chính làm người thực hiện hành động (<em>I call, He speaks</em>). <strong>Tân ngữ (O)</strong> luôn đứng sau động từ hoặc sau giới từ nhận tác động (<em>Call me, Help them</em>).
          </p>
        </div>

        <div className="border border-border p-3.5 bg-card rounded-none space-y-1.5">
          <div className="font-mono uppercase font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            2. Lỗi hay gặp: Sau giới từ
          </div>
          <p className="text-muted-foreground leading-relaxed">
            Sau các giới từ như <em>between, for, with, to, except</em>, bắt buộc dùng dạng tân ngữ: <code className="bg-muted px-1">between you and me</code> (sai: <em>between you and I</em>).
          </p>
        </div>

        <div className="border border-border p-3.5 bg-card rounded-none space-y-1.5">
          <div className="font-mono uppercase font-bold text-foreground flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-primary" />
            3. Phân biệt &quot;Its&quot; và &quot;It&apos;s&quot;
          </div>
          <p className="text-muted-foreground leading-relaxed">
            <code className="bg-muted px-1">its</code> là tính từ sở hữu: của nó (không có dấu nháy: <em>its screen</em>). <code className="bg-muted px-1">it&apos;s</code> là dạng viết tắt của <em>it is</em> hoặc <em>it has</em>.
          </p>
        </div>

        <div className="border border-border p-3.5 bg-card rounded-none space-y-1.5">
          <div className="font-mono uppercase font-bold text-foreground flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5 text-primary" />
            4. Lưu ý: Đại từ phản thân
          </div>
          <p className="text-muted-foreground leading-relaxed">
            Đại từ phản thân (<em>myself, yourself</em>) dùng để nhấn mạnh hoặc khi chủ ngữ và tân ngữ cùng là một đối tượng. Không bao giờ làm chủ ngữ độc lập (không nói <em>&quot;Myself did it&quot;</em>, phải nói: <em>&quot;I did it myself&quot;</em>).
          </p>
        </div>
      </div>
    </div>
  );
}
