"use client";

import { useState } from "react";
import { AreaChart } from "@/components/ui/area-chart/area-chart";

const control =
  "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-border bg-background px-3 text-[13px] font-medium text-foreground shadow-xs transition-colors hover:bg-accent aria-pressed:bg-accent";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const TRAFFIC = {
  "This year": {
    desktop: [4200, 4630, 5120, 4980, 5610, 6020, 5840, 6410, 6930, 7280, 7650, 8120],
    mobile: [3100, 3480, 3920, 4410, 4880, 5530, 6120, 6680, 7310, 7920, 8540, 9260],
  },
  "Last year": {
    desktop: [3600, 3820, 4110, 4050, 4380, 4620, 4510, 4790, 5020, 5210, 5480, 5730],
    mobile: [1900, 2140, 2380, 2610, 2900, 3150, 3390, 3620, 3870, 4120, 4380, 4650],
  },
};

export function Default() {
  const [range, setRange] = useState<keyof typeof TRAFFIC>("This year");
  const data = TRAFFIC[range];
  return (
    <div className="w-full max-w-2xl">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-foreground">Visitors by device</p>
        <div className="flex gap-1" role="group" aria-label="Range">
          {(Object.keys(TRAFFIC) as (keyof typeof TRAFFIC)[]).map((key) => (
            <button key={key} type="button" aria-pressed={range === key} className={control} onClick={() => setRange(key)}>
              {key}
            </button>
          ))}
        </div>
      </div>
      <AreaChart
        label={`Visitors by device, ${range.toLowerCase()}`}
        labels={MONTHS}
        series={[
          { id: "desktop", label: "Desktop", values: data.desktop },
          { id: "mobile", label: "Mobile", values: data.mobile },
        ]}
      />
    </div>
  );
}

const DAYS = Array.from({ length: 30 }, (_, i) => `Oct ${i + 1}`);
// Deterministic, gently rising daily revenue.
const REVENUE = DAYS.map((_, i) => Math.round(1800 + i * 42 + Math.sin(i * 0.9) * 260 + Math.cos(i * 2.3) * 120));

export function SingleSeries() {
  return (
    <div className="w-full max-w-2xl">
      <p className="text-sm text-muted-foreground">Revenue, October</p>
      <p className="mb-4 text-3xl font-semibold tracking-tight text-foreground">$82,410</p>
      <AreaChart
        label="Daily revenue, October"
        labels={DAYS}
        series={[{ id: "revenue", label: "Revenue", values: REVENUE }]}
        height={200}
        formatValue={(v) => `$${v.toLocaleString("en-US")}`}
      />
    </div>
  );
}
