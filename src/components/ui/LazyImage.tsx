import React, { useEffect, useRef, useState } from "react";
import { Skeleton } from "./Skeleton";

export default function LazyImage({
  src,
  alt,
  className = "",
  wrapperClassName = "",
  onError,
}: {
  src: string;
  alt: string;
  className?: string;
  wrapperClassName?: string;
  onError?: React.ReactEventHandler<HTMLImageElement>;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
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
  }, []);

  return (
    <div ref={ref} className={`relative overflow-hidden ${wrapperClassName}`}>
      {!loaded && <Skeleton className="absolute inset-0 h-full w-full rounded-none" />}
      {shouldLoad ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={onError}
          className={`${className} transition-all duration-500 ${loaded ? "scale-100 opacity-100 blur-0" : "scale-[1.03] opacity-0 blur-sm"}`}
        />
      ) : null}
    </div>
  );
}
