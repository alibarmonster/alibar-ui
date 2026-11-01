"use client";

import { useState } from "react";
import { CreditCard, Timer, Users } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card/stat-card";

const control =
  "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-border bg-background px-3 text-[13px] font-medium text-foreground shadow-xs transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-40";

const WEEKS = ["Aug 10", "Aug 17", "Aug 24", "Aug 31", "Sep 7", "Sep 14", "Sep 21", "Sep 28", "Oct 5", "Oct 12", "Oct 19", "Oct 26", "Nov 2", "Nov 9"];
const REVENUE = [38.2, 39.1, 41.4, 40.2, 43.8, 45.1, 44.6, 47.9, 49.2, 48.1, 51.6, 54.2, 52.8, 57.4].map((v) => v * 1000);
const USERS = [1180, 1210, 1265, 1240, 1302, 1355, 1381, 1420, 1398, 1446, 1480, 1512, 1561, 1604];
const RESPONSE = [42, 39, 41, 37, 36, 38, 33, 31, 32, 29, 30, 27, 28, 24];

export function Default() {
  // Each step moves the 12-week window forward one week.
  const [offset, setOffset] = useState(0);
  const last12 = (series: number[]) => series.slice(offset, offset + 12);
  const now = (series: number[]) => series[offset + 11];
  const before = (series: number[]) => series[offset + 10];
  const labels = WEEKS.slice(offset, offset + 12);
  return (
    <div className="flex w-full max-w-3xl flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Revenue"
          icon={<CreditCard />}
          value={now(REVENUE)}
          previous={before(REVENUE)}
          comparison="vs last week"
          trend={last12(REVENUE)}
          trendLabels={labels}
          formatValue={(v) => `$${(v / 1000).toFixed(1)}K`}
        />
        <StatCard
          label="Active users"
          icon={<Users />}
          value={now(USERS)}
          previous={before(USERS)}
          comparison="vs last week"
          trend={last12(USERS)}
          trendLabels={labels}
        />
        <StatCard
          label="First response"
          icon={<Timer />}
          value={now(RESPONSE)}
          previous={before(RESPONSE)}
          comparison="vs last week"
          goodDirection="down"
          trend={last12(RESPONSE)}
          trendLabels={labels}
          formatValue={(v) => `${Math.round(v)} min`}
        />
      </div>
      <div className="flex items-center gap-3">
        <button type="button" className={control} disabled={offset >= 2} onClick={() => setOffset((o) => Math.min(2, o + 1))}>
          Next week
        </button>
        <button type="button" className={control} disabled={offset === 0} onClick={() => setOffset(0)}>
          Reset
        </button>
        <span className="text-xs text-muted-foreground">Week of {labels[labels.length - 1]}</span>
      </div>
    </div>
  );
}

export function Minimal() {
  return (
    <StatCard className="w-full max-w-60" label="Conversion rate" value={3.8} previous={3.2} comparison="vs September" formatValue={(v) => `${v.toFixed(1)}%`} />
  );
}
