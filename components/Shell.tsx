"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { clearSession } from "@/lib/api";
import { useI18n, type Key } from "@/lib/i18n";
import { useSession } from "./useSession";

const NAV: { href: string; key: Key }[] = [
  { href: "/", key: "navCapTable" },
  { href: "/ownership", key: "navOwnership" },
  { href: "/ubo", key: "navUbo" },
  { href: "/waterfall", key: "navWaterfall" },
  { href: "/resolutions", key: "navResolutions" },
  { href: "/certificates", key: "navCertificates" },
  { href: "/audit", key: "navAudit" },
  { href: "/setup", key: "navSetup" },
  { href: "/members", key: "navMembers" },
  { href: "/security", key: "navSecurity" },
];

export function Shell({ children }: { children: ReactNode }) {
  const { t, toggle } = useI18n();
  const path = usePathname();
  const session = useSession();

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <span className="text-lg font-semibold text-emerald-800">{t("appName")}</span>
          <nav className="flex flex-1 flex-wrap gap-1 text-sm">
            {NAV.map((n) => {
              const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`rounded-md px-3 py-1.5 ${active ? "bg-emerald-50 font-medium text-emerald-800" : "text-slate-600 hover:bg-slate-100"}`}
                >
                  {t(n.key)}
                </Link>
              );
            })}
          </nav>
          {session ? (
            <button type="button" className="btn-ghost" onClick={() => { clearSession(); window.location.assign("/login"); }}>
              {t("signOut")}
            </button>
          ) : (
            session === null && <Link href="/login" className="btn-ghost">{t("signIn")}</Link>
          )}
          <button type="button" onClick={toggle} className="btn-ghost" aria-label="Toggle language">
            {t("switchLang")}
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
