import type { CapTable, Organization, OwnershipLink } from "@/api/types";

export interface TreeNode {
  /** Unique per position in the tree: the same holder can sit under several parents. */
  id: string;
  label: string;
  kind: "company" | "holder" | "owner";
  /** Share of the parent this node holds (percent); null for the company. */
  pct: number | null;
  sub?: string;
  children: TreeNode[];
}

export interface Placed {
  node: TreeNode;
  parent: Placed | null;
  x: number;
  y: number;
}

export const NODE_W = 232;
export const NODE_H = 68;
export const GAP_X = 96;
export const GAP_Y = 18;

/**
 * Company at the root, its holders below it, and under every holder the owners that hold it through ownership links,
 * to any depth. A holder already on the path above is not expanded again, so a circular holding cannot loop forever.
 */
export function buildTree(
  org: Organization,
  table: CapTable,
  links: OwnershipLink[],
  name: (en: string, ar?: string | null) => string,
  companyLabel: string,
): TreeNode {
  const byOwned = new Map<string, OwnershipLink[]>();
  for (const l of links) byOwned.set(l.ownedId, [...(byOwned.get(l.ownedId) ?? []), l]);

  const owners = (id: string, path: string, seen: Set<string>): TreeNode[] =>
    (byOwned.get(id) ?? [])
      .filter((l) => !seen.has(l.ownerId))
      .map((l) => ({
        id: `${path}/${l.ownerId}`,
        label: name(l.ownerNameEn, l.ownerNameAr),
        kind: "owner" as const,
        pct: l.economicPct,
        children: owners(l.ownerId, `${path}/${l.ownerId}`, new Set([...seen, l.ownerId])),
      }));

  return {
    id: "root",
    label: name(org.legalNameEn, org.legalNameAr),
    kind: "company",
    pct: null,
    sub: `${companyLabel} · ${org.commercialLicenseNo}`,
    children: table.holders
      .filter((h) => h.fullyDilutedOwnershipPct > 0 || (byOwned.get(h.shareholderId) ?? []).length > 0)
      .sort((a, b) => b.fullyDilutedOwnershipPct - a.fullyDilutedOwnershipPct)
      .map((h) => ({
        id: `root/${h.shareholderId}`,
        label: name(h.nameEn, h.nameAr),
        kind: "holder" as const,
        pct: h.fullyDilutedOwnershipPct,
        children: owners(h.shareholderId, `root/${h.shareholderId}`, new Set([h.shareholderId])),
      })),
  };
}

/** Tidy left-to-right layout: leaves stack top to bottom, a parent is centred on its children. Collapsed nodes count as leaves. */
export function layoutTree(root: TreeNode, collapsed: Set<string>) {
  const placed: Placed[] = [];
  let cursor = 0;
  const walk = (node: TreeNode, depth: number, parent: Placed | null): Placed => {
    const me: Placed = { node, parent, x: depth * (NODE_W + GAP_X), y: 0 };
    placed.push(me);
    const kids = collapsed.has(node.id) ? [] : node.children.map((c) => walk(c, depth + 1, me));
    if (kids.length === 0) {
      me.y = cursor;
      cursor += NODE_H + GAP_Y;
    } else {
      me.y = (kids[0].y + kids[kids.length - 1].y) / 2;
    }
    return me;
  };
  walk(root, 0, null);
  const width = Math.max(...placed.map((p) => p.x)) + NODE_W;
  return { placed, width, height: Math.max(cursor - GAP_Y, NODE_H) };
}

/** Ids from a node up to the root: the path to highlight on hover. */
export function pathToRoot(p: Placed | undefined): Set<string> {
  const ids = new Set<string>();
  for (let n = p ?? null; n; n = n.parent) ids.add(n.node.id);
  return ids;
}
