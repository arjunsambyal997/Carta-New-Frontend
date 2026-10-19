"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { api, getSession, signOut } from "@/api";
import { useI18n, type Key } from "@/context/I18nContext";
import { Avatar } from "@/components/common/Avatar";
import { Icon, type IconName } from "@/components/common/Icon";
import { CompanySwitcher } from "@/components/layout/CompanySwitcher";
import { SearchPalette } from "@/components/layout/SearchPalette";
import { useSession } from "@/hooks/useSession";
import { useTableLabels } from "@/hooks/useTableLabels";

/** What a shareholder account sees: their own portal, votes, and account security. */
const HOLDER_GROUPS: { label: Key; items: { href: string; key: Key; icon: IconName }[] }[] = [
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
    ],
  },
];

type Role = "FOUNDER" | "CORPORATE_SECRETARY" | "BOARD_MEMBER" | "LEGAL_AUDITOR" | "SHAREHOLDER";
type NavItem = { href: string; key: Key; icon: IconName; roles?: Role[] };

/** Who may open each page: the same rules the server enforces, so nobody is shown a page that would only refuse them. */
const STAFF: Role[] = ["FOUNDER", "CORPORATE_SECRETARY"];
const READERS: Role[] = [...STAFF, "BOARD_MEMBER", "LEGAL_AUDITOR"];
const COMPLIANCE: Role[] = [...STAFF, "LEGAL_AUDITOR"];

const GROUPS: { label: Key; items: NavItem[] }[] = [
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
    ],
  },
];

/** Pages that are reachable signed out get a bare, centred layout without the sidebar. */
const BARE = ["/login", "/signup", "/forgot-password", "/reset-password", "/verify"];

function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  }, []);
  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("equigcc.theme", next);
    } catch {
      /* storage unavailable */
    }
    setTheme(next);
  };
  return { theme, toggle };
}

function Brand() {
  const { t } = useI18n();
  return (
    <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight text-slate-900">
      <span
        className="grid size-8 place-items-center rounded-lg text-sm font-bold text-white shadow-sm"
        style={{ background: "rgb(var(--btn))" }}
      >
        E
      </span>
      <span className="text-[17px]">{t("appName")}</span>
    </Link>
  );
}

function Toggles() {
  const { t, toggle: toggleLang, hijri, toggleHijri } = useI18n();
  const { theme, toggle } = useTheme();
  return (
    <>
      <button
        type="button"
        onClick={toggle}
        className="btn-ghost size-9 !p-0"
        aria-label={t("themeToggle")}
        title={t("themeToggle")}
      >
        <Icon name={theme === "dark" ? "sun" : "moon"} />
      </button>
      <button
        type="button"
        onClick={toggleHijri}
        aria-pressed={hijri}
        title={t("hijriToggle")}
        className={`btn-ghost h-9 ${hijri ? "!border-emerald-600 !text-emerald-800" : ""}`}
      >
        <span className="hidden sm:inline">{t("hijriShort")}</span>
        <span className="sm:hidden" aria-label={t("hijriToggle")}>
          H
        </span>
      </button>
      <button type="button" onClick={toggleLang} className="btn-ghost h-9" aria-label="Toggle language">
        <Icon name="globe" size={16} />
        <span className="max-sm:sr-only">{t("switchLang")}</span>
      </button>
    </>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const { t, name } = useI18n();
  const path = usePathname();
  const session = useSession();
  const [open, setOpen] = useState(false);
  const [org, setOrg] = useState<string | null>(null);
  const [who, setWho] = useState<{ email: string; role: string } | null>(null);
  const [pendingVotes, setPendingVotes] = useState(0);
  const [pendingApprovals, setPendingApprovals] = useState(0);

  useTableLabels();
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    const s = getSession();
    if (!s) return;
    api
      .organization(s.orgId)
      .then((o) => setOrg(name(o.legalNameEn, o.legalNameAr)))
      .catch(() => undefined);
    api
      .me()
      .then((m) => setWho({ email: m.email, role: m.role }))
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, t]);

  // Shareholders see how many open votes still wait for them; re-checked on every page change so it drops after voting.
  useEffect(() => {
    if (who?.role !== "SHAREHOLDER") return;
    api
      .portalSummary()
      .then((s) => setPendingVotes(s.openVotes.filter((v) => !v.voted).length))
      .catch(() => undefined);
  }, [who, path]);

  // Staff see how many register changes wait for a second person.
  useEffect(() => {
    const s = getSession();
    if (!s || !who || who.role === "SHAREHOLDER") return;
    api
      .approvals(s.orgId)
      .then((l) => setPendingApprovals(l.filter((c) => c.pending).length))
      .catch(() => undefined);
  }, [who, path]);

  if (BARE.some((p) => path === p || path.startsWith(p + "/"))) {
    return (
      <div
        className="flex min-h-dvh flex-col"
        style={{
          backgroundImage: "radial-gradient(60rem 28rem at 50% -8rem, rgb(var(--brand-100) / .65), transparent)",
        }}
      >
        <a href="#main" className="skip-link">
          {t("skipToContent")}
        </a>
        <header className="flex items-center justify-between px-4 py-4 sm:px-8">
          <Brand />
          <div className="flex items-center gap-2">
            <Toggles />
          </div>
        </header>
        <main
          id="main"
          tabIndex={-1}
          className="page mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-4 pb-16 pt-6 outline-none [&>*]:w-full [&>div:not([class*=max-w])]:max-w-md"
        >
          {children}
        </main>
      </div>
    );
  }

  const isHolder = who?.role === "SHAREHOLDER";
  const nav = (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4" aria-label="Main">
      {(isHolder
        ? HOLDER_GROUPS
        : GROUPS.map((g) => ({
            ...g,
            items: g.items.filter((n) => !n.roles || !who || n.roles.includes(who.role as Role)),
          })).filter((g) => g.items.length > 0)
      ).map((g) => (
        <div key={g.label}>
          <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{t(g.label)}</p>
          <ul className="space-y-0.5">
            {g.items.map((n) => {
              const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
              return (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                      active
                        ? "bg-emerald-50 font-medium text-emerald-800"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <Icon name={n.icon} className={active ? "text-emerald-700" : "text-slate-400"} />
                    {t(n.key)}
                    {n.href === "/approvals" && pendingApprovals > 0 && (
                      <span className="ms-auto rounded-full bg-amber-100 px-1.5 text-[11px] font-semibold tabular-nums text-amber-800">
                        {pendingApprovals}
                      </span>
                    )}
                    {isHolder && n.href === "/resolutions" && pendingVotes > 0 && (
                      <span
                        className="ms-auto rounded-full bg-amber-100 px-1.5 text-[11px] font-semibold tabular-nums text-amber-800"
                        aria-label={`${pendingVotes} ${t("portalVotes")}`}
                      >
                        {pendingVotes}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-dvh lg:ps-64">
      <a href="#main" className="skip-link">
        {t("skipToContent")}
      </a>
      {/* sidebar: fixed on desktop, drawer on small screens */}
      <aside
        className={`fixed inset-y-0 start-0 z-40 flex h-dvh w-[min(16rem,85vw)] flex-col border-e border-slate-200 bg-surface transition-transform duration-200 lg:w-64 lg:translate-x-0 rtl:lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full rtl:translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <Brand />
          <button
            type="button"
            className="btn-ghost size-8 !p-0 lg:hidden"
            onClick={() => setOpen(false)}
            aria-label={t("menuClose")}
          >
            <Icon name="close" size={16} />
          </button>
        </div>
        {nav}
        {who && (
          <div
            className="flex items-center gap-3 border-t border-slate-200 p-4"
            title={`${t("signedInAs")} ${who.email}`}
          >
            <Avatar name={who.email} size={36} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-800" dir="ltr">
                {who.email}
              </p>
              <p className="text-xs text-slate-500">{t(`role${who.role}` as Key)}</p>
            </div>
          </div>
        )}
      </aside>
      {open && (
        <button
          type="button"
          aria-label={t("menuClose")}
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-[1px] lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="flex min-h-dvh min-w-0 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-slate-200 bg-surface/85 px-3 backdrop-blur sm:h-16 sm:gap-3 sm:px-6 lg:px-8">
          <button
            type="button"
            className="btn-ghost size-9 !p-0 lg:hidden"
            onClick={() => setOpen(true)}
            aria-label={t("menuOpen")}
          >
            <Icon name="menu" />
          </button>
          <div className="min-w-0 flex-1">
            {session ? (
              <CompanySwitcher current={org} orgId={session.orgId} canAdd={!isHolder} />
            ) : (
              <p className="truncate text-sm font-medium text-slate-600">{org}</p>
            )}
          </div>
          {session && !isHolder && <SearchPalette />}
          <Toggles />
          {session ? (
            <button
              type="button"
              className="btn-ghost h-9"
              onClick={async () => {
                await signOut();
                window.location.assign("/login");
              }}
            >
              <Icon name="logout" size={16} />
              <span className="hidden sm:inline">{t("signOut")}</span>
            </button>
          ) : (
            session === null && (
              <Link href="/login" className="btn h-9">
                {t("signIn")}
              </Link>
            )
          )}
        </header>
        <main
          id="main"
          tabIndex={-1}
          className="page w-full flex-1 px-4 py-6 outline-none sm:px-6 sm:py-8 lg:px-8 2xl:px-12"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
