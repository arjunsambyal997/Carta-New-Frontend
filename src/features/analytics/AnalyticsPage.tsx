"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { useI18n } from "@/context/I18nContext";
import { embeddableUrl } from "@/features/analytics/embed";

const SRC = process.env.NEXT_PUBLIC_ANALYTICS_URL;

export default function AnalyticsPage() {
  const { t } = useI18n();
  // The app's origin is only known in the browser; until then show nothing rather than a flash of the empty state.
  const [appOrigin, setAppOrigin] = useState<string | null>(null);
  useEffect(() => setAppOrigin(window.location.origin), []);
  const src = appOrigin === null ? null : embeddableUrl(SRC, appOrigin);

  return (
    <div className="space-y-6">
      <PageHeader title={t("navAnalytics")} />
      {appOrigin === null ? null : src ? (
        <iframe
          src={src}
          title={t("navAnalytics")}
          className="h-[calc(100vh-12rem)] w-full rounded-lg border border-slate-200"
          loading="lazy"
          referrerPolicy="no-referrer"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />
      ) : (
        <EmptyState icon="analytics" title={t("analyticsNotSetTitle")} hint={t("analyticsNotSetHint")} />
      )}
    </div>
  );
}
