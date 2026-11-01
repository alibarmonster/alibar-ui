"use client";

import { useState } from "react";
import { BookOpen, FileCode2, FileText, FolderKanban, Keyboard, LayoutDashboard, Moon, Plus, Search, Settings, UserPlus } from "lucide-react";
import { CommandPalette, type CommandPaletteItem } from "@/components/ui/command-palette/command-palette";

const trigger =
  "inline-flex h-10 w-64 max-w-full cursor-pointer items-center gap-2 rounded-[10px] border border-border bg-background px-3 text-sm text-muted-foreground shadow-xs transition-colors hover:bg-accent outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function Default() {
  const [ran, setRan] = useState<string | null>(null);
  const run = (label: string) => () => setRan(label);
  const items: CommandPaletteItem[] = [
    { id: "dashboard", group: "Navigation", label: "Go to dashboard", icon: <LayoutDashboard />, shortcut: ["G", "D"], onSelect: run("Go to dashboard") },
    { id: "projects", group: "Navigation", label: "Go to projects", icon: <FolderKanban />, shortcut: ["G", "P"], onSelect: run("Go to projects") },
    { id: "settings", group: "Navigation", label: "Open settings", icon: <Settings />, shortcut: ["⌘", ","], keywords: ["preferences"], onSelect: run("Open settings") },
    { id: "new", group: "Actions", label: "New project", icon: <Plus />, shortcut: ["⌘", "N"], keywords: ["create"], onSelect: run("New project") },
    { id: "invite", group: "Actions", label: "Invite teammate", icon: <UserPlus />, keywords: ["member", "share"], onSelect: run("Invite teammate") },
    { id: "theme", group: "Actions", label: "Toggle dark mode", icon: <Moon />, keywords: ["theme", "appearance"], onSelect: run("Toggle dark mode") },
    { id: "docs", group: "Help", label: "Read the docs", icon: <BookOpen />, onSelect: run("Read the docs") },
    { id: "keys", group: "Help", label: "Keyboard shortcuts", icon: <Keyboard />, shortcut: ["?"], disabled: true },
  ];

  return (
    <div className="flex flex-col items-center gap-3">
      <CommandPalette
        items={items}
        hotkey="j"
        trigger={
          <button type="button" className={trigger}>
            <Search className="size-4" aria-hidden="true" />
            <span className="flex-1 text-left">Search commands…</span>
            <kbd className="rounded-[5px] border border-border px-1.5 font-sans text-[11px]">⌘J</kbd>
          </button>
        }
      />
      <p className="h-5 text-[13px] text-muted-foreground">{ran ? `Ran “${ran}”` : "Press ⌘J or Ctrl+J, or click the field."}</p>
    </div>
  );
}

const FILES = [
  ["button.tsx", "components/ui/button"],
  ["dialog.tsx", "components/ui/dialog"],
  ["use-media-query.ts", "hooks"],
  ["motion.ts", "lib"],
  ["utils.ts", "lib"],
  ["page.tsx", "app/(site)"],
  ["layout.tsx", "app"],
  ["README.md", ""],
  ["CHANGELOG.md", ""],
];

export function Files() {
  return (
    <CommandPalette
      hotkey={false}
      placeholder="Search files…"
      emptyText="No files match."
      items={FILES.map(([name, dir]) => ({
        id: `${dir}/${name}`,
        label: name,
        description: dir || "Project root",
        icon: name.endsWith(".md") ? <FileText /> : <FileCode2 />,
        keywords: [dir],
      }))}
      trigger={
        <button type="button" className={trigger}>
          <Search className="size-4" aria-hidden="true" />
          <span className="flex-1 text-left">Go to file…</span>
        </button>
      }
    />
  );
}
