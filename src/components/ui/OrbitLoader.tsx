import React from 'react';

type OrbitLoaderProps = {
  label?: string;
  size?: number;
  className?: string;
  variant?: 'normal' | 'premium';
};

export function OrbitLoader({
  label,
  size = 20,
  className = '',
  variant = 'premium',
}: OrbitLoaderProps) {
  const dotSize = Math.max(8, Math.round(size * 0.45));
  const ringSize = Math.max(18, size + 14);

  return (
    <div className={`flex w-full flex-col items-center justify-center gap-3 text-center ${className}`.trim()}>
      <div
        className={`flex items-center justify-center rounded-full border ${
          variant === 'premium'
            ? 'border-blue-100 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.08)]'
            : 'border-slate-200 bg-slate-50'
        }`}
        style={{ width: ringSize, height: ringSize } as React.CSSProperties}
        role="status"
        aria-live="polite"
      >
        <span
          className={`rounded-full ${
            variant === 'premium'
              ? 'bg-gradient-to-br from-blue-600 to-violet-600'
              : 'bg-slate-400'
          }`}
          style={{ width: dotSize, height: dotSize } as React.CSSProperties}
        />
      </div>
      {label ? <p className="text-sm font-semibold text-slate-500">{label}</p> : null}
    </div>
  );
}

export default OrbitLoader;
