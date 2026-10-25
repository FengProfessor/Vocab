'use client';

import { useEffect, useRef, useState, type VideoHTMLAttributes } from 'react';

type LazyVideoProps = Omit<VideoHTMLAttributes<HTMLVideoElement>, 'src'> & {
  src: string;
  /**
   * Margin root cho IntersectionObserver — mặc định '0px' (chỉ tải khi video thực sự lộ ra).
   * Trước đây '200px' khiến video nằm ngay dưới fold (top ~966px, viewport 800px) bị tải ngay lúc load.
   */
  rootMargin?: string;
  /** Tỉ lệ diện tích video phải hiện trong viewport trước khi gán src (0–1). Mặc định 0.25. */
  threshold?: number;
};

/**
 * Video chỉ gán src khi đã lộ vào viewport → tránh tải MP4 ngay lúc FCP.
 * Nên truyền `poster` (ảnh nhỏ) để khung video không trống trước khi kích hoạt.
 * Dùng cho demo landing / marketing.
 */
export function LazyVideo({
  src,
  rootMargin = '0px',
  threshold = 0.25,
  poster,
  className,
  children,
  preload = 'metadata',
  ...rest
}: LazyVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || active) return;

    // Fallback cũ: không có IO → activate ở macrotask (tránh setState sync trong effect body)
    if (typeof IntersectionObserver === 'undefined') {
      const t = setTimeout(() => setActive(true), 0);
      return () => clearTimeout(t);
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting && e.intersectionRatio >= threshold)) {
          setActive(true);
          io.disconnect();
        }
      },
      { rootMargin, threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [active, rootMargin, threshold]);

  return (
    <video
      ref={ref}
      className={className}
      poster={poster}
      // Chỉ set src khi visible — browser không tải file trước đó
      src={active ? src : undefined}
      preload={active ? preload : 'none'}
      {...rest}
    >
      {active ? children : null}
    </video>
  );
}
