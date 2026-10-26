'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Volume2,
  Sparkles,
  Lightbulb,
  Utensils,
  Activity,
  Briefcase,
  Users,
  CheckCircle2,
  ArrowRight,
  Dumbbell,
  RotateCcw,
  ChevronDown,
} from 'lucide-react';
import { grammarAudio } from '@/lib/grammar/grammarAudioManager';
import GrammarCardNavigator from './GrammarCardNavigator';

export interface SvoSentenceItem {
  id: string;
  vi: string;
  viS: string;
  viV: string;
  viO: string;
  roleExplanation: {
    s: string;
    v: string;
    o: string;
  };
  en: string;
  enS: string;
  enV: string;
  enO: string;
  note?: string;
}

export interface SvoGroup {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  icon: 'utensils' | 'activity' | 'briefcase' | 'users';
  sentences: SvoSentenceItem[];
}

export const SVO_GROUPS: SvoGroup[] = [
  {
    id: 'food',
    label: 'Ăn uống & Nhu cầu',
    shortLabel: 'Ăn uống',
    description: 'Các câu cơ bản về ăn uống, tiêu dùng hàng ngày',
    icon: 'utensils',
    sentences: [
      {
        id: 'svo-food-01',
        vi: 'Tôi ăn cơm.',
        viS: 'Tôi',
        viV: 'ăn',
        viO: 'cơm',
        roleExplanation: {
          s: 'Ai: Tôi (I)',
          v: 'Hành động: ăn (eat)',
          o: 'Cái gì: cơm (rice)',
        },
        en: 'I eat rice.',
        enS: 'I',
        enV: 'eat',
        enO: 'rice',
        note: 'Trật tự từ giống hệt tiếng Việt: Ai làm + Làm gì + Cái gì.',
      },
      {
        id: 'svo-food-02',
        vi: 'Tôi uống nước.',
        viS: 'Tôi',
        viV: 'uống',
        viO: 'nước',
        roleExplanation: {
          s: 'Ai: Tôi (I)',
          v: 'Hành động: uống (drink)',
          o: 'Cái gì: nước (water)',
        },
        en: 'I drink water.',
        enS: 'I',
        enV: 'drink',
        enO: 'water',
        note: 'Động từ "drink" đi thẳng với tân ngữ "water" không cần giới từ.',
      },
      {
        id: 'svo-food-03',
        vi: 'Chúng tôi ăn bánh mì.',
        viS: 'Chúng tôi',
        viV: 'ăn',
        viO: 'bánh mì',
        roleExplanation: {
          s: 'Ai: Chúng tôi (We)',
          v: 'Hành động: ăn (eat)',
          o: 'Cái gì: bánh mì (bread)',
        },
        en: 'We eat bread.',
        enS: 'We',
        enV: 'eat',
        enO: 'bread',
        note: 'Chủ ngữ "We" (Chúng tôi) đi với động từ nguyên mẫu "eat".',
      },
      {
        id: 'svo-food-04',
        vi: 'Họ uống cà phê.',
        viS: 'Họ',
        viV: 'uống',
        viO: 'cà phê',
        roleExplanation: {
          s: 'Ai: Họ (They)',
          v: 'Hành động: uống (drink)',
          o: 'Cái gì: cà phê (coffee)',
        },
        en: 'They drink coffee.',
        enS: 'They',
        enV: 'drink',
        enO: 'coffee',
        note: 'Cấu trúc vẫn là 3 khối: S (They) + V (drink) + O (coffee).',
      },
      {
        id: 'svo-food-05',
        vi: 'Cô ấy uống sữa.',
        viS: 'Cô ấy',
        viV: 'uống',
        viO: 'sữa',
        roleExplanation: {
          s: 'Ai: Cô ấy (She)',
          v: 'Hành động: uống (drinks)',
          o: 'Cái gì: sữa (milk)',
        },
        en: 'She drinks milk.',
        enS: 'She',
        enV: 'drinks',
        enO: 'milk',
        note: 'Chủ ngữ ngôi thứ ba "She" thì động từ thêm -s ("drinks").',
      },
      {
        id: 'svo-food-06',
        vi: 'Chúng tôi mua hoa quả.',
        viS: 'Chúng tôi',
        viV: 'mua',
        viO: 'hoa quả',
        roleExplanation: {
          s: 'Ai: Chúng tôi (We)',
          v: 'Hành động: mua (buy)',
          o: 'Cái gì: hoa quả (fruits)',
        },
        en: 'We buy fruits.',
        enS: 'We',
        enV: 'buy',
        enO: 'fruits',
        note: 'Động từ "buy" (mua) mở rộng thêm các tình huống mua sắm hàng ngày.',
      },
    ],
  },
  {
    id: 'habits',
    label: 'Sinh hoạt & Sở thích',
    shortLabel: 'Sinh hoạt',
    description: 'Thói quen, giải trí và sinh hoạt thường nhật quen thuộc',
    icon: 'activity',
    sentences: [
      {
        id: 'svo-habit-01',
        vi: 'Tôi đọc sách.',
        viS: 'Tôi',
        viV: 'đọc',
        viO: 'sách',
        roleExplanation: {
          s: 'Ai: Tôi (I)',
          v: 'Hành động: đọc (read)',
          o: 'Cái gì: sách (books)',
        },
        en: 'I read books.',
        enS: 'I',
        enV: 'read',
        enO: 'books',
        note: 'Tân ngữ "books" thêm "s" để chỉ thói quen đọc sách nói chung.',
      },
      {
        id: 'svo-habit-02',
        vi: 'Bạn nghe nhạc.',
        viS: 'Bạn',
        viV: 'nghe',
        viO: 'nhạc',
        roleExplanation: {
          s: 'Ai: Bạn (You)',
          v: 'Hành động: nghe (listen to)',
          o: 'Cái gì: nhạc (music)',
        },
        en: 'You listen to music.',
        enS: 'You',
        enV: 'listen to',
        enO: 'music',
        note: '"listen to" đi liền nhau như một cụm hành động hướng tới âm nhạc.',
      },
      {
        id: 'svo-habit-03',
        vi: 'Chúng tôi xem tivi.',
        viS: 'Chúng tôi',
        viV: 'xem',
        viO: 'tivi',
        roleExplanation: {
          s: 'Ai: Chúng tôi (We)',
          v: 'Hành động: xem (watch)',
          o: 'Cái gì: tivi (TV)',
        },
        en: 'We watch TV.',
        enS: 'We',
        enV: 'watch',
        enO: 'TV',
        note: 'Xem màn hình, chương trình dùng động từ "watch".',
      },
      {
        id: 'svo-habit-04',
        vi: 'Họ chơi bóng đá.',
        viS: 'Họ',
        viV: 'chơi',
        viO: 'bóng đá',
        roleExplanation: {
          s: 'Ai: Họ (They)',
          v: 'Hành động: chơi (play)',
          o: 'Cái gì: bóng đá (football)',
        },
        en: 'They play football.',
        enS: 'They',
        enV: 'play',
        enO: 'football',
        note: 'Tên môn thể thao đứng trực tiếp sau động từ "play" không cần mạo từ.',
      },
      {
        id: 'svo-habit-05',
        vi: 'Anh ấy rửa xe hơi.',
        viS: 'Anh ấy',
        viV: 'rửa',
        viO: 'xe hơi',
        roleExplanation: {
          s: 'Ai: Anh ấy (He)',
          v: 'Hành động: rửa (washes)',
          o: 'Cái gì: xe hơi (the car)',
        },
        en: 'He washes the car.',
        enS: 'He',
        enV: 'washes',
        enO: 'the car',
        note: 'Động từ tận cùng bằng "sh" thì thêm -es ("washes") khi đi với "He".',
      },
      {
        id: 'svo-habit-06',
        vi: 'Cô ấy dọn phòng.',
        viS: 'Cô ấy',
        viV: 'dọn',
        viO: 'phòng',
        roleExplanation: {
          s: 'Ai: Cô ấy (She)',
          v: 'Hành động: dọn (cleans)',
          o: 'Cái gì: phòng (the room)',
        },
        en: 'She cleans the room.',
        enS: 'She',
        enV: 'cleans',
        enO: 'the room',
        note: 'Cụm từ sinh hoạt quen thuộc: She cleans the room.',
      },
    ],
  },
  {
    id: 'work',
    label: 'Học tập & Công việc',
    shortLabel: 'Công việc',
    description: 'Nhiệm vụ học tập và công việc thực tế',
    icon: 'briefcase',
    sentences: [
      {
        id: 'svo-work-01',
        vi: 'Chúng tôi học tiếng Anh.',
        viS: 'Chúng tôi',
        viV: 'học',
        viO: 'tiếng Anh',
        roleExplanation: {
          s: 'Ai: Chúng tôi (We)',
          v: 'Hành động: học (learn)',
          o: 'Cái gì: tiếng Anh (English)',
        },
        en: 'We learn English.',
        enS: 'We',
        enV: 'learn',
        enO: 'English',
        note: 'Tên ngôn ngữ "English" luôn viết hoa chữ cái đầu.',
      },
      {
        id: 'svo-work-02',
        vi: 'Cô ấy dạy toán.',
        viS: 'Cô ấy',
        viV: 'dạy',
        viO: 'toán',
        roleExplanation: {
          s: 'Ai: Cô ấy (She)',
          v: 'Hành động: dạy (teaches)',
          o: 'Cái gì: toán (math)',
        },
        en: 'She teaches math.',
        enS: 'She',
        enV: 'teaches',
        enO: 'math',
        note: 'Với chủ ngữ "She", động từ "teach" thêm -es thành "teaches".',
      },
      {
        id: 'svo-work-03',
        vi: 'Bố tôi lái xe hơi.',
        viS: 'Bố tôi',
        viV: 'lái',
        viO: 'xe hơi',
        roleExplanation: {
          s: 'Ai: Bố tôi (My father)',
          v: 'Hành động: lái (drives)',
          o: 'Cái gì: xe hơi (a car)',
        },
        en: 'My father drives a car.',
        enS: 'My father',
        enV: 'drives',
        enO: 'a car',
        note: 'Chủ ngữ có thể là một cụm từ ("My father") và tân ngữ có thể kèm "a car".',
      },
      {
        id: 'svo-work-04',
        vi: 'Mẹ tôi nấu bữa tối.',
        viS: 'Mẹ tôi',
        viV: 'nấu',
        viO: 'bữa tối',
        roleExplanation: {
          s: 'Ai: Mẹ tôi (My mother)',
          v: 'Hành động: nấu (cooks)',
          o: 'Cái gì: bữa tối (dinner)',
        },
        en: 'My mother cooks dinner.',
        enS: 'My mother',
        enV: 'cooks',
        enO: 'dinner',
        note: 'Khung 3 khối giữ nguyên: My mother [S] + cooks [V] + dinner [O].',
      },
      {
        id: 'svo-work-05',
        vi: 'Anh ấy gửi email.',
        viS: 'Anh ấy',
        viV: 'gửi',
        viO: 'email',
        roleExplanation: {
          s: 'Ai: Anh ấy (He)',
          v: 'Hành động: gửi (sends)',
          o: 'Cái gì: email (an email)',
        },
        en: 'He sends an email.',
        enS: 'He',
        enV: 'sends',
        enO: 'an email',
        note: 'Công việc văn phòng quen thuộc: He [S] + sends [V] + an email [O].',
      },
      {
        id: 'svo-work-06',
        vi: 'Tôi viết báo cáo.',
        viS: 'Tôi',
        viV: 'viết',
        viO: 'báo cáo',
        roleExplanation: {
          s: 'Ai: Tôi (I)',
          v: 'Hành động: viết (write)',
          o: 'Cái gì: báo cáo (reports)',
        },
        en: 'I write reports.',
        enS: 'I',
        enV: 'write',
        enO: 'reports',
        note: 'Động từ "write" đi trực tiếp với danh từ tân ngữ "reports".',
      },
    ],
  },
  {
    id: 'interpersonal',
    label: 'Giao tiếp & Tương tác',
    shortLabel: 'Giao tiếp',
    description: 'Đối thoại giữa người với người và cách đổi đại từ (I ➔ me)',
    icon: 'users',
    sentences: [
      {
        id: 'svo-person-01',
        vi: 'Tôi yêu bạn.',
        viS: 'Tôi',
        viV: 'yêu',
        viO: 'bạn',
        roleExplanation: {
          s: 'Ai làm: Tôi (I)',
          v: 'Cảm xúc: yêu (love)',
          o: 'Ai nhận: bạn (you)',
        },
        en: 'I love you.',
        enS: 'I',
        enV: 'love',
        enO: 'you',
        note: 'Khi "Tôi" làm hành động ở đầu câu, tiếng Anh dùng "I".',
      },
      {
        id: 'svo-person-02',
        vi: 'Bạn yêu tôi.',
        viS: 'Bạn',
        viV: 'yêu',
        viO: 'tôi',
        roleExplanation: {
          s: 'Ai làm: Bạn (You)',
          v: 'Cảm xúc: yêu (love)',
          o: 'Ai nhận: tôi (me)',
        },
        en: 'You love me.',
        enS: 'You',
        enV: 'love',
        enO: 'me',
        note: '⭐ Đổi vai: Khi "tôi" nhận hành động ở cuối câu, tiếng Anh đổi sang "me"!',
      },
      {
        id: 'svo-person-03',
        vi: 'Tôi giúp anh ấy.',
        viS: 'Tôi',
        viV: 'giúp',
        viO: 'anh ấy',
        roleExplanation: {
          s: 'Ai làm: Tôi (I)',
          v: 'Hành động: giúp (help)',
          o: 'Ai nhận: anh ấy (him)',
        },
        en: 'I help him.',
        enS: 'I',
        enV: 'help',
        enO: 'him',
        note: '⭐ Khi "anh ấy" nhận sự giúp đỡ, dùng "him" (không dùng he).',
      },
      {
        id: 'svo-person-04',
        vi: 'Anh ấy giúp tôi.',
        viS: 'Anh ấy',
        viV: 'giúp',
        viO: 'tôi',
        roleExplanation: {
          s: 'Ai làm: Anh ấy (He)',
          v: 'Hành động: giúp (helps)',
          o: 'Ai nhận: tôi (me)',
        },
        en: 'He helps me.',
        enS: 'He',
        enV: 'helps',
        enO: 'me',
        note: '"Anh ấy" làm chủ ngữ dùng "He", "tôi" nhận hành động dùng "me".',
      },
      {
        id: 'svo-person-05',
        vi: 'Cô ấy gọi chúng tôi.',
        viS: 'Cô ấy',
        viV: 'gọi',
        viO: 'chúng tôi',
        roleExplanation: {
          s: 'Ai làm: Cô ấy (She)',
          v: 'Hành động: gọi (calls)',
          o: 'Ai nhận: chúng tôi (us)',
        },
        en: 'She calls us.',
        enS: 'She',
        enV: 'calls',
        enO: 'us',
        note: '⭐ Khi "chúng tôi" nhận hành động, đổi từ "we" sang "us".',
      },
      {
        id: 'svo-person-06',
        vi: 'Chúng tôi cảm ơn cô ấy.',
        viS: 'Chúng tôi',
        viV: 'cảm ơn',
        viO: 'cô ấy',
        roleExplanation: {
          s: 'Ai làm: Chúng tôi (We)',
          v: 'Hành động: cảm ơn (thank)',
          o: 'Ai nhận: cô ấy (her)',
        },
        en: 'We thank her.',
        enS: 'We',
        enV: 'thank',
        enO: 'her',
        note: '⭐ "Chúng tôi" làm chủ ngữ dùng "We", "cô ấy" nhận hành động dùng "her".',
      },
    ],
  },
];

function CategoryIcon({ icon }: { icon: SvoGroup['icon'] }) {
  switch (icon) {
    case 'utensils':
      return <Utensils className="h-4 w-4 shrink-0" />;
    case 'activity':
      return <Activity className="h-4 w-4 shrink-0" />;
    case 'briefcase':
      return <Briefcase className="h-4 w-4 shrink-0" />;
    case 'users':
      return <Users className="h-4 w-4 shrink-0" />;
    default:
      return null;
  }
}

export default function SvoSentenceVisualDeck({
  guided = false,
}: {
  guided?: boolean;
}) {
  const [activeCategoryIdx, setActiveCategoryIdx] = useState(0);
  const [audioState, setAudioState] = useState<{ isPlaying: boolean; activeId: string | null }>({
    isPlaying: false,
    activeId: null,
  });

  useEffect(() => {
    return grammarAudio.subscribe(setAudioState);
  }, []);

  const playSentenceAudio = (id: string, text: string) => {
    grammarAudio.play(id, text);
  };

  const currentGroup = SVO_GROUPS[activeCategoryIdx] || SVO_GROUPS[0];
  const isLastSvoGroup = activeCategoryIdx === SVO_GROUPS.length - 1;

  return (
    <div className="space-y-3 sm:space-y-4 max-w-4xl mx-auto min-w-0">
      {/* Guided Category Navigator */}
      {guided ? (
        <GrammarCardNavigator
          titles={SVO_GROUPS.map((g) => `${g.label} — ${g.description}`)}
          pills={SVO_GROUPS.map((g) => ({ label: g.shortLabel }))}
          index={activeCategoryIdx}
          onChange={(nextIdx) => {
            grammarAudio.stopAll();
            setActiveCategoryIdx(nextIdx);
          }}
          onComplete={() => {
            grammarAudio.stopAll();
            if (typeof window !== 'undefined') {
              window.location.href = '/grammar/practice?topic=sentence-structure-svo';
            }
          }}
          completeLabel="Luyện tập"
        />
      ) : null}

      {/* Guided Top Legend Pill Bar */}
      {guided ? (
        <div className="flex items-center justify-between gap-2 px-1 py-0.5 text-xs">
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Trật tự 3 khối tương đương trực quan giữa 2 ngôn ngữ:
          </span>
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-sky-400/50 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 rounded-none font-mono text-[11px] font-medium">
              [S] Ai làm
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-amber-400/50 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 rounded-none font-mono text-[11px] font-medium">
              [V] Làm gì
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-emerald-400/50 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-none font-mono text-[11px] font-medium">
              [O] Cái gì / Ai
            </span>
          </div>
        </div>
      ) : (
        /* Hero Header Card: Khi xem standalone ngoài modal */
        <details
          open={!guided}
          className="border border-border bg-card p-3 sm:p-4 rounded-none shadow-xs group"
        >
          <summary className="list-none cursor-pointer flex items-center justify-between gap-2 select-none">
            <div className="min-w-0">
              <div className="flex items-center gap-2 font-mono text-[11px] sm:text-xs uppercase tracking-wider text-primary font-bold">
                <Sparkles className="h-3.5 w-3.5 shrink-0" />
                <span>Bài số 0 • Cấu trúc câu căn bản (S + V + O)</span>
              </div>
              <h2 className="text-sm sm:text-lg font-bold text-foreground mt-0.5">
                Mô hình 3 Khối SVO: Bắc cầu trực giác Việt ➔ Anh
              </h2>
            </div>
            <span className="font-mono text-[11px] px-2 py-1 border border-border bg-muted/30 text-muted-foreground rounded-none inline-flex items-center gap-1 shrink-0">
              <span className="hidden sm:inline">Giải thích S-V-O</span>
              <span className="sm:hidden">Mẹo S-V-O</span>
              <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
            </span>
          </summary>

          <div className="space-y-3 pt-2.5 mt-2.5 border-t border-border/60">
            <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
              Trật tự câu kể cơ bản trong tiếng Anh giống hệt tiếng Việt:
              <strong className="text-foreground ml-1 font-mono">TÔI [S] + ĂN [V] + CƠM [O]</strong> ➔{' '}
              <strong className="text-foreground font-mono">I [S] + eat [V] + rice [O]</strong>.
            </p>

            {/* 3 Colored Structural Reference Blocks */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              {/* S Block */}
              <div className="border border-sky-400 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 p-2.5 sm:p-3 rounded-none flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold px-1.5 py-0.5 border border-sky-400/50 bg-sky-100/80 dark:bg-sky-900/40 rounded-none">
                    [S] Chủ ngữ
                  </span>
                  <span className="font-mono text-[11px] opacity-80">Subject</span>
                </div>
                <div className="mt-2 text-xs">
                  <p className="font-bold text-sm">Ai làm?</p>
                  <p className="text-[11px] opacity-80 mt-0.5">Người, con vật hoặc đồ vật thực hiện hành động</p>
                </div>
              </div>

              {/* V Block */}
              <div className="border border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 p-2.5 sm:p-3 rounded-none flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold px-1.5 py-0.5 border border-amber-400/50 bg-amber-100/80 dark:bg-amber-900/40 rounded-none">
                    [V] Động từ
                  </span>
                  <span className="font-mono text-[11px] opacity-80">Verb</span>
                </div>
                <div className="mt-2 text-xs">
                  <p className="font-bold text-sm">Làm gì?</p>
                  <p className="text-[11px] opacity-80 mt-0.5">Hành động diễn ra (ăn, uống, học, đọc, gửi...)</p>
                </div>
              </div>

              {/* O Block */}
              <div className="border border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 p-2.5 sm:p-3 rounded-none flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold px-1.5 py-0.5 border border-emerald-400/50 bg-emerald-100/80 dark:bg-emerald-900/40 rounded-none">
                    [O] Tân ngữ
                  </span>
                  <span className="font-mono text-[11px] opacity-80">Object</span>
                </div>
                <div className="mt-2 text-xs">
                  <p className="font-bold text-sm">Cái gì / Ai?</p>
                  <p className="text-[11px] opacity-80 mt-0.5">Đối tượng chịu tác động từ hành động của S</p>
                </div>
              </div>
            </div>
          </div>
        </details>
      )}

      {/* Non-guided Segmented Tabs */}
      {!guided && (
        <div
          role="tablist"
          aria-label="Nhóm ngữ cảnh SVO"
          className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border/40 scrollbar-none"
        >
          {SVO_GROUPS.map((group, idx) => {
            const isActive = activeCategoryIdx === idx;
            return (
              <button
                key={group.id}
                role="tab"
                aria-selected={isActive}
                tabIndex={isActive ? 0 : -1}
                type="button"
                onClick={() => {
                  grammarAudio.stopAll();
                  setActiveCategoryIdx(idx);
                }}
                className={`min-h-[44px] px-3.5 py-2 font-mono text-xs uppercase tracking-wider font-medium rounded-none border transition-colors whitespace-nowrap flex items-center gap-2 touch-manipulation cursor-pointer ${
                  isActive
                    ? 'border-foreground bg-foreground text-background font-bold'
                    : 'border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                <CategoryIcon icon={group.icon} />
                <span>{group.shortLabel}</span>
                <span className="text-[10px] opacity-60">({group.sentences.length})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Active Group info */}
      <div className="flex items-center justify-between text-xs font-mono text-muted-foreground px-1">
        <div className="flex items-center gap-1.5">
          <CategoryIcon icon={currentGroup.icon} />
          <span className="font-bold text-foreground uppercase">{currentGroup.shortLabel}</span>
          <span className="opacity-50">•</span>
          <span className="text-muted-foreground hidden sm:inline">Đối chiếu song ngữ trực quan</span>
        </div>
        <span className="text-primary font-bold">{currentGroup.sentences.length} câu ví dụ</span>
      </div>

      {/* Sentences of Active Group: Giao diện trực quan Song ngữ Việt trên - Anh dưới */}
      <div role="tabpanel" className="space-y-3">
        {currentGroup.sentences.map((sentence, sIdx) => {
          const isPlayingThis = audioState.activeId === sentence.id;

          return (
            <div
              key={sentence.id}
              className="border border-border bg-card p-3 sm:p-4 rounded-none transition-colors hover:border-foreground/30 shadow-xs space-y-2.5"
            >
              {/* Header row: Number counter and 1-tap Audio Play Button */}
              <div className="flex items-center justify-between border-b border-border/50 pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-muted-foreground px-2 py-0.5 border border-border bg-muted/40 rounded-none">
                    #{sIdx + 1 < 10 ? `0${sIdx + 1}` : sIdx + 1}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                      try {
                        navigator.vibrate(8);
                      } catch {}
                    }
                    playSentenceAudio(sentence.id, sentence.en);
                  }}
                  className={`min-h-[44px] min-w-[44px] px-3 py-1.5 border font-mono text-xs flex items-center justify-center gap-1.5 transition-all rounded-none touch-manipulation cursor-pointer ${
                    isPlayingThis
                      ? 'border-emerald-500 bg-emerald-500 text-white font-bold animate-pulse'
                      : 'border-border bg-background hover:bg-muted text-foreground'
                  }`}
                  title={`Nghe phát âm: "${sentence.en}"`}
                  aria-label={`Nghe phát âm: ${sentence.en}`}
                >
                  <Volume2 className="h-4 w-4" />
                  <span className="text-xs font-sans font-medium">
                    {isPlayingThis ? 'Đang đọc...' : 'Nghe audio'}
                  </span>
                </button>
              </div>

              {/* Main content: Grid on large screens (Left: VN on top, EN on bottom. Right: Note) */}
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 sm:gap-4 items-center">
                {/* Parallel Sentences Column: Tiếng Việt trên, Tiếng Anh dưới */}
                <div className="space-y-2">
                  {/* Tiếng Việt ở trên */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="sr-only">Tiếng Việt:</span>
                    <div className="inline-flex items-center gap-1.5 flex-wrap text-sm sm:text-base font-semibold">
                      <span className="px-2.5 py-1 border border-sky-400 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 rounded-none inline-flex items-center gap-1">
                        <span className="font-mono text-[10px] font-bold opacity-70">[S]</span>
                        <span>{sentence.viS}</span>
                      </span>
                      <span className="px-2.5 py-1 border border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 rounded-none inline-flex items-center gap-1">
                        <span className="font-mono text-[10px] font-bold opacity-70">[V]</span>
                        <span>{sentence.viV}</span>
                      </span>
                      <span className="px-2.5 py-1 border border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-none inline-flex items-center gap-1">
                        <span className="font-mono text-[10px] font-bold opacity-70">[O]</span>
                        <span>{sentence.viO}</span>
                      </span>
                      <span className="text-muted-foreground font-bold">.</span>
                    </div>
                  </div>

                  {/* Tiếng Anh ở dưới */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="sr-only">Tiếng Anh:</span>
                    <div className="inline-flex items-center gap-1.5 flex-wrap text-base sm:text-lg font-bold font-mono">
                      <span className="px-2.5 py-1 border border-sky-400 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 rounded-none inline-flex items-center gap-1.5">
                        <span className="text-xs opacity-70 font-normal">[S]</span>
                        <span>{sentence.enS}</span>
                      </span>
                      <span className="px-2.5 py-1 border border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 rounded-none inline-flex items-center gap-1.5">
                        <span className="text-xs opacity-70 font-normal">[V]</span>
                        <span>{sentence.enV}</span>
                      </span>
                      <span className="px-2.5 py-1 border border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-none inline-flex items-center gap-1.5">
                        <span className="text-xs opacity-70 font-normal">[O]</span>
                        <span>{sentence.enO}</span>
                      </span>
                      <span className="text-muted-foreground font-bold">.</span>
                    </div>
                  </div>
                </div>

                {/* Compact Note Column bên cạnh */}
                {sentence.note && (
                  <div className="p-2.5 sm:p-3 bg-muted/20 border-l-2 border-primary space-y-1 rounded-none text-xs md:max-w-xs">
                    <p className="text-[11px] text-muted-foreground font-sans leading-relaxed">
                      💡 <span className="font-medium text-foreground">{sentence.note}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Golden Rule Card */}
      <div className="p-3.5 sm:p-4 bg-amber-500/[0.08] border border-amber-500/40 rounded-none space-y-2">
        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-sm">
          <Lightbulb className="h-4 w-4 shrink-0" />
          <span>Quy tắc vàng: Không bao giờ bỏ rơi S và V trong câu tiếng Anh</span>
        </div>
        <div className="text-xs sm:text-sm text-foreground/90 space-y-1.5 leading-relaxed">
          <p>
            1. <strong>Đầy đủ chủ vị:</strong> Tiếng Việt có thể nói rút gọn như <em>&ldquo;Ăn cơm chưa?&rdquo;</em> hay <em>&ldquo;Mưa rồi&rdquo;</em>.
            Nhưng trong tiếng Anh, <strong>mọi câu kể đều bắt buộc phải có đủ Chủ ngữ (S) và Động từ (V)</strong> (ví dụ:{' '}
            <code className="font-mono font-bold bg-background/80 px-1 border border-border rounded-none">I eat rice</code>,{' '}
            <code className="font-mono font-bold bg-background/80 px-1 border border-border rounded-none">It is raining</code>).
          </p>
          <p>
            2. <strong>Cầu nối đại từ (I vs me):</strong> Trong tiếng Việt, từ &ldquo;tôi&rdquo; ở đầu câu hay cuối câu đều không đổi.
            Nhưng trong tiếng Anh, khi đứng ở vị trí <strong>[S] (làm hành động)</strong> thì dùng{' '}
            <strong className="text-sky-600 dark:text-sky-400 font-mono">I</strong>, còn khi chuyển xuống vị trí{' '}
            <strong>[O] (nhận hành động)</strong> thì đổi thành{' '}
            <strong className="text-emerald-600 dark:text-emerald-400 font-mono">me</strong> ({' '}
            <span className="font-mono font-bold">I love you</span> ➔ <span className="font-mono font-bold">You love me</span>
            ).
          </p>
          <div className="flex items-center gap-1.5 text-xs text-primary font-bold pt-1">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            <span>Đây là nền tảng cốt lõi chuẩn bị cho Bài 1: Đại từ nhân xưng (Personal Pronouns).</span>
          </div>
        </div>
      </div>

      {/* Bottom progression / end-of-deck CTA bar */}
      {guided && (
        <div className="border border-border bg-muted/20 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-none">
          {isLastSvoGroup ? (
            <>
              <div className="text-xs text-foreground font-medium">
                <span className="font-mono text-[11px] font-bold uppercase text-emerald-600 dark:text-emerald-400 mr-1.5">
                  ✓ Đã xem hết {SVO_GROUPS.length}/{SVO_GROUPS.length} nhóm câu
                </span>
                Bạn đã nắm vững mô hình 3 khối S + V + O!
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    grammarAudio.stopAll();
                    setActiveCategoryIdx(0);
                  }}
                  className="min-h-[40px] px-3 py-1.5 border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground font-mono text-xs uppercase tracking-wider rounded-none inline-flex items-center gap-1.5 transition-colors touch-manipulation cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5 shrink-0" />
                  <span>Xem lại nhóm 1</span>
                </button>
                <Link
                  href="/grammar/practice?topic=sentence-structure-svo"
                  onClick={() => grammarAudio.stopAll()}
                  className="min-h-[40px] px-3.5 py-1.5 bg-primary text-primary-foreground border border-primary hover:bg-primary/90 font-mono text-xs uppercase tracking-wider font-bold rounded-none inline-flex items-center gap-1.5 transition-colors touch-manipulation cursor-pointer"
                >
                  <Dumbbell className="h-3.5 w-3.5 shrink-0" />
                  <span>Làm bài tập #00 ngay</span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="text-xs text-muted-foreground font-mono">
                Đang ở <strong className="text-foreground">Nhóm {activeCategoryIdx + 1}/{SVO_GROUPS.length}</strong> • Tiếp theo:{' '}
                <span className="text-foreground font-semibold">{SVO_GROUPS[activeCategoryIdx + 1]?.label}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  grammarAudio.stopAll();
                  setActiveCategoryIdx(activeCategoryIdx + 1);
                }}
                className="min-h-[40px] px-3.5 py-1.5 bg-primary text-primary-foreground border border-primary hover:bg-primary/90 font-mono text-xs uppercase tracking-wider font-semibold rounded-none inline-flex items-center justify-center gap-1.5 shrink-0 transition-colors touch-manipulation cursor-pointer"
              >
                <span>Qua nhóm {activeCategoryIdx + 2}</span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
