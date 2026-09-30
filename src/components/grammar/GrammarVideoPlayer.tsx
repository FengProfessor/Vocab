'use client';

import React, { useState, useEffect } from 'react';
import { PlayCircle, ExternalLink, Video } from 'lucide-react';

export interface GrammarVideoPlayerProps {
  topicSlug?: string;
  topicTitle?: string;
  topicTitleVi?: string;
  title?: string;
  videoUrl?: string;
  defaultVideoUrl?: string;
}

// Curated concise, high-yield educational YouTube videos for core grammar topics
export const CURATED_GRAMMAR_VIDEOS: Record<string, { id: string; title: string; duration: string; channel: string }> = {
  'personal-pronouns': {
    id: 'ZADvy_r6ZlQ',
    title: 'Subject and Object Pronouns in English',
    duration: '3:45',
    channel: 'Oxford Online English',
  },
  'verb-to-be': {
    id: 'q6j7qC_k81o',
    title: 'Verb to Be: Am, Is, Are in English Grammar',
    duration: '3:10',
    channel: 'BBC Learning English',
  },
  'demonstratives': {
    id: '4M_R_l7C6nI',
    title: 'This, That, These, Those - Demonstrative Pronouns',
    duration: '2:30',
    channel: 'Learn English',
  },
  'possessives': {
    id: '9lE_E7H9r2Q',
    title: 'Possessive Adjectives vs Possessive Pronouns',
    duration: '4:15',
    channel: 'English with Lucy',
  },
  'plural-nouns': {
    id: 'Kk4nC-lKx7w',
    title: 'Plural Nouns Rules in English',
    duration: '3:20',
    channel: 'Easy English',
  },
  'present-simple': {
    id: 'L9AWrJnhsRI',
    title: 'Present Simple Tense - Structure & Rules',
    duration: '4:50',
    channel: 'Oxford Online English',
  },
  'present-continuous': {
    id: 'UdEasleUc54',
    title: 'Present Continuous Tense Explained',
    duration: '3:40',
    channel: 'BBC Learning English',
  },
  'past-simple': {
    id: '0b4rsUtq9DA',
    title: 'Past Simple Tense in English',
    duration: '5:10',
    channel: 'Oxford Online English',
  },
  'articles': {
    id: '13R_8XWzX7k',
    title: 'A, An, The: How to Use Articles in English',
    duration: '4:30',
    channel: 'BBC Learning English',
  },
  'there-is-there-are': {
    id: 'l_a6a0H_bYk',
    title: 'There is vs There are in English',
    duration: '2:45',
    channel: 'English Grammar',
  },
  'prepositions-place': {
    id: 'xyMrLQ4ZI-4',
    title: 'Prepositions of Place: In, On, At',
    duration: '3:50',
    channel: 'Oxford Online English',
  },
  'prepositions-time': {
    id: 'H208kZ5QkO4',
    title: 'Prepositions of Time: At, On, In',
    duration: '4:00',
    channel: 'BBC Learning English',
  },
};

/**
 * Extracts standard 11-char YouTube ID from any standard URL, short url, shorts URL, or embed URL
 */
export function extractYouTubeId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = trimmed.match(regExp);
  return match ? match[1] : null;
}

export default function GrammarVideoPlayer({
  topicSlug,
  topicTitle = '',
  topicTitleVi = '',
  title = '',
  videoUrl,
  defaultVideoUrl,
}: GrammarVideoPlayerProps) {
  const initialUrl = (videoUrl || defaultVideoUrl || '').trim();

  // If neither a valid initialUrl nor topicSlug is provided, return null (null safety & test compatibility)
  if (!topicSlug && !initialUrl) {
    return null;
  }

  const curated = topicSlug ? CURATED_GRAMMAR_VIDEOS[topicSlug] : undefined;
  const displayTitle = topicTitle || title || 'Bài học ngữ pháp';

  const [activeVideoId, setActiveVideoId] = useState<string | null>(() => {
    if (initialUrl) {
      return extractYouTubeId(initialUrl) || initialUrl;
    }
    if (curated) return curated.id;
    return null;
  });

  useEffect(() => {
    if (initialUrl) {
      const extracted = extractYouTubeId(initialUrl);
      setActiveVideoId(extracted || initialUrl);
    } else if (curated) {
      setActiveVideoId(curated.id);
    } else {
      setActiveVideoId(null);
    }
  }, [topicSlug, initialUrl, curated]);

  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `learn English ${displayTitle} grammar short`
  )}`;

  return (
    <div className="space-y-3 animate-in fade-in duration-150">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
        <div>
          <div className="flex items-center gap-2">
            <PlayCircle className="h-4 w-4 text-rose-600" />
            <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Video bài giảng
            </span>
          </div>
          <h3 className="font-serif text-lg font-bold text-foreground mt-0.5">
            {displayTitle} {topicTitleVi && topicTitleVi !== displayTitle ? `— ${topicTitleVi}` : ''}
          </h3>
        </div>

        {activeVideoId && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-2 py-0.5 border border-border bg-muted/40 font-medium text-muted-foreground">
              {curated ? curated.channel : 'YouTube'}
            </span>
            <a
              href={`https://www.youtube.com/watch?v=${activeVideoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 font-mono text-[11px] p-1 border border-border hover:bg-muted"
              title="Mở trên YouTube"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        )}
      </div>

      {/* Video Player Box */}
      {activeVideoId ? (
        <div className="relative aspect-video w-full rounded-none border border-border overflow-hidden bg-black shadow-sm">
          <iframe
            src={activeVideoId.startsWith('http') ? activeVideoId : `https://www.youtube-nocookie.com/embed/${activeVideoId}?rel=0`}
            title={`Bài giảng: ${displayTitle}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full border-0"
          />
        </div>
      ) : (
        <div className="border border-dashed border-border p-8 text-center bg-muted/10 space-y-3">
          <Video className="h-7 w-7 text-muted-foreground mx-auto stroke-1" />
          <div className="text-xs text-muted-foreground">Chưa có video mặc định cho chủ điểm này</div>
          <a
            href={youtubeSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 border border-border bg-background hover:bg-muted text-foreground px-3 py-1.5 font-mono text-xs uppercase tracking-wider font-semibold transition-colors"
          >
            <span>Tìm video trên YouTube</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
    </div>
  );
}
