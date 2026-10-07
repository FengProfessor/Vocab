'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Volume2, Sparkles, User, Users, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import { speak } from '@/lib/study';

export interface PronounExample {
  en: string;
  vi: string;
  image: string;
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
  highlightClassName = 'text-red-600 dark:text-red-400 font-extrabold uppercase bg-red-500/10 px-1 py-0.5 border border-red-500/30 font-mono tracking-wide',
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
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.toLowerCase() === highlight.toLowerCase()) {
          return (
            <span key={i} className={`inline-block ${highlightClassName}`}>
              {part.toUpperCase()}
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
    role: 'Ngôi 1 số ít (Người đang nói)',
    type: 'singular',
    person: '1st',
    image: '/grammar/topics/personal-pronouns/v2_i.jpg',
    examples: [
      {
        en: 'I am a student.',
        vi: 'Tôi là học sinh.',
        image: '/grammar/topics/personal-pronouns/ex_i_student.jpg',
        highlightWord: 'am',
        highlightNote: 'Chủ ngữ "I" luôn đi với động từ to be "AM"',
      },
      {
        en: 'I like music.',
        vi: 'Tôi thích âm nhạc.',
        image: '/grammar/topics/personal-pronouns/ex_i_music.jpg',
        highlightWord: 'like',
        highlightNote: 'Động từ thường đi với "I" ở hiện tại giữ nguyên mẫu (LIKE)',
      },
      {
        en: 'I live in Vietnam.',
        vi: 'Tôi sống ở Việt Nam.',
        image: '/grammar/topics/personal-pronouns/ex_i_vietnam.jpg',
        highlightWord: 'live',
        highlightNote: 'Chủ ngữ "I" + động từ nguyên mẫu: I LIVE in...',
      },
      {
        en: 'I can speak English.',
        vi: 'Tôi có thể nói tiếng Anh.',
        image: '/grammar/topics/personal-pronouns/ex_i_speak.jpg',
        highlightWord: 'can speak',
        highlightNote: 'Động từ khuyết thiếu CAN + động từ nguyên mẫu: I CAN SPEAK',
      },
    ],
    forms: {
      subject: 'I',
      object: 'me',
      possessiveAdj: 'my (sách của tôi: my book)',
      possessivePronoun: 'mine (của tôi)',
      reflexive: 'myself (chính tôi)',
    },
    tip: 'Chữ "I" luôn luôn viết hoa trong tiếng Anh, dù đứng ở đầu hay giữa câu. Tuyệt đối không dùng "Me" làm chủ ngữ.',
    accentBorder: 'border-blue-500/40',
    badgeBg: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30',
  },
  {
    subject: 'You',
    meaning: 'Bạn / Cậu / Các bạn',
    role: 'Ngôi 2 (Người đối diện đang trò chuyện)',
    type: 'singular',
    person: '2nd',
    image: '/grammar/topics/personal-pronouns/v2_you.jpg',
    examples: [
      {
        en: 'You are very kind.',
        vi: 'Bạn rất tốt bụng.',
        image: '/grammar/topics/personal-pronouns/ex_you_kind.jpg',
        highlightWord: 'are',
        highlightNote: 'Dù là 1 người hay nhiều người, "You" luôn đi với "ARE"',
      },
      {
        en: 'You look happy today!',
        vi: 'Hôm nay trông bạn thật vui!',
        image: '/grammar/topics/personal-pronouns/ex_you_happy.jpg',
        highlightWord: 'look',
        highlightNote: 'You + động từ tri giác: You LOOK + tính từ (happy)',
      },
      {
        en: 'Do you speak English?',
        vi: 'Bạn có nói tiếng Anh không?',
        image: '/grammar/topics/personal-pronouns/ex_you_speak.jpg',
        highlightWord: 'speak',
        highlightNote: 'Câu hỏi thì hiện tại đơn với You: Trợ động từ DO + You + SPEAK',
      },
      {
        en: 'I will call you later.',
        vi: 'Tôi sẽ gọi cho bạn sau nhé.',
        image: '/grammar/topics/personal-pronouns/ex_you_call.jpg',
        highlightWord: 'you',
        highlightNote: '"You" đứng sau động từ (call) làm tân ngữ (O), hình thức không đổi',
      },
    ],
    forms: {
      subject: 'you',
      object: 'you',
      possessiveAdj: 'your (nhà của bạn: your house)',
      possessivePronoun: 'yours (của bạn)',
      reflexive: 'yourself (chính bạn) / yourselves (các bạn)',
    },
    tip: 'Dù chỉ 1 người (bạn) hay nhiều người (các bạn), "You" luôn đi với động từ số nhiều (You are, You have).',
    accentBorder: 'border-teal-500/40',
    badgeBg: 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30',
  },
  {
    subject: 'He',
    meaning: 'Anh ấy / Cậu ấy / Ông ấy',
    role: 'Ngôi 3 số ít (Nam giới)',
    type: 'singular',
    person: '3rd',
    gender: 'male',
    image: '/grammar/topics/personal-pronouns/v2_he.jpg',
    examples: [
      {
        en: 'He is a good doctor.',
        vi: 'Anh ấy là một bác sĩ giỏi.',
        image: '/grammar/topics/personal-pronouns/ex_he_doctor.jpg',
        highlightWord: 'is',
        highlightNote: 'Ngôi 3 số ít "He" luôn đi với động từ to be "IS"',
      },
      {
        en: 'He plays football every weekend.',
        vi: 'Cậu ấy chơi bóng đá mỗi cuối tuần.',
        image: '/grammar/topics/personal-pronouns/ex_he_football.jpg',
        highlightWord: 'plays',
        highlightNote: 'Động từ theo sau "He" ở hiện tại đơn phải thêm -s/es: PLAYS',
      },
      {
        en: 'He is my best friend.',
        vi: 'Anh ấy là bạn thân của tôi.',
        image: '/grammar/topics/personal-pronouns/ex_he_friend.jpg',
        highlightWord: 'is',
        highlightNote: 'He + IS + cụm danh từ chỉ quan hệ/nghề nghiệp',
      },
      {
        en: 'I saw him at the library.',
        vi: 'Tôi đã gặp anh ấy ở thư viện.',
        image: '/grammar/topics/personal-pronouns/ex_he_library.jpg',
        highlightWord: 'him',
        highlightNote: 'Tân ngữ của "He" chuyển thành "HIM" khi đứng sau động từ',
      },
    ],
    forms: {
      subject: 'he',
      object: 'him (gặp anh ấy: see him)',
      possessiveAdj: 'his (xe của anh ấy: his car)',
      possessivePronoun: 'his (của anh ấy)',
      reflexive: 'himself (chính anh ấy)',
    },
    tip: 'Đứng trước động từ làm chủ ngữ là "He" (He works). Đứng sau động từ hoặc giới từ làm tân ngữ là "him" (call him).',
    accentBorder: 'border-sky-500/40',
    badgeBg: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30',
  },
  {
    subject: 'She',
    meaning: 'Cô ấy / Chị ấy / Bà ấy',
    role: 'Ngôi 3 số ít (Nữ giới)',
    type: 'singular',
    person: '3rd',
    gender: 'female',
    image: '/grammar/topics/personal-pronouns/v2_she.jpg',
    examples: [
      {
        en: 'She is a friendly teacher.',
        vi: 'Cô ấy là một giáo viên thân thiện.',
        image: '/grammar/topics/personal-pronouns/ex_she_teacher.jpg',
        highlightWord: 'is',
        highlightNote: 'Ngôi 3 số ít "She" luôn đi với động từ to be "IS"',
      },
      {
        en: 'She loves reading books.',
        vi: 'Cô ấy rất thích đọc sách.',
        image: '/grammar/topics/personal-pronouns/ex_she_reading.jpg',
        highlightWord: 'loves',
        highlightNote: 'Động từ theo sau "She" phải thêm -s/es: LOVES + V-ing',
      },
      {
        en: 'She speaks English very well.',
        vi: 'Chị ấy nói tiếng Anh rất giỏi.',
        image: '/grammar/topics/personal-pronouns/ex_she_speak.jpg',
        highlightWord: 'speaks',
        highlightNote: 'Chủ ngữ "She" + động từ thêm -s: SPEAKS',
      },
      {
        en: 'We invited her to the party.',
        vi: 'Chúng tôi đã mời cô ấy đến bữa tiệc.',
        image: '/grammar/topics/personal-pronouns/ex_she_party.jpg',
        highlightWord: 'her',
        highlightNote: 'Tân ngữ của "She" chuyển thành "HER" khi đứng sau động từ',
      },
    ],
    forms: {
      subject: 'she',
      object: 'her (giúp cô ấy: help her)',
      possessiveAdj: 'her (phòng của cô ấy: her room)',
      possessivePronoun: 'hers (của cô ấy)',
      reflexive: 'herself (chính cô ấy)',
    },
    tip: 'Phân biệt "She" làm chủ ngữ (She calls) và "her" làm tân ngữ hoặc sở hữu (call her, her dog).',
    accentBorder: 'border-rose-500/40',
    badgeBg: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30',
  },
  {
    subject: 'It',
    meaning: 'Nó (Đồ vật, con vật, thời tiết)',
    role: 'Ngôi 3 số ít (Một vật / con vật)',
    type: 'singular',
    person: '3rd',
    gender: 'neutral',
    image: '/grammar/topics/personal-pronouns/v2_it.jpg',
    examples: [
      {
        en: 'It is a cute puppy.',
        vi: 'Nó là một chú cún con đáng yêu.',
        image: '/grammar/topics/personal-pronouns/ex_it_puppy.jpg',
        highlightWord: 'is',
        highlightNote: 'Đại từ chỉ con vật/đồ vật số ít "It" luôn đi với "IS"',
      },
      {
        en: 'It is sunny today.',
        vi: 'Hôm nay trời nắng đẹp.',
        image: '/grammar/topics/personal-pronouns/ex_it_sunny.jpg',
        highlightWord: 'is',
        highlightNote: 'Chủ ngữ giả "It" dùng để nói về thời tiết: IT IS sunny',
      },
      {
        en: 'It is on the table.',
        vi: 'Nó ở trên bàn.',
        image: '/grammar/topics/personal-pronouns/ex_it_table.jpg',
        highlightWord: 'is',
        highlightNote: 'It + IS + cụm giới từ chỉ vị trí (on the table)',
      },
      {
        en: 'I really like it.',
        vi: 'Tôi thực sự rất thích nó.',
        image: '/grammar/topics/personal-pronouns/ex_it_gift.jpg',
        highlightWord: 'it',
        highlightNote: '"It" làm tân ngữ giữ nguyên dạng viết: like IT',
      },
    ],
    forms: {
      subject: 'it',
      object: 'it (thích nó: like it)',
      possessiveAdj: 'its (màu của nó: its color - không dấu nháy)',
      possessivePronoun: '(its)',
      reflexive: 'itself (chính nó)',
    },
    tip: 'Tránh nhầm giữa tính từ sở hữu "its" (của nó - KHÔNG có dấu nháy) với dạng viết tắt "it\'s" (= it is / it has).',
    accentBorder: 'border-amber-500/40',
    badgeBg: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
  },
  {
    subject: 'We',
    meaning: 'Chúng tôi / Chúng ta',
    role: 'Ngôi 1 số nhiều (Tôi + người khác)',
    type: 'plural',
    person: '1st',
    image: '/grammar/topics/personal-pronouns/v2_we.jpg',
    examples: [
      {
        en: 'We are ready to learn.',
        vi: 'Chúng tôi đã sẵn sàng học.',
        image: '/grammar/topics/personal-pronouns/ex_we_learn.jpg',
        highlightWord: 'are',
        highlightNote: 'Ngôi 1 số nhiều "We" luôn đi với động từ to be "ARE"',
      },
      {
        en: 'We are a happy family.',
        vi: 'Chúng tôi là một gia đình hạnh phúc.',
        image: '/grammar/topics/personal-pronouns/ex_we_family.jpg',
        highlightWord: 'are',
        highlightNote: 'We ARE + cụm danh từ số nhiều hoặc danh từ tập hợp',
      },
      {
        en: 'We study English together.',
        vi: 'Chúng tôi cùng nhau học tiếng Anh.',
        image: '/grammar/topics/personal-pronouns/ex_we_study.jpg',
        highlightWord: 'study',
        highlightNote: 'Chủ ngữ số nhiều "We" đi với động từ nguyên mẫu: STUDY',
      },
      {
        en: 'The teacher helped us a lot.',
        vi: 'Thầy cô đã giúp đỡ chúng tôi rất nhiều.',
        image: '/grammar/topics/personal-pronouns/ex_we_teacher.jpg',
        highlightWord: 'us',
        highlightNote: 'Tân ngữ của "We" chuyển thành "US" khi đứng sau động từ',
      },
    ],
    forms: {
      subject: 'we',
      object: 'us (tham gia cùng chúng tôi: join us)',
      possessiveAdj: 'our (đội của chúng tôi: our team)',
      possessivePronoun: 'ours (của chúng tôi)',
      reflexive: 'ourselves (chính chúng tôi)',
    },
    tip: '"We" bắt buộc phải bao gồm bạn trong đó (Tôi + người khác). Sau động từ hoặc giới từ là "us" (join us).',
    accentBorder: 'border-emerald-500/40',
    badgeBg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  },
  {
    subject: 'They',
    meaning: 'Họ / Bọn họ / Chúng nó',
    role: 'Ngôi 3 số nhiều (Nhóm người hoặc vật khác)',
    type: 'plural',
    person: '3rd',
    image: '/grammar/topics/personal-pronouns/v2_they.jpg',
    examples: [
      {
        en: 'They are my classmates.',
        vi: 'Họ là bạn cùng lớp của tôi.',
        image: '/grammar/topics/personal-pronouns/ex_they_class.jpg',
        highlightWord: 'are',
        highlightNote: 'Ngôi 3 số nhiều "They" luôn đi với động từ to be "ARE"',
      },
      {
        en: 'They are very friendly.',
        vi: 'Họ rất thân thiện.',
        image: '/grammar/topics/personal-pronouns/ex_they_friendly.jpg',
        highlightWord: 'are',
        highlightNote: 'They + ARE + tính từ mô tả đặc điểm (friendly)',
      },
      {
        en: 'They live near my house.',
        vi: 'Họ sống ở gần nhà tôi.',
        image: '/grammar/topics/personal-pronouns/ex_they_house.jpg',
        highlightWord: 'live',
        highlightNote: 'Chủ ngữ số nhiều "They" đi với động từ nguyên mẫu: LIVE',
      },
      {
        en: 'I often play games with them.',
        vi: 'Tôi thường chơi trò chơi cùng họ.',
        image: '/grammar/topics/personal-pronouns/ex_they_games.jpg',
        highlightWord: 'them',
        highlightNote: 'Tân ngữ của "They" chuyển thành "THEM" sau giới từ (with)',
      },
    ],
    forms: {
      subject: 'they',
      object: 'them (khen ngợi họ: praise them)',
      possessiveAdj: 'their (nhà của họ: their house)',
      possessivePronoun: 'theirs (của họ)',
      reflexive: 'themselves (chính họ)',
    },
    tip: '"They" dùng cho cả nhiều người ("họ") lẫn nhiều đồ vật hoặc con vật ("chúng nó"). Tân ngữ là "them".',
    accentBorder: 'border-purple-500/40',
    badgeBg: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30',
  },
];

interface PronounCardItemProps {
  item: PronounItem;
  cardIndex: number;
  showDetailForms: boolean;
  activeSpeech: string | null;
  onPlaySpeech: (text: string) => void;
}

function PronounCardItem({
  item,
  cardIndex,
  showDetailForms,
  activeSpeech,
  onPlaySpeech,
}: PronounCardItemProps) {
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const currentIdx = hoveredIdx !== null ? hoveredIdx : activeIdx;
  const currentExample = item.examples[currentIdx] || item.examples[0];
  const currentImage = (hoveredIdx !== null ? currentExample.image : null) || currentExample.image || item.image;
  const isPlayingSubject = activeSpeech === item.subject;

  // On 3-column layouts (lg), cardIndex % 3 === 2 is the right-most card
  // On 2-column layouts (md), cardIndex % 2 === 1 is the right-most card
  const isRightCol = cardIndex % 3 === 2;

  return (
    <div
      className={`relative overflow-visible border border-border bg-card hover:border-foreground/40 transition-all duration-200 flex flex-col justify-between shadow-xs hover:shadow-md group ${
        hoveredIdx !== null ? 'z-30' : 'z-10'
      }`}
    >
      <div>
        {/* Dynamic Image Stage - Seamlessly switches to hovered/selected example photo */}
        <div className="relative w-full h-52 sm:h-56 bg-muted/20 overflow-hidden border-b border-border">
          <Image
            key={currentImage}
            src={currentImage}
            alt={`${item.subject} - ${currentExample.en}`}
            fill
            className="object-cover transition-all duration-300 group-hover:scale-103"
            sizes="(max-width: 768px) 100vw, 33vw"
            unoptimized
          />

          {/* Top Badge: Person role & Speaker button */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
            <span
              className={`font-mono text-[11px] font-bold uppercase px-2.5 py-1 border backdrop-blur-md shadow-xs ${item.badgeBg}`}
            >
              {item.role}
            </span>
            <button
              type="button"
              onClick={() => onPlaySpeech(item.subject)}
              className={`p-2 border transition-all shadow-sm ${
                isPlayingSubject
                  ? 'bg-primary text-primary-foreground scale-110'
                  : 'bg-background/90 text-foreground hover:bg-primary hover:text-primary-foreground'
              }`}
              title={`Nghe phát âm "${item.subject}"`}
              aria-label={`Nghe phát âm ${item.subject}`}
            >
              <Volume2 className="h-4 w-4" />
            </button>
          </div>

          {/* Bottom Image Overlay Tag: High visibility */}
          <div className="absolute bottom-2 left-2.5 right-2.5 z-10">
            <div className="bg-background/95 backdrop-blur-md border border-border p-2.5 flex items-baseline justify-between shadow-sm">
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-3xl font-extrabold tracking-tight text-foreground">
                  {item.subject}
                </span>
                <span className="font-sans text-sm font-bold text-primary">
                  = {item.meaning}
                </span>
              </div>
              <span className="text-[11px] font-mono text-muted-foreground uppercase font-semibold">
                {item.type === 'singular' ? 'Số ít' : 'Số nhiều'}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Sentence Banner (Direct focus for active sentence with red highlighted keyword) */}
        <div className="px-3.5 py-2 bg-red-500/[0.04] border-b border-border flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-block w-2 h-2 bg-red-500 shrink-0" />
            <span className="font-serif text-xs font-semibold text-foreground truncate">
              <HighlightedSentence
                text={currentExample.en}
                highlight={currentExample.highlightWord}
              />
            </span>
          </div>
          <button
            type="button"
            onClick={() => onPlaySpeech(currentExample.en)}
            className="p-1 text-red-600 hover:text-red-700 shrink-0 transition-colors"
            title="Nghe câu ví dụ này"
            aria-label={`Nghe câu: ${currentExample.en}`}
          >
            <Volume2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Card Body: 4 Interactive Examples with Pop-ngang Side Preview */}
        <div className="p-4 space-y-3.5">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              <span className="font-semibold text-foreground">Trỏ chuột / Chạm để xem ảnh:</span>
              <span className="text-[10px] text-red-600 font-bold">Pop-ngang ảnh thật</span>
            </div>

            <div className="space-y-1.5">
              {item.examples.map((ex, exIdx) => {
                const isHovered = hoveredIdx === exIdx;
                const isSelected = activeIdx === exIdx;
                const isPlayingThis = activeSpeech === ex.en;

                return (
                  <div
                    key={exIdx}
                    onMouseEnter={() => setHoveredIdx(exIdx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    onClick={() => setActiveIdx(exIdx)}
                    className={`relative p-2.5 border transition-all duration-150 cursor-pointer flex items-start justify-between gap-2 ${
                      isHovered || isSelected
                        ? 'border-red-500 bg-red-500/[0.06] shadow-xs'
                        : 'border-border bg-muted/20 hover:bg-muted/40'
                    }`}
                  >
                    <div className="space-y-0.5 min-w-0">
                      <p className="font-serif text-sm font-semibold text-foreground leading-snug">
                        <HighlightedSentence
                          text={ex.en}
                          highlight={ex.highlightWord}
                        />
                      </p>
                      <p className="text-xs text-muted-foreground font-sans">
                        {ex.vi}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlaySpeech(ex.en);
                      }}
                      className={`p-1.5 shrink-0 transition-colors ${
                        isPlayingThis
                          ? 'text-red-600'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                      title="Nghe phát âm câu này"
                      aria-label={`Nghe câu: ${ex.en}`}
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                    </button>

                    {/* Desktop Side Pop-ngang Flyout Preview */}
                    {isHovered && (
                      <div
                        className={`hidden xl:block absolute top-[-10px] z-50 w-72 pointer-events-none transition-all duration-200 animate-in fade-in zoom-in-95 ${
                          isRightCol
                            ? 'right-[103%]'
                            : 'left-[103%]'
                        }`}
                      >
                        <div className="border-2 border-red-500 bg-card shadow-2xl p-2.5 rounded-none space-y-2.5">
                          {/* Image */}
                          <div className="relative w-full h-44 bg-muted/30 overflow-hidden border border-border">
                            <Image
                              src={ex.image}
                              alt={ex.en}
                              fill
                              className="object-cover"
                              sizes="288px"
                              unoptimized
                            />
                            <div className="absolute top-1.5 left-1.5 bg-red-600 text-white font-mono text-[10px] font-bold uppercase px-1.5 py-0.5 tracking-wider">
                              Ảnh minh họa ngữ cảnh
                            </div>
                          </div>

                          {/* Highlighted Sentence & Translation */}
                          <div className="space-y-1">
                            <p className="font-serif text-sm font-bold text-foreground leading-snug">
                              <HighlightedSentence
                                text={ex.en}
                                highlight={ex.highlightWord}
                              />
                            </p>
                            <p className="text-xs text-muted-foreground font-sans">
                              {ex.vi}
                            </p>
                            {ex.highlightNote && (
                              <div className="text-[11px] font-mono text-red-600 dark:text-red-400 bg-red-500/10 p-1.5 border border-red-500/20 leading-tight">
                                <strong className="font-bold">Nhấn mạnh: </strong>
                                {ex.highlightNote}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Expanded Forms: S, O, Possessive, Reflexive */}
          {showDetailForms && (
            <div className="space-y-1.5 pt-2 text-xs font-mono border-t border-border">
              <div className="flex items-center justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Chủ ngữ (S):</span>
                <strong className="text-primary font-bold text-sm">{item.forms.subject}</strong>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Tân ngữ (O):</span>
                <strong className="text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                  {item.forms.object}
                </strong>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Tính từ sở hữu:</span>
                <span className="font-medium text-foreground">{item.forms.possessiveAdj}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Đại từ sở hữu:</span>
                <span className="font-medium text-foreground">{item.forms.possessivePronoun}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground">Phản thân:</span>
                <span className="text-foreground">{item.forms.reflexive}</span>
              </div>
            </div>
          )}

          {/* Golden Memory Tip */}
          <div className="p-2.5 bg-amber-500/[0.06] border border-amber-500/30 flex items-start gap-2 text-xs">
            <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <span className="text-[11px] text-foreground/90 font-sans leading-relaxed">
              <strong className="text-amber-800 dark:text-amber-300">Ghi nhớ: </strong>
              {item.tip}
            </span>
          </div>
        </div>
      </div>

      {/* Card Footer: Quick Transformation Pill */}
      <div className="px-4 py-2.5 bg-muted/15 border-t border-border flex items-center justify-between text-xs font-mono text-muted-foreground">
        <span className="font-medium text-foreground">
          {item.type === 'singular' ? '● Số ít' : '● Số nhiều'}
        </span>
        <span className="font-bold text-primary">
          {item.forms.subject} ➔ {item.forms.object.split(' ')[0]}
        </span>
      </div>
    </div>
  );
}

export default function PronounVisualDeck({ compact = false }: { compact?: boolean }) {
  const [filter, setFilter] = useState<'all' | 'singular' | 'plural'>('all');
  const [showDetailForms, setShowDetailForms] = useState(false);
  const [activeSpeech, setActiveSpeech] = useState<string | null>(null);

  const filteredItems = PRONOUN_VISUAL_ITEMS.filter((item) => {
    if (filter === 'singular') return item.type === 'singular';
    if (filter === 'plural') return item.type === 'plural';
    return true;
  });

  const playSpeech = (text: string) => {
    setActiveSpeech(text);
    speak(text, 0.9);
    setTimeout(() => setActiveSpeech(null), 1800);
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-muted/20 border border-border">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-primary font-bold">
            <Sparkles className="h-4 w-4" />
            <span>Khám phá 7 Đại từ nhân xưng qua Ảnh sắc nét & Ví dụ đơn giản</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Chạm hoặc rê chuột vào từng câu để xem pop-ngang ảnh minh họa ngữ cảnh và từ khóa ngữ pháp được nhấn mạnh màu đỏ
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {/* Filter Pills */}
          <div className="inline-flex border border-border bg-background p-0.5 font-mono text-xs shadow-xs">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 transition-colors ${
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
              className={`px-3 py-1.5 transition-colors flex items-center gap-1 ${
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
              className={`px-3 py-1.5 transition-colors flex items-center gap-1 ${
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
            className={`border px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors flex items-center gap-1 shadow-xs ${
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
            activeSpeech={activeSpeech}
            onPlaySpeech={playSpeech}
          />
        ))}
      </div>
    </div>
  );
}
