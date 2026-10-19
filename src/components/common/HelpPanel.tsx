/** A short numbered "what happens next" panel that sits beside a form on wide screens and below it on narrow ones. */
export function HelpPanel({ title, items }: { title: string; items: string[] }) {
  return (
    <aside className="card h-fit space-y-3 bg-slate-50/60 xl:sticky xl:top-24">
      <h2 className="text-sm font-semibold">{title}</h2>
      <ol className="space-y-2.5 text-sm leading-relaxed text-slate-600">
        {items.map((text, i) => (
          <li key={i} className="flex gap-2.5">
            <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-emerald-50 text-[11px] font-semibold tabular-nums text-emerald-800">
              {i + 1}
            </span>
            <span className="min-w-0">{text}</span>
          </li>
        ))}
      </ol>
    </aside>
  );
}
