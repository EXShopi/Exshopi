/**
 * OptimizedImage Component
 * Handles WebP conversion, lazy loading, and responsive images for better performance
 * Features:
 * - Automatic WebP with PNG fallback
 * - Lazy loading for non-critical images
 * - Explicit width/height to prevent layout shift
 * - Preload support for LCP images
 * - Responsive sizing
 */

import React, { ImgHTMLAttributes, useState, useEffect } from 'react';

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
 const [imageSrc, setImageSrc] = useState<string>(() => {
  const normalizedSrc = src.startsWith("/") ? src : `/${src}`;

  if (!useWebP) {
    return normalizedSrc;
  }

  const { png } = getImageSources(src);
  return png;
});

  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Determine fetch priority
  const fetchPriority = priority === 'high' ? 'high' : priority === 'low' ? 'low' : 'auto';

  // Determine loading strategy
  const loadingStrategy = () => {
    if (priority === 'high' || !lazy) {
      return 'eager';
    }
    return 'lazy';
  };

  useEffect(() => {
    // On client side, prefer WebP but probe first so we don't switch to
    // a WebP URL that returns HTML or 404 (which would cause a broken image
    // and extra console noise). Start with the PNG (SSR-friendly) and
    // only switch to WebP if the probe succeeds.
    if (useWebP && typeof window !== 'undefined') {
      const { webp, png } = getImageSources(src);
      let cancelled = false;
      const probe = new Image();
      probe.onload = () => {
        if (!cancelled) setImageSrc(webp);
      };
      probe.onerror = () => {
        if (!cancelled) setImageSrc(png);
      };
      // Kick off probe (browser will request the resource)
      probe.src = webp;

      return () => {
        cancelled = true;
        probe.onload = null;
        probe.onerror = null;
      };
    }
  }, [src, useWebP]);

  const handleError = () => {
  try {
    const { webp, png } = getImageSources(src);

    if (imageSrc === webp && png && imageSrc !== png) {
      setImageSrc(png);
      return;
    }

    if (fallbackSrc && imageSrc !== fallbackSrc) {
      setImageSrc(fallbackSrc);
      return;
    }
  } catch (e) {
    // ignore
  }

  setHasError(true);
};

  const handleLoad = () => {
    setIsLoaded(true);
  };

  // Merge user styles with loading state styles
  const mergedStyle: React.CSSProperties = {
    ...style,
    backgroundColor: !isLoaded && !hasError ? placeholderColor : 'transparent',
    transition: 'background-color 0.3s ease-in-out',
  };

  // Only add explicit dimensions if provided
  const imgProps = {
    ...props,
    src: imageSrc,
    alt,
    className,
    style: mergedStyle,
    loading: loadingStrategy() as 'lazy' | 'eager',
    onError: handleError,
    onLoad: handleLoad,
    ...(fetchPriority !== 'auto' && { fetchPriority: fetchPriority as 'high' | 'low' | 'auto' }),
    ...(width && { width }),
    ...(height && { height }),
    decoding: 'async' as const,
  };

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
