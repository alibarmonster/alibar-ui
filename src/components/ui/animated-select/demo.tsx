"use client";

import { useState } from "react";
import { Circle, CircleCheck, CircleDashed, CircleDot, CircleX } from "lucide-react";
import { AnimatedSelect } from "@/components/ui/animated-select/animated-select";

export function Default() {
  const [framework, setFramework] = useState("next");
  return (
    <div className="w-full max-w-60 space-y-2">
      <label htmlFor="framework" className="text-sm font-medium text-foreground">
        Framework
      </label>
      <AnimatedSelect
        id="framework"
        value={framework}
        onValueChange={setFramework}
        options={[
          { value: "next", label: "Next.js" },
          { value: "remix", label: "Remix" },
          { value: "astro", label: "Astro" },
          { value: "sveltekit", label: "SvelteKit" },
          { value: "nuxt", label: "Nuxt" },
          { value: "gatsby", label: "Gatsby", disabled: true },
        ]}
      />
    </div>
  );
}

const ZONES = [
  ["Asia/Jakarta", "Jakarta", "UTC+7 · WIB"],
  ["Asia/Makassar", "Makassar", "UTC+8 · WITA"],
  ["Asia/Jayapura", "Jayapura", "UTC+9 · WIT"],
  ["Asia/Singapore", "Singapore", "UTC+8"],
  ["Asia/Tokyo", "Tokyo", "UTC+9"],
  ["Asia/Kolkata", "Kolkata", "UTC+5:30"],
  ["Asia/Dubai", "Dubai", "UTC+4"],
  ["Europe/London", "London", "UTC+0"],
  ["Europe/Berlin", "Berlin", "UTC+1"],
  ["America/New_York", "New York", "UTC−5"],
  ["America/Los_Angeles", "Los Angeles", "UTC−8"],
  ["Australia/Sydney", "Sydney", "UTC+10"],
] as const;

export function Searchable() {
  return (
    <div className="w-full max-w-64 space-y-2">
      <label htmlFor="timezone" className="text-sm font-medium text-foreground">
        Time zone
      </label>
      <AnimatedSelect
        id="timezone"
        searchable
        defaultValue="Asia/Jakarta"
        emptyText="No time zones found."
        options={ZONES.map(([value, label, description]) => ({ value, label, description }))}
      />
    </div>
  );
}

export function WithIcons() {
  return (
    <div className="w-full max-w-56 space-y-2">
      <label htmlFor="status" className="text-sm font-medium text-foreground">
        Status
      </label>
      <AnimatedSelect
        id="status"
        defaultValue="progress"
        options={[
          { value: "backlog", label: "Backlog", icon: <CircleDashed /> },
          { value: "todo", label: "Todo", icon: <Circle /> },
          { value: "progress", label: "In progress", icon: <CircleDot className="text-warning" /> },
          { value: "done", label: "Done", icon: <CircleCheck className="text-success" /> },
          { value: "canceled", label: "Canceled", icon: <CircleX /> },
        ]}
      />
    </div>
  );
}
