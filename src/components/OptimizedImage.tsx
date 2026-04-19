/**
 * OptimizedImage Component
 * Handles lazy loading and stable fallback image paths for the storefront.
 *
 * Important: many legacy assets in this project only exist as PNG/JPG files.
 * If we advertise a WebP <source> that does not exist, browsers that support
 * WebP will pick the broken candidate and never fall back to the PNG <img>.
 * For the generic image component we therefore prefer the concrete raster file
 * directly and keep <picture> support only in the explicit OptimizedPicture
 * component where assets are intentionally prepared for it.
 */

import React, { ImgHTMLAttributes } from 'react';

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  /** Image source path (without extension) - e.g., "/hero/hero-1" */
  src: string;
  /** Use WebP format if available (default: true) */
  useWebP?: boolean;
  /** Lazy load the image (default: true for non-LCP images) */
  lazy?: boolean;
  /** Image width in pixels */
  width?: number;
  /** Image height in pixels */
  height?: number;
  /** Priority: 'high' for LCP images, 'low' for others (default: 'auto') */
  priority?: 'high' | 'low' | 'auto';
  /** Alternative text for accessibility */
  alt: string;
  /** Fallback image source */
  fallbackSrc?: string;
  /** CSS class name */
  className?: string;
  /** Placeholder background color during load */
  placeholderColor?: string;
}

/**
 * Utility to convert image path to WebP with PNG fallback
 */
function getImageSources(
  src: string,
  useWebP: boolean = true
): { webp: string; png: string } {
  const path = src.startsWith("/") ? src : `/${src}`;

  let suffix = "";
  let pathname = path;

  const idx = path.search(/[?#]/);
  if (idx !== -1) {
    pathname = path.slice(0, idx);
    suffix = path.slice(idx);
  }

  const hasExtension = /\.(png|webp|jpg|jpeg|gif|svg)$/i.test(pathname);

  if (hasExtension) {
    const extMatch = pathname.match(/\.([a-zA-Z0-9]+)$/);
    const ext = extMatch ? extMatch[1].toLowerCase() : "png";
    const base = pathname.replace(/\.(png|webp|jpg|jpeg|gif|svg)$/i, "");

    return {
      webp: `${base}.webp${suffix}`,
      png: `${base}.${ext}${suffix}`,
    };
  }

  return {
    webp: `${pathname}.webp${suffix}`,
    png: `${pathname}.png${suffix}`,
  };
}
/**
 * OptimizedImage Component
 * Automatically serves WebP with PNG fallback, adds lazy loading, and prevents layout shift
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  useWebP = true,
  lazy = true,
  width,
  height,
  priority = 'auto',
  className = '',
  placeholderColor = 'transparent',
  fallbackSrc,
  style,
  ...props
}) => {
  const normalizedSrc = src.startsWith("/") ? src : `/${src}`;
  const { webp, png } = getImageSources(src);
  const imageSrc = fallbackSrc || (!useWebP ? normalizedSrc : png);

  // Determine fetch priority
  const fetchPriority = priority === 'high' ? 'high' : priority === 'low' ? 'low' : 'auto';

  // Determine loading strategy
  const loadingStrategy = () => {
    if (priority === 'high' || !lazy) {
      return 'eager';
    }
    return 'lazy';
  };

  const mergedStyle: React.CSSProperties = {
    ...style,
    backgroundColor: placeholderColor,
  };

  const imgProps = {
    ...props,
    src: imageSrc,
    alt,
    className,
    style: mergedStyle,
    loading: loadingStrategy() as 'lazy' | 'eager',
    ...(fetchPriority !== 'auto' && { fetchPriority: fetchPriority as 'high' | 'low' | 'auto' }),
    ...(width && { width }),
    ...(height && { height }),
    decoding: 'async' as const,
  };

  if (props.onError || !useWebP || normalizedSrc.startsWith('http')) {
    return <img {...imgProps} />;
  }

  if (!imageSrc) {
    const fallbackText = (alt || '').slice(0, 1).toUpperCase() || '';
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex items-center justify-center bg-slate-100 text-slate-700 ${className}`}
        style={{ width, height }}
      >
        <span className="text-lg font-bold">{fallbackText}</span>
      </div>
    );
  }

  return <img {...imgProps} />;
};

/**
 * Picture-based OptimizedImage component for advanced responsive images with WebP
 * Use this for hero images or critical LCP images
 */
interface OptimizedPictureProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  /** Image source path without extension */
  src: string;
  /** Image width in pixels */
  width?: number;
  /** Image height in pixels */
  height?: number;
  /** Priority: 'high' for LCP images */
  priority?: 'high' | 'low' | 'auto';
  /** Alternative text for accessibility */
  alt: string;
  /** Responsive image sizes (optional) */
  sizes?: string;
}

/**
 * OptimizedPicture Component
 * Uses <picture> element for better WebP support fallback
 */
export const OptimizedPicture: React.FC<OptimizedPictureProps> = ({
  src,
  alt,
  width,
  height,
  priority = 'auto',
  className = '',
  sizes,
  ...props
}) => {
  const { webp, png } = getImageSources(src);
  const fetchPriority = priority === 'high' ? 'high' : priority === 'low' ? 'low' : 'auto';
  const loading = priority === 'high' ? 'eager' : 'lazy';

  return (
    <picture>
      <source srcSet={webp} type="image/webp" />
      <img
        {...props}
        src={png}
        alt={alt}
        width={width}
        height={height}
        className={className}
        loading={loading as 'lazy' | 'eager'}
        fetchPriority={fetchPriority as 'high' | 'low' | 'auto'}
        decoding="async"
        sizes={sizes}
      />
    </picture>
  );
};

export default OptimizedImage;
