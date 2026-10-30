"use client";

import Link from "next/link";
import { m } from "motion/react";
import { useId, type ReactNode } from "react";
import { Icon } from "@/components/common/Icon";
import { useI18n } from "@/context/I18nContext";
import { rise } from "@/designSystem/motion";

const SERIES = ["var(--series-1)", "var(--series-2)", "var(--series-3)", "var(--series-4)", "var(--series-5)"];
/** Categorical colour for series `i`; -1 is the quiet grey used for "everyone else". */
export const col = (i: number) => (i < 0 ? "rgb(var(--slate-400))" : `rgb(${SERIES[i % SERIES.length]})`);

/** One bento cell: a flat surface with a hairline edge, a small title row, and the content. Rises in with its grid. */
export function Tile({
  title,
  hint,
  action,
  children,
  className = "",
}: {
  title: ReactNode;
  hint?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <m.section variants={rise} aria-labelledby={id} className={`tile flex flex-col ${className}`}>
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id={id} className="text-[13px] font-semibold tracking-[-0.005em] text-slate-900">
            {title}
          </h2>
          {hint && <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{hint}</p>}
        </div>
        {action}
      </header>
      <div className="min-w-0 flex-1">{children}</div>
    </m.section>
  );
}

export function ViewAll({ href }: { href: string }) {
  const { t } = useI18n();
  return (
    <Link
      href={href}
      className="group inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-indigo-700 transition-colors hover:bg-indigo-50"
    >
      {t("viewAll")}
      <Icon
        name="arrow"
        size={14}
        className="transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5"
      />
    </Link>
  );
}

export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ background: i.color }} />
          {i.label}
        </li>
      ))}
    </ul>
  );
}
