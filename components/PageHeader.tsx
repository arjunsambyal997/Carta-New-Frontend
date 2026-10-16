import type { ReactNode } from "react";

/** Title row shared by every signed-in page: title, one-line context, and the page's primary action on the end side. */
export function PageHeader({ title, subtitle, eyebrow, action }: { title: ReactNode; subtitle?: ReactNode; eyebrow?: ReactNode; action?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-slate-200 pb-5">
      <div className="min-w-0 max-w-2xl">
        {eyebrow && <p className="mb-1 text-sm text-slate-500">{eyebrow}</p>}
        <h1>{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{subtitle}</p>}
      </div>
      {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
    </header>
  );
}
