"use client";

import { m } from "motion/react";
import type {
  AuditEntry,
  CapTable,
  Certificate,
  ComplianceItem,
  Organization,
  PendingChange,
  Resolution,
} from "@/api/types";
import { stagger } from "@/designSystem/motion";
import { ActivityFeed } from "@/features/dashboard/widgets/ActivityFeed";
import { Certificates } from "@/features/dashboard/widgets/Certificates";
import { ClassMix } from "@/features/dashboard/widgets/ClassMix";
import { EconVsVoting } from "@/features/dashboard/widgets/EconVsVoting";
import { KpiBand } from "@/features/dashboard/widgets/KpiBand";
import { NeedsAttention } from "@/features/dashboard/widgets/NeedsAttention";
import { Onboarding, type Setup } from "@/features/dashboard/widgets/Onboarding";
import { OwnershipDonut } from "@/features/dashboard/widgets/OwnershipDonut";
import { Resolutions } from "@/features/dashboard/widgets/Resolutions";

export type { Setup };

/**
 * The executive overview as a bento grid: 6 columns on tablets, 12 on wide screens, one column on phones.
 * Rows, top to bottom: headline numbers; what needs a person beside who owns the company; control versus ownership
 * beside resolutions; then classes, certificates and activity.
 */
export function Dashboard({
  org,
  table,
  prior,
  resolutions,
  certificates,
  setup,
  approvals,
  filings,
  audit,
}: {
  org: Organization;
  table: CapTable;
  /** The register 30 days ago, for the change badges. `null` when it could not be loaded. */
  prior?: CapTable | null;
  resolutions: Resolution[] | null;
  certificates: Certificate[] | null;
  setup: Setup;
  approvals: PendingChange[] | null;
  filings: ComplianceItem[] | null;
  audit: AuditEntry[] | null;
}) {
  // Without the audit trail (roles that cannot read it) the last row has two tiles, so they share its width.
  const last = audit === null ? "md:col-span-3 xl:col-span-6" : "md:col-span-3 xl:col-span-4";
  return (
    <m.div
      variants={stagger}
      initial="hidden"
      animate="shown"
      className="grid grid-cols-1 gap-4 md:grid-cols-6 xl:grid-cols-12 2xl:gap-5"
    >
      <Onboarding
        org={org}
        setup={setup}
        resolutions={resolutions}
        certificates={certificates}
        className="md:col-span-6 xl:col-span-12"
      />
      <KpiBand table={table} prior={prior} resolutions={resolutions} />
      <NeedsAttention
        approvals={approvals}
        resolutions={resolutions}
        filings={filings}
        className="md:col-span-6 xl:col-span-7"
      />
      <OwnershipDonut table={table} className="md:col-span-6 xl:col-span-5" />
      <EconVsVoting table={table} className="md:col-span-6 xl:col-span-8" />
      <Resolutions list={resolutions} className="md:col-span-6 xl:col-span-4" />
      <ClassMix table={table} className={last} />
      <Certificates list={certificates} className={last} />
      <ActivityFeed entries={audit} className="md:col-span-6 xl:col-span-4" />
    </m.div>
  );
}
