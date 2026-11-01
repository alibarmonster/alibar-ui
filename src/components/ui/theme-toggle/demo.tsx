"use client";

import { useState } from "react";
import { ThemeToggle, type Theme } from "@/components/ui/theme-toggle/theme-toggle";

const BARS = [38, 52, 44, 70, 58, 84, 66];

export function Default() {
  const [theme, setTheme] = useState<Theme>("light");
  const dark = theme === "dark";

  // A self-contained "app window" that carries its own light and dark styles,
  // so the reveal is visible without changing the whole docs site.
  return (
    <div
      className={
        dark
          ? "w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-950 p-5 text-zinc-100 shadow-xl"
          : "w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-5 text-zinc-900 shadow-xl"
      }
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={dark ? "text-[13px] text-zinc-400" : "text-[13px] text-zinc-500"}>Revenue this week</p>
          <p className="mt-0.5 text-2xl font-semibold tracking-tight tabular-nums">$48,290</p>
        </div>
        <ThemeToggle
          theme={theme}
          onThemeChange={setTheme}
          className={dark ? "text-zinc-300 hover:bg-zinc-800 hover:text-white" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"}
        />
      </div>
      <div className="mt-5 flex h-24 items-end gap-2" aria-hidden="true">
        {BARS.map((h, i) => (
          <span
            key={i}
            className={i === 5 ? "flex-1 rounded-md bg-blue-500" : dark ? "flex-1 rounded-md bg-zinc-800" : "flex-1 rounded-md bg-zinc-100"}
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function IconOnly() {
  const [theme, setTheme] = useState<Theme>("dark");
  return (
    <div className="flex items-center gap-4">
      <ThemeToggle size="sm" reveal={false} theme={theme} onThemeChange={setTheme} />
      <ThemeToggle size="md" reveal={false} theme={theme} onThemeChange={setTheme} />
      <ThemeToggle size="lg" reveal={false} theme={theme} onThemeChange={setTheme} className="border border-border shadow-xs" />
    </div>
  );
}
