"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { ProgressRing } from "@/components/ui/progress-ring/progress-ring";

const control =
  "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-border bg-background px-3 text-[13px] font-medium text-foreground shadow-xs transition-colors hover:bg-accent";

export function Default() {
  const [value, setValue] = useState(68);
  return (
    <div className="flex flex-col items-center gap-5">
      <ProgressRing value={value} label="Profile completion" caption="complete" size={140} thickness={12} />
      <div className="flex gap-2">
        <button type="button" className={control} onClick={() => setValue((v) => Math.max(0, v - 15))}>
          −15
        </button>
        <button type="button" className={control} onClick={() => setValue((v) => Math.min(100, v + 15))}>
          +15
        </button>
      </div>
    </div>
  );
}

// The fill carries severity: accent while healthy, warning near the limit, danger when nearly full.
const severity = (used: number, total: number) =>
  used / total >= 0.9 ? "var(--destructive)" : used / total >= 0.75 ? "var(--warning)" : "var(--primary)";

export function StorageMeters() {
  const disks = [
    { name: "Photos", used: 58, total: 128 },
    { name: "Backups", used: 101, total: 128 },
    { name: "Archive", used: 121, total: 128 },
  ];
  return (
    <ul className="flex flex-wrap justify-center gap-8">
      {disks.map((disk) => (
        <li key={disk.name} className="flex flex-col items-center gap-2">
          <ProgressRing
            value={disk.used}
            max={disk.total}
            label={`${disk.name} storage`}
            color={severity(disk.used, disk.total)}
            formatValue={(v) => `${Math.round(v)} GB`}
            caption={`of ${disk.total} GB`}
            size={104}
            thickness={9}
          />
          <span className="text-sm text-muted-foreground">{disk.name}</span>
        </li>
      ))}
    </ul>
  );
}

const TASKS = [
  { title: "Brand refresh", done: 12, total: 12 },
  { title: "Checkout redesign", done: 7, total: 11 },
  { title: "Onboarding emails", done: 2, total: 9 },
];

export function Inline() {
  return (
    <ul className="w-full max-w-sm divide-y divide-border rounded-xl border border-border bg-background shadow-sm">
      {TASKS.map((task) => (
        <li key={task.title} className="flex items-center gap-3 px-4 py-3">
          {task.done === task.total ? (
            <span className="flex size-5 items-center justify-center rounded-full bg-success text-white" aria-label={`${task.title}: complete`} role="img">
              <Check className="size-3" strokeWidth={3} aria-hidden="true" />
            </span>
          ) : (
            <ProgressRing value={task.done} max={task.total} label={`${task.title} progress`} size={20} thickness={3} showValue={false} />
          )}
          <span className="flex-1 text-sm text-foreground">{task.title}</span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {task.done}/{task.total}
          </span>
        </li>
      ))}
    </ul>
  );
}
