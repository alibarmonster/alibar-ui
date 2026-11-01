"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { BarChart3, FolderKanban, Home, Inbox, Settings, Users } from "lucide-react";
import { CollapsibleSidebar } from "@/components/ui/collapsible-sidebar/collapsible-sidebar";

const SECTIONS = [
  {
    items: [
      { id: "home", label: "Home", icon: <Home /> },
      { id: "inbox", label: "Inbox", icon: <Inbox />, badge: 12 },
      { id: "projects", label: "Projects", icon: <FolderKanban /> },
    ],
  },
  {
    title: "Workspace",
    items: [
      { id: "analytics", label: "Analytics", icon: <BarChart3 /> },
      { id: "members", label: "Members", icon: <Users /> },
      { id: "settings", label: "Settings", icon: <Settings /> },
    ],
  },
];

const LAYOUT = { type: "spring", stiffness: 380, damping: 38 } as const;

function AppFrame({ defaultCollapsed = false }: { defaultCollapsed?: boolean }) {
  const [active, setActive] = useState("inbox");
  const current = SECTIONS.flatMap((s) => s.items).find((i) => i.id === active);
  return (
    <div className="flex h-[25rem] w-full max-w-2xl overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      <CollapsibleSidebar
        sections={SECTIONS}
        defaultCollapsed={defaultCollapsed}
        activeId={active}
        onSelect={(id) => setActive(id)}
        brand={{
          name: "Northwind",
          icon: <span className="size-7 rounded-lg bg-gradient-to-br from-sky-400 to-blue-600" />,
        }}
      />
      {/* The main area layout-animates too, so it glides instead of jumping as the sidebar resizes. */}
      <motion.div layout transition={LAYOUT} className="@container min-w-0 flex-1 p-3 sm:p-5">
        <motion.div layout="position" transition={LAYOUT}>
          <p className="truncate text-lg font-semibold tracking-tight text-foreground">{current?.label}</p>
          {/* Container queries: on a phone the expanded sidebar leaves only a sliver, so content steps down. */}
          <p className="mt-1 hidden text-sm text-muted-foreground @[12rem]:block">Collapse the sidebar with the button at the bottom.</p>
          <div className="mt-5 hidden grid-cols-1 gap-3 @[9rem]:grid @[18rem]:grid-cols-2" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-lg border border-border bg-background" />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export function Default() {
  return <AppFrame />;
}

export function StartCollapsed() {
  return <AppFrame defaultCollapsed />;
}
