'use client';

import React, { useState, useEffect } from 'react';
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
    label: 'Ăn uống & Nhu cầu thiết yếu',
    shortLabel: 'Ăn uống',
    description: 'Các hành động ăn uống, tiêu dùng cơ bản với ngoại động từ trực tiếp',
    icon: 'utensils',
    sentences: [
      {
        id: 'svo-food-01',
        vi: 'Tôi ăn cơm.',
        viS: 'Tôi',
        viV: 'ăn',
        viO: 'cơm',
        roleExplanation: {
          s: 'Ai làm? "Tôi" (Chủ thể thực hiện hành động)',
          v: 'Làm gì? "ăn" (Hành động diễn ra)',
          o: 'Cái gì? "cơm" (Thực phẩm nhận tác động ăn)',
        },
        en: 'I eat rice.',
        enS: 'I',
        enV: 'eat',
        enO: 'rice',
        note: 'Trật tự từ tương đồng 100% giữa Việt và Anh: Ai làm + Làm gì + Cái gì.',
      },
      {
        id: 'svo-food-02',
        vi: 'Tôi uống nước.',
        viS: 'Tôi',
        viV: 'uống',
        viO: 'nước',
        roleExplanation: {
          s: 'Ai làm? "Tôi" (Chủ ngữ số ít)',
          v: 'Làm gì? "uống" (Động từ hành động)',
          o: 'Cái gì? "nước" (Tân ngữ trực tiếp)',
        },
        en: 'I drink water.',
        enS: 'I',
        enV: 'drink',
        enO: 'water',
        note: 'Động từ "drink" đi trực tiếp với tân ngữ "water" không cần giới từ.',
      },
      {
        id: 'svo-food-03',
        vi: 'Chúng tôi ăn bánh mì.',
        viS: 'Chúng tôi',
        viV: 'ăn',
        viO: 'bánh mì',
        roleExplanation: {
          s: 'Ai làm? "Chúng tôi" (Chủ ngữ số nhiều)',
          v: 'Làm gì? "ăn" (Động từ nguyên thể)',
          o: 'Cái gì? "bánh mì" (Tân ngữ nhận hành động)',
        },
        en: 'We eat bread.',
        enS: 'We',
        enV: 'eat',
        enO: 'bread',
        note: 'Chủ ngữ số nhiều "We" đi cùng động từ "eat" ở dạng nguyên mẫu.',
      },
      {
        id: 'svo-food-04',
        vi: 'Họ uống cà phê.',
        viS: 'Họ',
        viV: 'uống',
        viO: 'cà phê',
        roleExplanation: {
          s: 'Ai làm? "Họ" (Chủ ngữ ngôi thứ 3 số nhiều)',
          v: 'Làm gì? "uống" (Động từ hành động)',
          o: 'Cái gì? "cà phê" (Tân ngữ đồ uống)',
        },
        en: 'They drink coffee.',
        enS: 'They',
        enV: 'drink',
        enO: 'coffee',
        note: 'Giữ vững cấu trúc 3 khối: S (They) + V (drink) + O (coffee).',
      },
    ],
  },
  {
    id: 'habits',
    label: 'Sinh hoạt & Sở thích hàng ngày',
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
          s: 'Ai làm? "Tôi" (Chủ ngữ)',
          v: 'Làm gì? "đọc" (Động từ hành động)',
          o: 'Cái gì? "sách" (Danh từ tân ngữ số nhiều)',
        },
        en: 'I read books.',
        enS: 'I',
        enV: 'read',
        enO: 'books',
        note: 'Tân ngữ "books" ở dạng số nhiều chỉ thói quen đọc sách nói chung.',
      },
      {
        id: 'svo-habit-02',
        vi: 'Bạn nghe nhạc.',
        viS: 'Bạn',
        viV: 'nghe',
        viO: 'nhạc',
        roleExplanation: {
          s: 'Ai làm? "Bạn" (Chủ ngữ ngôi thứ 2)',
          v: 'Làm gì? "nghe" (Cụm động từ "listen to")',
          o: 'Cái gì? "nhạc" (Tân ngữ của cụm động từ)',
        },
        en: 'You listen to music.',
        enS: 'You',
        enV: 'listen to',
        enO: 'music',
        note: '"listen to" đi liền nhau như một khối động từ hướng tới tân ngữ "music".',
      },
      {
        id: 'svo-habit-03',
        vi: 'Chúng tôi xem tivi.',
        viS: 'Chúng tôi',
        viV: 'xem',
        viO: 'tivi',
        roleExplanation: {
          s: 'Ai làm? "Chúng tôi" (Chủ ngữ số nhiều)',
          v: 'Làm gì? "xem" (Động từ quan sát/theo dõi)',
          o: 'Cái gì? "tivi" (Tân ngữ thiết bị/chương trình)',
        },
        en: 'We watch TV.',
        enS: 'We',
        enV: 'watch',
        enO: 'TV',
        note: '"watch" là ngoại động từ chỉ hành động chăm chú theo dõi màn hình.',
      },
      {
        id: 'svo-habit-04',
        vi: 'Họ chơi bóng đá.',
        viS: 'Họ',
        viV: 'chơi',
        viO: 'bóng đá',
        roleExplanation: {
          s: 'Ai làm? "Họ" (Chủ thể)',
          v: 'Làm gì? "chơi" (Động từ thể thao)',
          o: 'Cái gì? "bóng đá" (Tân ngữ môn thể thao)',
        },
        en: 'They play football.',
        enS: 'They',
        enV: 'play',
        enO: 'football',
        note: 'Tên môn thể thao đứng trực tiếp sau động từ "play" không cần mạo từ "the".',
      },
    ],
  },
  {
    id: 'work',
    label: 'Học tập & Công việc',
    shortLabel: 'Công việc',
    description: 'Nhiệm vụ học tập, kỹ năng nghề nghiệp và trách nhiệm gia đình',
    icon: 'briefcase',
    sentences: [
      {
        id: 'svo-work-01',
        vi: 'Chúng tôi học tiếng Anh.',
        viS: 'Chúng tôi',
        viV: 'học',
        viO: 'tiếng Anh',
        roleExplanation: {
          s: 'Ai làm? "Chúng tôi" (Chủ ngữ)',
          v: 'Làm gì? "học" (Động từ tiếp thu kiến thức)',
          o: 'Cái gì? "tiếng Anh" (Ngôn ngữ được học)',
        },
        en: 'We learn English.',
        enS: 'We',
        enV: 'learn',
        enO: 'English',
        note: 'Tên ngôn ngữ "English" viết hoa và đóng vai trò tân ngữ trực tiếp.',
      },
      {
        id: 'svo-work-02',
        vi: 'Cô ấy dạy toán.',
        viS: 'Cô ấy',
        viV: 'dạy',
        viO: 'toán',
        roleExplanation: {
          s: 'Ai làm? "Cô ấy" (Chủ ngữ ngôi thứ 3 số ít: She)',
          v: 'Làm gì? "dạy" (Động từ thêm -es: teaches)',
          o: 'Cái gì? "toán" (Môn học được giảng dạy)',
        },
        en: 'She teaches math.',
        enS: 'She',
        enV: 'teaches',
        enO: 'math',
        note: 'Với chủ ngữ "She", động từ "teach" biến đổi thành "teaches" nhưng trật tự SVO không đổi.',
      },
      {
        id: 'svo-work-03',
        vi: 'Bố tôi lái xe hơi.',
        viS: 'Bố tôi',
        viV: 'lái',
        viO: 'xe hơi',
        roleExplanation: {
          s: 'Ai làm? "Bố tôi" (Cụm chủ ngữ danh từ My father)',
          v: 'Làm gì? "lái" (Động từ chia drives)',
          o: 'Cái gì? "xe hơi" (Cụm tân ngữ có mạo từ a car)',
        },
        en: 'My father drives a car.',
        enS: 'My father',
        enV: 'drives',
        enO: 'a car',
        note: 'Chủ ngữ có thể là một cụm danh từ ("My father") và tân ngữ có thể kèm mạo từ ("a car").',
      },
      {
        id: 'svo-work-04',
        vi: 'Mẹ tôi nấu bữa tối.',
        viS: 'Mẹ tôi',
        viV: 'nấu',
        viO: 'bữa tối',
        roleExplanation: {
          s: 'Ai làm? "Mẹ tôi" (Cụm chủ ngữ My mother)',
          v: 'Làm gì? "nấu" (Động từ chia cooks)',
          o: 'Cái gì? "bữa tối" (Tân ngữ dinner)',
        },
        en: 'My mother cooks dinner.',
        enS: 'My mother',
        enV: 'cooks',
        enO: 'dinner',
        note: 'Khung xương 3 khối S + V + O duy trì tính ổn định tuyệt đối.',
      },
    ],
  },
  {
    id: 'interpersonal',
    label: 'Tương tác giữa người với người (Cầu nối đại từ)',
    shortLabel: 'Tương tác',
    description: 'Đối thoại người với người — nhận diện sự biến đổi đại từ giữa vị trí S và O',
    icon: 'users',
    sentences: [
      {
        id: 'svo-person-01',
        vi: 'Tôi yêu bạn.',
        viS: 'Tôi',
        viV: 'yêu',
        viO: 'bạn',
        roleExplanation: {
          s: 'Ai làm? "Tôi" (Chủ ngữ: người cho đi tình cảm)',
          v: 'Làm gì? "yêu" (Động từ cảm xúc)',
          o: 'Ai nhận? "bạn" (Tân ngữ nhận tình cảm)',
        },
        en: 'I love you.',
        enS: 'I',
        enV: 'love',
        enO: 'you',
        note: 'Khi "Tôi" ở vị trí Chủ ngữ [S] làm hành động, dùng đại từ "I".',
      },
      {
        id: 'svo-person-02',
        vi: 'Bạn yêu tôi.',
        viS: 'Bạn',
        viV: 'yêu',
        viO: 'tôi',
        roleExplanation: {
          s: 'Ai làm? "Bạn" (Chủ ngữ thực hiện hành động)',
          v: 'Làm gì? "yêu" (Động từ)',
          o: 'Ai nhận? "tôi" (Tân ngữ nhận tình cảm)',
        },
        en: 'You love me.',
        enS: 'You',
        enV: 'love',
        enO: 'me',
        note: 'CẦU NỐI ĐẠI TỪ: Khi "Tôi" bị đẩy xuống vị trí Tân ngữ [O], tiếng Anh bắt buộc đổi từ "I" thành "me"!',
      },
      {
        id: 'svo-person-03',
        vi: 'Tôi giúp anh ấy.',
        viS: 'Tôi',
        viV: 'giúp',
        viO: 'anh ấy',
        roleExplanation: {
          s: 'Ai làm? "Tôi" (Chủ ngữ hỗ trợ)',
          v: 'Làm gì? "giúp" (Động từ hành động)',
          o: 'Ai nhận? "anh ấy" (Tân ngữ nhận sự giúp đỡ)',
        },
        en: 'I help him.',
        enS: 'I',
        enV: 'help',
        enO: 'him',
        note: 'Khi "anh ấy" ở vị trí Tân ngữ [O], tiếng Anh dùng "him" chứ không dùng "he".',
      },
      {
        id: 'svo-person-04',
        vi: 'Anh ấy giúp tôi.',
        viS: 'Anh ấy',
        viV: 'giúp',
        viO: 'tôi',
        roleExplanation: {
          s: 'Ai làm? "Anh ấy" (Chủ ngữ ngôi 3 chia helps)',
          v: 'Làm gì? "giúp" (Động từ chia theo He)',
          o: 'Ai nhận? "tôi" (Tân ngữ nhận sự trợ giúp)',
        },
        en: 'He helps me.',
        enS: 'He',
        enV: 'helps',
        enO: 'me',
        note: '"Anh ấy" làm chủ ngữ dùng "He"; "tôi" làm tân ngữ nhận hành động dùng "me".',
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

  return (
    <div className="space-y-4 max-w-4xl mx-auto min-w-0">
      {/* Hero Header Card */}
      <div className="border border-border bg-card p-4 sm:p-5 rounded-none shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-primary font-bold">
              <Sparkles className="h-4 w-4 shrink-0" />
              <span>Bài số 0 • Cấu trúc câu căn bản (S + V + O)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-foreground">
              Mô hình 3 Khối SVO: Bắc cầu trực giác Việt ➔ Anh
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Trật tự câu khẳng định cơ bản trong tiếng Anh tương đồng trực giác 1:1 với tiếng Việt qua câu kinh điển:
              <strong className="text-foreground ml-1 font-mono">TÔI [S] + ĂN [V] + CƠM [O]</strong> ➔{' '}
              <strong className="text-foreground font-mono">I [S] + eat [V] + rice [O]</strong>.
            </p>
          </div>
        </div>

        {/* 3 Colored Structural Reference Blocks */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          {/* S Block */}
          <div className="border border-sky-400 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 p-3 rounded-none flex flex-col justify-between">
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
          <div className="border border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 p-3 rounded-none flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold px-1.5 py-0.5 border border-amber-400/50 bg-amber-100/80 dark:bg-amber-900/40 rounded-none">
                [V] Động từ
              </span>
              <span className="font-mono text-[11px] opacity-80">Verb</span>
            </div>
            <div className="mt-2 text-xs">
              <p className="font-bold text-sm">Làm gì?</p>
              <p className="text-[11px] opacity-80 mt-0.5">Hành động diễn ra (ăn, uống, học, lái xe, giúp...)</p>
            </div>
          </div>

          {/* O Block */}
          <div className="border border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 p-3 rounded-none flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold px-1.5 py-0.5 border border-emerald-400/50 bg-emerald-100/80 dark:bg-emerald-900/40 rounded-none">
                [O] Tân ngữ
              </span>
              <span className="font-mono text-[11px] opacity-80">Object</span>
            </div>
            <div className="mt-2 text-xs">
              <p className="font-bold text-sm">Bị / Được tác động?</p>
              <p className="text-[11px] opacity-80 mt-0.5">Đối tượng chịu tác động từ hành động của S</p>
            </div>
          </div>
        </div>
      </div>

      {/* Guided Category Navigator or Segmented Tabs */}
      {guided ? (
        <GrammarCardNavigator
          titles={SVO_GROUPS.map((g) => `${g.label} — ${g.description}`)}
          pills={SVO_GROUPS.map((g) => g.shortLabel)}
          index={activeCategoryIdx}
          onChange={(nextIdx) => {
            grammarAudio.stopAll();
            setActiveCategoryIdx(nextIdx);
          }}
        />
      ) : (
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
                className={`min-h-[44px] px-3.5 py-2 font-mono text-xs uppercase tracking-wider font-medium rounded-none border transition-colors whitespace-nowrap flex items-center gap-2 touch-manipulation ${
                  isActive
                    ? 'border-foreground bg-foreground text-background font-bold'
                    : 'border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                <CategoryIcon icon={group.icon} />
                <span>{group.label}</span>
                <span className="text-[10px] opacity-60">({group.sentences.length})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Active Group Banner info */}
      <div className="flex items-center justify-between text-xs font-mono text-muted-foreground px-1">
        <div className="flex items-center gap-2">
          <CategoryIcon icon={currentGroup.icon} />
          <span className="font-bold text-foreground uppercase">{currentGroup.label}</span>
          <span>•</span>
          <span className="text-muted-foreground hidden sm:inline">{currentGroup.description}</span>
        </div>
        <span className="text-primary font-bold">{currentGroup.sentences.length} câu phân tích</span>
      </div>

      {/* 4 Sentences of Active Group */}
      <div role="tabpanel" className="space-y-3">
        {currentGroup.sentences.map((sentence, sIdx) => {
          const isPlayingThis = audioState.activeId === sentence.id;

          return (
            <div
              key={sentence.id}
              className="border border-border bg-card p-3.5 sm:p-4 rounded-none transition-colors hover:border-foreground/40 space-y-3 shadow-xs"
            >
              {/* Header: Sentence counter & 1-tap Audio Play Button */}
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-muted-foreground px-1.5 py-0.5 border border-border bg-muted/40 rounded-none">
                    #{sIdx + 1}
                  </span>
                  <span className="text-xs font-sans text-muted-foreground">Phân tích cú pháp 3 tầng</span>
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
                  className={`min-h-[44px] min-w-[44px] px-3 py-1.5 border font-mono text-xs flex items-center justify-center gap-1.5 transition-all rounded-none touch-manipulation ${
                    isPlayingThis
                      ? 'border-emerald-500 bg-emerald-500 text-white font-bold animate-pulse'
                      : 'border-border bg-background hover:bg-muted text-foreground'
                  }`}
                  title={`Nghe phát âm: "${sentence.en}"`}
                  aria-label={`Nghe phát âm: ${sentence.en}`}
                >
                  <Volume2 className="h-4 w-4" />
                  <span className="hidden sm:inline">{isPlayingThis ? 'Đang phát...' : 'Nghe audio'}</span>
                </button>
              </div>

              {/* TIER 1: Vietnamese Sentence with [S], [V], [O] labels */}
              <div className="space-y-1">
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Tầng 1: Tiếng Việt trực giác
                </span>
                <div className="flex flex-wrap items-center gap-2 text-sm sm:text-base font-semibold">
                  <span className="px-2 py-1 border border-sky-400 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 rounded-none flex items-center gap-1">
                    <span className="font-mono text-[10px] font-bold opacity-75">[S]</span>
                    <span>{sentence.viS}</span>
                  </span>
                  <span className="text-muted-foreground font-mono font-bold">+</span>
                  <span className="px-2 py-1 border border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 rounded-none flex items-center gap-1">
                    <span className="font-mono text-[10px] font-bold opacity-75">[V]</span>
                    <span>{sentence.viV}</span>
                  </span>
                  <span className="text-muted-foreground font-mono font-bold">+</span>
                  <span className="px-2 py-1 border border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-none flex items-center gap-1">
                    <span className="font-mono text-[10px] font-bold opacity-75">[O]</span>
                    <span>{sentence.viO}</span>
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto hidden md:inline italic">
                    &ldquo;{sentence.vi}&rdquo;
                  </span>
                </div>
              </div>

              {/* TIER 2: Role Explanation (Ai làm? Làm gì? Bị tác động bởi cái gì/ai?) */}
              <div className="p-2.5 bg-muted/20 border-l-2 border-primary space-y-1 rounded-none text-xs">
                <div className="font-mono text-[10px] uppercase tracking-wider text-primary font-bold">
                  Tầng 2: Cầu nối giải thích vai trò ngữ pháp
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[11px] text-foreground/90">
                  <div className="flex items-start gap-1">
                    <span className="font-mono font-bold text-sky-600 dark:text-sky-400 shrink-0">•</span>
                    <span>{sentence.roleExplanation.s}</span>
                  </div>
                  <div className="flex items-start gap-1">
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400 shrink-0">•</span>
                    <span>{sentence.roleExplanation.v}</span>
                  </div>
                  <div className="flex items-start gap-1">
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0">•</span>
                    <span>{sentence.roleExplanation.o}</span>
                  </div>
                </div>
              </div>

              {/* TIER 3: English Sentence with [S], [V], [O] labels */}
              <div className="space-y-1 pt-0.5">
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Tầng 3: Tiếng Anh tương ứng (S + V + O)
                </span>
                <div className="flex flex-wrap items-center gap-2 text-base sm:text-lg font-bold font-mono">
                  <span className="px-2.5 py-1 border border-sky-400 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 rounded-none flex items-center gap-1.5">
                    <span className="text-xs opacity-75 font-normal">[S]</span>
                    <span>{sentence.enS}</span>
                  </span>
                  <span className="text-muted-foreground font-mono font-normal">+</span>
                  <span className="px-2.5 py-1 border border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 rounded-none flex items-center gap-1.5">
                    <span className="text-xs opacity-75 font-normal">[V]</span>
                    <span>{sentence.enV}</span>
                  </span>
                  <span className="text-muted-foreground font-mono font-normal">+</span>
                  <span className="px-2.5 py-1 border border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-none flex items-center gap-1.5">
                    <span className="text-xs opacity-75 font-normal">[O]</span>
                    <span>{sentence.enO}</span>
                  </span>
                </div>
                {sentence.note && (
                  <p className="text-[11px] text-muted-foreground mt-1.5 font-sans leading-relaxed">
                    💡 <span className="font-medium text-foreground">{sentence.note}</span>
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Golden Rule Card (Mẹo Nhớ Vàng Cốt Lõi) */}
      <div className="p-4 sm:p-4.5 bg-amber-500/[0.08] border border-amber-500/40 rounded-none space-y-2">
        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-sm">
          <Lightbulb className="h-4 w-4 shrink-0" />
          <span>Quy tắc vàng: Không bao giờ bỏ rơi S và V trong câu tiếng Anh</span>
        </div>
        <div className="text-xs sm:text-sm text-foreground/90 space-y-1.5 leading-relaxed">
          <p>
            1. <strong>Tiếng Việt có thể nói cộc lốc:</strong> Trong tiếng Việt ta thường nói tỉnh lược như{' '}
            <em>&ldquo;Ăn cơm chưa?&rdquo;</em>, <em>&ldquo;Mưa rồi&rdquo;</em>, <em>&ldquo;Rất mệt&rdquo;</em>.
            Nhưng trong tiếng Anh, <strong>mọi câu kể đều bắt buộc phải có đủ Chủ ngữ (S) và Động từ (V)</strong> (ví dụ:{' '}
            <code className="font-mono font-bold bg-background/80 px-1 border border-border">I eat rice</code>,{' '}
            <code className="font-mono font-bold bg-background/80 px-1 border border-border">It is raining</code>,{' '}
            <code className="font-mono font-bold bg-background/80 px-1 border border-border">I am very tired</code>).
          </p>
          <p>
            2. <strong>Cầu nối đại từ (I vs me):</strong> Trong tiếng Việt, từ &ldquo;tôi&rdquo; ở đầu câu hay cuối câu
            vẫn giữ nguyên là &ldquo;tôi&rdquo; (<em>Tôi yêu bạn</em> và <em>Bạn yêu tôi</em>). Nhưng trong tiếng Anh,
            khi đứng ở vị trí <strong>[S] (làm hành động)</strong> thì dùng{' '}
            <strong className="text-sky-600 dark:text-sky-400 font-mono">I</strong>, còn khi chuyển xuống vị trí{' '}
            <strong>[O] (nhận hành động)</strong> thì phải đổi thành{' '}
            <strong className="text-emerald-600 dark:text-emerald-400 font-mono">me</strong> ({' '}
            <span className="font-mono font-bold">I love you</span> ➔ <span className="font-mono font-bold">You love me</span>
            ).
          </p>
          <div className="flex items-center gap-1.5 text-xs text-primary font-bold pt-1">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            <span>Đây là nền tảng sống còn chuẩn bị cho Bài 1: Đại từ nhân xưng (Personal Pronouns).</span>
          </div>
        </div>
      </div>
    </div>
  );
}
