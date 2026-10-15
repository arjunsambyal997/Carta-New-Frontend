"use client";

import { useState } from "react";
import { Status } from "@/components/Status";
import { useRegister } from "@/components/useRegister";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import type { Role } from "@/lib/types";

const ROLES: Role[] = ["FOUNDER", "CORPORATE_SECRETARY", "BOARD_MEMBER", "SHAREHOLDER", "LEGAL_AUDITOR"];

export default function MembersPage() {
  const { t, name } = useI18n();
  const [refresh, setRefresh] = useState(0);
  const state = useRegister(async (o) => ({ members: await api.members(o), holders: await api.shareholders(o) }), refresh);
  const [f, setF] = useState({ email: "", displayName: "", role: "BOARD_MEMBER" as Role, shareholderId: "" });
  const [temp, setTemp] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    if (!state.orgId) return;
    setError(null); setTemp(null);
    try {
      const r = await api.invite(state.orgId, { email: f.email, displayName: f.displayName, role: f.role, shareholderId: f.shareholderId || undefined });
      setTemp(r.temporaryPassword);
      setF({ ...f, email: "", displayName: "" });
      setRefresh((n) => n + 1);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("membersTitle")}</h1>
      <Status state={state} />
      {state.data && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card self-start"><table className="w-full text-sm">
            <tbody>
              {state.data.members.map((m) => (
                <tr key={m.email} className="border-b border-slate-100 last:border-0">
                  <td className="py-2"><div>{m.displayName}</div><div className="text-xs text-slate-500" dir="ltr">{m.email}</div></td>
                  <td className="py-2 text-end text-slate-600">{t(`role${m.role}` as never)}{m.shareholderName ? ` · ${m.shareholderName}` : ""}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
          <form className="card space-y-3" onSubmit={invite}>
            <h2 className="font-medium">{t("inviteMember")}</h2>
            <div><label className="label" htmlFor="ie">{t("email")}</label><input id="ie" type="email" className="input" dir="ltr" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
            <div><label className="label" htmlFor="idn">{t("displayName")}</label><input id="idn" className="input" required value={f.displayName} onChange={(e) => setF({ ...f, displayName: e.target.value })} /></div>
            <div><label className="label" htmlFor="ir">{t("role")}</label>
              <select id="ir" className="input" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as Role })}>{ROLES.map((r) => <option key={r} value={r}>{t(`role${r}` as never)}</option>)}</select></div>
            {f.role === "SHAREHOLDER" && (
              <div><label className="label" htmlFor="is">{t("linkedHolder")}</label>
                <select id="is" className="input" required value={f.shareholderId} onChange={(e) => setF({ ...f, shareholderId: e.target.value })}>
                  <option value="">{t("none")}</option>
                  {state.data.holders.map((h) => <option key={h.id} value={h.id}>{name(h.fullNameEn, h.fullNameAr)}</option>)}
                </select></div>
            )}
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
            {temp && <div className="rounded bg-amber-50 p-3 text-sm"><span className="label">{t("tempPassword")}</span><code dir="ltr" className="break-all">{temp}</code></div>}
            <button className="btn w-full">{t("inviteMember")}</button>
          </form>
        </div>
      )}
    </div>
  );
}
