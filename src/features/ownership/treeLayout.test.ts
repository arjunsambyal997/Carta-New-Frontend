import { describe, expect, it } from "vitest";
import { NODE_H, GAP_Y, buildTree, layoutTree, pathToRoot } from "@/features/ownership/treeLayout";
import type { CapTable, Organization, OwnershipLink } from "@/api/types";

const name = (en: string) => en;
const org = { legalNameEn: "Acme", legalNameAr: null, commercialLicenseNo: "L-1" } as Organization;
const holder = (id: string, pct: number) => ({
  shareholderId: id,
  nameEn: id,
  nameAr: null,
  fullyDilutedOwnershipPct: pct,
});
const table = { holders: [holder("A", 60), holder("B", 40)] } as unknown as CapTable;
const link = (owner: string, owned: string, pct: number) =>
  ({ ownerId: owner, ownerNameEn: owner, ownerNameAr: null, ownedId: owned, economicPct: pct }) as OwnershipLink;

describe("buildTree", () => {
  it("puts holders under the company, biggest first, and owners under their holding", () => {
    const tree = buildTree(org, table, [link("X", "A", 70), link("Y", "X", 100)], name, "Company");
    expect(tree.children.map((c) => c.label)).toEqual(["A", "B"]);
    expect(tree.children[0].children[0].label).toBe("X");
    expect(tree.children[0].children[0].children[0].label).toBe("Y");
  });

  it("does not loop on a circular holding", () => {
    const tree = buildTree(org, table, [link("B", "A", 10), link("A", "B", 10)], name, "Company");
    expect(tree.children[0].children[0].label).toBe("B");
    expect(tree.children[0].children[0].children).toEqual([]);
  });
});

describe("layoutTree", () => {
  const tree = buildTree(org, table, [link("X", "A", 70), link("Z", "A", 30)], name, "Company");

  it("stacks leaves and centres a parent on its children", () => {
    const { placed } = layoutTree(tree, new Set());
    const at = (label: string) => placed.find((p) => p.node.label === label)!;
    expect(at("Z").y - at("X").y).toBe(NODE_H + GAP_Y);
    expect(at("A").y).toBe((at("X").y + at("Z").y) / 2);
  });

  it("treats a collapsed node as a leaf", () => {
    const { placed } = layoutTree(tree, new Set([tree.children[0].id]));
    expect(placed.map((p) => p.node.label)).toEqual(["Acme", "A", "B"]);
  });

  it("traces a node's path up to the company", () => {
    const { placed } = layoutTree(tree, new Set());
    const x = placed.find((p) => p.node.label === "X");
    expect([...pathToRoot(x)]).toEqual([x!.node.id, tree.children[0].id, "root"]);
  });
});
