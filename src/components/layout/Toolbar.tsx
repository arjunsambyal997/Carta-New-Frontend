"use client";

import * as Menu from "@radix-ui/react-dropdown-menu";
import { Languages, LogOut, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { signOut } from "@/api";
import { Avatar } from "@/components/common/Avatar";
import { useI18n, type Key } from "@/context/I18nContext";

const THEME_KEY = "equigcc.theme";

export function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  }, []);
  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* storage unavailable */
    }
    setTheme(next);
  };
  return { theme, toggle };
}

const seg =
  "inline-flex h-9 min-w-9 items-center justify-center gap-1.5 px-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 aria-pressed:bg-emerald-50 aria-pressed:text-emerald-800 focus-visible:z-10";

/** Hijri, language and theme as one segmented control group. */
export function ToggleGroup() {
  const { t, toggle: toggleLang, hijri, toggleHijri } = useI18n();
  const { theme, toggle } = useTheme();
  return (
    <div
      role="group"
      className="inline-flex divide-x divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-surface shadow-sm rtl:divide-x-reverse"
    >
      <button type="button" onClick={toggleHijri} aria-pressed={hijri} title={t("hijriToggle")} className={seg}>
        <span className="hidden sm:inline">{t("hijriShort")}</span>
        <span className="sm:hidden" aria-label={t("hijriToggle")}>
          H
        </span>
      </button>
      <button type="button" onClick={toggleLang} className={seg} aria-label="Toggle language">
        <Languages size={16} aria-hidden />
        <span className="max-sm:sr-only">{t("switchLang")}</span>
      </button>
      <button type="button" onClick={toggle} className={seg} aria-label={t("themeToggle")} title={t("themeToggle")}>
        {theme === "dark" ? <Sun size={16} aria-hidden /> : <Moon size={16} aria-hidden />}
      </button>
    </div>
  );
}

/** Avatar button that opens who is signed in, their role and sign out. */
export function ProfileMenu({ email, role }: { email: string | null; role: string | null }) {
  const { t } = useI18n();
  return (
    <Menu.Root>
      <Menu.Trigger
        className="grid size-9 place-items-center rounded-full ring-1 ring-slate-200 transition hover:ring-emerald-600/40 data-[state=open]:ring-emerald-600"
        aria-label={t("profileMenu")}
      >
        <Avatar name={email ?? "?"} size={34} />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content
          align="end"
          sideOffset={8}
          className="z-50 w-64 rounded-xl border border-slate-200 bg-surface p-1.5 shadow-pop animate-rise"
        >
          {email && (
            <div className="px-2.5 pb-2 pt-1.5">
              <p className="truncate text-sm font-medium text-slate-900" dir="ltr">
                {email}
              </p>
              {role && <p className="text-xs text-slate-500">{t(`role${role}` as Key)}</p>}
            </div>
          )}
          <Menu.Separator className="my-1 h-px bg-slate-200" />
          <Menu.Item
            className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-slate-700 outline-none data-[highlighted]:bg-slate-100"
            onSelect={async () => {
              await signOut();
              window.location.assign("/login");
            }}
          >
            <LogOut size={16} aria-hidden />
            {t("signOut")}
          </Menu.Item>
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  );
}
