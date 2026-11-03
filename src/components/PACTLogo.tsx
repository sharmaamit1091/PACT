import React from 'react';

interface PACTLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  showTagline?: boolean;
  className?: string;
  lightText?: boolean;
}

export const PACTLogo: React.FC<PACTLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  showTagline = false,
  className = '',
  lightText = true,
}) => {
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  const emblemSizeClass = isSm
    ? 'w-8 h-8 rounded-lg'
    : isLg
    ? 'w-12 h-12 rounded-2xl'
    : 'w-10 h-10 rounded-xl';

  const titleSizeClass = isSm
    ? 'text-base font-extrabold tracking-tight'
    : isLg
    ? 'text-2xl font-black tracking-tight'
    : 'text-lg font-extrabold tracking-tight';

  return (
    <div className={`flex items-center space-x-3 select-none ${className}`}>
      {/* Modern High-End PACT Emblem */}
      <div
        className={`${emblemSizeClass} relative flex items-center justify-center bg-gradient-to-br from-sky-500 via-teal-500 to-emerald-500 shadow-lg shadow-sky-500/20 text-slate-950 font-black overflow-hidden group shrink-0 border border-white/20`}
      >
        {/* Subtle geometric grid backdrop */}
        <div className="absolute inset-0 bg-slate-950/20 mix-blend-overlay pointer-events-none" />

        {/* Monogram / Action Mark */}
        <svg
          viewBox="0 0 32 32"
          className={isSm ? 'w-5 h-5 text-white' : isLg ? 'w-7 h-7 text-white' : 'w-6 h-6 text-white'}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Stylized PACT interlock glyph */}
          <path
            d="M6 8h7a5 5 0 0 1 0 10H6V8z"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M6 18v6"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M17 24l5-14 5 14"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M19 19.5h6"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="28" cy="8" r="2" fill="#38bdf8" />
        </svg>
      </div>

      {/* Typography */}
      <div className="leading-tight">
        <div className="flex items-center space-x-2">
          <span
            className={`${titleSizeClass} font-mono theme-text-main`}
          >
            PACT
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 uppercase tracking-widest font-bold">
            Enterprise
          </span>
        </div>

        {showSubtitle && (
          <div
            className="text-[11px] font-medium tracking-tight theme-text-muted"
          >
            Project Actions, Commitments &amp; Tracking
          </div>
        )}

        {showTagline && (
          <div className="text-[10px] font-semibold text-emerald-400 mt-0.5 italic tracking-wide">
            From Meetings to Actions. From Actions to Results.
          </div>
        )}
      </div>
    </div>
  );
};
