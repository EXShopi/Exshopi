import React, { useEffect, useRef, useState } from "react";
import { Skeleton } from "./Skeleton";

export default function LazyImage({
  src,
  alt,
  className = "",
  wrapperClassName = "",
  width,
  height,
  sizes,
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  wrapperClassName?: string;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shouldLoad, setShouldLoad] = useState(priority);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (priority) {
      setShouldLoad(true);
      return;
    }

    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "180px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [priority]);

  const wrapperStyle =
    width && height
      ? ({
          aspectRatio: `${width} / ${height}`,
        } satisfies React.CSSProperties)
      : undefined;

  return (
    <div ref={ref} className={`relative overflow-hidden ${wrapperClassName}`} style={wrapperStyle}>
      {!loaded && <Skeleton className="absolute inset-0 h-full w-full rounded-none" />}
      {shouldLoad ? (
        <img
          src={src}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          width={width}
          height={height}
          sizes={sizes}
          onLoad={() => setLoaded(true)}
          className={`${className} transition-all duration-500 ${loaded ? "scale-100 opacity-100 blur-0" : "scale-[1.03] opacity-0 blur-sm"}`}
        />
      ) : null}
    </div>
  );
}
