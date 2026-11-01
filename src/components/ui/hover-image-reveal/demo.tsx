"use client";

import { useId } from "react";
import { HoverImageReveal } from "@/components/ui/hover-image-reveal/hover-image-reveal";

/** A simple original illustration: sky gradient, sun and two ridges. */
function Art({ sky, ridges, sun }: { sky: [string, string]; ridges: [string, string]; sun: string }) {
  const gradient = useId();
  return (
    <svg viewBox="0 0 220 280" preserveAspectRatio="xMidYMid slice" className="size-full" aria-hidden="true">
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sky[0]} />
          <stop offset="1" stopColor={sky[1]} />
        </linearGradient>
      </defs>
      <rect width="220" height="280" fill={`url(#${gradient})`} />
      <circle cx="150" cy="92" r="26" fill={sun} />
      <path d="M0 190 L40 160 L80 178 L120 140 L170 172 L220 150 L220 280 L0 280Z" fill={ridges[0]} />
      <path d="M0 230 L50 205 L100 222 L150 196 L220 216 L220 280 L0 280Z" fill={ridges[1]} />
    </svg>
  );
}

const WORK = [
  { id: "aurora", title: "Aurora Design System", meta: "2026", sky: ["#cfe8ff", "#eef6ff"], ridges: ["#8fb3e8", "#4f74b5"], sun: "#ffffff" },
  { id: "northwind", title: "Northwind Checkout", meta: "2025", sky: ["#fde4cf", "#fff4ea"], ridges: ["#e8a598", "#b56b6b"], sun: "#fff7ed" },
  { id: "fieldnote", title: "Field Notes App", meta: "2025", sky: ["#e0f2e9", "#f6fcf9"], ridges: ["#8fcab0", "#3f8f74"], sun: "#fffde8" },
  { id: "sunset", title: "Sunset Radio", meta: "2024", sky: ["#3b2a63", "#7a5aa6"], ridges: ["#4b3a73", "#241a45"], sun: "#ffd6a5" },
] as const;

export function Default() {
  return (
    <div className="w-full max-w-xl">
      <HoverImageReveal
        items={WORK.map((w) => ({
          id: w.id,
          title: w.title,
          meta: w.meta,
          href: `#${w.id}`,
          image: <Art sky={[...w.sky]} ridges={[...w.ridges]} sun={w.sun} />,
        }))}
        onNavigate={(_, event) => event.preventDefault()}
      />
    </div>
  );
}
