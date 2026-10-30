"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { Status } from "@/components/common/Status";
import { useI18n } from "@/context/I18nContext";
import { useRegister } from "@/hooks/useRegister";
import { api } from "@/api";
import { analyticsSiteOrigin, embeddableUrl } from "@/features/analytics/embed";

/** Ask for a fresh signed link this long before the current one expires. */
const RENEW_BEFORE_MS = 5 * 60_000;

export default function AnalyticsPage() {
  const { t } = useI18n();
  const state = useRegister((o) => api.analyticsEmbed(o));
  // The app's origin is only known in the browser; until then show nothing rather than a flash of the empty state.
  const [appOrigin, setAppOrigin] = useState<string | null>(null);
  useEffect(() => setAppOrigin(window.location.origin), []);

  const embed = state.data;
  const { reload } = state;
  useEffect(() => {
    if (!embed || !reload) return;
    const wait = Date.parse(embed.expiresAt) - Date.now() - RENEW_BEFORE_MS;
    const timer = setTimeout(reload, Math.max(wait, 60_000));
    return () => clearTimeout(timer);
  }, [embed, reload]);

  // The page's CSP frames only the configured analytics site, so a link to anywhere else would not load anyway.
  const src =
    appOrigin && embed && analyticsSiteOrigin && new URL(embed.url).origin === analyticsSiteOrigin
      ? embeddableUrl(embed.url, appOrigin)
      : null;
  const notSetUp = !state.loading && !state.error && state.connected && !src;

  return (
    <div className="space-y-6">
      <PageHeader title={t("navAnalytics")} />
      <Status state={state} />
      {appOrigin && src && (
        <iframe
          src={src}
          title={t("navAnalytics")}
          className="h-[calc(100vh-12rem)] w-full rounded-lg border border-slate-200"
          referrerPolicy="no-referrer"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-downloads"
        />
      )}
      {appOrigin && notSetUp && (
        <EmptyState icon="analytics" title={t("analyticsNotSetTitle")} hint={t("analyticsNotSetHint")} />
      )}
    </div>
  );
}
