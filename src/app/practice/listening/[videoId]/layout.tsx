import type { Metadata } from 'next';
import React from 'react';
import videosIndex from '@/data/listening/videos-index.json';

interface Props {
  children: React.ReactNode;
  params: Promise<{ videoId: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ videoId: string }> }): Promise<Metadata> {
  const { videoId } = await params;
  const video = videosIndex.find((v) => v.id === videoId);

  if (!video) {
    return {
      title: 'Bài Học Luyện Nghe Video | LingoPro',
      description: 'Luyện nghe tiếng Anh qua video đời sống có phụ đề song ngữ tương tác.',
    };
  }

  const title = `${video.title} — Luyện Nghe Tiếng Anh ${video.cefrLevel} | LingoPro`;
  const description = `Luyện nghe tiếng Anh: "${video.title}" (${video.durationDisplay}, cấp độ ${video.cefrLevel}, ${video.topicDisplay}). Phụ đề song ngữ đồng bộ chính xác từng giây, tra từ vựng 1-chạm vào FSRS và trắc nghiệm nghe hiểu có dẫn chứng.`;
  const canonicalUrl = `https://lingopro.online/practice/listening/${video.id}`;
  const ogImage = video.thumbnailUrl || `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`;

  return {
    title,
    description,
    keywords: [
      video.title,
      `luyện nghe ${video.topicDisplay.toLowerCase()}`,
      `tiếng anh ${video.cefrLevel}`,
      video.channel,
      'luyện nghe tiếng anh qua video',
      'phụ đề song ngữ tương tác',
      'luyện nghe chép chính tả',
      'học từ vựng qua video',
    ],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'video.other',
      siteName: 'LingoPro',
      images: [
        {
          url: ogImage,
          width: 1280,
          height: 720,
          alt: video.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function VideoDetailLayout({ children, params }: Props) {
  const { videoId } = await params;
  const video = videosIndex.find((v) => v.id === videoId);

  let videoSchema = null;
  if (video) {
    const minutes = Math.floor(video.duration / 60);
    const seconds = video.duration % 60;
    const isoDuration = `PT${minutes}M${seconds}S`;

    videoSchema = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'VideoObject',
          name: video.title,
          description: video.description,
          thumbnailUrl: [video.thumbnailUrl],
          uploadDate: '2026-01-01T08:00:00+07:00',
          duration: isoDuration,
          embedUrl: `https://www.youtube-nocookie.com/embed/${video.youtubeId}`,
          publisher: {
            '@type': 'Organization',
            name: video.channel,
          },
          educationalLevel: video.cefrLevel,
          learningResourceType: 'Listening Practice Video',
          inLanguage: ['en', 'vi'],
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Trang chủ',
              item: 'https://lingopro.online',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Luyện nghe Video',
              item: 'https://lingopro.online/practice/listening',
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: video.title,
              item: `https://lingopro.online/practice/listening/${video.id}`,
            },
          ],
        },
      ],
    };
  }

  return (
    <>
      <link rel="preconnect" href="https://www.youtube-nocookie.com" />
      <link rel="preconnect" href="https://img.youtube.com" />
      <link rel="dns-prefetch" href="https://www.youtube-nocookie.com" />
      <link rel="dns-prefetch" href="https://i.ytimg.com" />
      {videoSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(videoSchema) }}
        />
      )}
      {children}
    </>
  );
}
