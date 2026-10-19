"use client";

import { useState } from "react";
import { Avatar, RoleChip } from "@/components/common/Avatar";
import { useFeedback } from "@/components/common/Feedback";
import { Icon } from "@/components/common/Icon";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { Status } from "@/components/common/Status";
import { useRegister } from "@/hooks/useRegister";
import { api } from "@/api";
import { useI18n } from "@/context/I18nContext";
import type { Role } from "@/api/types";

const ROLES: Role[] = ["FOUNDER", "CORPORATE_SECRETARY", "BOARD_MEMBER", "SHAREHOLDER", "LEGAL_AUDITOR"];

export default function MembersPage() {
  const { t, name } = useI18n();
  const [refresh, setRefresh] = useState(0);
  const state = useRegister(
    async (o) => ({ members: await api.members(o), holders: await api.shareholders(o) }),
    refresh,
  );
  const [f, setF] = useState({ email: "", displayName: "", role: "BOARD_MEMBER" as Role, shareholderId: "" });
  const [temp, setTemp] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { toast } = useFeedback();

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast(t("copied"));
    } catch (e) {
      toast((e as Error).message, "error");
    }
  }

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    if (!state.orgId) return;
    setError(null);
    setTemp(null);
    setBusy(true);
    try {
      const r = await api.invite(state.orgId, {
        email: f.email,
        displayName: f.displayName,
        role: f.role,
        shareholderId: f.shareholderId || undefined,
      });
      setTemp(r.temporaryPassword);
      setF({ ...f, email: "", displayName: "" });
      setRefresh((n) => n + 1);
      toast(t("toastInvited"));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t("membersTitle")} subtitle={t("subMembers")} />
      <Status state={state} />
      {state.data && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="card self-start !p-0">
            <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h2 className="text-sm font-semibold">{t("navMembers")}</h2>
              <span className="chip bg-slate-100 tabular-nums text-slate-600">{state.data.members.length}</span>
            </header>
            {state.data.members.length === 0 ? (
              <EmptyState icon="members" title={t("noMembers")} hint={t("noMembersHint")} />
            ) : (
              <ul className="divide-y divide-slate-100">
                {state.data.members.map((m) => (
                  <li key={m.email} className="flex items-center gap-3 px-4 py-3">
                    <Avatar name={m.displayName || m.email} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">{m.displayName}</p>
                      <p className="truncate text-xs text-slate-500" dir="ltr">
                        {m.email}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <RoleChip role={m.role} label={t(`role${m.role}` as never)} />
                      {m.shareholderName && (
                        <span className="max-w-[10rem] truncate text-xs text-slate-500">{m.shareholderName}</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <form className="card space-y-3" onSubmit={invite}>
            <h2 className="text-sm font-semibold">{t("inviteMember")}</h2>
            <div>
              <label className="label" htmlFor="ie">
                {t("email")}
              </label>
              <input
                id="ie"
                type="email"
                className="input"
                dir="ltr"
                required
                value={f.email}
                onChange={(e) => setF({ ...f, email: e.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="idn">
                {t("displayName")}
              </label>
              <input
                id="idn"
                className="input"
                required
                value={f.displayName}
                onChange={(e) => setF({ ...f, displayName: e.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="ir">
                {t("role")}
              </label>
              <select
                id="ir"
                className="input"
                value={f.role}
                onChange={(e) => setF({ ...f, role: e.target.value as Role })}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {t(`role${r}` as never)}
                  </option>
                ))}
              </select>
            </div>
            {f.role === "SHAREHOLDER" && (
              <div>
                <label className="label" htmlFor="is">
                  {t("linkedHolder")}
                </label>
                <select
                  id="is"
                  className="input"
                  required
                  value={f.shareholderId}
                  onChange={(e) => setF({ ...f, shareholderId: e.target.value })}
                >
                  <option value="">{t("none")}</option>
                  {state.data.holders.map((h) => (
                    <option key={h.id} value={h.id}>
                      {name(h.fullNameEn, h.fullNameAr)}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {error && (
              <p role="alert" className="text-sm text-red-700">
                {error}
              </p>
            )}
            {temp && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
                <span className="label !text-amber-800">{t("tempPassword")}</span>
                <div className="flex items-center gap-2">
                  <code dir="ltr" className="min-w-0 flex-1 break-all font-mono text-slate-900">
                    {temp}
                  </code>
                  <button type="button" className="btn-ghost h-8 shrink-0" onClick={() => copy(temp)}>
                    <Icon name="copy" size={15} />
                    {t("copy")}
                  </button>
                </div>
              </div>
            )}
            <button className="btn w-full" disabled={busy}>
              {busy ? t("creating") : t("inviteMember")}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
