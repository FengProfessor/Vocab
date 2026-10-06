'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { Table, Search, CheckCircle2, AlertCircle, Info, BookOpen, Volume2, Sparkles, LayoutGrid } from 'lucide-react';
import { speak } from '@/lib/study';
import PronounVisualDeck from './PronounVisualDeck';

interface PronounRow {
  person: string;
  meaning: string;
  avatar: string;
  audio?: string;
  subject: string;
  object: string;
  possessiveAdj: string;
  possessivePronoun: string;
  reflexive: string;
  exampleEn: React.ReactNode;
  exampleSentenceRaw: string;
  exampleVi: string;
  type: 'singular' | 'plural';
  isConfusingPair?: boolean;
}

const PRONOUN_DATA: PronounRow[] = [
  {
    person: 'Ngôi 1 số ít',
    meaning: 'Tôi / Mình / Em',
    avatar: '/grammar/topics/personal-pronouns/v2_i.jpg',
    audio: '/grammar/topics/personal-pronouns/01.mp3',
    type: 'singular',
    isConfusingPair: true,
    subject: 'I',
    object: 'me',
    possessiveAdj: 'my',
    possessivePronoun: 'mine',
    reflexive: 'myself',
    exampleEn: (
      <span>
        <strong className="text-primary font-bold">I</strong> am a student. The teacher helps{' '}
        <strong className="text-emerald-700 dark:text-emerald-400 font-bold">me</strong>.
      </span>
    ),
    exampleSentenceRaw: 'I am a student. The teacher helps me.',
    exampleVi: 'Tôi là học sinh. Giáo viên giúp đỡ tôi.',
  },
  {
    person: 'Ngôi 2 số ít',
    meaning: 'Bạn / Cậu',
    avatar: '/grammar/topics/personal-pronouns/v2_you.jpg',
    audio: '/grammar/topics/personal-pronouns/03.mp3',
    type: 'singular',
    isConfusingPair: false,
    subject: 'you',
    object: 'you',
    possessiveAdj: 'your',
    possessivePronoun: 'yours',
    reflexive: 'yourself',
    exampleEn: (
      <span>
        <strong className="text-primary font-bold">You</strong> are my friend. I like{' '}
        <strong className="text-emerald-700 dark:text-emerald-400 font-bold">you</strong>.
      </span>
    ),
    exampleSentenceRaw: 'You are my friend. I like you.',
    exampleVi: 'Bạn là bạn của tôi. Tôi quý bạn.',
  },
  {
    person: 'Ngôi 3 số ít (Nam)',
    meaning: 'Anh ấy / Cậu ấy / Ông ấy',
    avatar: '/grammar/topics/personal-pronouns/v2_he.jpg',
    audio: '/grammar/topics/personal-pronouns/04.mp3',
    type: 'singular',
    isConfusingPair: true,
    subject: 'he',
    object: 'him',
    possessiveAdj: 'his',
    possessivePronoun: 'his',
    reflexive: 'himself',
    exampleEn: (
      <span>
        <strong className="text-primary font-bold">He</strong> is my brother. Everyone likes{' '}
        <strong className="text-emerald-700 dark:text-emerald-400 font-bold">him</strong>.
      </span>
    ),
    exampleSentenceRaw: 'He is my brother. Everyone likes him.',
    exampleVi: 'Anh ấy là anh trai tôi. Mọi người đều quý anh ấy.',
  },
  {
    person: 'Ngôi 3 số ít (Nữ)',
    meaning: 'Cô ấy / Chị ấy / Bà ấy',
    avatar: '/grammar/topics/personal-pronouns/v2_she.jpg',
    audio: '/grammar/topics/personal-pronouns/05.mp3',
    type: 'singular',
    isConfusingPair: true,
    subject: 'she',
    object: 'her',
    possessiveAdj: 'her',
    possessivePronoun: 'hers',
    reflexive: 'herself',
    exampleEn: (
      <span>
        <strong className="text-primary font-bold">She</strong> is a teacher. We love{' '}
        <strong className="text-emerald-700 dark:text-emerald-400 font-bold">her</strong>.
      </span>
    ),
    exampleSentenceRaw: 'She is a teacher. We love her.',
    exampleVi: 'Cô ấy là giáo viên. Chúng tôi yêu quý cô ấy.',
  },
  {
    person: 'Ngôi 3 số ít (Vật/Con vật)',
    meaning: 'Nó',
    avatar: '/grammar/topics/personal-pronouns/v2_it.jpg',
    audio: '/grammar/topics/personal-pronouns/06.mp3',
    type: 'singular',
    isConfusingPair: false,
    subject: 'it',
    object: 'it',
    possessiveAdj: 'its',
    possessivePronoun: '(its)',
    reflexive: 'itself',
    exampleEn: (
      <span>
        <strong className="text-primary font-bold">It</strong> is a cute puppy. I feed{' '}
        <strong className="text-emerald-700 dark:text-emerald-400 font-bold">it</strong> every day.
      </span>
    ),
    exampleSentenceRaw: 'It is a cute puppy. I feed it every day.',
    exampleVi: 'Nó là một chú cún dễ thương. Tôi cho nó ăn mỗi ngày.',
  },
  {
    person: 'Ngôi 1 số nhiều',
    meaning: 'Chúng tôi / Chúng ta',
    avatar: '/grammar/topics/personal-pronouns/v2_we.jpg',
    audio: '/grammar/topics/personal-pronouns/07.mp3',
    type: 'plural',
    isConfusingPair: true,
    subject: 'we',
    object: 'us',
    possessiveAdj: 'our',
    possessivePronoun: 'ours',
    reflexive: 'ourselves',
    exampleEn: (
      <span>
        <strong className="text-primary font-bold">We</strong> study English together. The teacher teaches{' '}
        <strong className="text-emerald-700 dark:text-emerald-400 font-bold">us</strong>.
      </span>
    ),
    exampleSentenceRaw: 'We study English together. The teacher teaches us.',
    exampleVi: 'Chúng tôi cùng học tiếng Anh. Thầy giáo dạy chúng tôi.',
  },
  {
    person: 'Ngôi 2 số nhiều',
    meaning: 'Các bạn',
    avatar: '/grammar/topics/personal-pronouns/v2_you.jpg',
    audio: '/grammar/topics/personal-pronouns/03.mp3',
    type: 'plural',
    isConfusingPair: false,
    subject: 'you',
    object: 'you',
    possessiveAdj: 'your',
    possessivePronoun: 'yours',
    reflexive: 'yourselves',
    exampleEn: (
      <span>
        <strong className="text-primary font-bold">You</strong> are great students. I will guide{' '}
        <strong className="text-emerald-700 dark:text-emerald-400 font-bold">you</strong>.
      </span>
    ),
    exampleSentenceRaw: 'You are great students. I will guide you.',
    exampleVi: 'Các bạn là những học sinh tuyệt vời. Tôi sẽ hướng dẫn các bạn.',
  },
  {
    person: 'Ngôi 3 số nhiều',
    meaning: 'Họ / Chúng nó',
    avatar: '/grammar/topics/personal-pronouns/v2_they.jpg',
    audio: '/grammar/topics/personal-pronouns/08.mp3',
    type: 'plural',
    isConfusingPair: true,
    subject: 'they',
    object: 'them',
    possessiveAdj: 'their',
    possessivePronoun: 'theirs',
    reflexive: 'themselves',
    exampleEn: (
      <span>
        <strong className="text-primary font-bold">They</strong> play football outside. Look at{' '}
        <strong className="text-emerald-700 dark:text-emerald-400 font-bold">them</strong>.
      </span>
    ),
    exampleSentenceRaw: 'They play football outside. Look at them.',
    exampleVi: 'Họ đang chơi bóng đá ngoài trời. Hãy nhìn họ kìa.',
  },
];

export default function PronounMatrixTable() {
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const [filterMode, setFilterMode] = useState<'all' | 'singular' | 'plural' | 'confusing'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const playPronunciation = (text: string) => {
    speak(text, 0.9);
  };

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
      {/* View Mode Switcher Header */}
      <div className="border border-border p-4 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-none">
        <div>
          <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-0.5">
            <Table className="h-3.5 w-3.5 text-primary" />
            Bảng tra cứu & Thẻ trực quan Đại từ nhân xưng
          </div>
          <div className="text-sm font-semibold text-foreground">
            Đối chiếu 8 ngôi đại từ: có ảnh minh họa thực tế, âm thanh phát âm và ví dụ song ngữ
          </div>
        </div>

        {/* View Toggle Buttons */}
        <div className="flex items-center gap-1.5 shrink-0 bg-background border border-border p-1">
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors ${
              viewMode === 'cards'
                ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Thẻ trực quan</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors ${
              viewMode === 'table'
                ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Bảng ma trận</span>
          </button>
        </div>
      </div>

      {/* Visual Cards View Mode */}
      {viewMode === 'cards' ? (
        <PronounVisualDeck />
      ) : (
        /* Detailed Matrix Table View Mode */
        <div className="space-y-4">
          {/* Controls: Search & Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
              <span className="text-muted-foreground mr-1 text-[11px] uppercase tracking-wider">Lọc:</span>
              <button
                type="button"
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
                type="button"
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
                type="button"
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
                type="button"
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

            {/* Quick Search */}
            <div className="relative min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm từ (vd: him, we)..."
                className="w-full pl-8 pr-3 py-1.5 border border-border bg-background rounded-none font-mono text-xs focus:outline-none focus:border-foreground"
              />
            </div>
          </div>

          {/* Main Table with Avatars & Audio */}
          <div className="border border-border overflow-x-auto rounded-none bg-card">
            <table className="w-full text-left font-mono text-xs divide-y divide-border">
              <thead className="bg-muted/40 uppercase text-muted-foreground sticky top-0 z-10">
                <tr>
                  <th className="p-3 border-r border-border min-w-[170px]">
                    <div>Ngôi & Hình ảnh</div>
                    <div className="text-[10px] text-muted-foreground/70 font-normal lowercase tracking-normal">nghĩa tiếng Việt</div>
                  </th>
                  <th className="p-3 border-r border-border min-w-[120px] text-primary font-bold">
                    <div>Chủ ngữ (S)</div>
                    <div className="text-[10px] text-primary/70 font-normal lowercase tracking-normal">đứng trước động từ</div>
                  </th>
                  <th className="p-3 border-r border-border min-w-[120px] text-emerald-700 dark:text-emerald-400 font-bold">
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
                  <th className="p-3 border-r border-border min-w-[110px]">
                    <div>Phản thân</div>
                    <div className="text-[10px] text-muted-foreground/70 font-normal lowercase tracking-normal">chính mình</div>
                  </th>
                  <th className="p-3 min-w-[300px]">
                    <div>Ví dụ thực tế</div>
                    <div className="text-[10px] text-muted-foreground/70 font-normal lowercase tracking-normal">đối chiếu chủ ngữ và tân ngữ</div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredData.length > 0 ? (
                  filteredData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-muted/10 transition-colors">
                      {/* Avatar + Person + Vietnamese Meaning */}
                      <td className="p-3 font-semibold text-foreground border-r border-border/60 bg-muted/5">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 shrink-0 border border-border bg-muted/40 overflow-hidden shadow-xs">
                            <Image
                              src={row.avatar}
                              alt={row.meaning}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-foreground">{row.person}</div>
                            <div className="text-[11px] text-primary font-medium font-sans">{row.meaning}</div>
                          </div>
                        </div>
                      </td>

                      {/* Subject Pronoun with Audio */}
                      <td className="p-3 font-bold text-primary border-r border-border/60 bg-primary/5 text-sm">
                        <div className="flex items-center justify-between gap-1">
                          <span>{row.subject}</span>
                          <button
                            type="button"
                            onClick={() => playPronunciation(row.subject)}
                            className="p-1 text-primary/70 hover:text-primary transition-colors"
                            title={`Nghe "${row.subject}"`}
                          >
                            <Volume2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Object Pronoun with Audio */}
                      <td className="p-3 font-bold text-emerald-700 dark:text-emerald-400 border-r border-border/60 bg-emerald-500/5 text-sm">
                        <div className="flex items-center justify-between gap-1">
                          <span>{row.object}</span>
                          <button
                            type="button"
                            onClick={() => playPronunciation(row.object)}
                            className="p-1 text-emerald-600/70 dark:text-emerald-400/70 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                            title={`Nghe "${row.object}"`}
                          >
                            <Volume2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Possessive Adjective */}
                      <td className="p-3 font-medium text-foreground border-r border-border/60">
                        {row.possessiveAdj}
                      </td>

                      {/* Possessive Pronoun */}
                      <td className="p-3 font-medium text-muted-foreground border-r border-border/60">
                        {row.possessivePronoun}
                      </td>

                      {/* Reflexive Pronoun */}
                      <td className="p-3 font-medium text-muted-foreground border-r border-border/60">
                        {row.reflexive}
                      </td>

                      {/* Example with Audio Button */}
                      <td className="p-3 space-y-1 font-sans">
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-xs text-foreground font-serif leading-relaxed">
                            {row.exampleEn}
                          </div>
                          <button
                            type="button"
                            onClick={() => playPronunciation(row.exampleSentenceRaw)}
                            className="p-1 text-muted-foreground hover:text-foreground shrink-0 transition-colors"
                            title="Nghe câu ví dụ"
                          >
                            <Volume2 className="h-3.5 w-3.5" />
                          </button>
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
        </div>
      )}

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
