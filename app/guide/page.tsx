"use client";

import Link from "next/link";
import { Icon } from "@/components/Icon";
import { PageHeader } from "@/components/PageHeader";
import { useMe } from "@/components/useMe";
import { useI18n, type Key } from "@/lib/i18n";

type Step = { href: string; title: Key; body: Key };

const SECTIONS: { title: Key; steps: Step[] }[] = [
  {
    title: "guideStart",
    steps: [
      { href: "/security", title: "guide2faT", body: "guide2faB" },
      { href: "/setup", title: "guideClassT", body: "guideClassB" },
      { href: "/import", title: "guideHoldersT", body: "guideHoldersB" },
      { href: "/certificates/new", title: "guideIssueT", body: "guideIssueB" },
      { href: "/members", title: "guideMembersT", body: "guideMembersB" },
    ],
  },
  {
    title: "guideDaily",
    steps: [
      { href: "/cap-table", title: "guideCapT", body: "guideCapB" },
      { href: "/transfers", title: "guideTransferT", body: "guideTransferB" },
      { href: "/options", title: "guideOptionsT", body: "guideOptionsB" },
      { href: "/rounds", title: "guideRoundT", body: "guideRoundB" },
      { href: "/waterfall", title: "guideExitT", body: "guideExitB" },
    ],
  },
  {
    title: "groupGovernance",
    steps: [
      { href: "/resolutions", title: "guideResT", body: "guideResB" },
      { href: "/resolutions", title: "guideVoteT", body: "guideVoteB" },
      { href: "/approvals", title: "guideApprT", body: "guideApprB" },
      { href: "/succession", title: "guideSuccT", body: "guideSuccB" },
    ],
  },
  {
    title: "groupCompliance",
    steps: [
      { href: "/ubo", title: "guideUboT", body: "guideUboB" },
      { href: "/vault", title: "guideVaultT", body: "guideVaultB" },
      { href: "/audit", title: "guideAuditT", body: "guideAuditB" },
    ],
  },
];

const HOLDER: { title: Key; steps: Step[] }[] = [
  {
    title: "navPortal",
    steps: [
      { href: "/security", title: "guide2faT", body: "guide2faB" },
      { href: "/portal", title: "guideHoldingsT", body: "guideHoldingsB" },
      { href: "/portal", title: "guideHolderVoteT", body: "guideHolderVoteB" },
      { href: "/portal", title: "guideHolderCertT", body: "guideHolderCertB" },
    ],
  },
];

export default function GuidePage() {
  const { t } = useI18n();
  const me = useMe();
  const sections = me?.role === "SHAREHOLDER" ? HOLDER : SECTIONS;
  let n = 0;

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title={t("navGuide")} subtitle={t("guideIntro")} />
      {sections.map((s) => (
        <section key={s.title} className="card space-y-1">
          <h2 className="mb-2 text-sm font-semibold">{t(s.title)}</h2>
          <ol>
            {s.steps.map((st) => {
              n += 1;
              return (
                <li key={st.title} className="flex gap-3 border-b border-slate-100 py-3 last:border-0">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-emerald-50 text-xs font-semibold tabular-nums text-emerald-800">{n}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{t(st.title)}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-slate-600">{t(st.body)}</p>
                  </div>
                  <Link href={st.href} className="btn-ghost h-8 shrink-0 self-center text-xs">
                    {t("guideOpen")}
                    <Icon name="arrow" size={14} className="rtl:rotate-180" />
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
      <p className="text-sm text-slate-500">{t("guideConfirmNote")}</p>
    </div>
  );
}
