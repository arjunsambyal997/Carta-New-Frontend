"use client";

import Link from "next/link";
import { useI18n } from "@/context/I18nContext";
import { useSystemStatus } from "@/hooks/useSystemStatus";

/** Shows the active or next scheduled maintenance window, in the reader's language, until it is over. */
export function MaintenanceBanner() {
  const { t, locale, date } = useI18n();
  const status = useSystemStatus();
  const next = status?.maintenance[0];
  if (!next) return null;
  const message = locale === "ar" ? next.messageAr : next.messageEn;
  return (
    <div
      role="status"
      className={`flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 text-sm sm:px-8 ${
        next.active ? "bg-red-50 text-red-900" : "bg-amber-50 text-amber-900"
      }`}
    >
      <strong>{next.active ? t("maintenanceNow") : t("maintenanceSoon")}</strong>
      <span>{message}</span>
      <span className="tabular-nums" dir="ltr">
        {date(next.startsAt, true)} → {date(next.endsAt, true)}
      </span>
      {next.readOnly && <span>{t("maintenanceReadOnly")}</span>}
      <Link href="/changelog" className="ms-auto underline">
        {t("navChangelog")}
      </Link>
    </div>
  );
}
