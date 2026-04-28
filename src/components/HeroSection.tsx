import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguageStore } from "../store/language";
import { analyticsAPI, bannerAPI } from "../services/api";
import { useSettingsStore } from "../store/settings";
import { OptimizedImage } from "./OptimizedImage";

export default function HeroSection() {
  const [remoteSlide, setRemoteSlide] = useState<any | null>(null);
  const { lang } = useLanguageStore();
  const { settings } = useSettingsStore();
  const isRtlText = ["arabic", "urdu", "persian"].includes(lang.toLowerCase());

  useEffect(() => {
    if (typeof window === "undefined") return;

    let mounted = true;
    let timeoutId: number | null = null;

    const loadRemoteSlide = async () => {
      try {
        const banners = await bannerAPI.getAll();
        if (!mounted || !Array.isArray(banners) || banners.length === 0) return;
        const first = [...banners].sort((a, b) => (a.order || 0) - (b.order || 0))[0];
        if (first) {
          let imageUrl = first.image || settings.homepage.hero.productImageUrl;
          if (typeof imageUrl === 'string' && !imageUrl.startsWith('http')) {
            imageUrl = imageUrl.replace(/\.png$/i, '.webp');
          }

          setRemoteSlide((current) => {
            const next = {
              id: first.id,
              tag: first.badge || "EXSHOPI MARKETPLACE",
              title: first.title || settings.homepage.hero.title,
              description: first.subtitle || settings.homepage.hero.subtitle,
              primaryCta: first.cta || settings.homepage.hero.primaryCtaText,
              primaryLink: first.link || settings.homepage.hero.primaryCtaLink,
              secondaryLink: "/categories",
              bg: first.color || "from-[#06142c] via-[#0f2347] to-[#31545f]",
              image: imageUrl,
              glowColor: "rgba(52, 168, 219, 0.5)",
            };

            if (
              current &&
              current.id === next.id &&
              current.image === next.image &&
              current.title === next.title
            ) {
              return current;
            }

            return next;
          });
        }
      } catch (error) {
        console.error("Failed to load homepage banners", error);
      }
    };

    const scheduleLoad = () => {
      timeoutId = window.setTimeout(() => {
        void loadRemoteSlide();
      }, 1800);
    };

    let rafId: number | null = null;
    const onLoad = () => {
      rafId = window.requestAnimationFrame(scheduleLoad);
    };

    if (document.readyState === "complete") {
      onLoad();
    } else {
      window.addEventListener("load", onLoad, { once: true });
    }

    return () => {
      mounted = false;
      window.removeEventListener("load", onLoad);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, [settings.homepage.hero.primaryCtaLink, settings.homepage.hero.primaryCtaText, settings.homepage.hero.productImageUrl, settings.homepage.hero.subtitle, settings.homepage.hero.title]);

  const baseSlide = useMemo(() => {
    const img = settings.homepage.hero.productImageUrl || '/hero/hero-1.webp';
    return {
      id: 'settings-hero-0',
      tag: settings.general.siteName ? `${settings.general.siteName.toUpperCase()} MARKETPLACE` : 'EXSHOPI MARKETPLACE',
      title: settings.homepage.hero.title,
      description: settings.homepage.hero.subtitle,
      primaryCta: settings.homepage.hero.primaryCtaText,
      primaryLink: settings.homepage.hero.primaryCtaLink,
      secondaryLink: '/categories',
      bg: 'from-[#06142c] via-[#0f2347] to-[#31545f]',
      image: img,
      glowColor: 'rgba(52, 168, 219, 0.5)',
    };
  }, [settings.homepage.hero, settings.general.siteName]);

  const slide = remoteSlide || baseSlide;
  const initialHeroImage = baseSlide.image;

  useEffect(() => {
    if (typeof document === "undefined" || !initialHeroImage) return;

    const managedLinks: HTMLLinkElement[] = [];
    const imageUrl = String(initialHeroImage);

    try {
      const resolvedUrl = imageUrl.startsWith("http")
        ? new URL(imageUrl)
        : new URL(imageUrl, window.location.origin);

      const preload = document.createElement("link");
      preload.rel = "preload";
      preload.as = "image";
      preload.href = resolvedUrl.toString();
      preload.setAttribute("fetchpriority", "high");
      managedLinks.push(preload);
      document.head.appendChild(preload);

      if (resolvedUrl.origin !== window.location.origin) {
        const preconnect = document.createElement("link");
        preconnect.rel = "preconnect";
        preconnect.href = resolvedUrl.origin;
        preconnect.crossOrigin = "anonymous";
        managedLinks.push(preconnect);
        document.head.appendChild(preconnect);
      }
    } catch {
      return;
    }

    return () => {
      managedLinks.forEach((link) => link.remove());
    };
  }, [initialHeroImage]);

  const handleBannerClick = (s: any) => {
    if (s?.id) {
      bannerAPI.trackClick(String(s.id)).catch(() => {});
    }
    analyticsAPI.track({
      eventType: 'banner_click',
      entityType: 'banner',
      entityId: String(s?.id || ''),
      metadata: { title: s?.title, link: s?.primaryLink },
    }).catch(() => {});
  };

  return (
    <section className="relative mx-auto mt-2.5 max-w-[1800px] overflow-x-hidden px-3 md:mt-6 md:px-6">
      <div
        className="pointer-events-none absolute inset-x-0 -top-10 bottom-0 rounded-[40px] blur-2xl opacity-70 transition-all duration-700 ease-in-out"
        style={{ background: `radial-gradient(ellipse at center, ${slide.glowColor} 0%, transparent 50%)`, zIndex: 0 }}
      />

      <div className="relative z-10 overflow-hidden rounded-[20px] border border-slate-200 shadow-lg md:rounded-[34px]">
        <div className="relative aspect-video min-h-[160px] w-full sm:min-h-[220px] md:aspect-[1280/420]" style={{ aspectRatio: '1280 / 420' }}>
          <div className="h-full w-full">
            <div className={`relative h-full w-full overflow-hidden bg-gradient-to-br ${slide.bg} text-white`}>
              {slide.image && (
                slide.image.startsWith('http') ? (
                  <img
                    src={slide.image}
                    alt={slide.title}
                    width={1280}
                    height={420}
                    className="absolute inset-0 h-full w-full object-cover opacity-[0.97] brightness-[1.14] saturate-[1.05]"
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    sizes="100vw"
                  />
                ) : (
                  <OptimizedImage
                    src={slide.image}
                    alt={slide.title}
                    className="absolute inset-0 h-full w-full object-cover opacity-[0.97] brightness-[1.14] saturate-[1.05]"
                    priority="high"
                    lazy={false}
                    useWebP={true}
                    width={1280}
                    height={420}
                    sizes="100vw"
                  />
                )
              )}

              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_22%),radial-gradient(circle_at_bottom_right,rgba(52,211,153,0.16),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_18%)]" />

              <div className="relative flex h-full items-center px-3.5 py-3.5 sm:px-6 sm:py-8 md:px-14 md:py-16">
                <div className="absolute inset-0 bg-gradient-to-r from-black/42 via-black/18 to-black/6" />
                <div className="absolute inset-y-0 left-0 w-[58%] bg-gradient-to-r from-black/16 via-black/10 to-transparent md:w-[48%]" />
                <div className="relative max-w-[86%] sm:max-w-[78%] md:max-w-3xl" dir={isRtlText ? 'rtl' : 'ltr'}>
                  <p className="mb-1 inline-flex rounded-full border border-white/30 bg-black/40 px-2.5 py-1 text-[6.5px] font-bold uppercase tracking-[0.14em] text-slate-100 shadow-lg backdrop-blur-sm md:mb-5 md:px-4 md:py-2 md:text-[11px]">
                    {slide.tag}
                  </p>

                  <h1 className="max-w-[210px] text-[1.18rem] font-black leading-[1.04] text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)] sm:max-w-3xl sm:text-[1.85rem] md:text-[52px] xl:text-[64px]">
                    {slide.title}
                  </h1>

                  <p className="mt-1.5 max-w-[210px] text-[10px] leading-4 text-slate-100 drop-shadow-[0_1px_8px_rgba(0,0,0,0.4)] sm:max-w-xl sm:text-[14px] md:mt-5 md:max-w-2xl md:text-lg md:leading-8">
                    {slide.description}
                  </p>

                  <div className="mt-2 flex flex-col items-start gap-1.5 sm:flex-row sm:flex-wrap md:mt-8 md:gap-4">
                    <Link
                      to={slide.primaryLink}
                      onClick={() => handleBannerClick(slide)}
                      className="group relative inline-flex w-auto min-h-[28px] items-center justify-center self-start rounded-full bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-1.5 text-[10px] font-bold text-white shadow-lg shadow-blue-600/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-600/50 sm:min-h-[34px] sm:rounded-2xl sm:px-3.5 sm:py-2 sm:text-[11px] md:min-h-[56px] md:px-7 md:py-4 md:text-base"
                    >
                      <span className="relative z-10">{slide.primaryCta}</span>
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100 sm:rounded-2xl" />
                    </Link>

                    <Link
                      to={slide.secondaryLink}
                      className="group inline-flex w-auto min-h-[28px] items-center justify-center self-start rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-[10px] font-bold text-white backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-white/50 hover:bg-white/20 sm:min-h-[34px] sm:rounded-2xl sm:px-3.5 sm:py-2 sm:text-[11px] md:min-h-[56px] md:px-7 md:py-4 md:text-base"
                    >
Browse Categories                    </Link>
                  </div>
                </div>
              </div>

              <div className="pointer-events-none absolute right-0 top-0 h-44 w-44 translate-x-1/4 -translate-y-1/4 rounded-full bg-white/10 blur-3xl md:h-56 md:w-56" />
              <div className="pointer-events-none absolute bottom-0 right-0 h-52 w-52 translate-x-1/4 translate-y-1/4 rounded-full bg-emerald-400/20 blur-3xl md:h-72 md:w-72" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
