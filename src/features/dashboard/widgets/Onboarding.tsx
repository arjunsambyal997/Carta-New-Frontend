"use client";

import Link from "next/link";
import type { Certificate, Organization, Resolution } from "@/api/types";
import { Icon } from "@/components/common/Icon";
import { useI18n, type Key } from "@/context/I18nContext";
import { checklistProgress, checklistSteps, type ChecklistStep } from "@/features/dashboard/checklist";
import { Tile } from "@/features/dashboard/widgets/Tile";

export interface Setup {
  classes: number;
  holders: number;
  members: number;
}

const STEP_KEYS: Record<ChecklistStep["key"], [Key, Key]> = {
  company: ["obCompany", "obCompanyHint"],
  logo: ["obLogo", "obLogoHint"],
  classes: ["obClass", "obClassHint"],
  holders: ["obHolders", "obHoldersHint"],
  team: ["obTeam", "obTeamHint"],
  certificate: ["obCert", "obCertHint"],
  resolution: ["obRes", "obResHint"],
};

/** Guided first-run checklist with a progress bar; goes away once the required steps are done. */
export function Onboarding({
  org,
  setup,
  resolutions,
  certificates,
  className = "",
}: {
  org: Organization;
  setup: Setup;
  resolutions: Resolution[] | null;
  certificates: Certificate[] | null;
  className?: string;
}) {
  const { t, num } = useI18n();
  const steps = checklistSteps({
    hasLogo: !!org.hasLogo,
    classes: setup.classes,
    holders: setup.holders,
    members: setup.members,
    certificates: (certificates ?? []).length,
    resolutions: (resolutions ?? []).length,
  });
  const progress = checklistProgress(steps);
  if (progress.complete) return null;
  return (
    <Tile
      title={t("obTitle")}
      hint={t("obSubtitle")}
      className={className}
      action={<span className="chip num bg-emerald-50 text-emerald-800">{num(progress.pct)}%</span>}
    >
      <div
        className="mb-4 h-1.5 overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress.pct}
        aria-label={t("obTitle")}
      >
        <div
          className="h-full rounded-full bg-emerald-600 transition-[width] duration-500"
          style={{ width: `${progress.pct}%` }}
        />
      </div>
      <ol className="grid gap-1 sm:grid-cols-2 xl:grid-cols-3">
        {steps.map((st) => {
          const [title, hint] = STEP_KEYS[st.key];
          return (
            <li key={st.key}>
              <Link
                href={st.href}
                className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-slate-50"
              >
                <span
                  className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border ${st.done ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300"}`}
                >
                  {st.done && <Icon name="check" size={12} />}
                </span>
                <span className="min-w-0">
                  <span className={`block text-sm font-medium ${st.done ? "text-slate-400 line-through" : ""}`}>
                    {t(title)}
                    {st.optional && !st.done && (
                      <span className="ms-2 text-[11px] font-normal text-slate-400">{t("obOptional")}</span>
                    )}
                  </span>
                  <span className="block text-xs text-slate-500">{t(hint)}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </Tile>
  );
}
