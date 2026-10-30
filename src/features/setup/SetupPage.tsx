"use client";

import { useState } from "react";
import { Avatar } from "@/components/common/Avatar";
import { useFeedback } from "@/components/common/Feedback";
import { PageHeader } from "@/components/common/PageHeader";
import { Status } from "@/components/common/Status";
import { EmptyState } from "@/components/common/EmptyState";
import { FieldError } from "@/components/common/FieldError";
import { LogoCard } from "@/features/setup/LogoCard";
import { validateClass, validateHolder } from "@/features/setup/validate";
import { useRegister } from "@/hooks/useRegister";
import { api } from "@/api";
import { useI18n } from "@/context/I18nContext";
import type { ShareClassType } from "@/api/types";

const CLASS_TYPES: ShareClassType[] = ["COMMON_VOTING", "NON_VOTING_ECONOMIC", "PREFERRED_FOUNDER", "TREASURY"];
const CURRENCIES = ["AED", "SAR", "USD", "QAR", "BHD", "KWD", "OMR"];

export default function SetupPage() {
  const { t, name, num } = useI18n();
  const [refresh, setRefresh] = useState(0);
  const state = useRegister(
    async (o) => ({ classes: await api.shareClasses(o), holders: await api.shareholders(o) }),
    refresh,
  );

  return (
    <div className="space-y-6">
      <PageHeader title={t("setupTitle")} subtitle={t("subSetup")} />
      <Status state={state} shape="form" />
      {state.orgId && <LogoCard orgId={state.orgId} />}
      {state.data && state.orgId && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="space-y-3">
            <ClassForm orgId={state.orgId} onDone={() => setRefresh((n) => n + 1)} />
            <h2 className="text-sm font-semibold text-slate-700">{t("classesHeading")}</h2>
            {state.data.classes.length === 0 ? (
              <div className="card">
                <EmptyState compact icon="captable" title={t("noClassesYet")} hint={t("noClassesYetHint")} />
              </div>
            ) : (
              <ul className="card divide-y divide-slate-100 text-sm">
                {state.data.classes.map((c) => (
                  <li key={c.id} className="flex justify-between gap-3 py-2.5">
                    <span>{name(c.name, c.nameAr)}</span>
                    <span className="text-slate-500">
                      {t(`class${c.classType}` as never)} · {num(c.parValue)} {c.currency}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="space-y-3">
            <HolderForm orgId={state.orgId} onDone={() => setRefresh((n) => n + 1)} />
            <h2 className="text-sm font-semibold text-slate-700">{t("holdersHeading")}</h2>
            {state.data.holders.length === 0 ? (
              <div className="card">
                <EmptyState
                  compact
                  icon="members"
                  title={t("noHoldersYet")}
                  hint={t("noHoldersYetHint")}
                  action={{ label: t("navImport"), href: "/import" }}
                />
              </div>
            ) : (
              <ul className="card divide-y divide-slate-100 text-sm">
                {state.data.holders.map((h) => (
                  <li key={h.id} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="flex min-w-0 items-center gap-3">
                      <Avatar name={h.fullNameEn} size={28} />
                      <span className="truncate">{name(h.fullNameEn, h.fullNameAr)}</span>
                    </span>
                    <span
                      className={`chip shrink-0 ${h.holderType === "CORPORATE" ? "bg-sky-50 text-sky-700" : "bg-slate-100 text-slate-600"}`}
                    >
                      {h.holderType === "CORPORATE" ? t("corporate") : t("individual")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function useSubmit(onDone: () => void) {
  const { t } = useI18n();
  const { toast } = useFeedback();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return {
    error,
    busy,
    run: async (fn: () => Promise<unknown>) => {
      setBusy(true);
      setError(null);
      try {
        await fn();
        toast(t("saved"));
        onDone();
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setBusy(false);
      }
    },
  };
}

function ClassForm({ orgId, onDone }: { orgId: string; onDone: () => void }) {
  const { t } = useI18n();
  const s = useSubmit(onDone);
  const [tried, setTried] = useState(false);
  const [f, setF] = useState({
    name: "",
    nameAr: "",
    classType: "COMMON_VOTING" as ShareClassType,
    parValue: "1",
    currency: "AED",
    votingMultiplier: "1",
    liquidationMultiple: "0",
    participating: false,
    seniorityRank: "1",
    authorizedShares: "",
  });
  const ce = validateClass(f);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  return (
    <form
      className="card grid grid-cols-1 gap-3 sm:grid-cols-2"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        setTried(true);
        if (Object.keys(ce).length) return;
        s.run(() =>
          api.createShareClass(orgId, {
            name: f.name,
            nameAr: f.nameAr || undefined,
            classType: f.classType,
            parValue: Number(f.parValue),
            currency: f.currency,
            votingMultiplier: Number(f.votingMultiplier),
            liquidationMultiple: Number(f.liquidationMultiple),
            participating: f.participating,
            seniorityRank: Number(f.seniorityRank),
            authorizedShares: f.authorizedShares ? Number(f.authorizedShares) : undefined,
          }),
        );
      }}
    >
      <h2 className="text-sm font-semibold sm:col-span-2">{t("addShareClass")}</h2>
      <div>
        <label className="label" htmlFor="cn">
          {t("className")}{" "}
          <span aria-hidden className="text-red-600">
            *
          </span>
        </label>
        <input
          id="cn"
          className="input"
          required
          value={f.name}
          onChange={set("name")}
          aria-invalid={!!(tried && ce.name)}
          aria-describedby="e-cn"
        />
        <FieldError id="e-cn">{tried && ce.name && t(ce.name)}</FieldError>
      </div>
      <div>
        <label className="label" htmlFor="cna">
          {t("classNameAr")}
        </label>
        <input id="cna" className="input" dir="rtl" value={f.nameAr} onChange={set("nameAr")} />
      </div>
      <div>
        <label className="label" htmlFor="ct">
          {t("classType")}
        </label>
        <select id="ct" className="input" value={f.classType} onChange={set("classType")}>
          {CLASS_TYPES.map((c) => (
            <option key={c} value={c}>
              {t(`class${c}` as never)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="cc">
          {t("currency")}
        </label>
        <select id="cc" className="input" value={f.currency} onChange={set("currency")}>
          {CURRENCIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="pv">
          {t("parValue")}{" "}
          <span aria-hidden className="text-red-600">
            *
          </span>
        </label>
        <input
          id="pv"
          type="number"
          step="any"
          min="0"
          className="input"
          dir="ltr"
          required
          value={f.parValue}
          onChange={set("parValue")}
          aria-invalid={!!(tried && ce.parValue)}
          aria-describedby="e-pv"
        />
        <FieldError id="e-pv">{tried && ce.parValue && t(ce.parValue)}</FieldError>
      </div>
      <div>
        <label className="label" htmlFor="vm">
          {t("votesPerShare")}
        </label>
        <input
          id="vm"
          type="number"
          step="any"
          min="0"
          className="input"
          dir="ltr"
          value={f.votingMultiplier}
          onChange={set("votingMultiplier")}
          aria-invalid={!!(tried && ce.votingMultiplier)}
          aria-describedby="e-vm"
        />
        <FieldError id="e-vm">{tried && ce.votingMultiplier && t(ce.votingMultiplier)}</FieldError>
      </div>
      <div>
        <label className="label" htmlFor="lm">
          {t("liqMultiple")}
        </label>
        <input
          id="lm"
          type="number"
          step="any"
          min="0"
          className="input"
          dir="ltr"
          value={f.liquidationMultiple}
          onChange={set("liquidationMultiple")}
          aria-invalid={!!(tried && ce.liquidationMultiple)}
          aria-describedby="e-lm"
        />
        <FieldError id="e-lm">{tried && ce.liquidationMultiple && t(ce.liquidationMultiple)}</FieldError>
      </div>
      <div>
        <label className="label" htmlFor="sr">
          {t("seniority")}
        </label>
        <input
          id="sr"
          type="number"
          min="0"
          className="input"
          dir="ltr"
          value={f.seniorityRank}
          onChange={set("seniorityRank")}
          aria-invalid={!!(tried && ce.seniorityRank)}
          aria-describedby="e-sr"
        />
        <FieldError id="e-sr">{tried && ce.seniorityRank && t(ce.seniorityRank)}</FieldError>
      </div>
      <div>
        <label className="label" htmlFor="au">
          {t("authorized")}
        </label>
        <input
          id="au"
          type="number"
          min="1"
          className="input"
          dir="ltr"
          value={f.authorizedShares}
          onChange={set("authorizedShares")}
          aria-invalid={!!(tried && ce.authorizedShares)}
          aria-describedby="e-au"
        />
        <FieldError id="e-au">{tried && ce.authorizedShares && t(ce.authorizedShares)}</FieldError>
      </div>
      <label className="flex items-center gap-2 self-end text-sm">
        <input
          type="checkbox"
          checked={f.participating}
          onChange={(e) => setF({ ...f, participating: e.target.checked })}
        />
        {t("participating")}
      </label>
      {s.error && (
        <p role="alert" className="text-sm text-red-700 sm:col-span-2">
          {s.error}
        </p>
      )}
      <button className="btn sm:col-span-2" disabled={s.busy}>
        {s.busy ? t("creating") : t("addShareClass")}
      </button>
    </form>
  );
}

function HolderForm({ orgId, onDone }: { orgId: string; onDone: () => void }) {
  const { t } = useI18n();
  const s = useSubmit(onDone);
  const [tried, setTried] = useState(false);
  const [f, setF] = useState({
    holderType: "INDIVIDUAL" as "INDIVIDUAL" | "CORPORATE",
    fullNameEn: "",
    fullNameAr: "",
    nationality: "",
    passportNo: "",
    dateOfBirth: "",
    address: "",
    registrationNo: "",
    email: "",
  });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const he = validateHolder(f);
  const corp = f.holderType === "CORPORATE";
  return (
    <form
      className="card grid grid-cols-1 gap-3 sm:grid-cols-2"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        setTried(true);
        if (Object.keys(he).length) return;
        s.run(() =>
          api.createShareholder(orgId, {
            holderType: f.holderType,
            fullNameEn: f.fullNameEn,
            fullNameAr: f.fullNameAr || undefined,
            nationality: f.nationality.toUpperCase() || undefined,
            passportNo: corp ? undefined : f.passportNo || undefined,
            dateOfBirth: corp ? undefined : f.dateOfBirth || undefined,
            address: f.address || undefined,
            registrationNo: corp ? f.registrationNo || undefined : undefined,
            email: f.email || undefined,
          }),
        );
      }}
    >
      <h2 className="text-sm font-semibold sm:col-span-2">{t("addShareholder")}</h2>
      <div>
        <label className="label" htmlFor="ht">
          {t("holderType")}
        </label>
        <select id="ht" className="input" value={f.holderType} onChange={set("holderType")}>
          <option value="INDIVIDUAL">{t("individual")}</option>
          <option value="CORPORATE">{t("corporate")}</option>
        </select>
      </div>
      <div>
        <label className="label" htmlFor="nat">
          {t("nationality")}
        </label>
        <input
          id="nat"
          className="input"
          dir="ltr"
          maxLength={2}
          value={f.nationality}
          onChange={set("nationality")}
          aria-invalid={!!(tried && he.nationality)}
          aria-describedby="e-nat"
        />
        <FieldError id="e-nat">{tried && he.nationality && t(he.nationality)}</FieldError>
      </div>
      <div>
        <label className="label" htmlFor="fn">
          {t("fullNameEn")}{" "}
          <span aria-hidden className="text-red-600">
            *
          </span>
        </label>
        <input
          id="fn"
          className="input"
          required
          value={f.fullNameEn}
          onChange={set("fullNameEn")}
          aria-invalid={!!(tried && he.fullNameEn)}
          aria-describedby="e-fn"
        />
        <FieldError id="e-fn">{tried && he.fullNameEn && t(he.fullNameEn)}</FieldError>
      </div>
      <div>
        <label className="label" htmlFor="fna">
          {t("fullNameAr")}
        </label>
        <input id="fna" className="input" dir="rtl" value={f.fullNameAr} onChange={set("fullNameAr")} />
      </div>
      {corp ? (
        <div>
          <label className="label" htmlFor="rn">
            {t("registrationNo")}
          </label>
          <input id="rn" className="input" dir="ltr" value={f.registrationNo} onChange={set("registrationNo")} />
        </div>
      ) : (
        <div>
          <label className="label" htmlFor="pp">
            {t("passportNo")}
          </label>
          <input id="pp" className="input" dir="ltr" value={f.passportNo} onChange={set("passportNo")} />
        </div>
      )}
      {!corp && (
        <div>
          <label className="label" htmlFor="dob">
            {t("dateOfBirth")}
          </label>
          <input
            id="dob"
            type="date"
            className="input"
            value={f.dateOfBirth}
            onChange={set("dateOfBirth")}
            aria-invalid={!!(tried && he.dateOfBirth)}
            aria-describedby="e-dob"
          />
          <FieldError id="e-dob">{tried && he.dateOfBirth && t(he.dateOfBirth)}</FieldError>
        </div>
      )}
      <div>
        <label className="label" htmlFor="addr">
          {t("holderAddress")}
        </label>
        <input id="addr" className="input" maxLength={1000} value={f.address} onChange={set("address")} />
      </div>
      <div>
        <label className="label" htmlFor="em">
          {t("email")}
        </label>
        <input
          id="em"
          type="email"
          className="input"
          dir="ltr"
          value={f.email}
          onChange={set("email")}
          aria-invalid={!!(tried && he.email)}
          aria-describedby="e-em"
        />
        <FieldError id="e-em">{tried && he.email && t(he.email)}</FieldError>
      </div>
      {s.error && (
        <p role="alert" className="text-sm text-red-700 sm:col-span-2">
          {s.error}
        </p>
      )}
      <button className="btn sm:col-span-2" disabled={s.busy}>
        {s.busy ? t("creating") : t("addShareholder")}
      </button>
    </form>
  );
}
