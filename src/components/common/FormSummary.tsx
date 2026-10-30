import type { ReactNode } from "react";
import { Icon } from "@/components/common/Icon";

/** A plain-language sentence of what the form is about to do, updated as the user fills it in. */
export function FormSummary({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div aria-live="polite" className="col-span-full">
      {children && (
        <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-950">
          <Icon name="check" size={16} className="mt-0.5 shrink-0 text-emerald-700" />
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">{title}</p>
            <p className="mt-0.5">{children}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/** Grey help text under a field; FieldError takes its place while the field is wrong. */
export function FieldHint({ id, children }: { id: string; children?: ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} className="mt-1 text-xs text-slate-500">
      {children}
    </p>
  );
}
