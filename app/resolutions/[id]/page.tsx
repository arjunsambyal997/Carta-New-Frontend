"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { StatusBadge, TallyBar } from "@/components/ResolutionBits";
import { Status } from "@/components/Status";
import { useRegister } from "@/components/useRegister";
import { api } from "@/lib/api";
import { useI18n, type Key } from "@/lib/i18n";
import type { VoteChoice } from "@/lib/types";

const CHOICES: { v: VoteChoice; key: Key; cls: string }[] = [
  { v: "FOR", key: "voteFor", cls: "bg-[rgb(var(--btn))] hover:bg-[rgb(var(--btn-hover))]" },
  { v: "AGAINST", key: "voteAgainst", cls: "bg-[rgb(200_38_38)] hover:bg-[rgb(170_30_30)]" },
  { v: "ABSTAIN", key: "voteAbstain", cls: "bg-[rgb(84_94_110)] hover:bg-[rgb(64_74_90)]" },
];

export default function ResolutionPage() {
  const { t, num, name } = useI18n();
  const { id } = useParams<{ id: string }>();
  const [version, setVersion] = useState(0);
  const state = useRegister(async (orgId) => {
    const [detail, holders] = await Promise.all([api.resolution(orgId, id), api.shareholders(orgId).catch(() => [])]);
    return { ...detail, holders };
  }, version);
  const [onBehalf, setOnBehalf] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function act(fn: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      setVersion((v) => v + 1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const r = state.data?.resolution;
  const orgId = state.orgId;
  const money = (n: number) => num(n, { maximumFractionDigits: 2 });
  const pct = (n: number) => `${num(n, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}%`;

  return (
    <div className="max-w-3xl space-y-4">
      <Link href="/resolutions" className="text-sm text-slate-500 hover:underline">← {t("back")}</Link>
      <Status state={state} />
      {r && orgId && (
        <>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h1 className="text-2xl font-semibold">{name(r.title, r.titleAr)}</h1>
            <StatusBadge status={r.status} />
          </div>
          {r.description && <p className="whitespace-pre-wrap text-slate-700">{r.description}</p>}
          <p className="text-sm text-slate-500">
            {t("deadline")}: {new Date(r.votingDeadline).toLocaleString()} ·{" "}
            {r.threshold === "SPECIAL" ? t("thresholdSpecial") : t("thresholdOrdinary")}
          </p>

          {r.status !== "DRAFT" && (
            <div className="card space-y-3">
              <TallyBar r={r} />
              <div className="grid grid-cols-3 gap-3 text-sm tabular-nums">
                <div><div className="label">{t("voteFor")}</div>{money(r.tally.forWeight)}</div>
                <div><div className="label">{t("voteAgainst")}</div>{money(r.tally.againstWeight)}</div>
                <div><div className="label">{t("voteAbstain")}</div>{money(r.tally.abstainWeight)}</div>
              </div>
              <p className="text-sm text-slate-600">
                {t("forOfDecided")}: {pct(r.tally.forPctOfDecided)}
                {r.status === "ACTIVE" && (
                  <span className={`ms-2 font-medium ${r.tally.wouldPass ? "text-emerald-700" : "text-red-700"}`}>
                    {r.tally.wouldPass ? t("currentlyPassing") : t("currentlyFailing")}
                  </span>
                )}
              </p>
            </div>
          )}

          {error && <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}

          {r.status === "DRAFT" && (
            <button className="btn" disabled={busy} onClick={() => act(() => api.openResolution(orgId, r.id))}>{t("openVoting")}</button>
          )}

          {r.status === "ACTIVE" && (
            <div className="card space-y-3">
              <h2 className="text-sm font-semibold text-slate-700">{t("castVote")}</h2>
              {state.data!.holders.length > 0 && (
                <div>
                  <label className="label" htmlFor="behalf">{t("recordFor")}</label>
                  <select id="behalf" className="input max-w-sm" value={onBehalf} onChange={(e) => setOnBehalf(e.target.value)}>
                    <option value="">{t("myself")}</option>
                    {state.data!.holders.map((h) => (
                      <option key={h.id} value={h.id}>{name(h.fullNameEn, h.fullNameAr)}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {CHOICES.map((c) => (
                  <button key={c.v} disabled={busy} className={`btn ${c.cls}`} onClick={() => act(() => api.castVote(orgId, r.id, c.v, onBehalf))}>
                    {t(c.key)}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500">{t("voteFinal")}</p>
              <button className="btn-ghost" disabled={busy} onClick={() => act(() => api.closeResolution(orgId, r.id))}>{t("closeVoting")}</button>
            </div>
          )}

          <section>
            <h2 className="mb-2 text-sm font-semibold text-slate-700">{t("votesCast")}</h2>
            {state.data!.votes.length === 0 ? (
              <p className="text-sm text-slate-400">{t("noVotes")}</p>
            ) : (
              <div className="card overflow-x-auto p-0">
                <table className="w-full min-w-[520px] text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-3 py-2 text-start font-medium">{t("shareholder")}</th>
                      <th className="px-3 py-2 text-start font-medium">{t("votes")}</th>
                      <th className="px-3 py-2 text-end font-medium">{t("weight")}</th>
                      <th className="px-3 py-2 text-end font-medium">{t("castAt")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 tabular-nums">
                    {state.data!.votes.map((v) => (
                      <tr key={v.shareholderId}>
                        <td className="px-3 py-2 text-start font-medium">{name(v.nameEn, v.nameAr)}</td>
                        <td className="px-3 py-2 text-start">{t(`vote${v.vote === "FOR" ? "For" : v.vote === "AGAINST" ? "Against" : "Abstain"}` as Key)}</td>
                        <td className="px-3 py-2 text-end">{money(v.weight)}</td>
                        <td className="px-3 py-2 text-end">{new Date(v.castAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
