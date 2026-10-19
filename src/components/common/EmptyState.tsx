import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/common/Icon";

/** A friendly "nothing here yet" block: what this page is for and the next step, instead of a bare grey line. */
export function EmptyState({
  icon = "check",
  title,
  hint,
  action,
  compact = false,
}: {
  icon?: IconName;
  title: ReactNode;
  hint?: ReactNode;
  action?: { label: string; href: string } | ReactNode;
  compact?: boolean;
}) {
  const cta =
    action && typeof action === "object" && "href" in action && "label" in action ? (
      <Link href={(action as { href: string }).href} className="btn mt-4">
        {(action as { label: string }).label}
      </Link>
    ) : (
      (action as ReactNode)
    );
  return (
    <div className={`flex flex-col items-center text-center ${compact ? "py-6" : "py-12"}`}>
      <span className="grid size-11 place-items-center rounded-full bg-emerald-50 text-emerald-700">
        <Icon name={icon} size={20} />
      </span>
      <p className="mt-3 text-sm font-medium text-slate-800">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500">{hint}</p>}
      {cta}
    </div>
  );
}
