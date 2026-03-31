type PromoBox = {
  id: string;
  badge: string;
  title: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  tone: 'dark' | 'light';
  show: boolean;
};

type PromoSectionProps = {
  boxes?: PromoBox[];
};

export default function PromoSection({ boxes = [] }: PromoSectionProps) {
  const visibleBoxes = boxes.filter((box) => box.show).slice(0, 2);
  if (!visibleBoxes.length) return null;

  return (
    <section className="mx-auto mt-8 max-w-[1800px] px-4 md:px-6">
      <div className="grid gap-4 md:grid-cols-2">
        {visibleBoxes.map((box) => (
          <div
            key={box.id}
            className={`relative overflow-hidden rounded-[30px] border p-8 shadow-sm ${
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
            <div className="relative">
              <div className={`text-sm font-bold uppercase tracking-[0.18em] ${box.tone === 'dark' ? 'text-slate-300' : 'text-emerald-700'}`}>
                {box.badge}
              </div>
              <h3 className={`mt-3 max-w-xl text-3xl font-black leading-tight ${box.tone === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {box.title}
              </h3>
              <p className={`mt-3 max-w-lg text-sm leading-6 ${box.tone === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                {box.description}
              </p>
              <a
                href={box.ctaLink}
                className={`mt-6 inline-flex rounded-2xl px-5 py-3 text-sm font-bold transition ${
                  box.tone === 'dark'
                    ? 'bg-white text-slate-950 hover:bg-slate-100'
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                {box.ctaText}
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
