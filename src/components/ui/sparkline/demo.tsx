"use client";

import { Sparkline } from "@/components/ui/sparkline/sparkline";

const ROWS = [
  { name: "Northwind", ticker: "NWND", price: "$182.40", data: [142, 148, 145, 151, 158, 154, 163, 170, 168, 176, 179, 182] },
  { name: "Aurora Labs", ticker: "AURA", price: "$64.12", data: [81, 79, 80, 76, 74, 75, 71, 69, 70, 66, 65, 64] },
  { name: "Field Notes", ticker: "FNTS", price: "$23.08", data: [22, 23, 22.5, 23.4, 22.8, 23.1, 22.6, 23.3, 22.9, 23.2, 23, 23.08] },
];

export function Default() {
  return (
    <table className="w-full max-w-lg text-sm">
      <caption className="sr-only">Watchlist</caption>
      <thead>
        <tr className="text-left text-xs text-muted-foreground">
          <th scope="col" className="pb-2 font-medium">Company</th>
          <th scope="col" className="pb-2 font-medium">12 weeks</th>
          <th scope="col" className="hidden pb-2 text-right font-medium sm:table-cell">Price</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {ROWS.map((row) => (
          <tr key={row.ticker}>
            <th scope="row" className="py-3 pr-4 text-left font-normal">
              <div className="font-medium text-foreground">{row.name}</div>
              <div className="text-xs text-muted-foreground">{row.ticker}</div>
            </th>
            <td className="py-3 pr-4">
              <Sparkline data={row.data} label={`${row.name}, 12 weeks`} width={104} height={32} showChange formatValue={(v) => `$${v.toFixed(2)}`} />
            </td>
            <td className="hidden py-3 text-right text-foreground tabular-nums sm:table-cell">{row.price}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const DAYS = ["Oct 19", "Oct 20", "Oct 21", "Oct 22", "Oct 23", "Oct 24", "Oct 25", "Oct 26", "Oct 27", "Oct 28", "Oct 29", "Oct 30", "Oct 31", "Nov 1"];
const SIGNUPS = [34, 41, 38, 52, 61, 47, 44, 58, 66, 71, 63, 79, 84, 92];

export function WithLabels() {
  return (
    <div className="w-full max-w-xs rounded-xl border border-border bg-background p-4 shadow-sm">
      <p className="text-sm text-muted-foreground">Daily signups</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">92</p>
      <Sparkline className="mt-3" data={SIGNUPS} labels={DAYS} label="Daily signups, last 14 days" width={250} height={56} />
    </div>
  );
}

export function LowerIsBetter() {
  return (
    <div className="flex flex-col items-start gap-4 text-sm">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
        <span className="w-28 text-muted-foreground">p95 latency</span>
        <Sparkline data={[420, 410, 398, 380, 371, 355, 349, 332, 318, 301]} label="p95 latency" goodDirection="down" showChange formatValue={(v) => `${v} ms`} />
      </div>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
        <span className="w-28 text-muted-foreground">Error rate</span>
        <Sparkline data={[0.8, 0.7, 0.9, 1.1, 1.0, 1.3, 1.2, 1.5, 1.4, 1.7]} label="Error rate" goodDirection="down" showChange formatValue={(v) => `${v}%`} />
      </div>
    </div>
  );
}
