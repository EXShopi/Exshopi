import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";

type HeroProduct = {
  title: string;
  price: string;
  tone: string;
};

type Slide = {
  accent: string;
  title: string;
  subtitle: string;
  button: string;
  theme: string;
  isVideo?: boolean;
  products: HeroProduct[];
};

const slides: Slide[] = [
  {
    accent: "Nebula",
    title: "Illuminate Your World with Laser Power",
    subtitle:
      "Immerse yourself in laser brightness. With laser-powered brightness of 2200 ANSI Lumens, watch your movies shine in every scene.",
    button: "Explore Projectors",
    theme: "from-[#8db1d6] via-[#d8b79c] to-[#8b6f63]",
    isVideo: true,
    products: [
      { title: "Laser Projector", price: "AED 2,999", tone: "from-slate-300 to-slate-500" },
      { title: "Projector Speaker", price: "AED 899", tone: "from-stone-300 to-stone-500" },
      { title: "Streaming Box", price: "AED 249", tone: "from-zinc-300 to-zinc-500" },
      { title: "Portable Audio", price: "AED 349", tone: "from-neutral-300 to-neutral-500" },
      { title: "Smart Display", price: "AED 1,299", tone: "from-gray-300 to-gray-500" },
    ],
  },
  {
    accent: "KitchenAid",
    title: "Create Your Favorite Cup",
    subtitle:
      "Enjoy curated coffee essentials and electronics that upgrade your lifestyle.",
    button: "Shop Coffee",
    theme: "from-[#161616] via-[#0b1120] to-[#020617]",
    products: [
      { title: "Coffee Maker", price: "AED 809", tone: "from-red-200 to-red-400" },
      { title: "Espresso Machine", price: "AED 549", tone: "from-rose-200 to-rose-400" },
      { title: "Personal Brewer", price: "AED 99", tone: "from-orange-200 to-orange-400" },
      { title: "Coffee Grinder", price: "AED 129", tone: "from-amber-200 to-amber-400" },
      { title: "Glass Brewer", price: "AED 199", tone: "from-stone-200 to-stone-400" },
    ],
  },
  {
    accent: "AirPods Max",
    title: "Elevate Your Sound. Redefine Your Experience.",
    subtitle:
      "Enjoy every note with crystal clarity and immerse yourself in a world of pure, uninterrupted sound.",
    button: "Shop Audio",
    theme: "from-[#3c4d60] via-[#22364a] to-[#1a2431]",
    products: [
      { title: "Headphones", price: "AED 1,899", tone: "from-slate-100 to-slate-300" },
      { title: "Wireless Earbuds", price: "AED 499", tone: "from-blue-100 to-blue-300" },
      { title: "Speaker", price: "AED 299", tone: "from-cyan-100 to-cyan-300" },
      { title: "Home Audio", price: "AED 699", tone: "from-sky-100 to-sky-300" },
      { title: "Sound System", price: "AED 999", tone: "from-indigo-100 to-indigo-300" },
    ],
  },
  {
    accent: "Samsung",
    title: "Introducing QLED",
    subtitle:
      "QLED will change your expectations of what a TV can do. Designed with options to fit any space and budget.",
    button: "Shop QLED",
    theme: "from-[#2f1f2f] via-[#15263f] to-[#0b162c]",
    products: [
      { title: "Samsung QLED", price: "AED 3,999", tone: "from-fuchsia-200 to-fuchsia-400" },
      { title: "Smart TV 65”", price: "AED 2,399", tone: "from-violet-200 to-violet-400" },
      { title: "TV Box", price: "AED 199", tone: "from-pink-200 to-pink-400" },
      { title: "Wall Mount", price: "AED 149", tone: "from-purple-200 to-purple-400" },
      { title: "Soundbar", price: "AED 599", tone: "from-indigo-200 to-indigo-400" },
    ],
  },
  {
    accent: "KitchenAid",
    title: "Revitalize Your Creative Spirit",
    subtitle:
      "Get inspired to create a kitchen that fuels your creative passions with powerful stories and premium products.",
    button: "Explore KitchenAid",
    theme: "from-[#56453a] via-[#8f735f] to-[#c1a48a]",
    products: [
      { title: "Cooktop", price: "AED 1,065", tone: "from-neutral-100 to-neutral-300" },
      { title: "Oven", price: "AED 942", tone: "from-stone-100 to-stone-300" },
      { title: "Water Filter", price: "AED 80", tone: "from-zinc-100 to-zinc-300" },
      { title: "Fridge", price: "AED 1,544", tone: "from-slate-100 to-slate-300" },
      { title: "Microwave", price: "AED 399", tone: "from-gray-100 to-gray-300" },
    ],
  },
];

export default function HeroSlider() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const slide = slides[index];

  const goPrev = () => {
    setIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goNext = () => {
    setIndex((prev) => (prev + 1) % slides.length);
  };

  return (
    <section className="px-4 pt-[96px] md:px-6 md:pt-[100px]">
      <div className="mx-auto max-w-[1820px]">
        <div className="relative overflow-hidden rounded-[34px] bg-slate-950 shadow-[0_25px_70px_rgba(15,23,42,0.14)]">
          <div className="relative h-[720px] md:h-[780px]">
            <div
              className={`absolute inset-0 bg-gradient-to-r ${slide.theme} transition-all duration-700`}
            />

            <div className="absolute inset-0 opacity-25">
              <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
              <div className="absolute right-0 top-0 h-[420px] w-[420px] rounded-full bg-white/10 blur-3xl" />
              <div className="absolute bottom-0 left-1/3 h-[340px] w-[340px] rounded-full bg-black/20 blur-3xl" />
            </div>

            <div className="absolute inset-0">
              {index === 0 && (
                <>
                  <div className="absolute left-[4%] top-[18%] h-[380px] w-[560px] rounded-[42px] bg-gradient-to-br from-stone-100/35 to-stone-700/5" />
                  <div className="absolute left-[12%] top-[25%] h-[250px] w-[250px] rounded-full border border-white/20 bg-white/5" />
                  <div className="absolute left-[19%] top-[33%] flex h-[78px] w-[78px] items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
                    <Play className="ml-1 h-8 w-8 text-white" fill="white" />
                  </div>

                  <div className="absolute right-[3%] top-[8%] h-[590px] w-[430px] rounded-[100px] border border-white/20 bg-gradient-to-b from-white/25 to-white/5" />
                  <div className="absolute right-[9%] top-[20%] h-[360px] w-[250px] rounded-[30px] bg-gradient-to-b from-orange-100/70 to-orange-400/25 shadow-[0_20px_60px_rgba(0,0,0,0.25)]" />
                  <div className="absolute left-[46%] top-[50%] h-[10px] w-[180px] rotate-[12deg] bg-white/35 blur-md" />
                </>
              )}

              {index === 1 && (
                <>
                  <div className="absolute right-[8%] top-[12%] h-[450px] w-[450px] rounded-full bg-white/8 blur-2xl" />
                  <div className="absolute right-[18%] top-[26%] h-[260px] w-[260px] rounded-full bg-gradient-to-b from-red-100/70 to-red-400/30" />
                  <div className="absolute right-[31%] top-[38%] h-[200px] w-[95px] rounded-[52px] bg-white/15" />
                  <div className="absolute bottom-[18%] right-[8%] h-[70px] w-[360px] rounded-full bg-black/15 blur-xl" />
                </>
              )}

              {index === 2 && (
                <>
                  <div className="absolute right-[5%] top-[8%] h-[580px] w-[580px] rounded-full bg-white/8" />
                  <div className="absolute right-[18%] top-[22%] h-[390px] w-[270px] rounded-[150px] bg-gradient-to-b from-slate-100/90 to-slate-400/30 shadow-2xl" />
                  <div className="absolute right-[6%] top-[20%] h-[320px] w-[220px] rounded-[130px] bg-gradient-to-b from-slate-200/80 to-slate-500/20 shadow-2xl" />
                </>
              )}

              {index === 3 && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
                  <div className="absolute right-[6%] top-[14%] h-[320px] w-[560px] rounded-[26px] bg-gradient-to-br from-fuchsia-500/15 via-blue-400/15 to-cyan-300/10" />
                  <div className="absolute bottom-[18%] left-[4%] h-[230px] w-[920px] rounded-[30px] bg-black/20 blur-sm" />
                </>
              )}

              {index === 4 && (
                <>
                  <div className="absolute right-[7%] top-[8%] h-[520px] w-[580px] rounded-[70px] bg-white/8 blur-xl" />
                  <div className="absolute bottom-[22%] right-[12%] h-[200px] w-[340px] rounded-[24px] bg-white/10" />
                </>
              )}
            </div>

            <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/18 to-black/10" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-white/5" />

            <button
              onClick={goPrev}
              className="absolute left-6 top-1/2 z-30 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20"
              aria-label="Previous slide"
            >
              <ChevronLeft size={22} />
            </button>

            <button
              onClick={goNext}
              className="absolute right-6 top-1/2 z-30 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20"
              aria-label="Next slide"
            >
              <ChevronRight size={22} />
            </button>

            <div className="relative z-10 flex h-full flex-col justify-between px-7 pb-7 pt-28 md:px-10 md:pb-8 md:pt-32 lg:px-14">
              <div className="max-w-[1080px]">
                <p className="mb-3 text-2xl font-medium text-white/90 md:text-[22px]">
                  {slide.accent}
                </p>

                <h1 className="max-w-[1150px] text-5xl font-black leading-[0.95] tracking-tight text-white md:text-7xl lg:text-[74px]">
                  {slide.title}
                </h1>

                <p className="mt-5 max-w-[1050px] text-lg leading-8 text-white/90 md:text-[19px]">
                  {slide.subtitle}
                </p>

                <button className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-7 py-4 text-[15px] font-black text-slate-950 transition hover:bg-slate-200">
                  {slide.button}
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              <div className="relative z-20">
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                  {slide.products.map((product, i) => (
                    <div
                      key={`${product.title}-${i}`}
                      className="min-w-[210px] rounded-[24px] bg-white/95 p-3 shadow-[0_16px_40px_rgba(0,0,0,0.24)] backdrop-blur-sm transition hover:-translate-y-1"
                    >
                      <div className="overflow-hidden rounded-[18px] bg-slate-100">
                        <div className={`h-[132px] w-full bg-gradient-to-br ${product.tone}`} />
                      </div>

                      <p className="mt-3 line-clamp-2 text-sm font-bold text-slate-900">
                        {product.title}
                      </p>

                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[15px] font-black text-slate-950">
                          {product.price}
                        </span>
                        <span className="text-xs font-bold text-emerald-600">
                          In stock
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-center">
                <div className="flex items-center gap-2">
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setIndex(i)}
                      className={`h-2.5 rounded-full transition-all ${
                        i === index ? "w-7 bg-white" : "w-2.5 bg-white/50"
                      }`}
                      aria-label={`Go to slide ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}