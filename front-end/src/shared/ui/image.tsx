import React from 'react';

export interface ImageProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'width' | 'height'> {
  src: string | { src: string; height?: number; width?: number };
  alt: string;
  width?: number | string;
  height?: number | string;
  fill?: boolean;
  priority?: boolean;
  quality?: number | string;
  unoptimized?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
}

/**
 * Client-side native <img> component with responsive fill & lazy-loading support.
 */
export const Image = React.forwardRef<HTMLImageElement, ImageProps>(
  (
    {
      src,
      alt,
      width,
      height,
      fill,
      priority,
      quality: _quality,
      unoptimized: _unoptimized,
      placeholder: _placeholder,
      blurDataURL: _blurDataURL,
      style,
      loading,
      ...rest
    },
    ref,
  ) => {
    const resolvedSrc = typeof src === 'string' ? src : src.src;
    const fillStyle: React.CSSProperties | undefined = fill
      ? {
          position: 'absolute',
          height: '100%',
          width: '100%',
          inset: 0,
          objectFit: 'cover',
          ...style,
        }
      : style;

    return (
      <img
        ref={ref}
        src={resolvedSrc}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        loading={priority ? 'eager' : (loading ?? 'lazy')}
        style={fillStyle}
        {...rest}
      />
    );
  },
);

Image.displayName = 'AppImage';

export default Image;
