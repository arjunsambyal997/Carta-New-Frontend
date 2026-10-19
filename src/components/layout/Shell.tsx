"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { api, getSession } from "@/api";
import { useI18n, type Key } from "@/context/I18nContext";
import { SijillMark, SijillWordmark } from "@/components/brand/SijillLogo";
import { Icon, type IconName } from "@/components/common/Icon";
import { CompanySwitcher } from "@/components/layout/CompanySwitcher";
import { MaintenanceBanner } from "@/components/layout/MaintenanceBanner";
import { SearchPalette } from "@/components/layout/SearchPalette";
import { GROUPS, HOLDER_GROUPS, type Role } from "@/components/layout/nav";
import { ProfileMenu, ToggleGroup } from "@/components/layout/Toolbar";
import { LOGO_CHANGED } from "@/hooks/useCompanyLogo";
import { useSession } from "@/hooks/useSession";
import { useTableLabels } from "@/hooks/useTableLabels";

/** Pages that are reachable signed out get a bare, centred layout without the sidebar. */
const BARE = ["/login", "/signup", "/forgot-password", "/reset-password", "/verify"];

function Brand() {
  const { t } = useI18n();
  return (
    <Link href="/" className="rounded-lg" aria-label={t("appName")}>
      <SijillWordmark name={t("appName")} size={32} />
    </Link>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const { t, name } = useI18n();
  const path = usePathname();
  const session = useSession();
  const [open, setOpen] = useState(false);
  const [rail, setRail] = useState(false);
  const [org, setOrg] = useState<string | null>(null);
  const [logoVersion, setLogoVersion] = useState<string | null>(null);
  const [logoTick, setLogoTick] = useState(0);
  const [closed, setClosed] = useState<string[]>([]);
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
      .then((o) => {
        setOrg(name(o.legalNameEn, o.legalNameAr));
        setLogoVersion(o.hasLogo ? (o.logoUpdatedAt ?? "1") : null);
      })
      .catch(() => undefined);
    api
      .me()
      .then((m) => setWho({ email: m.email, role: m.role }))
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, t, logoTick]);

  useEffect(() => {
    const bump = () => setLogoTick((n) => n + 1);
    window.addEventListener(LOGO_CHANGED, bump);
    return () => window.removeEventListener(LOGO_CHANGED, bump);
  }, []);
  useEffect(() => {
    try {
      setRail(localStorage.getItem("equigcc.sidebar") === "rail");
    } catch {
      /* storage unavailable */
    }
  }, []);
  const toggleRail = () =>
    setRail((r) => {
      try {
        localStorage.setItem("equigcc.sidebar", r ? "full" : "rail");
      } catch {
        /* ignore */
      }
      return !r;
    });
  useEffect(() => {
    try {
      setClosed(JSON.parse(localStorage.getItem("equigcc.navClosed") ?? "[]"));
    } catch {
      /* storage unavailable */
    }
  }, []);
  const toggleGroup = (label: string) =>
    setClosed((c) => {
      const next = c.includes(label) ? c.filter((x) => x !== label) : [...c, label];
      try {
        localStorage.setItem("equigcc.navClosed", JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });

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
        <MaintenanceBanner />
        <header className="flex items-center justify-between px-4 py-4 sm:px-8">
          <Brand />
          <div className="flex items-center gap-2">
            <ToggleGroup />
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
  const groups = isHolder
    ? HOLDER_GROUPS
    : GROUPS.map((g) => ({
        ...g,
        items: g.items.filter((n) => !n.roles || !who || n.roles.includes(who.role as Role)),
      })).filter((g) => g.items.length > 0);
  const isActive = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  const nav = (
    <nav className={`flex-1 space-y-4 overflow-y-auto py-3 ${rail ? "px-2 max-lg:px-3" : "px-3"}`} aria-label="Main">
      {groups.map((g, gi) => {
        const hasActive = g.items.some((n) => isActive(n.href));
        const collapsed = closed.includes(g.label) && !hasActive;
        return (
          <div key={g.label}>
            <button
              type="button"
              onClick={() => toggleGroup(g.label)}
              aria-expanded={!collapsed}
              className={`mb-1 flex w-full items-center justify-between rounded-md px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 transition-colors hover:text-slate-600 ${rail ? "lg:hidden" : ""}`}
            >
              {t(g.label)}
              <Icon
                name="chevron"
                size={12}
                className={`transition-transform ${collapsed ? "-rotate-90 rtl:rotate-90" : ""}`}
              />
            </button>
            {rail && gi > 0 && <div className="mx-3 mb-2 hidden border-t border-slate-200 lg:block" />}
            {(!collapsed || rail) && (
              <ul className="space-y-0.5">
                {g.items.map((n) => {
                  const active = isActive(n.href);
                  const badge =
                    n.href === "/approvals"
                      ? pendingApprovals
                      : isHolder && n.href === "/resolutions"
                        ? pendingVotes
                        : 0;
                  return (
                    <li key={n.href}>
                      <Link
                        href={n.href}
                        aria-current={active ? "page" : undefined}
                        title={rail ? t(n.key) : undefined}
                        className={`group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all duration-150 ${
                          rail ? "lg:justify-center lg:px-0" : ""
                        } ${
                          active
                            ? "bg-emerald-600/10 font-medium text-emerald-800 ring-1 ring-inset ring-emerald-600/15"
                            : "text-slate-600 hover:bg-slate-900/[0.04] hover:text-slate-900"
                        }`}
                      >
                        <Icon
                          name={n.icon}
                          className={`shrink-0 transition-colors ${active ? "text-emerald-700" : "text-slate-400 group-hover:text-slate-600"}`}
                        />
                        <span className={rail ? "lg:sr-only" : ""}>{t(n.key)}</span>
                        {badge > 0 && (
                          <span
                            className={`rounded-full bg-amber-100 px-1.5 text-[11px] font-semibold tabular-nums text-amber-800 ${
                              rail ? "ms-auto lg:absolute lg:end-1 lg:top-0.5 lg:ms-0 lg:px-1 lg:text-[9px]" : "ms-auto"
                            }`}
                            aria-label={`${badge} ${t(isHolder ? "portalVotes" : "navApprovals")}`}
                          >
                            {badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </nav>
  );
  const quick: { href: string; key: Key; icon: IconName }[] = isHolder
    ? [
        { href: "/portal", key: "navPortal", icon: "portal" },
        { href: "/resolutions", key: "navResolutions", icon: "resolutions" },
      ]
    : [
        { href: "/", key: "navDashboard", icon: "dashboard" },
        { href: "/cap-table", key: "navCapTable", icon: "captable" },
        { href: "/resolutions", key: "navResolutions", icon: "resolutions" },
      ];

  return (
    <div className={`min-h-dvh transition-[padding] duration-200 ${rail ? "lg:ps-[4.5rem]" : "lg:ps-64"}`}>
      <a href="#main" className="skip-link">
        {t("skipToContent")}
      </a>
      {/* sidebar: fixed on desktop, drawer on small screens */}
      <aside
        className={`fixed inset-y-0 start-0 z-40 flex h-dvh w-[min(16rem,85vw)] flex-col border-e border-slate-200/80 bg-surface transition-[transform,width] duration-200 lg:translate-x-0 rtl:lg:translate-x-0 ${rail ? "lg:w-[4.5rem]" : "lg:w-64"} ${
          open ? "translate-x-0" : "-translate-x-full rtl:translate-x-full"
        }`}
      >
        <div className={`flex h-16 items-center justify-between px-5 ${rail ? "lg:justify-center lg:px-0" : ""}`}>
          <span className={rail ? "lg:hidden" : ""}>
            <Brand />
          </span>
          {rail && (
            <Link href="/" className="hidden rounded-lg lg:block" aria-label={t("appName")}>
              <SijillMark size={32} />
            </Link>
          )}
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
        <div className="hidden border-t border-slate-200 p-3 lg:block">
          <button
            type="button"
            onClick={toggleRail}
            aria-label={rail ? t("sidebarExpand") : t("sidebarCollapse")}
            title={rail ? t("sidebarExpand") : t("sidebarCollapse")}
            className={`flex h-9 w-full items-center gap-3 rounded-xl px-3 text-sm text-slate-500 transition-colors hover:bg-slate-900/[0.04] hover:text-slate-900 ${rail ? "justify-center px-0" : ""}`}
          >
            {rail ? (
              <PanelLeftOpen size={18} className="rtl:-scale-x-100" aria-hidden />
            ) : (
              <>
                <PanelLeftClose size={18} className="rtl:-scale-x-100" aria-hidden />
                {t("sidebarCollapse")}
              </>
            )}
          </button>
        </div>
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
        <MaintenanceBanner />
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-slate-200/80 bg-surface/80 px-3 backdrop-blur-xl sm:h-16 sm:gap-3 sm:px-6 lg:px-8">
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
              <CompanySwitcher current={org} orgId={session.orgId} logoVersion={logoVersion} canAdd={!isHolder} />
            ) : (
              <p className="truncate text-sm font-medium text-slate-600">{org}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {session && !isHolder && <SearchPalette role={who?.role} />}
            <ToggleGroup />
            {session ? (
              <ProfileMenu email={who?.email ?? null} role={who?.role ?? null} />
            ) : (
              session === null && (
                <Link href="/login" className="btn h-9">
                  {t("signIn")}
                </Link>
              )
            )}
          </div>
        </header>
        <main
          id="main"
          tabIndex={-1}
          className="page mx-auto w-full max-w-[96rem] flex-1 px-4 py-6 pb-24 outline-none sm:px-6 sm:py-8 lg:px-8 lg:pb-8 2xl:px-12"
        >
          {children}
        </main>
        {session && (
          <nav
            aria-label="Quick"
            className="fixed inset-x-0 bottom-0 z-30 grid grid-flow-col auto-cols-fr border-t border-slate-200 bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
          >
            {quick.map((q) => (
              <Link
                key={q.href}
                href={q.href}
                aria-current={isActive(q.href) ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
                  isActive(q.href) ? "text-emerald-700" : "text-slate-500"
                }`}
              >
                <Icon name={q.icon} size={20} />
                {t(q.key)}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-slate-500"
            >
              <Icon name="menu" size={20} />
              {t("menuOpen")}
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}
