'use client';

import React, { useState } from 'react';
import {
  Volume2,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle,
  Video,
  Eye,
  Sliders,
  Play,
  RotateCcw,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DualSpeedAudioButton } from './DualSpeedAudioButton';
import type { Stage0PhoneticLesson } from '@/types/speaking-foundation';

export interface SoundAnatomyDetail {
  phoneme: string;
  label: string;
  lipShape: string;
  lipIcon: string;
  tonguePosition: string;
  tongueIcon: string;
  jawOpening: string;
  voicing: 'voiced' | 'voiceless';
  airflowDesc: string;
  keyMnemonicVi: string;
}

export const ANATOMY_DATABASE: Record<string, { soundA: SoundAnatomyDetail; soundB?: SoundAnatomyDetail; commonTrapVi: string; quickFixVi: string }> = {
  'stage-0-vowel-i-contrast': {
    soundA: {
      phoneme: '/iː/',
      label: 'Âm /iː/ dài (Long E)',
      lipShape: 'Căng khóe môi sang 2 bên như đang cười tươi hết cỡ',
      lipIcon: '😁',
      tonguePosition: 'Mặt lưỡi nâng cao sát vòm ngạc trên, đầu lưỡi chạm mặt sau răng dưới',
      tongueIcon: '👅⬆️',
      jawOpening: 'Khép gần sát nhau (hở 1-2mm)',
      voicing: 'voiced',
      airflowDesc: 'Luồng hơi ổn định, ngân dài 1 đến 1.5 giây',
      keyMnemonicVi: 'Cười thật tươi rồi phát âm "i" kéo dài',
    },
    soundB: {
      phoneme: '/ɪ/',
      label: 'Âm /ɪ/ ngắn (Short I)',
      lipShape: 'Thả lỏng khóe môi hoàn toàn, không cười, hơi hé nhẹ',
      lipIcon: '😐',
      tonguePosition: 'Mặt lưỡi hạ thấp hơn, lơ lửng tự nhiên giữa khoang miệng',
      tongueIcon: '👅↔️',
      jawOpening: 'Hạ nhẹ hàm xuống khoảng 1cm',
      voicing: 'voiced',
      airflowDesc: 'Âm bật dứt khoát nửa giây, lai giữa "i" và "ê" nhẹ',
      keyMnemonicVi: 'Thả lỏng cơ miệng, phát âm nhanh như âm "ê" nhẹ',
    },
    commonTrapVi: 'Người Việt chỉ có 1 âm /i/ lưng chừng ở giữa, nên dễ nhầm tai hại giữa "sheet" (khăn trải giường) và từ bậy, hay "leave" (rời đi) thành "live" (sống).',
    quickFixVi: 'Muốn nói /iː/ hãy cười rộng miệng; muốn nói /ɪ/ hãy thả lỏng toàn bộ cơ mặt.',
  },
  'stage-0-vowel-e-ae-contrast': {
    soundA: {
      phoneme: '/e/',
      label: 'Âm /e/ ngắn',
      lipShape: 'Khóe môi bè nhẹ sang 2 bên',
      lipIcon: '🙂',
      tonguePosition: 'Lưỡi ở độ cao trung bình, không quá sát vòm miệng',
      tongueIcon: '👅➡️',
      jawOpening: 'Mở vừa phải (khoảng 1 ngón tay đặt ngang)',
      voicing: 'voiced',
      airflowDesc: 'Bật âm dứt khoát, âm thanh sáng gọn',
      keyMnemonicVi: 'Tương tự âm "e" tiếng Việt nhưng dứt khoát hơn',
    },
    soundB: {
      phoneme: '/æ/',
      label: 'Âm /æ/ bẹt (Cat vowel)',
      lipShape: 'Mở rộng hết cỡ cả chiều ngang lẫn chiều dọc',
      lipIcon: '😲',
      tonguePosition: 'Cuống lưỡi ép sâu xuống đáy miệng, đầu lưỡi ép sát nướu răng dưới',
      tongueIcon: '👅⬇️',
      jawOpening: 'Hạ quai hàm sâu tối đa (khoảng 2 ngón tay đặt ngang)',
      voicing: 'voiced',
      airflowDesc: 'Âm vang từ sâu cổ họng, lai giữa "a" và "e"',
      keyMnemonicVi: 'Hạ hàm thật sâu như đang khám họng và kêu "a-e"',
    },
    commonTrapVi: 'Đọc "men" (những người đàn ông) và "man" (người đàn ông), "bed" (cái giường) và "bad" (tồi tệ) hoàn toàn giống nhau.',
    quickFixVi: 'Nhìn vào gương: Nếu nói từ "bad", hàm của bạn PHẢI rớt xuống sâu gấp đôi từ "bed".',
  },
  'stage-0-vowel-u-contrast': {
    soundA: {
      phoneme: '/uː/',
      label: 'Âm /uː/ dài',
      lipShape: 'Chu tròn môi chặt về phía trước như đang huýt sáo',
      lipIcon: '😗',
      tonguePosition: 'Cuống lưỡi nâng cao về phía vòm họng mềm phía sau',
      tongueIcon: '👅⬆️',
      jawOpening: 'Khép gần chạm nhau, chỉ hở một lỗ tròn nhỏ',
      voicing: 'voiced',
      airflowDesc: 'Ngân dài âm thanh tròn trịa trong 1-1.5 giây',
      keyMnemonicVi: 'Chu môi tròn nhỏ nhất có thể và ngân dài',
    },
    soundB: {
      phoneme: '/ʊ/',
      label: 'Âm /ʊ/ ngắn',
      lipShape: 'Môi hơi tròn nhẹ, thả lỏng, không chu chặt',
      lipIcon: '😮',
      tonguePosition: 'Cuống lưỡi hạ thấp hơn, thân lưỡi thư giãn',
      tongueIcon: '👅↔️',
      jawOpening: 'Hạ nhẹ hàm, khoang miệng rộng hơn',
      voicing: 'voiced',
      airflowDesc: 'Bật âm ngắn nửa giây, lai giữa "u" và "ư"',
      keyMnemonicVi: 'Thả lỏng môi, bật âm nhanh giống "u" pha chút "ư"',
    },
    commonTrapVi: 'Đọc "fool" (kẻ ngốc) thành "full" (no bụng), "pool" (hồ bơi) thành "pull" (kéo).',
    quickFixVi: 'Để phát âm /ʊ/ trong "book, look, good", đừng chu môi nhọn như khi nói tiếng Việt!',
  },
  'stage-0-consonant-th-s-contrast': {
    soundA: {
      phoneme: '/θ/',
      label: 'Âm /θ/ vô thanh (Unvoiced TH)',
      lipShape: 'Môi mở tự nhiên, để lộ hai hàm răng',
      lipIcon: '😬',
      tonguePosition: 'Đầu lưỡi đặt nhẹ giữa hai hàm răng (kẹp nhẹ 2-3mm)',
      tongueIcon: '👅🦷',
      jawOpening: 'Hé vừa đủ để đưa đầu lưỡi ra ngoài',
      voicing: 'voiceless',
      airflowDesc: 'Thổi luồng hơi ma sát trượt qua đầu lưỡi, cổ họng KHÔNG rung',
      keyMnemonicVi: 'Kẹp nhẹ đầu lưỡi giữa răng và thổi gió xì ra',
    },
    soundB: {
      phoneme: '/s/',
      label: 'Âm /s/ xì hơi',
      lipShape: 'Khóe môi bè ngang, cắn nhẹ hai hàm răng lại',
      lipIcon: '😁',
      tonguePosition: 'Lưỡi giấu hoàn toàn bên trong khoang miệng, sau mặt răng',
      tongueIcon: '👅⬅️',
      jawOpening: 'Hai hàm răng khép kín',
      voicing: 'voiceless',
      airflowDesc: 'Luồng hơi xì sắc nét qua khe răng',
      keyMnemonicVi: 'Khép răng và xì hơi tiếng "x" sắc bén',
    },
    commonTrapVi: 'Đọc "thank you" thành "thanh-kiu" (âm t) hoặc "xanh-kiu" (âm s), biến "think" (suy nghĩ) thành "sink" (bồn rửa).',
    quickFixVi: 'Nếu không thấy đầu lưỡi thò ra giữa 2 hàm răng, chắc chắn bạn đang nói sai âm /θ/!',
  },
  'stage-0-consonant-th-d-contrast': {
    soundA: {
      phoneme: '/ð/',
      label: 'Âm /ð/ hữu thanh (Voiced TH)',
      lipShape: 'Môi mở tự nhiên, để lộ đầu lưỡi kẹp giữa 2 hàm răng',
      lipIcon: '😬',
      tonguePosition: 'Đầu lưỡi kẹp nhẹ giữa hai hàm răng giống âm /θ/',
      tongueIcon: '👅🦷',
      jawOpening: 'Hé nhẹ để đưa đầu lưỡi ra',
      voicing: 'voiced',
      airflowDesc: 'Rung dây thanh quản cực mạnh tạo cảm giác "tê đầu lưỡi"',
      keyMnemonicVi: 'Kẹp đầu lưỡi giữa răng và rung cổ họng giống tiếng ong kêu',
    },
    soundB: {
      phoneme: '/d/',
      label: 'Âm /d/ bật',
      lipShape: 'Môi mở thư giãn',
      lipIcon: '🙂',
      tonguePosition: 'Đầu lưỡi chạm mạnh vào chân nướu răng trên rồi giật xuống',
      tongueIcon: '👅⬆️',
      jawOpening: 'Mở tự nhiên',
      voicing: 'voiced',
      airflowDesc: 'Âm bật nổ dứt khoát trong khoang miệng',
      keyMnemonicVi: 'Đập lưỡi nướu trên và giật xuống, không thè lưỡi',
    },
    commonTrapVi: 'Đọc "this, that, they" thành "đít, đát, đây" (âm d tiếng Việt).',
    quickFixVi: 'Cứ mỗi khi gặp chữ TH trong "this, that, there, mother", bắt buộc phải thò đầu lưỡi ra ngoài răng!',
  },
  'stage-0-consonant-sh-s-contrast': {
    soundA: {
      phoneme: '/ʃ/',
      label: 'Âm /ʃ/ chu môi (SH sound)',
      lipShape: 'Chu tròn môi về phía trước như động tác bảo "suỵt" im lặng',
      lipIcon: '🤫',
      tonguePosition: 'Thân lưỡi cong nâng lên hướng về vòm miệng, không chạm răng',
      tongueIcon: '👅🔄',
      jawOpening: 'Hở nhẹ, khoảng trống lớn trong khoang miệng',
      voicing: 'voiceless',
      airflowDesc: 'Luồng hơi thổi dày, ấm và trầm đục',
      keyMnemonicVi: 'Chu mỏ tròn về trước và thổi hơi "suỵt"',
    },
    soundB: {
      phoneme: '/s/',
      label: 'Âm /s/ bè môi',
      lipShape: 'Khóe môi kéo dẹp sang 2 bên như đang cười',
      lipIcon: '😁',
      tonguePosition: 'Đầu lưỡi ép sát mặt sau răng cửa dưới',
      tongueIcon: '👅⬇️',
      jawOpening: 'Khép sát răng',
      voicing: 'voiceless',
      airflowDesc: 'Luồng hơi xì mảnh, sắc bén và the thé',
      keyMnemonicVi: 'Cười tươi xì hơi "x"',
    },
    commonTrapVi: 'Đọc "she" (cô ấy) thành "see" (nhìn thấy), "ship" (tàu) thành "sip" (nhấp ngụm).',
    quickFixVi: 'Khi nói "she", môi PHẢI chu về phía trước như đang chuẩn bị hôn má ai đó.',
  },
  'stage-0-ending-sz-rules': {
    soundA: {
      phoneme: '/-s/ & /-z/',
      label: 'Âm đuôi S và Z',
      lipShape: 'Khép nhẹ răng, khóe môi hơi hé',
      lipIcon: '😬',
      tonguePosition: 'Đầu lưỡi nâng sát chân răng trên để luồng khí đi qua',
      tongueIcon: '👅⬆️',
      jawOpening: 'Khép gần chạm nhau',
      voicing: 'voiced',
      airflowDesc: 'Âm /-s/ là gió vô thanh; âm /-z/ là âm rung có độ ngân trong cổ',
      keyMnemonicVi: 'Vô thanh đi với /-s/, hữu thanh rung cổ đi với /-z/',
    },
    soundB: {
      phoneme: '/-ɪz/',
      label: 'Âm đuôi thêm âm tiết /-ɪz/',
      lipShape: 'Mở nhẹ rồi khép lại dứt khoát',
      lipIcon: '🙂',
      tonguePosition: 'Lưỡi lướt nhanh từ /ɪ/ sang /z/',
      tongueIcon: '👅↔️',
      jawOpening: 'Hạ nhẹ rồi khép',
      voicing: 'voiced',
      airflowDesc: 'Tạo thành 1 âm tiết riêng biệt hoàn chỉnh',
      keyMnemonicVi: 'Gặp âm gió s, z, ch, sh, ge thì thêm đuôi "ịt"',
    },
    commonTrapVi: 'Nuốt sạch âm đuôi hoặc từ nào cũng xì lung tung ("I like-x to eat-x rice-x").',
    quickFixVi: 'Nhớ nguyên tắc: Chỉ xì khi có chữ s, ce, se ở cuối từ!',
  },
  'stage-0-ending-stops-ptk': {
    soundA: {
      phoneme: '/-p/, /-t/, /-k/',
      label: 'Bộ 3 âm chặn kết thúc (Unvoiced Stops)',
      lipShape: 'Khép chặt môi cho /-p/, hé răng cho /-t, -k/',
      lipIcon: '🤐',
      tonguePosition: 'Chạm đầu lưỡi vào nướu trên cho /-t/, nâng cuống lưỡi chạm ngạc mềm cho /-k/',
      tongueIcon: '👅⬆️',
      jawOpening: 'Khép giữ lại trước khi nhả hơi nhẹ',
      voicing: 'voiceless',
      airflowDesc: 'Chặn hoàn toàn luồng hơi trong 0.1s rồi bật nhẹ (Stop and Release)',
      keyMnemonicVi: 'Dừng luồng hơi lại ở cuối từ, không nuốt biến mất',
    },
    commonTrapVi: 'Người Việt hay nuốt mất phụ âm cuối, biến "stop" thành "sto", "cat" thành "ca", "book" thành "bu".',
    quickFixVi: 'Trước khi dứt lời, hãy giữ khẩu hình cơ miệng ở vị trí chặn âm thêm 0.2 giây.',
  },
  'stage-0-ending-ed-rules': {
    soundA: {
      phoneme: '/-t/ & /-d/',
      label: 'Âm đuôi 1 âm tiết (90% động từ)',
      lipShape: 'Hé miệng tự nhiên',
      lipIcon: '🙂',
      tonguePosition: 'Đầu lưỡi đập mạnh vào chân răng trên',
      tongueIcon: '👅⬆️',
      jawOpening: 'Không đổi độ mở so với từ gốc',
      voicing: 'voiceless',
      airflowDesc: 'Chỉ bật âm /-t/ hoặc rung /-d/, TUYỆT ĐỐI không thêm âm tiết',
      keyMnemonicVi: 'Phải Kính Phục Sếp Chấn -> bật /-t/. Còn lại -> rung /-d/',
    },
    soundB: {
      phoneme: '/-ɪd/',
      label: 'Âm đuôi thêm âm tiết (Chỉ gặp T và D)',
      lipShape: 'Mở nhẹ rồi đập lưỡi',
      lipIcon: '😀',
      tonguePosition: 'Lưỡi lướt từ /ɪ/ lên /d/',
      tongueIcon: '👅⬆️',
      jawOpening: 'Hạ nhẹ tạo âm tiết thứ 2',
      voicing: 'voiced',
      airflowDesc: 'Phát âm thành âm tiết rõ ràng "ịt" (wanted, needed)',
      keyMnemonicVi: 'Thần chú "Tiền Đô" (T và D) mới được đọc là "ịt"',
    },
    commonTrapVi: 'Đọc tất cả đuôi -ed thành "ịt" ("looked" đọc thành "lục-kịt", "played" thành "play-ịt").',
    quickFixVi: 'Nhớ câu thần chú: Chỉ có "Tiền Đô" mới đọc là "ịt"!',
  },
  'stage-0-rhythm-linking': {
    soundA: {
      phoneme: 'C ‿ V',
      label: 'Quy tắc Nối âm Phụ âm sang Nguyên âm',
      lipShape: 'Chuyển động liên tục, không khép dừng ngắt quãng',
      lipIcon: '🌊',
      tonguePosition: 'Phụ âm cuối từ trước làm phụ âm đầu từ sau',
      tongueIcon: '👅➡️',
      jawOpening: 'Di chuyển uyển chuyển nhịp nhàng',
      voicing: 'voiced',
      airflowDesc: 'Luồng hơi như dải lụa không đứt quãng: "Ca-nI-ha-va"',
      keyMnemonicVi: 'Nhảy phụ âm cuối sang đầu từ tiếp theo',
    },
    commonTrapVi: 'Đọc từng từ rời rạc giật cục như máy đánh chữ ("Can... I... have... a...").',
    quickFixVi: 'Nói liền 3 từ như 1 từ duy nhất: "ca-ni-ha-va".',
  },
};

export interface MouthAnatomyStudioProps {
  lesson: Stage0PhoneticLesson;
  className?: string;
  onSelectWord?: (word: string) => void;
  videoNode?: React.ReactNode;
}

export function MouthAnatomyStudio({
  lesson,
  className = '',
  onSelectWord,
  videoNode,
}: MouthAnatomyStudioProps) {
  const [viewMode, setViewMode] = useState<'anatomy' | 'video'>('anatomy');
  const [isTipsExpanded, setIsTipsExpanded] = useState(true);

  const anatomy = ANATOMY_DATABASE[lesson.id] || {
    soundA: {
      phoneme: lesson.phonemes[0] || '',
      label: `Phát âm ${lesson.phonemes[0]}`,
      lipShape: 'Quan sát chuyển động môi',
      lipIcon: '👄',
      tonguePosition: 'Đặt lưỡi chính xác theo hướng dẫn',
      tongueIcon: '👅',
      jawOpening: 'Mở tự nhiên',
      voicing: 'voiced' as const,
      airflowDesc: 'Luồng hơi ổn định',
      keyMnemonicVi: lesson.mouthTipVi,
    },
    soundB: lesson.phonemes[1]
      ? {
          phoneme: lesson.phonemes[1],
          label: `Phát âm ${lesson.phonemes[1]}`,
          lipShape: 'Thả lỏng cơ miệng',
          lipIcon: '👄',
          tonguePosition: 'Vị trí lưỡi tương phản',
          tongueIcon: '👅',
          jawOpening: 'Hạ nhẹ hàm',
          voicing: 'voiced' as const,
          airflowDesc: 'Dứt khoát',
          keyMnemonicVi: lesson.mouthTipVi,
        }
      : undefined,
    commonTrapVi: lesson.descriptionVi,
    quickFixVi: lesson.mouthTipVi,
  };

  const soundA = anatomy.soundA;
  const soundB = anatomy.soundB;

  return (
    <div className={cn('space-y-4', className)}>
      {/* View Mode Switcher Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
            IPA
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                Phương Thức Học Khẩu Hình
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                Chuẩn 2026
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
              Không cần xem video cũ kéo dài — Nắm bắt cấu trúc cơ miệng và luồng hơi ngay tức thì!
            </p>
          </div>
        </div>

        {/* Mode Toggle Buttons */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
          <button
            type="button"
            onClick={() => setViewMode('anatomy')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all',
              viewMode === 'anatomy'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            )}
          >
            <Sparkles className="size-3.5 text-amber-500" />
            <span>Studio Khẩu Hình (Khuyên dùng)</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('video')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all',
              viewMode === 'video'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            )}
          >
            <Video className="size-3.5 text-slate-500" />
            <span>Video Tham Khảo</span>
          </button>
        </div>
      </div>

      {/* ── MODE 1: MODERN INTERACTIVE ANATOMY STUDIO (Default) ─────────────── */}
      {viewMode === 'anatomy' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Side-by-side or Single Sound Articulation Cards */}
          <div className={cn('grid gap-4', soundB ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1')}>
            {/* Sound A Card */}
            <div className="p-4 sm:p-5 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/40 via-white to-indigo-50/20 dark:from-slate-900 dark:via-indigo-950/20 dark:to-slate-900 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-indigo-100 dark:border-indigo-900/50">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                    {soundA.phoneme}
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      {soundA.label}
                    </h4>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase font-semibold">
                      {soundA.voicing === 'voiced' ? '🔊 Hữu thanh (Rung cổ)' : '💨 Vô thanh (Bật hơi)'}
                    </span>
                  </div>
                </div>

                <DualSpeedAudioButton text={soundA.phoneme.replace(/\//g, '')} size="sm" />
              </div>

              {/* 4 Articulation Anatomy Metrics */}
              <div className="space-y-2 text-xs">
                {/* Lip Shape */}
                <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex items-start gap-2.5">
                  <span className="text-lg select-none shrink-0">{soundA.lipIcon}</span>
                  <div>
                    <strong className="text-slate-800 dark:text-slate-200 block text-[11px] uppercase tracking-wider">
                      Khẩu hình Môi:
                    </strong>
                    <span className="text-slate-600 dark:text-slate-300 mt-0.5 block leading-relaxed">
                      {soundA.lipShape}
                    </span>
                  </div>
                </div>

                {/* Tongue Position */}
                <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex items-start gap-2.5">
                  <span className="text-lg select-none shrink-0">{soundA.tongueIcon}</span>
                  <div>
                    <strong className="text-slate-800 dark:text-slate-200 block text-[11px] uppercase tracking-wider">
                      Vị trí Lưỡi:
                    </strong>
                    <span className="text-slate-600 dark:text-slate-300 mt-0.5 block leading-relaxed">
                      {soundA.tonguePosition}
                    </span>
                  </div>
                </div>

                {/* Jaw & Airflow */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
                    <strong className="text-slate-800 dark:text-slate-200 block text-[10px] uppercase tracking-wider">
                      Độ mở hàm:
                    </strong>
                    <span className="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5 block leading-tight">
                      {soundA.jawOpening}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
                    <strong className="text-slate-800 dark:text-slate-200 block text-[10px] uppercase tracking-wider">
                      Luồng hơi:
                    </strong>
                    <span className="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5 block leading-tight">
                      {soundA.airflowDesc}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mnemonic Pill */}
              <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-[11px] text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5 font-medium">
                <Sparkles className="size-3.5 text-amber-500 shrink-0" />
                <span>Mẹo nhớ: <strong>{soundA.keyMnemonicVi}</strong></span>
              </div>
            </div>

            {/* Sound B Card (if contrast pair exists) */}
            {soundB && (
              <div className="p-4 sm:p-5 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-gradient-to-br from-amber-50/40 via-white to-amber-50/20 dark:from-slate-900 dark:via-amber-950/20 dark:to-slate-900 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-amber-100 dark:border-amber-900/50">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      {soundB.phoneme}
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {soundB.label}
                      </h4>
                      <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase font-semibold">
                        {soundB.voicing === 'voiced' ? '🔊 Hữu thanh (Rung cổ)' : '💨 Vô thanh (Bật hơi)'}
                      </span>
                    </div>
                  </div>

                  <DualSpeedAudioButton text={soundB.phoneme.replace(/\//g, '')} size="sm" />
                </div>

                {/* 4 Articulation Anatomy Metrics */}
                <div className="space-y-2 text-xs">
                  {/* Lip Shape */}
                  <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex items-start gap-2.5">
                    <span className="text-lg select-none shrink-0">{soundB.lipIcon}</span>
                    <div>
                      <strong className="text-slate-800 dark:text-slate-200 block text-[11px] uppercase tracking-wider">
                        Khẩu hình Môi:
                      </strong>
                      <span className="text-slate-600 dark:text-slate-300 mt-0.5 block leading-relaxed">
                        {soundB.lipShape}
                      </span>
                    </div>
                  </div>

                  {/* Tongue Position */}
                  <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex items-start gap-2.5">
                    <span className="text-lg select-none shrink-0">{soundB.tongueIcon}</span>
                    <div>
                      <strong className="text-slate-800 dark:text-slate-200 block text-[11px] uppercase tracking-wider">
                        Vị trí Lưỡi:
                      </strong>
                      <span className="text-slate-600 dark:text-slate-300 mt-0.5 block leading-relaxed">
                        {soundB.tonguePosition}
                      </span>
                    </div>
                  </div>

                  {/* Jaw & Airflow */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
                      <strong className="text-slate-800 dark:text-slate-200 block text-[10px] uppercase tracking-wider">
                        Độ mở hàm:
                      </strong>
                      <span className="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5 block leading-tight">
                        {soundB.jawOpening}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
                      <strong className="text-slate-800 dark:text-slate-200 block text-[10px] uppercase tracking-wider">
                        Luồng hơi:
                      </strong>
                      <span className="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5 block leading-tight">
                        {soundB.airflowDesc}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mnemonic Pill */}
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-700 dark:text-amber-300 flex items-center gap-1.5 font-medium">
                  <Sparkles className="size-3.5 text-amber-500 shrink-0" />
                  <span>Mẹo nhớ: <strong>{soundB.keyMnemonicVi}</strong></span>
                </div>
              </div>
            )}
          </div>

          {/* Vietnamese Trap & Instant Fix Banner */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                <AlertCircle className="size-4 text-amber-500 shrink-0" />
                <span>Tử huyệt người Việt hay mắc & Thần chú sửa nhanh</span>
              </div>
              <button
                type="button"
                onClick={() => setIsTipsExpanded(!isTipsExpanded)}
                className="text-xs text-slate-400 hover:text-slate-200 p-1"
                aria-label="Thu gọn/mở rộng mẹo"
              >
                {isTipsExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              </button>
            </div>

            {isTipsExpanded && (
              <div className="space-y-2 pt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800">
                <p>
                  <strong className="text-red-500 dark:text-red-400">Lỗi cố hữu:</strong> {anatomy.commonTrapVi}
                </p>
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 font-medium flex items-start gap-2">
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-[11px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Thần chú khắc phục tức thì:
                    </strong>
                    <span className="mt-0.5 block">{anatomy.quickFixVi}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODE 2: VIDEO MASTERCLASS (Optional/Collapsible) ─────────────── */}
      {viewMode === 'video' && (
        <div className="space-y-3 animate-in fade-in duration-200">
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Info className="size-3.5 text-indigo-500 shrink-0" />
              <span>Video tư liệu tham khảo. Bạn có thể bấm <strong>Studio Khẩu Hình</strong> bên trên để xem sơ đồ cơ miệng và học nhanh hơn!</span>
            </span>
          </div>
          {videoNode}
        </div>
      )}
    </div>
  );
}
