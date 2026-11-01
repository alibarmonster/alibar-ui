"use client";

import { useState } from "react";
import { NumberTicker } from "@/components/ui/number-ticker/number-ticker";

const control =
  "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-border bg-background px-3 text-[13px] font-medium text-foreground shadow-xs transition-colors hover:bg-accent";

const STATS = [
  { label: "Developers", value: 12480, suffix: "+" },
  { label: "Uptime", value: 99.98, suffix: "%" },
  { label: "Paid out", value: 1284000, format: { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 } as const },
];

export function Default() {
  return (
    <dl className="grid w-full max-w-xl grid-cols-1 gap-6 text-center sm:grid-cols-3">
      {STATS.map((stat, i) => (
        <div key={stat.label}>
          <dt className="text-sm text-muted-foreground">{stat.label}</dt>
          <dd className="mt-1 text-4xl font-semibold tracking-tight text-foreground">
            <NumberTicker value={stat.value} suffix={stat.suffix} format={stat.format} delay={i * 0.12} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function Live() {
  const [total, setTotal] = useState(48210);
  return (
    <div className="flex flex-col items-center gap-5">
      <p className="text-center">
        <span className="block text-sm text-muted-foreground">Orders today</span>
        <NumberTicker value={total} trigger="mount" duration={0.9} className="text-5xl font-semibold tracking-tight text-foreground" />
      </p>
      <div className="flex gap-2">
        <button type="button" className={control} onClick={() => setTotal((t) => t + 1250)}>
          +1,250
        </button>
        <button type="button" className={control} onClick={() => setTotal(Math.round(20000 + Math.random() * 60000))}>
          Random
        </button>
      </div>
    </div>
  );
}

export function Inline() {
  return (
    <p className="max-w-md text-center text-lg leading-relaxed text-muted-foreground">
      Teams shipped <NumberTicker value={3912} className="font-semibold text-foreground" /> releases last quarter, cutting
      review time by <NumberTicker value={41.5} suffix="%" className="font-semibold text-foreground" />.
    </p>
  );
}
