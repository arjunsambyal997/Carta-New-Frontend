"use client";

import type { AuditEntry } from "@/api/types";
import { Avatar } from "@/components/common/Avatar";
import { EmptyState } from "@/components/common/EmptyState";
import { useI18n } from "@/context/I18nContext";
import { Tile, ViewAll } from "@/features/dashboard/widgets/Tile";

/** Audit details embed record ids; they mean nothing on a dashboard, so drop them. */
const tidy = (d: string | null) =>
  d?.replace(/\s*\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, "").trim() ?? null;

/** The latest audit entries as a timeline. Renders nothing for roles that cannot read the audit trail. */
export function ActivityFeed({ entries, className = "" }: { entries: AuditEntry[] | null; className?: string }) {
  const { t, date } = useI18n();
  if (entries === null) return null;
  const shown = [...entries].sort((a, b) => b.id - a.id).slice(0, 6);
  return (
    <Tile title={t("recentActivity")} action={<ViewAll href="/audit" />} className={className}>
      {shown.length === 0 ? (
        <EmptyState compact icon="audit" title={t("noActivity")} hint={t("noActivityHint")} />
      ) : (
        <ol className="relative">
          {/* the thread that joins the avatars */}
          <span aria-hidden className="absolute inset-y-3 start-[13px] w-px bg-hairline" />
          {shown.map((e) => (
            <li key={e.id} className="relative flex items-start gap-3 py-2">
              <span className="rounded-full ring-4 ring-[rgb(var(--surface))]">
                <Avatar name={e.performedBy} size={26} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="line-clamp-2 text-sm leading-snug text-slate-800">
                  {tidy(e.detail) ?? `${e.action} ${e.entityName}`}
                </span>
                <span className="num text-[11px] text-slate-500">
                  <span dir="ltr">{e.performedBy}</span> · {date(e.occurredAt, true)}
                </span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </Tile>
  );
}
