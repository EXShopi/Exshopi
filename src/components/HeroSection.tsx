import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguageStore } from "../store/language";
import { analyticsAPI, bannerAPI } from "../services/api";
import { useSettingsStore } from "../store/settings";

export default function HeroSection() {
  const [current, setCurrent] = useState(0);
  const [remoteSlides, setRemoteSlides] = useState<any[]>([]);
  const { lang } = useLanguageStore();
  const { settings } = useSettingsStore();
  const isTranslated = lang.toLowerCase() !== "english";
  const isRtlText = ["arabic", "urdu", "persian"].includes(lang.toLowerCase());

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const banners = await bannerAPI.getAll();
        if (!mounted || !Array.isArray(banners) || banners.length === 0) return;
        setRemoteSlides(
          banners
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map((banner: any, index: number) => ({
              id: banner.id || index + 1,
              tag: banner.badge || "EXSHOPI MARKETPLACE",
              title: banner.title || settings.homepage.hero.title,
              description: banner.subtitle || settings.homepage.hero.subtitle,
              primaryCta: banner.cta || settings.homepage.hero.primaryCtaText,
              secondaryCta: "Browse Categories",
              primaryLink: banner.link || settings.homepage.hero.primaryCtaLink,
              secondaryLink: "/categories",
              bg: banner.color || "from-[#06142c] via-[#0f2347] to-[#31545f]",
              image: banner.image || settings.homepage.hero.productImageUrl,
              glowColor: "rgba(52, 168, 219, 0.5)",
            }))
        );
      } catch (error) {
        console.error("Failed to load homepage banners", error);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [settings.homepage.hero.primaryCtaLink, settings.homepage.hero.primaryCtaText, settings.homepage.hero.productImageUrl, settings.homepage.hero.subtitle, settings.homepage.hero.title]);

  const baseSlides = useMemo(() => {
    if (remoteSlides.length > 0) return remoteSlides;

    // Fallback: generate 5 hero slides using public/hero images when no remote banners exist
    const images = ['/hero/hero-1.png', '/hero/hero-2.png', '/hero/hero-3.png', '/hero/hero-4.png', '/hero/hero-5.png'];
    return images.map((img, idx) => ({
      id: `settings-hero-${idx}`,
      tag: settings.general.siteName ? `${settings.general.siteName.toUpperCase()} MARKETPLACE` : 'EXSHOPI MARKETPLACE',
      title: settings.homepage.hero.title,
      description: settings.homepage.hero.subtitle,
      primaryCta: settings.homepage.hero.primaryCtaText,
      secondaryCta: 'Browse Categories',
      primaryLink: settings.homepage.hero.primaryCtaLink,
      secondaryLink: '/categories',
      bg: 'from-[#06142c] via-[#0f2347] to-[#31545f]',
      image: img,
      glowColor: 'rgba(52, 168, 219, 0.5)',
    }));
  }, [remoteSlides, settings.general.siteName, settings.homepage.hero]);

  const translatedSlides = baseSlides.map((slide) => ({
    ...slide,
    tag:
      lang === "Arabic" ? "عروض مميزة" :
      lang === "Hindi" ? "विशेष संग्रह" :
      lang === "Urdu" ? "نمایاں کلیکشن" :
      lang === "Persian" ? "کالکشن ویژه" :
      lang === "Russian" ? "Специальная коллекция" :
      slide.tag,
    title:
      lang === "Arabic" ? "تسوّق الإلكترونيات ومنتجات الاستخدام اليومي من بائعين موثوقين" :
      lang === "Hindi" ? "इलेक्ट्रॉनिक्स और रोज़मर्रा के प्रोडक्ट एक भरोसेमंद मार्केटप्लेस में" :
      lang === "Urdu" ? "الیکٹرونکس اور روزمرہ مصنوعات ایک قابل اعتماد مارکیٹ پلیس میں" :
      lang === "Persian" ? "لوازم الکترونیکی و محصولات روزانه را از فروشندگان معتبر بخرید" :
      lang === "Russian" ? "Покупайте электронику и товары на каждый день у надежных продавцов" :
      slide.title,
    description:
      lang === "Arabic" ? "اكتشف اللابتوبات والهواتف والإكسسوارات ومنتجات المنزل من أفضل البائعين في الإمارات." :
      lang === "Hindi" ? "यूएई के लिए चुने गए लैपटॉप, मोबाइल, एक्सेसरीज़ और होम एसेंशियल्स खोजें।" :
      lang === "Urdu" ? "یو اے ای کے صارفین کے لیے منتخب لیپ ٹاپ، موبائل، ایکسیسریز اور ہوم پراڈکٹس دریافت کریں۔" :
      lang === "Persian" ? "لپ‌تاپ، موبایل، لوازم جانبی و محصولات خانه را از فروشندگان برتر امارات کشف کنید." :
      lang === "Russian" ? "Откройте для себя ноутбуки, телефоны, аксессуары и товары для дома для покупателей в ОАЭ." :
      slide.description,
    primaryCta:
      lang === "Arabic" ? "ابدأ التسوق" :
      lang === "Hindi" ? "खरीदारी शुरू करें" :
      lang === "Urdu" ? "شاپنگ شروع کریں" :
      lang === "Persian" ? "شروع خرید" :
      lang === "Russian" ? "Начать покупки" :
      slide.primaryCta,
    secondaryCta:
      lang === "Arabic" ? "تصفح الفئات" :
      lang === "Hindi" ? "श्रेणियां देखें" :
      lang === "Urdu" ? "کیٹیگریز دیکھیں" :
      lang === "Persian" ? "مشاهده دسته‌ها" :
      lang === "Russian" ? "Смотреть категории" :
      slide.secondaryCta,
  }));

  useEffect(() => {
    if (current >= translatedSlides.length) {
      setCurrent(0);
    }
  }, [current, translatedSlides.length]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrent((prev) => (prev + 1) % translatedSlides.length);
    }, 7000);

    return () => window.clearInterval(timer);
  }, [translatedSlides.length]);

  const goPrev = () => {
    setCurrent((prev) => (prev - 1 + translatedSlides.length) % translatedSlides.length);
  };

  const goNext = () => {
    setCurrent((prev) => (prev + 1) % translatedSlides.length);
  };

  const handleBannerClick = (slide: (typeof translatedSlides)[number]) => {
    if (remoteSlides.length > 0 && slide.id) {
      bannerAPI.trackClick(String(slide.id)).catch((error) => {
        console.error("Failed to track banner click", error);
      });
    }

    analyticsAPI.track({
      eventType: "banner_click",
      entityType: "banner",
      entityId: String(slide.id),
      metadata: {
        title: slide.title,
        link: slide.primaryLink,
      },
    }).catch((error) => {
      console.error("Failed to track banner analytics", error);
    });
  };

  return (
    <section className="relative mx-auto mt-2.5 max-w-[1800px] px-3 md:mt-6 md:px-6">
      {/* Dynamic glow effect layer - positioned outside hero */}
      <div
        className="absolute -inset-12 rounded-[40px] blur-2xl opacity-70 transition-all duration-700 ease-in-out pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, ${translatedSlides[current].glowColor} 0%, transparent 50%)`,
          zIndex: 0,
        }}
      />

      <div className="relative z-10 overflow-hidden rounded-[20px] border border-slate-200 shadow-lg md:rounded-[34px]">
        <div className="relative h-[224px] w-full sm:h-[300px] md:aspect-[2048/890] md:max-h-[700px] md:min-h-[380px]">
          <div
            className="flex h-full transition-transform duration-700 ease-in-out"
            style={{ transform: `translateX(-${current * 100}%)` }}
          >
            {translatedSlides.map((slide) => (
              <div key={slide.id} className="h-full min-w-full">
                <div
                  className={`relative h-full w-full overflow-hidden bg-gradient-to-br ${slide.bg} text-white`}
                >
                  {slide.image && (
                    <img
                      src={slide.image}
                      alt={slide.title}
                      className="absolute inset-0 h-full w-full object-cover opacity-[0.97] brightness-[1.14] saturate-[1.05]"
                    />
                  )}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_22%),radial-gradient(circle_at_bottom_right,rgba(52,211,153,0.16),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_18%)]" />

                  <div className="relative flex h-full items-center px-3.5 py-3.5 sm:px-6 sm:py-8 md:px-14 md:py-16">
                    <div className="absolute inset-0 bg-gradient-to-r from-black/42 via-black/18 to-black/6" />
                    <div className="absolute inset-y-0 left-0 w-[58%] bg-gradient-to-r from-black/16 via-black/10 to-transparent md:w-[48%]" />
                    <div className="relative max-w-[86%] sm:max-w-[78%] md:max-w-3xl" dir={isRtlText ? "rtl" : "ltr"}>
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
                          {slide.secondaryCta}
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
                  <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
                </div>
              </div>
            ))}
          </div>

          <div className="absolute bottom-3 right-4 z-20 md:bottom-8 md:right-14">
            <div className="hidden items-center gap-2 md:flex md:gap-3">
              <button
                type="button"
                onClick={goPrev}
                aria-label="Previous slide"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/20 md:h-12 md:w-12"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={goNext}
                aria-label="Next slide"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/20 md:h-12 md:w-12"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
