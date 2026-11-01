"use client";

import { useState } from "react";
import { ProximityNav } from "@/components/ui/proximity-nav/proximity-nav";

const WORK = [
  { label: "Aurora Design System", href: "#aurora", meta: "2026" },
  { label: "Northwind Checkout", href: "#northwind", meta: "2025" },
  { label: "Field Notes App", href: "#field-notes", meta: "2025" },
  { label: "Sunset Radio", href: "#sunset", meta: "2024" },
  { label: "Atlas Maps", href: "#atlas", meta: "2023" },
];

export function Default() {
  return (
    <div className="w-full max-w-md">
      <ProximityNav
        aria-label="Selected work"
        items={WORK}
        onNavigate={(_, event) => event.preventDefault()}
      />
    </div>
  );
}

export function Horizontal() {
  const [active, setActive] = useState("#work");
  return (
    <ProximityNav
      orientation="horizontal"
      radius={110}
      maxScale={1.12}
      activeHref={active}
      onNavigate={(href, event) => {
        event.preventDefault();
        setActive(href);
      }}
      items={[
        { label: "Work", href: "#work" },
        { label: "About", href: "#about" },
        { label: "Writing", href: "#writing" },
        { label: "Lab", href: "#lab" },
        { label: "Contact", href: "#contact" },
      ]}
    />
  );
}
