'use client';

import React from 'react';
import { PlayCircle, CheckCircle2, Lightbulb } from 'lucide-react';

interface GrammarVideoPlayerProps {
  videoUrl: string;
  title: string;
  topicTitle?: string;
}

export default function GrammarVideoPlayer({ videoUrl, title, topicTitle }: GrammarVideoPlayerProps) {
  if (!videoUrl) return null;

  return (
    <div className="space-y-4 my-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <PlayCircle className="h-5 w-5 text-rose-500" />
          <h3 className="font-serif text-base font-semibold text-foreground">Video bài giảng: {title}{topicTitle ? ` · ${topicTitle}` : ''}</h3>
        </div>
        <span className="text-[10px] font-mono font-semibold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
          1080p
        </span>
      </div>

      <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black group">
        <iframe
          src={videoUrl}
          title={`Bài giảng ngữ pháp: ${title}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="w-full h-full border-0"
        />
      </div>

      <div className="p-4 sm:p-5 rounded-xl bg-muted/20 space-y-2.5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          <span>Phương pháp học hiệu quả qua video</span>
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-muted-foreground">
          <li className="flex items-start gap-2 p-2.5 rounded-lg bg-background/50">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>Nắm chắc bản chất ngôn ngữ và lý do hình thành cấu trúc câu.</span>
          </li>
          <li className="flex items-start gap-2 p-2.5 rounded-lg bg-background/50">
            <CheckCircle2 className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
            <span>Đối chiếu bảng tra cứu bên cạnh để ghi nhớ hệ thống quy tắc.</span>
          </li>
          <li className="flex items-start gap-2 p-2.5 rounded-lg bg-background/50">
            <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <span>Luyện ngay bài tập thực hành để kích hoạt phản xạ tự nhiên.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
