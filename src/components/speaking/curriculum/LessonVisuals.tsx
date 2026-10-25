'use client';

import React from 'react';
import { MapPin, Target } from 'lucide-react';
import { DualSpeedAudioButton } from '@/components/speaking/foundation/DualSpeedAudioButton';
import {
  getLessonVisual,
  openMojiUrl,
  OPENMOJI_ATTRIBUTION,
  type LessonVisual,
} from '@/lib/speaking/lesson-visuals';

function Pic({ hex, alt, className = '' }: { hex: string; alt: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={openMojiUrl(hex)} alt={alt} loading="lazy" draggable={false} className={`select-none ${className}`} />
  );
}

interface LessonSceneCardProps {
  lessonId: string;
  contextVi?: string;
  /** compact: chỉ dải tranh + mục tiêu, dùng ở đầu bài; full: thêm đạo cụ có chú thích */
  variant?: 'full' | 'compact';
  className?: string;
}

/**
 * Khung "tranh bối cảnh": Ở đâu → Nói với ai → Có gì xung quanh → Bạn cần nói gì.
 * Giúp người mới hình dung tình huống trước khi mở miệng.
 */
export function LessonSceneCard({ lessonId, contextVi, variant = 'full', className = '' }: LessonSceneCardProps) {
  const visual = getLessonVisual(lessonId);
  if (!visual) return null;

  return (
    <figure
      className={`rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden ${className}`}
      aria-label={`Tranh bối cảnh: ${visual.place.labelVi}`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        {/* Stage: place + two speakers */}
        <div className="relative flex items-end justify-center gap-3 bg-gradient-to-b from-sky-950/60 via-slate-900 to-slate-950 px-4 pt-4 pb-3 min-h-[150px]">
          <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-md bg-slate-950/80 px-2 py-0.5 text-[11px] font-semibold text-sky-200 border border-sky-800/60">
            <MapPin className="size-3" /> {visual.place.labelVi}
          </span>
          <Pic hex={visual.place.hex} alt={visual.place.labelVi} className="absolute top-6 right-3 size-14 opacity-90" />
          <SpeakerTile person={visual.partner} role="Đối tác" tone="indigo" />
          <div className="mb-8 rounded-full bg-slate-800/80 px-2 py-0.5 text-[10px] text-slate-300 border border-slate-700">
            đang nói chuyện
          </div>
          <SpeakerTile person={visual.learner} role="Vai của bạn" tone="emerald" />
        </div>

        {/* Story text + props */}
        <figcaption className="p-4 space-y-3">
          {contextVi && <p className="text-xs sm:text-sm leading-relaxed text-slate-300">{contextVi}</p>}
          <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-950/20 px-3 py-2 text-xs sm:text-sm text-amber-100">
            <Target className="size-4 shrink-0 mt-0.5 text-amber-400" />
            <span>
              <strong className="text-amber-300">Bạn cần làm: </strong>
              {visual.goalVi}
            </span>
          </div>
          {variant === 'full' && visual.props.length > 0 && <PropsRow visual={visual} />}
        </figcaption>
      </div>
    </figure>
  );
}

function SpeakerTile({
  person,
  role,
  tone,
}: {
  person: LessonVisual['partner'];
  role: string;
  tone: 'indigo' | 'emerald';
}) {
  const ring = tone === 'indigo' ? 'border-indigo-500/50 bg-indigo-950/40' : 'border-emerald-500/50 bg-emerald-950/40';
  const text = tone === 'indigo' ? 'text-indigo-300' : 'text-emerald-300';
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`rounded-2xl border p-1.5 ${ring}`}>
        <Pic hex={person.hex} alt={person.name} className="size-16 sm:size-20" />
      </div>
      <span className="text-xs font-bold text-white leading-none">{person.name}</span>
      <span className={`text-[10px] font-semibold ${text}`}>{role}</span>
    </div>
  );
}

function PropsRow({ visual }: { visual: LessonVisual }) {
  return (
    <ul className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {visual.props.map((prop) => (
        <li
          key={`${prop.hex}-${prop.labelVi}`}
          className="flex flex-col items-center gap-1 rounded-lg border border-slate-800 bg-slate-950/50 p-2 text-center"
        >
          <Pic hex={prop.hex} alt={prop.labelVi} className="size-9" />
          <span className="text-[11px] leading-tight text-slate-300">{prop.labelVi}</span>
        </li>
      ))}
    </ul>
  );
}

/** Dải tranh thu nhỏ cho thẻ bài trong danh sách: địa điểm + đối tác + bạn. */
export function LessonSceneThumb({ lessonId }: { lessonId: string }) {
  const visual = getLessonVisual(lessonId);
  if (!visual) return null;
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-gradient-to-r from-sky-950/40 to-slate-950/60 px-3 py-2">
      <Pic hex={visual.place.hex} alt={visual.place.labelVi} className="size-9" />
      <div className="flex -space-x-1.5">
        <Pic hex={visual.partner.hex} alt={visual.partner.name} className="size-8" />
        <Pic hex={visual.learner.hex} alt={visual.learner.name} className="size-8" />
      </div>
      <div className="min-w-0 text-[11px] leading-tight">
        <div className="truncate font-semibold text-sky-200">{visual.place.labelVi}</div>
        <div className="truncate text-slate-400">
          Nói với {visual.partner.name} · {visual.goalVi}
        </div>
      </div>
    </div>
  );
}

/** Tranh nhỏ cạnh một từ (cặp âm tối thiểu); không render gì nếu từ chưa có tranh. */
export function MiniWordPicture({ url, alt }: { url?: string; alt: string }) {
  if (!url) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={alt} loading="lazy" draggable={false} className="size-7 select-none" />
  );
}

/** Avatar nhỏ cho từng lượt thoại. */
export function SpeakerAvatar({ hex, name, learner }: { hex: string; name: string; learner: boolean }) {
  return (
    <span
      className={`inline-flex size-9 items-center justify-center rounded-full border ${
        learner ? 'border-emerald-500/50 bg-emerald-950/50' : 'border-indigo-500/50 bg-indigo-950/50'
      }`}
      title={name}
    >
      <Pic hex={hex} alt={name} className="size-7" />
    </span>
  );
}

interface PictureWordCardProps {
  word: string;
  ipa?: string;
  meaningVi?: string;
  pictureUrl?: string;
  audioUrl?: string;
  hint?: string;
  /** Cấp CEFR-J của từ (nếu có trong danh sách). */
  level?: string;
}

/** Thẻ từ có tranh: nhìn hình → nghe → đọc to. Từ trừu tượng hiển thị chữ cái đầu thay cho tranh. */
export function PictureWordCard({ word, ipa, meaningVi, pictureUrl, audioUrl, hint, level }: PictureWordCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3 hover:border-slate-700 transition-colors">
      <div className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-950/70">
        {pictureUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={pictureUrl} alt={meaningVi || word} loading="lazy" className="size-11 select-none" draggable={false} />
        ) : (
          <span className="text-xl font-black text-slate-500" aria-hidden>
            {word.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-sm sm:text-base font-bold text-white">{word}</span>
          {ipa && <span className="text-xs font-mono text-amber-300">{ipa}</span>}
          {level && (
            <span
              className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-slate-700 bg-slate-800/80 text-slate-300"
              title="Cấp độ theo CEFR-J Wordlist (openlanguageprofiles/olp-en-cefrj)"
            >
              {level}
            </span>
          )}
        </div>
        {meaningVi && <p className="text-xs text-slate-400">{meaningVi}</p>}
        {hint && <p className="text-[11px] italic text-amber-300/80">💡 {hint}</p>}
      </div>
      <DualSpeedAudioButton text={word} audioUrl={audioUrl} size="sm" showLabels={false} />
    </div>
  );
}

/** Ghi công nguồn mở (bắt buộc với CC BY-SA). */
export function OpenSourceCredits() {
  return (
    <p className="text-[11px] leading-relaxed text-slate-500">
      Tranh minh họa:{' '}
      <a href={OPENMOJI_ATTRIBUTION.repoUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-300">
        OpenMoji
      </a>{' '}
      (
      <a href={OPENMOJI_ATTRIBUTION.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-300">
        {OPENMOJI_ATTRIBUTION.license}
      </a>
      ). IPA đối chiếu với{' '}
      <a href="https://github.com/open-dict-data/ipa-dict" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-300">
        ipa-dict
      </a>{' '}
      (MIT),{' '}
      <a href="https://github.com/cmusphinx/cmudict" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-300">
        CMUdict
      </a>{' '}
      (BSD) và{' '}
      <a href="https://github.com/JoseLlarena/Britfone" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-300">
        Britfone
      </a>{' '}
      (MIT). Cấp độ từ:{' '}
      <a href="https://github.com/openlanguageprofiles/olp-en-cefrj" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-300">
        CEFR-J Wordlist 1.5 (Tono Lab, TUFS) + Octanove C1/C2
      </a>{' '}
      (CC BY-SA 4.0). Video: YouTube, đã kiểm tra tồn tại, kênh và tiêu đề.
    </p>
  );
}
