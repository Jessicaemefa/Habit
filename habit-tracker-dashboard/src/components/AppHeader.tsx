"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

export function AppHeader() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  const linkCls = (active: boolean) =>
    `flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
      active
        ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
        : "text-slate-600 hover:bg-slate-200/80 hover:text-slate-900 dark:text-[#888] dark:hover:bg-white/6 dark:hover:text-white"
    }`;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-[var(--page-bg)]/95 shadow-sm backdrop-blur-xl dark:border-white/10 dark:shadow-none">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-3">
        <nav
          className="flex gap-1 rounded-2xl border border-slate-200/80 bg-white/60 p-1 dark:border-white/8 dark:bg-[#111]/60"
          aria-label="Main navigation"
        >
          <Link href="/" className={linkCls(pathname === "/")}>
            Today
          </Link>
          <Link href="/history" className={linkCls(pathname === "/history")}>
            History
          </Link>
        </nav>

        <button
          type="button"
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-white/60 transition hover:bg-slate-100 dark:border-white/8 dark:bg-[#111]/60 dark:hover:bg-white/8"
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4 text-[#888] hover:text-white" strokeWidth={2} />
          ) : (
            <Moon className="h-4 w-4 text-slate-600" strokeWidth={2} />
          )}
        </button>
      </div>
    </header>
  );
}
