"use client";

import { useState } from "react";
import { api } from "@/api";
import type { WebhookDeliveryView, WebhookView } from "@/api/types";
import { Icon } from "@/components/common/Icon";
import { PageHeader } from "@/components/common/PageHeader";
import { Status } from "@/components/common/Status";
import { useI18n } from "@/context/I18nContext";
import { useRegister } from "@/hooks/useRegister";

function SecretBox({ label, secret }: { label: string; secret: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  return (
    <div role="status" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
      <p className="mb-2 font-medium">{label}</p>
      <div className="flex items-center gap-2">
        <code className="min-w-0 flex-1 break-all rounded bg-white px-2 py-1 font-mono text-xs" dir="ltr">
          {secret}
        </code>
        <button
          type="button"
          className="btn-ghost h-8 shrink-0"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(secret);
              setCopied(true);
            } catch {
              setCopied(false);
            }
          }}
        >
          <Icon name={copied ? "check" : "copy"} size={15} />
          {t("copy")}
        </button>
      </div>
    </div>
  );
}

function ApiKeys({ orgId }: { orgId: string }) {
  const { t } = useI18n();
  const [refresh, setRefresh] = useState(0);
  const state = useRegister((o) => api.apiKeys(o), refresh);
  const [name, setName] = useState("");
  const [secret, setSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const r = await api.createApiKey(orgId, name.trim());
      setSecret(r.secret);
      setName("");
      setRefresh((n) => n + 1);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function revoke(id: string) {
    if (!window.confirm(t("intgConfirmRevoke"))) return;
    setError(null);
    try {
      await api.revokeApiKey(orgId, id);
      setRefresh((n) => n + 1);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <section className="card space-y-4" aria-labelledby="keys-h">
      <div>
        <h2 id="keys-h" className="text-base font-semibold">
          {t("intgKeysTitle")}
        </h2>
        <p className="text-sm text-slate-500">{t("intgKeysHint")}</p>
      </div>
      <form className="flex flex-wrap items-end gap-3" onSubmit={create}>
        <div className="min-w-[200px] flex-1">
          <label className="label" htmlFor="key-name">
            {t("intgKeyName")}
          </label>
          <input
            id="key-name"
            className="input"
            required
            maxLength={120}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <button className="btn">{t("intgKeyCreate")}</button>
      </form>
      {secret && <SecretBox label={t("intgKeyShown")} secret={secret} />}
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      <Status state={state} />
      {state.data && (
        <ul className="divide-y divide-slate-100">
          {state.data.map((k) => (
            <li key={k.id} className="flex flex-wrap items-center gap-3 py-2 text-sm">
              <div className="min-w-0 flex-1">
                <div className="font-medium">{k.name}</div>
                <div className="text-xs text-slate-500">
                  <span dir="ltr" className="font-mono">
                    {k.keyPrefix}…
                  </span>{" "}
                  · {t("intgKeyLastUsed")}: {k.lastUsedAt ? k.lastUsedAt.slice(0, 10) : t("intgKeyNever")}
                </div>
              </div>
              {k.revokedAt ? (
                <span className="text-xs text-slate-500">{t("intgKeyRevoked")}</span>
              ) : (
                <button className="btn-ghost" onClick={() => revoke(k.id)}>
                  {t("intgKeyRevoke")}
                </button>
              )}
            </li>
          ))}
          {state.data.length === 0 && <li className="py-3 text-slate-500">{t("intgKeyNone")}</li>}
        </ul>
      )}
    </section>
  );
}

function Deliveries({ orgId, hook }: { orgId: string; hook: WebhookView }) {
  const { t } = useI18n();
  const [refresh, setRefresh] = useState(0);
  const state = useRegister((o) => api.webhookDeliveries(o, hook.id), refresh);
  const [error, setError] = useState<string | null>(null);

  async function retry(d: WebhookDeliveryView) {
    setError(null);
    try {
      await api.retryDelivery(orgId, d.id);
      setRefresh((n) => n + 1);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="mt-3 overflow-x-auto rounded-lg bg-slate-50 p-3">
      <Status state={state} />
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      {state.data &&
        (state.data.length === 0 ? (
          <p className="text-sm text-slate-500">{t("intgHookNoDeliveries")}</p>
        ) : (
          <table className="w-full min-w-[520px] text-xs">
            <thead>
              <tr className="text-slate-500">
                <th className="py-1 text-start">{t("intgDeliveryEvent")}</th>
                <th className="text-start">{t("intgDeliveryStatus")}</th>
                <th className="text-end">{t("intgDeliveryAttempts")}</th>
                <th className="ps-3 text-start">{t("intgDeliveryResponse")}</th>
                <th className="text-start">{t("intgDeliveryWhen")}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {state.data.map((d) => (
                <tr key={d.id} className="border-t border-slate-200">
                  <td className="py-1 font-mono" dir="ltr">
                    {d.eventType}
                  </td>
                  <td>{t(`intgStatus${d.status}` as never)}</td>
                  <td className="text-end tabular-nums">{d.attempts}</td>
                  <td className="ps-3" title={d.lastError ?? undefined}>
                    {d.responseCode ?? d.lastError ?? "—"}
                  </td>
                  <td>{d.createdAt.slice(0, 16).replace("T", " ")}</td>
                  <td className="text-end">
                    {d.status === "FAILED" && (
                      <button className="btn-ghost h-7" onClick={() => retry(d)}>
                        {t("intgDeliveryRetry")}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ))}
    </div>
  );
}

function Webhooks({ orgId }: { orgId: string }) {
  const { t } = useI18n();
  const [refresh, setRefresh] = useState(0);
  const state = useRegister((o) => api.webhooks(o), refresh);
  const catalogue = useRegister((o) => api.webhookEvents(o));
  const [url, setUrl] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [secret, setSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  async function run(action: () => Promise<unknown>, after?: () => void) {
    setError(null);
    setNote(null);
    try {
      await action();
      after?.();
      setRefresh((n) => n + 1);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const create = (e: React.FormEvent) => {
    e.preventDefault();
    return run(
      async () => {
        const r = await api.createWebhook(orgId, { url: url.trim(), events: picked });
        setSecret(r.secret);
      },
      () => {
        setUrl("");
        setPicked([]);
      },
    );
  };

  return (
    <section className="card space-y-4" aria-labelledby="hooks-h">
      <div>
        <h2 id="hooks-h" className="text-base font-semibold">
          {t("intgHooksTitle")}
        </h2>
        <p className="text-sm text-slate-500">{t("intgHooksHint")}</p>
      </div>
      <form className="space-y-3" onSubmit={create}>
        <div>
          <label className="label" htmlFor="hook-url">
            {t("intgHookUrl")}
          </label>
          <input
            id="hook-url"
            className="input"
            dir="ltr"
            type="url"
            required
            placeholder="https://"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
        <fieldset>
          <legend className="label">{t("intgHookEvents")}</legend>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {(catalogue.data ?? []).map((ev) => (
              <label key={ev} className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={picked.includes(ev)}
                  onChange={(e) => setPicked((p) => (e.target.checked ? [...p, ev] : p.filter((x) => x !== ev)))}
                />
                <span dir="ltr" className="font-mono text-xs">
                  {ev}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <button className="btn" disabled={picked.length === 0}>
          {t("intgHookCreate")}
        </button>
      </form>
      {secret && <SecretBox label={t("intgHookSecretShown")} secret={secret} />}
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      {note && <p className="text-sm text-emerald-700">{note}</p>}
      <Status state={state} />
      {state.data && (
        <ul className="divide-y divide-slate-100">
          {state.data.map((h) => (
            <li key={h.id} className="py-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <div className="min-w-0 flex-1">
                  <div className="break-all font-mono text-xs" dir="ltr">
                    {h.url}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                    <span className={h.active ? "text-emerald-700" : "text-amber-700"}>
                      {h.active ? t("intgHookActive") : t("intgHookPaused")}
                    </span>
                    {h.events.map((ev) => (
                      <span key={ev} dir="ltr" className="rounded bg-slate-100 px-1.5 py-0.5 font-mono">
                        {ev}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  className="btn-ghost"
                  onClick={() =>
                    run(() =>
                      api.testWebhook(orgId, h.id).then(() => {
                        setNote(t("intgHookTestSent"));
                        setOpen(h.id);
                      }),
                    )
                  }
                >
                  {t("intgHookTest")}
                </button>
                <button className="btn-ghost" onClick={() => setOpen(open === h.id ? null : h.id)}>
                  {t("intgHookDeliveries")}
                </button>
                <button
                  className="btn-ghost"
                  onClick={() => run(() => api.updateWebhook(orgId, h.id, { active: !h.active }))}
                >
                  {h.active ? t("intgHookPause") : t("intgHookResume")}
                </button>
                <button
                  className="btn-ghost"
                  onClick={() => window.confirm(t("intgConfirmDelete")) && run(() => api.deleteWebhook(orgId, h.id))}
                >
                  {t("intgHookDelete")}
                </button>
              </div>
              {open === h.id && <Deliveries orgId={orgId} hook={h} />}
            </li>
          ))}
          {state.data.length === 0 && <li className="py-3 text-slate-500">{t("intgHookNone")}</li>}
        </ul>
      )}
    </section>
  );
}

export default function IntegrationsPage() {
  const { t } = useI18n();
  const state = useRegister(async (o) => o);
  return (
    <div className="space-y-6">
      <PageHeader title={t("intgTitle")} />
      <p className="text-sm text-slate-500">{t("intgHint")}</p>
      <Status state={state} />
      {state.data && (
        <>
          <ApiKeys orgId={state.data} />
          <Webhooks orgId={state.data} />
        </>
      )}
    </div>
  );
}
