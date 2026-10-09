'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Volume2, Sparkles, User, Users, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import { grammarAudio } from '@/lib/grammar/grammarAudioManager';
import GrammarCardNavigator from './GrammarCardNavigator';

export interface PronounExample {
  en: string;
  vi: string;
  image: string;
  audio?: string;
  highlightWord?: string;
  highlightNote?: string;
}

export interface PronounItem {
  subject: string;
  meaning: string;
  role: string;
  type: 'singular' | 'plural';
  person: '1st' | '2nd' | '3rd';
  gender?: 'male' | 'female' | 'neutral';
  image: string;
  audio?: string;
  examples: PronounExample[];
  forms: {
    subject: string;
    object: string;
    possessiveAdj: string;
    possessivePronoun: string;
    reflexive: string;
  };
  tip: string;
  accentBorder: string;
  badgeBg: string;
}

export function HighlightedSentence({
  text,
  highlight,
  className = '',
  highlightClassName = 'text-primary dark:text-primary font-extrabold uppercase bg-primary/10 px-1 py-0.5 border border-primary/30 font-mono tracking-wide',
}: {
  text: string;
  highlight?: string;
  className?: string;
  highlightClassName?: string;
}) {
  if (!highlight) {
    return <span className={className}>{text}</span>;
  }

  const escaped = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\b(${escaped})\\b`, 'gi');
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.toLowerCase() === highlight.toLowerCase()) {
          return (
            <span key={i} className={`inline-block ${highlightClassName}`}>
              {part}
            </span>
          );
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </span>
  );
}

export const PRONOUN_VISUAL_ITEMS: PronounItem[] = [
  {
    subject: 'I',
    meaning: 'Tôi / Mình / Em',
    role: 'Người nói (Tôi / Mình)',
    type: 'singular',
    person: '1st',
    image: '/grammar/topics/personal-pronouns/v2_i.jpg',
    examples: [
      {
        en: 'I am a student.',
        vi: 'Tôi là học sinh.',
        image: '/grammar/topics/personal-pronouns/ex_i_student.jpg',
        highlightWord: 'I',
        highlightNote: 'I là đại từ nhân xưng đóng vai trò chủ ngữ (S) đứng trước động từ to be',
      },
      {
        en: 'Can you help me?',
        vi: 'Bạn có thể giúp tôi không?',
        image: '/grammar/topics/personal-pronouns/real_02_me.jpg',
        highlightWord: 'me',
        highlightNote: 'me là đại từ tân ngữ (O) tương ứng của I, đứng sau động từ (help)',
      },
      {
        en: 'I like music.',
        vi: 'Tôi thích âm nhạc.',
        image: '/grammar/topics/personal-pronouns/ex_i_music.jpg',
        highlightWord: 'I',
        highlightNote: 'I là đại từ chủ ngữ ngôi thứ nhất số ít thực hiện hành động (like)',
      },
      {
        en: 'I live in Vietnam.',
        vi: 'Tôi sống ở Việt Nam.',
        image: '/grammar/topics/personal-pronouns/ex_i_vietnam.jpg',
        highlightWord: 'I',
        highlightNote: 'I là chủ ngữ đứng đầu câu trước động từ nguyên mẫu (live)',
      },
    ],
    forms: {
      subject: 'I',
      object: 'me',
      possessiveAdj: 'my (sách của tôi: my book)',
      possessivePronoun: 'mine (của tôi)',
      reflexive: 'myself (chính tôi)',
    },
    tip: 'Trước động từ dùng chủ ngữ (I); sau động từ hoặc giới từ dùng tân ngữ (me).',
    accentBorder: 'border-blue-500/40',
    badgeBg: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30',
  },
  {
    subject: 'You',
    meaning: 'Bạn / Cậu / Các bạn',
    role: 'Người nghe (Bạn / Các bạn)',
    type: 'singular',
    person: '2nd',
    image: '/grammar/topics/personal-pronouns/v2_you.jpg',
    examples: [
      {
        en: 'You are very kind.',
        vi: 'Bạn rất tốt bụng.',
        image: '/grammar/topics/personal-pronouns/ex_you_kind.jpg',
        highlightWord: 'You',
        highlightNote: 'You là đại từ nhân xưng làm chủ ngữ (S) chỉ người nghe',
      },
      {
        en: 'I will call you later.',
        vi: 'Tôi sẽ gọi cho bạn sau nhé.',
        image: '/grammar/topics/personal-pronouns/ex_you_call.jpg',
        highlightWord: 'you',
        highlightNote: 'you là đại từ tân ngữ (O) đứng sau động từ hành động (call)',
      },
      {
        en: 'You look happy today!',
        vi: 'Hôm nay trông bạn thật vui!',
        image: '/grammar/topics/personal-pronouns/ex_you_happy.jpg',
        highlightWord: 'You',
        highlightNote: 'You là chủ ngữ đứng đầu câu trước động từ chỉ cảm giác (look)',
      },
      {
        en: 'Do you speak English?',
        vi: 'Bạn có nói tiếng Anh không?',
        image: '/grammar/topics/personal-pronouns/ex_you_speak.jpg',
        highlightWord: 'you',
        highlightNote: 'you là chủ ngữ trong câu hỏi, đứng sau trợ động từ Do',
      },
    ],
    forms: {
      subject: 'you',
      object: 'you',
      possessiveAdj: 'your (nhà của bạn: your house)',
      possessivePronoun: 'yours (của bạn)',
      reflexive: 'yourself (chính bạn) / yourselves (các bạn)',
    },
    tip: 'Dù là một hay nhiều người, You luôn đi với động từ số nhiều (You are, You have).',
    accentBorder: 'border-teal-500/40',
    badgeBg: 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30',
  },
  {
    subject: 'He',
    meaning: 'Anh ấy / Cậu ấy / Ông ấy',
    role: 'Người nam (Anh ấy / Cậu ấy)',
    type: 'singular',
    person: '3rd',
    gender: 'male',
    image: '/grammar/topics/personal-pronouns/v2_he.jpg',
    examples: [
      {
        en: 'He is a good doctor.',
        vi: 'Anh ấy là một bác sĩ giỏi.',
        image: '/grammar/topics/personal-pronouns/ex_he_doctor.jpg',
        highlightWord: 'He',
        highlightNote: 'He là đại từ nhân xưng làm chủ ngữ (S) chỉ một người nam',
      },
      {
        en: 'I saw him at the library.',
        vi: 'Tôi đã gặp anh ấy ở thư viện.',
        image: '/grammar/topics/personal-pronouns/ex_he_library.jpg',
        highlightWord: 'him',
        highlightNote: 'him là đại từ tân ngữ (O) tương ứng của He, đứng sau động từ (saw)',
      },
      {
        en: 'He plays football every weekend.',
        vi: 'Cậu ấy chơi bóng đá mỗi cuối tuần.',
        image: '/grammar/topics/personal-pronouns/ex_he_football.jpg',
        highlightWord: 'He',
        highlightNote: 'He là chủ ngữ ngôi thứ 3 số ít, động từ theo sau thêm -s (plays)',
      },
      {
        en: 'He is my best friend.',
        vi: 'Anh ấy là bạn thân của tôi.',
        image: '/grammar/topics/personal-pronouns/ex_he_friend.jpg',
        highlightWord: 'He',
        highlightNote: 'He là chủ ngữ ngôi thứ 3 số ít chỉ bạn nam thân thiết',
      },
    ],
    forms: {
      subject: 'he',
      object: 'him (gặp anh ấy: see him)',
      possessiveAdj: 'his (xe của anh ấy: his car)',
      possessivePronoun: 'his (của anh ấy)',
      reflexive: 'himself (chính anh ấy)',
    },
    tip: 'Đứng trước động từ là He (He works); đứng sau động từ hoặc giới từ là him (call him).',
    accentBorder: 'border-sky-500/40',
    badgeBg: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30',
  },
  {
    subject: 'She',
    meaning: 'Cô ấy / Chị ấy / Bà ấy',
    role: 'Người nữ (Cô ấy / Chị ấy)',
    type: 'singular',
    person: '3rd',
    gender: 'female',
    image: '/grammar/topics/personal-pronouns/v2_she.jpg',
    examples: [
      {
        en: 'She is a friendly teacher.',
        vi: 'Cô ấy là một giáo viên thân thiện.',
        image: '/grammar/topics/personal-pronouns/ex_she_teacher.jpg',
        highlightWord: 'She',
        highlightNote: 'She là đại từ nhân xưng làm chủ ngữ (S) chỉ một người nữ',
      },
      {
        en: 'We invited her to the party.',
        vi: 'Chúng tôi đã mời cô ấy đến bữa tiệc.',
        image: '/grammar/topics/personal-pronouns/ex_she_party.jpg',
        highlightWord: 'her',
        highlightNote: 'her là đại từ tân ngữ (O) tương ứng của She, đứng sau động từ (invited)',
      },
      {
        en: 'She loves reading books.',
        vi: 'Cô ấy rất thích đọc sách.',
        image: '/grammar/topics/personal-pronouns/ex_she_reading.jpg',
        highlightWord: 'She',
        highlightNote: 'She là chủ ngữ ngôi thứ 3 số ít đứng đầu câu',
      },
      {
        en: 'She speaks English very well.',
        vi: 'Chị ấy nói tiếng Anh rất giỏi.',
        image: '/grammar/topics/personal-pronouns/ex_she_speak.jpg',
        highlightWord: 'She',
        highlightNote: 'She là chủ ngữ ngôi thứ 3 số ít, động từ theo sau thêm -s (speaks)',
      },
    ],
    forms: {
      subject: 'she',
      object: 'her (giúp cô ấy: help her)',
      possessiveAdj: 'her (phòng của cô ấy: her room)',
      possessivePronoun: 'hers (của cô ấy)',
      reflexive: 'herself (chính cô ấy)',
    },
    tip: 'Đứng trước động từ là She (She works); đứng sau động từ hoặc giới từ là her (call her).',
    accentBorder: 'border-rose-500/40',
    badgeBg: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30',
  },
  {
    subject: 'It',
    meaning: 'Nó (Đồ vật, con vật, thời tiết)',
    role: 'Đồ vật / Con vật (Nó)',
    type: 'singular',
    person: '3rd',
    gender: 'neutral',
    image: '/grammar/topics/personal-pronouns/v2_it.jpg',
    examples: [
      {
        en: 'It is a cute puppy.',
        vi: 'Nó là một chú cún con đáng yêu.',
        image: '/grammar/topics/personal-pronouns/ex_it_puppy.jpg',
        highlightWord: 'It',
        highlightNote: 'It là đại từ nhân xưng làm chủ ngữ (S) chỉ một con vật/đồ vật',
      },
      {
        en: 'I really like it.',
        vi: 'Tôi thực sự rất thích nó.',
        image: '/grammar/topics/personal-pronouns/ex_it_gift.jpg',
        highlightWord: 'it',
        highlightNote: 'it là đại từ tân ngữ (O) chỉ đồ vật, đứng sau động từ (like)',
      },
      {
        en: 'It is sunny today.',
        vi: 'Hôm nay trời nắng đẹp.',
        image: '/grammar/topics/personal-pronouns/ex_it_sunny.jpg',
        highlightWord: 'It',
        highlightNote: 'It là chủ ngữ giả chỉ thời tiết hoặc hiện tượng tự nhiên',
      },
      {
        en: 'It is on the table.',
        vi: 'Nó ở trên bàn.',
        image: '/grammar/topics/personal-pronouns/ex_it_table.jpg',
        highlightWord: 'It',
        highlightNote: 'It là chủ ngữ chỉ đồ vật ở vị trí xác định',
      },
    ],
    forms: {
      subject: 'it',
      object: 'it (thích nó: like it)',
      possessiveAdj: 'its (màu của nó: its color - không dấu nháy)',
      possessivePronoun: '(its)',
      reflexive: 'itself (chính nó)',
    },
    tip: 'Nó chỉ một vật/con vật; tính từ sở hữu its không có dấu nháy (tránh nhầm với it\'s).',
    accentBorder: 'border-amber-500/40',
    badgeBg: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
  },
  {
    subject: 'We',
    meaning: 'Chúng tôi / Chúng ta',
    role: 'Nhóm có mình (Chúng tôi / Chúng mình)',
    type: 'plural',
    person: '1st',
    image: '/grammar/topics/personal-pronouns/v2_we.jpg',
    examples: [
      {
        en: 'We are ready to learn.',
        vi: 'Chúng tôi đã sẵn sàng học.',
        image: '/grammar/topics/personal-pronouns/ex_we_learn.jpg',
        highlightWord: 'We',
        highlightNote: 'We là đại từ nhân xưng làm chủ ngữ (S) chỉ nhóm có người nói',
      },
      {
        en: 'The teacher helped us a lot.',
        vi: 'Thầy cô đã giúp đỡ chúng tôi rất nhiều.',
        image: '/grammar/topics/personal-pronouns/ex_we_teacher.jpg',
        highlightWord: 'us',
        highlightNote: 'us là đại từ tân ngữ (O) tương ứng của We, đứng sau động từ (helped)',
      },
      {
        en: 'We are a happy family.',
        vi: 'Chúng tôi là một gia đình hạnh phúc.',
        image: '/grammar/topics/personal-pronouns/ex_we_family.jpg',
        highlightWord: 'We',
        highlightNote: 'We là chủ ngữ số nhiều ngôi thứ nhất chỉ nhóm người',
      },
      {
        en: 'We study English together.',
        vi: 'Chúng tôi cùng nhau học tiếng Anh.',
        image: '/grammar/topics/personal-pronouns/ex_we_study.jpg',
        highlightWord: 'We',
        highlightNote: 'We là chủ ngữ số nhiều đứng trước động từ nguyên mẫu (study)',
      },
    ],
    forms: {
      subject: 'we',
      object: 'us (tham gia cùng chúng tôi: join us)',
      possessiveAdj: 'our (đội của chúng tôi: our team)',
      possessivePronoun: 'ours (của chúng tôi)',
      reflexive: 'ourselves (chính chúng tôi)',
    },
    tip: 'We bắt buộc có người nói trong đó; sau động từ hoặc giới từ chuyển thành us.',
    accentBorder: 'border-emerald-500/40',
    badgeBg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  },
  {
    subject: 'They',
    meaning: 'Họ / Bọn họ / Chúng nó',
    role: 'Nhóm người / vật khác (Họ / Chúng nó)',
    type: 'plural',
    person: '3rd',
    image: '/grammar/topics/personal-pronouns/v2_they.jpg',
    examples: [
      {
        en: 'They are my classmates.',
        vi: 'Họ là bạn cùng lớp của tôi.',
        image: '/grammar/topics/personal-pronouns/ex_they_class.jpg',
        highlightWord: 'They',
        highlightNote: 'They là đại từ nhân xưng làm chủ ngữ (S) chỉ nhiều người/vật khác',
      },
      {
        en: 'I often play games with them.',
        vi: 'Tôi thường chơi trò chơi cùng họ.',
        image: '/grammar/topics/personal-pronouns/ex_they_games.jpg',
        highlightWord: 'them',
        highlightNote: 'them là đại từ tân ngữ (O) tương ứng của They, đứng sau giới từ (with)',
      },
      {
        en: 'They are very friendly.',
        vi: 'Họ rất thân thiện.',
        image: '/grammar/topics/personal-pronouns/ex_they_friendly.jpg',
        highlightWord: 'They',
        highlightNote: 'They là chủ ngữ số nhiều ngôi thứ 3',
      },
      {
        en: 'They live near my house.',
        vi: 'Họ sống ở gần nhà tôi.',
        image: '/grammar/topics/personal-pronouns/ex_they_house.jpg',
        highlightWord: 'They',
        highlightNote: 'They là chủ ngữ số nhiều đứng trước động từ nguyên mẫu (live)',
      },
    ],
    forms: {
      subject: 'they',
      object: 'them (khen ngợi họ: praise them)',
      possessiveAdj: 'their (nhà của họ: their house)',
      possessivePronoun: 'theirs (của họ)',
      reflexive: 'themselves (chính họ)',
    },
    tip: 'They dùng cho nhiều người hoặc nhiều vật; sau động từ hoặc giới từ chuyển thành them.',
    accentBorder: 'border-purple-500/40',
    badgeBg: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30',
  },
];

interface PronounCardItemProps {
  item: PronounItem;
  cardIndex: number;
  showDetailForms: boolean;
  activeAudioId: string | null;
  onPlaySpeech: (id: string, text: string, audioUrl?: string) => void;
  exampleLimit?: number;
}

function PronounCardItem({
  item,
  cardIndex: _cardIndex,
  showDetailForms,
  activeAudioId,
  onPlaySpeech,
  exampleLimit,
}: PronounCardItemProps) {
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [showAllExamples, setShowAllExamples] = useState(false);
  const visibleExamples = exampleLimit && !showAllExamples ? item.examples.slice(0, exampleLimit) : item.examples;

  const currentIdx = hoveredIdx !== null ? hoveredIdx : activeIdx;
  const currentExample = item.examples[currentIdx] || item.examples[0];
  const currentImage = (hoveredIdx !== null ? currentExample.image : null) || currentExample.image || item.image;
  const isPlayingSubject = activeAudioId === `subject-${item.subject}`;
  const isPlayingCurrent = activeAudioId === `${item.subject}-${currentIdx}`;

  return (
    <div
      role="tabpanel"
      id={`pronoun-panel-${item.subject}`}
      aria-labelledby={`card-nav-tab-${item.subject}`}
      className={`relative overflow-hidden border border-border bg-card hover:border-foreground/40 transition-all duration-200 flex flex-col justify-between shadow-xs rounded-none group ${
        hoveredIdx !== null ? 'z-20' : 'z-10'
      }`}
    >
      {/* 1. Core Grammar Transformation Bar: Subject (S) ➔ Object (O) */}
      <div className="bg-muted/30 border-b border-border px-2.5 sm:px-4 py-1.5 sm:py-2.5 flex items-center justify-between gap-1.5 sm:gap-2 text-xs font-mono shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
            Biến đổi:
          </span>
          <div className="flex items-center gap-1 text-[11px] sm:text-xs">
            <span className="text-muted-foreground uppercase text-[10px] tracking-wider">
              <span className="hidden sm:inline">Chủ ngữ </span>(S):
            </span>
            <span className="font-bold text-primary bg-primary/10 border border-primary/30 px-1.5 sm:px-2 py-0.5 text-xs sm:text-sm">
              {item.subject}
            </span>
          </div>
          <span className="text-muted-foreground font-bold text-xs">➔</span>
          <div className="flex items-center gap-1 text-[11px] sm:text-xs">
            <span className="text-muted-foreground uppercase text-[10px] tracking-wider">
              <span className="hidden sm:inline">Tân ngữ </span>(O):
            </span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 sm:px-2 py-0.5 text-xs sm:text-sm">
              {item.forms.object.split(' ')[0]}
            </span>
          </div>
          <span className="text-xs text-muted-foreground font-sans hidden md:inline truncate">
            ({item.meaning})
          </span>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 text-xs font-mono text-muted-foreground shrink-0">
          <span className="px-1 sm:px-1.5 py-0.5 bg-muted/70 border border-border text-foreground font-medium text-[10px] sm:text-[11px]">
            {item.subject === 'You' ? 'Số ít/nhiều' : item.type === 'singular' ? 'Số ít' : 'Số nhiều'}
          </span>
          <span className="px-1.5 py-0.5 bg-muted/70 border border-border text-[11px] hidden sm:inline">
            Ngôi {item.person}
          </span>
        </div>
      </div>

      <div className={exampleLimit ? 'sm:grid sm:grid-cols-12 sm:items-stretch min-w-0' : undefined}>
        {/* Dynamic Image Stage & Memory Tip - Left Column */}
        <div
          className={`relative bg-muted/20 overflow-hidden border-b sm:border-b-0 sm:border-r border-border rounded-none flex flex-col justify-between ${
            exampleLimit ? 'sm:col-span-5' : 'h-48 sm:h-52'
          }`}
        >
          <div className="relative w-full h-40 sm:h-48 md:h-52 overflow-hidden flex-1 min-h-[160px]">
            <Image
              key={currentImage}
              src={currentImage}
              alt={`${item.subject} - ${currentExample.en}`}
              fill
              className="object-cover transition-all duration-300 group-hover:scale-102 rounded-none"
              sizes="(max-width: 768px) 100vw, 33vw"
              unoptimized
            />

            {/* Top Badge: Person role & Speaker button (Min 44x44px touch target) */}
            <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-10">
              <span
                className={`font-mono text-[11px] font-bold uppercase px-2 py-0.5 border backdrop-blur-md shadow-xs rounded-none ${item.badgeBg}`}
              >
                {item.role}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                    try { navigator.vibrate(8); } catch {}
                  }
                  onPlaySpeech(`subject-${item.subject}`, item.subject, item.audio);
                }}
                className={`min-h-[44px] min-w-[44px] flex items-center justify-center p-2 border transition-all shadow-sm rounded-none touch-manipulation ${
                  isPlayingSubject
                    ? 'bg-primary text-primary-foreground scale-105'
                    : 'bg-background/90 text-foreground hover:bg-primary hover:text-primary-foreground'
                }`}
                title={`Nghe phát âm "${item.subject}"`}
                aria-label={`Nghe phát âm ${item.subject}`}
              >
                <Volume2 className="h-4 w-4" />
              </button>
            </div>

            {/* Bottom Image Overlay Tag */}
            <div className="absolute bottom-2 left-2 right-2 z-10">
              <div className="bg-background/95 backdrop-blur-md border border-border px-2.5 py-1.5 flex items-baseline justify-between shadow-xs rounded-none">
                <div className="flex items-baseline gap-2">
                  <span className="font-serif text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                    {item.subject}
                  </span>
                  <span className="font-sans text-xs sm:text-sm font-bold text-primary">
                    = {item.meaning}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Golden Memory Tip - Anchored in left column */}
          <div className="p-2 sm:p-2.5 bg-amber-500/[0.08] border-t border-amber-500/30 flex items-start gap-2 text-xs shrink-0">
            <Lightbulb className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <span className="text-[11px] text-foreground/90 font-sans leading-relaxed">
              <strong className="text-amber-800 dark:text-amber-300 font-semibold">Ghi nhớ: </strong>
              {item.tip}
            </span>
          </div>
        </div>

        {/* Card Body: All 4 Interactive Examples */}
        <div
          className={`p-2.5 sm:p-3 flex flex-col justify-between gap-1.5 ${
            exampleLimit ? 'sm:col-span-7' : 'space-y-3'
          }`}
        >
          <div className="space-y-1.5">
            <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-wider text-muted-foreground pb-0.5">
              <span className="font-semibold text-foreground">4 ví dụ song ngữ</span>
              <span className="text-primary font-mono text-[10px] font-bold">
                {currentIdx + 1}/4 câu
              </span>
            </div>

            <div className="space-y-1">
              {visibleExamples.map((ex, exIdx) => {
                const isHovered = hoveredIdx === exIdx;
                const isSelected = activeIdx === exIdx;
                const isPlayingThis = activeAudioId === `${item.subject}-${exIdx}`;

                return (
                  <div
                    key={exIdx}
                    onMouseEnter={() => {
                      if (typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches) {
                        setHoveredIdx(exIdx);
                      }
                    }}
                    onMouseLeave={() => setHoveredIdx(null)}
                    onClick={() => {
                      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                        try { navigator.vibrate(8); } catch {}
                      }
                      setActiveIdx(exIdx);
                      onPlaySpeech(
                        `${item.subject}-${exIdx}`,
                        ex.en,
                        ex.audio || (exIdx === 0 ? item.audio : undefined)
                      );
                    }}
                    className={`min-h-[40px] px-2.5 py-1.5 border transition-all duration-150 rounded-none cursor-pointer flex items-center justify-between gap-2 touch-manipulation ${
                      isHovered || isSelected
                        ? 'border-primary bg-primary/[0.08] shadow-xs ring-1 ring-primary/25'
                        : isPlayingThis
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-border bg-muted/20 hover:bg-muted/40'
                    }`}
                  >
                    <div className="space-y-0.5 min-w-0 flex-1 text-left">
                      <p className="font-serif text-xs sm:text-sm font-semibold text-foreground leading-snug">
                        <HighlightedSentence text={ex.en} highlight={ex.highlightWord} />
                      </p>
                      {ex.vi && (
                        <p className="text-[11px] text-muted-foreground font-sans leading-tight">
                          {ex.vi}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                          try { navigator.vibrate(8); } catch {}
                        }
                        setActiveIdx(exIdx);
                        onPlaySpeech(
                          `${item.subject}-${exIdx}`,
                          ex.en,
                          ex.audio || (exIdx === 0 ? item.audio : undefined)
                        );
                      }}
                      className={`min-h-[36px] min-w-[36px] flex items-center justify-center p-1.5 rounded-none shrink-0 transition-colors touch-manipulation ${
                        isPlayingThis || isSelected
                          ? 'bg-primary text-primary-foreground border border-primary'
                          : 'text-muted-foreground hover:text-foreground border border-transparent hover:border-border hover:bg-muted'
                      }`}
                      title="Nghe phát âm câu này"
                      aria-label={`Nghe câu: ${ex.en}`}
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PronounVisualDeck({ compact = false, guided = false }: { compact?: boolean; guided?: boolean }) {
  const [filter, setFilter] = useState<'all' | 'singular' | 'plural'>('all');
  const [cardIndex, setCardIndex] = useState(0);
  const [showDetailForms, setShowDetailForms] = useState(false);
  const [audioState, setAudioState] = useState<{ isPlaying: boolean; activeId: string | null }>({
    isPlaying: false,
    activeId: null,
  });

  useEffect(() => {
    return grammarAudio.subscribe(setAudioState);
  }, []);

  const filteredItems = PRONOUN_VISUAL_ITEMS.filter((item) => {
    if (filter === 'singular') return item.type === 'singular';
    if (filter === 'plural') return item.type === 'plural';
    return true;
  });

  const playSpeech = (id: string, text: string, audioUrl?: string) => {
    grammarAudio.play(id, text, audioUrl);
  };

  if (guided) {
    return (
      <div className="space-y-2.5 min-w-0 max-w-4xl mx-auto">
        <GrammarCardNavigator
          titles={PRONOUN_VISUAL_ITEMS.map((item) => `${item.subject} — ${item.meaning}`)}
          pills={PRONOUN_VISUAL_ITEMS.map((item) => item.subject)}
          index={cardIndex}
          onChange={(nextIndex) => {
            grammarAudio.stopAll();
            setCardIndex(nextIndex);
          }}
        />
        <PronounCardItem
          key={PRONOUN_VISUAL_ITEMS[cardIndex].subject}
          item={PRONOUN_VISUAL_ITEMS[cardIndex]}
          cardIndex={cardIndex}
          showDetailForms={false}
          activeAudioId={audioState.activeId}
          onPlaySpeech={playSpeech}
          exampleLimit={4}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Top Banner & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-muted/20 border border-border rounded-none">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-primary font-bold">
            <Sparkles className="h-4 w-4" />
            <span>Khám phá 7 Đại từ nhân xưng qua Ảnh sắc nét & Ví dụ đơn giản</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Chạm hoặc rê chuột vào từng câu để đổi ảnh minh họa và từ khóa ngữ pháp được nhấn mạnh trực quan
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {/* Filter Pills */}
          <div className="inline-flex border border-border bg-background p-0.5 font-mono text-xs shadow-xs rounded-none">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`min-h-[36px] sm:min-h-[44px] px-3 py-1.5 transition-colors rounded-none flex items-center justify-center touch-manipulation ${
                filter === 'all'
                  ? 'bg-foreground text-background font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Tất cả (7)
            </button>
            <button
              type="button"
              onClick={() => setFilter('singular')}
              className={`min-h-[36px] sm:min-h-[44px] px-3 py-1.5 transition-colors flex items-center justify-center gap-1 rounded-none touch-manipulation ${
                filter === 'singular'
                  ? 'bg-foreground text-background font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <User className="h-3 w-3" />
              <span>Số ít (5)</span>
            </button>
            <button
              type="button"
              onClick={() => setFilter('plural')}
              className={`min-h-[36px] sm:min-h-[44px] px-3 py-1.5 transition-colors flex items-center justify-center gap-1 rounded-none touch-manipulation ${
                filter === 'plural'
                  ? 'bg-foreground text-background font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Users className="h-3 w-3" />
              <span>Số nhiều (2)</span>
            </button>
          </div>

          {/* Toggle Forms Button */}
          <button
            type="button"
            onClick={() => setShowDetailForms(!showDetailForms)}
            className={`min-h-[36px] sm:min-h-[44px] border px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1 shadow-xs rounded-none touch-manipulation ${
              showDetailForms
                ? 'border-primary bg-primary text-primary-foreground font-semibold'
                : 'border-border bg-background text-muted-foreground hover:text-foreground'
            }`}
          >
            {showDetailForms ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" />
                <span>Ẩn dạng mở rộng</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" />
                <span>Xem Tân ngữ & Sở hữu</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Visual Cards Grid */}
      <div
        className={`grid gap-5 ${
          compact
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        }`}
      >
        {filteredItems.map((item, cardIdx) => (
          <PronounCardItem
            key={item.subject}
            item={item}
            cardIndex={cardIdx}
            showDetailForms={showDetailForms}
            activeAudioId={audioState.activeId}
            onPlaySpeech={playSpeech}
          />
        ))}
      </div>
    </div>
  );
}
