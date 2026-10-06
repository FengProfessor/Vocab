'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Volume2, Sparkles, User, Users, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import { speak } from '@/lib/study';

export interface PronounExample {
  en: string;
  vi: string;
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

export const PRONOUN_VISUAL_ITEMS: PronounItem[] = [
  {
    subject: 'I',
    meaning: 'Tôi / Mình / Em',
    role: 'Ngôi 1 số ít (Người đang nói)',
    type: 'singular',
    person: '1st',
    image: '/grammar/topics/personal-pronouns/v2_i.jpg',
    examples: [
      { en: 'I am a student.', vi: 'Tôi là học sinh.' },
      { en: 'I like music.', vi: 'Tôi thích âm nhạc.' },
      { en: 'I live in Vietnam.', vi: 'Tôi sống ở Việt Nam.' },
      { en: 'I can speak English.', vi: 'Tôi có thể nói tiếng Anh.' },
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
      { en: 'You are very kind.', vi: 'Bạn rất tốt bụng.' },
      { en: 'You look happy today!', vi: 'Hôm nay trông bạn thật vui!' },
      { en: 'Do you speak English?', vi: 'Bạn có nói tiếng Anh không?' },
      { en: 'I will call you later.', vi: 'Tôi sẽ gọi cho bạn sau nhé.' },
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
      { en: 'He is my best friend.', vi: 'Anh ấy là bạn thân của tôi.' },
      { en: 'He is a good doctor.', vi: 'Anh ấy là một bác sĩ giỏi.' },
      { en: 'He plays football every weekend.', vi: 'Cậu ấy chơi bóng đá mỗi cuối tuần.' },
      { en: 'I saw him at the library.', vi: 'Tôi đã gặp anh ấy ở thư viện.' },
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
      { en: 'She is a friendly teacher.', vi: 'Cô ấy là một giáo viên thân thiện.' },
      { en: 'She loves reading books.', vi: 'Cô ấy rất thích đọc sách.' },
      { en: 'She speaks English very well.', vi: 'Chị ấy nói tiếng Anh rất giỏi.' },
      { en: 'We invited her to the party.', vi: 'Chúng tôi đã mời cô ấy đến bữa tiệc.' },
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
      { en: 'It is a cute puppy.', vi: 'Nó là một chú cún con đáng yêu.' },
      { en: 'It is sunny today.', vi: 'Hôm nay trời nắng đẹp.' },
      { en: 'It is on the table.', vi: 'Nó ở trên bàn.' },
      { en: 'I really like it.', vi: 'Tôi thực sự rất thích nó.' },
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
      { en: 'We are ready to learn.', vi: 'Chúng tôi đã sẵn sàng học.' },
      { en: 'We are a happy family.', vi: 'Chúng tôi là một gia đình hạnh phúc.' },
      { en: 'We study English together.', vi: 'Chúng tôi cùng nhau học tiếng Anh.' },
      { en: 'The teacher helped us a lot.', vi: 'Thầy cô đã giúp đỡ chúng tôi rất nhiều.' },
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
      { en: 'They are my classmates.', vi: 'Họ là bạn cùng lớp của tôi.' },
      { en: 'They are very friendly.', vi: 'Họ rất thân thiện.' },
      { en: 'They live near my house.', vi: 'Họ sống ở gần nhà tôi.' },
      { en: 'I often play games with them.', vi: 'Tôi thường chơi trò chơi cùng họ.' },
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
            Hình ảnh sáng sủa, người thật việc thật, kèm phát âm giọng bản xứ và 4 ví dụ thông dụng hàng ngày
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
        {filteredItems.map((item) => {
          const isPlayingSubject = activeSpeech === item.subject;

          return (
            <div
              key={item.subject}
              className="border border-border bg-card hover:border-foreground/40 transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md group"
            >
              <div>
                {/* Image Section - Crystal Clear, Bright, High Contrast */}
                <div className="relative w-full h-52 sm:h-56 bg-muted/20 overflow-hidden border-b border-border">
                  <Image
                    src={item.image}
                    alt={`${item.subject} - ${item.meaning}`}
                    fill
                    className="object-cover group-hover:scale-103 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    unoptimized
                  />

                  {/* Top Badge: Person role */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                    <span
                      className={`font-mono text-[11px] font-bold uppercase px-2.5 py-1 border backdrop-blur-md shadow-xs ${item.badgeBg}`}
                    >
                      {item.role}
                    </span>
                    <button
                      type="button"
                      onClick={() => playSpeech(item.subject)}
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
                  <div className="absolute bottom-2 left-2.5 right-2.5">
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

                {/* Card Body: 4 Simple Practical Examples */}
                <div className="p-4 space-y-3.5">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                      <span className="font-semibold text-foreground">Ví dụ đơn giản, thông dụng:</span>
                      <span className="text-[10px] text-primary">4 câu</span>
                    </div>

                    <div className="space-y-1.5">
                      {item.examples.map((ex, exIdx) => {
                        const isPlayingThis = activeSpeech === ex.en;

                        return (
                          <div
                            key={exIdx}
                            className="p-2.5 bg-muted/20 border border-border hover:bg-muted/40 transition-colors flex items-start justify-between gap-2"
                          >
                            <div className="space-y-0.5 min-w-0">
                              <p className="font-serif text-sm font-semibold text-foreground leading-snug">
                                {ex.en}
                              </p>
                              <p className="text-xs text-muted-foreground font-sans">
                                {ex.vi}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => playSpeech(ex.en)}
                              className={`p-1.5 shrink-0 transition-colors ${
                                isPlayingThis
                                  ? 'text-primary'
                                  : 'text-muted-foreground hover:text-foreground'
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
        })}
      </div>
    </div>
  );
}
