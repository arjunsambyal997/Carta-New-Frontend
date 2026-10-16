import type { Role } from "@/lib/types";

const SERIES = ["--series-1", "--series-2", "--series-3", "--series-4", "--series-5"];

/** Initials on a tint picked from the name, so the same person always gets the same colour. */
export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const words = name.trim().split(/[\s@._-]+/).filter(Boolean);
  const initials = ((words[0]?.[0] ?? "?") + (words.length > 1 ? words[1][0] : "")).toUpperCase();
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) | 0;
  const v = SERIES[Math.abs(h) % SERIES.length];
  return (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center rounded-full font-semibold"
      style={{ width: size, height: size, fontSize: size * 0.38, background: `rgb(var(${v}) / .16)`, color: `rgb(var(${v}))` }}
    >
      {initials}
    </span>
  );
}

const ROLE_TONE: Record<Role, string> = {
  FOUNDER: "bg-emerald-50 text-emerald-800",
  CORPORATE_SECRETARY: "bg-sky-50 text-sky-700",
  BOARD_MEMBER: "bg-amber-50 text-amber-800",
  SHAREHOLDER: "bg-slate-100 text-slate-700",
  LEGAL_AUDITOR: "bg-red-50 text-red-800",
};

export function RoleChip({ role, label }: { role: Role; label: string }) {
  return <span className={`chip ${ROLE_TONE[role] ?? "bg-slate-100 text-slate-700"}`}>{label}</span>;
}
