import { useId } from "react";

/**
 * The Sijill mark: the Arabic letter seen (س), the first letter of سجل, drawn so its three teeth rise like a
 * cap table bar chart. Fixed white-on-emerald fills so it reads on any theme. Keep in step with src/app/icon.svg.
 */
export function SijillMark({ size = 32, className }: { size?: number; className?: string }) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden className={className}>
      <defs>
        <linearGradient id={`${id}-g`} x1="4" y1="2" x2="60" y2="62" gradientUnits="userSpaceOnUse">
          <stop stopColor="#19c08f" />
          <stop offset=".55" stopColor="#0b8a68" />
          <stop offset="1" stopColor="#06513f" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill={`url(#${id}-g)`} />
      <rect x=".75" y=".75" width="62.5" height="62.5" rx="17.25" stroke="#fff" strokeOpacity=".18" strokeWidth="1.5" />
      <g stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M50 14v22" />
        <path d="M40.5 22v14" />
        <path d="M31 29v7" />
        <path d="M50 36q0 4-4 4H31q-4 0-4-4" />
        <path d="M27 36c0 15.5-17 17.5-17 0" />
      </g>
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
