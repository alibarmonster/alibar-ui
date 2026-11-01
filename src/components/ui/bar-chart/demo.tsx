"use client";

import { useState } from "react";
import { BarChart } from "@/components/ui/bar-chart/bar-chart";

const control =
  "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-border bg-background px-3 text-[13px] font-medium text-foreground shadow-xs transition-colors hover:bg-accent aria-pressed:bg-accent";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const YEARS: Record<string, number[]> = {
  "2025": [18.2, 21.4, 19.8, 24.6, 27.1, 25.3, 29.8, 31.2, 28.4, 33.9, 36.2, 41.5],
  "2026": [32.1, 35.6, 38.2, 36.9, 42.4, 45.8, 44.1, 49.7, 53.2, 51.6],
};
const usd = (v: number) => `$${v.toFixed(1)}K`;

export function Default() {
  const [year, setYear] = useState("2025");
  return (
    <div className="w-full max-w-xl">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-foreground">Monthly revenue</p>
          <p className="text-xs text-muted-foreground">Thousands of USD</p>
        </div>
        <div className="flex gap-1" role="group" aria-label="Year">
          {Object.keys(YEARS).map((y) => (
            <button key={y} type="button" aria-pressed={year === y} className={control} onClick={() => setYear(y)}>
              {y}
            </button>
          ))}
        </div>
      </div>
      <BarChart
        label={`Monthly revenue, ${year}`}
        data={YEARS[year].map((value, i) => ({ label: MONTHS[i], value }))}
        max={60}
        formatValue={usd}
      />
    </div>
  );
}

const TEAMS = ["Design", "Platform", "Growth", "Mobile", "Data", "Support"];
const ROUNDS = [
  [42, 58, 35, 27, 49, 31],
  [44, 61, 52, 29, 50, 38],
  [61, 63, 55, 41, 52, 39],
  [64, 66, 58, 70, 54, 47],
];

export function Ranked() {
  const [round, setRound] = useState(0);
  return (
    <div className="w-full max-w-md">
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-foreground">Story points shipped · week {round + 1}</p>
        <button type="button" className={control} onClick={() => setRound((r) => (r + 1) % ROUNDS.length)}>
          Next week
        </button>
      </div>
      <BarChart
        label={`Story points shipped, week ${round + 1}`}
        orientation="horizontal"
        sort="descending"
        highlight="Mobile"
        data={TEAMS.map((team, i) => ({ label: team, value: ROUNDS[round][i] }))}
      />
      <p className="mt-3 text-xs text-muted-foreground">Highlighted: your team. Rows glide to their new rank.</p>
    </div>
  );
}

export function Highlight() {
  return (
    <div className="w-full max-w-lg">
      <p className="mb-4 text-sm font-medium text-foreground">Weekly active users · October peaks on the 3rd week</p>
      <BarChart
        label="Weekly active users, October"
        height={180}
        highlight="Week 3"
        data={[
          { label: "Week 1", value: 8420 },
          { label: "Week 2", value: 9130 },
          { label: "Week 3", value: 12860 },
          { label: "Week 4", value: 10240 },
          { label: "Week 5", value: 9710 },
        ]}
      />
    </div>
  );
}
