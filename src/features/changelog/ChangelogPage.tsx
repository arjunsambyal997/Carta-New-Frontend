"use client";

import { PageHeader } from "@/components/common/PageHeader";
import { useI18n } from "@/context/I18nContext";
import { RELEASES } from "./releases";

export default function ChangelogPage() {
  const { t, locale, date } = useI18n();
  return (
    <div className="space-y-6">
      <PageHeader title={t("changelogTitle")} subtitle={t("changelogIntro")} />
      {RELEASES.length === 0 && <p className="text-slate-500">{t("changelogEmpty")}</p>}
      {RELEASES.map((r) => (
        <section key={r.version} className="card space-y-2 p-5">
          <h2 className="font-semibold">
            {t("changelogVersion")} {r.version}{" "}
            <span className="text-sm font-normal text-slate-500">{date(r.date)}</span>
          </h2>
          <ul className="list-disc space-y-1 ps-5 text-sm text-slate-700">
            {(locale === "ar" ? r.ar : r.en).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
