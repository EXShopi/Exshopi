import { Link } from "react-router-dom";
import { useMemo, useState } from "react";

type PromoBox = {
  id: string;
  badge: string;
  title: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  imageUrl?: string;
  tone: 'dark' | 'light';
  show: boolean;
};

type PromoSectionProps = {
  boxes?: PromoBox[];
};

const DEFAULT_PROMO_IMAGES: Record<string, string> = {
  "promo-1": "/categories/Tshirt1.png",
  "promo-2": "/Category Card/footwear.webp",
};

const DEFAULT_PROMO_FALLBACKS: Record<string, string> = {
  "promo-1": "/categories/Tshirt1.png",
  "promo-2": "/Category Card/footwear.png",
};

function resolvePromoImage(box: PromoBox) {
  const title = String(box.title || "").toLowerCase();

  if (box.imageUrl?.trim()) return box.imageUrl.trim();
  if (title.includes("t-shirt") || title.includes("clothing")) return DEFAULT_PROMO_IMAGES["promo-1"];
  if (title.includes("shoe") || title.includes("footwear")) return DEFAULT_PROMO_IMAGES["promo-2"];
  return DEFAULT_PROMO_IMAGES[box.id] || "";
}

function PromoImage({ box }: { box: PromoBox }) {
  const initialImage = useMemo(() => resolvePromoImage(box), [box]);
  const fallbackImage = DEFAULT_PROMO_FALLBACKS[box.id] || DEFAULT_PROMO_IMAGES[box.id] || "";
  const [imageSrc, setImageSrc] = useState(initialImage);

  if (!imageSrc) {
    return (
      <div className={`flex h-full w-full items-center justify-center text-center text-sm font-bold ${
        box.tone === 'dark' ? 'text-slate-200' : 'text-slate-600'
      }`}>
        Featured collection image
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={box.title}
      className="h-full w-full object-cover object-center"
      loading="lazy"
      onError={() => {
        if (fallbackImage && imageSrc !== fallbackImage) {
          setImageSrc(fallbackImage);
        }
      }}
    />
  );
}

export default function PromoSection({ boxes = [] }: PromoSectionProps) {
  const visibleBoxes = boxes.filter((box) => box.show).slice(0, 2);
  if (!visibleBoxes.length) return null;

  return (
    <section className="mx-auto mt-8 max-w-[1800px] px-4 md:px-6">
      <div className="grid gap-5 md:grid-cols-2">
        {visibleBoxes.map((box) => (
          <div
            key={box.id}
            className={`relative overflow-hidden rounded-[28px] border p-5 shadow-sm md:min-h-[320px] md:rounded-[32px] md:p-10 ${
              box.tone === 'dark'
                ? 'border-slate-200 bg-slate-900 text-white'
                : 'border-emerald-100 bg-emerald-50 text-slate-900'
            }`}
          >
            <div
              className={`absolute inset-0 ${
                box.tone === 'dark'
                  ? 'bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(52,211,153,0.18),transparent_26%)]'
                  : 'bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_22%),radial-gradient(circle_at_bottom_left,rgba(15,23,42,0.04),transparent_24%)]'
              }`}
            />
            <div className="relative flex h-full flex-col gap-5 md:flex-row md:items-end md:justify-between md:gap-6">
              <div className="max-w-xl">
                <div className={`text-sm font-bold uppercase tracking-[0.18em] ${box.tone === 'dark' ? 'text-slate-300' : 'text-emerald-700'}`}>
                  {box.badge}
                </div>
                <h3 className={`mt-3 max-w-xl text-[1.7rem] font-black leading-tight md:text-[2.35rem] ${box.tone === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  {box.title}
                </h3>
                <p className={`mt-3 max-w-lg text-sm leading-6 md:text-[15px] ${box.tone === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                  {box.description}
                </p>
                <Link
                  to={box.ctaLink}
                  className={`mt-6 inline-flex rounded-2xl px-5 py-3 text-sm font-bold transition ${
                    box.tone === 'dark'
                      ? 'bg-white text-slate-950 hover:bg-slate-100'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {box.ctaText}
                </Link>
              </div>

              <div className="relative flex h-[200px] w-full max-w-full items-end justify-center overflow-hidden rounded-[24px] border border-white/30 bg-white/10 backdrop-blur-sm md:h-[230px] md:max-w-[260px] md:rounded-[28px]">
                <PromoImage box={box} />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
