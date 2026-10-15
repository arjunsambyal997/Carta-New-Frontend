"use client";

import { useState } from "react";
import { DownloadButton } from "@/components/DownloadButton";
import { Status } from "@/components/Status";
import { useRegister } from "@/components/useRegister";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import type { OwnershipLink, Shareholder, UboPerson } from "@/lib/types";

export default function UboPage() {
  const { t, name } = useI18n();
  const [threshold, setThreshold] = useState("25");
  const [refresh, setRefresh] = useState(0);
  const th = Number(threshold);
  const valid = th > 0 && th <= 100;
  const state = useRegister(async (o) => {
    const [report, holders, links] = await Promise.all([api.ubo(o, valid ? th : 25), api.shareholders(o), api.ownershipLinks(o)]);
    return { report, holders, links };
  }, refresh + (valid ? th : 0));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t("uboTitle")}</h1>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="label" htmlFor="th">{t("uboThreshold")}</label>
            <input id="th" type="number" min="1" max="100" step="any" className="input w-24" dir="ltr" value={threshold} onChange={(e) => setThreshold(e.target.value)} />
          </div>
          {state.orgId && valid && (
            <>
              <DownloadButton label="CSV" run={() => api.uboExport(state.orgId!, "csv", th)} />
              <DownloadButton label="PDF" run={() => api.uboExport(state.orgId!, "pdf", th)} />
            </>
          )}
        </div>
      </div>
      <Status state={state} />
      {state.data && state.orgId && (
        <>
          <section className="space-y-2">
            <h2 className="font-medium">{t("uboOwners")}</h2>
            <PeopleTable people={state.data.report.beneficialOwners} ubo />
          </section>
          {state.data.report.belowThreshold.length > 0 && (
            <section className="space-y-2">
              <h2 className="font-medium">{t("uboBelow")}</h2>
              <PeopleTable people={state.data.report.belowThreshold} />
            </section>
          )}
          {state.data.report.gaps.length > 0 && (
            <section className="space-y-2">
              <h2 className="font-medium text-amber-800">{t("uboGaps")}</h2>
              <ul className="card divide-y divide-slate-100 border-amber-200 bg-amber-50 text-sm">
                {state.data.report.gaps.map((g) => (
                  <li key={g.shareholderId} className="flex flex-wrap justify-between gap-2 py-2">
                    <span>{name(g.nameEn, g.nameAr)} <span className="text-slate-500">· {g.reason}</span></span>
                    <span className="tabular-nums" dir="ltr">{g.economicPct}% / {g.votingPct}%</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {state.data.report.warnings.map((w) => (
            <p key={w} role="alert" className="text-sm text-amber-800">{w}</p>
          ))}
          <p className="text-xs text-slate-500">{state.data.report.disclaimer}</p>

          <section className="space-y-3">
            <h2 className="font-medium">{t("uboEditor")}</h2>
            <p className="text-sm text-slate-600">{t("uboEditorHint")}</p>
            {state.data.holders.filter((h) => h.holderType === "CORPORATE").length === 0 && (
              <p className="text-sm text-slate-500">{t("uboNoCorporate")}</p>
            )}
            {state.data.holders.filter((h) => h.holderType === "CORPORATE").map((h) => (
              <OwnersEditor
                key={h.id}
                orgId={state.orgId!}
                holder={h}
                holders={state.data!.holders}
                links={state.data!.links.filter((l) => l.ownedId === h.id)}
                onSaved={() => setRefresh((n) => n + 1)}
              />
            ))}
          </section>
        </>
      )}
    </div>
  );
}

function PeopleTable({ people, ubo = false }: { people: UboPerson[]; ubo?: boolean }) {
  const { t, name } = useI18n();
  if (people.length === 0) return <p className="card text-sm text-slate-500">{t("none")}</p>;
  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
            <th className="py-2 text-start">{t("fullNameEn")}</th>
            <th className="text-start">{t("nationality")}</th>
            <th className="text-end">{t("uboEconomic")}</th>
            <th className="text-end">{t("uboVoting")}</th>
            {ubo && <th className="ps-4 text-start">{t("uboQualifies")}</th>}
            <th className="ps-4 text-start">{t("uboRoute")}</th>
          </tr>
        </thead>
        <tbody>
          {people.map((p) => (
            <tr key={p.shareholderId} className="border-b border-slate-100 align-top last:border-0">
              <td className="py-2">{name(p.nameEn, p.nameAr)}<div className="text-xs text-slate-500" dir="ltr">{p.documentNo}</div></td>
              <td>{p.nationality}</td>
              <td className="text-end tabular-nums" dir="ltr">{p.economicPct}%</td>
              <td className="text-end tabular-nums" dir="ltr">{p.votingPct}%</td>
              {ubo && <td className="ps-4">{p.qualifiesBy ? t(`uboBy${p.qualifiesBy}` as never) : ""}</td>}
              <td className="ps-4 text-xs text-slate-600">
                {p.paths.map((path, i) => (
                  <div key={i} dir="ltr">{path.chain.join(" › ")} ({path.economicPct}%)</div>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface Row { ownerId: string; econ: string; vote: string }

function OwnersEditor({ orgId, holder, holders, links, onSaved }: {
  orgId: string; holder: Shareholder; holders: Shareholder[]; links: OwnershipLink[]; onSaved: () => void;
}) {
  const { t, name } = useI18n();
  const [rows, setRows] = useState<Row[]>(links.map((l) => ({ ownerId: l.ownerId, econ: String(l.economicPct), vote: String(l.votingPct) })));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const total = rows.reduce((s, r) => s + (Number(r.econ) || 0), 0);
  const update = (i: number, patch: Partial<Row>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    try {
      const res = await api.setOwners(orgId, holder.id, rows.map((r) => ({
        ownerId: r.ownerId, economicPct: Number(r.econ), votingPct: r.vote === "" ? undefined : Number(r.vote),
      })));
      setRows(res.map((l) => ({ ownerId: l.ownerId, econ: String(l.economicPct), vote: String(l.votingPct) })));
      setSaved(true);
      onSaved();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <form className="card space-y-3" onSubmit={save}>
      <div className="flex items-center justify-between">
        <h3 className="font-medium">{name(holder.fullNameEn, holder.fullNameAr)}</h3>
        <span className={`text-xs tabular-nums ${total > 100 ? "text-red-700" : "text-slate-500"}`} dir="ltr">{total}% / 100%</span>
      </div>
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-[1fr_5rem_5rem_auto] items-end gap-2">
          <div>
            {i === 0 && <label className="label">{t("uboOwner")}</label>}
            <select className="input" required value={r.ownerId} onChange={(e) => update(i, { ownerId: e.target.value })} aria-label={t("uboOwner")}>
              <option value="">{t("select")}</option>
              {holders.filter((h) => h.id !== holder.id).map((h) => <option key={h.id} value={h.id}>{name(h.fullNameEn, h.fullNameAr)}</option>)}
            </select>
          </div>
          <div>
            {i === 0 && <label className="label">{t("uboEconomic")}</label>}
            <input className="input" type="number" min="0.0001" max="100" step="any" required dir="ltr" value={r.econ} onChange={(e) => update(i, { econ: e.target.value })} aria-label={t("uboEconomic")} />
          </div>
          <div>
            {i === 0 && <label className="label">{t("uboVoting")}</label>}
            <input className="input" type="number" min="0" max="100" step="any" dir="ltr" value={r.vote} onChange={(e) => update(i, { vote: e.target.value })} aria-label={t("uboVoting")} />
          </div>
          <button type="button" className="btn-ghost" onClick={() => setRows(rows.filter((_, j) => j !== i))} aria-label={t("remove")}>×</button>
        </div>
      ))}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {saved && <p className="text-sm text-emerald-700">{t("saved")}</p>}
      <div className="flex gap-2">
        <button type="button" className="btn-ghost" onClick={() => setRows([...rows, { ownerId: "", econ: "", vote: "" }])}>{t("uboAddOwner")}</button>
        <button className="btn">{t("save")}</button>
      </div>
    </form>
  );
}
