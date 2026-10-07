'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Volume2,
  ChevronDown,
  ChevronUp,
  BookOpen,
  AlertCircle,
  Video,
} from 'lucide-react';
import { grammarAudio } from '@/lib/grammar/grammarAudioManager';
import type { VettedMediaAsset } from '@/lib/grammar-types';
import FormattedText from './FormattedText';

export interface VideoChapter {
  time: string;
  title: string;
}

export interface VettedMediaCardProps {
  media?: VettedMediaAsset;
  imageUrl?: string;
  imageAlt?: string;
  caption?: string;
  rule?: string;
  contextReason?: string;
  commonMistake?: string;
  sceneTitle?: string;
  exampleEn?: string;
  exampleVi?: string;
  audioUrl?: string;
  vettedBy?: string;
  vettedDate?: string;
  videoEmbedUrl?: string;
  videoTitle?: string;
  videoChapters?: VideoChapter[];
  initialExpanded?: boolean;
}

export default function VettedMediaCard({
  media,
  imageUrl,
  imageAlt,
  caption,
  rule,
  contextReason,
  commonMistake,
  sceneTitle,
  exampleEn,
  exampleVi,
  audioUrl,
  vettedBy: _vettedBy = '',
  vettedDate: _vettedDate = '2026-09-30',
  videoEmbedUrl,
  videoTitle,
  videoChapters,
  initialExpanded = true,
}: VettedMediaCardProps) {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const [audioState, setAudioState] = useState<{ isPlaying: boolean; activeId: string | null }>({
    isPlaying: false,
    activeId: null,
  });

  // Unify props from media asset or direct props
  const resolvedImageUrl = media?.imageUrl || imageUrl || '';
  const resolvedImageAlt = media?.imageAlt || imageAlt || caption || 'Minh họa ngữ cảnh ngữ pháp';
  const resolvedCaption = media?.caption || caption || '';
  const resolvedRule = media?.usageAnalysisVi?.rule || rule || '';
  const resolvedContextReason = media?.usageAnalysisVi?.contextReason || contextReason || '';
  const resolvedCommonMistake = media?.usageAnalysisVi?.commonMistake || commonMistake || '';
  const resolvedVideoEmbedUrl = media?.videoEmbedUrl || videoEmbedUrl || '';
  const resolvedVideoTitle = media?.videoTitle || videoTitle || 'Video bài giảng ngữ pháp';

  const cardAudioId = `media-${sceneTitle || resolvedImageUrl}`;

  React.useEffect(() => {
    return grammarAudio.subscribe(setAudioState);
  }, []);

  const isPlayingAudio = audioState.activeId === cardAudioId;

  // Auto-extract English & Vietnamese sentence if not explicitly passed
  let derivedEn = exampleEn || '';
  let derivedVi = exampleVi || '';
  if (!derivedEn && resolvedCaption) {
    const m = resolvedCaption.match(/^"([^"]+)"\s*(?:\(([^)]+)\))?/);
    if (m) {
      derivedEn = m[1].trim();
      derivedVi = m[2] ? m[2].trim() : '';
    }
  }

  const handlePlayAudio = () => {
    if (derivedEn || audioUrl) {
      grammarAudio.play(cardAudioId, derivedEn, audioUrl);
    }
  };

  return (
    <div className="border border-border bg-card rounded-none my-6 overflow-hidden shadow-xs">
      {/* Main Visual & Situational Section */}
      <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-border">
        {/* Visual Asset Container (Left Pane - 5 cols) */}
        <div className="md:col-span-5 bg-slate-50 dark:bg-muted/20 flex flex-col items-center justify-center p-4 relative min-h-[220px]">
          {resolvedImageUrl ? (
            <div className="relative w-full h-48 sm:h-56 flex items-center justify-center">
              <Image
                src={resolvedImageUrl}
                alt={resolvedImageAlt}
                fill
                className={`${resolvedImageUrl.endsWith('.svg') ? 'object-contain p-2' : 'object-cover'} rounded-none`}
                sizes="(max-width: 768px) 100vw, 40vw"
                unoptimized
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-muted-foreground py-10 font-mono text-xs">
              <BookOpen className="h-8 w-8 mb-2 opacity-40" />
              <span>Chưa có tư liệu hình ảnh</span>
            </div>
          )}
        </div>

        {/* Situational Context & Description (Right Pane - 7 cols) */}
        <div className="md:col-span-7 p-4 sm:p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-2.5">
            {sceneTitle && (
              <span className="font-mono text-[10px] uppercase font-bold tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-none inline-block">
                {sceneTitle}
              </span>
            )}

            {resolvedCaption && (
              <p className="text-sm font-medium text-foreground leading-snug">
                <FormattedText text={resolvedCaption} />
              </p>
            )}

            {/* Example sentence with native audio */}
            {(derivedEn || derivedVi) && (
              <div className="border border-border bg-slate-50 dark:bg-muted/20 p-3 rounded-none flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  {derivedEn && (
                    <p className="text-sm font-semibold text-foreground font-sans">
                      <FormattedText text={derivedEn} />
                    </p>
                  )}
                  {derivedVi && (
                    <p className="text-xs text-muted-foreground">
                      <FormattedText text={derivedVi} />
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handlePlayAudio}
                  aria-label="Nghe phát âm câu tình huống"
                  className={`p-2 border border-border hover:bg-muted rounded-none transition-colors shrink-0 ${
                    isPlayingAudio ? 'bg-primary text-primary-foreground border-primary' : 'text-foreground'
                  }`}
                >
                  <Volume2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Collapsible Usage & Context Analysis */}
          {(resolvedRule || resolvedContextReason || resolvedCommonMistake) && (
            <div className="pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between text-left font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors py-1"
              >
                <span className="font-bold flex items-center gap-1.5 text-foreground">
                  <BookOpen className="h-3.5 w-3.5 text-primary" />
                  Cách dùng & Tình huống thực tế
                </span>
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  {isExpanded ? 'Thu gọn' : 'Mở rộng'}
                  {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </span>
              </button>

              {isExpanded && (
                <div className="mt-3 space-y-2.5 font-sans text-xs">
                  {resolvedRule && (
                    <div className="border-l-2 border-primary bg-muted/10 p-2.5 space-y-1">
                      <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-primary block">
                        Quy tắc
                      </span>
                      <p className="text-foreground font-medium">
                        <FormattedText text={resolvedRule} />
                      </p>
                    </div>
                  )}

                  {resolvedContextReason && (
                    <div className="border-l-2 border-border bg-muted/10 p-2.5 space-y-1">
                      <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
                        Ngữ cảnh thực tế
                      </span>
                      <p className="text-muted-foreground leading-relaxed">
                        <FormattedText text={resolvedContextReason} />
                      </p>
                    </div>
                  )}

                  {resolvedCommonMistake && (
                    <div className="border-l-2 border-amber-600 bg-amber-500/5 dark:bg-amber-950/20 p-2.5 space-y-1">
                      <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Lỗi hay gặp
                      </span>
                      <p className="text-amber-900 dark:text-amber-200 leading-relaxed">
                        <FormattedText text={resolvedCommonMistake} />
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Vetted Video Embed Section (Optional) */}
      {resolvedVideoEmbedUrl && (
        <div className="border-t border-border bg-muted/10 p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4 text-primary" />
              <h4 className="font-serif text-sm font-semibold text-foreground">
                {resolvedVideoTitle}
              </h4>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground border border-border px-2 py-0.5 rounded-none">
              1080p
            </span>
          </div>

          <div className="relative aspect-video w-full bg-black rounded-none overflow-hidden border border-border">
            <iframe
              src={resolvedVideoEmbedUrl}
              title={resolvedVideoTitle}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full border-0 rounded-none"
            />
          </div>

          {/* Chapter markers if available */}
          {videoChapters && videoChapters.length > 0 && (
            <div className="space-y-1.5 pt-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block">
                Phân đoạn bài học:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {videoChapters.map((chapter, idx) => (
                  <div
                    key={idx}
                    className="p-2 border border-border bg-card rounded-none flex items-center justify-between text-xs"
                  >
                    <span className="text-foreground truncate pr-2">
                      {chapter.title}
                    </span>
                    <span className="font-mono font-semibold text-primary shrink-0 text-[11px]">
                      {chapter.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
