"use client";

import { ContributionHeatmap, type HeatmapDay } from "@/components/ui/contribution-heatmap/contribution-heatmap";

/** A year of deterministic activity: quieter weekends, busier mid-weeks, a few streaks and a holiday gap. */
function sampleYear(end: string): HeatmapDay[] {
  const days: HeatmapDay[] = [];
  const last = Date.UTC(Number(end.slice(0, 4)), Number(end.slice(5, 7)) - 1, Number(end.slice(8, 10)));
  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = 364; i >= 0; i--) {
    const t = last - i * 86_400_000;
    const dow = new Date(t).getUTCDay();
    const weekend = dow === 0 || dow === 6;
    const holiday = i > 300 && i < 312;
    const burst = Math.sin(i / 9) > 0.6 ? 3 : 0;
    const count = holiday ? 0 : Math.max(0, Math.round((weekend ? 1.2 : 4.5) * rand() * 2 + burst - (rand() < 0.22 ? 6 : 0)));
    days.push({ date: new Date(t).toISOString().slice(0, 10), count });
  }
  return days;
}

const DATA = sampleYear("2026-11-01");

export function Default() {
  return (
    <div className="w-full max-w-xl">
      <ContributionHeatmap data={DATA} endDate="2026-11-01" />
    </div>
  );
}

export function FullYear() {
  return (
    <div className="w-full max-w-3xl">
      <ContributionHeatmap
        data={DATA}
        endDate="2026-11-01"
        weeks={53}
        weekStart={1}
        cellSize={10}
        label="Deploys"
        unit={["deploy", "deploys"]}
      />
    </div>
  );
}
