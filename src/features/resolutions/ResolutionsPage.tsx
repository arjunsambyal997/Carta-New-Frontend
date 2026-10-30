"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { StatusBadge, TallyBar, THRESHOLD_LABEL } from "@/features/resolutions/ResolutionBits";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { Status } from "@/components/common/Status";
import { useRegister } from "@/hooks/useRegister";
import { api } from "@/api";
import { StaggerItem, StaggerList } from "@/components/motion/Stagger";
import { useI18n } from "@/context/I18nContext";
import type { ResolutionThreshold } from "@/api/types";

export default function ResolutionsPage() {
  const { t, name, date } = useI18n();
  const [version, setVersion] = useState(0);
  const state = useRegister((orgId) => api.resolutions(orgId), version);
  const [showForm, setShowForm] = useState(false);
  // "New resolution" on the dashboard links here with ?new so the form is already open.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("new")) setShowForm(true);
  }, []);
  const [title, setTitle] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [description, setDescription] = useState("");
  const [threshold, setThreshold] = useState<ResolutionThreshold>("ORDINARY");
  const [quorum, setQuorum] = useState("50");
  const [deadline, setDeadline] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(e: FormEvent) {
    e.preventDefault();
    if (!state.orgId) return;
    setBusy(true);
    setError(null);
    try {
      await api.createResolution(state.orgId, {
        title,
        titleAr: titleAr || undefined,
        description: description || undefined,
        threshold,
        quorumPct: Number(quorum),
        votingDeadline: new Date(deadline).toISOString(),
      });
      setShowForm(false);
      setTitle("");
      setTitleAr("");
      setDescription("");
      setVersion((v) => v + 1);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("navResolutions")}
        subtitle={t("subResolutions")}
        action={
          state.connected && (
            <button className="btn" onClick={() => setShowForm((s) => !s)}>
              {t("newResolution")}
            </button>
          )
        }
      />
      <Status state={state} shape="cards" />

      {showForm && (
        <form onSubmit={create} className="card max-w-2xl space-y-4">
          <div>
            <label className="label" htmlFor="t">
              {t("titleLabel")}
            </label>
            <input
              id="t"
              required
              maxLength={255}
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="tar">
              {t("titleArLabel")}
            </label>
            <input
              id="tar"
              dir="rtl"
              maxLength={255}
              className="input"
              value={titleAr}
              onChange={(e) => setTitleAr(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="d">
              {t("descriptionLabel")}
            </label>
            <textarea
              id="d"
              maxLength={4000}
              className="input h-24"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor="th">
                {t("thresholdLabel")}
              </label>
              <select
                id="th"
                className="input"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value as ResolutionThreshold)}
              >
                <option value="ORDINARY">{t("thresholdOrdinary")}</option>
                <option value="TWO_THIRDS">{t("thresholdTwoThirds")}</option>
                <option value="SPECIAL">{t("thresholdSpecial")}</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="q">
                {t("quorumLabel")}
              </label>
              <input
                id="q"
                type="number"
                min={0}
                max={100}
                step="any"
                dir="ltr"
                className="input"
                value={quorum}
                onChange={(e) => setQuorum(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="dl">
                {t("deadlineLabel")}
              </label>
              <input
                id="dl"
                required
                type="datetime-local"
                dir="ltr"
                className="input"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
          </div>
          {error && (
            <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}
          <button className="btn" disabled={busy} type="submit">
            {busy ? t("creating") : t("create")}
          </button>
        </form>
      )}

      {state.data && state.data.length === 0 && (
        <div className="card">
          <EmptyState icon="resolutions" title={t("noResolutions")} hint={t("noResolutionsHint")} />
        </div>
      )}
      <StaggerList className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3 [&>li]:content-start">
        {state.data?.map((r) => (
          <StaggerItem key={r.id} className="card space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Link href={`/resolutions/${r.id}`} className="font-medium text-emerald-800 hover:underline">
                {name(r.title, r.titleAr)}
              </Link>
              <StatusBadge status={r.status} />
            </div>
            <p className="text-xs text-slate-500">
              {t("deadline")}: {date(r.votingDeadline, true)} · {t(THRESHOLD_LABEL[r.threshold])}
            </p>
            {r.status !== "DRAFT" && <TallyBar r={r} />}
          </StaggerItem>
        ))}
      </StaggerList>
    </div>
  );
}
