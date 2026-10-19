"use client";

import { useCompanyLogo } from "@/hooks/useCompanyLogo";

const TINTS = ["--series-1", "--series-3", "--series-2", "--series-4", "--series-5"];

/** Company logo in a rounded tile; companies without one get their initials on a tint picked from the name. */
export function CompanyLogo({
  orgId,
  version,
  name,
  size = 32,
  className = "",
}: {
  orgId?: string;
  version?: string | null;
  name: string;
  size?: number;
  className?: string;
}) {
  const url = useCompanyLogo(orgId, version);
  const radius = Math.round(size * 0.28);
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        width={size}
        height={size}
        style={{ width: size, height: size, borderRadius: radius }}
        className={`shrink-0 bg-white object-contain ring-1 ring-slate-200 ${className}`}
      />
    );
  }
  const words = name.trim().split(/\s+/).filter(Boolean);
  const initials = ((words[0]?.[0] ?? "?") + (words.length > 1 ? words[1][0] : "")).toUpperCase();
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) | 0;
  const v = TINTS[Math.abs(h) % TINTS.length];
  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center font-semibold ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        fontSize: size * 0.38,
        background: `rgb(var(${v}) / .16)`,
        color: `rgb(var(${v}))`,
      }}
    >
      {initials}
    </span>
  );
}
