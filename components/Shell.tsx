"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { api, getSession, signOut } from "@/lib/api";
import { useI18n, type Key } from "@/lib/i18n";
import { Avatar } from "./Avatar";
import { Icon, type IconName } from "./Icon";
import { SearchPalette } from "./SearchPalette";
import { useSession } from "./useSession";

/** What a shareholder account sees: their own portal, votes, and account security. */
const HOLDER_GROUPS: { label: Key; items: { href: string; key: Key; icon: IconName }[] }[] = [
  { label: "groupOverview", items: [{ href: "/portal", key: "navPortal", icon: "portal" }, { href: "/resolutions", key: "navResolutions", icon: "resolutions" }] },
  { label: "groupAdmin", items: [{ href: "/security", key: "navSecurity", icon: "security" }, { href: "/password", key: "navPassword", icon: "password" }, { href: "/guide", key: "navGuide", icon: "guide" }] },
];

const GROUPS: { label: Key; items: { href: string; key: Key; icon: IconName }[] }[] = [
  {
    label: "groupOverview",
    items: [
      { href: "/", key: "navDashboard", icon: "dashboard" },
      { href: "/cap-table", key: "navCapTable", icon: "captable" },
      { href: "/ownership", key: "navOwnership", icon: "ownership" },
      { href: "/waterfall", key: "navWaterfall", icon: "waterfall" },
      { href: "/transfers", key: "navTransfers", icon: "transfer" },
      { href: "/options", key: "navOptions", icon: "options" },
      { href: "/rounds", key: "navRounds", icon: "rounds" },
    ],
  },
  {
    label: "groupGovernance",
    items: [
      { href: "/resolutions", key: "navResolutions", icon: "resolutions" },
      { href: "/succession", key: "navSuccession", icon: "succession" },
    ],
  },
  {
    label: "groupCompliance",
    items: [
      { href: "/ubo", key: "navUbo", icon: "ubo" },
      { href: "/certificates", key: "navCertificates", icon: "certificates" },
      { href: "/vault", key: "navVault", icon: "vault" },
      { href: "/audit", key: "navAudit", icon: "audit" },
    ],
  },
  {
    label: "groupAdmin",
    items: [
      { href: "/setup", key: "navSetup", icon: "setup" },
      { href: "/import", key: "navImport", icon: "import" },
      { href: "/members", key: "navMembers", icon: "members" },
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
      <span className="grid size-8 place-items-center rounded-lg text-sm font-bold text-white shadow-sm" style={{ background: "rgb(var(--btn))" }}>
        E
      </span>
      <span className="text-[17px]">{t("appName")}</span>
    </Link>
  );
}

function Toggles() {
  const { t, toggle: toggleLang } = useI18n();
  const { theme, toggle } = useTheme();
  return (
    <>
      <button type="button" onClick={toggle} className="btn-ghost size-9 !p-0" aria-label={t("themeToggle")} title={t("themeToggle")}>
        <Icon name={theme === "dark" ? "sun" : "moon"} />
      </button>
      <button type="button" onClick={toggleLang} className="btn-ghost h-9" aria-label="Toggle language">
        <Icon name="globe" size={16} />
        {t("switchLang")}
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

  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    const s = getSession();
    if (!s) return;
    api.organization(s.orgId).then((o) => setOrg(name(o.legalNameEn, o.legalNameAr))).catch(() => undefined);
    api.me().then((m) => setWho({ email: m.email, role: m.role })).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, t]);

  // Shareholders see how many open votes still wait for them; re-checked on every page change so it drops after voting.
  useEffect(() => {
    if (who?.role !== "SHAREHOLDER") return;
    api.portalSummary().then((s) => setPendingVotes(s.openVotes.filter((v) => !v.voted).length)).catch(() => undefined);
  }, [who, path]);

  if (BARE.some((p) => path === p || path.startsWith(p + "/"))) {
    return (
      <div className="flex min-h-screen flex-col" style={{ backgroundImage: "radial-gradient(60rem 28rem at 50% -8rem, rgb(var(--brand-100) / .65), transparent)" }}>
        <header className="flex items-center justify-between px-4 py-4 sm:px-8">
          <Brand />
          <div className="flex items-center gap-2">
            <Toggles />
          </div>
        </header>
        <main className="page mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-4 pb-16 pt-6 [&>*]:w-full [&>div:not([class*=max-w])]:max-w-md">{children}</main>
      </div>
    );
  }

  const isHolder = who?.role === "SHAREHOLDER";
  const nav = (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4" aria-label="Main">
      {(isHolder ? HOLDER_GROUPS : GROUPS).map((g) => (
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
                      active ? "bg-emerald-50 font-medium text-emerald-800" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <Icon name={n.icon} className={active ? "text-emerald-700" : "text-slate-400"} />
                    {t(n.key)}
                    {isHolder && n.href === "/resolutions" && pendingVotes > 0 && (
                      <span className="ms-auto rounded-full bg-amber-100 px-1.5 text-[11px] font-semibold tabular-nums text-amber-800" aria-label={`${pendingVotes} ${t("portalVotes")}`}>{pendingVotes}</span>
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
    <div className="min-h-screen lg:ps-64">
      {/* sidebar: fixed on desktop, drawer on small screens */}
      <aside
        className={`fixed inset-y-0 start-0 z-40 flex w-64 flex-col border-e border-slate-200 bg-surface transition-transform duration-200 lg:translate-x-0 rtl:lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full rtl:translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <Brand />
          <button type="button" className="btn-ghost size-8 !p-0 lg:hidden" onClick={() => setOpen(false)} aria-label={t("menuClose")}>
            <Icon name="close" size={16} />
          </button>
        </div>
        {nav}
        {who && (
          <div className="flex items-center gap-3 border-t border-slate-200 p-4" title={`${t("signedInAs")} ${who.email}`}>
            <Avatar name={who.email} size={36} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-800" dir="ltr">{who.email}</p>
              <p className="text-xs text-slate-500">{t(`role${who.role}` as Key)}</p>
            </div>
          </div>
        )}
      </aside>
      {open && <button type="button" aria-label={t("menuClose")} className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-[1px] lg:hidden" onClick={() => setOpen(false)} />}

      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-surface/85 px-4 backdrop-blur sm:px-8">
          <button type="button" className="btn-ghost size-9 !p-0 lg:hidden" onClick={() => setOpen(true)} aria-label={t("menuOpen")}>
            <Icon name="menu" />
          </button>
          <p className="min-w-0 flex-1 truncate text-sm font-medium text-slate-600">{org}</p>
          {session && !isHolder && <SearchPalette />}
          <Toggles />
          {session ? (
            <button type="button" className="btn-ghost h-9" onClick={async () => { await signOut(); window.location.assign("/login"); }}>
              <Icon name="logout" size={16} />
              <span className="hidden sm:inline">{t("signOut")}</span>
            </button>
          ) : (
            session === null && <Link href="/login" className="btn h-9">{t("signIn")}</Link>
          )}
        </header>
        <main className="page mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
