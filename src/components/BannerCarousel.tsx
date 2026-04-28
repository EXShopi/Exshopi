const banners = [
  {
    id: 1,
    title: "Gaming & Accessories",
    subtitle: "Shop premium deals on electronics and daily-use products.",
    buttonText: "Shop Now",
    image:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=80",
  },
];

export default function BannerCarousel() {
  const banner = banners[0];

  return (
    <section className="overflow-hidden rounded-[36px]">
      <div className="relative h-[320px] md:h-[420px] w-full overflow-hidden rounded-[36px]">
        <img
          src={banner.image}
          alt={banner.title}
          width={1600}
          height={420}
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/35 to-transparent" />

        <div className="absolute left-8 top-1/2 max-w-xl -translate-y-1/2 text-white md:left-10">
          <h2 className="text-3xl md:text-5xl font-black leading-tight">
            {banner.title}
          </h2>
          <p className="mt-4 text-sm md:text-lg text-white/90">
            {banner.subtitle}
          </p>
          <button className="mt-8 rounded-full bg-white px-7 py-3 text-sm md:text-base font-black text-slate-950 transition hover:scale-105">
            {banner.buttonText}
          </button>
        </div>
      </div>
    </section>
  );
}
