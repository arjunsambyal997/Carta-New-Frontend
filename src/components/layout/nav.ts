import type { Key } from "@/context/I18nContext";
import type { IconName } from "@/components/common/Icon";

/** What a shareholder account sees: their own portal, votes, and account security. */
export const HOLDER_GROUPS: { label: Key; items: { href: string; key: Key; icon: IconName }[] }[] = [
  {
    label: "groupOverview",
    items: [
      { href: "/portal", key: "navPortal", icon: "portal" },
      { href: "/resolutions", key: "navResolutions", icon: "resolutions" },
    ],
  },
  {
    label: "groupAdmin",
    items: [
      { href: "/security", key: "navSecurity", icon: "security" },
      { href: "/password", key: "navPassword", icon: "password" },
      { href: "/guide", key: "navGuide", icon: "guide" },
      { href: "/changelog", key: "navChangelog", icon: "guide" },
    ],
  },
];

export type Role = "FOUNDER" | "CORPORATE_SECRETARY" | "BOARD_MEMBER" | "LEGAL_AUDITOR" | "SHAREHOLDER";
export type NavItem = { href: string; key: Key; icon: IconName; roles?: Role[] };

/** Who may open each page: the same rules the server enforces, so nobody is shown a page that would only refuse them. */
const STAFF: Role[] = ["FOUNDER", "CORPORATE_SECRETARY"];
const READERS: Role[] = [...STAFF, "BOARD_MEMBER", "LEGAL_AUDITOR"];
const COMPLIANCE: Role[] = [...STAFF, "LEGAL_AUDITOR"];

export const GROUPS: { label: Key; items: NavItem[] }[] = [
  {
    label: "groupOverview",
    items: [
      { href: "/", key: "navDashboard", icon: "dashboard", roles: READERS },
      { href: "/cap-table", key: "navCapTable", icon: "captable", roles: READERS },
      { href: "/ownership", key: "navOwnership", icon: "ownership", roles: READERS },
      { href: "/waterfall", key: "navWaterfall", icon: "waterfall", roles: READERS },
      { href: "/transfers", key: "navTransfers", icon: "transfer", roles: STAFF },
      { href: "/options", key: "navOptions", icon: "options", roles: READERS },
      { href: "/rounds", key: "navRounds", icon: "rounds", roles: READERS },
      { href: "/analytics", key: "navAnalytics", icon: "analytics", roles: READERS },
    ],
  },
  {
    label: "groupGovernance",
    items: [
      { href: "/resolutions", key: "navResolutions", icon: "resolutions", roles: READERS },
      { href: "/approvals", key: "navApprovals", icon: "approvals", roles: READERS },
      { href: "/succession", key: "navSuccession", icon: "succession", roles: READERS },
    ],
  },
  {
    label: "groupCompliance",
    items: [
      { href: "/compliance", key: "navCompliance", icon: "alert", roles: COMPLIANCE },
      { href: "/ubo", key: "navUbo", icon: "ubo", roles: COMPLIANCE },
      { href: "/certificates", key: "navCertificates", icon: "certificates", roles: READERS },
      { href: "/vault", key: "navVault", icon: "vault", roles: READERS },
      { href: "/audit", key: "navAudit", icon: "audit", roles: COMPLIANCE },
    ],
  },
  {
    label: "groupAdmin",
    items: [
      { href: "/setup", key: "navSetup", icon: "setup", roles: STAFF },
      { href: "/import", key: "navImport", icon: "import", roles: STAFF },
      { href: "/members", key: "navMembers", icon: "members", roles: ["FOUNDER"] },
      { href: "/integrations", key: "navIntegrations", icon: "plug", roles: ["FOUNDER"] },
      { href: "/security", key: "navSecurity", icon: "security" },
      { href: "/password", key: "navPassword", icon: "password" },
      { href: "/guide", key: "navGuide", icon: "guide" },
      { href: "/changelog", key: "navChangelog", icon: "guide" },
    ],
  },
];

/**
 * Whether this role may open the page at this path. Pages outside the nav (settings, portal links, ...) are left to the server.
 * Shareholder-portal logins only get their own pages; "/" shows them their holdings.
 */
export function canOpen(path: string, role: Role): boolean {
  const match = (href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(href + "/"));
  if (role === "SHAREHOLDER") {
    const own = path === "/" || HOLDER_GROUPS.some((g) => g.items.some((i) => match(i.href)));
    return own || !GROUPS.some((g) => g.items.some((i) => match(i.href)));
  }
  const item = GROUPS.flatMap((g) => g.items).find((i) => match(i.href));
  return !item?.roles || item.roles.includes(role);
}
