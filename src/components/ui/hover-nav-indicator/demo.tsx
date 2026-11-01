"use client";

import { useState } from "react";
import { BarChart3, FolderKanban, Home, Inbox, Settings } from "lucide-react";
import { HoverNavIndicator } from "@/components/ui/hover-nav-indicator/hover-nav-indicator";

const LINKS = [
  { label: "Product", href: "#product" },
  { label: "Pricing", href: "#pricing" },
  { label: "Customers", href: "#customers" },
  { label: "Changelog", href: "#changelog" },
  { label: "Docs", href: "#docs" },
];

export function Default() {
  const [active, setActive] = useState("#pricing");
  return (
    <div className="rounded-xl border border-border bg-background p-1.5 shadow-sm">
      <HoverNavIndicator
        aria-label="Product sections"
        items={LINKS}
        activeHref={active}
        onNavigate={(href, event) => {
          event.preventDefault();
          setActive(href);
        }}
      />
    </div>
  );
}

export function Underline() {
  const [active, setActive] = useState("#product");
  return (
    <HoverNavIndicator
      aria-label="Product sections"
      variant="underline"
      items={LINKS.slice(0, 4)}
      activeHref={active}
      onNavigate={(href, event) => {
        event.preventDefault();
        setActive(href);
      }}
    />
  );
}

export function Vertical() {
  const [active, setActive] = useState("#inbox");
  return (
    <div className="w-56 rounded-xl border border-border bg-background p-2 shadow-sm">
      <HoverNavIndicator
        orientation="vertical"
        aria-label="Workspace"
        activeHref={active}
        onNavigate={(href, event) => {
          event.preventDefault();
          setActive(href);
        }}
        items={[
          { label: "Home", href: "#home", icon: <Home /> },
          { label: "Inbox", href: "#inbox", icon: <Inbox /> },
          { label: "Projects", href: "#projects", icon: <FolderKanban /> },
          { label: "Analytics", href: "#analytics", icon: <BarChart3 /> },
          { label: "Settings", href: "#settings", icon: <Settings /> },
        ]}
      />
    </div>
  );
}
