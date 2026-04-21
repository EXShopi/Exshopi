import React from "react";

type HoverTooltipProps = {
  label: string;
  side?: "top" | "left";
  className?: string;
};

export default function HoverTooltip({ label, side = "top", className = "" }: HoverTooltipProps) {
  const sideClasses =
    side === "left"
      ? "right-full top-1/2 mr-3 -translate-y-1/2 group-hover:translate-x-[-2px]"
      : "bottom-full left-1/2 -translate-x-1/2 group-hover:translate-y-[-2px]";
  return (
    <span
      className={`pointer-events-none absolute z-30 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-700 opacity-0 shadow-[0_14px_28px_rgba(15,23,42,0.14)] transition-all duration-200 group-hover:opacity-100 ${sideClasses} ${className}`}
    >
      {label}
    </span>
  );
}
