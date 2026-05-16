/**
 * Lazy Loading Utility for Components
 * Defers component mounting until it comes into view or after initial page render
 * Improves Largest Contentful Paint (LCP) by avoiding non-critical API calls
 */

import React, { useEffect, useRef, useState } from 'react';

interface LazyComponentProps {
  /** The component to lazily render */
  children: React.ReactNode;
  /** Delay before rendering (ms) - defaults to deferring until next frame after initial paint */
  delayMs?: number;
  /** Use Intersection Observer to defer until visible */
  deferUntilVisible?: boolean;
  /** Placeholder while loading */
  placeholder?: React.ReactNode;
  /** Root margin for Intersection Observer */
  rootMargin?: string;
  /** Safety render timeout if an observer never reports visibility */
  fallbackDelayMs?: number;
}

/**
 * LazyComponent - Defers rendering of non-critical sections
 * Good for below-the-fold sections like FeaturedProducts, PopularProducts, etc.
 *
 * @example
 * <LazyComponent deferUntilVisible={true} placeholder={<Skeleton />}>
 *   <FeaturedProducts />
 * </LazyComponent>
 */
export const LazyComponent: React.FC<LazyComponentProps> = ({
  children,
  delayMs = 100,
  deferUntilVisible = true,
  placeholder = null,
  rootMargin = '50px',
  fallbackDelayMs = 1800,
}) => {
  const [shouldRender, setShouldRender] = useState(!deferUntilVisible);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (shouldRender && !deferUntilVisible) return;

    if (deferUntilVisible && typeof window !== 'undefined') {
      let timeoutId: number | null = null;
      const fallbackTimeoutId =
        fallbackDelayMs > 0
          ? window.setTimeout(() => setShouldRender(true), fallbackDelayMs)
          : null;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            if (fallbackTimeoutId !== null) {
              window.clearTimeout(fallbackTimeoutId);
            }
            if (delayMs > 0) {
              timeoutId = window.setTimeout(() => setShouldRender(true), delayMs);
            } else {
              setShouldRender(true);
            }
            observer.disconnect();
          }
        },
        { rootMargin }
      );

      if (containerRef.current) {
        observer.observe(containerRef.current);
      }

      return () => {
        observer.disconnect();
        if (fallbackTimeoutId !== null) {
          window.clearTimeout(fallbackTimeoutId);
        }
        if (timeoutId !== null) {
          window.clearTimeout(timeoutId);
        }
      };
    } else {
      // Use setTimeout to defer after initial render
      const timeout = window.setTimeout(() => setShouldRender(true), delayMs);
      return () => window.clearTimeout(timeout);
    }
  }, [delayMs, deferUntilVisible, fallbackDelayMs, rootMargin, shouldRender]);

  return (
    <div
      ref={containerRef}
      className="w-full"
      style={{
        contentVisibility: shouldRender ? 'visible' : 'auto',
        containIntrinsicSize: shouldRender ? undefined : '600px',
        minHeight: shouldRender ? undefined : '320px',
      }}
    >
      {shouldRender ? children : placeholder}
    </div>
  );
};

/**
 ** Hook for deferring API calls until after first paint
 * Prevents blocking initial render
 *
 * @example
 * const [data, loading] = useDeferredAPI(async () => await productAPI.getAll());
 */
export function useDeferredAPI<T>(
  asyncFn: () => Promise<T>,
  dependencies: React.DependencyList = [],
  delayMs: number = 1000
): [T | null, boolean, Error | null] {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let mounted = true;
    const timer = window.setTimeout(async () => {
      try {
        setLoading(true);
        const result = await asyncFn();
        if (mounted) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setData(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }, delayMs);

    return () => {
      mounted = false;
      window.clearTimeout(timer);
    };
  }, dependencies);

  return [data, loading, error];
}

export default LazyComponent;
