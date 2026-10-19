"use client";

import Link from "next/link";
import { useI18n } from "@/context/I18nContext";

/** Shown for any address that does not exist. Always offers a way back. */
export default function NotFound() {
  const { t } = useI18n();
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <p className="text-5xl font-semibold tabular-nums tracking-tight text-slate-300" aria-hidden="true">
        404
      </p>
      <h1>{t("notFoundTitle")}</h1>
      <p className="text-sm text-slate-600">{t("notFoundBody")}</p>
      <Link href="/" className="btn">
        {t("navDashboard")}
      </Link>
    </div>
  );
}
