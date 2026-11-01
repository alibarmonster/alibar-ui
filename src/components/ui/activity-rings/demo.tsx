"use client";

import { useState } from "react";
import { ActivityRings } from "@/components/ui/activity-rings/activity-rings";

const control =
  "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-border bg-background px-3 text-[13px] font-medium text-foreground shadow-xs transition-colors hover:bg-accent";

export function Default() {
  const [steps, setSteps] = useState(8240);
  return (
    <div className="flex flex-col items-center gap-6">
      <ActivityRings
        label="Today's goals"
        rings={[
          { label: "Steps", value: steps, goal: 10000 },
          { label: "Active", value: 46, goal: 30, unit: "min" },
          { label: "Water", value: 5, goal: 8, unit: "glasses" },
        ]}
      />
      <button type="button" className={control} onClick={() => setSteps((s) => s + 1200)}>
        Walk 1,200 steps
      </button>
    </div>
  );
}

const WEEK = [
  { day: "Mon", rings: [0.92, 1.1, 0.75] },
  { day: "Tue", rings: [0.64, 0.5, 0.88] },
  { day: "Wed", rings: [1.05, 1.32, 1] },
  { day: "Thu", rings: [0.48, 0.3, 0.62] },
  { day: "Fri", rings: [0.81, 0.95, 0.9] },
  { day: "Sat", rings: [1.18, 1.6, 0.7] },
  { day: "Sun", rings: [0.35, 0.2, 0.5] },
];
const NAMES = ["Steps", "Active", "Water"];

export function Week() {
  return (
    <ul className="grid grid-cols-4 gap-x-5 gap-y-4 sm:grid-cols-7">
      {WEEK.map((d) => (
        <li key={d.day} className="flex flex-col items-center gap-1.5">
          <ActivityRings
            label={`${d.day}: ${d.rings.map((r, i) => `${NAMES[i]} ${Math.round(r * 100)}%`).join(", ")}`}
            legend={false}
            size={44}
            thickness={5}
            gap={1.5}
            rings={d.rings.map((r, i) => ({ label: NAMES[i], value: r * 100, goal: 100 }))}
          />
          <span className="text-xs text-muted-foreground">{d.day}</span>
        </li>
      ))}
    </ul>
  );
}
