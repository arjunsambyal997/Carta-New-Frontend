"use client";

import { useRef, useState } from "react";
import { DownloadButton } from "@/components/common/DownloadButton";
import { PageHeader } from "@/components/common/PageHeader";
import { Status } from "@/components/common/Status";
import { useRegister } from "@/hooks/useRegister";
import { api } from "@/api";
import { useI18n } from "@/context/I18nContext";
import type { VaultCategory } from "@/api/types";

const CATEGORIES: VaultCategory[] = [
  "ARTICLES_OF_ASSOCIATION",
  "MEMORANDUM",
  "NOTARY_RECEIPT",
  "SHAREHOLDER_AGREEMENT",
  "RESOLUTION_MINUTES",
  "LICENCE",
  "OTHER",
];
const MAX_BYTES = 10 * 1024 * 1024;

export default function VaultPage() {
  const { t, num } = useI18n();
  const [refresh, setRefresh] = useState(0);
  const state = useRegister((o) => api.vault(o), refresh);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<VaultCategory>("ARTICLES_OF_ASSOCIATION");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file || !state.orgId) return;
    if (file.size > MAX_BYTES) return setError(t("vaultTooLarge"));
    setBusy(true);
    setError(null);
    try {
      await api.vaultUpload(state.orgId, title, category, file);
      setTitle("");
      if (fileRef.current) fileRef.current.value = "";
      setRefresh((n) => n + 1);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t("vaultTitle")} />
      <Status state={state} />
      {state.data && state.orgId && (
        <>
          <form className="card grid gap-3 sm:grid-cols-[2fr_2fr_2fr_auto] sm:items-end" onSubmit={upload}>
            <div>
              <label className="label" htmlFor="vt">
                {t("titleLabel")}
              </label>
              <input
                id="vt"
                className="input"
                required
                maxLength={200}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="vc">
                {t("vaultCategory")}
              </label>
              <select
                id="vc"
                className="input"
                value={category}
                onChange={(e) => setCategory(e.target.value as VaultCategory)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {t(`vault${c}` as never)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="vf">
                {t("vaultFile")}
              </label>
              <input
                id="vf"
                ref={fileRef}
                type="file"
                required
                className="input"
                accept=".pdf,.png,.jpg,.jpeg,.docx,.txt"
              />
            </div>
            <button className="btn" disabled={busy}>
              {busy ? t("loading") : t("vaultUpload")}
            </button>
            {error && (
              <p role="alert" className="text-sm text-red-700 sm:col-span-4">
                {error}
              </p>
            )}
            <p className="text-xs text-slate-500 sm:col-span-4">{t("vaultHint")}</p>
          </form>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <th className="py-2 text-start">{t("titleLabel")}</th>
                  <th className="text-start">{t("vaultCategory")}</th>
                  <th className="text-end">{t("vaultSize")}</th>
                  <th className="ps-4 text-start">SHA-256</th>
                  <th className="text-start">{t("vaultUploaded")}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {state.data.map((d) => (
                  <tr key={d.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-2">
                      <div>{d.title}</div>
                      <div className="text-xs text-slate-500" dir="ltr">
                        {d.fileName}
                      </div>
                    </td>
                    <td>{t(`vault${d.category}` as never)}</td>
                    <td className="text-end tabular-nums">{num(Math.max(1, Math.round(d.sizeBytes / 1024)))} KB</td>
                    <td className="ps-4 font-mono text-xs" dir="ltr" title={d.sha256}>
                      {d.sha256.slice(0, 12)}…
                    </td>
                    <td className="text-xs text-slate-600">
                      {d.uploadedBy}
                      <div>{d.createdAt.slice(0, 10)}</div>
                    </td>
                    <td className="text-end">
                      <DownloadButton label={t("download")} run={() => api.vaultDownload(state.orgId!, d)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {state.data.length === 0 && <p className="py-4 text-slate-500">{t("vaultEmpty")}</p>}
          </div>
        </>
      )}
    </div>
  );
}
