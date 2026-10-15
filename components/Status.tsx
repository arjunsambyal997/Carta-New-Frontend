"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import type { Loaded } from "./useRegister";

/** Renders loading / not-connected / error states; returns null when data is ready. */
export function Status({ state }: { state: Loaded<unknown> }) {
  const { t } = useI18n();
  if (state.loading) return <p className="text-slate-500">{t("loading")}</p>;
  if (!state.connected)
    return (
      <div className="card">
        <p className="mb-3">{t("notConnected")}</p>
        <Link href="/login" className="btn">
          {t("goConnect")}
        </Link>
      </div>
    );
  if (state.error)
    return (
      <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
        {t("error")}: {state.error}
      </div>
    );
  return null;
}
