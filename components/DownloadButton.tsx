"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n";

/** Button that runs an async download and shows a failure inline. */
export function DownloadButton({ label, run, className = "btn-ghost" }: { label: string; run: () => Promise<void>; className?: string }) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="inline-flex flex-col">
      <button
        type="button"
        className={className}
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          try {
            await run();
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? t("loading") : label}
      </button>
      {error && <span role="alert" className="mt-1 text-xs text-red-700">{error}</span>}
    </span>
  );
}
