"use client";

import * as Menu from "@radix-ui/react-dropdown-menu";
import { Languages, LogOut, Moon, Sun } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
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
  "inline-flex h-9 min-w-9 items-center justify-center gap-1.5 rounded-full px-2.5 text-[13px] font-medium text-slate-600 transition-[background-color,color,box-shadow] duration-200 hover:bg-surface hover:text-slate-900 hover:shadow-sm aria-pressed:bg-surface aria-pressed:text-emerald-800 aria-pressed:shadow-sm focus-visible:z-10 sm:h-7 sm:min-w-7";
const divider = <span aria-hidden className="h-4 w-px bg-hairline-strong" />;

/** Hijri, language and theme in one pill-shaped control centre; each segment lifts onto a surface when hovered or on. */
export function ToggleGroup() {
  const { t, toggle: toggleLang, hijri, toggleHijri } = useI18n();
  const { theme, toggle } = useTheme();
  return (
    <div
      role="group"
      className="inline-flex items-center gap-0.5 rounded-full border border-hairline bg-slate-100/80 p-0.5 shadow-tile backdrop-blur sm:p-1"
    >
      <button type="button" onClick={toggleHijri} aria-pressed={hijri} title={t("hijriToggle")} className={seg}>
        <span className="hidden sm:inline">{t("hijriShort")}</span>
        <span className="sm:hidden" aria-label={t("hijriToggle")}>
          H
        </span>
      </button>
      {divider}
      <button type="button" onClick={toggleLang} className={seg} aria-label="Toggle language">
        <Languages size={15} aria-hidden />
        <span className="max-sm:sr-only">{t("switchLang")}</span>
      </button>
      {divider}
      <button type="button" onClick={toggle} className={seg} aria-label={t("themeToggle")} title={t("themeToggle")}>
        {/* The icon turns as it swaps; with reduced motion it only fades. */}
        <AnimatePresence mode="wait" initial={false}>
          <m.span
            key={theme}
            className="grid place-items-center"
            initial={{ opacity: 0, rotate: -90, scale: 0.8 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.8 }}
            transition={{ duration: 0.18 }}
          >
            {theme === "dark" ? <Sun size={15} aria-hidden /> : <Moon size={15} aria-hidden />}
          </m.span>
        </AnimatePresence>
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
        className="grid size-9 place-items-center rounded-full ring-1 ring-hairline-strong transition hover:ring-emerald-600/40 data-[state=open]:ring-emerald-600"
        aria-label={t("profileMenu")}
      >
        <Avatar name={email ?? "?"} size={34} />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content
          align="end"
          sideOffset={8}
          className="z-50 w-64 rounded-xl border border-hairline bg-surface p-1.5 shadow-pop animate-rise"
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
