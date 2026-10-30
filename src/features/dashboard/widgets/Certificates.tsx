"use client";

import type { Certificate } from "@/api/types";
import { Avatar } from "@/components/common/Avatar";
import { EmptyState } from "@/components/common/EmptyState";
import { useI18n } from "@/context/I18nContext";
import { Tile, ViewAll } from "@/features/dashboard/widgets/Tile";

export function Certificates({ list, className = "" }: { list: Certificate[] | null; className?: string }) {
  const { t, num, name } = useI18n();
  const shown = [...(list ?? [])]
    .sort((a, b) => b.dateIssued.localeCompare(a.dateIssued) || b.certificateNo.localeCompare(a.certificateNo))
    .slice(0, 5);
  return (
    <Tile title={t("recentCertificates")} action={<ViewAll href="/certificates" />} className={className}>
      {shown.length === 0 ? (
        <EmptyState
          compact
          icon="certificates"
          title={t("noCertificates")}
          hint={t("noCertificatesHint")}
          action={{ label: t("navCertificates"), href: "/certificates/new" }}
        />
      ) : (
        <ul className="divide-y divide-hairline">
          {shown.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <span className="flex min-w-0 items-center gap-3">
                <Avatar name={c.shareholderNameEn} size={30} />
                <span className="min-w-0">
                  <span className="block truncate font-medium text-slate-900">
                    {name(c.shareholderNameEn, c.shareholderNameAr)}
                  </span>
                  <span className="num font-mono text-[11px] text-slate-500" dir="ltr">
                    {c.certificateNo}
                  </span>
                </span>
              </span>
              <span className="shrink-0 text-end">
                <span className="num block font-medium text-slate-900">{num(c.quantity)}</span>
                <span className="text-[11px] text-slate-500">{c.shareClassName}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Tile>
  );
}
