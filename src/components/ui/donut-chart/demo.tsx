"use client";

import { useState } from "react";
import { DonutChart } from "@/components/ui/donut-chart/donut-chart";

const control =
  "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-border bg-background px-3 text-[13px] font-medium text-foreground shadow-xs transition-colors hover:bg-accent aria-pressed:bg-accent";

export function Default() {
  return (
    <DonutChart
      label="Traffic sources, October"
      centerLabel="Visits"
      data={[
        { label: "Organic search", value: 18420 },
        { label: "Direct", value: 9310 },
        { label: "Referral", value: 6240 },
        { label: "Social", value: 3980 },
        { label: "Email", value: 2160 },
      ]}
    />
  );
}

const QUARTERS = {
  Q1: [42, 28, 18, 12],
  Q2: [31, 35, 22, 12],
  Q3: [24, 38, 21, 17],
};
const PLANS = ["Starter", "Team", "Business", "Enterprise"];

export function Updating() {
  const [quarter, setQuarter] = useState<keyof typeof QUARTERS>("Q1");
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex gap-1" role="group" aria-label="Quarter">
        {(Object.keys(QUARTERS) as (keyof typeof QUARTERS)[]).map((q) => (
          <button key={q} type="button" aria-pressed={quarter === q} className={control} onClick={() => setQuarter(q)}>
            {q}
          </button>
        ))}
      </div>
      <DonutChart
        label={`New subscriptions by plan, ${quarter}`}
        centerLabel="Signups"
        size={180}
        data={PLANS.map((plan, i) => ({ label: plan, value: QUARTERS[quarter][i] * 10 }))}
      />
    </div>
  );
}

export function FoldedTail() {
  return (
    <div className="flex flex-col items-center gap-3">
      <DonutChart
        label="Browser share"
        centerLabel="Sessions"
        size={180}
        thickness={20}
        data={[
          { label: "Chrome", value: 6420 },
          { label: "Safari", value: 2890 },
          { label: "Edge", value: 820 },
          { label: "Firefox", value: 610 },
          { label: "Samsung Internet", value: 240 },
          { label: "Opera", value: 130 },
          { label: "Arc", value: 90 },
        ]}
      />
      <p className="text-xs text-muted-foreground">Seven browsers; the three smallest fold into “Other”.</p>
    </div>
  );
}
