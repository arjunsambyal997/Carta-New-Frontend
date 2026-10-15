"use client";

import { useI18n } from "@/lib/i18n";
import type { CapTable, Organization, OwnershipLink } from "@/lib/types";

const W = 960;
const ROOT_Y = 20;
const ROOT_H = 54;
const LEAF_Y = 190;
const LEAF_H = 64;
const GAP = 12;

/**
 * SVG ownership tree: the company at the top, one node per holder below, node width proportional to
 * fully diluted ownership. Mirrors horizontally in RTL so the largest holder sits on the reading-start side.
 */
export function OwnershipTree({ table, org, links = [] }: { table: CapTable; org: Organization; links?: OwnershipLink[] }) {
  const { t, dir, num, name } = useI18n();
  const holders = table.holders;
  const rtl = dir === "rtl";
  const usable = W - GAP * (holders.length + 1);
  const minW = 90;
  const total = holders.reduce((s, h) => s + h.fullyDilutedShares, 0) || 1;

  let cursor = GAP;
  const nodes = holders.map((h) => {
    const w = Math.max(minW, (h.fullyDilutedShares / total) * usable);
    const x = cursor;
    cursor += w + GAP;
    return { h, x, w };
  });
  const contentW = Math.max(W, cursor);
  const mx = (x: number, w = 0) => (rtl ? contentW - x - w : x);
  const OWNER_Y = LEAF_Y + LEAF_H + 36;
  const OWNER_H = 34;
  const ownersOf = (id: string) => links.filter((l) => l.ownedId === id);
  const maxOwners = Math.max(0, ...nodes.map(({ h }) => ownersOf(h.shareholderId).length));
  const height = OWNER_Y + (maxOwners ? maxOwners * (OWNER_H + 8) : -16) + 20;
  const rootW = 300;
  const rootX = (contentW - rootW) / 2;

  return (
    <div className="card overflow-x-auto">
      <svg viewBox={`0 0 ${contentW} ${height}`} className="w-full min-w-[640px]" role="img" aria-label={t("navOwnership")}>
        <rect x={rootX} y={ROOT_Y} width={rootW} height={ROOT_H} rx={8} className="fill-emerald-800" />
        <text x={rootX + rootW / 2} y={ROOT_Y + 23} textAnchor="middle" className="fill-white text-[15px] font-semibold">
          {name(org.legalNameEn, org.legalNameAr)}
        </text>
        <text x={rootX + rootW / 2} y={ROOT_Y + 42} textAnchor="middle" className="fill-emerald-100 text-[11px]">
          {org.jurisdiction.replace("_", " ")} · {org.commercialLicenseNo}
        </text>

        {nodes.map(({ h, x, w }) => {
          const nx = mx(x, w);
          const cx = nx + w / 2;
          const pct = h.fullyDilutedOwnershipPct;
          return (
            <g key={h.shareholderId}>
              <path
                d={`M ${rootX + rootW / 2} ${ROOT_Y + ROOT_H} C ${rootX + rootW / 2} ${LEAF_Y - 50}, ${cx} ${LEAF_Y - 60}, ${cx} ${LEAF_Y}`}
                className="fill-none stroke-slate-300"
                strokeWidth={Math.max(1.5, pct / 12)}
              />
              <rect x={nx} y={LEAF_Y} width={w} height={LEAF_H} rx={8} className="fill-white stroke-emerald-600" strokeWidth={1.5} />
              <text x={cx} y={LEAF_Y + 24} textAnchor="middle" className="fill-slate-800 text-[12px] font-medium">
                {truncate(name(h.nameEn, h.nameAr), Math.floor(w / 7))}
              </text>
              <text x={cx} y={LEAF_Y + 44} textAnchor="middle" className="fill-emerald-700 text-[13px] font-semibold">
                {num(pct, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}%
              </text>
              {ownersOf(h.shareholderId).map((l, i) => {
                const y = OWNER_Y + i * (OWNER_H + 8);
                return (
                  <g key={l.ownerId}>
                    <path d={`M ${cx} ${i === 0 ? LEAF_Y + LEAF_H : y - 8} L ${cx} ${y}`} className="fill-none stroke-slate-300" strokeWidth={1.5} />
                    <rect x={nx} y={y} width={w} height={OWNER_H} rx={6} className="fill-slate-50 stroke-slate-300" />
                    <text x={cx} y={y + 14} textAnchor="middle" className="fill-slate-700 text-[11px]">
                      {truncate(name(l.ownerNameEn, l.ownerNameAr), Math.floor(w / 6.5))}
                    </text>
                    <text x={cx} y={y + 28} textAnchor="middle" className="fill-slate-500 text-[11px]">
                      {num(l.economicPct, { maximumFractionDigits: 2 })}%
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
      <p className="mt-3 text-xs text-slate-500">{t("ownershipHint")}</p>
    </div>
  );
}

function truncate(s: string, max: number) {
  return s.length > max ? `${s.slice(0, Math.max(3, max - 1))}…` : s;
}
