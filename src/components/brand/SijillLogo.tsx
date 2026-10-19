import { useId } from "react";

/** The Sijill mark: a register page (three ledger lines) stamped with a seal. Uses currentColor-free fills so it reads on any theme. */
export function SijillMark({ size = 32, className }: { size?: number; className?: string }) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden className={className}>
      <defs>
        <linearGradient id={`${id}-g`} x1="3" y1="2" x2="29" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#16b58a" />
          <stop offset="1" stopColor="#0a6b52" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${id}-g)`} />
      <rect x="7.5" y="8.5" width="12" height="2.6" rx="1.3" fill="#fff" />
      <rect x="7.5" y="14.7" width="17" height="2.6" rx="1.3" fill="#fff" fillOpacity=".85" />
      <rect x="7.5" y="20.9" width="8" height="2.6" rx="1.3" fill="#fff" fillOpacity=".7" />
      <circle cx="23" cy="22.2" r="4.6" fill="#0b4f3d" stroke="#fff" strokeWidth="1.6" />
      <path d="M20.9 22.3l1.5 1.5 2.9-3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
