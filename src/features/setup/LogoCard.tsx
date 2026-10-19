"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/api";
import type { Organization } from "@/api/types";
import { CompanyLogo } from "@/components/common/CompanyLogo";
import { useFeedback } from "@/components/common/Feedback";
import { useI18n } from "@/context/I18nContext";
import { LOGO_CHANGED } from "@/hooks/useCompanyLogo";

export const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp"];
export const LOGO_MAX_BYTES = 512 * 1024;

/** Returns a message key when the file cannot be a logo, so the user hears about it before an upload round trip. */
export function logoProblem(file: { type: string; size: number }): "logoBadType" | "logoTooBig" | null {
  if (!LOGO_TYPES.includes(file.type)) return "logoBadType";
  if (file.size > LOGO_MAX_BYTES) return "logoTooBig";
  return null;
}

/** Upload, replace or remove the company logo shown in the sidebar, top bar and company switcher. */
export function LogoCard({ orgId }: { orgId: string }) {
  const { t, name } = useI18n();
  const { toast, confirm } = useFeedback();
  const input = useRef<HTMLInputElement>(null);
  const [company, setCompany] = useState<Organization | null>(null);
  const [preview, setPreview] = useState<{ file: File; url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .organization(orgId)
      .then(setCompany)
      .catch((e: Error) => setError(e.message));
  }, [orgId]);
  useEffect(() => () => (preview ? URL.revokeObjectURL(preview.url) : undefined), [preview]);

  const label = company ? name(company.legalNameEn, company.legalNameAr) : "";
  const version = company?.hasLogo ? company.logoUpdatedAt : null;

  function choose(file: File | undefined) {
    setError(null);
    if (!file) return;
    const problem = logoProblem(file);
    if (problem) {
      setPreview(null);
      return setError(t(problem));
    }
    setPreview({ file, url: URL.createObjectURL(file) });
  }

  async function save() {
    if (!preview) return;
    setBusy(true);
    setError(null);
    try {
      setCompany(await api.uploadLogo(orgId, preview.file));
      setPreview(null);
      window.dispatchEvent(new Event(LOGO_CHANGED));
      toast(t("logoSaved"));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!(await confirm({ message: t("logoRemoveConfirm"), confirmLabel: t("logoRemove"), danger: true }))) return;
    setBusy(true);
    setError(null);
    try {
      await api.deleteLogo(orgId);
      setCompany(await api.organization(orgId));
      window.dispatchEvent(new Event(LOGO_CHANGED));
      toast(t("logoRemoved"));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card flex flex-wrap items-center gap-5" aria-labelledby="logo-h">
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview.url} alt="" className="size-20 rounded-2xl bg-white object-contain ring-1 ring-slate-200" />
      ) : (
        <CompanyLogo orgId={orgId} version={version} name={label || "?"} size={80} />
      )}
      <div className="min-w-0 flex-1 space-y-2">
        <h2 id="logo-h" className="text-sm font-semibold">
          {t("logoTitle")}
        </h2>
        <p className="text-sm text-slate-500">{t("logoHint")}</p>
        <input
          ref={input}
          type="file"
          accept={LOGO_TYPES.join(",")}
          className="sr-only"
          aria-label={t("logoChoose")}
          onChange={(e) => {
            choose(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-ghost" disabled={busy} onClick={() => input.current?.click()}>
            {company?.hasLogo ? t("logoReplace") : t("logoChoose")}
          </button>
          {preview && (
            <button type="button" className="btn" disabled={busy} onClick={save}>
              {busy ? t("logoSaving") : t("logoUse")}
            </button>
          )}
          {!preview && company?.hasLogo && (
            <button type="button" className="btn-ghost text-red-700" disabled={busy} onClick={remove}>
              {t("logoRemove")}
            </button>
          )}
        </div>
        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
