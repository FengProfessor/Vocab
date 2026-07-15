'use client';

import { useEffect, useRef, useState, type VideoHTMLAttributes } from 'react';

type LazyVideoProps = Omit<VideoHTMLAttributes<HTMLVideoElement>, 'src'> & {
  src: string;
  /** Margin root cho IntersectionObserver — mặc định 200px trước khi vào viewport */
  rootMargin?: string;
};

/**
 * Video chỉ gán src khi gần viewport → tránh tải MP4 lớn (1–5MB) ngay lúc FCP.
 * Dùng cho demo landing / marketing.
 */
export function LazyVideo({
  src,
  rootMargin = '200px',
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

    // Fallback cũ: không có IO → activate ở microtask (tránh setState sync trong effect body)
    if (typeof IntersectionObserver === 'undefined') {
      const t = setTimeout(() => setActive(true), 0);
      return () => clearTimeout(t);
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setActive(true);
          io.disconnect();
        }
      },
      { rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [active, rootMargin]);

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
