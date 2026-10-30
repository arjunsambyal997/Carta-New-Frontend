import { useId } from "react";

/**
 * The Sijill mark: a share register seen as ownership. Three slices of one ring (the cap table) around a seal dot.
 * Kept in step with app/icon.svg and app/apple-icon.png. Fixed fills so it reads on light and dark themes.
 */
export function SijillMark({ size = 32, className }: { size?: number; className?: string }) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden className={className}>
      <defs>
        <linearGradient id={`${id}-g`} x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1cc596" />
          <stop offset=".55" stopColor="#0e8a68" />
          <stop offset="1" stopColor="#075640" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill={`url(#${id}-g)`} />
      <rect x=".5" y=".5" width="31" height="31" rx="7.5" stroke="#fff" strokeOpacity=".14" />
      <g transform="rotate(-90 16 16)" stroke="#fff" strokeWidth="3.6">
        <circle cx="16" cy="16" r="8.5" strokeDasharray="29.2 53.41" />
        <circle cx="16" cy="16" r="8.5" strokeDasharray="12.6 53.41" strokeDashoffset="-30.9" strokeOpacity=".72" />
        <circle cx="16" cy="16" r="8.5" strokeDasharray="6.8 53.41" strokeDashoffset="-44.9" strokeOpacity=".45" />
      </g>
      <circle cx="16" cy="16" r="2.6" fill="#fff" />
    </svg>
  );
}

/** Mark plus the product name; the name comes from the caller so it follows the UI language. */
export function SijillWordmark({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <SijillMark size={size} className="shrink-0 drop-shadow-sm" />
      <span className="text-[17px] font-semibold tracking-tight text-slate-900">{name}</span>
    </span>
  );
}
