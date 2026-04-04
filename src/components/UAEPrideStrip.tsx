type UAEPrideStripProps = {
  show?: boolean;
  leftTitle?: string;
  leftSubtitle?: string;
  rightTitle?: string;
  rightSubtitle?: string;
};

export default function UAEPrideStrip({
  show = true,
  leftTitle = 'OUR PRIDE',
  leftSubtitle = 'OUR UAE',
  rightTitle = 'إماراتنا',
  rightSubtitle = 'فخرنا',
}: UAEPrideStripProps) {
  if (!show) return null;

  return (
    <section className="mb-0 mt-0 w-full px-3 md:px-0">
      <style>{`
        @keyframes uaeColorFlow {
          0% {
            background:
              linear-gradient(135deg, rgba(206, 17, 38, 0.15) 0%, transparent 40%),
              linear-gradient(225deg, rgba(0, 115, 47, 0.15) 0%, transparent 40%),
              linear-gradient(45deg, rgba(255, 255, 255, 0.08) 30%, transparent 70%);
            background-size: 200% 200%, 200% 200%, 200% 200%;
            background-position: 0% 0%, 100% 100%, 50% 50%;
          }
          50% {
            background:
              linear-gradient(135deg, rgba(206, 17, 38, 0.15) 30%, transparent 70%),
              linear-gradient(225deg, rgba(0, 115, 47, 0.15) 30%, transparent 70%),
              linear-gradient(45deg, rgba(255, 255, 255, 0.08) 0%, transparent 100%);
            background-size: 200% 200%, 200% 200%, 200% 200%;
            background-position: 100% 100%, 0% 0%, 50% 50%;
          }
          100% {
            background:
              linear-gradient(135deg, rgba(206, 17, 38, 0.15) 0%, transparent 40%),
              linear-gradient(225deg, rgba(0, 115, 47, 0.15) 0%, transparent 40%),
              linear-gradient(45deg, rgba(255, 255, 255, 0.08) 30%, transparent 70%);
            background-size: 200% 200%, 200% 200%, 200% 200%;
            background-position: 0% 0%, 100% 100%, 50% 50%;
          }
        }

        .uae-strip-glow {
          animation: uaeColorFlow 12s ease-in-out infinite;
          background-color: #fafaf8;
        }
      `}</style>

      <div className="relative h-[58px] w-full overflow-hidden rounded-[18px] border border-slate-200/80 bg-white shadow-sm md:h-[64px] md:rounded-none md:border-x-0 md:border-y">
        <div className="uae-strip-glow absolute inset-0" />

        <div className="relative flex h-full items-center justify-center gap-4 px-4 md:gap-10 md:px-12">
          <div className="flex-shrink-0 text-center">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-800 md:text-base">{leftTitle}</p>
            <p className="text-[9px] font-medium tracking-[0.12em] text-slate-600 md:text-sm">{leftSubtitle}</p>
          </div>

          <div className="flex flex-shrink-0 items-center justify-center">
            <div className="flex h-[30px] w-[46px] overflow-hidden rounded-[3px] shadow-sm ring-1 ring-black/15 md:h-[34px] md:w-[54px]">
              <div className="w-[24%] bg-[#CE1126]" />
              <div className="flex flex-1 flex-col">
                <div className="flex-1 bg-[#00732F]" />
                <div className="flex-1 bg-white" />
                <div className="flex-1 bg-black" />
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 text-center">
            <p className="text-[11px] font-semibold tracking-[0.08em] text-slate-800 md:text-base">{rightTitle}</p>
            <p className="text-[9px] font-medium tracking-[0.08em] text-slate-600 md:text-sm">{rightSubtitle}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
