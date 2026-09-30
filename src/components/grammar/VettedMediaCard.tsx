'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Volume2,
  ChevronDown,
  ChevronUp,
  Play,
  BookOpen,
  AlertCircle,
  Video,
} from 'lucide-react';
import { speak } from '@/lib/study';
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
  vettedBy = 'Hội đồng Học thuật LingoPro',
  vettedDate = '2026-09-30',
  videoEmbedUrl,
  videoTitle,
  videoChapters,
  initialExpanded = true,
}: VettedMediaCardProps) {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Unify props from media asset or direct props
  const resolvedImageUrl = media?.imageUrl || imageUrl || '';
  const resolvedImageAlt = media?.imageAlt || imageAlt || caption || 'Minh họa ngữ cảnh ngữ pháp';
  const resolvedCaption = media?.caption || caption || '';
  const resolvedRule = media?.usageAnalysisVi?.rule || rule || '';
  const resolvedContextReason = media?.usageAnalysisVi?.contextReason || contextReason || '';
  const resolvedCommonMistake = media?.usageAnalysisVi?.commonMistake || commonMistake || '';
  const resolvedVideoEmbedUrl = media?.videoEmbedUrl || videoEmbedUrl || '';
  const resolvedVideoTitle = media?.videoTitle || videoTitle || 'Video bài giảng thực chiến';
  const resolvedVettedSource = media?.videoVettedSource || vettedBy;

  const handlePlayAudio = () => {
    if (audioUrl) {
      setIsPlayingAudio(true);
      const audio = new Audio(audioUrl);
      audio.onended = () => setIsPlayingAudio(false);
      audio.onerror = () => {
        setIsPlayingAudio(false);
        if (exampleEn) speak(exampleEn, 0.9);
      };
      audio.play().catch(() => {
        setIsPlayingAudio(false);
        if (exampleEn) speak(exampleEn, 0.9);
      });
      return;
    }

    if (exampleEn) {
      setIsPlayingAudio(true);
      speak(exampleEn, 0.9);
      setTimeout(() => setIsPlayingAudio(false), 2000);
    }
  };

  return (
    <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-none my-6 overflow-hidden">
      {/* Main Visual & Situational Section */}
      <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
        {/* Visual Asset Container (Left Pane - 5 cols) */}
        <div className="md:col-span-5 bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center p-4 relative min-h-[220px]">
          {resolvedImageUrl ? (
            <div className="relative w-full h-44 sm:h-52 flex items-center justify-center">
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
            <div className="flex flex-col items-center justify-center text-slate-400 py-10 font-mono text-xs">
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
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-snug">
                <FormattedText text={resolvedCaption} />
              </p>
            )}

            {/* Example sentence with native audio */}
            {(exampleEn || exampleVi) && (
              <div className="border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-3 rounded-none flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  {exampleEn && (
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-sans">
                      <FormattedText text={exampleEn} />
                    </p>
                  )}
                  {exampleVi && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      <FormattedText text={exampleVi} />
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handlePlayAudio}
                  aria-label="Nghe phát âm câu tình huống"
                  className={`p-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-none transition-colors shrink-0 ${
                    isPlayingAudio ? 'bg-primary text-white border-primary' : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Volume2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Collapsible Usage & Context Analysis */}
          {(resolvedRule || resolvedContextReason || resolvedCommonMistake) && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between text-left font-mono text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:text-primary transition-colors py-1"
              >
                <span className="font-bold flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-primary" />
                  Cách dùng & Tình huống thực tế
                </span>
                <span className="flex items-center gap-1 text-[11px] text-slate-500">
                  {isExpanded ? 'Thu gọn' : 'Mở rộng'}
                  {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </span>
              </button>

              {isExpanded && (
                <div className="mt-3 space-y-2.5 font-sans text-xs">
                  {resolvedRule && (
                    <div className="border-l-2 border-primary bg-slate-50 dark:bg-slate-950 p-2.5 space-y-1">
                      <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-primary block">
                        Quy tắc
                      </span>
                      <p className="text-slate-800 dark:text-slate-200 font-medium">
                        <FormattedText text={resolvedRule} />
                      </p>
                    </div>
                  )}

                  {resolvedContextReason && (
                    <div className="border-l-2 border-slate-400 dark:border-slate-600 bg-slate-50 dark:bg-slate-950 p-2.5 space-y-1">
                      <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-400 block">
                        Ngữ cảnh thực tế
                      </span>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
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
        <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4 text-primary" />
              <h4 className="font-serif text-sm font-semibold text-slate-900 dark:text-slate-100">
                {resolvedVideoTitle}
              </h4>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded-none">
              1080p
            </span>
          </div>

          <div className="relative aspect-video w-full bg-black rounded-none overflow-hidden border border-slate-300 dark:border-slate-700">
            <iframe
              src={resolvedVideoEmbedUrl}
              title={resolvedVideoTitle}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-picture; web-share"
              allowFullScreen
              className="w-full h-full border-0 rounded-none"
            />
          </div>

          {/* Chapter markers if available */}
          {videoChapters && videoChapters.length > 0 && (
            <div className="space-y-1.5 pt-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500 block">
                Phân đoạn bài học (Key Chapters):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {videoChapters.map((chapter, idx) => (
                  <div
                    key={idx}
                    className="p-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-none flex items-center justify-between text-xs"
                  >
                    <span className="text-slate-800 dark:text-slate-200 truncate pr-2">
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
